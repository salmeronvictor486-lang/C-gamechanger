// Biblioteca estándar de C implementada en JavaScript: stdio, stdlib, string, math,
// ctype, time… Cada función recibe los valores ya convertidos y sus tipos.
import { formatFloat, formatInt, type Spec } from './format';
import { ExitSignal, type Machine } from './machine';
import { NULLPTR, RuntimeError, type Ptr, type Value } from './ops';
import { isCharLike, sizeOf, T, type CType } from './types';

export interface Stream {
  kind: 'stdin' | 'stdout' | 'stderr' | 'file';
  name: string;
  data: number[];
  pos: number;
  eof: boolean;
  closed: boolean;
  read: boolean;
  write: boolean;
  unget?: number[];
}

type Builtin = (m: Machine, a: Value[], t: CType[]) => Value;

const enc = new TextEncoder();
const dec = new TextDecoder();
const bytes = (s: string) => Array.from(enc.encode(s));

const P = (v: Value) => v as Ptr;
const N = (v: Value) => (typeof v === 'bigint' ? Number(v) : (v as number));

// ───────────────────────── printf ─────────────────────────

export function formatPrintf(m: Machine, fmt: number[], args: Value[], types: CType[], fname: string): number[] {
  const out: number[] = [];
  let ai = 0;
  const nextArg = (): [Value, CType] => {
    if (ai >= args.length) throw new RuntimeError(`Faltan valores para ${fname}`, 'Cada % del formato necesita un valor después.');
    const r: [Value, CType] = [args[ai], types[ai]];
    ai++;
    return r;
  };
  for (let i = 0; i < fmt.length; i++) {
    const c = fmt[i];
    if (c !== 37) {
      out.push(c);
      continue;
    }
    i++;
    if (fmt[i] === 37) {
      out.push(37);
      continue;
    }
    const spec: Spec = { minus: false, plus: false, space: false, alt: false, zero: false, width: 0, prec: -1, len: '', conv: '' };
    for (;;) {
      const f = String.fromCharCode(fmt[i]);
      if (f === '-') spec.minus = true;
      else if (f === '+') spec.plus = true;
      else if (f === ' ') spec.space = true;
      else if (f === '#') spec.alt = true;
      else if (f === '0') spec.zero = true;
      else break;
      i++;
    }
    if (fmt[i] === 42) {
      const w = N(nextArg()[0]);
      if (w < 0) {
        spec.minus = true;
        spec.width = -w;
      } else spec.width = w;
      i++;
    } else {
      while (fmt[i] >= 48 && fmt[i] <= 57) spec.width = spec.width * 10 + (fmt[i++] - 48);
    }
    if (fmt[i] === 46) {
      i++;
      spec.prec = 0;
      if (fmt[i] === 42) {
        const p = N(nextArg()[0]);
        spec.prec = p < 0 ? -1 : p;
        i++;
      } else {
        while (fmt[i] >= 48 && fmt[i] <= 57) spec.prec = spec.prec * 10 + (fmt[i++] - 48);
      }
    }
    while (i < fmt.length && 'hlLqjzt'.includes(String.fromCharCode(fmt[i]))) spec.len += String.fromCharCode(fmt[i++]);
    if (i >= fmt.length) {
      out.push(37);
      break;
    }
    spec.conv = String.fromCharCode(fmt[i]);
    switch (spec.conv) {
      case 'd':
      case 'i': {
        const [v] = nextArg();
        out.push(...ascii(formatInt(toSigned(v, spec.len), spec, false)));
        break;
      }
      case 'u':
      case 'x':
      case 'X':
      case 'o': {
        const [v] = nextArg();
        out.push(...ascii(formatInt(toUnsigned(v, spec.len), spec, true)));
        break;
      }
      case 'c': {
        const [v] = nextArg();
        const b = N(v) & 255;
        padBytes(out, [b], spec);
        break;
      }
      case 's': {
        const [v, t] = nextArg();
        if (t.k !== 'ptr') throw new RuntimeError(`%s necesita un texto en ${fname}`);
        const p = P(v);
        let s: number[];
        if (p.a === 0) s = bytes('(null)');
        else s = m.readCString(p, 'el texto de %s', spec.prec >= 0 ? spec.prec : Infinity);
        padBytes(out, s, spec);
        break;
      }
      case 'f':
      case 'F':
      case 'e':
      case 'E':
      case 'g':
      case 'G':
      case 'a':
      case 'A': {
        const [v, t] = nextArg();
        const x = t.k === 'float' ? (v as number) : N(v);
        out.push(...ascii(formatFloat(x, spec)));
        break;
      }
      case 'p': {
        const [v] = nextArg();
        const p = P(v);
        const s = p.a === 0 && !p.f ? '(nil)' : '0x' + (p.a + 0x55550000000).toString(16);
        padBytes(out, ascii(s), spec);
        break;
      }
      case 'n':
        nextArg();
        break;
      default:
        out.push(37, ...ascii(spec.conv));
    }
  }
  return out;
}

function ascii(s: string): number[] {
  const r = new Array<number>(s.length);
  for (let i = 0; i < s.length; i++) r[i] = s.charCodeAt(i);
  return r;
}

function padBytes(out: number[], b: number[], spec: Spec): void {
  const fill = Math.max(0, spec.width - b.length);
  if (!spec.minus) for (let k = 0; k < fill; k++) out.push(32);
  for (const x of b) out.push(x);
  if (spec.minus) for (let k = 0; k < fill; k++) out.push(32);
}

