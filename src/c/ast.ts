// Árbol del programa ya con tipos: lo produce el parser y lo ejecuta la máquina.
import type { Value } from './ops';
import type { CType, Field, StructInfo } from './types';

export interface VarSym {
  kind: 'var';
  name: string;
  type: CType;
  storage: 'local' | 'global' | 'static';
  line: number;
  col: number;
  id: number;
  addrTaken: boolean;
  used: boolean;
  assigned: boolean;
  isParam: boolean;
  /** Parámetro escrito como array (`int v[]`): en realidad es un puntero. */
  arrayParam?: boolean;
  /** Variable oculta (temporales del compilador). */
  hidden?: boolean;
  extern?: boolean;
  defined?: boolean;
  /** Se decide al terminar la función: escalar sin & → vive en un registro de JS. */
  reg: boolean;
  /** Índice de registro, desplazamiento en el marco o dirección absoluta. */
  slot: number;
  objIndex: number;
  /** VLA: registro donde se guarda la dirección base. */
  vlaBase?: number;
  init?: Init | null;
  fnName?: string;
}

export interface FuncSym {
  kind: 'func';
  name: string;
  type: Extract<CType, { k: 'func' }>;
  params: VarSym[];
  body: Stmt | null;
  line: number;
  col: number;
  locals: VarSym[];
  frameSize: number;
  nregs: number;
  nobjs: number;
  /** Declarada en una cabecera: la implementa la biblioteca. */
  builtin: boolean;
  used: boolean;
  id: number;
  /** Parámetros VLA (`int m[][n]`): longitudes a calcular al entrar. */
  vlaParams: { slot: number; x: Expr }[];
}

export interface TypedefSym {
  kind: 'typedef';
  name: string;
  type: CType;
}

export interface EnumSym {
  kind: 'enumconst';
  name: string;
  value: number;
}

export type Sym = VarSym | FuncSym | TypedefSym | EnumSym;

export interface Pos {
  line: number;
  col: number;
}

export type ArithOpName = '+' | '-' | '*' | '/' | '%' | '<<' | '>>' | '&' | '|' | '^';
export type CmpOpName = '<' | '>' | '<=' | '>=' | '==' | '!=';

type ExprKind =
  | { e: 'const'; v: Value }
  | { e: 'str'; sid: number }
  | { e: 'var'; sym: VarSym }
  | { e: 'fn'; fn: FuncSym }
  | { e: 'cast'; x: Expr }
  | { e: 'decay'; x: Expr }
  | { e: 'arith'; op: ArithOpName; l: Expr; r: Expr }
  | { e: 'cmp'; op: CmpOpName; l: Expr; r: Expr }
  | { e: 'logic'; op: '&&' | '||'; l: Expr; r: Expr }
  | { e: 'not'; x: Expr }
  | { e: 'neg'; x: Expr }
  | { e: 'bitnot'; x: Expr }
  | { e: 'padd'; p: Expr; i: Expr; neg: boolean }
  | { e: 'pdiff'; l: Expr; r: Expr; size: number }
  | { e: 'deref'; x: Expr }
  | { e: 'index'; a: Expr; i: Expr; viaPtr: boolean }
  | { e: 'addr'; x: Expr }
  | { e: 'member'; x: Expr; f: Field }
  | { e: 'assign'; l: Expr; r: Expr }
  | { e: 'opassign'; op: ArithOpName; l: Expr; r: Expr; ct: CType }
  | { e: 'incdec'; x: Expr; pre: boolean; inc: boolean }
  | { e: 'call'; f: Expr; args: Expr[]; tmp: VarSym | null; fname: string }
  | { e: 'cond'; c: Expr; a: Expr; b: Expr }
  | { e: 'comma'; a: Expr; b: Expr }
  | { e: 'vlasize'; t: CType };

export type Expr = ExprKind & {
  type: CType;
  line: number;
  col: number;
  /** Es un lvalue (se puede tomar su dirección). */
  lv?: boolean;
  /** Estaba entre paréntesis en el código. */
  paren?: boolean;
};

export type InitItem = { off: number; t: CType; x: Expr } | { off: number; bytes: number[] };

export type Init = { k: 'expr'; x: Expr } | { k: 'list'; size: number; items: InitItem[] };

type StmtKind =
  | { s: 'expr'; x: Expr }
  | { s: 'decl'; sym: VarSym; init: Init | null; vla: { slot: number; x: Expr }[] }
  | { s: 'block'; body: Stmt[]; restoresSp: boolean }
  | { s: 'if'; c: Expr; t: Stmt; f: Stmt | null }
  | { s: 'while'; c: Expr; body: Stmt }
  | { s: 'do'; body: Stmt; c: Expr }
  | { s: 'for'; init: Stmt | null; c: Expr | null; step: Expr | null; body: Stmt }
  | { s: 'switch'; x: Expr; body: Stmt[]; cases: Map<number | bigint, number>; def: number }
  | { s: 'case' }
  | { s: 'break' }
  | { s: 'continue' }
  | { s: 'return'; x: Expr | null }
  | { s: 'empty' };

export type Stmt = StmtKind & { line: number; col: number };

export interface StringLit {
  bytes: number[];
  addr: number;
}

export interface Program {
  funcs: FuncSym[];
  globals: VarSym[];
  strings: StringLit[];
  dataSize: number;
  main: FuncSym;
  structs: StructInfo[];
  includes: Set<string>;
}
