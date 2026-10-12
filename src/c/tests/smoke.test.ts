import { describe, expect, it } from 'vitest';
import { outputText, runC } from '../index';

function run(src: string, stdin = '') {
  const r = runC(src, stdin);
  if (!r.compiled.ok) return { err: r.compiled.error.message + ' @' + r.compiled.error.line + ' | ' + (r.compiled.error.hint ?? '') };
  const res = r.run!;
  return { out: outputText(res), status: res.status, res };
}

describe('smoke', () => {
  it('hola', () => {
    const r = run('#include <stdio.h>\nint main() {\n  printf("Hola, mundo!\\n");\n  return 0;\n}\n');
    expect(r.out).toBe('Hola, mundo!\n');
  });
  it('loops', () => {
    const r = run(`#include <stdio.h>
int main() {
  int suma = 0;
  for (int i = 1; i <= 10; i++) suma += i;
  printf("%d %f %.2f %5d|%-5d|%e %g\\n", suma, 3.14159, 2.675, 42, 7, 12345.678, 0.0001);
  return 0;
}`);
    expect(r.out).toBe('55 3.141590 2.67    42|7    |1.234568e+04 0.0001\n');
  });
  it('scanf', () => {
    const r = run(`#include <stdio.h>
int main() {
  int a, b; double x;
  scanf("%d %d", &a, &b);
  scanf("%lf", &x);
  printf("%d %.3f\\n", a + b, x * 2);
  return 0;
}`, '3 4\n1.5\n');
    expect(r.out).toBe('7 3.000\n');
  });
  it('array oob', () => {
    const r = run(`#include <stdio.h>
int main() {
  int v[5];
  for (int i = 0; i <= 5; i++) v[i] = i;
  return 0;
}`);
    expect(r.status).toBe('error');
    process.stderr.write((r.res as any).message + ' L' + (r.res as any).line + '\n');
  });
  it('uninit', () => {
    const r = run(`#include <stdio.h>
int main() {
  int suma;
  suma = suma + 1;
  printf("%d", suma);
  return 0;
}`);
    expect(r.status).toBe('error');
    process.stderr.write((r.res as any).message + '\n');
  });
  it('errors', () => {
    const w = (x: unknown) => process.stderr.write(JSON.stringify(x) + '\n');
    w(run('#include <stdio.h>\nint main() {\n  printf("hola")\n  return 0;\n}\n').err);
    w(run('int main() {\n  printf("hola");\n  return 0;\n}\n').err);
    w(run('#include <stdio.h>\nint main() {\n  int x;\n  scanf("%d", x);\n  return 0;\n}\n').err);
    const r = runC('#include <stdio.h>\nint main() {\n  int x = 5;\n  if (x = 3) printf("a");\n  return 0;\n}\n');
    w(r.compiled.warnings);
  });
});
