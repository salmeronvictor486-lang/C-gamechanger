// Lexer: convierte el código en una lista de tokens con su línea y columna.
import { CompileError, type Diagnostic } from './diagnostics';
import { T, type CType } from './types';

export type TokKind = 'id' | 'num' | 'char' | 'str' | 'p' | 'dir' | 'eof';

export interface Token {
  t: TokKind;
  v: string;
  line: number;
  col: number;
  /** Primer token de su línea. */
  bol?: boolean;
  /** Hay espacio antes (para reconstruir macros). */
  sp?: boolean;
  num?: number | bigint;
  numType?: CType;
  bytes?: number[];
  /** Línea donde se escribió la macro que generó este token (si viene de una). */
  macro?: string;
}

const PUNCTS = [
  '...',
  '<<=',
  '>>=',
  '->',
  '++',
  '--',
  '<<',
  '>>',
  '<=',
  '>=',
  '==',
  '!=',
  '&&',
  '||',
  '*=',
  '/=',
  '%=',
  '+=',
  '-=',
  '&=',
  '^=',
  '|=',
  '##',
];
const SINGLE = '[](){}.&*+-~!/%<>^|?:;=,#';

const encoder = new TextEncoder();

export function utf8(s: string): number[] {
  return Array.from(encoder.encode(s));
}

const STRANGE: Record<string, string> = {
  '“': 'comillas tipográficas “ ”: usa comillas rectas "',
  '”': 'comillas tipográficas “ ”: usa comillas rectas "',
  '‘': "comillas tipográficas ‘ ’: usa comillas rectas '",
  '’': "comillas tipográficas ‘ ’: usa comillas rectas '",
  '´': "un acento ´: para los caracteres se usa la comilla recta '",
  '`': "un acento grave `: para los caracteres se usa la comilla recta '",
  '¿': 'un signo ¿ fuera de una cadena: el texto va entre comillas "..."',
  '¡': 'un signo ¡ fuera de una cadena: el texto va entre comillas "..."',
  ' ': 'un espacio especial (no separable): bórralo y escribe un espacio normal',
};

