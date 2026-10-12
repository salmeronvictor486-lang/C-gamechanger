import { md, type Chapter } from '../types';

export const bucleFor: Chapter = {
  id: 'for',
  title: 'Bucle for',
  subtitle: 'Repeticiones contadas, bucles anidados y patrones',
  icon: '🌀',
  color: '#ffd166',
  level: 2,
  lessons: [
    {
      id: 'for-basico',
      title: 'El bucle for',
      theory: md`
## Todo en una línea

Muchos bucles siguen el mismo esquema: **inicializar** un contador, **comprobar** una condición y **actualizar** el contador. \`for\` lo junta todo en una línea:

\`\`\`c
#include <stdio.h>

int main() {
    for (int i = 1; i <= 5; i++) {
        printf("Vuelta %d\n", i);
    }
    return 0;
}
\`\`\`

\`\`\`c norun
for (inicio; condición; paso) {
    // cuerpo
}
\`\`\`

1. **inicio** (\`int i = 1\`): se hace **una vez**, al principio.
2. **condición** (\`i <= 5\`): se comprueba **antes de cada vuelta**. Si es falsa, el bucle termina.
3. **cuerpo**: lo que se repite.
4. **paso** (\`i++\`): se hace **al final de cada vuelta**. Vuelta al punto 2.

Es exactamente lo mismo que este \`while\`, pero más compacto y con todo el control del bucle a la vista:

\`\`\`c norun
int i = 1;
while (i <= 5) {
    printf("Vuelta %d\n", i);
    i++;
}
\`\`\`

> ⚠️ Las partes del \`for\` se separan con **punto y coma**, no con comas.

> 💡 La costumbre en C es contar **desde 0**: \`for (int i = 0; i < n; i++)\` da exactamente \`n\` vueltas. Te será muy útil con los arrays.
`,
      exercise: {
        task: md`
Lee un número \`n\` y escribe su **tabla de multiplicar** del 1 al 10 con este formato (los números alineados con \`%2d\`):

\`\`\`text
 7 x  1 =  7
 7 x  2 = 14
...
\`\`\`

Usa \`printf("%2d x %2d = %2d\n", ...)\`. (Si el resultado tiene 3 cifras, se escribe completo: el ancho es un mínimo.)
`,
        starter: md`#include <stdio.h>

int main() {
    int n;
    printf("Tabla del: ");
    scanf("%d", &n);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int n;
    printf("Tabla del: ");
    scanf("%d", &n);
    for (int i = 1; i <= 10; i++) {
        printf("%2d x %2d = %2d\n", n, i, n * i);
    }
    return 0;
}
`,
        tests: [{ input: '7\n' }, { input: '1\n' }, { input: '12\n' }],
        hints: ['for (int i = 1; i <= 10; i++) { ... }', 'Dentro: printf("%2d x %2d = %2d\\n", n, i, n * i);'],
        requires: [{ re: '\\bfor\\s*\\(', msg: 'Usa un bucle for.' }],
      },
    },
    {
      id: 'for-pasos',
      title: 'Contar de otras formas',
      theory: md`
## El paso puede ser cualquiera

El contador no tiene que ir de 1 en 1, ni hacia arriba:

\`\`\`c
#include <stdio.h>

int main() {
    for (int i = 0; i <= 20; i += 5) printf("%d ", i);      // de 5 en 5
    printf("\n");
    for (int i = 10; i >= 1; i--) printf("%d ", i);         // cuenta atrás
    printf("¡Despegue!\n");
    for (int i = 1; i <= 1000; i *= 2) printf("%d ", i);    // potencias de 2
    printf("\n");
    for (char c = 'a'; c <= 'f'; c++) printf("%c", c);      // también con letras
    printf("\n");
    return 0;
}
\`\`\`

> 💡 Si el cuerpo del bucle es una sola instrucción, puedes ponerla en la misma línea sin llaves, como en el ejemplo. Pero si tienes dudas, pon llaves.
`,
      exercise: {
        task: md`
Lee dos números \`a\` y \`b\` (con \`a > b\`) y escribe en una línea, separados por espacios, todos los números **pares** desde \`a\` hasta \`b\` **en orden descendente** (incluidos si son pares). Termina la línea con \`\n\`.

Por ejemplo, con \`a = 15\` y \`b = 6\`: \`14 12 10 8 6\`
`,
        starter: md`#include <stdio.h>

int main() {
    int a, b;
    printf("Desde y hasta: ");
    scanf("%d %d", &a, &b);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int a, b;
    printf("Desde y hasta: ");
    scanf("%d %d", &a, &b);
    int inicio = (a % 2 == 0) ? a : a - 1;
    for (int i = inicio; i >= b; i -= 2) {
        printf("%d", i);
        if (i - 2 >= b) {
            printf(" ");
        }
    }
    printf("\n");
    return 0;
}
`,
        tests: [{ input: '15 6\n' }, { input: '20 10\n' }, { input: '9 2\n' }, { input: '4 3\n' }],
        hints: [
          'Si a es impar, empieza en a - 1. Después baja de 2 en 2: i -= 2.',
          'Para no dejar un espacio al final, escribe el espacio solo si todavía queda otro número (i - 2 >= b). ¡O escribe el espacio antes de cada número menos el primero!',
        ],
        requires: [{ re: '\\bfor\\s*\\(', msg: 'Usa un bucle for.' }],
      },
    },
    {
      id: 'for-acumular',
      title: 'Sumas, productos y factoriales',
      theory: md`
## Acumular dentro de un for

Los acumuladores del capítulo anterior funcionan igual con \`for\`. Para **multiplicar**, el acumulador empieza en **1** (si empezara en 0, todo daría 0).

El **factorial** de n (se escribe n!) es 1 · 2 · 3 · … · n. Crece muy deprisa: 13! ya no cabe en un \`int\`, así que usa \`long long\` (y \`%lld\`):

\`\`\`c
#include <stdio.h>

int main() {
    long long factorial = 1;
    for (int i = 1; i <= 20; i++) {
        factorial *= i;
        printf("%2d! = %lld\n", i, factorial);
    }
    return 0;
}
\`\`\`
`,
      exercise: {
        task: md`
Lee \`base\` y \`exponente\` (enteros, exponente ≥ 0) y calcula la **potencia** multiplicando en un bucle (sin \`pow\`). Usa \`long long\` para el resultado y escribe \`base^exponente = resultado\`.
`,
        starter: md`#include <stdio.h>

int main() {
    int base, exponente;
    printf("Base y exponente: ");
    scanf("%d %d", &base, &exponente);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int base, exponente;
    printf("Base y exponente: ");
    scanf("%d %d", &base, &exponente);
    long long resultado = 1;
    for (int i = 0; i < exponente; i++) {
        resultado *= base;
    }
    printf("%d^%d = %lld\n", base, exponente, resultado);
    return 0;
}
`,
        tests: [{ input: '2 10\n' }, { input: '3 0\n', name: 'exponente 0' }, { input: '-2 3\n' }, { input: '10 15\n', name: 'número grande' }],
        hints: ['long long resultado = 1;', 'Multiplica por base exponente veces: for (int i = 0; i < exponente; i++) resultado *= base;', 'Escribe el long long con %lld.'],
        requires: [{ re: '\\bfor\\s*\\(', msg: 'Usa un bucle for.' }],
        forbids: [{ re: '\\bpow\\s*\\(', msg: 'Hazlo multiplicando en un bucle, sin pow.' }],
      },
    },
    {
      id: 'for-break-continue',
      title: 'break y continue',
      theory: md`
## Salir antes o saltarse una vuelta

- **\`break\`** sale del bucle **inmediatamente** (como en el switch).
- **\`continue\`** se salta lo que queda de **esta vuelta** y pasa a la siguiente.

\`\`\`c
#include <stdio.h>

int main() {
    // continue: escribe del 1 al 10 menos los múltiplos de 3
    for (int i = 1; i <= 10; i++) {
        if (i % 3 == 0) {
            continue;
        }
        printf("%d ", i);
    }
    printf("\n");

    // break: busca el primer número mayor que 50 divisible entre 7
    for (int i = 51; ; i++) {      // sin condición: bucle "infinito"…
        if (i % 7 == 0) {
            printf("Encontrado: %d\n", i);
            break;                   // …que termina con break
        }
    }
    return 0;
}
\`\`\`

> 💡 \`break\` es muy útil para **buscar**: en cuanto encuentras lo que buscas, dejas de mirar.
`,
      exercise: {
        task: md`
Lee hasta **10** números. Ve sumándolos, pero:

- Si un número es **negativo**, **ignóralo** (\`continue\`).
- Si un número es **0**, **para de leer** (\`break\`).

Al final escribe \`Suma: S\`.
`,
        starter: md`#include <stdio.h>

int main() {
    int x, suma = 0;
    for (int i = 0; i < 10; i++) {
        scanf("%d", &x);

    }
    printf("Suma: %d\n", suma);
    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int x, suma = 0;
    for (int i = 0; i < 10; i++) {
        scanf("%d", &x);
        if (x == 0) {
            break;
        }
        if (x < 0) {
            continue;
        }
        suma += x;
    }
    printf("Suma: %d\n", suma);
    return 0;
}
`,
        tests: [
          { input: '1 2 3 4 5 6 7 8 9 10\n', name: 'diez números' },
          { input: '5 -3 8 0 100\n', name: 'con negativo y 0' },
          { input: '0\n', name: 'empieza en 0' },
          { input: '-1 -2 -3 -4 -5 -6 -7 -8 -9 -10\n', name: 'todo negativos' },
          { input: '1 1 1 1 1 1 1 1 1 1 1 1\n', name: 'más de diez' },
        ],
        hints: ['Primero comprueba si x == 0 → break.', 'Después, si x < 0 → continue. Si no, suma.'],
        requires: [
          { re: '\\bbreak\\s*;', msg: 'Usa break para parar con el 0.' },
          { re: '\\bcontinue\\s*;', msg: 'Usa continue para saltarte los negativos.' },
        ],
      },
    },
    {
      id: 'for-anidados',
      title: 'Bucles anidados',
      theory: md`
## Un bucle dentro de otro

Si pones un \`for\` dentro de otro, el de dentro hace **todas sus vueltas** por cada vuelta del de fuera. Es como las agujas de un reloj: el minutero da una vuelta completa por cada hora.

\`\`\`c
#include <stdio.h>

int main() {
    for (int fila = 1; fila <= 3; fila++) {
        for (int col = 1; col <= 4; col++) {
            printf("(%d,%d) ", fila, col);
        }
        printf("\n");          // al terminar cada fila, salto de línea
    }
    return 0;
}
\`\`\`

En total se ejecuta 3 × 4 = 12 veces el \`printf\` de dentro.

Con esto se pueden dibujar figuras:

\`\`\`c
#include <stdio.h>

int main() {
    int alto = 3, ancho = 6;
    for (int i = 0; i < alto; i++) {
        for (int j = 0; j < ancho; j++) {
            printf("*");
        }
        printf("\n");
    }
    return 0;
}
\`\`\`

> ⚠️ Usa **variables distintas** para cada bucle (\`i\` y \`j\`, o \`fila\` y \`col\`). Si los dos usan \`i\`, se pisan.
`,
      exercise: {
        task: md`
Lee \`n\` y escribe una **tabla de multiplicar completa** de \`n × n\`: en la fila \`i\` y columna \`j\` va \`i * j\`, cada número con \`%4d\`. Cada fila termina con \`\n\`.

Por ejemplo, con \`n = 3\`:

\`\`\`text
   1   2   3
   2   4   6
   3   6   9
\`\`\`
`,
        starter: md`#include <stdio.h>

int main() {
    int n;
    printf("Tamaño: ");
    scanf("%d", &n);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int n;
    printf("Tamaño: ");
    scanf("%d", &n);
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) {
            printf("%4d", i * j);
        }
        printf("\n");
    }
    return 0;
}
`,
        tests: [{ input: '3\n' }, { input: '1\n' }, { input: '9\n' }],
        hints: ['Un for para las filas (i de 1 a n) y dentro otro para las columnas (j de 1 a n).', 'Después del for de dentro, printf("\\n");'],
        requires: [{ re: 'for[\\s\\S]*for', msg: 'Usa dos bucles for, uno dentro de otro.' }],
      },
    },
    {
      id: 'for-patrones',
      title: 'Dibujar triángulos',
      theory: md`
## Cuando el bucle de dentro depende del de fuera

Si el número de vueltas del bucle interior depende de la fila, salen **triángulos**:

\`\`\`c
#include <stdio.h>

int main() {
    int n = 4;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) {   // la fila i tiene i asteriscos
            printf("*");
        }
        printf("\n");
    }
    return 0;
}
\`\`\`

Para que el triángulo quede pegado a la derecha (o centrado como una pirámide), cada fila empieza con **espacios**. Fíjate en la tabla para \`n = 4\`:

| Fila | Espacios | Asteriscos (pirámide) |
|---|---|---|
| 1 | 3 | 1 |
| 2 | 2 | 3 |
| 3 | 1 | 5 |
| 4 | 0 | 7 |

Espacios = \`n - i\` y asteriscos = \`2 * i - 1\`.

> 💡 El truco para cualquier figura: haz una tabla con lo que lleva cada fila y busca la fórmula en función del número de fila.
`,
      exercise: {
        task: md`
Lee la altura \`n\` y dibuja una **pirámide** de asteriscos centrada, con la fórmula de la teoría. No escribas espacios después de los asteriscos.

Con \`n = 3\`:

\`\`\`text
  *
 ***
*****
\`\`\`
`,
        starter: md`#include <stdio.h>

int main() {
    int n;
    printf("Altura: ");
    scanf("%d", &n);
    printf("\n");

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int n;
    printf("Altura: ");
    scanf("%d", &n);
    printf("\n");
    for (int i = 1; i <= n; i++) {
        for (int e = 0; e < n - i; e++) {
            printf(" ");
        }
        for (int a = 0; a < 2 * i - 1; a++) {
            printf("*");
        }
        printf("\n");
    }
    return 0;
}
`,
        tests: [{ input: '3\n' }, { input: '1\n' }, { input: '6\n' }],
        hints: ['Para cada fila i (de 1 a n): un for de espacios (n - i) y otro de asteriscos (2*i - 1).', 'Al final de cada fila, printf("\\n");'],
        requires: [{ re: 'for[\\s\\S]*for', msg: 'Usa bucles for anidados.' }],
      },
    },
    {
      id: 'for-primos',
      title: 'Números primos',
      theory: md`
## ¿Es primo?

Un número es **primo** si es mayor que 1 y solo se puede dividir (con resto 0) entre 1 y él mismo: 2, 3, 5, 7, 11, 13…

Para saberlo, probamos a dividirlo entre todos los números desde 2. En cuanto uno lo divide, **no es primo** y podemos parar (\`break\`):

\`\`\`c entrada="91"
#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    int esPrimo = 1;           // suponemos que sí…
    if (n < 2) {
        esPrimo = 0;
    }
    for (int d = 2; d * d <= n; d++) {
        if (n % d == 0) {
            esPrimo = 0;       // …hasta encontrar un divisor
            break;
        }
    }
    if (esPrimo) {
        printf("%d es primo\n", n);
    } else {
        printf("%d no es primo\n", n);
    }
    return 0;
}
\`\`\`

¿Por qué \`d * d <= n\`? Si \`n\` tiene un divisor mayor que su raíz cuadrada, también tiene otro menor. Así hacemos muchas menos vueltas.

> 💡 La variable \`esPrimo\` es una **bandera** (*flag*): empieza en "sí" y se pone a "no" si pasa algo. Es otro patrón muy usado.
`,
      exercise: {
        task: md`
Lee un número \`n\` y escribe **todos los primos** desde 2 hasta \`n\`, separados por espacios (con un espacio después de cada uno), y en la línea siguiente \`Hay X primos\`.

Necesitarás un bucle que recorra los candidatos y, dentro, el bucle que comprueba si cada uno es primo.
`,
        starter: md`#include <stdio.h>

int main() {
    int n;
    printf("Hasta: ");
    scanf("%d", &n);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int n;
    printf("Hasta: ");
    scanf("%d", &n);
    int cuantos = 0;
    for (int k = 2; k <= n; k++) {
        int esPrimo = 1;
        for (int d = 2; d * d <= k; d++) {
            if (k % d == 0) {
                esPrimo = 0;
                break;
            }
        }
        if (esPrimo) {
            printf("%d ", k);
            cuantos++;
        }
    }
    printf("\nHay %d primos\n", cuantos);
    return 0;
}
`,
        tests: [{ input: '20\n' }, { input: '2\n' }, { input: '1\n', name: 'ninguno' }, { input: '100\n' }],
        hints: ['Bucle de fuera: for (int k = 2; k <= n; k++). Bucle de dentro: el de la teoría para k.', 'Pon la bandera esPrimo = 1 al principio de cada vuelta del bucle de fuera.', 'El primer printf("\\n...") de la última línea cierra la línea de los primos.'],
        requires: [{ re: 'for[\\s\\S]*for', msg: 'Usa bucles for anidados.' }],
      },
    },
    {
      id: 'for-aleatorios',
      title: 'Números aleatorios',
      theory: md`
## rand() y srand()

Los juegos necesitan azar: dados, cartas, enemigos… En \`<stdlib.h>\` está \`rand()\`, que devuelve un número "aleatorio" entre 0 y \`RAND_MAX\` (un número muy grande). Para un número entre 1 y 6 se usa el **resto**:

\`\`\`c
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int main() {
    srand(time(NULL));         // "semilla": cambia cada segundo
    for (int i = 0; i < 5; i++) {
        int dado = rand() % 6 + 1;
        printf("Tirada %d: %d\n", i + 1, dado);
    }
    return 0;
}
\`\`\`

- \`rand() % 6\` da un número de 0 a 5; con \`+ 1\`, de 1 a 6.
- En general, entre \`min\` y \`max\`: \`rand() % (max - min + 1) + min\`.
- \`srand(semilla)\` elige la **semilla**. Los números de \`rand()\` no son realmente aleatorios: salen de una fórmula. Con la **misma semilla** sale **siempre la misma secuencia**. Por eso se usa \`srand(time(NULL))\` (la hora actual) para que cada partida sea distinta.

> 💡 Para comprobar tu ejercicio usaremos una semilla fija, así la secuencia es siempre igual. (Ojo: otros compiladores, como el de Windows, dan otras secuencias para la misma semilla.)
`,
      exercise: {
        task: md`
Simula 20 tiradas de un dado usando \`srand(2024)\` como semilla (¡sin \`time\`!). Cuenta cuántas veces sale el **6** y cuál es la **suma** de todas las tiradas. Escribe:

\`\`\`text
Seises: X
Suma: Y
\`\`\`
`,
        starter: md`#include <stdio.h>
#include <stdlib.h>

int main() {
    srand(2024);

    return 0;
}
`,
        solution: md`#include <stdio.h>
#include <stdlib.h>

int main() {
    srand(2024);
    int seises = 0, suma = 0;
    for (int i = 0; i < 20; i++) {
        int dado = rand() % 6 + 1;
        if (dado == 6) {
            seises++;
        }
        suma += dado;
    }
    printf("Seises: %d\n", seises);
    printf("Suma: %d\n", suma);
    return 0;
}
`,
        tests: [{}],
        hints: ['Dentro de un for de 20 vueltas: int dado = rand() % 6 + 1;', 'Usa un contador para los seises y un acumulador para la suma.'],
        requires: [{ re: '\\brand\\s*\\(\\s*\\)', msg: 'Usa rand() para tirar el dado.' }],
      },
    },
    {
      id: 'for-proyecto',
      title: 'Proyecto: FizzBuzz',
      kind: 'proyecto',
      theory: md`
## La prueba de las entrevistas

FizzBuzz es un ejercicio famosísimo que se pone en entrevistas de trabajo para ver si alguien sabe programar de verdad. Las reglas, para cada número del 1 a n:

- Si es múltiplo de 3 **y** de 5, escribe \`FizzBuzz\`.
- Si solo es múltiplo de 3, \`Fizz\`.
- Si solo es múltiplo de 5, \`Buzz\`.
- Si no, el propio número.

La trampa: el orden de las condiciones importa. ¿Qué pasa con el 15 si compruebas primero el 3?
`,
      exercise: {
        task: md`
Lee \`n\` y escribe FizzBuzz del 1 al \`n\`, uno por línea. Al final escribe una línea con \`Fizz: A, Buzz: B, FizzBuzz: C\` contando cuántas veces salió cada palabra.
`,
        starter: md`#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    int fizz = 0, buzz = 0, fizzbuzz = 0;
    for (int i = 1; i <= n; i++) {
        if (i % 15 == 0) {
            printf("FizzBuzz\n");
            fizzbuzz++;
        } else if (i % 3 == 0) {
            printf("Fizz\n");
            fizz++;
        } else if (i % 5 == 0) {
            printf("Buzz\n");
            buzz++;
        } else {
            printf("%d\n", i);
        }
    }
    printf("Fizz: %d, Buzz: %d, FizzBuzz: %d\n", fizz, buzz, fizzbuzz);
    return 0;
}
`,
        tests: [{ input: '15\n' }, { input: '5\n' }, { input: '100\n' }],
        hints: ['Comprueba primero el caso de los dos (i % 15 == 0 o i % 3 == 0 && i % 5 == 0).', 'Usa tres contadores, uno por palabra.'],
        requires: [{ re: '\\bfor\\s*\\(', msg: 'Usa un bucle for.' }],
      },
    },
    {
      id: 'for-examen',
      title: 'Examen: for',
      kind: 'examen',
      theory: md`
## Examen de bucles

Necesitas un **70 %**.
`,
      quiz: [
        { q: '¿Cuántas vueltas da `for (int i = 0; i < 10; i++)`?', options: ['9', '10', '11', 'Infinitas'], answer: 1, explain: 'i va de 0 a 9: diez vueltas.' },
        { q: '¿Qué escribe?', code: 'for (int i = 10; i > 0; i -= 3)\n    printf("%d ", i);', options: ['10 7 4 1', '10 7 4', '10 7 4 1 -2', '9 6 3'], answer: 0, explain: '10, 7, 4, 1 y luego -2, que ya no cumple i > 0.' },
        { q: '¿Cuántas veces se ejecuta el printf?', code: 'for (int i = 0; i < 4; i++)\n    for (int j = 0; j < 3; j++)\n        printf("x");', options: ['7', '12', '4', '3'], answer: 1, explain: '4 vueltas fuera × 3 dentro = 12.' },
        { q: '¿Qué hace `continue` dentro de un bucle?', options: ['Sale del bucle', 'Salta a la siguiente vuelta', 'Repite la vuelta actual', 'Termina el programa'], answer: 1, explain: 'continue se salta lo que queda de la vuelta actual.' },
        { q: '¿Cómo se consigue un número aleatorio entre 1 y 10?', options: ['`rand() % 10`', '`rand() % 10 + 1`', '`rand(1, 10)`', '`rand() % 11`'], answer: 1, explain: 'rand() % 10 da 0..9; sumando 1, 1..10.' },
        { q: '¿Qué tiene de malo este bucle?', code: 'for (int i = 0; i < 5; i++);\n{\n    printf("hola\\n");\n}', options: ['Nada', 'El ; después del for: el bucle está vacío y hola sale una vez', 'Falta i--', 'Escribe hola 6 veces'], answer: 1, explain: 'El ; es el cuerpo del bucle. El bloque de debajo se ejecuta una sola vez al terminar.' },
        { q: '¿Por qué un factorial se guarda en `long long`?', options: ['Porque tiene decimales', 'Porque crece muy rápido y no cabe en un int', 'Porque es negativo', 'Por costumbre'], answer: 1, explain: '13! ya supera el máximo de un int.' },
      ],
    },
  ],
};
