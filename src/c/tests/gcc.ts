// Ejecuta un programa con gcc de verdad (para comparar).
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const hasGcc = spawnSync('gcc', ['--version']).status === 0;

export function runGcc(src: string, stdin: string): { out: string; code: number } {
  const work = mkdtempSync(join(tmpdir(), 'cgc-'));
  const file = join(work, 'p.c');
  writeFileSync(file, src);
  execFileSync('gcc', ['-w', '-O0', '-o', join(work, 'p'), file, '-lm']);
  const r = spawnSync(join(work, 'p'), [], { input: stdin, cwd: work, timeout: 10000 });
  return { out: r.stdout.toString('utf8'), code: r.status ?? -1 };
}

