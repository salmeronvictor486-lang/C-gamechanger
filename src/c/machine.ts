// La máquina: convierte el árbol con tipos en funciones de JavaScript (closures) y las
// ejecuta sobre una memoria de bytes, comprobando los errores típicos de C: salirse de
// un array, usar variables sin valor, punteros NULL, memoria ya liberada…
import type { Expr, FuncSym, Init, Program, Stmt, VarSym } from './ast';
import { callBuiltin, tagHeapType, type Stream } from './lib';
import { arith, bitnot, convert, DivZero, NULLPTR, RuntimeError, truthy, type ArithOp, type MemObj, type Ptr, type Value } from './ops';
import { hasVla, isCharLike, sizeOf, T, typeName, type CType } from './types';

export class NeedInput extends Error {}
export class ExitSignal extends Error {
  constructor(readonly code: number) {
    super('exit');
  }
}
class LimitError extends Error {
  constructor(readonly kind: 'steps' | 'time') {
    super(kind);
  }
}

export interface RunOptions {
  stdin?: Uint8Array;
  /** Si la entrada se acaba, se pide más (NeedInput) en vez de dar EOF. */
  interactive?: boolean;
  maxSteps?: number;
  maxMs?: number;
  /** Segundos desde 1970 para time(). */
  now?: number;
  /** Salida en trozos (si no, solo al final). */
  onOutput?: (bytes: Uint8Array) => void;
  files?: Record<string, string>;
}

export type RunResult = {
  output: Uint8Array;
  /** Posición de la salida en la que se empezó a leer cada línea de la entrada. */
  inputMarks: number[];
  stdinUsed: number;
  steps: number;
  files: Record<string, string>;
  leaks: { count: number; bytes: number };
} & (
  | { status: 'exit'; code: number }
  | { status: 'error'; message: string; hint?: string; line: number; stack: string[] }
  | { status: 'need-input' }
  | { status: 'limit'; kind: 'steps' | 'time'; line: number }
);

type Frame = {
  bp: number;
  regs: Value[];
  objs: (MemObj | undefined)[];
  rv: Value;
  fn: FuncSym;
  retAddr: number;
  callLine: number;
};

type EvalFn = (fr: Frame) => Value;
type StmtFn = (fr: Frame) => number;

const NORMAL = 0;
const BREAK = 1;
const CONTINUE = 2;
const RETURN = 3;

const STACK_SIZE = 8 * 1024 * 1024;
const HEAP_INITIAL = 4 * 1024 * 1024;
const HEAP_MAX = 256 * 1024 * 1024;
const FN_BASE = 0x7f000000;
const MAX_DEPTH = 100000;

type LV =
  | { k: 'reg'; slot: number }
  | { k: 'addr'; fn: (fr: Frame) => number; obj: (fr: Frame) => MemObj }
  | { k: 'ptr'; fn: (fr: Frame) => Ptr };

export class Machine {
  // memoria
  buf!: ArrayBuffer;
  dv!: DataView;
  u8!: Uint8Array;
  init!: Uint8Array;
  private initBuf!: ArrayBuffer;
  memSize = 0;
  prov = new Map<number, Ptr>();
  dataEnd: number;
  stackBase: number;
  stackEnd: number;
  sp: number;
  heapBase: number;
  heapTop: number;
  heapLimit: number;
  heapObjs = new Map<number, MemObj>();
  private freeList: { addr: number; size: number }[] = [];

  // ejecución
  line = 0;
  steps = 0;
  private stepCheck = 65536;
  private maxSteps: number;
  private deadline: number;
  depth = 0;
  maxDepthSeen = 0;
  frames: Frame[] = [];
  private bodies: StmtFn[] = [];
  private globalObjs = new Map<VarSym, MemObj>();
  strObjs: MemObj[] = [];

  // entrada / salida
  stdin: Uint8Array;
  stdinPos = 0;
  interactive: boolean;
  out: number[] = [];
  private onOutput?: (bytes: Uint8Array) => void;
  now: number;
  randState = 1;
  streams = new Map<number, Stream>();
  files: Record<string, string>;
  strtokPos: Ptr | null = null;

  constructor(readonly prog: Program, opts: RunOptions = {}) {
    this.stdin = opts.stdin ?? new Uint8Array(0);
    this.interactive = !!opts.interactive;
    this.maxSteps = opts.maxSteps ?? 50_000_000;
    this.deadline = Date.now() + (opts.maxMs ?? 10_000);
    this.now = opts.now ?? Math.floor(Date.now() / 1000);
    this.onOutput = opts.onOutput;
    this.files = { ...(opts.files ?? {}) };
    this.dataEnd = prog.dataSize;
    this.stackBase = Math.ceil((this.dataEnd + 64) / 4096) * 4096;
    this.stackEnd = this.stackBase + STACK_SIZE;
    this.sp = this.stackBase;
    this.heapBase = this.stackEnd + 4096;
    this.heapTop = this.heapBase;
    this.heapLimit = this.heapBase + HEAP_MAX;
    this.allocMemory(this.heapBase + HEAP_INITIAL);
  }

  private allocMemory(size: number): void {
    const max = this.heapLimit;
    try {
      // memoria que puede crecer (malloc)
      const Ctor = ArrayBuffer as unknown as new (n: number, o: { maxByteLength: number }) => ArrayBuffer;
      this.buf = new Ctor(size, { maxByteLength: max });
      this.initBuf = new Ctor(size, { maxByteLength: max });
      if (!(this.buf as unknown as { resizable?: boolean }).resizable) throw new Error('no resizable');
    } catch {
      const fixed = this.heapBase + 64 * 1024 * 1024;
      this.buf = new ArrayBuffer(fixed);
      this.initBuf = new ArrayBuffer(fixed);
      this.heapLimit = fixed;
    }
    this.dv = new DataView(this.buf);
    this.u8 = new Uint8Array(this.buf);
    this.init = new Uint8Array(this.initBuf);
    this.memSize = this.buf.byteLength;
  }

  private growTo(end: number): void {
    if (end <= this.memSize) return;
    const r = this.buf as unknown as { resizable?: boolean; resize?: (n: number) => void };
    if (!r.resizable || end > this.heapLimit) {
      throw new RuntimeError('Se ha acabado la memoria', 'Pides demasiada memoria con malloc. ¿Hay un bucle que reserva sin parar?');
    }
    const size = Math.min(this.heapLimit, Math.max(end, this.memSize * 2));
    r.resize!(size);
    (this.initBuf as unknown as { resize: (n: number) => void }).resize(size);
    this.memSize = size;
  }

  // ───────────────────────── ejecutar ─────────────────────────

  run(): RunResult {
    let res: RunResult;
    const base = () => ({
      output: (this.flushOutput(), new Uint8Array(this.out)),
      inputMarks: this.inputMarks,
      stdinUsed: this.stdinPos,
      steps: this.steps,
      files: this.files,
      leaks: this.leaks(),
    });
    try {
      this.setup();
      const main = this.prog.main;
      const args: Value[] = [];
      if (main.params.length === 2) {
        const name = this.allocStatic([...new TextEncoder().encode('programa'), 0], 'argv[0]');
        const argv = this.mallocObj(16, 'argv', 'tmp');
        this.storePtr(argv.base, name);
        this.storePtr(argv.base + 8, NULLPTR);
        args.push(1, { a: argv.base, o: argv });
      }
      const rv = this.invoke(main, args, 0);
      this.flushFiles();
      res = { ...base(), status: 'exit', code: main.type.ret.k === 'void' ? 0 : typeof rv === 'number' ? rv : 0 };
    } catch (e) {
      this.flushFiles();
      if (e instanceof ExitSignal) res = { ...base(), status: 'exit', code: e.code };
      else if (e instanceof NeedInput) res = { ...base(), status: 'need-input' };
      else if (e instanceof LimitError) res = { ...base(), status: 'limit', kind: e.kind, line: this.errInfo?.line ?? this.line };
      else if (e instanceof RuntimeError) {
        res = { ...base(), status: 'error', message: e.message, hint: e.hint, line: this.errInfo?.line ?? this.line, stack: this.errInfo?.stack ?? this.stackTrace() };
      }
      else if (e instanceof RangeError && /call stack|too much recursion/i.test(e.message)) {
        res = {
          ...base(),
          status: 'error',
          message: `Demasiadas llamadas a funciones una dentro de otra (${this.maxDepthSeen} a la vez)`,
          hint:
            this.maxDepthSeen > 500
              ? 'Si la función es recursiva, comprueba que tiene un caso base que la detiene. Si el programa está bien, ten en cuenta que esta web admite unas mil llamadas anidadas (un ordenador con gcc admite muchas más): prueba con un número más pequeño.'
              : 'Si la función es recursiva, comprueba que tiene un caso base que la detiene y que cada llamada se acerca a él.',
          line: this.errInfo?.line ?? this.line,
          stack: this.errInfo?.stack ?? this.stackTrace(),
        };
      } else throw e;
    }
    return res;
  }

