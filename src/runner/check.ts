// Comprobar ejercicios: comparar la salida con la esperada y revisar el código.
import type { Exercise, ExerciseTest } from '../content/types';
import type { RunDone } from './protocol';

/** Quita espacios al final de cada línea y líneas vacías al final. */
export function normalize(s: string): string {
  return s
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.replace(/[ \t]+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

export interface Segment {
  kind: 'out' | 'in';
  text: string;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

/** Mezcla la salida con las líneas de entrada en el punto en que se leyeron: como se ve en una consola. */
export function transcript(output: string, input: string, marks: number[]): Segment[] {
  const bytes = enc.encode(output);
  const lines = input.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  const segs: Segment[] = [];
  let pos = 0;
  marks.forEach((mk, i) => {
    if (i >= lines.length) return;
    const end = Math.min(Math.max(mk, pos), bytes.length);
    if (end > pos) segs.push({ kind: 'out', text: dec.decode(bytes.subarray(pos, end)) });
    pos = end;
    segs.push({ kind: 'in', text: lines[i] + '\n' });
  });
  if (pos < bytes.length) segs.push({ kind: 'out', text: dec.decode(bytes.subarray(pos)) });
  return segs;
}

/** Código sin comentarios ni textos entre comillas (para buscar palabras clave). */
export function stripCode(src: string): string {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2;
      out += ' ';
      continue;
    }
    if (c === '"' || c === "'") {
      const q = c;
      out += q + q;
      i++;
      while (i < src.length && src[i] !== q && src[i] !== '\n') {
        if (src[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

export function failedRequirements(code: string, ex: Exercise): string[] {
  const clean = stripCode(code);
  const out: string[] = [];
  for (const r of ex.requires ?? []) {
    if (!new RegExp(r.re).test(clean)) out.push(r.msg);
  }
  for (const r of ex.forbids ?? []) {
    if (new RegExp(r.re).test(clean)) out.push(r.msg);
  }
  return out;
}

export interface TestOutcome {
  test: ExerciseTest;
  index: number;
  pass: boolean;
  expected: string;
  got: string;
  done: RunDone;
  expectedMarks: number[];
}

/** Primera línea distinta (para señalarla en la interfaz). */
export function firstDiff(expected: string, got: string): number {
  const a = normalize(expected).split('\n');
  const b = normalize(got).split('\n');
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i;
  return -1;
}

export function sameOutput(expected: string, got: string): boolean {
  return normalize(expected) === normalize(got);
}
