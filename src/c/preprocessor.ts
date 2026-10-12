// Preprocesador: #include, #define (también con parámetros), #undef y los #if.
import { CompileError, type Diagnostic } from './diagnostics';
import { CPP_ALIASES, HEADERS, UNSUPPORTED_HEADERS } from './headers';
import { lex, type Token } from './lexer';
import { T } from './types';

interface Macro {
  name: string;
  params: string[] | null;
  variadic: boolean;
  body: Token[];
  line: number;
}

interface PTok extends Token {
  hide?: Set<string>;
  /** Token que viene de una cabecera del sistema. */
  sys?: boolean;
}

interface Cond {
  active: boolean;
  taken: boolean;
  parentActive: boolean;
  line: number;
  sawElse: boolean;
}

export interface PreResult {
  tokens: PTok[];
  includes: Set<string>;
  macros: Set<string>;
}

export function preprocess(src: string, warnings: Diagnostic[]): PreResult {
  const macros = new Map<string, Macro>();
  const includes = new Set<string>();
  const out: PTok[] = [];

  const run = (tokens: PTok[], sys: boolean) => {
    const conds: Cond[] = [];
    const active = () => conds.length === 0 || conds[conds.length - 1].active;
    let i = 0;
    // tokens pendientes de reexaminar tras expandir macros
    let pending: PTok[] = [];

    const next = (): PTok | undefined => {
      if (pending.length) return pending.shift();
      const t = tokens[i];
      if (!t || t.t === 'eof' || t.t === 'dir') return undefined;
      i++;
      return t;
    };
    const peekTok = (): PTok | undefined => {
      if (pending.length) return pending[0];
      const t = tokens[i];
      if (!t || t.t === 'eof' || t.t === 'dir') return undefined;
      return t;
    };

    while (i < tokens.length || pending.length) {
      const t0 = pending.length ? pending[0] : tokens[i];
      if (!t0 || t0.t === 'eof') break;
      if (t0.t === 'dir' && !pending.length) {
        i++;
        directive(t0, conds, sys);
        continue;
      }
      if (!active()) {
        if (pending.length) pending.shift();
        else i++;
        continue;
      }
      const t = next()!;
      if (t.t === 'id' && macros.has(t.v) && !t.hide?.has(t.v)) {
        const m = macros.get(t.v)!;
        if (m.params === null) {
          const body = m.body.map((b) => retok(b, t, m.name));
          pending = [...body, ...pending];
          continue;
        }
        const after = peekTok();
        if (!after || after.v !== '(' || after.t !== 'p') {
          out.push(sys ? { ...t, sys } : t);
          continue;
        }
        next(); // (
        const args: PTok[][] = [[]];
        let depth = 0;
        for (;;) {
          const a = next();
          if (!a) throw new CompileError(t.line, t.col, `Falta cerrar el paréntesis de la macro ${t.v}(...)`);
          if (a.t === 'p' && (a.v === '(' || a.v === '[' || a.v === '{')) depth++;
          if (a.t === 'p' && (a.v === ')' || a.v === ']' || a.v === '}')) {
            if (depth === 0 && a.v === ')') break;
            depth--;
          }
          if (a.t === 'p' && a.v === ',' && depth === 0 && !(m.variadic && args.length > m.params.length)) {
            args.push([]);
            continue;
          }
          args[args.length - 1].push(a);
        }
        if (args.length === 1 && args[0].length === 0 && m.params.length === 0) args.length = 0;
        const expected = m.params.length + (m.variadic ? 1 : 0);
        if (args.length !== expected && !(m.variadic && args.length === m.params.length)) {
          throw new CompileError(
            t.line,
            t.col,
            `La macro ${m.name} necesita ${m.params.length} argumento(s) y le pasas ${args.length}`,
          );
        }
        pending = [...substitute(m, args, t), ...pending];
        continue;
      }
      if (t.t === 'id' && t.v === '__LINE__') {
        out.push({ ...t, t: 'num', v: String(t.line), num: t.line, numType: T.int });
        continue;
      }
      out.push(sys ? { ...t, sys } : t);
    }
    if (conds.length) {
      const c = conds[conds.length - 1];
      throw new CompileError(c.line, 1, 'Falta #endif para cerrar este #if', 'Cada #if, #ifdef o #ifndef termina con #endif.');
    }
  };

  const retok = (b: Token, site: PTok, name: string): PTok => ({
    ...b,
    line: site.line,
    col: site.col,
    macro: name,
    hide: new Set([...(site.hide ?? []), name]),
  });

  const substitute = (m: Macro, args: PTok[][], site: PTok): PTok[] => {
    const params = m.variadic ? [...m.params!, '__VA_ARGS__'] : m.params!;
    const res: PTok[] = [];
    const body = m.body;
    for (let k = 0; k < body.length; k++) {
      const b = body[k];
      if (b.t === 'p' && b.v === '#' && body[k + 1]?.t === 'id' && params.includes(body[k + 1].v)) {
        const arg = args[params.indexOf(body[k + 1].v)] ?? [];
        const text = arg.map((a, idx) => (idx > 0 && a.sp ? ' ' : '') + a.v).join('');
        res.push({ ...retok(b, site, m.name), t: 'str', v: JSON.stringify(text), bytes: Array.from(new TextEncoder().encode(text)) });
        k++;
        continue;
      }
      const pi = b.t === 'id' ? params.indexOf(b.v) : -1;
      if (pi >= 0) {
        const nextIsPaste = body[k + 1]?.v === '##';
        const prevIsPaste = body[k - 1]?.v === '##';
        const arg = args[pi] ?? [];
        const toks = nextIsPaste || prevIsPaste ? arg : expandAll(arg);
        for (const a of toks) res.push({ ...a, line: site.line, col: site.col, hide: new Set([...(a.hide ?? []), ...(site.hide ?? [])]) });
        continue;
      }
      res.push(retok(b, site, m.name));
    }
    // pegado con ##
    for (let k = 0; k < res.length; k++) {
      if (res[k].t === 'p' && res[k].v === '##' && k > 0 && k + 1 < res.length) {
        const text = res[k - 1].v + res[k + 1].v;
        const lexed = lex(text, []).filter((x) => x.t !== 'eof');
        const merged = lexed.length === 1 ? { ...lexed[0], line: site.line, col: site.col, hide: res[k - 1].hide } : res[k - 1];
        res.splice(k - 1, 3, merged);
        k -= 1;
      }
    }
    return res;
  };

  const expandAll = (toks: PTok[]): PTok[] => {
    const saveLen = out.length;
    run([...toks, { t: 'eof', v: '', line: 0, col: 0 }], false);
    return out.splice(saveLen);
  };

  const directive = (t: PTok, conds: Cond[], sys: boolean) => {
    const text = t.v.trim();
    const m = /^(\w*)\s*([\s\S]*)$/.exec(text)!;
    const name = m[1];
    const rest = m[2].trim();
    const parentActive = conds.length === 0 || conds[conds.length - 1].active;
    const top = conds[conds.length - 1];
    switch (name) {
      case 'ifdef':
      case 'ifndef': {
        const id = /^\w+/.exec(rest)?.[0];
        if (!id) throw new CompileError(t.line, t.col, `#${name} necesita un nombre`);
        const val = macros.has(id) === (name === 'ifdef');
        conds.push({ active: parentActive && val, taken: val, parentActive, line: t.line, sawElse: false });
        return;
      }
      case 'if': {
        const val = parentActive ? evalIf(rest, t) : false;
        conds.push({ active: parentActive && val, taken: val, parentActive, line: t.line, sawElse: false });
        return;
      }
      case 'elif': {
        if (!top) throw new CompileError(t.line, t.col, '#elif sin un #if antes');
        if (top.taken) top.active = false;
        else {
          const val = top.parentActive ? evalIf(rest, t) : false;
          top.active = top.parentActive && val;
          top.taken = val;
        }
        return;
      }
      case 'else':
        if (!top) throw new CompileError(t.line, t.col, '#else sin un #if antes');
        top.active = top.parentActive && !top.taken;
        top.taken = true;
        top.sawElse = true;
        return;
      case 'endif':
        if (!top) throw new CompileError(t.line, t.col, '#endif sin un #if antes');
        conds.pop();
        return;
    }
    if (!parentActive) return;
    switch (name) {
      case 'include': {
        const hm = /^[<"]\s*([^>"]+?)\s*[>"]/.exec(rest);
        if (!hm) {
          throw new CompileError(t.line, t.col, '#include mal escrito', 'Se escribe así: #include <stdio.h>');
        }
        let h = hm[1];
        if (rest.startsWith('"') && !HEADERS[h]) {
          throw new CompileError(
            t.line,
            t.col,
            `No existe el archivo "${h}"`,
            'En esta web todo el programa va en un solo archivo. Las cabeceras del sistema van con < >: #include <stdio.h>',
          );
        }
        if (CPP_ALIASES[h]) h = CPP_ALIASES[h];
        if (!(h in HEADERS)) {
          const why = UNSUPPORTED_HEADERS[h];
          throw new CompileError(
            t.line,
            t.col,
            `La biblioteca <${hm[1]}> no está disponible`,
            why ?? 'Puedes usar <stdio.h>, <stdlib.h>, <string.h>, <math.h>, <ctype.h>, <time.h>, <stdbool.h> y <limits.h>.',
          );
        }
        if (includes.has(h)) return;
        includes.add(h);
        const toks = lex(HEADERS[h], []).map((x) => ({ ...x, line: t.line, col: t.col, sys: true }) as PTok);
        run(toks, true);
        return;
      }
      case 'define': {
        const dm = /^([A-Za-z_]\w*)(\()?/.exec(rest);
        if (!dm) {
          throw new CompileError(t.line, t.col, '#define necesita un nombre', 'Ejemplo: #define MAX 100');
        }
        const mname = dm[1];
        let params: string[] | null = null;
        let variadic = false;
        let bodyText = rest.slice(mname.length);
        if (dm[2]) {
          const close = bodyText.indexOf(')');
          if (close < 0) throw new CompileError(t.line, t.col, `Falta ')' en los parámetros de la macro ${mname}`);
          const plist = bodyText.slice(1, close).split(',').map((p) => p.trim()).filter(Boolean);
          if (plist[plist.length - 1] === '...') {
            variadic = true;
            plist.pop();
          }
          params = plist;
          bodyText = bodyText.slice(close + 1);
        }
        let body: Token[];
        try {
          body = lex(bodyText, warnings).filter((x) => x.t !== 'eof');
        } catch (e) {
          if (e instanceof CompileError) throw new CompileError(t.line, t.col, e.diag.message, e.diag.hint);
          throw e;
        }
        if (!sys && body.length && body[body.length - 1].v === ';') {
          warnings.push({
            severity: 'warning',
            line: t.line,
            col: t.col,
            message: `La macro ${mname} termina en ';'`,
            hint: 'Las líneas #define no llevan punto y coma: ese ; se copiaría cada vez que uses la macro.',
          });
        }
        if (!sys && body.length && body[0].v === '=') {
          throw new CompileError(
            t.line,
            t.col,
            `En #define no se usa '='`,
            `Escribe #define ${mname} ${bodyText.replace(/^\s*=\s*/, '').replace(/;\s*$/, '')}`,
          );
        }
        macros.set(mname, { name: mname, params, variadic, body, line: t.line });
        return;
      }
      case 'undef':
        macros.delete(rest.split(/\s+/)[0]);
        return;
      case 'pragma':
      case 'line':
      case '':
        return;
      case 'error':
        throw new CompileError(t.line, t.col, `#error ${rest}`);
      case 'warning':
        warnings.push({ severity: 'warning', line: t.line, col: t.col, message: rest });
        return;
      default:
        throw new CompileError(
          t.line,
          t.col,
          `Directiva desconocida #${name}`,
          name.startsWith('inc') ? '¿Querías escribir #include?' : name.startsWith('def') ? '¿Querías escribir #define?' : undefined,
        );
    }
  };

  const evalIf = (text: string, t: PTok): boolean => {
    // `defined X` y `defined(X)` antes de expandir
    const replaced = text.replace(/defined\s*\(\s*(\w+)\s*\)|defined\s+(\w+)/g, (_, a, b) => (macros.has(a ?? b) ? '1' : '0'));
    const toks = lex(replaced, []);
    const expanded = expandAll(toks.filter((x) => x.t !== 'eof'));
    let p = 0;
    const peek = () => expanded[p];
    const val = (): bigint => {
      const x = expanded[p++];
      if (!x) throw new CompileError(t.line, t.col, 'Expresión incompleta en #if');
      if (x.t === 'num' || x.t === 'char') return BigInt(Math.trunc(Number(x.num ?? 0)));
      if (x.t === 'id') return 0n;
      if (x.v === '(') {
        const v = expr(0);
        p++;
        return v;
      }
      if (x.v === '!') return val() === 0n ? 1n : 0n;
      if (x.v === '-') return -val();
      if (x.v === '+') return val();
      if (x.v === '~') return ~val();
      throw new CompileError(t.line, t.col, `No entiendo '${x.v}' en #if`);
    };
    const PREC: Record<string, number> = {
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
    const expr = (min: number): bigint => {
      let l = val();
      for (;;) {
        const op = peek();
        if (!op || op.t !== 'p') break;
        if (op.v === '?' && min === 0) {
          p++;
          const a = expr(0);
          p++; // :
          const b = expr(0);
          l = l !== 0n ? a : b;
          continue;
        }
        const pr = PREC[op.v];
        if (!pr || pr <= min) break;
        p++;
        const r = expr(pr);
        const b = (x: boolean) => (x ? 1n : 0n);
        switch (op.v) {
          case '||':
            l = b(l !== 0n || r !== 0n);
            break;
          case '&&':
            l = b(l !== 0n && r !== 0n);
            break;
          case '|':
            l = l | r;
            break;
          case '^':
            l = l ^ r;
            break;
          case '&':
            l = l & r;
            break;
          case '==':
            l = b(l === r);
            break;
          case '!=':
            l = b(l !== r);
            break;
          case '<':
            l = b(l < r);
            break;
          case '>':
            l = b(l > r);
            break;
          case '<=':
            l = b(l <= r);
            break;
          case '>=':
            l = b(l >= r);
            break;
          case '<<':
            l = l << r;
            break;
          case '>>':
            l = l >> r;
            break;
          case '+':
            l = l + r;
            break;
          case '-':
            l = l - r;
            break;
          case '*':
            l = l * r;
            break;
          case '/':
            l = r === 0n ? 0n : l / r;
            break;
          case '%':
            l = r === 0n ? 0n : l % r;
            break;
        }
      }
      return l;
    };
    return expr(0) !== 0n;
  };

  const tokens = lex(src, warnings);
  run(tokens as PTok[], false);
  const eof = tokens[tokens.length - 1];
  out.push(eof);
  return { tokens: out, includes, macros: new Set(macros.keys()) };
}

export type { PTok };