  private errInfo: { line: number; stack: string[] } | null = null;

  private stackTrace(): string[] {
    return this.frames
      .slice(-6)
      .reverse()
      .map((f) => f.fn.name);
  }

  private leaks(): { count: number; bytes: number } {
    let count = 0;
    let bytes = 0;
    for (const o of this.heapObjs.values()) {
      if (o.alive && o.kind === 'heap') {
        count++;
        bytes += o.size;
      }
    }
    return { count, bytes };
  }

  tick(): void {
    if (this.steps > this.maxSteps) throw new LimitError('steps');
    if (Date.now() > this.deadline) throw new LimitError('time');
    this.stepCheck = this.steps + 65536;
    this.flushOutput();
  }

  private flushOutput(): void {
    if (this.onOutput && this.out.length) {
      this.outTotal += this.out.length;
      this.onOutput(new Uint8Array(this.out));
      this.out = [];
    }
  }

  write(bytes: ArrayLike<number>): void {
    for (let i = 0; i < bytes.length; i++) this.out.push(bytes[i]);
    if (this.outTotal + this.out.length > 2_000_000) {
      throw new RuntimeError('El programa ha escrito demasiado texto', '¿Hay un bucle infinito con un printf dentro?');
    }
  }

  private setup(): void {
    const p = this.prog;
    for (let i = 0; i < p.strings.length; i++) {
      const s = p.strings[i];
      this.u8.set(s.bytes, s.addr);
      this.init.fill(1, s.addr, s.addr + s.bytes.length);
      this.strObjs[i] = { base: s.addr, size: s.bytes.length, name: 'texto', kind: 'str', alive: true, ro: true, type: { k: 'array', of: T.char, len: s.bytes.length } };
    }
    // las globales empiezan a 0
    for (const g of p.globals) {
      const size = sizeOf(g.type);
      this.init.fill(1, g.slot, g.slot + size);
      this.globalObjs.set(g, { base: g.slot, size, name: g.name, kind: 'var', alive: true, type: g.type });
    }
    for (const f of p.funcs) {
      if (!f.builtin && f.body) this.bodies[f.id] = this.stmt(f.body);
    }
    // stdin, stdout y stderr
    for (const g of p.globals) {
      if (g.extern && ['stdin', 'stdout', 'stderr'].includes(g.name)) {
        const o = this.mallocObj(16, g.name, 'tmp');
        this.streams.set(o.base, { kind: g.name as 'stdin' | 'stdout' | 'stderr', name: g.name, data: [], pos: 0, eof: false, closed: false, write: g.name !== 'stdin', read: g.name === 'stdin' });
        this.storePtr(g.slot, { a: o.base, o });
      }
    }
    // inicializadores de globales y static
    const dummy: Frame = { bp: 0, regs: [], objs: [], rv: undefined, fn: p.main, retAddr: 0, callLine: 0 };
    for (const g of p.globals) {
      if (g.init) {
        this.line = g.line;
        this.genInit(g.init, () => g.slot, () => this.globalObjs.get(g)!, g.type)(dummy);
      }
    }
  }

  // ───────────────────────── memoria ─────────────────────────

  allocStatic(bytes: number[], name: string): Ptr {
    const o = this.mallocObj(bytes.length, name, 'tmp');
    this.u8.set(bytes, o.base);
    this.init.fill(1, o.base, o.base + bytes.length);
    return { a: o.base, o };
  }

  mallocObj(size: number, name: string, kind: MemObj['kind'] = 'heap'): MemObj {
    const need = Math.max(16, Math.ceil(size / 16) * 16);
    let addr = -1;
    for (let i = 0; i < this.freeList.length; i++) {
      const b = this.freeList[i];
      if (b.size >= need) {
        addr = b.addr;
        if (b.size > need) {
          b.addr += need;
          b.size -= need;
        } else this.freeList.splice(i, 1);
        break;
      }
    }
    if (addr < 0) {
      addr = this.heapTop;
      // deja un hueco de 16 bytes entre bloques para que salirse se note
      this.heapTop += need + 16;
      this.growTo(this.heapTop);
    }
    this.init.fill(0, addr, addr + need);
    const o: MemObj = { base: addr, size, name, kind, alive: true };
    this.heapObjs.set(addr, o);
    return o;
  }

  free(p: Ptr): void {
    if (p.a === 0) return;
    const o = p.o ?? this.heapObjs.get(p.a);
    if (!o || o.kind !== 'heap') {
      throw new RuntimeError('free() solo se puede usar con memoria reservada con malloc, calloc o realloc', o ? `Intentas liberar ${o.kind === 'var' ? `la variable '${o.name}'` : 'memoria que no es de malloc'}.` : undefined);
    }
    if (!o.alive) throw new RuntimeError('Esta memoria ya se había liberado (free dos veces)', 'Después de free(p) no vuelvas a usar p. Puedes poner p = NULL; justo después.');
    if (p.a !== o.base) throw new RuntimeError('free() tiene que recibir el puntero que devolvió malloc, no uno que apunte a la mitad del bloque');
    o.alive = false;
    this.heapObjs.delete(o.base);
    this.freeList.push({ addr: o.base, size: Math.max(16, Math.ceil(o.size / 16) * 16) });
  }

  /** Comprueba un acceso a memoria a través de un puntero y devuelve la dirección. */
  access(p: Ptr, size: number, write: boolean): number {
    const a = p.a;
    const o = p.o;
    if (o) {
      if (!o.alive) {
        if (o.kind === 'heap') throw new RuntimeError('Usas memoria que ya se liberó con free', 'Después de free(p) ya no puedes usar p. Libera la memoria solo cuando ya no la necesites.');
        throw new RuntimeError(`Usas la variable '${o.name}', que ya no existe`, `'${o.name}' era una variable local de ${o.fn ? `la función ${o.fn}` : 'una función'} que ya terminó. No devuelvas punteros a variables locales.`);
      }
      if (a < o.base || a + size > o.base + o.size) throw this.oobError(o, a);
      if (write && o.ro) {
        throw new RuntimeError('No se puede modificar un texto escrito entre comillas', 'Los textos "así" son de solo lectura. Cópialo a un array de char para poder cambiarlo: char s[] = "texto";');
      }
      return a;
    }
    if (p.f) throw new RuntimeError('Usas un puntero a función como si apuntara a datos');
    if (a === 0) {
      throw new RuntimeError('Usas un puntero NULL (que no apunta a nada)', 'Antes de usar *p o p[i], el puntero tiene que apuntar a algo: p = &x; o p = malloc(...). Si malloc devuelve NULL, no hay memoria.');
    }
    if (a < 64 || a + size > this.memSize) {
      throw new RuntimeError('Usas un puntero que no apunta a ningún sitio válido', '¿Tiene el puntero un valor? Un puntero sin inicializar apunta a cualquier sitio.');
    }
    return a;
  }

