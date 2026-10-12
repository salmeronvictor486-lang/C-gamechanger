// Parser + comprobación de tipos en una sola pasada (como los compiladores de C de
// verdad: C obliga a declarar antes de usar). Produce el árbol con tipos de `ast.ts`.
import type {
  ArithOpName,
  CmpOpName,
  EnumSym,
  Expr,
  FuncSym,
  Init,
  InitItem,
  Pos,
  Program,
  Stmt,
  StringLit,
  Sym,
  TypedefSym,
  VarSym,
} from './ast';
import { closest, CompileError, type Diagnostic } from './diagnostics';
import { FUNCTION_HEADER } from './headers';
import type { Token } from './lexer';
import { arith, compare, convert, DivZero, NULLPTR, type Ptr, type Value, wrapInt } from './ops';
import { preprocess, type PTok } from './preprocessor';
import {
  alignOf,
  arrayOf,
  commonType,
  hasVla,
  intType,
  isArith,
  isCharLike,
  isInt,
  isScalar,
  layoutStruct,
  promote,
  ptrTo,
  sameType,
  sizeOf,
  T,
  typeName,
  unqual,
  withConst,
  type CType,
  type IntName,
  type StructInfo,
} from './types';

export type CompileResult =
  | { ok: true; program: Program; warnings: Diagnostic[] }
  | { ok: false; error: Diagnostic; warnings: Diagnostic[] };

export function compile(src: string): CompileResult {
  const warnings: Diagnostic[] = [];
  try {
    const pre = preprocess(src, warnings);
    const p = new Parser(pre.tokens, warnings, pre.includes, src);
    const program = p.parseProgram();
    return { ok: true, program, warnings: dedupe(warnings) };
  } catch (e) {
    if (e instanceof CompileError) return { ok: false, error: e.diag, warnings: dedupe(warnings) };
    throw e;
  }
}

