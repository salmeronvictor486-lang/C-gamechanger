// Aritmética y conversiones con las reglas de C. Las usan el compilador (para plegar
// constantes) y la máquina (al ejecutar). Representación de los valores:
//   enteros de 1-4 bytes → number, enteros de 8 bytes → bigint,
//   float/double → number, punteros → Ptr.
import type { CType } from './types';

export interface MemObj {
  base: number;
  size: number;
  name: string;
  kind: 'var' | 'heap' | 'str' | 'tmp' | 'param';
  alive: boolean;
  ro?: boolean;
  type?: CType;
  /** Función donde vive (para los mensajes de variables locales). */
  fn?: string;
}

export interface Ptr {
  a: number;
  o: MemObj | null;
  /** Puntero a función. */
  f?: unknown;
}

export const NULLPTR: Ptr = { a: 0, o: null };

export type Value = number | bigint | Ptr | undefined;

export class RuntimeError extends Error {
  hint?: string;
  constructor(message: string, hint?: string) {
    super(message);
    this.hint = hint;
  }
}

export function wrapInt(t: Extract<CType, { k: 'int' }>, v: number | bigint): number | bigint {
  if (t.size === 8) {
    const b = typeof v === 'bigint' ? v : BigInt(v);
    return t.signed ? BigInt.asIntN(64, b) : BigInt.asUintN(64, b);
  }
  const n = typeof v === 'bigint' ? Number(BigInt.asIntN(32, v)) : v;
  switch (t.size) {
    case 1:
      if (t.name === 'bool') return n ? 1 : 0;
      return t.signed ? (n << 24) >> 24 : n & 255;
    case 2:
      return t.signed ? (n << 16) >> 16 : n & 0xffff;
    default:
      return t.signed ? n | 0 : n >>> 0;
  }
}

/** float/double → entero, como hace un x86-64 (fuera de rango da el valor "indefinido"). */
function floatToInt(t: Extract<CType, { k: 'int' }>, x: number): number | bigint {
  if (t.name === 'bool') return x !== 0 ? 1 : 0;
  const tr = Math.trunc(x);
  if (t.size === 8) {
    if (!Number.isFinite(tr) || Math.abs(tr) >= 9.223372036854776e18) {
      if (!t.signed && tr >= 0 && tr < 1.8446744073709552e19) return BigInt(tr);
      return t.signed ? -(2n ** 63n) : 2n ** 63n;
    }
    return wrapInt(t, BigInt(tr));
  }
  if (!Number.isFinite(tr) || tr > 2147483647 || tr < -2147483648) {
    if (!t.signed && t.size === 4 && tr >= 0 && tr <= 4294967295) return tr;
    if (!t.signed && t.size === 4 && Number.isFinite(tr) && Math.abs(tr) < 9.2e18) {
      return Number(BigInt.asUintN(32, BigInt(tr)));
    }
    return wrapInt(t, -2147483648);
  }
  return wrapInt(t, tr);
}

export function convert(v: Value, from: CType, to: CType): Value {
  switch (to.k) {
    case 'void':
      return undefined;
    case 'int':
      if (from.k === 'float') return floatToInt(to, v as number);
      if (from.k === 'ptr' || from.k === 'array' || from.k === 'func') {
        const a = (v as Ptr).a;
        if (to.name === 'bool') return a !== 0 ? 1 : 0;
        return wrapInt(to, a);
      }
      if (to.name === 'bool') return typeof v === 'bigint' ? (v !== 0n ? 1 : 0) : v ? 1 : 0;
      return wrapInt(to, v as number | bigint);
    case 'float': {
      const n = typeof v === 'bigint' ? Number(v) : (v as number);
      return to.size === 4 ? Math.fround(n) : n;
    }
    case 'ptr':
      if (from.k === 'int') {
        const n = typeof v === 'bigint' ? Number(BigInt.asUintN(32, v)) : (v as number) >>> 0;
        return n === 0 ? NULLPTR : { a: n, o: null };
      }
      return v;
    default:
      return v;
  }
}

export function truthy(v: Value): boolean {
  if (typeof v === 'number') return v !== 0;
  if (typeof v === 'bigint') return v !== 0n;
  if (v === undefined) return false;
  return v.a !== 0 || !!v.f;
}

export type ArithOp = '+' | '-' | '*' | '/' | '%' | '<<' | '>>' | '&' | '|' | '^';