  oobError(o: MemObj, a: number): RuntimeError {
    const off = a - o.base;
    if (o.kind === 'heap') {
      const t = o.type;
      if (t) {
        const es = sizeOf(t);
        const idx = Math.floor(off / es);
        const n = Math.floor(o.size / es);
        return new RuntimeError(
          `Te sales de la memoria reservada: usas la posición ${idx} y solo reservaste ${n}`,
          `Con malloc(${n} * sizeof(${typeName(t)})) tienes las posiciones de la 0 a la ${n - 1}.`,
        );
      }
      return new RuntimeError(`Te sales de la memoria reservada con malloc (${o.size} bytes)`, 'Reserva espacio suficiente: malloc(n * sizeof(tipo)).');
    }
    if (o.kind === 'str') return new RuntimeError('Te sales del final de un texto');
    if (o.type && o.type.k === 'array') {
      let leaf: CType = o.type;
      const dims: number[] = [];
      while (leaf.k === 'array') {
        dims.push(leaf.len ?? 0);
        leaf = leaf.of;
      }
      const es = sizeOf(leaf);
      const flat = Math.floor(off / es);
      const total = Math.floor(o.size / es);
      if (dims.length === 1) {
        return new RuntimeError(
          `Te sales del array '${o.name}': usas la posición ${flat}, pero solo tiene ${total} elementos (del 0 al ${total - 1})`,
          'Revisa la condición del bucle: si el array tiene N elementos, los índices van de 0 a N-1 (usa i < N, no i <= N).',
        );
      }
      return new RuntimeError(`Te sales de la matriz '${o.name}' (${dims.join('x')})`, 'Revisa los índices: van de 0 a filas-1 y de 0 a columnas-1.');
    }
    return new RuntimeError(`Te sales de la memoria de '${o.name}'`, o.type && isCharLike(o.type) ? undefined : 'Un puntero a una variable solo puede usar esa variable (p[0]), no las de al lado.');
  }

  /** Nombre legible de una posición de memoria: v[3], p.edad, m[1][2]… */
  describeAddr(o: MemObj | null | undefined, a: number): string {
    if (!o) return 'esta posición de memoria';
    if (o.kind === 'heap') {
      if (o.type) {
        const es = sizeOf(o.type);
        return `la posición ${Math.floor((a - o.base) / es)} de la memoria de malloc`;
      }
      return 'la memoria reservada con malloc';
    }
    let t = o.type;
    let off = a - o.base;
    let name = o.name;
    while (t) {
      if (t.k === 'array') {
        const es = sizeOf(t.of) || 1;
        const i = Math.floor(off / es);
        name += `[${i}]`;
        off -= i * es;
        t = t.of;
      } else if (t.k === 'struct' && t.s.fields) {
        const f = [...t.s.fields].reverse().find((ff) => ff.offset <= off);
        if (!f) break;
        name += '.' + f.name;
        off -= f.offset;
        t = f.type;
      } else break;
    }
    return name;
  }

  uninitError(o: MemObj | null | undefined, a: number): RuntimeError {
    const name = this.describeAddr(o, a);
    if (o && o.kind === 'heap') {
      return new RuntimeError(`Lees ${name} sin haberle dado un valor`, 'malloc no pone la memoria a 0: dale valor antes de usarla (o usa calloc).');
    }
    if (o && o.type && o.type.k === 'ptr' && name === o.name) {
      return new RuntimeError(`El puntero '${name}' se usa sin haberle dado un valor`, `Haz que apunte a algo antes de usarlo: ${name} = &variable; o ${name} = malloc(...);`);
    }
    const isElem = name.includes('[') || name.includes('.');
    return new RuntimeError(
      `${isElem ? name : `La variable '${name}'`} se usa sin haberle dado un valor`,
      isElem
        ? 'Dale valor a cada elemento antes de leerlo (por ejemplo con un bucle, o al declarar: int v[5] = {0};).'
        : `Dale un valor inicial al declararla, por ejemplo: int ${name} = 0;`,
    );
  }

  // lectura / escritura sin comprobaciones (la dirección ya está comprobada)
  loader(t: CType): (a: number) => Value {
    const dv = this.dv;
    switch (t.k) {
      case 'int':
        switch (t.size) {
          case 1:
            if (t.name === 'bool') return (a) => (this.dv.getUint8(a) ? 1 : 0);
            return t.signed ? (a) => this.dv.getInt8(a) : (a) => this.dv.getUint8(a);
          case 2:
            return t.signed ? (a) => this.dv.getInt16(a, true) : (a) => this.dv.getUint16(a, true);
          case 4:
            return t.signed ? (a) => this.dv.getInt32(a, true) : (a) => this.dv.getUint32(a, true);
          default:
            return t.signed ? (a) => this.dv.getBigInt64(a, true) : (a) => this.dv.getBigUint64(a, true);
        }
      case 'float':
        return t.size === 4 ? (a) => this.dv.getFloat32(a, true) : (a) => this.dv.getFloat64(a, true);
      case 'ptr':
        return (a) => this.loadPtr(a);
      default:
        void dv;
        // struct/array: el "valor" es su dirección
        return (a) => ({ a, o: null });
    }
  }

  loadPtr(a: number): Ptr {
    const v = this.dv.getUint32(a, true);
    const p = this.prov.get(a);
    if (p && p.a === v) return p;
    if (v === 0) return NULLPTR;
    if (v >= FN_BASE) {
      const fn = this.prog.funcs[v - FN_BASE];
      if (fn) return { a: v, o: null, f: fn };
    }
    return { a: v, o: null };
  }

  storePtr(a: number, p: Ptr): void {
    this.dv.setUint32(a, p.a, true);
    this.dv.setUint32(a + 4, 0, true);
    if (p.o || p.f) this.prov.set(a, p);
    else if (this.prov.size) this.prov.delete(a);
    this.init.fill(1, a, a + 8);
  }

  storer(t: CType): (a: number, v: Value) => void {
    const init = () => this.init;
    switch (t.k) {
      case 'int':
        switch (t.size) {
          case 1:
            return (a, v) => {
              this.dv.setUint8(a, (v as number) & 255);
              init()[a] = 1;
            };
          case 2:
            return (a, v) => {
              this.dv.setUint16(a, (v as number) & 0xffff, true);
              const i = init();
              i[a] = 1;
              i[a + 1] = 1;
            };
          case 4:
            return (a, v) => {
              this.dv.setInt32(a, v as number, true);
              const i = init();
              i[a] = 1;
              i[a + 1] = 1;
              i[a + 2] = 1;
              i[a + 3] = 1;
            };
          default:
            return (a, v) => {
              this.dv.setBigUint64(a, BigInt.asUintN(64, v as bigint), true);
              init().fill(1, a, a + 8);
            };
        }
      case 'float':
        return t.size === 4
          ? (a, v) => {
              this.dv.setFloat32(a, v as number, true);
              init().fill(1, a, a + 4);
            }
          : (a, v) => {
              this.dv.setFloat64(a, v as number, true);
              init().fill(1, a, a + 8);
            };
      case 'ptr':
        return (a, v) => this.storePtr(a, v as Ptr);
      default: {
        const size = sizeOf(t);
        return (a, v) => this.copy(a, (v as Ptr).a, size);
      }
    }
  }

  copy(dst: number, src: number, n: number): void {
    if (n <= 0) return;
    this.u8.copyWithin(dst, src, src + n);
    this.init.copyWithin(dst, src, src + n);
    if (this.prov.size) {
      const moved: [number, Ptr | undefined][] = [];
      for (let k = 0; k < n; k++) {
        if (this.prov.has(src + k) || this.prov.has(dst + k)) moved.push([dst + k, this.prov.get(src + k)]);
      }
      for (const [k, p] of moved) {
        if (p) this.prov.set(k, p);
        else this.prov.delete(k);
      }
    }
  }

  // ───────────────────────── llamadas ─────────────────────────