function dedupe(ws: Diagnostic[]): Diagnostic[] {
  const seen = new Set<string>();
  const out: Diagnostic[] = [];
  for (const w of ws) {
    const k = `${w.line}:${w.message}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(w);
  }
  return out.sort((a, b) => a.line - b.line);
}

const TYPE_WORDS = new Set([
  'void',
  'char',
  'short',
  'int',
  'long',
  'float',
  'double',
  'signed',
  'unsigned',
  '_Bool',
  'bool',
  'struct',
  'union',
  'enum',
]);
const QUALIFIERS = new Set(['const', 'volatile', 'restrict', '__restrict', 'inline', '__inline']);
const STORAGE = new Set(['typedef', 'extern', 'static', 'auto', 'register']);
const KEYWORDS = new Set([
  ...TYPE_WORDS,
  ...QUALIFIERS,
  ...STORAGE,
  'break',
  'case',
  'continue',
  'default',
  'do',
  'else',
  'for',
  'goto',
  'if',
  'return',
  'sizeof',
  'switch',
  'while',
  'true',
  'false',
]);

const TYPE_TYPOS: Record<string, string> = {
  string: 'En C no existe el tipo string: un texto es un array de char, por ejemplo char nombre[50];',
  String: 'En C no existe el tipo String: un texto es un array de char, por ejemplo char nombre[50];',
  boolean: 'En C el tipo lógico se llama bool (con #include <stdbool.h>) o se usa int.',
  Int: 'En C los tipos se escriben en minúscula: int',
  INT: 'En C los tipos se escriben en minúscula: int',
  Float: 'En C los tipos se escriben en minúscula: float',
  Double: 'En C los tipos se escriben en minúscula: double',
  Char: 'En C los tipos se escriben en minúscula: char',
  integer: 'El tipo de los enteros en C se llama int.',
  entero: 'Los tipos de C van en inglés: el entero es int.',
  real: 'Los tipos de C van en inglés: para decimales usa float o double.',
  caracter: 'Los tipos de C van en inglés: para un carácter usa char.',
  cadena: 'En C un texto es un array de char: char cadena[50];',
  var: 'En C hay que decir el tipo de la variable: int, float, char…',
  let: 'En C hay que decir el tipo de la variable: int, float, char…',
  auto: 'Escribe el tipo concreto: int, float, char…',
};

const CPP_NAMES: Record<string, string> = {
  cout: 'cout es de C++. En C se escribe en pantalla con printf("texto");',
  cin: 'cin es de C++. En C se lee del teclado con scanf("%d", &variable);',
  endl: 'endl es de C++. En C el salto de línea es \\n dentro del printf.',
  std: 'std es de C++. En C no hace falta.',
  new: 'new es de C++. En C se pide memoria con malloc (de <stdlib.h>).',
  delete: 'delete es de C++. En C la memoria se libera con free.',
  nullptr: 'En C se usa NULL.',
  string: 'En C un texto es un array de char: char nombre[50];',
  print: 'En C se escribe en pantalla con printf.',
  println: 'En C se escribe en pantalla con printf("texto\\n");',
  input: 'En C se lee del teclado con scanf.',
  Printf: 'Las funciones de C distinguen mayúsculas: se escribe printf, en minúscula.',
  PRINTF: 'Las funciones de C distinguen mayúsculas: se escribe printf, en minúscula.',
  Scanf: 'Las funciones de C distinguen mayúsculas: se escribe scanf, en minúscula.',
  Main: 'La función principal se llama main, en minúscula.',
  scan: '¿Querías escribir scanf?',
  print_f: '¿Querías escribir printf?',
  printF: 'Las funciones de C distinguen mayúsculas: se escribe printf.',
  scanF: 'Las funciones de C distinguen mayúsculas: se escribe scanf.',
  length: 'Para saber la longitud de una cadena usa strlen(cadena) de <string.h>.',
  len: 'Para saber la longitud de una cadena usa strlen(cadena) de <string.h>.',
  True: 'En C se escribe true en minúscula (con #include <stdbool.h>) o 1.',
  False: 'En C se escribe false en minúscula (con #include <stdbool.h>) o 0.',
  TRUE: 'En C se escribe true en minúscula (con #include <stdbool.h>) o 1.',
  FALSE: 'En C se escribe false en minúscula (con #include <stdbool.h>) o 0.',
};

class Scope {
  syms = new Map<string, Sym>();
  tags = new Map<string, StructInfo>();
  constructor(readonly parent: Scope | null) {}
  find(name: string): Sym | undefined {
    for (let s: Scope | null = this; s; s = s.parent) {
      const r = s.syms.get(name);
      if (r) return r;
    }
    return undefined;
  }
  findTag(name: string): StructInfo | undefined {
    for (let s: Scope | null = this; s; s = s.parent) {
      const r = s.tags.get(name);
      if (r) return r;
    }
    return undefined;
  }
  allNames(): string[] {
    const out: string[] = [];
    for (let s: Scope | null = this; s; s = s.parent) out.push(...s.syms.keys());
    return out;
  }
}

interface DeclSpec {
  type: CType;
  storage: 'typedef' | 'extern' | 'static' | null;
  pos: Pos;
  /** Se definió un struct/enum en esta declaración (puede ir sin variable). */
  definedTag: boolean;
}

interface ParamInfo {
  sym: VarSym | null;
  name: string | null;
  type: CType;
  pos: Pos;
}

interface Declarator {
  name: string | null;
  type: CType;
  pos: Pos;
  /** Parámetros del declarador de función más externo (para las definiciones). */
  params?: ParamInfo[];
  paramScope?: Scope;
  paramVla?: { slot: number; x: Expr }[];
}

type InitTree =
  | { k: 'expr'; x: Expr; pos: Pos }
  | { k: 'list'; items: { desig: Desig[]; init: InitTree }[]; pos: Pos };

type Desig = { k: 'index'; i: number } | { k: 'field'; name: string; pos: Pos };

interface SwitchCtx {
  list: Stmt[];
  cases: Map<number | bigint, number>;
  def: number;
  type: CType;
}

const PLACEHOLDER: CType = { k: 'void' };

const BIN_PREC: Record<string, number> = {
  '||': 1,
  '&&': 2,
  '|': 3,
  '^': 4,
  '&': 5,
  '==': 6,
  '!=': 6,
  '<': 7,
  '>': 7,
  '<=': 7,
  '>=': 7,
  '<<': 8,
  '>>': 8,
  '+': 9,
  '-': 9,
  '*': 10,
  '/': 10,
  '%': 10,
};

const ASSIGN_OPS = new Set(['=', '+=', '-=', '*=', '/=', '%=', '<<=', '>>=', '&=', '|=', '^=']);

class Parser {
  private p = 0;
  private global = new Scope(null);
  private scope = this.global;
  private fn: FuncSym | null = null;
  private strings: StringLit[] = [];
  private stringIds = new Map<string, number>();
  private globals: VarSym[] = [];
  private funcs: FuncSym[] = [];
  private structs: StructInfo[] = [];
  private nextId = 1;
  private loops = 0;
  private switches: SwitchCtx[] = [];
  private breakable = 0;
  private curList: Stmt[] | null = null;
  private vlaDims: { slot: number; x: Expr }[] | null = null;
  private paramVlaCounter: { n: number } | null = null;
  private intDiv = new WeakSet<Expr>();
  private inGlobalInit = false;
  private srcLines: string[];

  constructor(
    private toks: PTok[],
    private warnings: Diagnostic[],
    private includes: Set<string>,
    src: string,
  ) {
    this.srcLines = src.split('\n');
  }

  // ───────────────────────── tokens ─────────────────────────

  private peek(k = 0): PTok {
    return this.toks[Math.min(this.p + k, this.toks.length - 1)];
  }
  private next(): PTok {
    const t = this.toks[this.p];
    if (this.p < this.toks.length - 1) this.p++;
    return t;
  }
  private prev(): PTok {
    return this.toks[Math.max(0, this.p - 1)];
  }
  private is(v: string, k = 0): boolean {
    const t = this.peek(k);
    return (t.t === 'p' || t.t === 'id') && t.v === v;
  }
  private accept(v: string): boolean {
    if (this.is(v)) {
      this.next();
      return true;
    }
    return false;
  }

  private err(pos: Pos, message: string, hint?: string): never {
    throw new CompileError(pos.line, pos.col, message, hint);
  }

  private warn(pos: Pos, message: string, hint?: string): void {
    if ((pos as PTok).sys) return;
    this.warnings.push({ severity: 'warning', line: pos.line, col: pos.col, message, hint });
  }

  private describe(t: Token): string {
    if (t.t === 'eof') return 'el final del programa';
    if (t.t === 'str') return `el texto ${t.v}`;
    return `'${t.v}'`;
  }

  private endOf(t: Token): Pos {
    return { line: t.line, col: t.col + Math.max(1, t.v.length) };
  }

  private expectSemi(what = 'la instrucción'): void {
    if (this.accept(';')) return;
    const prev = this.prev();
    const cur = this.peek();
    if (cur.line > prev.line || cur.t === 'eof') {
      this.err(this.endOf(prev), `Falta ';' al final de la línea ${prev.line}`, `En C, ${what} termina con punto y coma (;).`);
    }
    if (cur.t === 'id' && prev.t === 'id' && !KEYWORDS.has(prev.v)) {
      this.err(cur, `No entiendo ${this.describe(cur)} después de '${prev.v}'`, `¿Falta un operador (+, =, ,) o un ';' entre '${prev.v}' y '${cur.v}'?`);
    }
    if (cur.t === 'str' || cur.t === 'num' || cur.t === 'id') {
      this.err(cur, `Falta algo antes de ${this.describe(cur)}`, `¿Falta una coma, un operador o un ';'?`);
    }
    this.err(cur, `Falta ';' antes de ${this.describe(cur)}`, `En C, ${what} termina con punto y coma (;).`);
  }

  private expect(v: string, context?: string): PTok {
    if (this.is(v)) return this.next();
    const cur = this.peek();
    const prev = this.prev();
    const atPrev = cur.line > prev.line || cur.t === 'eof';
    const pos = atPrev ? this.endOf(prev) : cur;
    const names: Record<string, string> = {
      ')': "Falta cerrar el paréntesis ')'",
      ']': "Falta cerrar el corchete ']'",
      '}': "Falta cerrar la llave '}'",
      '(': "Falta abrir paréntesis '('",
      '{': "Falta abrir la llave '{'",
      ':': "Falta ':'",
      ';': "Falta ';'",
    };
    let msg = names[v] ?? `Se esperaba '${v}'`;
    if (context) msg += ` ${context}`;
    if (!atPrev) msg += ` y aparece ${this.describe(cur)}`;
    let hint: string | undefined;
    if (v === ')' && cur.t === 'str') hint = 'Separa cada valor con una coma: printf("%d", x);';
    else if (v === ')' && (cur.t === 'id' || cur.t === 'num')) hint = '¿Falta una coma o un operador?';
    else if (v === ')') hint = 'Cuenta los paréntesis: cada ( necesita su ).';
    this.err(pos, msg, hint);
  }

  private ident(what: string): PTok {
    const t = this.peek();
    if (t.t !== 'id' || KEYWORDS.has(t.v)) {
      if (t.t === 'id') this.err(t, `'${t.v}' es una palabra reservada de C y no puede usarse como nombre de ${what}`);
      if (t.t === 'num') this.err(t, `Los nombres de ${what} no pueden empezar por un número`);
      this.err(t, `Se esperaba el nombre de ${what} y aparece ${this.describe(t)}`);
    }
    return this.next();
  }

  // ───────────────────────── programa ─────────────────────────

  parseProgram(): Program {
    while (this.peek().t !== 'eof') this.externalDecl();
    const main = this.global.syms.get('main');
    if (!main || main.kind !== 'func' || !main.body) {
      const near = [...this.global.syms.values()].find((s) => s.kind === 'func' && s.body && /^ma[iy]?n/i.test(s.name));
      this.err(
        { line: near?.kind === 'func' ? near.line : 1, col: 1 },
        'Falta la función main',
        near ? `¿Querías llamar main a '${near.name}'? Todo programa empieza en int main() { ... }` : 'Todo programa en C empieza a ejecutarse en int main() { ... }',
      );
    }
    for (const f of this.funcs) {
      if (!f.body && !f.builtin && f.used) {
        this.err(f, `La función '${f.name}' tiene prototipo pero no está definida`, `Escribe la función ${f.name} completa (con sus llaves { }) además del prototipo.`);
      }
    }
    // reparte las variables globales en la zona de datos
    let addr = 64;
    for (const g of this.globals) {
      if (g.extern && !g.defined) {
        if (['stdin', 'stdout', 'stderr'].includes(g.name)) {
          // las coloca la máquina
        } else if (g.used) {
          this.err(g, `La variable '${g.name}' se declara como extern pero no se define en ningún sitio`);
        }
      }
      const a = alignOf(g.type);
      addr = Math.ceil(addr / a) * a;
      g.slot = addr;
      addr += Math.max(sizeOf(g.type), 1);
    }
    for (const s of this.strings) {
      s.addr = addr;
      addr += s.bytes.length;
    }
    addr = Math.ceil(addr / 16) * 16;
    return {
      funcs: this.funcs,
      globals: this.globals,
      strings: this.strings,
      dataSize: addr,
      main: main as FuncSym,
      structs: this.structs,
      includes: this.includes,
    };
  }

  private externalDecl(): void {
    const t = this.peek();
    if (this.accept(';')) return;
    if (t.t === 'id' && t.v === 'using') {
      while (!this.is(';') && this.peek().t !== 'eof') this.next();
      this.accept(';');
      this.warn(t, '"using namespace std;" es de C++ y aquí no hace falta', 'En C no hay espacios de nombres: puedes borrar esa línea.');
      return;
    }
    if (t.t === 'p' && t.v === '{') {
      this.err(t, "Hay una llave '{' suelta fuera de cualquier función", '¿Te falta la cabecera de la función, por ejemplo int main()? ¿O sobra una } antes?');
    }
    if (t.t === 'p' && t.v === '}') {
      this.err(t, "Sobra esta llave '}'", 'Cuenta las llaves: cada { necesita su } y viceversa.');
    }
    if (!this.isTypeStart()) {
      if (t.t === 'id' && this.is('(', 1)) {
        this.err(t, `Falta el tipo de la función '${t.v}'`, `Escribe el tipo que devuelve delante: int ${t.v}(...) o void ${t.v}(...)`);
      }
      if (t.t === 'id' && TYPE_TYPOS[t.v]) this.err(t, `El tipo '${t.v}' no existe en C`, TYPE_TYPOS[t.v]);
      if (t.t === 'id' && /^(if|for|while|do|switch|return|printf|scanf)$/.test(t.v)) {
        this.err(t, `'${t.v}' está fuera de cualquier función`, 'Las instrucciones van dentro de una función, entre sus llaves { }. ¿Cerraste main demasiado pronto?');
      }
      if (t.t === 'id' && this.peek(1).t === 'id') this.err(t, `El tipo '${t.v}' no existe`, closestTypeHint(t.v));
      this.err(t, `No esperaba ${this.describe(t)} aquí`, 'Fuera de las funciones solo puede haber #include, #define, declaraciones y funciones.');
    }
    const spec = this.declSpec();
    if (this.accept(';')) return;
    let first = true;
    for (;;) {
      const d = this.declarator(spec.type, false);
      if (!d.name) this.err(d.pos, 'Falta el nombre en la declaración');
      if (spec.storage === 'typedef') {
        this.declareTypedef(d);
      } else if (d.type.k === 'func') {
        const f = this.declareFunc(d, spec);
        if (this.is('{')) {
          if (!first) this.err(this.peek(), 'No se puede definir una función en medio de otras declaraciones');
          this.funcBody(f, d);
          return;
        }
      } else {
        this.globalVar(d, spec);
      }
      first = false;
      if (!this.accept(',')) break;
    }
    if (this.is('{') || (this.peek().t === 'id' && this.prev().v === ')')) {
      this.err(this.peek(), 'Esto parece el cuerpo de una función pero no lo entiendo', 'Revisa la línea de la cabecera de la función: int nombre(int a, int b) {');
    }
    this.expectSemi('cada declaración');
  }

  // ───────────────────────── tipos ─────────────────────────

  private isTypedefName(name: string): boolean {
    const s = this.scope.find(name);
    return s?.kind === 'typedef';
  }

  private isTypeStart(k = 0): boolean {
    const t = this.peek(k);
    if (t.t !== 'id') return false;
    return TYPE_WORDS.has(t.v) || QUALIFIERS.has(t.v) || STORAGE.has(t.v) || this.isTypedefName(t.v);
  }

  private declSpec(): DeclSpec {
    const pos = this.peek();
    let storage: DeclSpec['storage'] = null;
    let isConst = false;
    let base: CType | null = null;
    let definedTag = false;
    let nSigned = 0;
    let nUnsigned = 0;
    let nLong = 0;
    let nShort = 0;
    let word: string | null = null;
    for (;;) {
      const t = this.peek();
      if (t.t !== 'id') break;
      const v = t.v;
      if (STORAGE.has(v)) {
        this.next();
        if (v === 'typedef' || v === 'extern' || v === 'static') storage = v;
        continue;
      }
      if (QUALIFIERS.has(v)) {
        this.next();
        if (v === 'const') isConst = true;
        continue;
      }
      if (v === 'signed') {
        this.next();
        nSigned++;
        continue;
      }
      if (v === 'unsigned') {
        this.next();
        nUnsigned++;
        continue;
      }
      if (v === 'long') {
        this.next();
        nLong++;
        if (nLong > 2) this.err(t, "'long long long' es demasiado largo");
        continue;
      }
      if (v === 'short') {
        this.next();
        nShort++;
        continue;
      }
      if (v === 'void' || v === 'char' || v === 'int' || v === 'float' || v === 'double' || v === '_Bool' || v === 'bool') {
        this.next();
        if (base || word) {
          this.err(t, `No puedes poner dos tipos a la vez ('${base ? typeName(base) : word}' y '${v}')`, 'Cada variable tiene un único tipo: int, float, char…');
        }
        word = v === '_Bool' ? 'bool' : v;
        continue;
      }
      if (v === 'struct' || v === 'union') {
        if (base || word) this.err(t, 'No puedes poner dos tipos a la vez');
        const r = this.structSpec();
        base = r.type;
        definedTag = r.defined;
        continue;
      }
      if (v === 'enum') {
        if (base || word) this.err(t, 'No puedes poner dos tipos a la vez');
        const r = this.enumSpec();
        base = r.type;
        definedTag = r.defined;
        continue;
      }
      if (!base && !word && !nSigned && !nUnsigned && !nLong && !nShort && this.isTypedefName(v)) {
        this.next();
        base = (this.scope.find(v) as TypedefSym).type;
        continue;
      }
      break;
    }
    if (nSigned && nUnsigned) this.err(pos, "No puede ser 'signed' y 'unsigned' a la vez");
    let type: CType;
    if (base) {
      if (nSigned || nUnsigned || nLong || nShort || word) this.err(pos, 'Combinación de tipos no válida');
      type = base;
    } else {
      if ((nShort || nLong) && word && word !== 'int' && !(word === 'double' && nLong === 1)) {
        this.err(pos, `No existe el tipo '${nShort ? 'short' : 'long'} ${word}'`);
      }
      if ((nSigned || nUnsigned) && word && word !== 'int' && word !== 'char') {
        this.err(pos, `No existe el tipo '${nSigned ? 'signed' : 'unsigned'} ${word}'`);
      }
      let name: IntName | null = null;
      switch (word) {
        case 'void':
          type = T.void;
          break;
        case 'bool':
          type = T.bool;
          break;
        case 'float':
          type = T.float;
          break;
        case 'double':
          type = T.double;
          break;
        case 'char':
          name = nUnsigned ? 'uchar' : nSigned ? 'schar' : 'char';
          break;
        default:
          if (word === null && !nSigned && !nUnsigned && !nLong && !nShort) {
            const t = this.peek();
            if (t.t === 'id' && TYPE_TYPOS[t.v]) this.err(t, `El tipo '${t.v}' no existe en C`, TYPE_TYPOS[t.v]);
            this.err(t, 'Falta el tipo de dato', 'Delante del nombre va el tipo: int, float, double, char…');
          }
          if (nShort) name = nUnsigned ? 'ushort' : 'short';
          else if (nLong === 1) name = nUnsigned ? 'ulong' : 'long';
          else if (nLong === 2) name = nUnsigned ? 'ullong' : 'llong';
          else name = nUnsigned ? 'uint' : 'int';
      }
      if (word === 'double' && nLong) type = T.double;
      if (name) type = intType(name);
      type ??= T.int;
    }
    if (isConst) type = withConst(type);
    return { type, storage, pos, definedTag };
  }

  private structSpec(): { type: CType; defined: boolean } {
    const kw = this.next();
    const union = kw.v === 'union';
    let tag: string | null = null;
    if (this.peek().t === 'id' && !KEYWORDS.has(this.peek().v)) tag = this.next().v;
    if (this.is('{')) {
      let s = tag ? this.scope.tags.get(tag) : undefined;
      if (s && s.fields) this.err(kw, `El struct '${tag}' ya estaba definido`);
      if (!s) {
        s = { tag, union, fields: null, size: 0, align: 1, id: this.structs.length };
        this.structs.push(s);
        if (tag) this.scope.tags.set(tag, s);
      }
      this.next();
      const fields: { name: string; type: CType }[] = [];
      while (!this.is('}')) {
        if (this.peek().t === 'eof') this.err(kw, "Falta cerrar con '}' la definición del struct");
        if (!this.isTypeStart()) {
          const t = this.peek();
          if (t.t === 'id' && TYPE_TYPOS[t.v]) this.err(t, `El tipo '${t.v}' no existe en C`, TYPE_TYPOS[t.v]);
          this.err(t, `Dentro del struct se esperaba un campo (tipo y nombre) y aparece ${this.describe(t)}`);
        }
        const spec = this.declSpec();
        if (this.accept(';')) continue;
        for (;;) {
          const d = this.declarator(spec.type, false);
          if (!d.name) this.err(d.pos, 'Falta el nombre del campo');
          if (this.is(':')) this.err(this.peek(), 'Los campos de bits (:) no están soportados');
          if (d.type.k === 'func') this.err(d.pos, 'Un struct no puede contener funciones (en C no hay métodos)');
          if (d.type.k === 'array' && d.type.len === null) this.err(d.pos, `El array '${d.name}' del struct necesita un tamaño`);
          if (d.type.k === 'struct' && !d.type.s.fields) {
            this.err(d.pos, `El struct '${d.type.s.tag}' todavía no está completo`, d.type.s === s ? 'Un struct no puede contenerse a sí mismo; usa un puntero: struct Nodo *siguiente;' : undefined);
          }
          if (fields.some((f) => f.name === d.name)) this.err(d.pos, `El campo '${d.name}' está repetido`);
          fields.push({ name: d.name!, type: d.type });
          if (!this.accept(',')) break;
        }
        this.expectSemi('cada campo del struct');
      }
      this.next();
      layoutStruct(s, fields);
      return { type: { k: 'struct', s }, defined: true };
    }
    if (!tag) this.err(this.peek(), `Falta el nombre del ${kw.v}`);
    let s = this.scope.findTag(tag!);
    if (!s) {
      s = { tag, union, fields: null, size: 0, align: 1, id: this.structs.length };
      this.structs.push(s);
      this.scope.tags.set(tag!, s);
    }
    return { type: { k: 'struct', s }, defined: false };
  }

  private enumSpec(): { type: CType; defined: boolean } {
    this.next();
    let tag: string | null = null;
    if (this.peek().t === 'id' && !KEYWORDS.has(this.peek().v)) tag = this.next().v;
    const type: CType = { k: 'int', name: 'int', size: 4, signed: true, isEnum: true };
    if (!this.accept('{')) {
      if (!tag) this.err(this.peek(), 'Falta el nombre del enum');
      return { type, defined: false };
    }
    let val = 0;
    while (!this.is('}')) {
      const id = this.ident('constante del enum');
      if (this.accept('=')) {
        const x = this.condExpr();
        const c = this.constInt(x, 'El valor de una constante del enum tiene que ser un número fijo');
        val = Number(c);
      }
      if (this.scope.syms.has(id.v)) this.err(id, `'${id.v}' ya está declarado`);
      const sym: EnumSym = { kind: 'enumconst', name: id.v, value: val };
      this.scope.syms.set(id.v, sym);
      val++;
      if (!this.accept(',')) break;
    }
    this.expect('}', 'al final del enum');
    return { type, defined: true };
  }

  /** Declarador: punteros, nombre, arrays y parámetros. */
  private declarator(base: CType, abstract: boolean): Declarator {
    let t = base;
    while (this.is('*')) {
      this.next();
      let c = false;
      while (this.peek().t === 'id' && QUALIFIERS.has(this.peek().v)) {
        if (this.next().v === 'const') c = true;
      }
      t = c ? withConst(ptrTo(t)) : ptrTo(t);
    }
    return this.directDeclarator(t, abstract);
  }

  private directDeclarator(t: CType, abstract: boolean): Declarator {
    const pos = this.peek();
    let name: string | null = null;
    let inner: Declarator | null = null;
    if (this.is('(') && (this.is('*', 1) || this.is('(', 1) || (this.peek(1).t === 'id' && !this.isTypeStart(1) && !abstract))) {
      this.next();
      inner = this.declarator(PLACEHOLDER, abstract);
      this.expect(')', 'en la declaración');
    } else if (this.peek().t === 'id' && !KEYWORDS.has(this.peek().v) && !(abstract && this.isTypedefName(this.peek().v))) {
      name = this.next().v;
    } else if (!abstract) {
      const cur = this.peek();
      if (cur.t === 'id' && KEYWORDS.has(cur.v)) {
        this.err(cur, `'${cur.v}' es una palabra reservada de C y no puede usarse como nombre`, 'Elige otro nombre para la variable.');
      }
      if (cur.t === 'num') this.err(cur, 'Los nombres de variables no pueden empezar por un número', 'Ejemplo: nota1 vale, 1nota no.');
      if (cur.t === 'p' && cur.v === '=') this.err(cur, 'Falta el nombre de la variable antes del =');
      this.err(cur, `Se esperaba el nombre de la variable y aparece ${this.describe(cur)}`);
    }
    const sufs: ((x: CType) => CType)[] = [];
    let params: ParamInfo[] | undefined;
    let paramScope: Scope | undefined;
    let paramVla: { slot: number; x: Expr }[] | undefined;
    for (;;) {
      if (this.is('[')) {
        const open = this.next();
        if (this.accept(']')) {
          sufs.push((x) => arrayOf(x, null));
          continue;
        }
        this.accept('static');
        const sizeExpr = this.assignExpr();
        this.expect(']', 'del tamaño del array');
        const len = this.arrayLength(sizeExpr, open);
        if (typeof len === 'number') sufs.push((x) => arrayOf(x, len));
        else sufs.push((x) => ({ k: 'array', of: x, len: null, vla: { slot: len.slot } }));
        continue;
      }
      if (this.is('(')) {
        this.next();
        const r = this.paramList();
        if (!params && !inner) {
          params = r.params;
          paramScope = r.scope;
          paramVla = r.vla;
        } else if (!params && inner && sufs.length === 0) {
          // int (*f)(int): los parámetros son del puntero, no de una definición
        }
        const ps = r.params.map((p) => p.type);
        sufs.push((ret) => {
          if (ret.k === 'array') this.err(pos, 'Una función no puede devolver un array', 'Devuelve un puntero o pasa el array como parámetro.');
          if (ret.k === 'func') this.err(pos, 'Una función no puede devolver otra función');
          return { k: 'func', ret, params: ps, variadic: r.variadic, noProto: r.noProto };
        });
        continue;
      }
      break;
    }
    let res = t;
    for (let i = sufs.length - 1; i >= 0; i--) res = sufs[i](res);
    if (inner) {
      return { name: inner.name, type: substitute(inner.type, res), pos: inner.name ? inner.pos : pos, params: inner.params, paramScope: inner.paramScope, paramVla: inner.paramVla };
    }
    return { name, type: res, pos, params, paramScope, paramVla };
  }

  private arrayLength(x: Expr, pos: Pos): number | { slot: number } {
    const r = rval(x);
    if (!isInt(r.type)) this.err(pos, `El tamaño de un array tiene que ser un número entero, no ${typeName(r.type)}`);
    const c = this.tryConst(r);
    if (c !== null) {
      const n = Number(c);
      if (n <= 0) this.err(pos, `El tamaño de un array tiene que ser mayor que 0 (es ${n})`);
      if (n > 50_000_000) this.err(pos, `El array es demasiado grande (${n} elementos)`);
      return n;
    }
    // VLA: el tamaño se calcula al ejecutar
    if (this.paramVlaCounter) {
      const slot = this.paramVlaCounter.n++;
      this.vlaDims?.push({ slot, x: r });
      return { slot };
    }
    if (!this.fn) {
      this.err(pos, 'El tamaño de un array global tiene que ser un número fijo', 'Usa un número o una constante: #define N 100 y luego int v[N];');
    }
    const slot = this.fn!.nregs++;
    if (!this.vlaDims) this.err(pos, 'Aquí el tamaño del array tiene que ser un número fijo');
    this.vlaDims!.push({ slot, x: r });
    return { slot };
  }

  private paramList(): { params: ParamInfo[]; variadic: boolean; noProto: boolean; scope: Scope; vla: { slot: number; x: Expr }[] } {
    const scope = new Scope(this.scope);
    const saved = this.scope;
    const savedVla = this.vlaDims;
    const savedCounter = this.paramVlaCounter;
    const vla: { slot: number; x: Expr }[] = [];
    this.vlaDims = vla;
    this.paramVlaCounter = { n: 0 };
    this.scope = scope;
    const params: ParamInfo[] = [];
    let variadic = false;
    let noProto = false;
    try {
      if (this.accept(')')) return { params, variadic, noProto: true, scope, vla };
      if (this.is('void') && this.is(')', 1)) {
        this.next();
        this.next();
        return { params, variadic, noProto, scope, vla };
      }
      for (;;) {
        if (this.accept('...')) {
          variadic = true;
          break;
        }
        if (!this.isTypeStart()) {
          const t = this.peek();
          if (t.t === 'id' && TYPE_TYPOS[t.v]) this.err(t, `El tipo '${t.v}' no existe en C`, TYPE_TYPOS[t.v]);
          if (t.t === 'id' && (this.is(',', 1) || this.is(')', 1))) {
            this.err(t, `Falta el tipo del parámetro '${t.v}'`, `Cada parámetro lleva su tipo: int ${t.v}`);
          }
          this.err(t, `Se esperaba un parámetro (tipo y nombre) y aparece ${this.describe(t)}`);
        }
        const spec = this.declSpec();
        const d = this.declarator(spec.type, true);
        let type = d.type;
        let arrayParam = false;
        if (type.k === 'array') {
          type = ptrTo(type.of);
          arrayParam = true;
        } else if (type.k === 'func') type = ptrTo(type);
        if (type.k === 'void') {
          if (d.name) this.err(d.pos, `El parámetro '${d.name}' no puede ser void`);
          this.err(d.pos, 'void solo puede ir solo: f(void)');
        }
        let sym: VarSym | null = null;
        if (d.name) {
          if (scope.syms.has(d.name)) this.err(d.pos, `El parámetro '${d.name}' está repetido`);
          sym = this.newVar(d.name, type, 'local', d.pos);
          sym.isParam = true;
          sym.arrayParam = arrayParam;
          scope.syms.set(d.name, sym);
        }
        params.push({ sym, name: d.name, type, pos: d.pos });
        if (!this.accept(',')) break;
      }
      this.expect(')', 'de la lista de parámetros');
      noProto = false;
      return { params, variadic, noProto, scope, vla };
    } finally {
      this.scope = saved;
      this.vlaDims = savedVla;
      this.paramVlaCounter = savedCounter;
    }
  }

  private typeNameParse(): CType {
    const spec = this.declSpec();
    if (spec.storage) this.err(spec.pos, `'${spec.storage}' no puede ir aquí`);
    const d = this.declarator(spec.type, true);
    if (d.name) this.err(d.pos, `No esperaba el nombre '${d.name}' aquí`);
    return d.type;
  }

  // ───────────────────────── declaraciones ─────────────────────────

  private newVar(name: string, type: CType, storage: VarSym['storage'], pos: Pos): VarSym {
    return {
      kind: 'var',
      name,
      type,
      storage,
      line: pos.line,
      col: pos.col,
      id: this.nextId++,
      addrTaken: false,
      used: false,
      assigned: false,
      isParam: false,
      reg: false,
      slot: 0,
      objIndex: -1,
      fnName: this.fn?.name,
    };
  }

  private declareTypedef(d: Declarator): void {
    const prev = this.scope.syms.get(d.name!);
    if (prev && !(prev.kind === 'typedef' && sameType(prev.type, d.type))) {
      this.err(d.pos, `'${d.name}' ya estaba declarado`);
    }
    this.scope.syms.set(d.name!, { kind: 'typedef', name: d.name!, type: d.type });
  }

  private declareFunc(d: Declarator, spec: DeclSpec): FuncSym {
    const type = d.type as Extract<CType, { k: 'func' }>;
    const name = d.name!;
    if (this.fn && this.is('{')) {
      this.err(d.pos, `No se puede definir la función '${name}' dentro de otra función`, `¿Te falta cerrar con } la función ${this.fn.name} antes de empezar ${name}?`);
    }
    const prev = this.global.syms.get(name);
    if (prev) {
      if (prev.kind !== 'func') this.err(d.pos, `'${name}' ya está declarado como variable o tipo`);
      if (prev.builtin && (d.pos as PTok).sys !== true) {
        if (this.is('{')) {
          this.err(d.pos, `'${name}' ya existe en la biblioteca de C`, `Ponle otro nombre a tu función, por ejemplo mi_${name}.`);
        }
        if (!sameType(prev.type, type)) this.err(d.pos, `La declaración de '${name}' no coincide con la de la biblioteca`);
        return prev;
      }
      if (!sameType(prev.type, type)) {
        if (prev.type.noProto || type.noProto) {
          if (!type.noProto) prev.type = type;
        } else {
          this.err(
            d.pos,
            `La función '${name}' no coincide con su prototipo de la línea ${prev.line}`,
            `El prototipo dice ${typeName(prev.type.ret)} ${name}(${prev.type.params.map(typeName).join(', ')}) y aquí pone ${typeName(type.ret)} ${name}(${type.params.map(typeName).join(', ')}).`,
          );
        }
      }
      if (this.is('{') && prev.body) this.err(d.pos, `La función '${name}' ya estaba definida en la línea ${prev.line}`, 'No puede haber dos funciones con el mismo nombre.');
      if (this.is('{')) {
        prev.line = d.pos.line;
        prev.col = d.pos.col;
      }
      return prev;
    }
    void spec;
    const f: FuncSym = {
      kind: 'func',
      name,
      type,
      params: [],
      body: null,
      line: d.pos.line,
      col: d.pos.col,
      locals: [],
      frameSize: 0,
      nregs: 0,
      nobjs: 0,
      builtin: (d.pos as PTok).sys === true,
      used: false,
      id: this.funcs.length,
      vlaParams: [],
    };
    this.funcs.push(f);
    this.global.syms.set(name, f);
    if (name === 'main' && !f.builtin) {
      if (type.ret.k === 'void') this.warn(d.pos, 'main debería devolver int', 'Escribe int main() y termina con return 0;');
      else if (!(type.ret.k === 'int' && type.ret.name === 'int')) this.err(d.pos, 'main tiene que devolver int', 'Escribe int main()');
      if (type.params.length > 0 && type.params.length !== 2) this.err(d.pos, 'main no puede tener esos parámetros', 'Escribe int main() o int main(void).');
    }
    return f;
  }

  private funcBody(f: FuncSym, d: Declarator): void {
    const type = d.type as Extract<CType, { k: 'func' }>;
    f.type = type;
    const scope = d.paramScope ?? new Scope(this.global);
    f.params = [];
    f.locals = [];
    f.nregs = d.paramVla?.length ? Math.max(...d.paramVla.map((v) => v.slot)) + 1 : 0;
    f.vlaParams = d.paramVla ?? [];
    for (const p of d.params ?? []) {
      if (!p.sym) this.err(p.pos, `Falta el nombre de un parámetro de '${f.name}'`, 'En la definición de la función cada parámetro necesita nombre: int suma(int a, int b)');
      p.sym.fnName = f.name;
      f.params.push(p.sym);
      f.locals.push(p.sym);
    }
    this.fn = f;
    const saved = this.scope;
    this.scope = new Scope(scope);
    try {
      const open = this.next();
      const body = this.blockBody(open);
      f.body = { s: 'block', body, restoresSp: false, line: open.line, col: open.col };
    } finally {
      this.scope = saved;
    }
    // ¿puede llegar al final sin return?
    if (f.type.ret.k !== 'void' && f.name !== 'main' && mayFallThrough(f.body!)) {
      this.warn(
        { line: this.prev().line, col: this.prev().col },
        `La función '${f.name}' puede terminar sin hacer return`,
        `Como devuelve ${typeName(f.type.ret)}, todos los caminos tienen que acabar en return valor;`,
      );
    }
    this.layoutFrame(f);
    for (const v of f.locals) {
      if (!v.used && !v.hidden && !v.isParam) {
        this.warn(v, `La variable '${v.name}' se declara pero no se usa`, 'Puedes borrarla si no la necesitas.');
      }
    }
    this.fn = null;
  }

  /** Decide qué variables locales van en registros y coloca el resto en el marco. */
  private layoutFrame(f: FuncSym): void {
    let off = 0;
    let objs = 0;
    for (const v of f.locals) {
      if (v.storage !== 'local') continue;
      if (v.type.k === 'array' && hasVla(v.type)) {
        v.reg = false;
        v.vlaBase = f.nregs++;
        v.objIndex = objs++;
        continue;
      }
      if (isScalar(v.type) && !v.addrTaken) {
        v.reg = true;
        v.slot = f.nregs++;
        continue;
      }
      const a = Math.max(alignOf(v.type), 1);
      off = Math.ceil(off / a) * a;
      v.slot = off;
      v.objIndex = objs++;
      off += Math.max(sizeOf(v.type), 1);
    }
    f.frameSize = Math.ceil(off / 16) * 16;
    f.nobjs = objs;
  }

  private globalVar(d: Declarator, spec: DeclSpec): void {
    const name = d.name!;
    let type = d.type;
    if (type.k === 'void') this.err(d.pos, `La variable '${name}' no puede ser de tipo void`, 'void significa "nada": usa int, float, char…');
    const prev = this.global.syms.get(name);
    let sym: VarSym;
    if (prev) {
      if (prev.kind !== 'var') this.err(d.pos, `'${name}' ya está declarado como función o tipo`);
      if (!sameType(prev.type, type)) this.err(d.pos, `'${name}' ya estaba declarada con otro tipo (${typeName(prev.type)})`);
      sym = prev;
      if (type.k === 'array' && type.len !== null) sym.type = type;
    } else {
      sym = this.newVar(name, type, 'global', d.pos);
      sym.extern = spec.storage === 'extern';
      this.global.syms.set(name, sym);
      this.globals.push(sym);
    }
    if (spec.storage !== 'extern') {
      if (sym.defined && this.is('=')) this.err(d.pos, `La variable global '${name}' ya tenía valor`);
      sym.defined = true;
      sym.extern = false;
    }
    if (this.accept('=')) {
      this.inGlobalInit = true;
      try {
        const tree = this.initializer();
        const r = this.buildInit(type, tree, name);
        type = r.type;
        sym.type = type;
        this.checkConstInit(r.init);
        sym.init = r.init;
      } finally {
        this.inGlobalInit = false;
      }
    }
    if (sym.type.k === 'array' && sym.type.len === null && !spec.storage) {
      this.err(d.pos, `El array '${name}' necesita un tamaño`, `Escribe el tamaño entre corchetes: ${name}[10]`);
    }
    if (sym.type.k === 'struct' && !sym.type.s.fields && spec.storage !== 'extern') {
      this.err(d.pos, `El struct '${sym.type.s.tag}' no está definido`, 'Define el struct con sus campos antes de crear variables de ese tipo.');
    }
  }

  private checkConstInit(init: Init): void {
    const check = (x: Expr): void => {
      const ok = (e: Expr): boolean => {
        switch (e.e) {
          case 'const':
          case 'str':
          case 'vlasize':
            return true;
          case 'fn':
            return true;
          case 'addr':
            return addrConst(e.x);
          case 'decay':
            return addrConst(e.x) || e.x.e === 'fn';
          case 'cast':
            return ok(e.x);
          case 'arith':
          case 'cmp':
          case 'logic':
            return ok(e.l) && ok(e.r);
          case 'padd':
            return ok(e.p) && ok(e.i);
          case 'not':
          case 'neg':
          case 'bitnot':
            return ok(e.x);
          case 'cond':
            return ok(e.c) && ok(e.a) && ok(e.b);
          default:
            return false;
        }
      };
      const addrConst = (e: Expr): boolean => {
        if (e.e === 'var') return e.sym.storage !== 'local';
        if (e.e === 'str') return true;
        if (e.e === 'index' && !e.viaPtr) return addrConst(e.a) && ok(e.i);
        if (e.e === 'member') return addrConst(e.x);
        if (e.e === 'fn') return true;
        return false;
      };
      if (!ok(x)) {
        this.err(
          x,
          'El valor inicial de una variable global tiene que ser fijo',
          'Fuera de las funciones solo puedes inicializar con números o constantes. Calcula el valor dentro de main.',
        );
      }
    };
    if (init.k === 'expr') check(init.x);
    else for (const it of init.items) if ('x' in it) check(it.x);
  }

  /** Declaración dentro de una función. Devuelve las sentencias de inicialización. */
  private localDecl(): Stmt[] {
    const spec = this.declSpec();
    const out: Stmt[] = [];
    if (this.accept(';')) return out;
    for (;;) {
      const vla: { slot: number; x: Expr }[] = [];
      this.vlaDims = vla;
      let d: Declarator;
      try {
        d = this.declarator(spec.type, false);
      } finally {
        this.vlaDims = null;
      }
      if (!d.name) this.err(d.pos, 'Falta el nombre en la declaración');
      const name = d.name!;
      if (spec.storage === 'typedef') {
        this.declareTypedef(d);
      } else if (d.type.k === 'func') {
        if (this.is('{')) {
          this.err(d.pos, `No se puede definir la función '${name}' dentro de otra función`, `¿Te falta cerrar con } la función ${this.fn!.name} antes de empezar ${name}?`);
        }
        const f = this.declareFunc(d, spec);
        this.scope.syms.set(name, f);
      } else if (spec.storage === 'extern') {
        const g = this.global.syms.get(name);
        if (!g || g.kind !== 'var') this.err(d.pos, `No hay ninguna variable global '${name}'`);
        this.scope.syms.set(name, g!);
      } else {
        const existing = this.scope.syms.get(name);
        if (existing) {
          const where = existing.kind === 'var' ? ` (en la línea ${existing.line})` : '';
          this.err(d.pos, `La variable '${name}' ya estaba declarada${where}`, `No declares dos veces la misma variable: la segunda vez escribe solo ${name} = valor;`);
        }
        if (this.scope.parent?.syms.get(name)?.kind === 'var' && (this.scope.parent.syms.get(name) as VarSym).isParam) {
          this.err(d.pos, `'${name}' ya es un parámetro de la función`, 'No lo vuelvas a declarar: ya tiene el valor que te pasan.');
        }
        let type: CType = d.type;
        if (type.k === 'void') this.err(d.pos, `La variable '${name}' no puede ser de tipo void`, 'void significa "nada": usa int, float, char…');
        if (type.k === 'struct' && !type.s.fields) {
          this.err(d.pos, `El struct '${type.s.tag}' no está definido`, 'Define el struct con sus campos (struct X { ... };) antes de usarlo.');
        }
        const isStatic = spec.storage === 'static';
        const sym = this.newVar(name, type, isStatic ? 'static' : 'local', d.pos);
        let init: Init | null = null;
        if (this.accept('=')) {
          if (vla.length) this.err(d.pos, 'Un array de tamaño variable no se puede inicializar con { }', 'Rellénalo con un bucle for después de declararlo.');
          if (isStatic) this.inGlobalInit = true;
          // la variable ya existe dentro de su propio inicializador (int x = x; es un error de uso)
          try {
            const tree = this.initializer();
            const r = this.buildInit(type, tree, name);
            type = r.type;
            sym.type = type;
            init = r.init;
            if (isStatic) this.checkConstInit(init);
          } finally {
            this.inGlobalInit = false;
          }
        }
        if (type.k === 'array' && type.len === null && !type.vla) {
          this.err(d.pos, `El array '${name}' necesita un tamaño`, `Escribe el tamaño entre corchetes, ${name}[10], o dale valores: int ${name}[] = {1, 2, 3};`);
        }
        this.scope.syms.set(name, sym);
        if (isStatic) {
          sym.init = init;
          this.globals.push(sym);
        } else {
          this.fn!.locals.push(sym);
          out.push({ s: 'decl', sym, init, vla, line: d.pos.line, col: d.pos.col });
        }
      }
      if (!this.accept(',')) break;
    }
    this.expectSemi('cada declaración');
    return out;
  }

  // ───────────────────────── inicializadores ─────────────────────────

  private initializer(): InitTree {
    const pos = this.peek();
    if (this.accept('{')) {
      const items: { desig: Desig[]; init: InitTree }[] = [];
      while (!this.is('}')) {
        const desig: Desig[] = [];
        for (;;) {
          if (this.is('[')) {
            const o = this.next();
            const x = this.condExpr();
            this.expect(']');
            desig.push({ k: 'index', i: Number(this.constInt(x, 'El índice de un inicializador tiene que ser un número fijo', o)) });
          } else if (this.is('.') && this.peek(1).t === 'id') {
            this.next();
            const id = this.next();
            desig.push({ k: 'field', name: id.v, pos: id });
          } else break;
        }
        if (desig.length) this.expect('=', 'después del designador');
        items.push({ desig, init: this.initializer() });
        if (!this.accept(',')) break;
      }
      if (!this.is('}')) {
        const cur = this.peek();
        this.err(cur.line > this.prev().line ? this.endOf(this.prev()) : cur, "Falta '}' o ',' en la lista de valores", 'Los valores se separan con comas: {1, 2, 3}');
      }
      this.next();
      return { k: 'list', items, pos };
    }
    return { k: 'expr', x: this.assignExpr(), pos };
  }

  private buildInit(type: CType, tree: InitTree, name: string): { type: CType; init: Init } {
    if (tree.k === 'expr' && type.k !== 'array') {
      if (type.k === 'struct') {
        const x = tree.x;
        if (x.type.k !== 'struct' || x.type.s !== type.s) {
          this.err(x, `No se puede inicializar el struct '${name}' con ${typeName(x.type)}`, 'Usa llaves con los valores de cada campo: = {valor1, valor2}');
        }
        return { type, init: { k: 'expr', x } };
      }
      return { type, init: { k: 'expr', x: this.assignConv(tree.x, type, `la variable '${name}'`) } };
    }
    if (type.k !== 'array' && type.k !== 'struct') {
      // escalar entre llaves: int x = {5};
      if (tree.k === 'list') {
        if (tree.items.length === 0) return { type, init: { k: 'expr', x: this.mkConst(0, T.int, tree.pos) } };
        if (tree.items.length > 1) this.warn(tree.pos, `Sobran valores al inicializar '${name}'`);
        return this.buildInit(type, tree.items[0].init, name);
      }
    }
    const items: InitItem[] = [];
    let len = 0;
    if (type.k === 'array' && type.len === null && type.vla) this.err(tree.pos, 'Un array de tamaño variable no se puede inicializar');
    if (tree.k === 'expr') {
      // char s[] = "hola";
      const x = tree.x;
      if (type.k === 'array' && isCharLike(type.of) && x.e === 'str') {
        const bytes = this.strings[x.sid].bytes;
        len = this.strInit(type, bytes, 0, items, x, name);
      } else if (type.k === 'array') {
        if (x.e === 'str') this.err(x, `'${name}' no es un array de char: no se puede inicializar con un texto`);
        this.err(x, `Para dar valores al array '${name}' usa llaves: {1, 2, 3}`);
      } else {
        this.err(x, `Para dar valores al struct '${name}' usa llaves: {valor1, valor2}`);
      }
    } else {
      len = this.initAggregate(type, 0, tree.items, 0, items, true, name).count;
    }
    let finalType = type;
    if (type.k === 'array' && type.len === null) {
      finalType = { ...type, len: Math.max(len, 0) } as CType;
      if (len === 0) this.err(tree.pos, `El array '${name}' no puede tener tamaño 0`);
    }
    return { type: finalType, init: { k: 'list', size: sizeOf(finalType), items } };
  }

  private strInit(type: Extract<CType, { k: 'array' }>, bytes: number[], off: number, items: InitItem[], pos: Pos, name: string): number {
    const n = type.len;
    let use = bytes;
    if (n !== null) {
      if (bytes.length - 1 > n) {
        this.err(pos, `El texto no cabe en '${name}': tiene ${bytes.length - 1} letras y el array solo ${n} huecos`, `Recuerda que hace falta un hueco más para el '\\0' final: usa al menos [${bytes.length}].`);
      }
      if (bytes.length - 1 === n) {
        this.warn(pos, `El texto llena todo '${name}' y no queda sitio para el '\\0' final`, `Haz el array un hueco más grande: [${n + 1}].`);
        use = bytes.slice(0, n);
      }
    }
    items.push({ off, bytes: use });
    return bytes.length;
  }

  /** Recorre los miembros de un agregado consumiendo valores (con elisión de llaves). */
  private initAggregate(
    type: CType,
    off: number,
    entries: { desig: Desig[]; init: InitTree }[],
    idx: number,
    items: InitItem[],
    top: boolean,
    name: string,
  ): { idx: number; count: number } {
    const members: { type: CType; off: number }[] = [];
    const isArr = type.k === 'array';
    const arrLen = isArr ? type.len : null;
    const elem = isArr ? type.of : null;
    const es = elem ? sizeOf(elem) : 0;
    const fields = type.k === 'struct' ? type.s.fields! : null;
    if (type.k === 'struct' && type.s.union) {
      // en una union solo se inicializa el primer campo
      if (fields!.length) members.push({ type: fields![0].type, off });
    }
    let pos = 0;
    let count = 0;
    for (;;) {
      if (idx >= entries.length) break;
      const entry = entries[idx];
      if (entry.desig.length) {
        if (!top && pos > 0) break;
        const dsg = entry.desig[0];
        if (dsg.k === 'index') {
          if (!isArr) this.err(entry.init.pos, `'${name}' no es un array: no se puede usar [${dsg.i}] =`);
          pos = dsg.i;
        } else {
          if (!fields) this.err(dsg.pos, `'${name}' no es un struct: no se puede usar .${dsg.name} =`);
          const fi = fields!.findIndex((f) => f.name === dsg.name);
          if (fi < 0) this.err(dsg.pos, `El struct no tiene ningún campo '${dsg.name}'`);
          pos = fi;
        }
        if (entry.desig.length > 1) this.err(entry.init.pos, 'Los designadores encadenados no están soportados');
      }
      let mt: CType;
      let mo: number;
      if (isArr) {
        if (arrLen !== null && pos >= arrLen) {
          if (top) this.warn(entry.init.pos, `Sobran valores: el array '${name}' solo tiene ${arrLen} elementos`, 'Los valores que sobran se ignoran.');
          break;
        }
        mt = elem!;
        mo = off + pos * es;
      } else if (fields) {
        if (type.k === 'struct' && type.s.union && pos > 0) break;
        if (pos >= fields.length) {
          if (top) this.warn(entry.init.pos, `Sobran valores: el struct solo tiene ${fields.length} campos`);
          break;
        }
        mt = fields[pos].type;
        mo = off + fields[pos].offset;
      } else break;
      const init = entry.init;
      if (init.k === 'list') {
        if (mt.k === 'array' || mt.k === 'struct') {
          const r = this.initAggregate(mt, mo, init.items, 0, items, true, name);
          if (mt.k === 'array' && mt.len === null) this.err(init.pos, 'Falta el tamaño del array interior');
          void r;
        } else {
          if (init.items.length) {
            const inner = init.items[0].init;
            if (inner.k !== 'expr') this.err(inner.pos, 'Demasiadas llaves');
            items.push({ off: mo, t: mt, x: this.assignConv(inner.x, mt, `'${name}'`) });
          }
        }
        idx++;
      } else {
        const x = init.x;
        if (mt.k === 'array' && isCharLike(mt.of) && x.e === 'str') {
          this.strInit(mt, this.strings[x.sid].bytes, mo, items, x, name);
          idx++;
        } else if (mt.k === 'struct' && x.type.k === 'struct' && x.type.s === mt.s) {
          items.push({ off: mo, t: mt, x });
          idx++;
        } else if (mt.k === 'array' || mt.k === 'struct') {
          idx = this.initAggregate(mt, mo, entries, idx, items, false, name).idx;
        } else {
          items.push({ off: mo, t: mt, x: this.assignConv(x, mt, `'${name}'`) });
          idx++;
        }
      }
      pos++;
      count = Math.max(count, pos);
      if (!top && isArr && arrLen !== null && pos >= arrLen) break;
      if (!top && fields && pos >= fields.length) break;
    }
    if (top && idx < entries.length && !isArr && !fields) {
      this.warn(entries[idx].init.pos, 'Sobran valores en la inicialización');
    }
    return { idx, count };
  }

  // ───────────────────────── sentencias ─────────────────────────

  private blockBody(open: Pos): Stmt[] {
    const list: Stmt[] = [];
    const savedList = this.curList;
    this.curList = list;
    try {
      while (!this.is('}')) {
        if (this.peek().t === 'eof') {
          this.err(open, `Falta cerrar la llave '{' de la línea ${open.line}`, 'Cada { tiene que tener su } al final del bloque.');
        }
        if (this.isTypeStart() && !(this.peek(1).t === 'p' && this.peek(1).v === ':')) {
          if (this.isDeclarationAhead()) {
            list.push(...this.localDecl());
            continue;
          }
        }
        list.push(this.statement());
      }
      this.next();
      return list;
    } finally {
      this.curList = savedList;
    }
  }

  private isDeclarationAhead(): boolean {
    // un nombre de typedef seguido de algo que no es un declarador puede ser una expresión
    const t = this.peek();
    if (this.isTypedefName(t.v)) {
      const n = this.peek(1);
      return n.t === 'id' || (n.t === 'p' && (n.v === '*' || n.v === '('));
    }
    return true;
  }

  private block(open: PTok): Stmt {
    const saved = this.scope;
    this.scope = new Scope(saved);
    try {
      const body = this.blockBody(open);
      const restoresSp = body.some((s) => s.s === 'decl' && s.vla.length > 0);
      return { s: 'block', body, restoresSp, line: open.line, col: open.col };
    } finally {
      this.scope = saved;
    }
  }

  /** Sentencia que es el cuerpo de un if/for/while: también puede ser una declaración suelta (error). */
  private subStatement(owner: string, ownerTok: PTok): Stmt {
    const t = this.peek();
    if (this.isTypeStart() && this.isDeclarationAhead()) {
      this.err(t, `Para declarar una variable dentro de un ${owner} hacen falta llaves { }`, `Escribe: ${owner} (...) { ${t.v} ...; }`);
    }
    if (t.t === 'p' && t.v === ';' && t.line === this.prev().line && owner !== 'else' && owner !== 'do') {
      this.warn(
        t,
        `Hay un ';' justo después del ${owner} (...)`,
        owner === 'if'
          ? 'Ese ; termina el if: lo de debajo se ejecutará siempre. Quita el punto y coma.'
          : `Ese ; es el cuerpo del ${owner}: el bucle no hace nada y lo de debajo solo se ejecuta una vez. Quita el punto y coma.`,
      );
    }
    void ownerTok;
    return this.statement();
  }

  private condition(owner: string): Expr {
    const open = this.peek();
    if (!this.is('(')) {
      this.err(open, `Falta '(' después de ${owner}`, `La condición va entre paréntesis: ${owner} (x > 0)`);
    }
    this.next();
    if (this.is(')')) this.err(this.peek(), `La condición del ${owner} está vacía`, `Escribe una condición entre los paréntesis, por ejemplo ${owner} (x > 0)`);
    const x = this.expr();
    if (!this.is(')')) {
      const cur = this.peek();
      if (cur.t === 'p' && cur.v === ';' && owner !== 'for') this.err(cur, `Falta cerrar el paréntesis ')' de la condición del ${owner}`);
      this.expect(')', `de la condición del ${owner}`);
    }
    this.next();
    return this.cond(x, owner);
  }

  private cond(x: Expr, owner: string): Expr {
    if (x.e === 'assign' && !x.paren) {
      this.warn(
        x,
        `En la condición del ${owner} hay una asignación (=), no una comparación`,
        'Para comparar se usa == (dos iguales). Un solo = cambia el valor de la variable.',
      );
    }
    const r = rval(x);
    if (!isScalar(r.type) && r.type.k !== 'array') {
      this.err(x, `La condición del ${owner} tiene que ser un número o una comparación, no ${typeName(r.type)}`);
    }
    return this.decay(r);
  }

  private statement(): Stmt {
    const t = this.peek();
    const pos = { line: t.line, col: t.col };
    if (t.t === 'p') {
      if (t.v === '{') {
        this.next();
        return this.block(t);
      }
      if (t.v === ';') {
        this.next();
        return { s: 'empty', ...pos };
      }
      if (t.v === '}') this.err(t, "Sobra esta llave '}'");
    }
    if (t.t === 'id') {
      switch (t.v) {
        case 'if': {
          this.next();
          const c = this.condition('if');
          const th = this.subStatement('if', t);
          let el: Stmt | null = null;
          if (this.accept('else')) el = this.subStatement('else', t);
          return { s: 'if', c, t: th, f: el, ...pos };
        }
        case 'else':
          this.err(t, 'Este else no tiene un if delante', '¿Hay un ; justo después del if (...)? ¿O el if tiene varias instrucciones sin llaves { }?');
          break;
        case 'while': {
          this.next();
          const c = this.condition('while');
          this.loops++;
          this.breakable++;
          try {
            const body = this.subStatement('while', t);
            return { s: 'while', c, body, ...pos };
          } finally {
            this.loops--;
            this.breakable--;
          }
        }
        case 'do': {
          this.next();
          this.loops++;
          this.breakable++;
          let body: Stmt;
          try {
            body = this.subStatement('do', t);
          } finally {
            this.loops--;
            this.breakable--;
          }
          if (!this.is('while')) this.err(this.peek(), "Falta 'while (condición);' al final del do", 'Un do-while se escribe: do { ... } while (condición);');
          this.next();
          const c = this.condition('while');
          if (!this.is(';')) this.err(this.endOf(this.prev()), "Falta ';' después del while del do-while", 'El do-while termina con punto y coma: } while (x > 0);');
          this.next();
          return { s: 'do', body, c, ...pos };
        }
        case 'for':
          return this.forStmt(t);
        case 'switch':
          return this.switchStmt(t);
        case 'case':
        case 'default':
          return this.caseLabel(t);
        case 'break':
          this.next();
          if (!this.breakable) this.err(t, 'break solo se puede usar dentro de un bucle o de un switch');
          this.expectSemi();
          return { s: 'break', ...pos };
        case 'continue':
          this.next();
          if (!this.loops) this.err(t, 'continue solo se puede usar dentro de un bucle');
          this.expectSemi();
          return { s: 'continue', ...pos };
        case 'return': {
          this.next();
          const f = this.fn!;
          if (this.accept(';')) {
            if (f.type.ret.k !== 'void' && f.name !== 'main') {
              this.err(t, `La función '${f.name}' tiene que devolver un valor (${typeName(f.type.ret)})`, 'Escribe return seguido del valor: return resultado;');
            }
            return { s: 'return', x: f.name === 'main' && f.type.ret.k !== 'void' ? this.mkConst(0, T.int, t) : null, ...pos };
          }
          const x0 = this.expr();
          let x: Expr;
          if (f.type.ret.k === 'void') {
            if (x0.type.k !== 'void') {
              this.err(t, `La función '${f.name}' es void: no puede devolver un valor`, `Si tiene que devolver algo, cambia void por el tipo: int ${f.name}(...)`);
            }
            x = x0;
          } else if (f.type.ret.k === 'struct') {
            if (x0.type.k !== 'struct' || x0.type.s !== f.type.ret.s) this.err(x0, `La función '${f.name}' tiene que devolver ${typeName(f.type.ret)}`);
            x = x0;
          } else {
            x = this.assignConv(x0, f.type.ret, `el valor que devuelve '${f.name}'`);
          }
          this.expectSemi('el return');
          return { s: 'return', x, ...pos };
        }
        case 'goto':
          this.err(t, 'goto no está soportado en esta web', 'Casi siempre se puede cambiar por un bucle con break o continue.');
          break;
        case 'using':
          this.next();
          while (!this.is(';') && this.peek().t !== 'eof') this.next();
          this.accept(';');
          this.warn(t, '"using namespace std;" es de C++ y aquí no hace falta');
          return { s: 'empty', ...pos };
      }
      if (this.is(':', 1) && !KEYWORDS.has(t.v)) {
        this.err(t, 'Las etiquetas (nombre:) no están soportadas', /^cas?e?$/i.test(t.v) ? '¿Querías escribir case?' : undefined);
      }
      // nombre desconocido seguido de otro nombre: tipo que no existe
      if (!this.scope.find(t.v) && !KEYWORDS.has(t.v)) {
        const n = this.peek(1);
        if (n.t === 'id' || (n.t === 'p' && n.v === '*' && this.peek(2).t === 'id' && (this.is(';', 3) || this.is('=', 3)))) {
          if (TYPE_TYPOS[t.v]) this.err(t, `El tipo '${t.v}' no existe en C`, TYPE_TYPOS[t.v]);
          if (CPP_NAMES[t.v]) this.err(t, `'${t.v}' no existe en C`, CPP_NAMES[t.v]);
          if (n.t === 'id' && !this.scope.find(n.v)) this.err(t, `El tipo '${t.v}' no existe`, closestTypeHint(t.v));
        }
      }
    }
    // sentencia de expresión
    const x = this.expr();
    this.checkExprStatement(x);
    this.expectSemi();
    return { s: 'expr', x, ...pos };
  }

  private checkExprStatement(x: Expr): void {
    if (x.e === 'cmp' && (x.op === '==' || x.op === '!=') && !x.paren) {
      this.warn(x, 'Esta comparación no hace nada', x.op === '==' ? '¿Querías guardar un valor? Para asignar se usa un solo =' : undefined);
    } else if (x.e === 'cmp' || x.e === 'arith' || x.e === 'logic' || (x.e === 'var' && x.type.k !== 'void') || x.e === 'const') {
      this.warn(x, 'El resultado de esta expresión no se usa', 'Una operación sola no cambia nada: guárdala en una variable (x = ...) o úsala en un printf.');
    }
  }

  private forStmt(t: PTok): Stmt {
    this.next();
    const pos = { line: t.line, col: t.col };
    if (!this.is('(')) this.err(this.peek(), "Falta '(' después de for", 'Un for se escribe: for (int i = 0; i < 10; i++)');
    this.next();
    const saved = this.scope;
    this.scope = new Scope(saved);
    try {
      let init: Stmt | null = null;
      if (this.accept(';')) {
        init = null;
      } else if (this.isTypeStart() && this.isDeclarationAhead()) {
        const decls = this.localDecl();
        init = { s: 'block', body: decls, restoresSp: false, ...pos };
      } else {
        const x = this.expr();
        if (this.is(',') || this.is(')')) this.err(this.peek(), "Las partes del for se separan con ';', no con ','", 'Así: for (i = 0; i < 10; i++)');
        this.expectSemi('la primera parte del for');
        init = { s: 'expr', x, line: x.line, col: x.col };
      }
      let c: Expr | null = null;
      if (!this.accept(';')) {
        const x = this.expr();
        c = this.cond(x, 'for');
        if (this.is(')')) this.err(this.peek(), "Al for le falta una parte: lleva tres partes separadas por ';'", 'for (inicio; condición; paso), por ejemplo for (i = 0; i < 10; i++)');
        if (!this.is(';')) this.expect(';', 'después de la condición del for');
        this.next();
      }
      let step: Expr | null = null;
      if (!this.is(')')) {
        step = this.expr();
        if (this.is(';')) this.err(this.peek(), "Sobra un ';' en el for: lleva solo dos", 'for (inicio; condición; paso) — después del paso va ) sin ;');
      }
      this.expect(')', 'del for');
      this.loops++;
      this.breakable++;
      let body: Stmt;
      try {
        body = this.subStatement('for', t);
      } finally {
        this.loops--;
        this.breakable--;
      }
      return { s: 'for', init, c, step, body, ...pos };
    } finally {
      this.scope = saved;
    }
  }

  private switchStmt(t: PTok): Stmt {
    this.next();
    const pos = { line: t.line, col: t.col };
    if (!this.is('(')) this.err(this.peek(), "Falta '(' después de switch", 'switch (opcion) { case 1: ... break; }');
    this.next();
    const x0 = this.expr();
    this.expect(')', 'del switch');
    const x = this.decay(rval(x0));
    if (!isInt(x.type)) {
      this.err(x0, `El switch solo funciona con números enteros o caracteres, no con ${typeName(x.type)}`, x.type.k === 'ptr' ? 'Para comparar textos usa if con strcmp.' : 'Usa if / else if para decimales.');
    }
    const ptype = promote(x.type);
    const xx = this.castTo(x, ptype);
    if (!this.is('{')) this.err(this.peek(), "Después del switch (...) va una llave '{'");
    const open = this.next();
    const ctx: SwitchCtx = { list: [], cases: new Map(), def: -1, type: ptype };
    this.switches.push(ctx);
    this.breakable++;
    const saved = this.scope;
    this.scope = new Scope(saved);
    const savedList = this.curList;
    try {
      this.curList = ctx.list;
      while (!this.is('}')) {
        if (this.peek().t === 'eof') this.err(open, `Falta cerrar la llave '{' del switch (línea ${open.line})`);
        if (this.isTypeStart() && this.isDeclarationAhead()) {
          ctx.list.push(...this.localDecl());
          continue;
        }
        ctx.list.push(this.statement());
      }
      this.next();
    } finally {
      this.curList = savedList;
      this.scope = saved;
      this.switches.pop();
      this.breakable--;
    }
    // aviso de case sin break
    const caseIdx = [...ctx.cases.values(), ctx.def].filter((i) => i >= 0).sort((a, b) => a - b);
    for (let k = 0; k < caseIdx.length - 1; k++) {
      const start = caseIdx[k];
      const end = caseIdx[k + 1];
      const segment = ctx.list.slice(start + 1, end).filter((s) => s.s !== 'case');
      if (segment.length === 0) continue; // case 1: case 2: (agrupados a propósito)
      const last = segment[segment.length - 1];
      if (!endsFlow(last)) {
        const label = ctx.list[end];
        this.warn(label, 'El case anterior no termina en break', 'Sin break, el programa sigue ejecutando también este case. Si no lo quieres, añade break; al final del case anterior.');
      }
    }
    return { s: 'switch', x: xx, body: ctx.list, cases: ctx.cases, def: ctx.def, ...pos };
  }

  private caseLabel(t: PTok): Stmt {
    this.next();
    const ctx = this.switches[this.switches.length - 1];
    if (!ctx) this.err(t, `'${t.v}' solo puede ir dentro de un switch`);
    if (this.curList !== ctx.list) this.err(t, `Este '${t.v}' está dentro de otro bloque del switch`, 'Pon cada case directamente dentro de las llaves del switch.');
    if (t.v === 'default') {
      if (ctx.def >= 0) this.err(t, 'El switch ya tiene un default');
      this.expect(':', 'después de default');
      ctx.def = ctx.list.length;
    } else {
      const x = this.condExpr();
      if (x.e === 'str' || (x.e === 'decay' && x.x.e === 'str')) {
        this.err(x, 'case no funciona con textos ("...")', "Para un carácter usa comillas simples: case 'a':");
      }
      const v = this.constInt(x, "Cada case necesita un valor fijo: un número (case 1:) o un carácter (case 'a':)");
      const cv = convert(v, x.type, ctx.type) as number | bigint;
      if (ctx.cases.has(cv)) this.err(t, `El valor ${v} ya aparece en otro case`);
      if (!this.is(':')) {
        const cur = this.peek();
        this.err(cur.t === 'p' && cur.v === ';' ? cur : this.endOf(this.prev()), "Falta ':' después del valor del case", 'Así: case 1:');
      }
      this.next();
      ctx.cases.set(cv, ctx.list.length);
    }
    return { s: 'case', line: t.line, col: t.col };
  }

  // ───────────────────────── expresiones ─────────────────────────

  private mk(e: { e: Expr['e'] } & Record<string, unknown>, type: CType, pos: Pos, lv = false): Expr {
    return { ...e, type, line: pos.line, col: pos.col, lv } as unknown as Expr;
  }

  private mkConst(v: Value, type: CType, pos: Pos): Expr {
    return { e: 'const', v, type, line: pos.line, col: pos.col };
  }

  expr(): Expr {
    let x = this.assignExpr();
    while (this.is(',')) {
      const t = this.next();
      const b = this.decay(rval(this.assignExpr()));
      x = this.mk({ e: 'comma', a: this.decay(rval(x)), b }, b.type, t);
    }
    return x;
  }

  private assignExpr(): Expr {
    const l = this.condExpr();
    const t = this.peek();
    if (t.t === 'p' && ASSIGN_OPS.has(t.v)) {
      this.next();
      const r = this.assignExpr();
      return this.buildAssign(t.v, l, r, t);
    }
    if (t.t === 'p' && t.v === '=>') this.err(t, "'=>' no existe en C", '¿Querías escribir >= (mayor o igual)?');
    return l;
  }

  private condExpr(): Expr {
    const c = this.binary(0);
    if (!this.is('?')) return c;
    const q = this.next();
    const a = this.expr();
    this.expect(':', 'del operador ternario ? :');
    const b = this.condExpr();
    const cc = this.cond(c, 'operador ?');
    let ra = this.decay(rval(a));
    let rb = this.decay(rval(b));
    let type: CType;
    if (isArith(ra.type) && isArith(rb.type)) {
      type = commonType(ra.type, rb.type);
      ra = this.castTo(ra, type);
      rb = this.castTo(rb, type);
    } else if (ra.type.k === 'void' || rb.type.k === 'void') {
      type = T.void;
    } else if (ra.type.k === 'ptr' && isNullConst(rb)) {
      type = ra.type;
      rb = this.castTo(rb, type);
    } else if (rb.type.k === 'ptr' && isNullConst(ra)) {
      type = rb.type;
      ra = this.castTo(ra, type);
    } else if (ra.type.k === 'ptr' && rb.type.k === 'ptr') {
      type = ra.type.to.k === 'void' ? rb.type : ra.type;
    } else if (ra.type.k === 'struct' && rb.type.k === 'struct' && ra.type.s === rb.type.s) {
      type = ra.type;
    } else {
      this.err(q, `Las dos opciones del ? : tienen tipos que no encajan (${typeName(ra.type)} y ${typeName(rb.type)})`);
    }
    if (cc.e === 'const') return this.isTrue(cc.v) ? ra : rb;
    return this.mk({ e: 'cond', c: cc, a: ra, b: rb }, type, q);
  }

  private isTrue(v: Value): boolean {
    if (typeof v === 'bigint') return v !== 0n;
    if (typeof v === 'number') return v !== 0;
    return !!v && (v as Ptr).a !== 0;
  }

  private binary(minPrec: number): Expr {
    let l = this.unary();
    for (;;) {
      const t = this.peek();
      if (t.t !== 'p') {
        if (t.t === 'id' && (t.v === 'and' || t.v === 'or') && !this.scope.find(t.v)) {
          this.err(t, `En C no se escribe '${t.v}'`, t.v === 'and' ? 'Usa && para "y".' : 'Usa || para "o".');
        }
        break;
      }
      const prec = BIN_PREC[t.v];
      if (!prec || prec <= minPrec) break;
      this.next();
      const r = this.binary(prec);
      l = this.buildBinary(t.v, l, r, t);
    }
    return l;
  }

  private unary(): Expr {
    const t = this.peek();
    if (t.t === 'p') {
      switch (t.v) {
        case '++':
        case '--': {
          this.next();
          const x = this.unary();
          return this.buildIncDec(x, true, t.v === '++', t);
        }
        case '&': {
          this.next();
          const x = this.castExpr();
          return this.buildAddr(x, t);
        }
        case '*': {
          this.next();
          const x = this.castExpr();
          return this.buildDeref(x, t);
        }
        case '+':
        case '-': {
          this.next();
          const x = this.decay(rval(this.castExpr()));
          if (!isArith(x.type)) this.err(t, `No se puede usar '${t.v}' con ${typeName(x.type)}`);
          const pt = promote(x.type);
          const xx = this.castTo(x, pt);
          if (t.v === '+') return xx;
          if (xx.e === 'const') return this.mkConst(arith('-', pt, pt.k === 'int' && pt.size === 8 ? 0n : 0, xx.v), pt, t);
          return this.mk({ e: 'neg', x: xx }, pt, t);
        }
        case '~': {
          this.next();
          const x = this.decay(rval(this.castExpr()));
          if (!isInt(x.type)) this.err(t, `'~' solo funciona con enteros, no con ${typeName(x.type)}`);
          const pt = promote(x.type);
          const xx = this.castTo(x, pt);
          if (xx.e === 'const') {
            return this.mkConst(wrapInt(pt as Extract<CType, { k: 'int' }>, typeof xx.v === 'bigint' ? ~xx.v : ~(xx.v as number)), pt, t);
          }
          return this.mk({ e: 'bitnot', x: xx }, pt, t);
        }
        case '!': {
          this.next();
          const x = this.decay(rval(this.castExpr()));
          if (!isScalar(x.type)) this.err(t, `'!' no se puede usar con ${typeName(x.type)}`);
          if (x.e === 'const') return this.mkConst(this.isTrue(x.v) ? 0 : 1, T.int, t);
          return this.mk({ e: 'not', x }, T.int, t);
        }
        case '(':
          return this.castExpr();
      }
    }
    if (t.t === 'id' && t.v === 'sizeof') {
      this.next();
      let type: CType;
      if (this.is('(') && this.isTypeStart(1)) {
        this.next();
        type = this.typeNameParse();
        this.expect(')', 'del sizeof');
      } else {
        const x = this.unary();
        type = x.type;
        if (x.e === 'var' && x.sym.arrayParam) {
          this.warn(
            t,
            `sizeof(${x.sym.name}) da el tamaño de un puntero (8), no del array`,
            'Un array que llega como parámetro es en realidad un puntero. Pasa el número de elementos como otro parámetro.',
          );
        }
      }
      if (type.k === 'func') this.err(t, 'No se puede usar sizeof con una función');
      if (type.k === 'struct' && !type.s.fields) this.err(t, `El struct '${type.s.tag}' no está completo`);
      if (hasVla(type)) return this.mk({ e: 'vlasize', t: type }, T.ulong, t);
      return this.mkConst(BigInt(sizeOf(type)), T.ulong, t);
    }
    return this.postfix();
  }

  private castExpr(): Expr {
    const t = this.peek();
    if (t.t === 'p' && t.v === '(' && this.isTypeStart(1) && this.isCastAhead()) {
      this.next();
      const type = this.typeNameParse();
      this.expect(')', 'de la conversión de tipo');
      if (this.is('{')) this.err(this.peek(), 'Los literales compuestos (tipo){...} no están soportados');
      const x = this.castExpr();
      return this.buildCast(x, type, t);
    }
    if (t.t === 'p' && t.v === '(') {
      // paréntesis normal: lo maneja primary a través de postfix
      return this.postfix();
    }
    return this.unary();
  }

  private isCastAhead(): boolean {
    // (nombre_typedef) solo es un cast si el nombre es un tipo
    const t = this.peek(1);
    return TYPE_WORDS.has(t.v) || QUALIFIERS.has(t.v) || this.isTypedefName(t.v);
  }

  private postfix(): Expr {
    let x = this.primary();
    for (;;) {
      const t = this.peek();
      if (t.t !== 'p') {
        if (t.t === 'str' && (x.e === 'fn' || x.e === 'var')) {
          this.err(t, `Falta '(' entre ${x.e === 'fn' ? x.fn.name : 'el nombre'} y el texto`, `Así: ${x.e === 'fn' ? x.fn.name : 'printf'}("texto");`);
        }
        break;
      }
      if (t.v === '[') {
        this.next();
        const i = this.expr();
        this.expect(']', 'del índice');
        x = this.buildIndex(x, i, t);
        continue;
      }
      if (t.v === '(') {
        this.next();
        x = this.buildCall(x, t);
        continue;
      }
      if (t.v === '.' || t.v === '->') {
        this.next();
        const name = this.peek();
        if (name.t !== 'id') this.err(name, `Después de '${t.v}' va el nombre de un campo`);
        this.next();
        x = this.buildMember(x, name.v, t.v === '->', t, name);
        continue;
      }
      if (t.v === '++' || t.v === '--') {
        this.next();
        x = this.buildIncDec(x, false, t.v === '++', t);
        continue;
      }
      break;
    }
    return x;
  }

  private primary(): Expr {
    const t = this.peek();
    switch (t.t) {
      case 'num':
      case 'char':
        this.next();
        return this.mkConst(t.num!, t.numType!, t);
      case 'str': {
        this.next();
        const bytes = [...t.bytes!];
        while (this.peek().t === 'str') bytes.push(...this.next().bytes!);
        bytes.push(0);
        return this.mk({ e: 'str', sid: this.internString(bytes) }, arrayOf(T.char, bytes.length), t, true);
      }
      case 'p':
        if (t.v === '(') {
          this.next();
          if (this.is(')')) this.err(this.peek(), 'Paréntesis vacíos: falta lo de dentro');
          const x = this.expr();
          this.expect(')');
          return { ...x, paren: true };
        }
        if (t.v === '{') this.err(t, "No esperaba '{' aquí", 'Las llaves con valores solo se pueden usar al declarar: int v[3] = {1, 2, 3};');
        if (t.v === ';') this.err(t, "Falta un valor antes del ';'");
        if (t.v === ')') this.err(t, "Sobra el paréntesis ')' o falta algo antes", 'Cuenta los paréntesis: cada ( necesita su ).');
        if (t.v === '#') this.err(t, "Las líneas con # (como #include) van al principio de la línea", 'Pon #include y #define cada uno en su propia línea, al principio del programa.');
        if (t.v === '=') this.err(t, "Falta lo que va a la izquierda del '='", '¿Querías escribir == para comparar?');
        this.err(t, `No esperaba ${this.describe(t)} aquí`);
        break;
      case 'id': {
        if (t.v === 'true' || t.v === 'false') {
          this.next();
          return this.mkConst(t.v === 'true' ? 1 : 0, T.int, t);
        }
        if (t.v === 'nullptr' && !this.scope.find('nullptr')) {
          this.next();
          return this.mkConst(NULLPTR, ptrTo(T.void), t);
        }
        if (KEYWORDS.has(t.v)) {
          if (TYPE_WORDS.has(t.v)) {
            this.err(t, `No esperaba el tipo '${t.v}' aquí`, 'Los tipos solo se escriben al declarar una variable. Para usar la variable, escribe solo su nombre.');
          }
          this.err(t, `No esperaba '${t.v}' aquí`);
        }
        this.next();
        const sym = this.scope.find(t.v);
        if (!sym) return this.undeclared(t);
        switch (sym.kind) {
          case 'var':
            sym.used = true;
            return this.mk({ e: 'var', sym }, sym.type, t, true);
          case 'func':
            sym.used = true;
            return this.mk({ e: 'fn', fn: sym }, sym.type, t);
          case 'enumconst':
            return this.mkConst(sym.value, T.int, t);
          case 'typedef':
            this.err(t, `'${t.v}' es un tipo, no una variable`);
        }
        break;
      }
      case 'eof':
        this.err(this.endOf(this.prev()), 'El programa se acaba a mitad de una instrucción', '¿Falta cerrar algún paréntesis o llave?');
        break;
    }
    this.err(t, `No esperaba ${this.describe(t)} aquí`);
  }

  private undeclared(t: PTok): never {
    const name = t.v;
    const header = FUNCTION_HEADER[name];
    if (header && !this.includes.has(header)) {
      this.err(t, `'${name}' no está declarada: falta #include <${header}>`, `Añade #include <${header}> al principio del programa.`);
    }
    if (CPP_NAMES[name]) this.err(t, `'${name}' no existe en C`, CPP_NAMES[name]);
    // ¿se define más abajo?
    if (this.is('(')) {
      for (let k = this.p; k < this.toks.length - 2; k++) {
        const a = this.toks[k];
        if (a.t === 'id' && a.v === name && this.toks[k + 1].v === '(' && k > 0 && (TYPE_WORDS.has(this.toks[k - 1].v) || this.toks[k - 1].v === '*')) {
          this.err(
            t,
            `La función '${name}' se usa antes de declararla`,
            `C lee el programa de arriba abajo. Pon el prototipo (la primera línea de la función terminada en ;) antes de usarla, o mueve la función ${name} encima de main.`,
          );
        }
      }
    }
    const sug = closest(name, [...this.scope.allNames(), ...Object.keys(FUNCTION_HEADER).filter((n) => this.includes.has(FUNCTION_HEADER[n]))]);
    if (this.is('(')) {
      this.err(t, `La función '${name}' no existe`, sug ? `¿Querías decir '${sug}'?` : 'Comprueba cómo está escrita: C distingue mayúsculas y minúsculas.');
    }
    this.err(
      t,
      `'${name}' no está declarada`,
      sug ? `¿Querías decir '${sug}'?` : `Antes de usar una variable hay que declararla con su tipo: int ${name};`,
    );
  }

  private internString(bytes: number[]): number {
    const key = bytes.join(',');
    const ex = this.stringIds.get(key);
    if (ex !== undefined) return ex;
    const id = this.strings.length;
    this.strings.push({ bytes, addr: 0 });
    this.stringIds.set(key, id);
    return id;
  }

  // ───────────────────────── semántica ─────────────────────────

  /** Array → puntero al primer elemento; función → puntero a función. */
  private decay(x: Expr): Expr {
    if (x.type.k === 'array') {
      markAddr(x);
      return this.mk({ e: 'decay', x }, ptrTo(x.type.of), x);
    }
    if (x.type.k === 'func') return this.mk({ e: 'decay', x }, ptrTo(x.type), x);
    return x;
  }

  private castTo(x: Expr, to: CType): Expr {
    const from = x.type;
    if (to.k === 'void') return this.mk({ e: 'cast', x }, T.void, x);
    if (sameType(unqual(from), unqual(to)) && from.k !== 'array' && from.k !== 'func') {
      return x.type === to ? x : { ...x, type: to };
    }
    if (x.e === 'const' && isScalar(to) && (isScalar(from) || from.k === 'int')) {
      const r = this.mkConst(convert(x.v, from, to), to, x);
      if (this.intDiv.has(x)) this.intDiv.add(r);
      return r;
    }
    const r = this.mk({ e: 'cast', x }, to, x);
    if (this.intDiv.has(x)) this.intDiv.add(r);
    return r;
  }

  private buildCast(x0: Expr, to: CType, pos: Pos): Expr {
    const x = this.decay(rval(x0));
    if (to.k === 'void') return this.mk({ e: 'cast', x }, T.void, pos);
    if (to.k === 'struct' || to.k === 'array') this.err(pos, `No se puede convertir a ${typeName(to)}`);
    if (!isScalar(x.type)) this.err(pos, `No se puede convertir ${typeName(x.type)} a ${typeName(to)}`);
    if (isArith(to) && x.type.k === 'ptr' && to.k === 'float') this.err(pos, 'No se puede convertir un puntero a decimal');
    if (to.k === 'ptr' && x.type.k === 'float') this.err(pos, 'No se puede convertir un decimal a puntero');
    if (to.k === 'float' && this.intDiv.has(x)) {
      this.warn(pos, 'Conviertes a decimal el resultado de una división entera', 'Primero se hace la división entera (7/2 = 3) y luego se convierte (3.0). Convierte antes de dividir: (float)a / b');
    }
    const r = this.castTo(x, unqual(to));
    return { ...r, line: pos.line, col: pos.col };
  }

  /** Conversión implícita al asignar, inicializar, pasar argumentos o devolver. */
  private assignConv(x0: Expr, to0: CType, what: string): Expr {
    const to = unqual(to0);
    if (x0.type.k === 'void') this.err(x0, `Esto no da ningún valor (es void): no se puede guardar en ${what}`, 'Las funciones void no devuelven nada.');
    const x = this.decay(rval(x0));
    const from = x.type;
    if (isArith(to)) {
      if (isArith(from)) {
        if (to.k === 'float' && this.intDiv.has(x)) {
          this.warn(x, 'División entera: se pierden los decimales', 'Si los dos números son enteros, / da un entero (7/2 = 3). Para tener decimales convierte uno: (float)a / b, o usa 2.0 en vez de 2.');
        }
        if (to.k === 'int' && from.k === 'float' && x.e === 'const' && Number.isFinite(x.v as number) && (x.v as number) % 1 !== 0) {
          this.warn(x, `${what} es entera: el ${x.v} se guardará como ${Math.trunc(x.v as number)}`, 'Para guardar decimales usa float o double.');
        }
        if (to.k === 'int' && to.size === 1 && to.name !== 'bool' && from.k === 'int' && x.e === 'const' && typeof x.v === 'number' && (x.v > 255 || x.v < -128)) {
          this.warn(x, `El valor ${x.v} no cabe en un char (de -128 a 127)`);
        }
        return this.castTo(x, to);
      }
      if (from.k === 'ptr') {
        if (x0.e === 'str' && isCharLike(to)) {
          this.err(x0, `Las comillas dobles son para textos; para un solo carácter usa comillas simples`, `Escribe '${String.fromCharCode(...this.strings[x0.sid].bytes.slice(0, -1)).slice(0, 1) || 'a'}' en vez de ${tokText(x0, this.srcLines)}.`);
        }
        if (x0.e === 'str') this.err(x0, `No se puede guardar un texto en ${what} (es ${typeName(to)})`, 'Para guardar texto hace falta un array de char: char nombre[50];');
        if (to.k === 'int' && to.name === 'bool') return this.castTo(x, to);
        this.err(x0, `No se puede guardar una dirección (${typeName(from)}) en ${what}, que es ${typeName(to)}`, x0.e === 'decay' ? 'Es un array: para un elemento concreto usa corchetes, por ejemplo v[0].' : '¿Te sobra un & o te falta un * delante?');
      }
      this.err(x0, `No se puede guardar ${typeName(from)} en ${what} (es ${typeName(to)})`);
    }
    if (to.k === 'ptr') {
      if (isNullConst(x)) return this.castTo(x, to);
      if (from.k === 'ptr') {
        const a = unqual(to.to);
        const b = unqual(from.to);
        if (a.k === 'void' || b.k === 'void' || sameType(a, b)) {
          if (from.to.c && !to.to.c && x0.e !== 'str' && !(x0.e === 'decay' && x0.x.e === 'str')) {
            this.warn(x0, `${what} pierde el const del puntero`);
          }
          return this.castTo(x, to);
        }
        if (a.k === 'int' && b.k === 'int' && a.size === b.size) {
          this.warn(x0, `Tipos de puntero distintos: ${typeName(from)} y ${typeName(to)}`);
          return this.castTo(x, to);
        }
        this.err(x0, `Tipos de puntero incompatibles: ${what} es ${typeName(to)} y le das ${typeName(from)}`, from.to.k === 'array' ? 'Con & delante de un array obtienes un puntero al array entero; sin & ya es un puntero a su primer elemento.' : undefined);
      }
      if (isInt(from)) {
        this.err(
          x0,
          `No se puede guardar un número en ${what}, que es un puntero (${typeName(to)})`,
          x0.e === 'var' ? `Un puntero guarda direcciones. Para la dirección de una variable usa &: &${x0.sym.name}` : 'Un puntero guarda direcciones de memoria, no números.',
        );
      }
      this.err(x0, `No se puede guardar ${typeName(from)} en ${what} (es ${typeName(to)})`);
    }
    if (to.k === 'struct') {
      if (from.k === 'struct' && from.s === to.s) return x;
      this.err(x0, `No se puede guardar ${typeName(from)} en ${what} (es ${typeName(to)})`);
    }
    if (to.k === 'array') this.err(x0, `No se puede asignar a un array completo (${what})`);
    this.err(x0, `No se puede convertir ${typeName(from)} en ${typeName(to)}`);
  }

  private tryConst(x: Expr): number | bigint | null {
    if (x.e === 'const' && (typeof x.v === 'number' || typeof x.v === 'bigint')) return x.v;
    return null;
  }

  private constInt(x0: Expr, msg: string, pos: Pos = x0): number | bigint {
    const x = rval(x0);
    const v = this.tryConst(x);
    if (v === null || !isInt(x.type)) this.err(pos, msg);
    return v!;
  }

  private checkModifiable(x: Expr, op: string, pos: Pos): void {
    if (x.e === 'const' || x.e === 'str') {
      const t = this.toks[this.p - 1];
      void t;
      this.err(pos, `No se puede cambiar el valor de una constante`, op === '=' ? 'A la izquierda del = tiene que ir una variable: variable = valor;' : undefined);
    }
    if (!x.lv) {
      if (op === '=') {
        if (x.e === 'cmp' || x.e === 'arith') {
          this.err(pos, 'A la izquierda del = tiene que ir una variable', 'Lo que se guarda va a la izquierda: resultado = a + b; ¿o querías comparar con ==?');
        }
        if (x.e === 'call') this.err(pos, 'No se puede asignar a lo que devuelve una función');
        this.err(pos, 'A la izquierda del = tiene que ir una variable', 'Ejemplo: x = 5;');
      }
      this.err(pos, `'${op}' solo se puede usar con variables`);
    }
    if (x.type.k === 'array') {
      this.err(pos, 'No se puede asignar a un array completo', isCharLike(x.type.of) ? 'Para copiar un texto en un array de char usa strcpy(destino, "texto"); de <string.h>.' : 'Copia los elementos uno a uno con un bucle for.');
    }
    if (x.type.k === 'func') this.err(pos, 'No se puede asignar a una función');
    if (x.type.c) {
      const name = x.e === 'var' ? `'${x.sym.name}'` : 'este valor';
      this.err(pos, `No se puede cambiar ${name} porque es const`, 'Las variables const no cambian después de darles su valor inicial.');
    }
    if (x.type.k === 'struct' && x.type.s.fields?.some((f) => f.type.c)) {
      this.err(pos, 'El struct tiene campos const y no se puede asignar entero');
    }
    if (x.e === 'var') x.sym.assigned = true;
  }

  private buildAssign(op: string, l: Expr, r: Expr, t: PTok): Expr {
    this.checkModifiable(l, op, t);
    if (op === '=') {
      if (l.type.k === 'struct') {
        const rr = rval(r);
        if (rr.type.k !== 'struct' || rr.type.s !== l.type.s) this.err(t, `No se puede guardar ${typeName(rr.type)} en un ${typeName(l.type)}`);
        return this.mk({ e: 'assign', l, r: rr }, l.type, t);
      }
      const what = l.e === 'var' ? `la variable '${l.sym.name}'` : 'este sitio';
      const rr = this.assignConv(r, l.type, what);
      return this.mk({ e: 'assign', l, r: rr }, unqual(l.type), t);
    }
    const aop = op.slice(0, -1) as ArithOpName;
    const rr = this.decay(rval(r));
    if (l.type.k === 'ptr' && (aop === '+' || aop === '-')) {
      if (!isInt(rr.type)) this.err(t, `A un puntero solo se le pueden sumar o restar enteros`);
      if (l.type.to.k === 'void' || l.type.to.k === 'func') this.err(t, 'No se puede hacer aritmética con este puntero');
      return this.mk({ e: 'opassign', op: aop, l, r: this.castTo(rr, T.long), ct: l.type }, l.type, t);
    }
    if (!isArith(l.type) || !isArith(rr.type)) {
      this.err(t, `No se puede usar '${op}' con ${typeName(l.type)} y ${typeName(rr.type)}`);
    }
    if ((aop === '%' || aop === '<<' || aop === '>>' || aop === '&' || aop === '|' || aop === '^') && (!isInt(l.type) || !isInt(rr.type))) {
      this.err(t, `'${op}' solo funciona con enteros`, aop === '%' ? 'Para el resto con decimales usa fmod() de <math.h>.' : undefined);
    }
    const ct = aop === '<<' || aop === '>>' ? promote(l.type) : commonType(l.type, rr.type);
    if (aop === '/' || aop === '%') {
      if (rr.e === 'const' && isInt(rr.type) && Number(rr.v) === 0) this.err(t, 'División entre cero', 'No se puede dividir entre 0.');
    }
    return this.mk({ e: 'opassign', op: aop, l, r: this.castTo(rr, ct), ct }, unqual(l.type), t);
  }

  private buildIncDec(x: Expr, pre: boolean, inc: boolean, t: PTok): Expr {
    const op = inc ? '++' : '--';
    if (!x.lv) this.err(t, `'${op}' solo se puede usar con variables`, x.e === 'const' ? 'Un número fijo no se puede incrementar.' : undefined);
    this.checkModifiable(x, op, t);
    if (!isScalar(x.type)) this.err(t, `No se puede usar '${op}' con ${typeName(x.type)}`);
    if (x.type.k === 'ptr' && (x.type.to.k === 'void' || x.type.to.k === 'func')) this.err(t, `No se puede usar '${op}' con este puntero`);
    if (x.e === 'var') x.sym.used = true;
    return this.mk({ e: 'incdec', x, pre, inc }, unqual(x.type), t);
  }

  private buildAddr(x: Expr, t: PTok): Expr {
    if (x.e === 'fn') return this.mk({ e: 'decay', x }, ptrTo(x.type), t);
    if (!x.lv) {
      if (x.e === 'const') this.err(t, "No se puede usar & con un número", '& da la dirección de una variable: &x');
      this.err(t, "'&' solo se puede usar con variables", '& da la dirección de memoria de una variable: &x');
    }
    if (x.e === 'member' && x.f.type.k === 'void') this.err(t, 'dirección no válida');
    markAddr(x);
    return this.mk({ e: 'addr', x }, ptrTo(x.type), t);
  }

  private buildDeref(x0: Expr, t: PTok): Expr {
    const x = this.decay(rval(x0));
    if (x.type.k !== 'ptr') {
      this.err(t, `'*' solo se puede usar con punteros y ${x0.e === 'var' ? `'${x0.sym.name}'` : 'esto'} es ${typeName(x.type)}`, x0.e === 'var' ? 'Si querías multiplicar, falta lo de la izquierda del *.' : undefined);
    }
    const to = x.type.to;
    if (to.k === 'void') this.err(t, "No se puede usar '*' con un void*", 'Primero conviértelo al tipo correcto: *(int *)p');
    if (to.k === 'func') return x;
    if (to.k === 'struct' && !to.s.fields) this.err(t, `El struct '${to.s.tag}' no está completo`);
    return this.mk({ e: 'deref', x }, to, t, true);
  }

  private buildIndex(a0: Expr, i0: Expr, t: PTok): Expr {
    let a = a0;
    let i = i0;
    const ar = rval(a);
    const ir = rval(i);
    if (isInt(ar.type) && (ir.type.k === 'array' || ir.type.k === 'ptr')) {
      [a, i] = [i, a];
    }
    const idx = this.decay(rval(i));
    if (!isInt(idx.type)) {
      this.err(i0, `El índice de un array tiene que ser un número entero, no ${typeName(idx.type)}`, idx.type.k === 'float' ? 'Convierte el índice a int: v[(int)x]' : undefined);
    }
    const ii = this.castTo(idx, T.long);
    if (a.type.k === 'array') {
      const len = a.type.len;
      if (ii.e === 'const' && len !== null) {
        const n = Number(ii.v);
        if (n < 0 || n >= len) {
          const name = a.e === 'var' ? `'${a.sym.name}'` : 'el array';
          this.warn(t, `El índice ${n} se sale de ${name}: tiene ${len} elementos (del 0 al ${len - 1})`, 'En C los arrays empiezan en 0: el último elemento de un array de N es el N-1.');
        }
      }
      if (a.e === 'var') a.sym.used = true;
      return this.mk({ e: 'index', a, i: ii, viaPtr: false }, a.type.of, t, true);
    }
    const p = this.decay(rval(a));
    if (p.type.k !== 'ptr') {
      const name = a.e === 'var' ? `'${a.sym.name}'` : 'Esto';
      this.err(t, `${name} no es un array: no se puede usar [ ]`, a.e === 'var' ? `${a.sym.name} es ${typeName(a.type)}. Los corchetes solo se usan con arrays, punteros y cadenas.` : undefined);
    }
    if (p.type.to.k === 'void') this.err(t, 'No se puede usar [ ] con un void*');
    if (p.type.to.k === 'func') this.err(t, 'No se puede usar [ ] con un puntero a función');
    return this.mk({ e: 'index', a: p, i: ii, viaPtr: true }, p.type.to, t, true);
  }

  private buildMember(x0: Expr, name: string, arrow: boolean, t: PTok, nameTok: PTok): Expr {
    let x = x0;
    if (arrow) {
      const p = this.decay(rval(x0));
      if (p.type.k !== 'ptr' || p.type.to.k !== 'struct') {
        if (x0.type.k === 'struct') this.err(t, `'->' es para punteros; ${x0.e === 'var' ? x0.sym.name : 'esto'} es un struct: usa '.'`, `Escribe ${x0.e === 'var' ? x0.sym.name : 'x'}.${name}`);
        this.err(t, `'->' solo se usa con punteros a struct, y esto es ${typeName(p.type)}`);
      }
      x = this.mk({ e: 'deref', x: p }, p.type.to, t, true);
    } else if (x.type.k !== 'struct') {
      if (x.type.k === 'ptr' && x.type.to.k === 'struct') {
        this.err(t, `${x0.e === 'var' ? `'${x0.sym.name}'` : 'Esto'} es un puntero a struct: usa '->' en vez de '.'`, `Escribe ${x0.e === 'var' ? x0.sym.name : 'p'}->${name}`);
      }
      this.err(t, `'.' solo se usa con structs, y ${x0.e === 'var' ? `'${x0.sym.name}'` : 'esto'} es ${typeName(x.type)}`);
    }
    const st = x.type as Extract<CType, { k: 'struct' }>;
    if (!st.s.fields) this.err(t, `El struct '${st.s.tag}' no está completo`);
    const f = st.s.fields!.find((ff) => ff.name === name);
    if (!f) {
      const sug = closest(name, st.s.fields!.map((ff) => ff.name));
      this.err(nameTok, `${typeName(st)} no tiene ningún campo llamado '${name}'`, sug ? `¿Querías decir '${sug}'?` : `Sus campos son: ${st.s.fields!.map((ff) => ff.name).join(', ')}`);
    }
    if (x.e === 'var') x.sym.used = true;
    let type = f!.type;
    if (x.type.c) type = withConst(type);
    return this.mk({ e: 'member', x, f: f! }, type, nameTok, x.lv !== false || x.e === 'deref');
  }

  private buildCall(f0: Expr, open: PTok): Expr {
    let ftype: Extract<CType, { k: 'func' }>;
    let fname: string;
    let f: Expr;
    if (f0.e === 'fn') {
      ftype = f0.fn.type;
      fname = f0.fn.name;
      f = f0;
      if (this.inGlobalInit) this.err(f0, 'No se puede llamar a una función para dar valor a una variable global', 'Dale el valor dentro de main.');
    } else {
      const p = this.decay(rval(f0));
      if (p.type.k === 'ptr' && p.type.to.k === 'func') {
        ftype = p.type.to;
        fname = f0.e === 'var' ? f0.sym.name : 'la función';
        f = p;
      } else {
        const name = f0.e === 'var' ? `'${f0.sym.name}'` : 'Esto';
        this.err(
          open,
          `${name} no es una función`,
          f0.e === 'var' ? `${f0.sym.name} es una variable (${typeName(f0.type)}). ¿Falta un operador, como * para multiplicar: ${f0.sym.name} * (...)?` : undefined,
        );
      }
    }
    const args: Expr[] = [];
    if (!this.is(')')) {
      for (;;) {
        if (this.is(')')) this.err(this.peek(), 'Sobra una coma antes de )');
        args.push(this.assignExpr());
        if (!this.accept(',')) break;
      }
    }
    if (!this.is(')')) {
      const cur = this.peek();
      if (cur.t === 'str' || cur.t === 'id' || cur.t === 'num') {
        this.err(cur, `Falta una coma entre los valores de ${fname}(...)`, 'Los valores se separan con comas: printf("%d %d", a, b);');
      }
      this.expect(')', `de la llamada a ${fname}`);
    }
    this.next();
    const params = ftype.params;
    if (ftype.noProto && args.length > 0 && f0.e === 'fn' && !f0.fn.builtin) {
      this.err(open, `La función '${fname}' no tiene parámetros y le pasas ${args.length}`, `Si tiene que recibir valores, decláralos: ${typeName(ftype.ret)} ${fname}(int a)`);
    }
    if (!ftype.noProto) {
      const sig = `${typeName(ftype.ret)} ${fname}(${params.map(typeName).join(', ')}${ftype.variadic ? ', ...' : ''})`;
      if (args.length < params.length) {
        this.err(open, `A '${fname}' le faltan valores: necesita ${params.length} y le pasas ${args.length}`, `La función es: ${sig}`);
      }
      if (args.length > params.length && !ftype.variadic) {
        this.err(open, `A '${fname}' le sobran valores: necesita ${params.length} y le pasas ${args.length}`, `La función es: ${sig}`);
      }
    }
    const conv: Expr[] = args.map((a, i) => {
      if (i < params.length) {
        const pt = params[i];
        if (pt.k === 'struct') {
          const r = rval(a);
          if (r.type.k !== 'struct' || r.type.s !== pt.s) this.err(a, `El valor ${i + 1} de '${fname}' tiene que ser ${typeName(pt)}`);
          return r;
        }
        return this.assignConv(a, pt, `el valor ${i + 1} de '${fname}'`);
      }
      // argumentos variables: promociones por defecto
      if (a.type.k === 'void') this.err(a, `El valor ${i + 1} de '${fname}' no es nada (void)`);
      const r = this.decay(rval(a));
      if (r.type.k === 'float' && r.type.size === 4) return this.castTo(r, T.double);
      if (isInt(r.type) && r.type.size < 4) return this.castTo(r, T.int);
      return r;
    });
    if (f0.e === 'fn' && f0.fn.builtin) this.checkBuiltinCall(f0.fn.name, conv, args, open);
    let tmp: VarSym | null = null;
    if (ftype.ret.k === 'struct') {
      if (!this.fn) this.err(open, 'No se puede llamar a una función aquí');
      tmp = this.newVar(`(resultado de ${fname})`, ftype.ret, 'local', open);
      tmp.hidden = true;
      tmp.addrTaken = true;
      this.fn!.locals.push(tmp);
    }
    if (ftype.ret.k === 'struct' && !ftype.ret.s.fields) this.err(open, `El struct '${ftype.ret.s.tag}' no está completo`);
    return this.mk({ e: 'call', f, args: conv, tmp, fname }, unqual(ftype.ret), open, ftype.ret.k === 'struct');
  }

  private buildBinary(op: string, l0: Expr, r0: Expr, t: PTok): Expr {
    const l = this.decay(rval(l0));
    const r = this.decay(rval(r0));
    const lt = l.type;
    const rt = r.type;
    const bad = (): never => {
      if (l0.e === 'str' || r0.e === 'str') {
        if (op === '+') this.err(t, 'En C no se pueden sumar textos con +', 'Para unir textos usa strcat (de <string.h>) o escribe varias cosas en el mismo printf: printf("%s %s", a, b);');
      }
      if (lt.k === 'void' || rt.k === 'void') this.err(t, `No se puede operar con algo que no da valor (void)`, 'Las funciones void no devuelven nada.');
      this.err(t, `No se puede usar '${op}' entre ${typeName(lt)} y ${typeName(rt)}`);
    };
    switch (op) {
      case '+':
      case '-': {
        if (isArith(lt) && isArith(rt)) return this.arithNode(op, l, r, t);
        if (op === '+' && lt.k === 'ptr' && isInt(rt)) return this.ptrAdd(l, r, false, t);
        if (op === '+' && isInt(lt) && rt.k === 'ptr') return this.ptrAdd(r, l, false, t);
        if (op === '-' && lt.k === 'ptr' && isInt(rt)) return this.ptrAdd(l, r, true, t);
        if (op === '-' && lt.k === 'ptr' && rt.k === 'ptr') {
          if (!sameType(unqual(lt.to), unqual(rt.to))) this.err(t, 'Solo se pueden restar punteros del mismo tipo');
          const size = sizeOf(lt.to);
          if (size === 0) this.err(t, 'No se pueden restar estos punteros');
          return this.mk({ e: 'pdiff', l, r, size }, T.long, t);
        }
        return bad();
      }
      case '*':
      case '/':
        if (isArith(lt) && isArith(rt)) return this.arithNode(op, l, r, t);
        return bad();
      case '%':
        if (isInt(lt) && isInt(rt)) return this.arithNode(op, l, r, t);
        if (isArith(lt) && isArith(rt)) this.err(t, "El operador % (resto) solo funciona con enteros", 'Para el resto con decimales usa fmod(a, b) de <math.h>.');
        return bad();
      case '<<':
      case '>>':
      case '&':
      case '|':
      case '^':
        if (isInt(lt) && isInt(rt)) return this.arithNode(op, l, r, t);
        if (op === '^' && isArith(lt) && isArith(rt)) this.err(t, "'^' no es la potencia en C", 'Para potencias usa pow(base, exponente) de <math.h>.');
        if (isArith(lt) && isArith(rt)) this.err(t, `'${op}' solo funciona con enteros`);
        return bad();
      case '&&':
      case '||': {
        if (!isScalar(lt) || !isScalar(rt)) return bad();
        if (l.e === 'const' && r.e === 'const') {
          const a = this.isTrue(l.v);
          const b = this.isTrue(r.v);
          return this.mkConst(op === '&&' ? (a && b ? 1 : 0) : a || b ? 1 : 0, T.int, t);
        }
        if (l0.e === 'assign' && !l0.paren) this.warn(l0, 'Hay una asignación (=) dentro de una condición', 'Para comparar se usa ==.');
        if (r0.e === 'assign' && !r0.paren) this.warn(r0, 'Hay una asignación (=) dentro de una condición', 'Para comparar se usa ==.');
        return this.mk({ e: 'logic', op, l, r }, T.int, t);
      }
      default: {
        // comparaciones
        const cop = op as CmpOpName;
        if ((cop === '<' || cop === '>' || cop === '<=' || cop === '>=') && l0.e === 'cmp' && !l0.paren && (l0.op === '<' || l0.op === '>' || l0.op === '<=' || l0.op === '>=')) {
          this.warn(t, 'En C, "a < b < c" no funciona como en matemáticas', 'Primero se calcula a < b (que da 0 o 1) y luego se compara con c. Escríbelo así: a < b && b < c');
        }
        if (isArith(lt) && isArith(rt)) {
          const ct = commonType(lt, rt);
          const a = this.castTo(l, ct);
          const b = this.castTo(r, ct);
          if (a.e === 'const' && b.e === 'const') return this.mkConst(compare(cop, a.v, b.v), T.int, t);
          if (isCharLike(lt) && r0.e === 'const' && r0.type.k === 'int' && typeof r0.v === 'number' && r0.v > 127 && (cop === '==' || cop === '!=')) {
            this.warn(t, `Un char nunca vale ${r0.v}`, 'Los char van de -128 a 127.');
          }
          return this.mk({ e: 'cmp', op: cop, l: a, r: b }, T.int, t);
        }
        if (lt.k === 'ptr' && rt.k === 'ptr') {
          const strLike = (x: Expr) => x.e === 'decay' && (x.x.e === 'str' || (x.x.type.k === 'array' && isCharLike(x.x.type.of)));
          if ((cop === '==' || cop === '!=') && isCharLike(lt.to) && isCharLike(rt.to) && (strLike(l) || strLike(r))) {
            this.warn(t, 'Así no se comparan textos: == compara direcciones de memoria, no las letras', 'Para comparar el contenido de dos cadenas usa strcmp(a, b) == 0 (de <string.h>).');
          }
          if (!sameType(unqual(lt.to), unqual(rt.to)) && lt.to.k !== 'void' && rt.to.k !== 'void') {
            this.warn(t, `Comparas punteros de tipos distintos (${typeName(lt)} y ${typeName(rt)})`);
          }
          return this.mk({ e: 'cmp', op: cop, l, r }, T.int, t);
        }
        if (lt.k === 'ptr' && isNullConst(r)) return this.mk({ e: 'cmp', op: cop, l, r: this.castTo(r, lt) }, T.int, t);
        if (rt.k === 'ptr' && isNullConst(l)) return this.mk({ e: 'cmp', op: cop, l: this.castTo(l, rt), r }, T.int, t);
        if ((lt.k === 'ptr' && isInt(rt)) || (isInt(lt) && rt.k === 'ptr')) {
          const strSide = l0.e === 'str' ? l0 : r0.e === 'str' ? r0 : null;
          if (strSide) {
            this.err(t, 'Comparas un carácter con un texto entre comillas dobles', "Para un solo carácter usa comillas simples: c == 'a'");
          }
          this.err(t, `Comparas un puntero con un número (${typeName(lt)} y ${typeName(rt)})`);
        }
        return bad();
      }
    }
  }

  private arithNode(op: string, l: Expr, r: Expr, t: PTok): Expr {
    const aop = op as ArithOpName;
    const ct = aop === '<<' || aop === '>>' ? promote(l.type) : commonType(l.type, r.type);
    const a = this.castTo(l, ct);
    const b = this.castTo(r, ct);
    if ((aop === '/' || aop === '%') && isInt(ct) && b.e === 'const' && Number(b.v) === 0) {
      this.err(t, 'División entre cero', aop === '%' ? 'El resto de dividir entre 0 no existe.' : 'No se puede dividir entre 0.');
    }
    if (aop === '^' && l.e === 'const' && Number(l.v) === 2) {
      this.warn(t, "'^' no es la potencia en C: es el XOR de bits", 'Para potencias usa pow(base, exponente) de <math.h>, o multiplica: x * x.');
    }
    let res: Expr;
    if (a.e === 'const' && b.e === 'const') {
      try {
        res = this.mkConst(arith(aop, ct, a.v, b.v), ct, t);
      } catch (e) {
        if (e instanceof DivZero) this.err(t, 'División entre cero');
        throw e;
      }
    } else res = this.mk({ e: 'arith', op: aop, l: a, r: b }, ct, t);
    if (aop === '/' && isInt(ct)) this.intDiv.add(res);
    return res;
  }

  private ptrAdd(p: Expr, i: Expr, neg: boolean, t: PTok): Expr {
    const pt = p.type as Extract<CType, { k: 'ptr' }>;
    if (pt.to.k === 'func') this.err(t, 'No se puede sumar a un puntero a función');
    if (pt.to.k === 'struct' && !pt.to.s.fields) this.err(t, 'No se puede hacer aritmética con un puntero a un struct incompleto');
    return this.mk({ e: 'padd', p, i: this.castTo(i, T.long), neg }, pt, t);
  }

  // ───────── comprobaciones de printf/scanf ─────────

  private checkBuiltinCall(name: string, args: Expr[], raw: Expr[], pos: Pos): void {
    const fmtIndex: Record<string, number> = { printf: 0, scanf: 0, fprintf: 1, fscanf: 1, sprintf: 1, sscanf: 1, snprintf: 2 };
    if (name === 'gets') {
      this.warn(pos, 'gets es peligrosa y ya no existe en el C moderno', 'Usa fgets(texto, tamaño, stdin), que no se sale del array.');
    }
    if (name === 'strrev' || name === 'strupr' || name === 'strlwr') {
      this.warn(pos, `${name} no es estándar: solo existe en algunos compiladores de Windows`, 'Aquí funciona, pero en otros compiladores puede que no. Es buen ejercicio escribirla tú.');
    }
    if (name === 'fflush' && raw[0]?.e === 'var' && raw[0].sym.name === 'stdin') {
      this.warn(pos, 'fflush(stdin) no es C estándar', 'Solo funciona en Windows. Para descartar el resto de la línea: while (getchar() != \'\\n\');');
    }
    if (name === 'getch' || name === 'getche' || name === 'clrscr') {
      this.warn(pos, `${name} es de <conio.h>, que solo existe en Windows`, 'Aquí funciona, pero no es C estándar.');
    }
    if (name === 'system' && raw[0]) {
      const s = strOf(raw[0], this.strings);
      if (s !== null && !/^(pause|cls|clear)$/i.test(s.trim())) {
        this.warn(pos, `system("${s}") no hace nada en esta web`);
      }
    }
    const fi = fmtIndex[name];
    if (fi === undefined) return;
    const fmtArg = raw[fi];
    if (!fmtArg) return;
    const fmt = strOf(fmtArg, this.strings);
    if (fmt === null) {
      if (fmtArg.type.k === 'int' || isArith(fmtArg.type)) {
        this.err(
          fmtArg,
          `El primer valor de ${name} tiene que ser un texto entre comillas`,
          name === 'printf' ? `Para escribir un número: printf("%d", ${fmtArg.e === 'var' ? fmtArg.sym.name : 'x'});` : `Así: scanf("%d", &${fmtArg.e === 'var' ? fmtArg.sym.name : 'x'});`,
        );
      }
      return;
    }
    const isScan = name.includes('scanf');
    const specs = parseFormat(fmt, isScan);
    const rest = args.slice(fi + 1);
    const restRaw = raw.slice(fi + 1);
    let k = 0;
    if (isScan && /\\n|\n$/.test(fmt) && /\n\s*$/.test(fmt)) {
      this.warn(fmtArg, 'No pongas \\n al final del formato de scanf', 'El \\n en scanf hace que espere a que escribas algo más que no sea espacio. Quítalo: scanf("%d", &x);');
    }
    for (const sp of specs) {
      if (sp.error) {
        this.err(fmtArg, sp.error, sp.hint);
      }
      if (sp.conv === '%') continue;
      if (sp.star && !isScan) {
        // el ancho * consume un int
        const a = rest[k];
        if (!a) this.err(pos, `Faltan valores para ${name}: el * del formato necesita un número`);
        if (!isInt(a.type)) this.err(a, `El * del formato necesita un int`);
        k++;
      }
      if (sp.star && isScan) continue;
      if (sp.precStar) {
        const a = rest[k];
        if (!a || !isInt(a.type)) this.err(pos, 'El .* del formato necesita un int');
        k++;
      }
      const a = rest[k];
      const ar = restRaw[k];
      k++;
      if (!a) {
        const total = specs.filter((s) => s.conv !== '%' && !(isScan && s.star)).length;
        this.err(
          pos,
          `Faltan valores para ${name}: el formato tiene ${total} ${total === 1 ? 'hueco' : 'huecos'} (%${sp.conv}…) y solo le pasas ${rest.length}`,
          `Por cada % del texto tiene que haber un valor después, separado por comas.`,
        );
      }
      if (isScan) this.checkScanArg(sp, a, ar, name);
      else this.checkPrintArg(sp, a, ar, name);
    }
    if (k < rest.length) {
      this.warn(rest[k], `Sobran valores en ${name}: el formato solo tiene ${k} ${k === 1 ? 'hueco' : 'huecos'} con %`, 'Cada valor necesita su % en el texto (%d para enteros, %f para decimales…).');
    }
  }

  private checkPrintArg(sp: FmtSpec, a: Expr, raw: Expr, fname: string): void {
    const t = a.type;
    const what = raw.e === 'var' ? `'${raw.sym.name}'` : 'el valor';
    const c = sp.conv;
    const tn = typeName(raw.type.k === 'array' ? a.type : raw.type);
    if ('diouxXc'.includes(c)) {
      if (t.k === 'float') {
        this.err(raw, `%${sp.len}${c} es para enteros, pero ${what} es decimal (${tn})`, `Para decimales usa %f (o %.2f para 2 decimales).`);
      }
      if (t.k === 'ptr') {
        if (c === 'c' || isCharLike((t as { to: CType }).to)) {
          this.err(raw, `%${c} no sirve para textos: ${what} es ${tn}`, c === 'c' ? 'Para un texto (cadena) usa %s.' : 'Para escribir un texto usa %s.');
        }
        this.err(raw, `%${c} es para enteros, pero ${what} es un puntero (${tn})`, 'Para mostrar una dirección usa %p. Para el valor al que apunta usa *.');
      }
      if (t.k === 'struct') this.err(raw, `No se puede escribir un struct entero con printf`, 'Escribe sus campos uno a uno: printf("%d", p.edad);');
      if (isInt(t) && c !== 'c') {
        const want64 = sp.len === 'l' || sp.len === 'll' || sp.len === 'z' || sp.len === 'j' || sp.len === 't';
        if (t.size === 8 && !want64) {
          this.warn(raw, `${what} es ${tn}: con printf se escribe con %l${c}`, `Usa %l${c} para long (y %ll${c} para long long).`);
        } else if (t.size < 8 && want64) {
          this.warn(raw, `%${sp.len}${c} es para long, pero ${what} es ${tn}`, `Para int usa %${c}.`);
        }
      }
      return;
    }
    if ('fFeEgGaA'.includes(c)) {
      if (isInt(t)) {
        this.err(
          raw,
          `%${sp.len}${c} es para decimales, pero ${what} es entero (${tn})`,
          raw.e === 'const' ? `Para enteros usa %d. O escribe el número con decimales: ${String(raw.v)}.0` : `Para enteros usa %d. Si quieres verlo con decimales conviértelo: (float)${raw.e === 'var' ? raw.sym.name : 'x'}`,
        );
      }
      if (t.k !== 'float') this.err(raw, `%${c} es para decimales, pero ${what} es ${tn}`);
      return;
    }
    if (c === 's') {
      if (t.k === 'ptr' && isCharLike(t.to)) return;
      if (isInt(t) && (isCharLike(raw.type) || raw.e === 'const')) {
        this.err(raw, `%s es para textos, pero ${what} es un solo carácter`, 'Para un carácter usa %c.');
      }
      this.err(raw, `%s es para textos (char[] o char*), pero ${what} es ${tn}`, isInt(t) ? 'Para enteros usa %d.' : t.k === 'float' ? 'Para decimales usa %f.' : undefined);
    }
    if (c === 'p') {
      if (t.k !== 'ptr') this.err(raw, `%p es para direcciones (punteros), pero ${what} es ${tn}`, `Si quieres la dirección de una variable usa &: printf("%p", (void *)&x);`);
      return;
    }
    if (c === 'n') this.err(raw, `%n no está soportado en ${fname}`);
  }

  private checkScanArg(sp: FmtSpec, a: Expr, raw: Expr, fname: string): void {
    const c = sp.conv;
    const t = a.type;
    const name = raw.e === 'var' ? raw.sym.name : null;
    if (t.k !== 'ptr') {
      if (name) {
        this.err(
          raw,
          `A ${fname} hay que pasarle la dirección de '${name}': falta el &`,
          `Escribe &${name}. ${fname} necesita saber DÓNDE guardar el valor, no el valor que tiene ahora.`,
        );
      }
      this.err(raw, `A ${fname} hay que pasarle direcciones de variables (con &)`, 'Ejemplo: scanf("%d", &x);');
    }
    const to = unqual((t as Extract<CType, { k: 'ptr' }>).to);
    const show = (x: CType) => typeName(x);
    const isArrAddr = raw.e === 'addr' && raw.x.type.k === 'array';
    if (c === 's' || c === '[') {
      if (isArrAddr && isCharLike((raw.x.type as { of: CType }).of)) {
        this.warn(raw, `Con %s no hace falta & delante del array`, `El nombre del array ya es su dirección: scanf("%s", ${raw.x.e === 'var' ? raw.x.sym.name : 'texto'});`);
        return;
      }
      if (!isCharLike(to)) {
        this.err(raw, `%s lee texto y necesita un array de char, pero le pasas ${typeName(t)}`, to.k === 'int' ? 'Para leer un número entero usa %d.' : undefined);
      }
      if (raw.e === 'var' && raw.type.k === 'ptr') {
        // char *p sin memoria: lo comprobará la máquina al ejecutar
      }
      return;
    }
    if (c === 'c') {
      if (!isCharLike(to)) this.err(raw, `%c lee un carácter y necesita un char, pero le pasas ${typeName(t)}`, to.k === 'int' && to.size === 4 ? 'Declara la variable como char, o usa %d si es un número.' : undefined);
      return;
    }
    if ('diuoxX'.includes(c)) {
      const want = scanIntType(sp.len, c);
      if (to.k === 'float') {
        this.err(raw, `%${sp.len}${c} lee enteros pero ${name ? `'${name}'` : 'la variable'} es ${show(to)}`, to.size === 8 ? 'Para leer un double usa %lf.' : 'Para leer un float usa %f.');
      }
      if (!isInt(to)) this.err(raw, `%${c} necesita la dirección de un entero, no ${typeName(t)}`);
      if (to.size !== want.size) {
        const fix = to.size === 8 ? `%l${c}` : to.size === 4 ? `%${c}` : to.size === 2 ? `%h${c}` : `%hh${c}`;
        this.err(raw, `%${sp.len}${c} no encaja con ${name ? `'${name}'` : 'la variable'}, que es ${show(to)}`, `Para leer un ${show(to)} usa ${fix}.`);
      }
      return;
    }
    if ('fFeEgGaA'.includes(c)) {
      if (isInt(to)) {
        this.err(raw, `%${sp.len}${c} lee decimales pero ${name ? `'${name}'` : 'la variable'} es entera (${show(to)})`, 'Para leer un entero usa %d.');
      }
      if (to.k !== 'float') this.err(raw, `%${c} necesita la dirección de un float o double`);
      const isDouble = sp.len === 'l' || sp.len === 'L';
      if (to.k === 'float' && to.size === 8 && !isDouble) {
        this.err(raw, `Para leer un double con scanf se usa %lf (con ele), no %${c}`, `Escribe %lf. Con %f, scanf guarda un float en un double y el número sale mal.`);
      }
      if (to.k === 'float' && to.size === 4 && isDouble) {
        this.err(raw, `%lf es para double, pero ${name ? `'${name}'` : 'la variable'} es float`, 'Para leer un float usa %f.');
      }
      return;
    }
    if (c === 'p') return;
    this.err(raw, `%${c} no está soportado en ${fname}`);
  }
}

