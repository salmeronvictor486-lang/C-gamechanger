// Formateo de números igual que la glibc: redondeo exacto (al par en los empates),
// %f, %e, %g, enteros con anchura, precisión y flags.

const pow10cache: bigint[] = [];
function pow10(n: number): bigint {
  if (n < 64) {
    let v = pow10cache[n];
    if (v === undefined) {
      v = 10n ** BigInt(n);
      pow10cache[n] = v;
    }
    return v;
  }
  return 10n ** BigInt(n);
}

const f64 = new DataView(new ArrayBuffer(8));

/** Valor exacto de un double finito ≥ 0: digits · 10^-scale. */
function exact(x: number): { digits: bigint; scale: number } {
  f64.setFloat64(0, x);
  const hi = f64.getUint32(0);
  const lo = f64.getUint32(4);
  const expBits = (hi >>> 20) & 0x7ff;
  let mant = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
  let e: number;
  if (expBits === 0) e = -1074;
  else {
    mant |= 1n << 52n;
    e = expBits - 1075;
  }
  if (mant === 0n) return { digits: 0n, scale: 0 };
  // quita ceros binarios para trabajar con números más pequeños
  while ((mant & 1n) === 0n && e < 0) {
    mant >>= 1n;
    e++;
  }
  if (e >= 0) return { digits: mant << BigInt(e), scale: 0 };
  return { digits: mant * 5n ** BigInt(-e), scale: -e };
}

/** round(valor · 10^prec) con redondeo al par. `prec` puede ser negativo. */
function roundScaled(digits: bigint, scale: number, prec: number): bigint {
  if (scale <= prec) return digits * pow10(prec - scale);
  const div = pow10(scale - prec);
  const q = digits / div;
  const r = digits % div;
  const twice = r * 2n;
  if (twice > div || (twice === div && (q & 1n) === 1n)) return q + 1n;
  return q;
}

function digitCount(n: bigint): number {
  return n === 0n ? 1 : n.toString().length;
}

export function fixedDigits(x: number, prec: number): string {
  const { digits, scale } = exact(Math.abs(x));
  const n = roundScaled(digits, scale, prec);
  let s = n.toString();
  if (prec === 0) return s;
  s = s.padStart(prec + 1, '0');
  return s.slice(0, s.length - prec) + '.' + s.slice(s.length - prec);
}

function expParts(x: number, prec: number): { mant: string; exp: number } {
  const { digits, scale } = exact(Math.abs(x));
  if (digits === 0n) return { mant: '0'.repeat(prec + 1), exp: 0 };
  let X = digitCount(digits) - 1 - scale;
  let n = roundScaled(digits, scale, prec - X);
  if (digitCount(n) > prec + 1) {
    n /= 10n;
    X += 1;
  }
  return { mant: n.toString(), exp: X };
}

function expString(x: number, prec: number, upper: boolean, alt: boolean): string {
  const { mant, exp } = expParts(x, prec);
  let s = mant[0];
  if (prec > 0 || alt) s += '.';
  s += mant.slice(1);
  const es = Math.abs(exp).toString().padStart(2, '0');
  return s + (upper ? 'E' : 'e') + (exp < 0 ? '-' : '+') + es;
}

function gString(x: number, precIn: number, upper: boolean, alt: boolean): string {
  const P = precIn === 0 ? 1 : precIn;
  let X: number;
  if (x === 0) X = 0;
  else X = expParts(x, P - 1).exp;
  let s: string;
  if (P > X && X >= -4) {
    s = fixedDigits(x, P - 1 - X);
    if (alt && !s.includes('.')) s += '.';
  } else {
    s = expString(x, P - 1, upper, alt);
  }
  if (!alt) {
    // quita ceros sobrantes de la parte decimal
    const m = /^([^eE]*?)(\.?0*)([eE].*)?$/.exec(s);
    if (m && m[1].includes('.')) {
      let base = m[1] + m[2];
      base = base.replace(/\.?0+$/, '');
      s = base + (m[3] ?? '');
    } else if (m && m[2].startsWith('.')) {
      s = m[1] + (m[3] ?? '');
    }
  }
  return s;
}

export interface Spec {
  minus: boolean;
  plus: boolean;
  space: boolean;
  alt: boolean;
  zero: boolean;
  width: number;
  prec: number; // -1 = sin precisión
  len: string;
  conv: string;
}

function pad(body: string, sign: string, spec: Spec, numeric: boolean, prefix = ''): string {
  const len = sign.length + prefix.length + body.length;
  if (len >= spec.width) return sign + prefix + body;
  const fill = spec.width - len;
  if (spec.minus) return sign + prefix + body + ' '.repeat(fill);
  if (spec.zero && numeric) return sign + prefix + '0'.repeat(fill) + body;
  return ' '.repeat(fill) + sign + prefix + body;
}

export function formatFloat(x: number, spec: Spec): string {
  const neg = x < 0 || Object.is(x, -0);
  const sign = neg ? '-' : spec.plus ? '+' : spec.space ? ' ' : '';
  const upper = spec.conv === 'F' || spec.conv === 'E' || spec.conv === 'G' || spec.conv === 'A';
  if (!Number.isFinite(x)) {
    const s = Number.isNaN(x) ? 'nan' : 'inf';
    const nanSign = Number.isNaN(x) ? '-' : sign;
    return pad(upper ? s.toUpperCase() : s, nanSign, { ...spec, zero: false }, false);
  }
  const prec = spec.prec < 0 ? 6 : spec.prec;
  let body: string;
  switch (spec.conv) {
    case 'f':
    case 'F':
      body = fixedDigits(x, prec);
      if (spec.alt && prec === 0) body += '.';
      break;
    case 'e':
    case 'E':
      body = expString(x, prec, upper, spec.alt);
      break;
    case 'g':
    case 'G':
      body = gString(Math.abs(x), prec, upper, spec.alt);
      break;
    default:
      // %a: aproximación con notación exponencial
      body = expString(x, prec, upper, spec.alt);
  }
  return pad(body, sign, spec, true);
}

export function formatInt(v: bigint, spec: Spec, unsigned: boolean): string {
  const conv = spec.conv;
  const neg = !unsigned && v < 0n;
  const abs = neg ? -v : v;
  let digits: string;
  switch (conv) {
    case 'x':
      digits = abs.toString(16);
      break;
    case 'X':
      digits = abs.toString(16).toUpperCase();
      break;
    case 'o':
      digits = abs.toString(8);
      break;
    default:
      digits = abs.toString(10);
  }
  if (spec.prec >= 0) {
    if (spec.prec === 0 && abs === 0n) digits = '';
    digits = digits.padStart(spec.prec, '0');
  }
  let prefix = '';
  if (spec.alt) {
    if ((conv === 'x' || conv === 'X') && abs !== 0n) prefix = conv === 'x' ? '0x' : '0X';
    if (conv === 'o' && !digits.startsWith('0')) digits = '0' + digits;
  }
  const sign = neg ? '-' : !unsigned && spec.plus ? '+' : !unsigned && spec.space ? ' ' : '';
  return pad(digits, sign, { ...spec, zero: spec.zero && spec.prec < 0 }, true, prefix);
}

export function padString(s: string, spec: Spec): string {
  return pad(s, '', { ...spec, zero: false }, false);
}
