// Mensajes ante los errores típicos de quien empieza.
import { expect, it } from 'vitest';
import { runC } from '../index';

const M = (body: string, inc = '#include <stdio.h>\n') => `${inc}int main() {\n${body}\n  return 0;\n}`;

const cases: [string, string, string][] = [
  ['falta ;', "Falta ';' al final de la línea 2", 'int main() {\n  int x = 5\n  return 0;\n}'],
  ['string', "El tipo 'string' no existe", M('  string nombre;')],
  ['cout', "'cout' no existe", M('  cout << "hola";')],
  ['iostream', '<iostream> no está disponible', M('', '#include <iostream>\n')],
  ['llave', 'Falta cerrar la llave', '#include <stdio.h>\nint main() {\n  if (1) {\n    printf("x");\n  return 0;\n}'],
  ['comillas', 'Falta cerrar las comillas', M('  printf("hola);')],
  ['%d float', '%d es para enteros', M('  float x = 2.5;\n  printf("%d", x);')],
  ['%f int', '%f es para decimales', M('  int x = 2;\n  printf("%f", x);')],
  ['scanf lf', '%lf', M('  double x;\n  scanf("%f", &x);')],
  ['scanf sin &', 'falta el &', M('  int x;\n  scanf("%d", x);')],
  ['no declarada', "¿Querías decir 'suma'?", M('  int suma = 0;\n  sume = 5;')],
  ['for comas', "se separan con ';'", M('  int i;\n  for (i = 0, i < 10, i++) printf("x");')],
  ['else sin if', 'Este else no tiene un if', M('  int x = 1;\n  if (x > 0);\n    printf("a");\n  else\n    printf("b");')],
  ['func despues', 'se usa antes de declararla', '#include <stdio.h>\nint main() {\n  printf("%d", doble(3));\n  return 0;\n}\nint doble(int x) { return 2 * x; }'],
  ['args', 'le faltan valores', '#include <stdio.h>\nint suma(int a, int b) { return a + b; }\nint main() {\n  printf("%d", suma(3));\n  return 0;\n}'],
  ['asignar cadena', 'strcpy', M('  char s[20];\n  s = "hola";')],
  ['char comillas', 'comillas simples', M('  char c = "a";')],
  ['potencia', "'^' no es la potencia", M('  int x = 2 ^ 3;\n  printf("%d", x);')],
  ['falta main', 'Falta la función main', '#include <stdio.h>\nint mian() {\n  return 0;\n}'],
  ['tilde', 'tildes', M('  int año = 2024;')],
  ['Printf', 'en minúscula', M('  Printf("x");')],
  ['faltan args printf', 'Faltan valores para printf', M('  int a = 1;\n  printf("%d %d", a);')],
  ['div entera', 'División entera', M('  int a = 7, b = 2;\n  float m = a / b;\n  printf("%f", m);')],
  ['a<b<c', 'a < b < c', M('  int x = 5;\n  if (0 < x < 10) printf("ok");')],
  ['cmp cadenas', 'Así no se comparan textos', M('  char s[10] = "si";\n  if (s == "si") printf("ok");')],
  ['asignacion en if', 'asignación', M('  int x = 5;\n  if (x = 3) printf("a");')],
  ['div cero', 'División entre cero', M('  int a = 5, b = 0;\n  printf("%d", a / b);')],
  ['null', 'NULL', M('  int *p = NULL;\n  *p = 5;')],
  ['ptr sin valor', "El puntero 'p'", M('  int *p;\n  *p = 5;')],
  ['bucle infinito', 'limit', M('  int i = 0;\n  while (i < 10) { }')],
  ['strcpy no cabe', 'no cabe', M('  char s[4];\n  strcpy(s, "hola mundo");', '#include <stdio.h>\n#include <string.h>\n')],
  ['recursion infinita', 'Demasiadas llamadas', '#include <stdio.h>\nint f(int n) { return f(n - 1); }\nint main() {\n  printf("%d", f(3));\n  return 0;\n}'],
  ['return local', 'ya no existe', '#include <stdio.h>\nint *f() { int x = 3; return &x; }\nint main() {\n  int *p = f();\n  printf("%d", *p);\n  return 0;\n}'],
  ['free doble', 'free dos veces', M('  int *p = malloc(4);\n  free(p);\n  free(p);', '#include <stdlib.h>\n')],
  ['sin return', 'sin hacer return', '#include <stdio.h>\nint f(int x) { if (x > 0) return 1; }\nint main() {\n  printf("%d", f(-1));\n  return 0;\n}'],
  ['case sin break', 'no termina en break', M('  int x = 1;\n  switch (x) {\n    case 1: printf("a");\n    case 2: printf("b"); break;\n  }')],
  ['math sin include', '#include <math.h>', M('  printf("%f", sqrt(4.0));')],
  ['mat oob', 'usas la columna 3', M('  int m[3][3] = {0};\n  int i;\n  for (i = 0; i <= 3; i++) m[i][i] = 1;')],
  ['ptr oob', 'usas la posición 4', '#include <stdio.h>\nvoid f(int *v, int n) { for (int i = 0; i <= n; i++) v[i] = 0; }\nint main() {\n  int a[4];\n  f(a, 4);\n  return 0;\n}'],
  ['malloc oob', 'solo reservaste 3', M('  int *v = malloc(3 * sizeof(int));\n  v[3] = 1;\n  free(v);', '#include <stdlib.h>\n')],
  ['array oob', 'usas v[5]', M('  int v[5];\n  for (int i = 0; i <= 5; i++) v[i] = i;')],
  ['var no usada', 'no se usa', M('  int x;\n  printf("hola");')],
  ['falta parentesis', 'Falta cerrar el paréntesis', M('  int x = 1;\n  if (x > 0 {\n  }')],
  ['funcion dentro', 'dentro de otra función', '#include <stdio.h>\nint main() {\n  printf("x");\nvoid f() {\n}\n'],
  ['uninit', "La variable 'suma' se usa sin haberle dado un valor", M('  int suma;\n  suma = suma + 1;\n  printf("%d", suma);')],
  ['uninit array', 'v[0] se usa sin haberle dado un valor', M('  int v[3];\n  int s = 0;\n  for (int i = 0; i < 3; i++) s += v[i];\n  printf("%d", s);')],
  ['punto y coma for', "';' justo después del for", M('  int i;\n  for (i = 0; i < 3; i++);\n  printf("%d", i);')],
];

it.each(cases)('%s', (_name, expected, src) => {
  const r = runC(src, '');
  let text: string;
  if (!r.compiled.ok) text = `${r.compiled.error.message} ${r.compiled.error.hint ?? ''}`;
  else {
    const run = r.run!;
    text = run.status === 'error' ? `${run.message} ${run.hint ?? ''}` : run.status;
  }
  text += ' ' + r.compiled.warnings.map((w) => w.message).join(' ');
  expect(text).toContain(expected);
});
