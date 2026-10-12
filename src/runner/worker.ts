/// <reference lib="webworker" />
// Web Worker: compila y ejecuta el programa sin bloquear la página.
import { compile } from '../c/parser';
import { Machine } from '../c/machine';
import type { RunDone, RunRequest, WorkerMessage } from './protocol';
import { finishSummary } from './summary';

const ctx = self as unknown as DedicatedWorkerGlobalScope;
const enc = new TextEncoder();

ctx.onmessage = (ev: MessageEvent<RunRequest>) => {
  const req = ev.data;
  const t0 = performance.now();
  const post = (m: WorkerMessage) => ctx.postMessage(m);
  const compiled = compile(req.src);
  if (!compiled.ok) {
    post({
      id: req.id,
      type: 'done',
      done: {
        summary: { status: 'compile-error', error: compiled.error },
        warnings: compiled.warnings,
        steps: 0,
        totalOutput: 0,
        inputMarks: [],
        stdinUsed: 0,
        files: req.files,
        leaks: { count: 0, bytes: 0 },
        ms: 0,
      },
    });
    return;
  }
  let skip = req.skip;
  let total = 0;
  const m = new Machine(compiled.program, {
    stdin: enc.encode(req.stdin),
    interactive: req.interactive,
    now: req.now,
    maxMs: req.maxMs,
    maxSteps: req.maxSteps,
    files: req.files,
    onOutput: (bytes) => {
      total += bytes.length;
      let b = bytes;
      if (skip > 0) {
        const drop = Math.min(skip, b.length);
        skip -= drop;
        b = b.subarray(drop);
      }
      if (b.length) post({ id: req.id, type: 'out', bytes: b.slice() });
    },
  });
  const r = m.run();
  const done: RunDone = {
    summary: finishSummary(r),
    warnings: compiled.warnings,
    steps: r.steps,
    totalOutput: total,
    inputMarks: r.inputMarks,
    stdinUsed: r.stdinUsed,
    files: r.files,
    leaks: r.leaks,
    ms: performance.now() - t0,
  };
  post({ id: req.id, type: 'done', done });
};