  invoke(fn: FuncSym, args: Value[], retAddr: number, argTypes?: CType[]): Value {
    if (fn.builtin) return callBuiltin(this, fn.name, args, argTypes ?? fn.type.params);
    const body = this.bodies[fn.id];
    if (!body) throw new RuntimeError(`La función '${fn.name}' no está definida`);
    if (++this.depth > this.maxDepthSeen) this.maxDepthSeen = this.depth;
    if (this.depth > MAX_DEPTH) {
      throw new RuntimeError(
        `Demasiadas llamadas a '${fn.name}' una dentro de otra (recursión infinita)`,
        'Una función recursiva necesita un caso base que no se llame a sí misma, y cada llamada tiene que acercarse a él.',
      );
    }
    const savedSp = this.sp;
    const bp = Math.ceil(this.sp / 16) * 16;
    const top = bp + fn.frameSize;
    if (top > this.stackEnd) {
      this.depth--;
      throw new RuntimeError(
        fn.frameSize > STACK_SIZE / 4 ? `Las variables locales de '${fn.name}' no caben en la pila` : `Se ha llenado la pila de llamadas (recursión demasiado profunda en '${fn.name}')`,
        fn.frameSize > STACK_SIZE / 4 ? 'Los arrays muy grandes decláralos fuera de main (globales) o con malloc.' : 'Comprueba que la recursión tiene un caso base.',
      );
    }
    this.sp = top;
    if (fn.frameSize) this.init.fill(0, bp, top);
    const fr: Frame = {
      bp,
      regs: new Array(fn.nregs),
      objs: fn.nobjs ? new Array(fn.nobjs) : [],
      rv: undefined,
      fn,
      retAddr,
      callLine: this.line,
    };
    const params = fn.params;
    for (let i = 0; i < params.length; i++) {
      const p = params[i];
      if (p.reg) fr.regs[p.slot] = args[i];
      else this.storer(p.type)(bp + p.slot, args[i]);
    }
    this.frames.push(fr);
    const callLine = this.line;
    try {
      for (const v of fn.vlaParams) {
        const n = Number(this.vlaCode(v.x)(fr));
        fr.regs[v.slot] = n;
      }
      body(fr);
    } catch (e) {
      // guarda dónde ocurrió el error antes de deshacer las llamadas
      this.errInfo ??= { line: this.line, stack: this.stackTrace() };
      throw e;
    } finally {
      this.frames.pop();
      for (const o of fr.objs) if (o) o.alive = false;
      this.sp = savedSp;
      this.depth--;
    }
    this.line = callLine;
    return fr.rv;
  }

  private vlaCache = new WeakMap<Expr, EvalFn>();
  private vlaCode(x: Expr): EvalFn {
    let f = this.vlaCache.get(x);
    if (!f) {
      f = this.expr(x);
      this.vlaCache.set(x, f);
    }
    return f;
  }

  // ───────────────────────── generación de código ─────────────────────────

  private stmt(s: Stmt): StmtFn {
    const line = s.line;
    const m = this;
    switch (s.s) {
      case 'empty':
      case 'case':
        return () => NORMAL;
      case 'expr': {
        const f = this.expr(s.x, true);
        return (fr) => {
          m.line = line;
          if (++m.steps > m.stepCheck) m.tick();
          f(fr);
          return NORMAL;
        };
      }
      case 'decl':
        return this.decl(s);
      case 'block': {
        const list = s.body.map((x) => this.stmt(x));
        const n = list.length;
        if (s.restoresSp) {
          return (fr) => {
            const sp = m.sp;
            try {
              for (let i = 0; i < n; i++) {
                const r = list[i](fr);
                if (r !== NORMAL) return r;
              }
              return NORMAL;
            } finally {
              m.sp = sp;
            }
          };
        }
        if (n === 1) return list[0];
        return (fr) => {
          for (let i = 0; i < n; i++) {
            const r = list[i](fr);
            if (r !== NORMAL) return r;
          }
          return NORMAL;
        };
      }
      case 'if': {
        const c = this.cond(s.c);
        const t = this.stmt(s.t);
        const f = s.f ? this.stmt(s.f) : null;
        return (fr) => {
          m.line = line;
          if (++m.steps > m.stepCheck) m.tick();
          if (c(fr)) return t(fr);
          return f ? f(fr) : NORMAL;
        };
      }
      case 'while': {
        const c = this.cond(s.c);
        const body = this.stmt(s.body);
        return (fr) => {
          for (;;) {
            m.line = line;
            if (++m.steps > m.stepCheck) m.tick();
            if (!c(fr)) return NORMAL;
            const r = body(fr);
            if (r === BREAK) return NORMAL;
            if (r === RETURN) return RETURN;
          }
        };
      }
      case 'do': {
        const c = this.cond(s.c);
        const body = this.stmt(s.body);
        const cline = s.c.line;
        return (fr) => {
          for (;;) {
            m.line = line;
            if (++m.steps > m.stepCheck) m.tick();
            const r = body(fr);
            if (r === BREAK) return NORMAL;
            if (r === RETURN) return RETURN;
            m.line = cline;
            if (!c(fr)) return NORMAL;
          }
        };
      }
      case 'for': {
        const init = s.init ? this.stmt(s.init) : null;
        const c = s.c ? this.cond(s.c) : null;
        const step = s.step ? this.expr(s.step, true) : null;
        const body = this.stmt(s.body);
        return (fr) => {
          m.line = line;
          if (init) init(fr);
          for (;;) {
            m.line = line;
            if (++m.steps > m.stepCheck) m.tick();
            if (c && !c(fr)) return NORMAL;
            const r = body(fr);
            if (r === BREAK) return NORMAL;
            if (r === RETURN) return RETURN;
            m.line = line;
            if (step) step(fr);
          }
        };
      }
      case 'switch': {
        const x = this.expr(s.x);
        const list = s.body.map((b) => this.stmt(b));
        const cases = s.cases;
        const def = s.def;
        return (fr) => {
          m.line = line;
          if (++m.steps > m.stepCheck) m.tick();
          const v = x(fr) as number | bigint;
          let start = cases.get(v);
          if (start === undefined) start = def;
          if (start < 0) return NORMAL;
          for (let i = start; i < list.length; i++) {
            const r = list[i](fr);
            if (r === BREAK) return NORMAL;
            if (r !== NORMAL) return r;
          }
          return NORMAL;
        };
      }
      case 'break':
        return () => BREAK;
      case 'continue':
        return () => CONTINUE;
      case 'return': {
        if (!s.x) {
          return (fr) => {
            m.line = line;
            fr.rv = undefined;
            return RETURN;
          };
        }
        const x = s.x;
        if (x.type.k === 'struct') {
          const f = this.expr(x);
          const size = sizeOf(x.type);
          return (fr) => {
            m.line = line;
            const src = f(fr) as Ptr;
            m.copy(fr.retAddr, src.a, size);
            fr.rv = { a: fr.retAddr, o: null };
            return RETURN;
          };
        }
        const f = this.expr(x);
        return (fr) => {
          m.line = line;
          if (++m.steps > m.stepCheck) m.tick();
          fr.rv = f(fr);
          return RETURN;
        };
      }
    }
  }

