import { md, type Chapter } from '../types';

export const operadores: Chapter = {
  id: 'operadores',
  title: 'Operadores',
  subtitle: 'Cuentas, división entera, resto, conversiones y math.h',
  icon: '🧮',
  color: '#ff9f43',
  level: 1,
  lessons: [
    {
      id: 'op-aritmeticos',
      title: 'Sumar, restar, multiplicar',
      theory: md`
## La calculadora de C

| Operador | Significa | Ejemplo | Resultado |
|---|---|---|---|
| \`+\` | suma | \`7 + 2\` | 9 |
| \`-\` | resta | \`7 - 2\` | 5 |
| \`*\` | multiplicación | \`7 * 2\` | 14 |
| \`/\` | división | \`7 / 2\` | **3** (¡con enteros!) |
| \`%\` | resto de la división | \`7 % 2\` | 1 |

El orden es el de las matemáticas: primero \`*\`, \`/\` y \`%\`; después \`+\` y \`-\`. Si quieres otro orden, usa **paréntesis**:

\`\`\`c
#include <stdio.h>

int main() {
    int a = 2 + 3 * 4;       // 14, no 20
    int b = (2 + 3) * 4;     // 20
    printf("%d %d\n", a, b);

    int base = 8, altura = 5;
    int area = base * altura;
    int perimetro = 2 * (base + altura);
    printf("Área: %d, perímetro: %d\n", area, perimetro);
    return 0;
}
\`\`\`

> ⚠️ En C **no** se puede escribir \`2x\` ni \`2(a+b)\` como en mates: la multiplicación siempre lleva \`*\`.
`,
      exercise: {
        task: md`
Una sala de cine tiene \`filas = 14\` filas de \`butacas = 22\` butacas. Cada entrada cuesta \`8\` euros. Calcula y escribe:

\`\`\`salida
Butacas en total: 308
Recaudación con la sala llena: 2464 euros
Si faltan 15 personas: 2344 euros
\`\`\`

Todos los números tienen que calcularse a partir de las variables.
`,
        starter: md`#include <stdio.h>

int main() {
    int filas = 14;
    int butacas = 22;
    int precio = 8;

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int filas = 14;
    int butacas = 22;
    int precio = 8;
    int total = filas * butacas;
    printf("Butacas en total: %d\n", total);
    printf("Recaudación con la sala llena: %d euros\n", total * precio);
    printf("Si faltan 15 personas: %d euros\n", (total - 15) * precio);
    return 0;
}
`,
        tests: [{ output: 'Butacas en total: 308\nRecaudación con la sala llena: 2464 euros\nSi faltan 15 personas: 2344 euros\n' }],
        hints: ['El total de butacas es filas * butacas.', 'Si faltan 15 personas, se venden (total - 15) entradas: ¡ojo con los paréntesis!'],
        requires: [{ re: 'filas\\s*\\*\\s*butacas|butacas\\s*\\*\\s*filas', msg: 'Calcula las butacas multiplicando filas * butacas.' }],
      },
    },
    {
      id: 'op-division',
      title: 'División entera y resto',
      theory: md`
## Cuando divides dos enteros…

…C hace la **división entera**: se queda con el cociente y **tira los decimales** (no redondea):

\`\`\`c
#include <stdio.h>

int main() {
    printf("%d\n", 7 / 2);      // 3
    printf("%d\n", 9 / 10);     // 0
    printf("%d\n", -7 / 2);     // -3
    printf("%f\n", 7.0 / 2);    // 3.500000: si uno es decimal, la división es decimal
    return 0;
}
\`\`\`

## El resto: \`%\`

El operador \`%\` (módulo) da el **resto** de la división entera. Es muy útil:

- \`n % 2\` vale 0 si \`n\` es **par** y 1 si es impar.
- \`n % 10\` es la **última cifra** de \`n\`. Y \`n / 10\` le **quita** la última cifra.
- Para pasar segundos a minutos: \`minutos = s / 60\` y \`segundos = s % 60\`.

\`\`\`c
#include <stdio.h>

int main() {
    int total = 200;               // minutos
    int horas = total / 60;
    int minutos = total % 60;
    printf("%d minutos son %d h y %d min\n", total, horas, minutos);

    int n = 1234;
    printf("Última cifra: %d\n", n % 10);
    printf("Sin la última: %d\n", n / 10);
    return 0;
}
\`\`\`

> ⚠️ Dividir entre **0** (con \`/\` o \`%\`) es un error grave: el programa se detiene.
`,
      exercise: {
        task: md`
Tienes \`segundos = 7385\`. Pásalo a horas, minutos y segundos y escribe:

\`\`\`salida
7385 segundos son 2 h 3 min 5 s
\`\`\`
`,
        starter: md`#include <stdio.h>

int main() {
    int segundos = 7385;

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int segundos = 7385;
    int h = segundos / 3600;
    int resto = segundos % 3600;
    int m = resto / 60;
    int s = resto % 60;
    printf("%d segundos son %d h %d min %d s\n", segundos, h, m, s);
    return 0;
}
`,
        tests: [{ output: '7385 segundos son 2 h 3 min 5 s\n' }],
        hints: ['Una hora son 3600 segundos: horas = segundos / 3600.', 'Lo que sobra tras quitar las horas es segundos % 3600. De eso, los minutos son resto / 60 y los segundos resto % 60.'],
        requires: [{ re: '%\\s*(3600|60)', msg: 'Usa el operador % (resto) para calcular lo que sobra.' }],
        forbids: [{ re: '"7385 segundos son 2 h', msg: 'Los números tienen que calcularse, no escribirse a mano en el texto.' }],
      },
    },
    {
      id: 'op-asignacion',
      title: 'Atajos: +=, ++ y compañía',
      theory: md`
## Cambiar una variable a partir de sí misma

Es muy común hacer \`puntos = puntos + 10;\`. Como se usa tanto, hay atajos:

| Largo | Corto |
|---|---|
| \`x = x + 5;\` | \`x += 5;\` |
| \`x = x - 5;\` | \`x -= 5;\` |
| \`x = x * 2;\` | \`x *= 2;\` |
| \`x = x / 2;\` | \`x /= 2;\` |
| \`x = x + 1;\` | \`x++;\` |
| \`x = x - 1;\` | \`x--;\` |

\`\`\`c
#include <stdio.h>

int main() {
    int vidas = 3;
    int puntos = 0;
    puntos += 100;     // coges una moneda grande
    puntos += 25;
    vidas--;           // te golpea un enemigo
    puntos *= 2;       // bonus x2 al final del nivel
    printf("Vidas: %d, puntos: %d\n", vidas, puntos);
    return 0;
}
\`\`\`

> 💡 \`x++\` y \`++x\` suman 1 los dos. La diferencia solo importa si los usas dentro de otra expresión (\`y = x++\` guarda el valor **antes** de sumar; \`y = ++x\`, **después**). Mejor usarlos solos en su línea.
`,
      exercise: {
        task: md`
Simula una cuenta bancaria. Empieza con \`saldo = 500\` y haz, **en este orden y usando los atajos** \`+=\`, \`-=\` y \`*=\`:

1. Ingresas 250.
2. Pagas una factura de 120.
3. El banco te da un 10 % de intereses (multiplica por \`1.10\`; usa una variable \`double\`).

Después de cada paso escribe el saldo con 2 decimales:

\`\`\`salida
Ingreso: 750.00
Factura: 630.00
Intereses: 693.00
\`\`\`
`,
        starter: md`#include <stdio.h>

int main() {
    double saldo = 500;

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    double saldo = 500;
    saldo += 250;
    printf("Ingreso: %.2f\n", saldo);
    saldo -= 120;
    printf("Factura: %.2f\n", saldo);
    saldo *= 1.10;
    printf("Intereses: %.2f\n", saldo);
    return 0;
}
`,
        tests: [{ output: 'Ingreso: 750.00\nFactura: 630.00\nIntereses: 693.00\n' }],
        hints: ['saldo += 250; suma 250 al saldo.', 'Después de cada operación, un printf con %.2f.'],
        requires: [
          { re: '\\+=', msg: 'Usa += para el ingreso.' },
          { re: '-=', msg: 'Usa -= para la factura.' },
          { re: '\\*=', msg: 'Usa *= para los intereses.' },
        ],
      },
    },
    {
      id: 'op-conversion',
      title: 'Conversiones de tipo',
      theory: md`
## El error más famoso: la media

Quieres la media de tres notas enteras:

\`\`\`c
#include <stdio.h>

int main() {
    int a = 7, b = 8, c = 8;
    double media = (a + b + c) / 3;
    printf("%.2f\n", media);    // 7.00, ¡pero la media real es 7.67!
    return 0;
}
\`\`\`

¿Qué pasa? \`(a + b + c) / 3\` es **entero / entero**, así que C hace la división entera (23 / 3 = 7) y **después** lo guarda en el \`double\`. Los decimales ya se habían perdido.

## La solución: convertir antes de dividir

Con un **cast** \`(double)\` delante, conviertes un valor a otro tipo. Basta con que **uno** de los dos sea decimal:

\`\`\`c
#include <stdio.h>

int main() {
    int a = 7, b = 8, c = 8;
    double bien1 = (double)(a + b + c) / 3;
    double bien2 = (a + b + c) / 3.0;      // 3.0 es decimal
    printf("%.2f %.2f\n", bien1, bien2);
    return 0;
}
\`\`\`

También se puede convertir en sentido contrario: \`(int)3.99\` vale \`3\` (corta los decimales, no redondea).

> 💡 Regla práctica: si quieres decimales en una división, asegúrate de que **algún operando** es \`double\`.
`,
      exercise: {
        task: md`
Tienes las notas enteras \`n1 = 6\`, \`n2 = 9\`, \`n3 = 8\` y \`n4 = 8\`. Calcula la media **con decimales** y escribe:

\`\`\`salida
Suma: 31
Media: 7.75
Media sin decimales: 7
\`\`\`

La última línea es la media convertida a \`int\` con un cast.
`,
        starter: md`#include <stdio.h>

int main() {
    int n1 = 6, n2 = 9, n3 = 8, n4 = 8;
    int suma = n1 + n2 + n3 + n4;
    double media = suma / 4;      // ¡cuidado!

    printf("Suma: %d\n", suma);
    printf("Media: %.2f\n", media);
    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int n1 = 6, n2 = 9, n3 = 8, n4 = 8;
    int suma = n1 + n2 + n3 + n4;
    double media = (double)suma / 4;

    printf("Suma: %d\n", suma);
    printf("Media: %.2f\n", media);
    printf("Media sin decimales: %d\n", (int)media);
    return 0;
}
`,
        tests: [{ output: 'Suma: 31\nMedia: 7.75\nMedia sin decimales: 7\n' }],
        hints: ['suma / 4 es entero / entero. Convierte uno: (double)suma / 4', 'Para la última línea: (int)media con %d.'],
        requires: [{ re: '\\(\\s*int\\s*\\)', msg: 'Usa el cast (int) para la media sin decimales.' }],
      },
    },
    {
      id: 'op-math',
      title: 'Funciones matemáticas (math.h)',
      theory: md`
## La biblioteca math.h

Para raíces, potencias y demás hay que incluir \`<math.h>\`:

| Función | Qué hace | Ejemplo |
|---|---|---|
| \`sqrt(x)\` | raíz cuadrada | \`sqrt(16)\` → 4 |
| \`pow(b, e)\` | potencia bᵉ | \`pow(2, 10)\` → 1024 |
| \`fabs(x)\` | valor absoluto | \`fabs(-3.5)\` → 3.5 |
| \`round(x)\` | redondear | \`round(2.6)\` → 3 |
| \`floor(x)\` / \`ceil(x)\` | redondear abajo / arriba | \`floor(2.9)\` → 2, \`ceil(2.1)\` → 3 |
| \`sin\`, \`cos\`, \`tan\` | trigonometría (radianes) | \`sin(M_PI / 2)\` → 1 |

Todas devuelven \`double\`, así que se escriben con \`%f\`:

\`\`\`c
#include <stdio.h>
#include <math.h>

int main() {
    double x = 2;
    printf("Raíz de 2: %.4f\n", sqrt(x));
    printf("2 elevado a 8: %.0f\n", pow(2, 8));
    printf("Redondeos de 2.5: %.0f %.0f %.0f\n", round(2.5), floor(2.5), ceil(2.5));
    return 0;
}
\`\`\`

> ⚠️ En C, \`^\` **no** es la potencia (es otra cosa: el "o exclusivo" de bits). Para potencias usa \`pow\` o multiplica: \`x * x\`.
`,
      exercise: {
        task: md`
Un triángulo rectángulo tiene catetos \`a = 6.5\` y \`b = 4.2\`. Usa el teorema de Pitágoras (\`h = √(a² + b²)\`) y escribe la hipotenusa con 3 decimales, y después redondeada a entero:

\`\`\`salida
Hipotenusa: 7.739
Redondeada: 8
\`\`\`
`,
        starter: md`#include <stdio.h>

int main() {
    double a = 6.5;
    double b = 4.2;

    return 0;
}
`,
        solution: md`#include <stdio.h>
#include <math.h>

int main() {
    double a = 6.5;
    double b = 4.2;
    double h = sqrt(pow(a, 2) + pow(b, 2));
    printf("Hipotenusa: %.3f\n", h);
    printf("Redondeada: %.0f\n", round(h));
    return 0;
}
`,
        tests: [{ output: 'Hipotenusa: 7.739\nRedondeada: 8\n' }],
        hints: ['Añade #include <math.h> arriba.', 'h = sqrt(a * a + b * b);', 'round(h) devuelve un double: escríbelo con %.0f.'],
        requires: [{ re: 'sqrt\\s*\\(', msg: 'Usa sqrt para la raíz cuadrada.' }],
      },
    },
    {
      id: 'op-proyecto',
      title: 'Proyecto: conversor de unidades',
      kind: 'proyecto',
      theory: md`
## Un conversor de verdad

Las conversiones de unidades son cuentas sencillas, perfectas para practicar operadores y formatos:

- Celsius → Fahrenheit: \`F = C · 9 / 5 + 32\`
- Celsius → Kelvin: \`K = C + 273.15\`
- Kilómetros → millas: \`mi = km / 1.609\`

Cuidado con la división entera: \`9 / 5\` vale 1 si los dos son enteros. Escríbelo \`9.0 / 5\`.

Para que las columnas queden alineadas, usa anchos en printf: \`%8.2f\` ocupa 8 caracteres.

\`\`\`c
#include <stdio.h>

int main() {
    printf("|%8.2f|%8.2f|\n", 3.5, 125.25);
    printf("|%8.2f|%8.2f|\n", 10.0, 7.125);
    return 0;
}
\`\`\`
`,
      exercise: {
        task: md`
Tienes \`double c = 36.6;\` (grados Celsius) y \`double km = 42.195;\` (un maratón). Escribe exactamente:

\`\`\`salida
36.6 ºC = 97.88 ºF = 309.75 K
Un maratón son 42.195 km = 26.22 millas
\`\`\`
`,
        starter: md`#include <stdio.h>

int main() {
    double c = 36.6;
    double km = 42.195;

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    double c = 36.6;
    double km = 42.195;
    double f = c * 9.0 / 5 + 32;
    double k = c + 273.15;
    double millas = km / 1.609;
    printf("%.1f ºC = %.2f ºF = %.2f K\n", c, f, k);
    printf("Un maratón son %.3f km = %.2f millas\n", km, millas);
    return 0;
}
`,
        tests: [{ output: '36.6 ºC = 97.88 ºF = 309.75 K\nUn maratón son 42.195 km = 26.22 millas\n' }],
        hints: ['F = c * 9.0 / 5 + 32 (con 9.0 para no hacer división entera).', 'Los Celsius con 1 decimal (%.1f), el resto con 2 (%.2f) y los km con 3.'],
      },
    },
    {
      id: 'op-examen',
      title: 'Examen: operadores',
      kind: 'examen',
      theory: md`
## ¿Dominas las cuentas?

Necesitas un **70 %** para completar el capítulo.
`,
      quiz: [
        { q: '¿Cuánto vale `17 / 5` en C (con enteros)?', options: ['3.4', '3', '4', '2'], answer: 1, explain: 'División entera: se descartan los decimales.' },
        { q: '¿Cuánto vale `17 % 5`?', options: ['3', '2', '3.4', '0'], answer: 1, explain: '17 = 5 · 3 + 2: el resto es 2.' },
        { q: '¿Qué valor tiene `x` al final?', code: 'int x = 10;\nx += 5;\nx *= 2;\nx--;', options: ['29', '30', '19', '31'], answer: 0, explain: '10 + 5 = 15; 15 · 2 = 30; 30 − 1 = 29.' },
        {
          q: '¿Cuál de estas expresiones da 2.5?',
          options: ['`5 / 2`', '`(double)(5 / 2)`', '`5.0 / 2`', '`(int)5 / 2`'],
          answer: 2,
          explain: 'Basta con que uno sea decimal. (double)(5/2) hace primero la división entera (2) y luego convierte: 2.0.',
        },
        { q: '¿Cómo se calcula 3 elevado a 4 en C?', options: ['`3 ^ 4`', '`3 ** 4`', '`pow(3, 4)`', '`3e4`'], answer: 2, explain: 'Con pow de math.h (o multiplicando 3*3*3*3). ^ no es la potencia.' },
        { q: '¿Cómo saber si `n` es par?', options: ['`n / 2 == 0`', '`n % 2 == 0`', '`n % 2 == 1`', '`n / 2 == 1`'], answer: 1, explain: 'Un número es par si el resto de dividirlo entre 2 es 0.' },
        { q: '¿Cuánto vale `2 + 3 * 4 - 1`?', options: ['19', '13', '15', '21'], answer: 1, explain: 'Primero la multiplicación: 2 + 12 − 1 = 13.' },
      ],
    },
  ],
};