function toSigned(v: Value, len: string): bigint {
  const b = typeof v === 'bigint' ? v : BigInt(Math.trunc(N(v)));
  switch (len) {
    case 'hh':
      return BigInt.asIntN(8, b);
    case 'h':
      return BigInt.asIntN(16, b);
    case 'l':
    case 'll':
    case 'q':
    case 'j':
    case 'z':
    case 't':
      return BigInt.asIntN(64, b);
    default:
      return BigInt.asIntN(32, b);
  }
}

function toUnsigned(v: Value, len: string): bigint {
  const b = typeof v === 'bigint' ? v : BigInt(Math.trunc(N(v)));
  switch (len) {
    case 'hh':
      return BigInt.asUintN(8, b);
    case 'h':
      return BigInt.asUintN(16, b);
    case 'l':
    case 'll':
    case 'q':
    case 'j':
    case 'z':
    case 't':
      return BigInt.asUintN(64, b);
    default:
      return BigInt.asUintN(32, b);
  }
}

// ───────────────────────── scanf ─────────────────────────

interface Reader {
  peek(): number;
  get(): number;
}

function stdinReader(m: Machine, s: Stream | undefined): Reader {
  return {
    peek: () => (s?.unget?.length ? s.unget[s.unget.length - 1] : m.peekByte()),
    get: () => (s?.unget?.length ? s.unget.pop()! : m.readByte()),
  };
}

function arrayReader(data: ArrayLike<number>, start = 0, onMove?: (pos: number) => void): Reader & { pos: number } {
  const r = {
    pos: start,
    peek: () => (r.pos < data.length ? data[r.pos] : -1),
    get: () => {
      const c = r.pos < data.length ? data[r.pos++] : -1;
      onMove?.(r.pos);
      return c;
    },
  };
  return r;
}

const isSpace = (c: number) => c === 32 || (c >= 9 && c <= 13);
const isDigit = (c: number) => c >= 48 && c <= 57;