export class DivZero extends Error {}

/** Operación aritmética con ambos operandos ya convertidos al tipo `t`. */
export function arith(op: ArithOp, t: CType, a: Value, b: Value): Value {
  if (t.k === 'float') {
    const x = a as number;
    const y = b as number;
    let r: number;
    switch (op) {
      case '+':
        r = x + y;
        break;
      case '-':
        r = x - y;
        break;
      case '*':
        r = x * y;
        break;
      case '/':
        r = x / y;
        break;
      default:
        r = NaN;
    }
    return t.size === 4 ? Math.fround(r) : r;
  }
  if (t.k !== 'int') throw new Error('arith: tipo no aritmético');
  if (t.size === 8) {
    const x = a as bigint;
    const y = b as bigint;
    let r: bigint;
    switch (op) {
      case '+':
        r = x + y;
        break;
      case '-':
        r = x - y;
        break;
      case '*':
        r = x * y;
        break;
      case '/':
        if (y === 0n) throw new DivZero();
        r = x / y;
        break;
      case '%':
        if (y === 0n) throw new DivZero();
        r = x % y;
        break;
      case '<<':
        r = x << (y & 63n);
        break;
      case '>>':
        r = x >> (y & 63n);
        break;
      case '&':
        r = x & y;
        break;
      case '|':
        r = x | y;
        break;
      case '^':
        r = x ^ y;
        break;
    }
    return t.signed ? BigInt.asIntN(64, r) : BigInt.asUintN(64, r);
  }
  const x = a as number;
  const y = b as number;
  if (t.signed) {
    switch (op) {
      case '+':
        return (x + y) | 0;
      case '-':
        return (x - y) | 0;
      case '*':
        return Math.imul(x, y);
      case '/':
        if (y === 0) throw new DivZero();
        return (x / y) | 0;
      case '%':
        if (y === 0) throw new DivZero();
        return x % y | 0;
      case '<<':
        return x << y;
      case '>>':
        return x >> y;
      case '&':
        return x & y;
      case '|':
        return x | y;
      case '^':
        return x ^ y;
    }
  }
  switch (op) {
    case '+':
      return (x + y) >>> 0;
    case '-':
      return (x - y) >>> 0;
    case '*':
      return Math.imul(x, y) >>> 0;
    case '/':
      if (y === 0) throw new DivZero();
      return Math.floor(x / y) >>> 0;
    case '%':
      if (y === 0) throw new DivZero();
      return x % y >>> 0;
    case '<<':
      return (x << y) >>> 0;
    case '>>':
      return x >>> y;
    case '&':
      return (x & y) >>> 0;
    case '|':
      return (x | y) >>> 0;
    case '^':
      return (x ^ y) >>> 0;
  }
}

export type CmpOp = '<' | '>' | '<=' | '>=' | '==' | '!=';

export function compare(op: CmpOp, a: Value, b: Value): number {
  let x: number | bigint;
  let y: number | bigint;
  if (typeof a === 'object' && a !== null) {
    x = a.a;
    y = (b as Ptr).a;
    if (a.f || (b as Ptr).f) {
      x = a.f ? 1 : 0;
      y = (b as Ptr).f === a.f ? x : -1;
    }
  } else {
    x = a as number | bigint;
    y = b as number | bigint;
  }
  switch (op) {
    case '<':
      return x < y ? 1 : 0;
    case '>':
      return x > y ? 1 : 0;
    case '<=':
      return x <= y ? 1 : 0;
    case '>=':
      return x >= y ? 1 : 0;
    case '==':
      return x === y || (typeof x === 'number' && x == y) ? 1 : 0;
    case '!=':
      return x === y || (typeof x === 'number' && x == y) ? 0 : 1;
  }
}

export function negate(t: CType, v: Value): Value {
  if (t.k === 'float') return -(v as number);
  return arith('-', t, t.k === 'int' && t.size === 8 ? 0n : 0, v);
}

export function bitnot(t: CType, v: Value): Value {
  if (t.k === 'int' && t.size === 8) return wrapInt(t, ~(v as bigint));
  return wrapInt(t as Extract<CType, { k: 'int' }>, ~(v as number));
}

export function zeroOf(t: CType): Value {
  if (t.k === 'int' && t.size === 8) return 0n;
  if (t.k === 'ptr') return NULLPTR;
  return 0;
}
