// Índice del temario.
import { hola } from './chapters/01-hola';
import { variables } from './chapters/02-variables';
import { operadores } from './chapters/03-operadores';
import { entrada } from './chapters/04-entrada';
import { condicionales } from './chapters/05-condicionales';
import type { Chapter, Lesson } from './types';

export const CHAPTERS: Chapter[] = [hola, variables, operadores, entrada, condicionales];

/** Retos extra, fuera del camino principal. */
export const RETOS: Lesson[] = [];

export interface LessonRef {
  chapter: Chapter | null;
  lesson: Lesson;
  index: number;
}

const byId = new Map<string, LessonRef>();
for (const ch of CHAPTERS) ch.lessons.forEach((lesson, index) => byId.set(lesson.id, { chapter: ch, lesson, index }));
RETOS.forEach((lesson, index) => byId.set(lesson.id, { chapter: null, lesson, index }));

export function findLesson(id: string): LessonRef | undefined {
  return byId.get(id);
}

export function findChapter(id: string): Chapter | undefined {
  return CHAPTERS.find((c) => c.id === id);
}

export const ALL_LESSONS: Lesson[] = CHAPTERS.flatMap((c) => c.lessons);

/** Lección siguiente en el camino (cruzando capítulos). */
export function nextLesson(id: string): Lesson | null {
  const i = ALL_LESSONS.findIndex((l) => l.id === id);
  return i >= 0 && i + 1 < ALL_LESSONS.length ? ALL_LESSONS[i + 1] : null;
}

export function prevLesson(id: string): Lesson | null {
  const i = ALL_LESSONS.findIndex((l) => l.id === id);
  return i > 0 ? ALL_LESSONS[i - 1] : null;
}

/** Primera lección sin hacer (para el botón "Continuar"). */
export function firstPending(done: Record<string, unknown>): Lesson | null {
  return ALL_LESSONS.find((l) => !done[l.id]) ?? null;
}

/** Un capítulo está desbloqueado si el anterior está casi terminado (o es el primero). */
export function chapterUnlocked(ch: Chapter, done: Record<string, unknown>): boolean {
  const i = CHAPTERS.indexOf(ch);
  if (i <= 0) return true;
  const prev = CHAPTERS[i - 1];
  const n = prev.lessons.filter((l) => done[l.id]).length;
  return n >= Math.ceil(prev.lessons.length * 0.6) || ch.lessons.some((l) => done[l.id]);
}