export function doScanf(m: Machine, rd: Reader, fmt: number[], args: Value[], types: CType[]): number {
  let assigned = 0;
  let ai = 0;
  let anyInput = false;
  const fail = () => (assigned === 0 && !anyInput && rd.peek() === -1 ? -1 : assigned);
  for (let i = 0; i < fmt.length; i++) {
    const c = fmt[i];
    if (isSpace(c)) {
      while (isSpace(rd.peek())) rd.get();
      continue;
    }
    if (c !== 37) {
      const x = rd.peek();
      if (x === -1) return fail();
      if (x !== c) return assigned;
      rd.get();
      anyInput = true;
      continue;
    }
    i++;
    if (fmt[i] === 37) {
      while (isSpace(rd.peek())) rd.get();
      if (rd.peek() !== 37) return rd.peek() === -1 ? fail() : assigned;
      rd.get();
      continue;
    }
    let suppress = false;
    if (fmt[i] === 42) {
      suppress = true;
      i++;
    }
    let width = 0;
    while (isDigit(fmt[i])) width = width * 10 + (fmt[i++] - 48);
    let len = '';
    while (i < fmt.length && 'hlLqjzt'.includes(String.fromCharCode(fmt[i]))) len += String.fromCharCode(fmt[i++]);
    const conv = String.fromCharCode(fmt[i]);
    const target = (): [Ptr, CType] => {
      if (ai >= args.length) throw new RuntimeError('Faltan variables en scanf', 'Cada % del formato necesita una variable (con &) después.');
      const p = P(args[ai]);
      const t = types[ai];
      ai++;
      if (t.k !== 'ptr') throw new RuntimeError('scanf necesita direcciones (&variable)');
      if (p.a === 0) throw new RuntimeError('scanf ha recibido un puntero NULL', 'Pásale la dirección de una variable: &x');
      return [p, t.to];
    };
    if (conv === 'n') {
      if (!suppress) {
        const [p, t] = target();
        m.storeTo(p, t, 0);
      }
      continue;
    }
    if (conv !== 'c' && conv !== '[') {
      while (isSpace(rd.peek())) rd.get();
    }
    if (rd.peek() === -1) return fail();
    const maxW = width || Infinity;
    if ('diuoxX'.includes(conv)) {
      let text = '';
      const base = conv === 'o' ? 8 : conv === 'x' || conv === 'X' ? 16 : conv === 'i' ? 0 : 10;
      let ch = rd.peek();
      if ((ch === 43 || ch === 45) && text.length < maxW) {
        text += String.fromCharCode(rd.get());
        ch = rd.peek();
      }
      let b = base;
      if ((b === 0 || b === 16) && ch === 48 && text.length < maxW) {
        text += String.fromCharCode(rd.get());
        ch = rd.peek();
        if ((ch === 120 || ch === 88) && text.length < maxW) {
          text += String.fromCharCode(rd.get());
          b = 16;
          ch = rd.peek();
        } else if (b === 0) b = 8;
      }
      if (b === 0) b = 10;
      const valid = (x: number) => (b === 16 ? /[0-9a-fA-F]/.test(String.fromCharCode(x)) : b === 8 ? x >= 48 && x <= 55 : isDigit(x));
      while (text.length < maxW && rd.peek() !== -1 && valid(rd.peek())) text += String.fromCharCode(rd.get());
      const digits = text.replace(/^[+-]/, '').replace(/^0[xX]/, '');
      if (!/[0-9a-fA-F]/.test(digits) && !/^[+-]?0$/.test(text) && !/^[+-]?0[xX]?$/.test(text)) {
        return assigned;
      }
      anyInput = true;
      if (suppress) continue;
      const [p, t] = target();
      const neg = text.startsWith('-');
      let v = 0n;
      const body = text.replace(/^[+-]/, '').replace(/^0[xX]/, '');
      for (const d of body) v = v * BigInt(b) + BigInt(parseInt(d, 16));
      if (neg) v = -v;
      // desbordamiento: como strtol, se queda en el límite
      if (t.k === 'int') {
        if (t.size === 8) m.storeTo(p, t, t.signed ? clampBig(v, -(2n ** 63n), 2n ** 63n - 1n) : BigInt.asUintN(64, v));
        else if (t.size === 4) m.storeTo(p, t, t.signed ? Number(clampBig(v, -(2n ** 31n), 2n ** 31n - 1n)) : Number(BigInt.asUintN(32, v)));
        else m.storeTo(p, t, Number(BigInt.asIntN(32, v)));
      } else throw new RuntimeError('%d necesita la dirección de un entero');
      assigned++;
      continue;
    }
    if ('fFeEgGaA'.includes(conv)) {
      let text = '';
      const take = () => (text += String.fromCharCode(rd.get()));
      if ((rd.peek() === 43 || rd.peek() === 45) && text.length < maxW) take();
      const word = (w: string) => {
        // inf / nan
        let k = 0;
        while (k < w.length && text.length < maxW && String.fromCharCode(rd.peek()).toLowerCase() === w[k]) {
          take();
          k++;
        }
        return k === w.length;
      };
      const lower = String.fromCharCode(rd.peek()).toLowerCase();
      let ok = false;
      if (lower === 'i') ok = word('inf');
      else if (lower === 'n') ok = word('nan');
      else {
        let digits = 0;
        while (text.length < maxW && isDigit(rd.peek())) {
          take();
          digits++;
        }
        if (text.length < maxW && rd.peek() === 46) {
          take();
          while (text.length < maxW && isDigit(rd.peek())) {
            take();
            digits++;
          }
        }
        if (digits > 0 && text.length < maxW && (rd.peek() === 101 || rd.peek() === 69)) {
          take();
          if (text.length < maxW && (rd.peek() === 43 || rd.peek() === 45)) take();
          while (text.length < maxW && isDigit(rd.peek())) take();
        }
        ok = digits > 0;
      }
      if (!ok) return assigned;
      anyInput = true;
      if (suppress) continue;
      const [p, t] = target();
      let v = Number(text.replace(/[eE][+-]?$/, ''));
      if (/^[+-]?inf/i.test(text)) v = text.startsWith('-') ? -Infinity : Infinity;
      if (/nan/i.test(text)) v = NaN;
      if (t.k !== 'float') throw new RuntimeError('%f necesita la dirección de un float o double');
      m.storeTo(p, t, t.size === 4 ? Math.fround(v) : v);
      assigned++;
      continue;
    }
    if (conv === 'c') {
      const n = width || 1;
      const got: number[] = [];
      while (got.length < n && rd.peek() !== -1) got.push(rd.get());
      if (got.length === 0) return fail();
      anyInput = true;
      if (suppress) continue;
      const [p] = target();
      m.writeBytes(p, got, 'El carácter leído');
      assigned++;
      continue;
    }
    if (conv === 's' || conv === '[') {
      let accept: (x: number) => boolean;
      if (conv === 's') accept = (x) => !isSpace(x);
      else {
        i++;
        let negate = false;
        if (fmt[i] === 94) {
          negate = true;
          i++;
        }
        const set = new Set<number>();
        let first = true;
        while (i < fmt.length && (fmt[i] !== 93 || first)) {
          if (fmt[i + 1] === 45 && fmt[i + 2] !== undefined && fmt[i + 2] !== 93) {
            for (let x = fmt[i]; x <= fmt[i + 2]; x++) set.add(x);
            i += 3;
          } else set.add(fmt[i++]);
          first = false;
        }
        accept = (x) => set.has(x) !== negate;
      }
      const got: number[] = [];
      while (got.length < maxW && rd.peek() !== -1 && accept(rd.peek())) got.push(rd.get());
      if (got.length === 0) return rd.peek() === -1 ? fail() : assigned;
      anyInput = true;
      if (suppress) continue;
      const [p] = target();
      m.writeBytes(p, [...got, 0], 'El texto leído');
      assigned++;
      continue;
    }
    if (conv === 'p') {
      while (rd.peek() !== -1 && !isSpace(rd.peek())) rd.get();
      if (!suppress) ai++;
      continue;
    }
    throw new RuntimeError(`Formato %${conv} no soportado en scanf`);
  }
  return assigned;
}

function clampBig(v: bigint, lo: bigint, hi: bigint): bigint {
  return v < lo ? lo : v > hi ? hi : v;
}

// ───────────────────────── utilidades ─────────────────────────

function str(m: Machine, v: Value, what: string): number[] {
  return m.readCString(P(v), what);
}

function jsStr(m: Machine, v: Value, what: string): string {
  return dec.decode(new Uint8Array(str(m, v, what)));
}

function stream(m: Machine, v: Value, fname: string): Stream {
  const p = P(v);
  if (p.a === 0) throw new RuntimeError(`${fname} ha recibido un FILE* NULL`, 'Comprueba que fopen ha funcionado: if (f == NULL) { ... }');
  const s = m.streams.get(p.a);
  if (!s) throw new RuntimeError(`${fname} necesita un fichero abierto con fopen`);
  if (s.closed) throw new RuntimeError(`El fichero '${s.name}' ya está cerrado`, 'No uses un fichero después de fclose.');
  return s;
}

function writeTo(m: Machine, s: Stream, b: number[]): void {
  if (s.kind === 'stdout' || s.kind === 'stderr') {
    m.write(b);
    return;
  }
  if (!s.write) throw new RuntimeError(`El fichero '${s.name}' está abierto solo para leer`, 'Ábrelo con "w" (escribir) o "a" (añadir).');
  for (const x of b) {
    if (s.pos < s.data.length) s.data[s.pos] = x;
    else s.data.push(x);
    s.pos++;
  }
}

