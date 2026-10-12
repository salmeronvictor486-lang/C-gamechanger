// Punto de entrada del intérprete de C: compilar y ejecutar.
import { Machine, type RunOptions, type RunResult } from './machine';
import { compile, type CompileResult } from './parser';

export type { Diagnostic } from './diagnostics';
export type { RunOptions, RunResult } from './machine';
export type { CompileResult } from './parser';
export { compile } from './parser';

export interface ProgramRun {
  compiled: CompileResult;
  run: RunResult | null;
}

const enc = new TextEncoder();
const dec = new TextDecoder();

/** Compila y ejecuta un programa con una entrada fija (para comprobar ejercicios). */
export function runC(src: string, stdin = '', opts: Omit<RunOptions, 'stdin'> = {}): ProgramRun {
  const compiled = compile(src);
  if (!compiled.ok) return { compiled, run: null };
  const m = new Machine(compiled.program, { ...opts, stdin: enc.encode(stdin) });
  return { compiled, run: m.run() };
}

export function outputText(r: RunResult): string {
  return dec.decode(r.output);
}

export { Machine };