// ───────────────────────── utilidades ─────────────────────────

interface FmtSpec {
  conv: string;
  len: string;
  star: boolean;
  precStar: boolean;
  error?: string;
  hint?: string;
}

export function parseFormat(fmt: string, scan: boolean): FmtSpec[] {
  const out: FmtSpec[] = [];
  for (let i = 0; i < fmt.length; i++) {
    if (fmt[i] !== '%') continue;
    i++;
    if (fmt[i] === '%') {
      out.push({ conv: '%', len: '', star: false, precStar: false });
      continue;
    }
    let star = false;
    let precStar = false;
    if (scan) {
      if (fmt[i] === '*') {
        star = true;
        i++;
      }
      while (/[0-9]/.test(fmt[i] ?? '')) i++;
    } else {
      while ('-+ #0'.includes(fmt[i] ?? 'x') && i < fmt.length) i++;
      if (fmt[i] === '*') {
        star = true;
        i++;
      } else while (/[0-9]/.test(fmt[i] ?? '')) i++;
      if (fmt[i] === '.') {
        i++;
        if (fmt[i] === '*') {
          precStar = true;
          i++;
        } else while (/[0-9]/.test(fmt[i] ?? '')) i++;
      }
    }
    let len = '';
    while (/[hlLqjzt]/.test(fmt[i] ?? '')) len += fmt[i++];
    const conv = fmt[i];
    if (conv === undefined) {
      out.push({ conv: '?', len, star, precStar, error: 'El formato termina con un % suelto', hint: 'Para escribir el símbolo % usa %%.' });
      break;
    }
    if (scan && conv === '[') {
      i++;
      if (fmt[i] === '^') i++;
      if (fmt[i] === ']') i++;
      while (i < fmt.length && fmt[i] !== ']') i++;
      out.push({ conv: '[', len, star, precStar });
      continue;
    }
    if (!'diouxXcsfFeEgGaApn'.includes(conv)) {
      const hints: Record<string, string> = {
        D: 'Para enteros se usa %d (en minúscula).',
        S: 'Para textos se usa %s (en minúscula).',
        C: 'Para caracteres se usa %c (en minúscula).',
        ' ': 'Después del % va la letra del tipo, sin espacio: %d',
        r: 'Para decimales se usa %f.',
        b: 'printf no tiene formato binario. Usa %d para enteros.',
      };
      out.push({
        conv,
        len,
        star,
        precStar,
        error: `Formato desconocido %${len}${conv}`,
        hint: hints[conv] ?? 'Los más usados son %d (int), %f (float/double), %c (char) y %s (texto). Para escribir % usa %%.',
      });
      continue;
    }
    out.push({ conv, len, star, precStar });
  }
  return out;
}

