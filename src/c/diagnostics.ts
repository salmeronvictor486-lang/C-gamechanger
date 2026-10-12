// Mensajes del compilador y del programa en ejecución, en castellano.

export type Severity = 'error' | 'warning';

export interface Diagnostic {
  severity: Severity;
  line: number;
  col: number;
  message: string;
  /** Consejo extra para quien está aprendiendo. */
  hint?: string;
}

export class CompileError extends Error {
  readonly diag: Diagnostic;
  constructor(line: number, col: number, message: string, hint?: string) {
    super(message);
    this.diag = { severity: 'error', line, col, message, hint };
  }
}

export interface Pos {
  line: number;
  col: number;
}

/** Distancia de edición: para sugerir "¿Querías decir…?". */
export function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 3) return 99;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array<number>(n).fill(0)]);
  for (let j = 1; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0.5 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[m][n];
}

export function closest(name: string, candidates: Iterable<string>): string | null {
  let best: string | null = null;
  let bestD = Infinity;
  const limit = name.length <= 3 ? 1 : name.length <= 6 ? 2 : 3;
  for (const c of candidates) {
    if (c === name) continue;
    const d = editDistance(name, c);
    if (d < bestD && d <= limit) {
      best = c;
      bestD = d;
    }
  }
  return best;
}
