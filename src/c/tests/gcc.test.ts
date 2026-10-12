// Compara el intérprete con gcc: misma salida y mismo código de salida.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { outputText, runC } from '../index';

const dir = join(__dirname, 'programs');
const hasGcc = spawnSync('gcc', ['--version']).status === 0;

export function runGcc(src: string, stdin: string): { out: string; code: number } {
  const work = mkdtempSync(join(tmpdir(), 'cgc-'));
  const file = join(work, 'p.c');
  writeFileSync(file, src);
  execFileSync('gcc', ['-w', '-O0', '-o', join(work, 'p'), file, '-lm']);
  const r = spawnSync(join(work, 'p'), [], { input: stdin, cwd: work, timeout: 10000 });
  return { out: r.stdout.toString('utf8'), code: r.status ?? -1 };
}

describe.skipIf(!hasGcc)('igual que gcc', () => {
  for (const f of readdirSync(dir).filter((x) => x.endsWith('.c')).sort()) {
    it(f, () => {
      const src = readFileSync(join(dir, f), 'utf8');
      const inFile = join(dir, f.replace(/\.c$/, '.in'));
      const stdin = existsSync(inFile) ? readFileSync(inFile, 'utf8') : '';
      const ref = runGcc(src, stdin);
      const r = runC(src, stdin, { now: 1700000000 });
      if (!r.compiled.ok) throw new Error(`no compila: ${r.compiled.error.message} (línea ${r.compiled.error.line})`);
      const run = r.run!;
      if (run.status === 'error') throw new Error(`error en línea ${run.line}: ${run.message}\nsalida: ${outputText(run)}`);
      expect(outputText(run)).toBe(ref.out);
      expect(run.status === 'exit' ? run.code : -99).toBe(ref.code);
    });
  }
});