  private decl(s: Extract<Stmt, { s: 'decl' }>): StmtFn {
    const sym = s.sym;
    const line = s.line;
    const m = this;
    if (sym.reg) {
      const slot = sym.slot;
      if (!s.init) return (fr) => ((fr.regs[slot] = undefined), NORMAL);
      const init = s.init;
      if (init.k !== 'expr') {
        // escalar con llaves: ya viene convertido a expr por el parser
        throw new Error('init de registro inesperado');
      }
      const f = this.expr(init.x);
      return (fr) => {
        m.line = line;
        if (++m.steps > m.stepCheck) m.tick();
        fr.regs[slot] = f(fr);
        return NORMAL;
      };
    }
    const lv = this.varLV(sym) as Extract<LV, { k: 'addr' }>;
    if (s.vla.length) {
      const dims = s.vla.map((d) => ({ slot: d.slot, f: this.expr(d.x) }));
      const rt = this.rtSize(sym.type);
      const oi = sym.objIndex;
      const baseReg = sym.vlaBase!;
      return (fr) => {
        m.line = line;
        for (const d of dims) {
          const n = Number(d.f(fr));
          if (!(n > 0)) {
            throw new RuntimeError(`El tamaño del array '${sym.name}' tiene que ser mayor que 0 (vale ${n})`, 'Comprueba el valor que usas como tamaño antes de declarar el array.');
          }
          fr.regs[d.slot] = n;
        }
        const size = rt(fr);
        const base = Math.ceil(m.sp / 16) * 16;
        if (base + size > m.stackEnd) throw new RuntimeError(`El array '${sym.name}' es demasiado grande para la pila`, 'Usa malloc para arrays muy grandes.');
        m.sp = base + size;
        m.init.fill(0, base, base + size);
        fr.regs[baseReg] = base;
        fr.objs[oi] = { base, size, name: sym.name, kind: 'var', alive: true, type: this.concreteType(sym.type, fr), fn: sym.fnName };
        return NORMAL;
      };
    }
    const size = sizeOf(sym.type);
    if (!s.init) {
      return (fr) => {
        const a = lv.fn(fr);
        m.init.fill(0, a, a + size);
        return NORMAL;
      };
    }
    const init = this.genInit(s.init, lv.fn, lv.obj, sym.type);
    return (fr) => {
      m.line = line;
      if (++m.steps > m.stepCheck) m.tick();
      init(fr);
      return NORMAL;
    };
  }

  /** Tipo con las longitudes de los VLA ya calculadas (para los mensajes de error). */
  private concreteType(t: CType, fr: Frame): CType {
    if (t.k === 'array') {
      const len = t.vla ? (fr.regs[t.vla.slot] as number) : t.len;
      return { k: 'array', of: this.concreteType(t.of, fr), len };
    }
    return t;
  }

  private genInit(init: Init, addr: (fr: Frame) => number, obj: (fr: Frame) => MemObj, type: CType): (fr: Frame) => void {
    const m = this;
    if (init.k === 'expr') {
      const f = this.expr(init.x);
      const st = this.storer(type);
      return (fr) => st(addr(fr), f(fr));
    }
    const size = init.size;
    const items = init.items.map((it) => {
      if ('bytes' in it) {
        const bytes = it.bytes;
        const off = it.off;
        return (a: number) => {
          m.u8.set(bytes, a + off);
          m.init.fill(1, a + off, a + off + bytes.length);
        };
      }
      const f = this.expr(it.x);
      const st = this.storer(it.t);
      const off = it.off;
      return (a: number, fr: Frame) => st(a + off, f(fr));
    });
    void obj;
    return (fr) => {
      const a = addr(fr);
      m.u8.fill(0, a, a + size);
      m.init.fill(1, a, a + size);
      if (m.prov.size) for (let k = 0; k < size; k++) m.prov.delete(a + k);
      for (const it of items) it(a, fr);
    };
  }

  private cond(x: Expr): (fr: Frame) => boolean {
    const f = this.expr(x);
    const t = x.type;
    if (t.k === 'int' && t.size <= 4) return (fr) => (f(fr) as number) !== 0;
    if (t.k === 'float') return (fr) => (f(fr) as number) !== 0;
    return (fr) => truthy(f(fr));
  }

  /** Tamaño en bytes de un tipo al ejecutar (los VLA dependen del marco). */
  private rtSize(t: CType): (fr: Frame) => number {
    if (!hasVla(t)) {
      const n = sizeOf(t);
      return () => n;
    }
    if (t.k === 'array') {
      const inner = this.rtSize(t.of);
      if (t.vla) {
        const slot = t.vla.slot;
        return (fr) => (fr.regs[slot] as number) * inner(fr);
      }
      const len = t.len ?? 0;
      return (fr) => len * inner(fr);
    }
    return () => sizeOf(t);
  }

  private globalObj(g: VarSym): MemObj {
    let o = this.globalObjs.get(g);
    if (!o) {
      o = { base: g.slot, size: sizeOf(g.type), name: g.name, kind: 'var', alive: true, type: g.type };
      this.globalObjs.set(g, o);
    }
    return o;
  }

  private varLV(sym: VarSym): LV {
    if (sym.storage !== 'local') {
      const a = sym.slot;
      return { k: 'addr', fn: () => a, obj: () => this.globalObj(sym) };
    }
    if (sym.reg) return { k: 'reg', slot: sym.slot };
    const oi = sym.objIndex;
    if (sym.vlaBase !== undefined) {
      const br = sym.vlaBase;
      return {
        k: 'addr',
        fn: (fr) => {
          const b = fr.regs[br];
          if (b === undefined) throw new RuntimeError(`El array '${sym.name}' todavía no existe`);
          return b as number;
        },
        obj: (fr) => fr.objs[oi]!,
      };
    }
    const off = sym.slot;
    const size = sizeOf(sym.type);
    const kind: MemObj['kind'] = sym.isParam ? 'param' : sym.hidden ? 'tmp' : 'var';
    return {
      k: 'addr',
      fn: (fr) => fr.bp + off,
      obj: (fr) => (fr.objs[oi] ??= { base: fr.bp + off, size, name: sym.name, kind, alive: true, type: sym.type, fn: sym.fnName }),
    };
  }

  private toPtrFn(lv: LV): (fr: Frame) => Ptr {
    switch (lv.k) {
      case 'reg':
        throw new Error('dirección de un registro');
      case 'addr':
        return (fr) => ({ a: lv.fn(fr), o: lv.obj(fr) });
      case 'ptr':
        return lv.fn;
    }
  }

  private lval(e: Expr): LV {
    const m = this;
    switch (e.e) {
      case 'var':
        return this.varLV(e.sym);
      case 'str': {
        const s = this.prog.strings[e.sid];
        const sid = e.sid;
        return { k: 'addr', fn: () => s.addr, obj: () => m.strObjs[sid] };
      }
      case 'index': {
        const idx = this.expr(e.i);
        const es = this.rtSize(e.type);
        const esConst = hasVla(e.type) ? -1 : sizeOf(e.type);
        if (e.viaPtr) {
          const pf = this.expr(e.a);
          if (esConst >= 0) {
            return {
              k: 'ptr',
              fn: (fr) => {
                const p = pf(fr) as Ptr;
                const i = Number(idx(fr));
                return { a: p.a + i * esConst, o: p.o };
              },
            };
          }
          return {
            k: 'ptr',
            fn: (fr) => {
              const p = pf(fr) as Ptr;
              const i = Number(idx(fr));
              return { a: p.a + i * es(fr), o: p.o };
            },
          };
        }
        const at = e.a.type as Extract<CType, { k: 'array' }>;
        const base = this.lval(e.a);
        const name = exprName(e.a);
        const lenSlot = at.vla ? at.vla.slot : -1;
        const lenConst = at.len ?? 0;
        const isCol = e.a.e === 'index' && !e.a.viaPtr;
        const isRow = at.of.k === 'array';
        const root = isCol ? exprName(rootOf(e.a)) : name;
        const check = (i: number, fr: Frame) => {
          const len = lenSlot >= 0 ? (fr.regs[lenSlot] as number) : lenConst;
          if ((i < 0 || i >= len || !Number.isInteger(i)) && (isRow || isCol)) {
            const what = isCol ? 'columna' : 'fila';
            throw new RuntimeError(
              `Te sales de la matriz '${root}': usas la ${what} ${i}, pero solo tiene ${len} ${what}s (de la 0 a la ${len - 1})`,
              'En una matriz m[F][C] las filas van de 0 a F-1 y las columnas de 0 a C-1. Revisa las condiciones de los bucles (< en vez de <=).',
            );
          }
          if (i < 0 || i >= len || !Number.isInteger(i)) {
            throw new RuntimeError(
              i < 0
                ? `Usas una posición negativa del array '${name}': ${name}[${i}]`
                : `Te sales del array '${name}': usas ${name}[${i}], pero solo tiene ${len} ${len === 1 ? 'elemento' : 'elementos'} (del 0 al ${len - 1})`,
              i === len
                ? 'Error típico: los índices van de 0 a N-1. Si el bucle es for (i = 0; i <= N; i++), cambia <= por <.'
                : 'Comprueba el valor del índice antes de usarlo.',
            );
          }
        };
        if (base.k === 'addr') {
          const bf = base.fn;
          if (esConst >= 0 && lenSlot < 0) {
            return {
              k: 'addr',
              fn: (fr) => {
                const i = Number(idx(fr));
                if (i < 0 || i >= lenConst) check(i, fr);
                return bf(fr) + i * esConst;
              },
              obj: base.obj,
            };
          }
          return {
            k: 'addr',
            fn: (fr) => {
              const i = Number(idx(fr));
              check(i, fr);
              return bf(fr) + i * es(fr);
            },
            obj: base.obj,
          };
        }
        if (base.k === 'reg') throw new Error('array en registro');
        const bp = base.fn;
        return {
          k: 'ptr',
          fn: (fr) => {
            const p = bp(fr);
            const i = Number(idx(fr));
            check(i, fr);
            return { a: p.a + i * es(fr), o: p.o };
          },
        };
      }
      case 'deref':
        return { k: 'ptr', fn: this.expr(e.x) as (fr: Frame) => Ptr };
      case 'member': {
        const off = e.f.offset;
        let base: LV;
        if (e.x.lv || e.x.e === 'deref') base = this.lval(e.x);
        else base = { k: 'ptr', fn: this.expr(e.x) as (fr: Frame) => Ptr };
        if (base.k === 'addr') {
          const bf = base.fn;
          return { k: 'addr', fn: (fr) => bf(fr) + off, obj: base.obj };
        }
        if (base.k === 'reg') throw new Error('struct en registro');
        const bp = base.fn;
        return {
          k: 'ptr',
          fn: (fr) => {
            const p = bp(fr);
            return { a: p.a + off, o: p.o };
          },
        };
      }
      default:
        // valores struct (llamadas, asignaciones, ?:) evaluados como dirección
        return { k: 'ptr', fn: this.expr(e) as (fr: Frame) => Ptr };
    }
  }