function readerOf(m: Machine, s: Stream): Reader {
  if (s.kind === 'stdin') return stdinReader(m, s);
  if (!s.read) throw new RuntimeError(`El fichero '${s.name}' está abierto solo para escribir`, 'Ábrelo con "r" para leer.');
  return {
    peek: () => (s.unget?.length ? s.unget[s.unget.length - 1] : s.pos < s.data.length ? s.data[s.pos] : -1),
    get: () => {
      if (s.unget?.length) return s.unget.pop()!;
      if (s.pos < s.data.length) return s.data[s.pos++];
      s.eof = true;
      return -1;
    },
  };
}

function readLine(rd: Reader, max: number): number[] | null {
  const got: number[] = [];
  if (rd.peek() === -1) return null;
  while (got.length < max) {
    const c = rd.get();
    if (c === -1) break;
    got.push(c);
    if (c === 10) break;
  }
  return got;
}

function memBytes(m: Machine, p: Ptr, n: number, write: boolean): number {
  if (n === 0) return p.a;
  return m.access(p, n, write);
}

function charOf(v: Value): number {
  return N(v) & 255;
}

const ctype = (pred: (c: number) => boolean, bit: number) => (_m: Machine, a: Value[]) => {
  const c = N(a[0]);
  if (c === -1) return 0;
  return pred(c & 255) ? bit : 0;
};

let seedWarned = false;
void seedWarned;

// generador de números aleatorios (TYPE_3 de la glibc, para que rand() dé lo mismo)
class GlibcRand {
  private r: number[] = [];
  private k = 0;
  constructor(seed: number) {
    this.seed(seed);
  }
  seed(seed: number): void {
    const r = new Array<number>(34);
    r[0] = seed === 0 ? 1 : seed | 0;
    for (let i = 1; i < 31; i++) {
      const hi = Math.trunc(r[i - 1] / 127773);
      const lo = r[i - 1] % 127773;
      let word = 16807 * lo - 2836 * hi;
      if (word < 0) word += 2147483647;
      r[i] = word;
    }
    for (let i = 31; i < 34; i++) r[i] = r[i - 31];
    this.r = r;
    this.k = 34;
    for (let i = 0; i < 310; i++) this.next();
  }
  next(): number {
    const r = this.r;
    const v = (r[this.k - 31] + r[this.k - 3]) | 0;
    r.push(v);
    this.k++;
    if (r.length > 1000) {
      this.r = r.slice(-34);
      this.k = 34;
    }
    return v >>> 1;
  }
}

const rngs = new WeakMap<Machine, GlibcRand>();
function rng(m: Machine): GlibcRand {
  let g = rngs.get(m);
  if (!g) {
    g = new GlibcRand(1);
    rngs.set(m, g);
  }
  return g;
}

function mathFn(f: (x: number) => number): Builtin {
  return (_m, a) => f(a[0] as number);
}
function mathFnF(f: (x: number) => number): Builtin {
  return (_m, a) => Math.fround(f(a[0] as number));
}

function cRound(x: number): number {
  // round() de C: los .5 se alejan del cero
  return x < 0 ? -Math.round(-x) : Math.round(x);
}

function fmod(x: number, y: number): number {
  return x % y;
}

function parseIntPrefix(s: number[], base: number): { v: bigint; used: number } {
  let i = 0;
  while (i < s.length && isSpace(s[i])) i++;
  let neg = false;
  if (s[i] === 43 || s[i] === 45) {
    neg = s[i] === 45;
    i++;
  }
  let b = base;
  if ((b === 0 || b === 16) && s[i] === 48 && (s[i + 1] === 120 || s[i + 1] === 88)) {
    i += 2;
    b = 16;
  } else if (b === 0 && s[i] === 48) b = 8;
  if (b === 0) b = 10;
  let v = 0n;
  let digits = 0;
  for (; i < s.length; i++) {
    const ch = String.fromCharCode(s[i]).toLowerCase();
    const d = parseInt(ch, 36);
    if (Number.isNaN(d) || d >= b) break;
    v = v * BigInt(b) + BigInt(d);
    digits++;
  }
  return { v: neg ? -v : v, used: digits ? i : 0 };
}

function parseFloatPrefix(s: number[]): { v: number; used: number } {
  const text = dec.decode(new Uint8Array(s));
  const m = /^\s*([+-]?(?:inf(?:inity)?|nan|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?))/i.exec(text);
  if (!m) return { v: 0, used: 0 };
  let v = Number(m[1]);
  if (/inf/i.test(m[1])) v = m[1].startsWith('-') ? -Infinity : Infinity;
  if (/nan/i.test(m[1])) v = NaN;
  return { v, used: enc.encode(m[0]).length };
}

function cmpBytes(a: number[], b: number[], n = Infinity): number {
  for (let i = 0; i < n; i++) {
    const x = i < a.length ? a[i] : 0;
    const y = i < b.length ? b[i] : 0;
    if (x !== y) return x < y ? -1 : 1;
    if (x === 0) return 0;
  }
  return 0;
}

// ───────────────────────── tabla de funciones ─────────────────────────