function scanIntType(len: string, _c: string): { size: number } {
  void _c;
  switch (len) {
    case 'hh':
      return { size: 1 };
    case 'h':
      return { size: 2 };
    case 'l':
    case 'll':
    case 'j':
    case 'z':
    case 't':
    case 'L':
    case 'q':
      return { size: 8 };
    default:
      return { size: 4 };
  }
}

function strOf(x: Expr, strings: StringLit[]): string | null {
  let e = x;
  while (e.e === 'cast' || e.e === 'decay') e = e.x;
  if (e.e !== 'str') return null;
  return new TextDecoder().decode(new Uint8Array(strings[e.sid].bytes.slice(0, -1)));
}

function tokText(x: Expr, lines: string[]): string {
  const line = lines[x.line - 1] ?? '';
  const m = /"(?:[^"\\]|\\.)*"/.exec(line.slice(x.col - 1));
  return m ? m[0] : 'las comillas dobles';
}

function closestTypeHint(name: string): string {
  const types = ['int', 'float', 'double', 'char', 'long', 'short', 'void', 'unsigned', 'bool'];
  const c = closest(name, types);
  if (c) return `¿Querías decir '${c}'?`;
  return 'Los tipos de C son int, float, double, char… (en minúscula). Si es un struct, escribe struct delante.';
}