  /** Lee el valor de un lvalue con todas las comprobaciones. */
  private load(lv: LV, t: CType, name: () => string): EvalFn {
    const m = this;
    if (lv.k === 'reg') {
      const slot = lv.slot;
      return (fr) => {
        const v = fr.regs[slot];
        if (v === undefined) throw m.regUninit(name(), t);
        return v;
      };
    }
    if (t.k === 'struct' || t.k === 'array') {
      // el valor de un struct es su dirección (se copia al asignarlo)
      return this.toPtrFn(lv);
    }
    const ld = this.loader(t);
    const size = sizeOf(t);
    if (lv.k === 'addr') {
      const af = lv.fn;
      const obj = lv.obj;
      return (fr) => {
        const a = af(fr);
        if (!m.init[a]) throw m.uninitError(obj(fr), a);
        return ld(a);
      };
    }
    const pf = lv.fn;
    return (fr) => {
      const p = pf(fr);
      const a = m.access(p, size, false);
      if (!m.init[a]) throw m.uninitError(p.o, a);
      return ld(a);
    };
  }

  regUninit(name: string, t: CType): RuntimeError {
    if (t.k === 'ptr') {
      return new RuntimeError(`El puntero '${name}' se usa sin haberle dado un valor`, `Haz que apunte a algo antes de usarlo: ${name} = &variable; o ${name} = malloc(...);`);
    }
    return new RuntimeError(`La variable '${name}' se usa sin haberle dado un valor`, `Dale un valor inicial al declararla, por ejemplo: ${typeName(t)} ${name} = 0;`);
  }

  /** Dirección ya comprobada para leer y escribir (o un registro). */
  private resolver(lv: LV, size: number): ((fr: Frame) => number) | null {
    if (lv.k === 'reg') return null;
    if (lv.k === 'addr') return lv.fn;
    const pf = lv.fn;
    return (fr) => {
      const p = pf(fr);
      this.lastObj = p.o;
      return this.access(p, size, true);
    };
  }

  /** Objeto de memoria del último acceso (para los mensajes de error). */
  private lastObj: MemObj | null = null;

  private objOf(lv: LV): (fr: Frame, a: number) => MemObj | null {
    if (lv.k === 'addr') return (fr) => lv.obj(fr);
    return () => this.lastObj;
  }

  expr(e: Expr, discard = false): EvalFn {
    switch (e.e) {
      case 'const': {
        const v = e.v;
        return () => v;
      }
      case 'str': {
        const lv = this.lval(e);
        return this.toPtrFn(lv);
      }
      case 'var': {
        const sym = e.sym;
        return this.load(this.varLV(sym), e.type, () => sym.name);
      }
      case 'fn': {
        const p: Ptr = { a: FN_BASE + e.fn.id, o: null, f: e.fn };
        return () => p;
      }
      case 'decay': {
        if (e.x.type.k === 'func' || e.x.e === 'fn') {
          const fn = (e.x as Extract<Expr, { e: 'fn' }>).fn;
          const p: Ptr = { a: FN_BASE + fn.id, o: null, f: fn };
          return () => p;
        }
        return this.toPtrFn(this.lval(e.x));
      }
      case 'cast':
        return this.castCode(e.x, e.type);
      case 'arith':
        return this.arithCode(e.op, e.type, this.expr(e.l), this.expr(e.r));
      case 'cmp': {
        const l = this.expr(e.l);
        const r = this.expr(e.r);
        const pt = e.l.type.k === 'ptr';
        if (pt) {
          const ff = e.l.type.k === 'ptr' && e.l.type.to.k === 'func';
          const get = (v: Value) => (ff ? ((v as Ptr).f ? ((v as Ptr).f as FuncSym).id + 1 : 0) : (v as Ptr).a);
          switch (e.op) {
            case '==':
              return (fr) => (get(l(fr)) === get(r(fr)) ? 1 : 0);
            case '!=':
              return (fr) => (get(l(fr)) !== get(r(fr)) ? 1 : 0);
            case '<':
              return (fr) => (get(l(fr)) < get(r(fr)) ? 1 : 0);
            case '>':
              return (fr) => (get(l(fr)) > get(r(fr)) ? 1 : 0);
            case '<=':
              return (fr) => (get(l(fr)) <= get(r(fr)) ? 1 : 0);
            case '>=':
              return (fr) => (get(l(fr)) >= get(r(fr)) ? 1 : 0);
          }
        }
        switch (e.op) {
          case '==':
            return (fr) => (l(fr)! === r(fr)! ? 1 : 0);
          case '!=':
            return (fr) => (l(fr)! !== r(fr)! ? 1 : 0);
          case '<':
            return (fr) => ((l(fr) as number) < (r(fr) as number) ? 1 : 0);
          case '>':
            return (fr) => ((l(fr) as number) > (r(fr) as number) ? 1 : 0);
          case '<=':
            return (fr) => ((l(fr) as number) <= (r(fr) as number) ? 1 : 0);
          case '>=':
            return (fr) => ((l(fr) as number) >= (r(fr) as number) ? 1 : 0);
        }
        break;
      }
      case 'logic': {
        const l = this.cond(e.l);
        const r = this.cond(e.r);
        if (e.op === '&&') return (fr) => (l(fr) && r(fr) ? 1 : 0);
        return (fr) => (l(fr) || r(fr) ? 1 : 0);
      }
      case 'not': {
        const c = this.cond(e.x);
        return (fr) => (c(fr) ? 0 : 1);
      }
      case 'neg': {
        const x = this.expr(e.x);
        const t = e.type;
        if (t.k === 'float') return (fr) => -(x(fr) as number);
        if (t.k === 'int' && t.size === 4 && t.signed) return (fr) => -(x(fr) as number) | 0;
        return (fr) => arith('-', t, t.k === 'int' && t.size === 8 ? 0n : 0, x(fr));
      }
      case 'bitnot': {
        const x = this.expr(e.x);
        const t = e.type;
        return (fr) => bitnot(t, x(fr));
      }
      case 'padd': {
        const p = this.expr(e.p);
        const i = this.expr(e.i);
        const pt = e.type as Extract<CType, { k: 'ptr' }>;
        const sign = e.neg ? -1 : 1;
        if (hasVla(pt.to)) {
          const es = this.rtSize(pt.to);
          return (fr) => {
            const pp = p(fr) as Ptr;
            return { a: pp.a + sign * Number(i(fr)) * es(fr), o: pp.o };
          };
        }
        const es = pt.to.k === 'void' ? 1 : sizeOf(pt.to);
        return (fr) => {
          const pp = p(fr) as Ptr;
          return { a: pp.a + sign * Number(i(fr)) * es, o: pp.o };
        };
      }
      case 'pdiff': {
        const l = this.expr(e.l);
        const r = this.expr(e.r);
        const size = e.size;
        return (fr) => BigInt(Math.trunc(((l(fr) as Ptr).a - (r(fr) as Ptr).a) / size));
      }
      case 'deref':
      case 'index':
      case 'member': {
        const lv = this.lval(e);
        return this.load(lv, e.type, () => exprName(e));
      }
      case 'addr': {
        if (e.x.e === 'fn') return this.expr(e.x);
        return this.toPtrFn(this.lval(e.x));
      }
      case 'assign':
        return this.assignCode(e);
      case 'opassign':
        return this.opAssignCode(e);
      case 'incdec':
        return this.incDecCode(e);
      case 'call':
        return this.callCode(e, discard);
      case 'cond': {
        const c = this.cond(e.c);
        const a = this.expr(e.a);
        const b = this.expr(e.b);
        return (fr) => (c(fr) ? a(fr) : b(fr));
      }
      case 'comma': {
        const a = this.expr(e.a, true);
        const b = this.expr(e.b, discard);
        return (fr) => {
          a(fr);
          return b(fr);
        };
      }
      case 'vlasize': {
        const s = this.rtSize(e.t);
        return (fr) => BigInt(s(fr));
      }
    }
    throw new Error('expresión desconocida');
  }

