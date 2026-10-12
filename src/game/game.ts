// Rangos por experiencia (XP) e insignias.
import type { Chapter } from '../content/types';
import { currentStreak, type Progress } from '../state/progress';

export interface Rank {
  min: number;
  name: string;
  icon: string;
}

export const RANKS: Rank[] = [
  { min: 0, name: 'Novato del printf', icon: '🥚' },
  { min: 60, name: 'Aprendiz de variables', icon: '🐣' },
  { min: 180, name: 'Explorador de condiciones', icon: '🧭' },
  { min: 350, name: 'Domador de bucles', icon: '🌀' },
  { min: 600, name: 'Señor de los arrays', icon: '📦' },
  { min: 900, name: 'Tejedor de cadenas', icon: '🧵' },
  { min: 1250, name: 'Mago de las funciones', icon: '🪄' },
  { min: 1650, name: 'Ninja de los punteros', icon: '🥷' },
  { min: 2100, name: 'Arquitecto de structs', icon: '🏗️' },
  { min: 2600, name: 'Maestro del C', icon: '👑' },
];

export function rankOf(xp: number): { rank: Rank; next: Rank | null; progress: number } {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1].min) i++;
  const rank = RANKS[i];
  const next = RANKS[i + 1] ?? null;
  const progress = next ? (xp - rank.min) / (next.min - rank.min) : 1;
  return { rank, next, progress };
}

export interface Badge {
  id: string;
  name: string;
  desc: string;
  icon: string;
  earned: (p: Progress, chapters: Chapter[]) => boolean;
}

const chapterDone = (id: string) => (p: Progress, chapters: Chapter[]) => {
  const ch = chapters.find((c) => c.id === id);
  return !!ch && ch.lessons.every((l) => p.done[l.id]);
};

export const BADGES: Badge[] = [
  { id: 'primer-programa', name: '¡Hola, mundo!', desc: 'Completa tu primera lección', icon: '👋', earned: (p) => Object.keys(p.done).length >= 1 },
  { id: 'diez', name: 'Diez de diez', desc: 'Completa 10 lecciones', icon: '🔟', earned: (p) => Object.keys(p.done).length >= 10 },
  { id: 'cincuenta', name: 'Medio centenar', desc: 'Completa 50 lecciones', icon: '🏅', earned: (p) => Object.keys(p.done).length >= 50 },
  { id: 'racha3', name: 'En racha', desc: '3 días seguidos programando', icon: '🔥', earned: (p) => p.streak.best >= 3 || currentStreak(p) >= 3 },
  { id: 'racha7', name: 'Imparable', desc: '7 días seguidos programando', icon: '☄️', earned: (p) => p.streak.best >= 7 },
  { id: 'sin-pistas', name: 'Sin ayuda', desc: 'Completa 10 ejercicios sin ver pistas ni solución', icon: '🧠', earned: (p) => Object.keys(p.done).filter((id) => !p.hints[id] && !p.seenSolution[id]).length >= 10 },
  { id: 'cap-hola', name: 'Primeros pasos', desc: 'Termina el capítulo «Hola, mundo»', icon: '🚀', earned: chapterDone('hola') },
  { id: 'cap-variables', name: 'Guardián de datos', desc: 'Termina «Variables y tipos»', icon: '🗃️', earned: chapterDone('variables') },
  { id: 'cap-condicionales', name: 'Si… entonces', desc: 'Termina «Condicionales»', icon: '🔀', earned: chapterDone('condicionales') },
  { id: 'cap-bucles', name: 'Bucle infinito (del bueno)', desc: 'Termina el capítulo de for', icon: '♾️', earned: chapterDone('for') },
  { id: 'cap-arrays', name: 'Coleccionista', desc: 'Termina «Arrays»', icon: '📚', earned: chapterDone('arrays') },
  { id: 'cap-matrices', name: 'Neo', desc: 'Termina «Matrices»', icon: '🟩', earned: chapterDone('matrices') },
  { id: 'cap-funciones', name: 'Divide y vencerás', desc: 'Termina «Funciones»', icon: '🧩', earned: chapterDone('funciones') },
  { id: 'cap-punteros', name: 'Señalador', desc: 'Termina «Punteros»', icon: '👉', earned: chapterDone('punteros') },
  { id: 'xp1000', name: 'Mil XP', desc: 'Consigue 1000 XP', icon: '💎', earned: (p) => p.xp >= 1000 },
  { id: 'cien-ejecuciones', name: 'Experimentador', desc: 'Ejecuta 100 programas', icon: '🧪', earned: (p) => p.runs >= 100 },
];