export function lex(src: string, warnings: Diagnostic[]): Token[] {
  const out: Token[] = [];
  let i = 0;
  let line = 1;
  let lineStart = 0;
  let bol = true;
  let sp = false;
  const n = src.length;

  const err = (msg: string, hint?: string, l = line, c = i - lineStart + 1): never => {
    throw new CompileError(l, c, msg, hint);
  };

  const readEscape = (bytes: number[], quote: string): void => {
    // estamos justo después de la barra
    const c = src[i];
    i++;
    switch (c) {
      case 'n':
        bytes.push(10);
        return;
      case 't':
        bytes.push(9);
        return;
      case 'r':
        bytes.push(13);
        return;
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7': {
        let v = c.charCodeAt(0) - 48;
        let k = 1;
        while (k < 3 && i < n && src[i] >= '0' && src[i] <= '7') {
          v = v * 8 + (src.charCodeAt(i) - 48);
          i++;
          k++;
        }
        bytes.push(v & 255);
        return;
      }
      case 'x': {
        let v = 0;
        let k = 0;
        while (i < n && /[0-9a-fA-F]/.test(src[i])) {
          v = v * 16 + parseInt(src[i], 16);
          i++;
          k++;
        }
        if (k === 0) err('Secuencia \\x sin dígitos hexadecimales', 'Ejemplo correcto: \\x41 es la letra A.');
        bytes.push(v & 255);
        return;
      }
      case 'a':
        bytes.push(7);
        return;
      case 'b':
        bytes.push(8);
        return;
      case 'f':
        bytes.push(12);
        return;
      case 'v':
        bytes.push(11);
        return;
      case 'e':
        bytes.push(27);
        return;
      case '\\':
      case "'":
      case '"':
      case '?':
        bytes.push(c.charCodeAt(0));
        return;
      case '\n':
        line++;
        lineStart = i;
        return;
      default:
        if (c === undefined || c === quote) {
          err('Barra invertida \\ al final del texto', 'Para escribir una barra invertida usa \\\\.');
        }
        warnings.push({
          severity: 'warning',
          line,
          col: i - lineStart - 1,
          message: `Secuencia de escape desconocida '\\${c}'`,
          hint: 'Las más usadas son \\n (salto de línea), \\t (tabulador), \\" (comillas) y \\\\ (barra).',
        });
        bytes.push(...utf8(c));
    }
  };

  while (i < n) {
    const c = src[i];
    // saltos de línea y espacios
    if (c === '\n') {
      i++;
      line++;
      lineStart = i;
      bol = true;
      sp = true;
      continue;
    }
    if (c === ' ' || c === '\t' || c === '\r' || c === '\f' || c === '\v') {
      i++;
      sp = true;
      continue;
    }
    if (c === '\\' && (src[i + 1] === '\n' || (src[i + 1] === '\r' && src[i + 2] === '\n'))) {
      i += src[i + 1] === '\r' ? 3 : 2;
      line++;
      lineStart = i;
      continue;
    }
    // comentarios
    if (c === '/' && src[i + 1] === '/') {
      while (i < n && src[i] !== '\n') i++;
      sp = true;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const l0 = line;
      const c0 = i - lineStart + 1;
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
        if (src[i] === '\n') {
          line++;
          lineStart = i + 1;
        }
        i++;
      }
      if (i >= n) err('Comentario /* sin cerrar', 'Cierra el comentario con */', l0, c0);
      i += 2;
      sp = true;
      continue;
    }
    const col = i - lineStart + 1;
    // directivas del preprocesador
    if (c === '#' && bol) {
      const dirLine = line;
      i++;
      let text = '';
      while (i < n && src[i] !== '\n') {
        if (src[i] === '\\' && src[i + 1] === '\n') {
          i += 2;
          line++;
          lineStart = i;
          text += ' ';
          continue;
        }
        if (src[i] === '/' && src[i + 1] === '/') {
          while (i < n && src[i] !== '\n') i++;
          break;
        }
        if (src[i] === '/' && src[i + 1] === '*') {
          i += 2;
          while (i < n && !(src[i] === '*' && src[i + 1] === '/')) {
            if (src[i] === '\n') {
              line++;
              lineStart = i + 1;
            }
            i++;
          }
          i += 2;
          text += ' ';
          continue;
        }
        text += src[i];
        i++;
      }
      out.push({ t: 'dir', v: text.replace(/\r$/, ''), line: dirLine, col, bol: true });
      continue;
    }
    const tokBol = bol;
    bol = false;
    const tokSp = sp;
    sp = false;
    // identificadores y palabras clave
    if (/[A-Za-z_]/.test(c)) {
      let j = i + 1;
      while (j < n && /[A-Za-z0-9_]/.test(src[j])) j++;
      out.push({ t: 'id', v: src.slice(i, j), line, col, bol: tokBol, sp: tokSp });
      i = j;
      continue;
    }
    // números
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] ?? ''))) {
      let j = i;
      while (j < n && /[0-9A-Za-z_.]/.test(src[j])) {
        const ch = src[j];
        if ((ch === 'e' || ch === 'E' || ch === 'p' || ch === 'P') && (src[j + 1] === '+' || src[j + 1] === '-')) j += 2;
        else j++;
      }
      const text = src.slice(i, j);
      out.push(parseNumber(text, line, col, tokBol, tokSp, warnings));
      i = j;
      continue;
    }
    // caracteres
    if (c === "'") {
      const start = i;
      i++;
      const bytes: number[] = [];
      while (i < n && src[i] !== "'") {
        if (src[i] === '\n') err("Falta cerrar la comilla simple ' del carácter", "Un carácter se escribe así: 'a'", line, col);
        if (src[i] === '\\') {
          i++;
          readEscape(bytes, "'");
        } else {
          const cp = src.codePointAt(i)!;
          const ch = String.fromCodePoint(cp);
          bytes.push(...utf8(ch));
          i += ch.length;
        }
      }
      if (i >= n) err("Falta cerrar la comilla simple ' del carácter", "Un carácter se escribe así: 'a'", line, col);
      i++;
      if (bytes.length === 0) err("Carácter vacío ''", "Entre las comillas simples tiene que haber un carácter, por ejemplo 'a' o ' ' (espacio).", line, col);
      let v: number;
      if (bytes.length === 1) {
        v = bytes[0] > 127 ? bytes[0] - 256 : bytes[0];
      } else {
        v = 0;
        for (const b of bytes) v = ((v << 8) | b) | 0;
        const isUtf = bytes.some((b) => b > 127);
        warnings.push({
          severity: 'warning',
          line,
          col,
          message: isUtf
            ? `El carácter ${src.slice(start, i)} ocupa ${bytes.length} bytes: no cabe en un char`
            : `Constante de varios caracteres '${String.fromCharCode(...bytes)}'`,
          hint: isUtf
            ? 'En C un char es 1 byte. Las letras con tilde y la ñ ocupan 2 bytes en UTF-8: guárdalas en una cadena "ñ" en vez de en un char.'
            : "Entre comillas simples va un solo carácter. Para texto usa comillas dobles: \"hola\".",
        });
      }
      out.push({ t: 'char', v: src.slice(start, i), line, col, bol: tokBol, sp: tokSp, num: v, numType: T.int });
      continue;
    }
    // cadenas
    if (c === '"') {
      const start = i;
      i++;
      const bytes: number[] = [];
      while (i < n && src[i] !== '"') {
        if (src[i] === '\n') {
          err('Falta cerrar las comillas " de la cadena', 'Cada texto empieza y termina con comillas dobles en la misma línea: "Hola"', line, col);
        }
        if (src[i] === '\\') {
          i++;
          readEscape(bytes, '"');
        } else {
          const cp = src.codePointAt(i)!;
          const ch = String.fromCodePoint(cp);
          bytes.push(...utf8(ch));
          i += ch.length;
        }
      }
      if (i >= n) err('Falta cerrar las comillas " de la cadena', 'Cada texto empieza y termina con comillas dobles: "Hola"', line, col);
      i++;
      out.push({ t: 'str', v: src.slice(start, i), line, col, bol: tokBol, sp: tokSp, bytes });
      continue;
    }
    // signos
    let p: string | undefined;
    for (const q of PUNCTS) {
      if (src.startsWith(q, i)) {
        p = q;
        break;
      }
    }
    if (!p && SINGLE.includes(c)) p = c;
    if (p) {
      out.push({ t: 'p', v: p, line, col, bol: tokBol, sp: tokSp });
      i += p.length;
      continue;
    }
    const strange = STRANGE[c];
    if (strange) err(`Carácter no válido en el código: ${strange}`, '¿Has copiado el código de un documento de texto? Esos programas cambian las comillas.');
    if (c === '$' || c === '@') err(`El carácter '${c}' no se puede usar en C fuera de una cadena`);
    const cp = String.fromCodePoint(src.codePointAt(i)!);
    if (/[áéíóúÁÉÍÓÚñÑüÜ]/.test(cp)) {
      err(
        `Las tildes y la ñ no se pueden usar en nombres de variables ('${cp}')`,
        'Escribe los nombres sin tildes: anio en vez de año, numero en vez de número. Dentro de las cadenas "..." sí puedes usarlas.',
      );
    }
    err(`Carácter no válido en el código: '${cp}'`);
  }
  out.push({ t: 'eof', v: '', line, col: i - lineStart + 1, bol: true });
  return out;
}