  private castCode(x: Expr, to: CType): EvalFn {
    const f = this.expr(x);
    const from = x.type;
    if (to.k === 'void') return (fr) => (f(fr), undefined);
    if (from.k === 'int' && from.size <= 4 && to.k === 'float' && to.size === 8) return f;
    if (from.k === 'int' && to.k === 'int' && to.size === 4 && from.size < 4 && to.signed) return f;
    if (to.k === 'ptr' && from.k === 'ptr' && from.to.k === 'void' && to.to.k !== 'void') {
      const target = to.to;
      return (fr) => {
        const v = f(fr);
        tagHeapType(v, target);
        return v;
      };
    }
    if (to.k === 'ptr' && (from.k === 'ptr' || from.k === 'array')) return f;
    return (fr) => convert(f(fr), from, to);
  }

  private arithCode(op: ArithOp, t: CType, l: EvalFn, r: EvalFn): EvalFn {
    const divZero = () =>
      new RuntimeError(op === '%' ? 'Resto de una división entre cero (x % 0)' : 'División entre cero', 'No se puede dividir entre 0. Comprueba el divisor con un if antes de dividir.');
    if (t.k === 'int' && t.size === 4 && t.signed) {
      switch (op) {
        case '+':
          return (fr) => ((l(fr) as number) + (r(fr) as number)) | 0;
        case '-':
          return (fr) => ((l(fr) as number) - (r(fr) as number)) | 0;
        case '*':
          return (fr) => Math.imul(l(fr) as number, r(fr) as number);
        case '/':
          return (fr) => {
            const a = l(fr) as number;
            const b = r(fr) as number;
            if (b === 0) throw divZero();
            return (a / b) | 0;
          };
        case '%':
          return (fr) => {
            const a = l(fr) as number;
            const b = r(fr) as number;
            if (b === 0) throw divZero();
            return a % b | 0;
          };
      }
    }
    if (t.k === 'float' && t.size === 8) {
      switch (op) {
        case '+':
          return (fr) => (l(fr) as number) + (r(fr) as number);
        case '-':
          return (fr) => (l(fr) as number) - (r(fr) as number);
        case '*':
          return (fr) => (l(fr) as number) * (r(fr) as number);
        case '/':
          return (fr) => (l(fr) as number) / (r(fr) as number);
      }
    }
    const f = this.binFn(op, t);
    return (fr) => f(l(fr), r(fr));
  }

  private binFn(op: ArithOp, t: CType): (a: Value, b: Value) => Value {
    return (a, b) => {
      try {
        return arith(op, t, a, b);
      } catch (e) {
        if (e instanceof DivZero) {
          throw new RuntimeError(op === '%' ? 'Resto de una división entre cero (x % 0)' : 'División entre cero', 'No se puede dividir entre 0. Comprueba el divisor con un if antes de dividir.');
        }
        throw e;
      }
    };
  }

  private assignCode(e: Extract<Expr, { e: 'assign' }>): EvalFn {
    const m = this;
    const lv = this.lval(e.l);
    const r = this.expr(e.r);
    const t = e.l.type;
    if (lv.k === 'reg') {
      const slot = lv.slot;
      return (fr) => (fr.regs[slot] = r(fr));
    }
    if (t.k === 'struct') {
      const size = sizeOf(t);
      const res = this.resolver(lv, size)!;
      const obj = this.objOf(lv);
      return (fr) => {
        const src = r(fr) as Ptr;
        const a = res(fr);
        m.copy(a, src.a, size);
        return { a, o: obj(fr, a) };
      };
    }
    const st = this.storer(t);
    const size = sizeOf(t);
    const res = this.resolver(lv, size)!;
    return (fr) => {
      const a = res(fr);
      const v = r(fr);
      st(a, v);
      return v;
    };
  }

  private opAssignCode(e: Extract<Expr, { e: 'opassign' }>): EvalFn {
    const m = this;
    const lt = e.l.type;
    const ct = e.ct;
    const lv = this.lval(e.l);
    const r = this.expr(e.r);
    const name = () => exprName(e.l);
    let compute: (old: Value, rv: Value) => Value;
    if (lt.k === 'ptr') {
      const es = lt.to.k === 'void' ? 1 : sizeOf(lt.to);
      const sign = e.op === '-' ? -1 : 1;
      compute = (old, rv) => ({ a: (old as Ptr).a + sign * Number(rv) * es, o: (old as Ptr).o });
    } else {
      const op = this.binFn(e.op, ct);
      compute = (old, rv) => convert(op(convert(old, lt, ct), rv), ct, lt);
    }
    if (lv.k === 'reg') {
      const slot = lv.slot;
      return (fr) => {
        const old = fr.regs[slot];
        if (old === undefined) throw m.regUninit(name(), lt);
        const v = compute(old, r(fr));
        fr.regs[slot] = v;
        return v;
      };
    }
    const size = sizeOf(lt);
    const res = this.resolver(lv, size)!;
    const ld = this.loader(lt);
    const st = this.storer(lt);
    const obj = this.objOf(lv);
    return (fr) => {
      const a = res(fr);
      if (!m.init[a]) throw m.uninitError(obj(fr, a), a);
      const v = compute(ld(a), r(fr));
      st(a, v);
      return v;
    };
  }

