// Mensajes entre la página y el Web Worker que ejecuta los programas.
import type { Diagnostic } from '../c/diagnostics';

export interface RunRequest {
  id: number;
  src: string;
  stdin: string;
  interactive: boolean;
  /** Bytes de salida que ya se mostraron en una ejecución anterior (se omiten). */
  skip: number;
  now: number;
  maxMs: number;
  maxSteps: number;
  files: Record<string, string>;
}

export type RunSummary =
  | { status: 'exit'; code: number }
  | { status: 'error'; message: string; hint?: string; line: number; stack: string[] }
  | { status: 'need-input' }
  | { status: 'limit'; kind: 'steps' | 'time'; line: number }
  | { status: 'compile-error'; error: Diagnostic };

export interface RunDone {
  summary: RunSummary;
  warnings: Diagnostic[];
  steps: number;
  totalOutput: number;
  inputMarks: number[];
  stdinUsed: number;
  files: Record<string, string>;
  leaks: { count: number; bytes: number };
  ms: number;
}

export type WorkerMessage = { id: number; type: 'out'; bytes: Uint8Array } | { id: number; type: 'done'; done: RunDone };