const LIB: Record<string, Builtin> = {
  // stdio
  printf: (m, a, t) => {
    const out = formatPrintf(m, str(m, a[0], 'el formato de printf'), a.slice(1), t.slice(1), 'printf');
    m.write(out);
    return out.length;
  },
  fprintf: (m, a, t) => {
    const s = stream(m, a[0], 'fprintf');
    const out = formatPrintf(m, str(m, a[1], 'el formato de fprintf'), a.slice(2), t.slice(2), 'fprintf');
    writeTo(m, s, out);
    return out.length;
  },
  sprintf: (m, a, t) => {
    const out = formatPrintf(m, str(m, a[1], 'el formato de sprintf'), a.slice(2), t.slice(2), 'sprintf');
    m.writeBytes(P(a[0]), [...out, 0], 'El texto de sprintf');
    return out.length;
  },
  snprintf: (m, a, t) => {
    const out = formatPrintf(m, str(m, a[2], 'el formato de snprintf'), a.slice(3), t.slice(3), 'snprintf');
    const n = N(a[1]);
    if (n > 0) m.writeBytes(P(a[0]), [...out.slice(0, n - 1), 0], 'El texto de snprintf');
    return out.length;
  },
  puts: (m, a) => {
    m.write([...str(m, a[0], 'el texto de puts'), 10]);
    return 1;
  },
  putchar: (m, a) => {
    m.write([charOf(a[0])]);
    return charOf(a[0]);
  },
  fputs: (m, a) => {
    writeTo(m, stream(m, a[1], 'fputs'), str(m, a[0], 'el texto de fputs'));
    return 1;
  },
  fputc: (m, a) => {
    writeTo(m, stream(m, a[1], 'fputc'), [charOf(a[0])]);
    return charOf(a[0]);
  },
  putc: (m, a) => LIB.fputc(m, a, []),
  getchar: (m) => {
    const s = [...m.streams.values()].find((x) => x.kind === 'stdin');
    return stdinReader(m, s).get();
  },
  getch: (m) => LIB.getchar(m, [], []),
  getche: (m) => {
    const c = LIB.getchar(m, [], []) as number;
    if (c >= 0) m.write([c]);
    return c;
  },
  fgetc: (m, a) => readerOf(m, stream(m, a[0], 'fgetc')).get(),
  getc: (m, a) => LIB.fgetc(m, a, []),
  ungetc: (m, a) => {
    const s = stream(m, a[1], 'ungetc');
    const c = N(a[0]);
    if (c === -1) return -1;
    (s.unget ??= []).push(c & 255);
    return c;
  },
  gets: (m, a) => {
    const s = [...m.streams.values()].find((x) => x.kind === 'stdin');
    const line = readLine(stdinReader(m, s), Infinity);
    if (!line) return NULLPTR;
    if (line[line.length - 1] === 10) line.pop();
    m.writeBytes(P(a[0]), [...line, 0], 'El texto leído con gets');
    return a[0];
  },
  fgets: (m, a) => {
    const n = N(a[1]);
    if (n <= 0) return NULLPTR;
    const s = stream(m, a[2], 'fgets');
    const line = readLine(readerOf(m, s), n - 1);
    if (!line) return NULLPTR;
    m.writeBytes(P(a[0]), [...line, 0], 'El texto leído con fgets');
    return a[0];
  },
  scanf: (m, a, t) => {
    const s = [...m.streams.values()].find((x) => x.kind === 'stdin');
    return doScanf(m, stdinReader(m, s), str(m, a[0], 'el formato de scanf'), a.slice(1), t.slice(1));
  },
  fscanf: (m, a, t) => {
    const s = stream(m, a[0], 'fscanf');
    return doScanf(m, readerOf(m, s), str(m, a[1], 'el formato de fscanf'), a.slice(2), t.slice(2));
  },
  sscanf: (m, a, t) => {
    const src = str(m, a[0], 'el texto de sscanf');
    return doScanf(m, arrayReader(src), str(m, a[1], 'el formato de sscanf'), a.slice(2), t.slice(2));
  },
  fflush: (m, a) => {
    const p = P(a[0]);
    if (p.a === 0) return 0;
    const s = m.streams.get(p.a);
    if (s?.kind === 'stdin') {
      // como en Windows: descarta lo que queda de la línea ya escrita
      s.unget = [];
      if (m.stdinPos > 0 && m.stdin[m.stdinPos - 1] !== 10) {
        while (m.stdinPos < m.stdin.length) {
          if (m.stdin[m.stdinPos++] === 10) break;
        }
      }
    }
    return 0;
  },
  perror: (m, a) => {
    const p = P(a[0]);
    const prefix = p.a ? jsStr(m, a[0], 'el texto de perror') + ': ' : '';
    m.write(bytes(prefix + 'Error\n'));
    return undefined;
  },
  fopen: (m, a) => {
    const name = jsStr(m, a[0], 'el nombre del fichero');
    const mode = jsStr(m, a[1], 'el modo de fopen');
    if (!/^[rwa]\+?b?\+?$/.test(mode)) {
      throw new RuntimeError(`Modo de fopen no válido: "${mode}"`, 'Usa "r" para leer, "w" para escribir (borra lo que había) o "a" para añadir al final.');
    }
    const exists = name in m.files;
    if (mode[0] === 'r' && !exists) return NULLPTR;
    const plus = mode.includes('+');
    const data = mode[0] === 'w' ? [] : bytes(m.files[name] ?? '');
    const o = m.mallocObj(16, `FILE ${name}`, 'tmp');
    const s: Stream = {
      kind: 'file',
      name,
      data,
      pos: mode[0] === 'a' ? data.length : 0,
      eof: false,
      closed: false,
      read: mode[0] === 'r' || plus,
      write: mode[0] !== 'r' || plus,
    };
    m.streams.set(o.base, s);
    if (s.write) m.files[name] = dec.decode(new Uint8Array(data));
    return { a: o.base, o };
  },
  fclose: (m, a) => {
    const s = stream(m, a[0], 'fclose');
    if (s.kind === 'file' && s.write) m.files[s.name] = dec.decode(new Uint8Array(s.data));
    s.closed = true;
    return 0;
  },
  feof: (m, a) => {
    const s = stream(m, a[0], 'feof');
    if (s.kind === 'stdin') return m.stdinPos >= m.stdin.length && !m.interactive ? 1 : 0;
    return s.eof ? 1 : 0;
  },
  rewind: (m, a) => {
    const s = stream(m, a[0], 'rewind');
    s.pos = 0;
    s.eof = false;
    return undefined;
  },
  remove: (m, a) => {
    const name = jsStr(m, a[0], 'el nombre del fichero');
    if (!(name in m.files)) return -1;
    delete m.files[name];
    return 0;
  },

  // stdlib
  malloc: (m, a) => {
    const n = N(a[0]);
    if (n < 0 || n > 200_000_000) return NULLPTR;
    const o = m.mallocObj(n, 'memoria de malloc');
    return { a: o.base, o };
  },
  calloc: (m, a) => {
    const n = N(a[0]) * N(a[1]);
    if (n < 0 || n > 200_000_000) return NULLPTR;
    const o = m.mallocObj(n, 'memoria de calloc');
    m.u8.fill(0, o.base, o.base + n);
    m.init.fill(1, o.base, o.base + n);
    return { a: o.base, o };
  },
  realloc: (m, a) => {
    const old = P(a[0]);
    const n = N(a[1]);
    if (old.a === 0) return LIB.malloc(m, [a[1]], []);
    const oo = old.o ?? m.heapObjs.get(old.a);
    if (!oo || oo.kind !== 'heap' || !oo.alive || old.a !== oo.base) {
      throw new RuntimeError('realloc solo funciona con punteros que vienen de malloc, calloc o realloc');
    }
    const o = m.mallocObj(n, 'memoria de realloc');
    o.type = oo.type;
    m.copy(o.base, oo.base, Math.min(n, oo.size));
    m.free({ a: oo.base, o: oo });
    return { a: o.base, o };
  },
  free: (m, a) => {
    m.free(P(a[0]));
    return undefined;
  },
  abs: (_m, a) => {
    const x = a[0] as number;
    return x === -2147483648 ? x : Math.abs(x);
  },
  labs: (_m, a) => {
    const x = a[0] as bigint;
    return BigInt.asIntN(64, x < 0n ? -x : x);
  },
  llabs: (m, a) => LIB.labs(m, a, []),
  atoi: (m, a) => Number(BigInt.asIntN(32, parseIntPrefix(str(m, a[0], 'el texto de atoi'), 10).v)),
  atol: (m, a) => BigInt.asIntN(64, parseIntPrefix(str(m, a[0], 'el texto de atol'), 10).v),
  atoll: (m, a) => LIB.atol(m, a, []),
  atof: (m, a) => parseFloatPrefix(str(m, a[0], 'el texto de atof')).v,
  strtol: (m, a) => {
    const s = str(m, a[0], 'el texto de strtol');
    const r = parseIntPrefix(s, N(a[2]));
    if (P(a[1]).a !== 0) m.storeTo(P(a[1]), { k: 'ptr', to: T.char }, { a: P(a[0]).a + r.used, o: P(a[0]).o });
    return BigInt.asIntN(64, r.v);
  },
  strtod: (m, a) => {
    const s = str(m, a[0], 'el texto de strtod');
    const r = parseFloatPrefix(s);
    if (P(a[1]).a !== 0) m.storeTo(P(a[1]), { k: 'ptr', to: T.char }, { a: P(a[0]).a + r.used, o: P(a[0]).o });
    return r.v;
  },
  rand: (m) => rng(m).next(),
  srand: (m, a) => {
    rng(m).seed(N(a[0]) >>> 0);
    return undefined;
  },
  exit: (_m, a) => {
    throw new ExitSignal(N(a[0]));
  },
  system: (m, a) => {
    const cmd = jsStr(m, a[0], 'el comando').trim().toLowerCase();
    if (cmd === 'cls' || cmd === 'clear') m.write([27, 91, 50, 74]);
    return 0;
  },
  qsort: (m, a) => {
    const base = P(a[0]);
    const n = N(a[1]);
    const size = N(a[2]);
    const cmp = P(a[3]);
    if (n <= 1) return undefined;
    const start = m.access(base, n * size, true);
    const items: number[][] = [];
    const inits: number[][] = [];
    for (let i = 0; i < n; i++) {
      items.push(Array.from(m.u8.subarray(start + i * size, start + (i + 1) * size)));
      inits.push(Array.from(m.init.subarray(start + i * size, start + (i + 1) * size)));
    }
    // dos zonas temporales para pasar los elementos a la función de comparar
    const ta = m.mallocObj(size, 'qsort', 'tmp');
    const tb = m.mallocObj(size, 'qsort', 'tmp');
    const order = items.map((_, i) => i);
    order.sort((x, y) => {
      m.u8.set(items[x], ta.base);
      m.init.set(inits[x], ta.base);
      m.u8.set(items[y], tb.base);
      m.init.set(inits[y], tb.base);
      ta.type = base.o?.type && base.o.type.k === 'array' ? leafOf(base.o.type) : undefined;
      tb.type = ta.type;
      const r = m.callFunctionPointer(cmp, [{ a: ta.base, o: ta }, { a: tb.base, o: tb }]);
      return N(r);
    });
    order.forEach((src, i) => {
      m.u8.set(items[src], start + i * size);
      m.init.set(inits[src], start + i * size);
    });
    ta.alive = false;
    tb.alive = false;
    return undefined;
  },

  // string.h
  strlen: (m, a) => BigInt(str(m, a[0], 'el texto de strlen').length),
  strcpy: (m, a) => {
    const s = str(m, a[1], 'el texto que copias con strcpy');
    m.writeBytes(P(a[0]), [...s, 0], 'El texto de strcpy');
    return a[0];
  },
  strncpy: (m, a) => {
    const n = N(a[2]);
    const s = m.readCString(P(a[1]), 'el texto de strncpy', n);
    const out = s.slice(0, n);
    while (out.length < n) out.push(0);
    m.writeBytes(P(a[0]), out, 'El texto de strncpy');
    return a[0];
  },
  strcat: (m, a) => {
    const d = str(m, a[0], 'el destino de strcat');
    const s = str(m, a[1], 'el texto de strcat');
    const dst = P(a[0]);
    m.writeBytes({ a: dst.a + d.length, o: dst.o }, [...s, 0], 'El texto de strcat');
    return a[0];
  },
  strncat: (m, a) => {
    const d = str(m, a[0], 'el destino de strncat');
    const s = m.readCString(P(a[1]), 'el texto de strncat', N(a[2]));
    const dst = P(a[0]);
    m.writeBytes({ a: dst.a + d.length, o: dst.o }, [...s, 0], 'El texto de strncat');
    return a[0];
  },
  strcmp: (m, a) => cmpBytes(str(m, a[0], 'el primer texto de strcmp'), str(m, a[1], 'el segundo texto de strcmp')),
  strncmp: (m, a) => {
    const n = N(a[2]);
    return cmpBytes(m.readCString(P(a[0]), 'el texto de strncmp', n), m.readCString(P(a[1]), 'el texto de strncmp', n), n);
  },
  strchr: (m, a) => {
    const s = str(m, a[0], 'el texto de strchr');
    const c = charOf(a[1]);
    const i = c === 0 ? s.length : s.indexOf(c);
    if (i < 0) return NULLPTR;
    return { a: P(a[0]).a + i, o: P(a[0]).o };
  },
  strrchr: (m, a) => {
    const s = str(m, a[0], 'el texto de strrchr');
    const c = charOf(a[1]);
    const i = c === 0 ? s.length : s.lastIndexOf(c);
    if (i < 0) return NULLPTR;
    return { a: P(a[0]).a + i, o: P(a[0]).o };
  },
  strstr: (m, a) => {
    const s = str(m, a[0], 'el texto de strstr');
    const sub = str(m, a[1], 'el texto que buscas con strstr');
    outer: for (let i = 0; i + sub.length <= s.length; i++) {
      for (let k = 0; k < sub.length; k++) if (s[i + k] !== sub[k]) continue outer;
      return { a: P(a[0]).a + i, o: P(a[0]).o };
    }
    return NULLPTR;
  },
  strspn: (m, a) => {
    const s = str(m, a[0], 'el texto de strspn');
    const acc = new Set(str(m, a[1], 'el texto de strspn'));
    let i = 0;
    while (i < s.length && acc.has(s[i])) i++;
    return BigInt(i);
  },
  strcspn: (m, a) => {
    const s = str(m, a[0], 'el texto de strcspn');
    const rej = new Set(str(m, a[1], 'el texto de strcspn'));
    let i = 0;
    while (i < s.length && !rej.has(s[i])) i++;
    return BigInt(i);
  },
  strpbrk: (m, a) => {
    const s = str(m, a[0], 'el texto de strpbrk');
    const acc = new Set(str(m, a[1], 'el texto de strpbrk'));
    const i = s.findIndex((c) => acc.has(c));
    return i < 0 ? NULLPTR : { a: P(a[0]).a + i, o: P(a[0]).o };
  },
  strtok: (m, a) => {
    let p = P(a[0]);
    if (p.a === 0) {
      if (!m.strtokPos) return NULLPTR;
      p = m.strtokPos;
    }
    const delim = new Set(str(m, a[1], 'los separadores de strtok'));
    const s = m.readCString(p, 'el texto de strtok');
    let i = 0;
    while (i < s.length && delim.has(s[i])) i++;
    if (i >= s.length) {
      m.strtokPos = null;
      return NULLPTR;
    }
    let j = i;
    while (j < s.length && !delim.has(s[j])) j++;
    if (j < s.length) {
      m.writeBytes({ a: p.a + j, o: p.o }, [0], 'strtok');
      m.strtokPos = { a: p.a + j + 1, o: p.o };
    } else m.strtokPos = null;
    return { a: p.a + i, o: p.o };
  },
  strdup: (m, a) => {
    const s = str(m, a[0], 'el texto de strdup');
    const o = m.mallocObj(s.length + 1, 'memoria de strdup');
    const p = { a: o.base, o };
    m.writeBytes(p, [...s, 0], 'strdup');
    return p;
  },
  strrev: (m, a) => {
    const s = str(m, a[0], 'el texto de strrev');
    m.writeBytes(P(a[0]), s.reverse(), 'strrev');
    return a[0];
  },
  strupr: (m, a) => {
    const s = str(m, a[0], 'el texto de strupr');
    m.writeBytes(P(a[0]), s.map((c) => (c >= 97 && c <= 122 ? c - 32 : c)), 'strupr');
    return a[0];
  },
  strlwr: (m, a) => {
    const s = str(m, a[0], 'el texto de strlwr');
    m.writeBytes(P(a[0]), s.map((c) => (c >= 65 && c <= 90 ? c + 32 : c)), 'strlwr');
    return a[0];
  },
  memset: (m, a) => {
    const n = N(a[2]);
    const p = P(a[0]);
    const at = memBytes(m, p, n, true);
    m.u8.fill(charOf(a[1]), at, at + n);
    m.init.fill(1, at, at + n);
    if (m.prov.size) for (let i = 0; i < n; i++) m.prov.delete(at + i);
    return a[0];
  },
  memcpy: (m, a) => {
    const n = N(a[2]);
    const d = memBytes(m, P(a[0]), n, true);
    const s = memBytes(m, P(a[1]), n, false);
    m.copy(d, s, n);
    return a[0];
  },
  memmove: (m, a) => LIB.memcpy(m, a, []),
  memcmp: (m, a) => {
    const n = N(a[2]);
    const x = memBytes(m, P(a[0]), n, false);
    const y = memBytes(m, P(a[1]), n, false);
    for (let i = 0; i < n; i++) {
      if (m.u8[x + i] !== m.u8[y + i]) return m.u8[x + i] < m.u8[y + i] ? -1 : 1;
    }
    return 0;
  },
  memchr: (m, a) => {
    const n = N(a[2]);
    const p = P(a[0]);
    const x = memBytes(m, p, n, false);
    const c = charOf(a[1]);
    for (let i = 0; i < n; i++) if (m.u8[x + i] === c) return { a: p.a + i, o: p.o };
    return NULLPTR;
  },

  // math.h
  sqrt: mathFn(Math.sqrt),
  pow: (_m, a) => Math.pow(a[0] as number, a[1] as number),
  fabs: mathFn(Math.abs),
  ceil: mathFn(Math.ceil),
  floor: mathFn(Math.floor),
  round: mathFn(cRound),
  trunc: mathFn(Math.trunc),
  sin: mathFn(Math.sin),
  cos: mathFn(Math.cos),
  tan: mathFn(Math.tan),
  asin: mathFn(Math.asin),
  acos: mathFn(Math.acos),
  atan: mathFn(Math.atan),
  atan2: (_m, a) => Math.atan2(a[0] as number, a[1] as number),
  sinh: mathFn(Math.sinh),
  cosh: mathFn(Math.cosh),
  tanh: mathFn(Math.tanh),
  exp: mathFn(Math.exp),
  log: mathFn(Math.log),
  log10: mathFn(Math.log10),
  log2: mathFn(Math.log2),
  fmod: (_m, a) => fmod(a[0] as number, a[1] as number),
  hypot: (_m, a) => Math.hypot(a[0] as number, a[1] as number),
  cbrt: mathFn(Math.cbrt),
  fmax: (_m, a) => Math.max(a[0] as number, a[1] as number),
  fmin: (_m, a) => Math.min(a[0] as number, a[1] as number),
  lround: (_m, a) => BigInt(cRound(a[0] as number)),
  sqrtf: mathFnF(Math.sqrt),
  powf: (_m, a) => Math.fround(Math.pow(a[0] as number, a[1] as number)),
  fabsf: mathFnF(Math.abs),
  roundf: mathFnF(cRound),
  floorf: mathFnF(Math.floor),
  ceilf: mathFnF(Math.ceil),

  // ctype.h
  // mismos valores que la glibc (devuelve el bit de su tabla, no solo 1)
  isalpha: ctype((c) => (c >= 65 && c <= 90) || (c >= 97 && c <= 122), 1024),
  isdigit: ctype(isDigit, 2048),
  isalnum: ctype((c) => isDigit(c) || (c >= 65 && c <= 90) || (c >= 97 && c <= 122), 8),
  isspace: ctype(isSpace, 8192),
  isupper: ctype((c) => c >= 65 && c <= 90, 256),
  islower: ctype((c) => c >= 97 && c <= 122, 512),
  ispunct: ctype((c) => c >= 33 && c <= 126 && !isDigit(c) && !((c >= 65 && c <= 90) || (c >= 97 && c <= 122)), 4),
  isxdigit: ctype((c) => isDigit(c) || (c >= 65 && c <= 70) || (c >= 97 && c <= 102), 4096),
  isprint: ctype((c) => c >= 32 && c <= 126, 16384),
  iscntrl: ctype((c) => c < 32 || c === 127, 2),
  isgraph: ctype((c) => c >= 33 && c <= 126, 32768),
  toupper: (_m, a) => {
    const c = N(a[0]);
    return c >= 97 && c <= 122 ? c - 32 : c;
  },
  tolower: (_m, a) => {
    const c = N(a[0]);
    return c >= 65 && c <= 90 ? c + 32 : c;
  },

  // time.h
  time: (m, a) => {
    const t = BigInt(m.now);
    if (P(a[0]).a !== 0) m.storeTo(P(a[0]), T.long, t);
    return t;
  },
  clock: (m) => BigInt(m.steps),
  difftime: (_m, a) => Number(a[0] as bigint) - Number(a[1] as bigint),

  // locale.h, conio.h, windows.h, unistd.h
  setlocale: (m) => m.allocStatic([67, 0], 'locale'),
  clrscr: (m) => {
    m.write([27, 91, 50, 74]);
    return undefined;
  },
  Sleep: () => undefined,
  sleep: () => 0,
  usleep: () => 0,
};

function leafOf(t: CType): CType {
  while (t.k === 'array') t = t.of;
  return t;
}

export function callBuiltin(m: Machine, name: string, args: Value[], types: CType[]): Value {
  const f = LIB[name];
  if (!f) throw new RuntimeError(`La función '${name}' no está disponible en esta web`);
  const r = f(m, args, types);
  // malloc: recuerda el tipo para dar mejores mensajes si te sales
  return r;
}

/** Tras `int *v = malloc(n * sizeof(int))`, la memoria sabe que guarda ints. */
export function tagHeapType(p: Value, t: CType): void {
  const ptr = p as Ptr;
  if (ptr && ptr.o && ptr.o.kind === 'heap' && !ptr.o.type && t.k !== 'void' && sizeOf(t) > 0 && !isCharLike(t)) ptr.o.type = t;
}
