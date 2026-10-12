// Formato del temario. Cada capítulo es una lista de lecciones; cada lección tiene
// teoría (Markdown), y opcionalmente un ejercicio con tests y/o preguntas.

export interface ExerciseTest {
  /** Lo que se "teclea" (stdin). */
  input?: string;
  /** Salida esperada. Si falta, se obtiene ejecutando la solución. */
  output?: string;
  /** Nombre corto para la lista de pruebas. */
  name?: string;
  /** Prueba oculta: no se enseña la entrada hasta que falla. */
  hidden?: boolean;
}

export interface CodeRule {
  /** Expresión regular sobre el código sin comentarios. */
  re: string;
  msg: string;
}

export interface Exercise {
  /** Enunciado en Markdown. */
  task: string;
  starter: string;
  solution: string;
  tests: ExerciseTest[];
  hints: string[];
  requires?: CodeRule[];
  forbids?: CodeRule[];
  /** Cuántas pruebas se enseñan como ejemplo de ejecución (por defecto 1; 0 = ninguna). */
  examples?: number;
}

export interface QuizQuestion {
  q: string;
  code?: string;
  options: string[];
  answer: number;
  explain: string;
}

export type LessonKind = 'leccion' | 'proyecto' | 'examen' | 'reto';

export interface Lesson {
  id: string;
  title: string;
  kind?: LessonKind;
  /** Teoría en Markdown. */
  theory: string;
  exercise?: Exercise;
  quiz?: QuizQuestion[];
  xp?: number;
  /** Para retos: 1 fácil, 2 medio, 3 difícil. */
  difficulty?: 1 | 2 | 3;
}

export interface Chapter {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  level: 1 | 2 | 3;
  lessons: Lesson[];
}

export const LEVEL_NAMES: Record<1 | 2 | 3, string> = {
  1: 'Nivel 1 · Principiante',
  2: 'Nivel 2 · Intermedio',
  3: 'Nivel 3 · Avanzado',
};

export function lessonXp(l: Lesson): number {
  if (l.xp) return l.xp;
  switch (l.kind) {
    case 'proyecto':
      return 50;
    case 'examen':
      return 40;
    case 'reto':
      return 30 + 15 * ((l.difficulty ?? 1) - 1);
    default:
      return l.exercise ? 20 : 10;
  }
}

/**
 * Plantilla para escribir el temario: las barras invertidas se quedan tal cual
 * (\n se escribe \n) y \` se convierte en una comilla invertida.
 */
export function md(s: TemplateStringsArray, ...v: unknown[]): string {
  return String.raw(s, ...v).replace(/\\`/g, '`');
}
