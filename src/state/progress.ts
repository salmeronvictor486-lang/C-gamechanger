// Progreso de quien aprende, guardado en el navegador (localStorage). Sin cuentas ni
// servidores: se puede exportar e importar como archivo.
import { useSyncExternalStore } from 'react';

export interface LessonDone {
  at: number;
  xp: number;
  usedSolution?: boolean;
}

export interface Progress {
  v: 1;
  name: string;
  xp: number;
  done: Record<string, LessonDone>;
  code: Record<string, string>;
  attempts: Record<string, number>;
  hints: Record<string, number>;
  seenSolution: Record<string, boolean>;
  quiz: Record<string, number>;
  streak: { last: string; count: number; best: number };
  days: Record<string, number>;
  settings: { fontSize: number; theme: 'dark' | 'light' | 'auto'; sound: boolean };
  playground: string;
  badges: Record<string, number>;
  runs: number;
}

const KEY = 'c-gamechanger:v1';

function fresh(): Progress {
  return {
    v: 1,
    name: '',
    xp: 0,
    done: {},
    code: {},
    attempts: {},
    hints: {},
    seenSolution: {},
    quiz: {},
    streak: { last: '', count: 0, best: 0 },
    days: {},
    settings: { fontSize: 15, theme: 'dark', sound: true },
    playground: '',
    badges: {},
    runs: 0,
  };
}

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fresh();
    const data = JSON.parse(raw) as Partial<Progress>;
    const base = fresh();
    return { ...base, ...data, settings: { ...base.settings, ...(data.settings ?? {}) }, streak: { ...base.streak, ...(data.streak ?? {}) } };
  } catch {
    return fresh();
  }
}

let state: Progress = typeof localStorage === 'undefined' ? fresh() : load();
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function save(): void {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // sin almacenamiento (modo privado): el progreso dura lo que la pestaña
    }
  }, 150);
}

export function getProgress(): Progress {
  return state;
}

export function update(fn: (p: Progress) => Progress | void): void {
  const draft = structuredClone(state);
  const r = fn(draft);
  state = r ?? draft;
  save();
  for (const l of listeners) l();
}

/** Cambio frecuente (código del editor): no copia todo el estado. */
export function setCode(id: string, code: string): void {
  state = { ...state, code: { ...state.code, [id]: code } };
  save();
  for (const l of listeners) l();
}

export function setPlayground(code: string): void {
  state = { ...state, playground: code };
  save();
}

export function useProgress(): Progress {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}

export function today(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayDiff(a: string, b: string): number {
  const pa = new Date(a + 'T12:00:00');
  const pb = new Date(b + 'T12:00:00');
  return Math.round((pb.getTime() - pa.getTime()) / 86400000);
}

/** Marca actividad de hoy para la racha. */
export function touchStreak(p: Progress): void {
  const t = today();
  p.days[t] = (p.days[t] ?? 0) + 1;
  if (p.streak.last === t) return;
  if (p.streak.last && dayDiff(p.streak.last, t) === 1) p.streak.count += 1;
  else p.streak.count = 1;
  p.streak.last = t;
  p.streak.best = Math.max(p.streak.best, p.streak.count);
}

/** La racha mostrada: si ayer no hubo actividad, ya está rota. */
export function currentStreak(p: Progress): number {
  if (!p.streak.last) return 0;
  const d = dayDiff(p.streak.last, today());
  return d <= 1 ? p.streak.count : 0;
}

export function exportProgress(): string {
  return JSON.stringify(state, null, 2);
}

export function importProgress(text: string): boolean {
  try {
    const data = JSON.parse(text) as Progress;
    if (data.v !== 1 || typeof data.xp !== 'number') return false;
    update(() => ({ ...fresh(), ...data }));
    return true;
  } catch {
    return false;
  }
}

export function resetProgress(): void {
  update(() => fresh());
}