  private incDecCode(e: Extract<Expr, { e: 'incdec' }>): EvalFn {
    const m = this;
    const t = e.x.type;
    const lv = this.lval(e.x);
    const pre = e.pre;
    const name = () => exprName(e.x);
    let step: (v: Value) => Value;
    if (t.k === 'ptr') {
      const es = (e.inc ? 1 : -1) * (t.to.k === 'void' ? 1 : sizeOf(t.to));
      step = (v) => ({ a: (v as Ptr).a + es, o: (v as Ptr).o });
    } else if (t.k === 'int' && t.size === 4 && t.signed) {
      step = e.inc ? (v) => ((v as number) + 1) | 0 : (v) => ((v as number) - 1) | 0;
    } else if (t.k === 'float') {
      const d = e.inc ? 1 : -1;
      step = t.size === 4 ? (v) => Math.fround((v as number) + d) : (v) => (v as number) + d;
    } else if (t.k === 'int' && t.name === 'bool') {
      step = e.inc ? () => 1 : (v) => ((v as number) ? 0 : 1);
    } else {
      const one = t.k === 'int' && t.size === 8 ? 1n : 1;
      const ct = t.k === 'int' && t.size < 4 ? T.int : t;
      step = (v) => convert(arith(e.inc ? '+' : '-', ct, convert(v, t, ct), one), ct, t);
    }
    if (lv.k === 'reg') {
      const slot = lv.slot;
      return (fr) => {
        const old = fr.regs[slot];
        if (old === undefined) throw m.regUninit(name(), t);
        const nv = step(old);
        fr.regs[slot] = nv;
        return pre ? nv : old;
      };
    }
    const size = sizeOf(t);
    const res = this.resolver(lv, size)!;
    const ld = this.loader(t);
    const st = this.storer(t);
    const obj = this.objOf(lv);
    return (fr) => {
      const a = res(fr);
      if (!m.init[a]) throw m.uninitError(obj(fr, a), a);
      const old = ld(a);
      const nv = step(old);
      st(a, nv);
      return pre ? nv : old;
    };
  }

  private callCode(e: Extract<Expr, { e: 'call' }>, discard: boolean): EvalFn {
    const m = this;
    const args = e.args.map((a) => this.expr(a));
    const argTypes = e.args.map((a) => a.type);
    const n = args.length;
    const line = e.line;
    const fname = e.fname;
    const retType = e.type;
    const tmpLV = e.tmp ? (this.varLV(e.tmp) as Extract<LV, { k: 'addr' }>) : null;
    const check = (v: Value): Value => {
      if (v === undefined && !discard && retType.k !== 'void') {
        throw new RuntimeError(`La función '${fname}' terminó sin hacer return, pero se usa su resultado`, `Asegúrate de que todos los caminos de ${fname} acaban en return valor;`);
      }
      return v;
    };
    const evalArgs = (fr: Frame): Value[] => {
      const vals = new Array<Value>(n);
      for (let i = 0; i < n; i++) vals[i] = args[i](fr);
      return vals;
    };
    if (e.f.e === 'fn') {
      const fn = e.f.fn;
      if (fn.builtin) {
        const name = fn.name;
        return (fr) => {
          const vals = evalArgs(fr);
          m.line = line;
          return callBuiltin(m, name, vals, argTypes);
        };
      }
      return (fr) => {
        const vals = evalArgs(fr);
        m.line = line;
        const ra = tmpLV ? tmpLV.fn(fr) : 0;
        const v = m.invoke(fn, vals, ra);
        if (tmpLV) return { a: ra, o: tmpLV.obj(fr) };
        return check(v);
      };
    }
    const pf = this.expr(e.f);
    return (fr) => {
      const p = pf(fr) as Ptr;
      const vals = evalArgs(fr);
      m.line = line;
      if (!p.f) {
        if (p.a === 0) throw new RuntimeError('Llamas a un puntero a función que vale NULL');
        throw new RuntimeError('Llamas a algo que no es una función');
      }
      const ra = tmpLV ? tmpLV.fn(fr) : 0;
      const v = m.invoke(p.f as FuncSym, vals, ra, argTypes);
      if (tmpLV) return { a: ra, o: tmpLV.obj(fr) };
      return check(v);
    };
  }

  // ───────────────────────── utilidades para la biblioteca ─────────────────────────

  /** Lee un texto de C (hasta el '\0') con comprobaciones. */
  readCString(p: Ptr, what = 'el texto', max = Infinity): number[] {
    const out: number[] = [];
    if (p.a === 0) throw new RuntimeError(`${cap(what)} es un puntero NULL`, 'El puntero no apunta a ningún texto.');
    let a = p.a;
    for (;;) {
      if (out.length >= max) return out;
      const addr = this.accessByte(p, a, what);
      if (!this.init[addr]) {
        throw new RuntimeError(
          `${cap(what)} no termina en '\\0' o tiene letras sin valor`,
          'Un texto en C acaba con el carácter \'\\0\'. Si lo construyes a mano, ponlo al final: s[n] = \'\\0\';',
        );
      }
      const b = this.u8[addr];
      if (b === 0) return out;
      out.push(b);
      a++;
    }
  }

  private accessByte(p: Ptr, a: number, what: string): number {
    const o = p.o;
    if (o) {
      if (!o.alive) return this.access({ a, o }, 1, false);
      if (a < o.base || a >= o.base + o.size) {
        throw new RuntimeError(`${cap(what)} no termina en '\\0': se sale de ${o.kind === 'var' ? `'${o.name}'` : 'su memoria'}`, 'Todo texto en C acaba con \'\\0\'. Asegúrate de que el array tiene sitio para él.');
      }
      return a;
    }
    return this.access({ a, o: null }, 1, false);
  }

  /** Escribe bytes en memoria comprobando que caben. */
  writeBytes(p: Ptr, bytes: ArrayLike<number>, what: string): void {
    const n = bytes.length;
    if (n === 0) return;
    if (p.o) {
      const o = p.o;
      if (o.alive && p.a >= o.base && p.a + n > o.base + o.size) {
        const room = o.base + o.size - p.a;
        throw new RuntimeError(
          `${cap(what)} no cabe en ${o.kind === 'heap' ? 'la memoria reservada' : `'${o.name}'`}: necesita ${n} bytes y solo hay ${room}`,
          'Haz el array más grande. Recuerda que un texto necesita un hueco más para el \'\\0\' final.',
        );
      }
    }
    const a = this.access(p, n, true);
    for (let i = 0; i < n; i++) this.u8[a + i] = bytes[i];
    this.init.fill(1, a, a + n);
    if (this.prov.size) for (let i = 0; i < n; i++) this.prov.delete(a + i);
  }

  storeTo(p: Ptr, t: CType, v: Value): void {
    const size = sizeOf(t);
    const a = this.access(p, size, true);
    this.storer(t)(a, v);
  }

  loadFrom(p: Ptr, t: CType): Value {
    const size = sizeOf(t);
    const a = this.access(p, size, false);
    if (!this.init[a]) throw this.uninitError(p.o, a);
    return this.loader(t)(a);
  }

  /** Lee un byte de la entrada estándar (-1 = fin). */
  /** Para cada línea de la entrada, cuánta salida había cuando se empezó a leer. */
  inputMarks: number[] = [];
  private outTotal = 0;

  readByte(): number {
    if (this.stdinPos < this.stdin.length) {
      if (this.stdinPos === 0 || this.stdin[this.stdinPos - 1] === 10) this.inputMarks.push(this.outTotal + this.out.length);
      return this.stdin[this.stdinPos++];
    }
    if (this.interactive) throw new NeedInput();
    return -1;
  }

  peekByte(): number {
    if (this.stdinPos < this.stdin.length) return this.stdin[this.stdinPos];
    if (this.interactive) throw new NeedInput();
    return -1;
  }

  callFunctionPointer(p: Ptr, args: Value[]): Value {
    if (!p.f) throw new RuntimeError('El puntero a función no es válido');
    return this.invoke(p.f as FuncSym, args, 0);
  }

  private flushFiles(): void {
    for (const s of this.streams.values()) {
      if (s.kind === 'file' && !s.closed && s.write) this.files[s.name] = new TextDecoder().decode(new Uint8Array(s.data));
    }
  }
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function rootOf(e: Expr): Expr {
  while (e.e === 'index' && !e.viaPtr) e = e.a;
  return e;
}

export function exprName(e: Expr): string {
  switch (e.e) {
    case 'var':
      return e.sym.name;
    case 'index':
      return `${exprName(e.a)}[…]`;
    case 'member':
      return e.x.e === 'deref' ? `${exprName(e.x.x)}->${e.f.name}` : `${exprName(e.x)}.${e.f.name}`;
    case 'deref':
      return `*${exprName(e.x)}`;
    case 'decay':
    case 'cast':
      return exprName(e.x);
    case 'padd':
      return exprName(e.p);
    default:
      return 'el valor';
  }
}
