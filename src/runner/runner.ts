// Ejecutar programas desde la página: sesión interactiva (consola con scanf) y
// ejecución por lotes para comprobar ejercicios.
//
// Para que scanf espere a que escribas sin bloquear el navegador, el programa se
// vuelve a ejecutar desde el principio cada vez que envías una línea, con toda la
// entrada acumulada, y solo se muestra la salida nueva. Como el programa es
// determinista (la hora y rand() se fijan al empezar), el resultado es el mismo.
import type { RunDone, RunRequest, WorkerMessage } from './protocol';

let nextId = 1;

function makeWorker(): Worker {
  return new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
}

export interface SessionEvents {
  onOutput(text: string): void;
  onNeedInput(): void;
  onDone(done: RunDone): void;
}

export interface SessionOptions {
  files?: Record<string, string>;
  maxMs?: number;
}

export class InteractiveSession {
  private worker: Worker | null = null;
  private stdin = '';
  private shown = 0;
  private eof = false;
  private decoder = new TextDecoder();
  private now = Math.floor(Date.now() / 1000);
  private watchdog: ReturnType<typeof setTimeout> | null = null;
  private currentId = 0;
  private finished = false;
  private startedAt = 0;

  constructor(
    private src: string,
    private events: SessionEvents,
    private opts: SessionOptions = {},
  ) {}

  start(): void {
    this.startedAt = performance.now();
    this.launch();
  }

  send(line: string): void {
    if (this.finished) return;
    this.stdin += line + '\n';
    this.launch();
  }

  sendEOF(): void {
    if (this.finished) return;
    this.eof = true;
    this.launch();
  }

  stop(): void {
    this.finished = true;
    this.clear();
    this.worker?.terminate();
    this.worker = null;
  }

  get running(): boolean {
    return !this.finished;
  }

  private clear(): void {
    if (this.watchdog) clearTimeout(this.watchdog);
    this.watchdog = null;
  }

  private launch(): void {
    if (!this.worker) {
      this.worker = makeWorker();
      this.worker.onmessage = (ev: MessageEvent<WorkerMessage>) => this.onMessage(ev.data);
    }
    const id = nextId++;
    this.currentId = id;
    const maxMs = this.opts.maxMs ?? 8000;
    const req: RunRequest = {
      id,
      src: this.src,
      stdin: this.stdin,
      interactive: !this.eof,
      skip: this.shown,
      now: this.now,
      maxMs,
      maxSteps: 200_000_000,
      files: this.opts.files ?? {},
    };
    this.worker.postMessage(req);
    this.clear();
    // si el worker se queda colgado (no debería), se corta igualmente
    this.watchdog = setTimeout(() => {
      this.worker?.terminate();
      this.worker = null;
      this.finish({
        summary: { status: 'limit', kind: 'time', line: 0 },
        warnings: [],
        steps: 0,
        totalOutput: this.shown,
        inputMarks: [],
        stdinUsed: 0,
        files: {},
        leaks: { count: 0, bytes: 0 },
        ms: maxMs,
      });
    }, maxMs + 3000);
  }

  private onMessage(msg: WorkerMessage): void {
    if (msg.id !== this.currentId || this.finished) return;
    if (msg.type === 'out') {
      this.shown += msg.bytes.length;
      this.events.onOutput(this.decoder.decode(msg.bytes, { stream: true }));
      return;
    }
    this.clear();
    const done = msg.done;
    if (done.summary.status === 'need-input') {
      this.events.onNeedInput();
      return;
    }
    this.finish({ ...done, ms: performance.now() - this.startedAt });
  }

  private finish(done: RunDone): void {
    if (this.finished) return;
    this.finished = true;
    const rest = this.decoder.decode();
    if (rest) this.events.onOutput(rest);
    this.worker?.terminate();
    this.worker = null;
    this.events.onDone(done);
  }
}

export interface BatchResult {
  output: string;
  done: RunDone;
}

/** Ejecuta un programa con una entrada fija (sin esperar al teclado). */
export function runOnce(src: string, stdin: string, opts: { maxMs?: number; files?: Record<string, string>; worker?: Worker } = {}): Promise<BatchResult> {
  return new Promise((resolve) => {
    const worker = opts.worker ?? makeWorker();
    const own = !opts.worker;
    const id = nextId++;
    const chunks: Uint8Array[] = [];
    const maxMs = opts.maxMs ?? 4000;
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({
        output: decodeAll(chunks),
        done: {
          summary: { status: 'limit', kind: 'time', line: 0 },
          warnings: [],
          steps: 0,
          totalOutput: 0,
          inputMarks: [],
          stdinUsed: 0,
          files: {},
          leaks: { count: 0, bytes: 0 },
          ms: maxMs,
        },
      });
    }, maxMs + 3000);
    worker.onmessage = (ev: MessageEvent<WorkerMessage>) => {
      const msg = ev.data;
      if (msg.id !== id) return;
      if (msg.type === 'out') {
        chunks.push(msg.bytes);
        return;
      }
      clearTimeout(timer);
      if (own) worker.terminate();
      resolve({ output: decodeAll(chunks), done: msg.done });
    };
    const req: RunRequest = {
      id,
      src,
      stdin,
      interactive: false,
      skip: 0,
      now: 1700000000,
      maxMs,
      maxSteps: 100_000_000,
      files: opts.files ?? {},
    };
    worker.postMessage(req);
  });
}

function decodeAll(chunks: Uint8Array[]): string {
  const total = chunks.reduce((n, c) => n + c.length, 0);
  const all = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    all.set(c, off);
    off += c.length;
  }
  return new TextDecoder().decode(all);
}

/** Un worker reutilizable para varias ejecuciones seguidas (comprobar ejercicios). */
export function createWorker(): Worker {
  return makeWorker();
}