export function rval(x: Expr): Expr {
  return x;
}

function markAddr(x: Expr): void {
  switch (x.e) {
    case 'var':
      x.sym.addrTaken = true;
      return;
    case 'index':
      if (!x.viaPtr) markAddr(x.a);
      return;
    case 'member':
      markAddr(x.x);
      return;
  }
}

function isNullConst(x: Expr): boolean {
  if (x.e === 'const') {
    if (x.type.k === 'int') return typeof x.v === 'bigint' ? x.v === 0n : x.v === 0;
    if (x.type.k === 'ptr') return (x.v as Ptr).a === 0 && !(x.v as Ptr).f;
  }
  if (x.e === 'cast' && x.type.k === 'ptr' && x.type.to.k === 'void') return isNullConst(x.x);
  return false;
}

function substitute(t: CType, real: CType): CType {
  if (t === PLACEHOLDER) return real;
  switch (t.k) {
    case 'ptr':
      return { ...t, to: substitute(t.to, real) };
    case 'array':
      return { ...t, of: substitute(t.of, real) };
    case 'func':
      return { ...t, ret: substitute(t.ret, real) };
    default:
      return t;
  }
}

function endsFlow(s: Stmt): boolean {
  switch (s.s) {
    case 'break':
    case 'return':
    case 'continue':
      return true;
    case 'block':
      return s.body.length > 0 && endsFlow(s.body[s.body.length - 1]);
    case 'if':
      return !!s.f && endsFlow(s.t) && endsFlow(s.f);
    case 'expr':
      return s.x.e === 'call' && s.x.f.e === 'fn' && s.x.f.fn.name === 'exit';
    default:
      return false;
  }
}