function parseNumber(text: string, line: number, col: number, bol: boolean, sp: boolean, warnings: Diagnostic[]): Token {
  const bad = (hint?: string): never => {
    throw new CompileError(line, col, `Número no válido: ${text}`, hint);
  };
  const isHex = /^0[xX]/.test(text);
  if (!isHex && /[.eE]/.test(text)) {
    const m = /^([0-9]*\.?[0-9]*(?:[eE][+-]?[0-9]+)?)([fFlL]?)$/.exec(text);
    if (!m || m[1] === '.' || m[1] === '') bad('Los decimales se escriben con punto: 3.14 (no con coma).');
    const v = Number(m![1]);
    if (Number.isNaN(v)) bad();
    const f = m![2].toLowerCase() === 'f';
    return {
      t: 'num',
      v: text,
      line,
      col,
      bol,
      sp,
      num: f ? Math.fround(v) : v,
      numType: f ? T.float : T.double,
    };
  }
  const m = /^(0[xX][0-9a-fA-F]+|0[bB][01]+|[0-9]+)([uUlL]*)$/.exec(text);
  if (!m) {
    if (/^[0-9]+[A-Za-z_]/.test(text)) {
      bad('Los nombres de variables no pueden empezar por un número. Ejemplo: nota1 vale, 1nota no.');
    }
    bad();
  }
  const digits = m![1];
  const suf = m![2].toLowerCase();
  if (!/^(u?l{0,2}|l{0,2}u?)$/.test(suf) || suf === 'lul') bad();
  let big: bigint;
  if (/^0[xX]/.test(digits)) big = BigInt(digits);
  else if (/^0[bB]/.test(digits)) big = BigInt(digits);
  else if (digits.length > 1 && digits[0] === '0') {
    if (/[89]/.test(digits)) {
      bad('Un número que empieza por 0 se lee en octal (base 8) y no puede tener 8 ni 9. Quita el 0 del principio.');
    }
    big = BigInt('0o' + digits.slice(1));
    if (digits.length > 1) {
      warnings.push({
        severity: 'warning',
        line,
        col,
        message: `${digits} empieza por 0, así que C lo lee en octal (base 8): vale ${big}`,
        hint: 'Si querías el número decimal, quita el 0 del principio.',
      });
    }
  } else big = BigInt(digits);
  const decimal = !/^0[xXbB]/.test(digits) && !(digits.length > 1 && digits[0] === '0');
  const hasU = suf.includes('u');
  const ls = (suf.match(/l/g) ?? []).length;
  let type: CType;
  const fits = (max: bigint) => big <= max;
  const I32 = 0x7fffffffn;
  const U32 = 0xffffffffn;
  const I64 = 0x7fffffffffffffffn;
  if (hasU) {
    if (ls === 0 && fits(U32)) type = T.uint;
    else type = ls === 2 ? T.ullong : T.ulong;
  } else if (ls === 0) {
    if (fits(I32)) type = T.int;
    else if (!decimal && fits(U32)) type = T.uint;
    else if (fits(I64)) type = T.long;
    else type = T.ulong;
  } else {
    if (fits(I64)) type = ls === 2 ? T.llong : T.long;
    else type = ls === 2 ? T.ullong : T.ulong;
  }
  if (big > 0xffffffffffffffffn) bad('El número es demasiado grande incluso para un unsigned long long.');
  const num = type.k === 'int' && type.size === 8 ? big : Number(big);
  return { t: 'num', v: text, line, col, bol, sp, num, numType: type };
}
