// Cada lección se comprueba sola: la solución compila sin avisos, cumple sus
// requisitos, supera sus pruebas y (si hay gcc) escribe lo mismo que gcc.
import { describe, expect, it } from 'vitest';
import { outputText, runC } from '../c';
import { compile } from '../c/parser';
import { hasGcc, runGcc } from '../c/tests/gcc';
import { failedRequirements, sameOutput } from '../runner/check';
import { ALL_LESSONS, CHAPTERS, RETOS } from './index';
import type { Lesson } from './types';

const lessons: Lesson[] = [...ALL_LESSONS, ...RETOS];

describe('estructura', () => {
  it('ids únicos', () => {
    const ids = lessons.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    const chIds = CHAPTERS.map((c) => c.id);
    expect(new Set(chIds).size).toBe(chIds.length);
  });
  it.each(lessons.filter((l) => l.quiz).map((l) => [l.id, l] as const))('quiz %s', (_id, l) => {
    for (const q of l.quiz!) {
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
      expect(new Set(q.options).size).toBe(q.options.length);
    }
  });
});

describe('soluciones', () => {
  const withEx = lessons.filter((l) => l.exercise).map((l) => [l.id, l] as const);
  it.each(withEx)('%s', (_id, l) => {
    const ex = l.exercise!;
    const c = compile(ex.solution);
    if (!c.ok) throw new Error(`la solución no compila: ${c.error.message} (línea ${c.error.line})`);
    expect(c.warnings.map((w) => `L${w.line}: ${w.message}`)).toEqual([]);
    expect(failedRequirements(ex.solution, ex)).toEqual([]);
    // el código inicial no debe cumplir ya el ejercicio
    expect(ex.starter.trim()).not.toBe(ex.solution.trim());
    expect(ex.tests.length).toBeGreaterThan(0);
    for (const t of ex.tests) {
      const r = runC(ex.solution, t.input ?? '', { now: 1700000000 });
      const run = r.run!;
      if (run.status !== 'exit') throw new Error(`la solución falla con la entrada ${JSON.stringify(t.input)}: ${JSON.stringify(run)}`);
      const out = outputText(run);
      if (t.output !== undefined && !sameOutput(t.output, out)) {
        throw new Error(`salida distinta con la entrada ${JSON.stringify(t.input)}\n--- esperada\n${t.output}\n--- obtenida\n${out}`);
      }
      if (hasGcc) {
        const g = runGcc(ex.solution, t.input ?? '');
        expect(out, `gcc con la entrada ${JSON.stringify(t.input)}`).toBe(g.out);
      }
    }
  });
});

describe('ejemplos de la teoría', () => {
  const blocks: [string, string, string][] = [];
  for (const l of lessons) {
    const re = /```c([^\n]*)\n([\s\S]*?)```/g;
    let m: RegExpExecArray | null;
    let k = 0;
    while ((m = re.exec(l.theory + '\n' + (l.exercise?.task ?? '')))) {
      k++;
      if (/norun/.test(m[1]) || /error/.test(m[1])) continue;
      const input = /entrada="([^"]*)"/.exec(m[1])?.[1]?.replace(/\\n/g, '\n') ?? '';
      blocks.push([`${l.id} #${k}`, m[2], input]);
    }
  }
  it.each(blocks)('%s', (_name, code, input) => {
    const r = runC(code, input ? input + '\n' : '', { now: 1700000000 });
    if (!r.compiled.ok) throw new Error(`no compila: ${r.compiled.error.message} (línea ${r.compiled.error.line})\n${code}`);
    const run = r.run!;
    if (run.status !== 'exit') throw new Error(`falla: ${JSON.stringify(run.status === 'error' ? run.message : run.status)}\n${code}`);
    // con la hora real (time) cada ejecución es distinta: no se compara
    if (hasGcc && !/\btime\s*\(/.test(code)) expect(outputText(run)).toBe(runGcc(code, input ? input + '\n' : '').out);
  });
});