/** ¿Puede la ejecución llegar al final de esta sentencia? (para avisar de return que falta) */
function mayFallThrough(s: Stmt): boolean {
  switch (s.s) {
    case 'return':
      return false;
    case 'block':
      for (const x of s.body) if (!mayFallThrough(x)) return false;
      return true;
    case 'if':
      return !s.f || mayFallThrough(s.t) || mayFallThrough(s.f);
    case 'while':
      return !(s.c.e === 'const' && s.c.v !== 0 && !hasBreak(s.body));
    case 'for':
      return !(s.c === null || (s.c.e === 'const' && s.c.v !== 0)) || hasBreak(s.body);
    case 'do':
      return mayFallThrough(s.body) || !(s.c.e === 'const' && s.c.v !== 0) || hasBreak(s.body);
    case 'expr':
      return !(s.x.e === 'call' && s.x.f.e === 'fn' && s.x.f.fn.name === 'exit');
    case 'switch': {
      if (s.def < 0) return true;
      const body: Stmt = { s: 'block', body: s.body, restoresSp: false, line: 0, col: 0 };
      return hasBreak(body) || mayFallThrough(body);
    }
    default:
      return true;
  }
}

function hasBreak(s: Stmt): boolean {
  switch (s.s) {
    case 'break':
      return true;
    case 'block':
      return s.body.some(hasBreak);
    case 'if':
      return hasBreak(s.t) || (!!s.f && hasBreak(s.f));
    default:
      return false;
  }
}
