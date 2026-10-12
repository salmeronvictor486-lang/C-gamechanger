import { md, type Chapter } from '../types';

export const bucleWhile: Chapter = {
  id: 'while',
  title: 'Bucle while',
  subtitle: 'Repetir mientras se cumpla una condición',
  icon: '🔁',
  color: '#5fd3ff',
  level: 2,
  lessons: [
    {
      id: 'wh-basico',
      title: 'Repetir con while',
      theory: md`
## Mientras…, repite

Un **bucle** repite un bloque de código. \`while\` (mientras) lo repite **mientras** la condición sea cierta:

\`\`\`c
#include <stdio.h>

int main() {
    int i = 1;
    while (i <= 5) {
        printf("Vuelta %d\n", i);
        i++;
    }
    printf("Fin (i vale %d)\n", i);
    return 0;
}
\`\`\`

Paso a paso:
1. Comprueba la condición (\`1 <= 5\`, cierta) → ejecuta el bloque → \`i\` pasa a 2.
2. Comprueba otra vez (\`2 <= 5\`)… y así hasta que \`i\` vale 6.
3. \`6 <= 5\` es falso → sale del bucle y sigue con lo de después.

Cada repetición se llama **iteración** o **vuelta**.

> ⚠️ **Bucle infinito:** si la condición nunca llega a ser falsa (por ejemplo, olvidas el \`i++\`), el bucle no termina nunca. Aquí lo detectamos y te avisamos; en tu ordenador tendrías que cerrar el programa a la fuerza (Ctrl+C).

> 💡 Si la condición es falsa desde el principio, el bloque **no se ejecuta ni una vez**.
`,
      exercise: {
        task: md`
Lee un número \`n\` y escribe los números del \`1\` al \`n\`, uno por línea, usando \`while\`. Al final escribe \`¡Listo!\`.
`,
        starter: md`#include <stdio.h>

int main() {
    int n;
    printf("¿Hasta qué número cuento? ");
    scanf("%d", &n);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int n;
    printf("¿Hasta qué número cuento? ");
    scanf("%d", &n);
    int i = 1;
    while (i <= n) {
        printf("%d\n", i);
        i++;
    }
    printf("¡Listo!\n");
    return 0;
}
`,
        tests: [{ input: '5\n' }, { input: '1\n' }, { input: '0\n', name: 'n = 0' }, { input: '12\n' }],
        hints: ['Necesitas un contador: int i = 1;', 'while (i <= n) { printf("%d\\n", i); i++; }', 'No olvides i++ dentro del bucle, o no terminará nunca.'],
        requires: [{ re: '\\bwhile\\s*\\(', msg: 'Usa un bucle while.' }],
      },
    },
    {
      id: 'wh-acumuladores',
      title: 'Contadores y acumuladores',
      theory: md`
## Dos patrones que usarás siempre

- **Contador:** una variable que suma 1 cada vez que pasa algo. Empieza en 0. \`contador++;\`
- **Acumulador:** una variable que va sumando valores. Empieza en 0 (o en 1 si multiplica). \`suma += x;\`

\`\`\`c
#include <stdio.h>

int main() {
    int i = 1;
    int suma = 0;      // acumulador
    int pares = 0;     // contador
    while (i <= 10) {
        suma += i;
        if (i % 2 == 0) {
            pares++;
        }
        i++;
    }
    printf("Suma del 1 al 10: %d\n", suma);
    printf("Hay %d pares\n", pares);
    return 0;
}
\`\`\`

> ⚠️ Acuérdate de **inicializar** los acumuladores. \`int suma;\` sin \`= 0\` empieza con un valor cualquiera, y el resultado sale mal. (Aquí te avisaremos con un error.)
`,
      exercise: {
        task: md`
Lee un número \`n\` y calcula la **suma** de todos los números del 1 al \`n\` y cuántos de ellos son **múltiplos de 3**. Escribe:

\`\`\`text
Suma: S
Múltiplos de 3: M
\`\`\`
`,
        starter: md`#include <stdio.h>

int main() {
    int n;
    printf("n: ");
    scanf("%d", &n);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int n;
    printf("n: ");
    scanf("%d", &n);
    int i = 1;
    int suma = 0;
    int multiplos = 0;
    while (i <= n) {
        suma += i;
        if (i % 3 == 0) {
            multiplos++;
        }
        i++;
    }
    printf("Suma: %d\n", suma);
    printf("Múltiplos de 3: %d\n", multiplos);
    return 0;
}
`,
        tests: [{ input: '10\n' }, { input: '3\n' }, { input: '1\n' }, { input: '100\n' }],
        hints: ['Crea suma = 0 y multiplos = 0 antes del bucle.', 'Dentro: suma += i; y si i % 3 == 0, multiplos++;'],
        requires: [{ re: '\\bwhile\\s*\\(', msg: 'Usa un bucle while.' }],
      },
    },
    {
      id: 'wh-centinela',
      title: 'Leer hasta un valor final',
      theory: md`
## El valor centinela

¿Y si no sabes cuántos datos va a escribir el usuario? Se acuerda un **valor especial** que significa "ya está" (el **centinela**), por ejemplo el 0:

\`\`\`c entrada="5\n12\n3\n0"
#include <stdio.h>

int main() {
    int x;
    int suma = 0, cuantos = 0;
    printf("Escribe números (0 para terminar):\n");
    scanf("%d", &x);
    while (x != 0) {
        suma += x;
        cuantos++;
        scanf("%d", &x);      // lee el siguiente
    }
    printf("Has escrito %d números que suman %d\n", cuantos, suma);
    return 0;
}
\`\`\`

Fíjate en la estructura: se lee **un dato antes** del bucle, y otro **al final** de cada vuelta. Así la condición siempre comprueba el último dato leído y el 0 no se suma.

> 💡 También se puede escribir \`while (scanf("%d", &x) == 1 && x != 0)\`: scanf devuelve cuántos datos ha leído bien.
`,
      exercise: {
        task: md`
Lee notas (números decimales) hasta que se escriba un número **negativo**. Después escribe cuántas notas hay y su **media** con 2 decimales. Si no se escribió ninguna nota, escribe \`No hay notas\`.

\`\`\`text
Notas leídas: N
Media: M
\`\`\`
`,
        starter: md`#include <stdio.h>

int main() {
    double nota;
    printf("Notas (negativo para terminar):\n");

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    double nota;
    printf("Notas (negativo para terminar):\n");
    double suma = 0;
    int cuantas = 0;
    scanf("%lf", &nota);
    while (nota >= 0) {
        suma += nota;
        cuantas++;
        scanf("%lf", &nota);
    }
    if (cuantas == 0) {
        printf("No hay notas\n");
    } else {
        printf("Notas leídas: %d\n", cuantas);
        printf("Media: %.2f\n", suma / cuantas);
    }
    return 0;
}
`,
        tests: [{ input: '7\n8.5\n6\n-1\n' }, { input: '10\n-5\n' }, { input: '-1\n', name: 'sin notas' }, { input: '0\n5\n5\n5\n-2\n', name: 'con un cero' }],
        hints: ['Lee la primera nota antes del while.', 'while (nota >= 0) { suma += nota; cuantas++; scanf(...); }', 'Al final, comprueba si cuantas == 0 antes de dividir.'],
        requires: [{ re: '\\bwhile\\s*\\(', msg: 'Usa un bucle while.' }],
      },
    },
    {
      id: 'wh-validar',
      title: 'Validar lo que escribe el usuario',
      theory: md`
## No te fíes del usuario

Si pides un número entre 1 y 10, alguien escribirá 57. Un \`while\` puede **repetir la pregunta** hasta que el dato sea válido:

\`\`\`c entrada="0\n15\n7"
#include <stdio.h>

int main() {
    int n;
    printf("Número del 1 al 10: ");
    scanf("%d", &n);
    while (n < 1 || n > 10) {
        printf("No es válido. Otra vez: ");
        scanf("%d", &n);
    }
    printf("Has elegido el %d\n", n);
    return 0;
}
\`\`\`

La condición del \`while\` describe cuándo el dato **está mal** (por eso se repite).
`,
      exercise: {
        task: md`
Pide una **edad** válida (entre 0 y 120). Mientras no lo sea, escribe \`Edad no válida. Prueba otra vez: \` y vuelve a leer. Cuando sea válida, escribe \`Edad registrada: X\`.
`,
        starter: md`#include <stdio.h>

int main() {
    int edad;
    printf("Edad: ");
    scanf("%d", &edad);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int edad;
    printf("Edad: ");
    scanf("%d", &edad);
    while (edad < 0 || edad > 120) {
        printf("Edad no válida. Prueba otra vez: ");
        scanf("%d", &edad);
    }
    printf("Edad registrada: %d\n", edad);
    return 0;
}
`,
        tests: [{ input: '25\n' }, { input: '-3\n200\n40\n' }, { input: '121\n120\n', name: 'límite' }, { input: '0\n', name: 'cero' }],
        hints: ['La edad es incorrecta si edad < 0 || edad > 120.', 'Dentro del while: el mensaje y otro scanf.'],
        requires: [{ re: '\\bwhile\\s*\\(', msg: 'Usa un bucle while.' }],
      },
    },
    {
      id: 'wh-digitos',
      title: 'Jugar con las cifras',
      theory: md`
## Desmontar un número

Con \`% 10\` sacas la **última cifra** y con \`/ 10\` la **quitas**. Repitiendo eso en un \`while\` recorres todas las cifras de un número, de derecha a izquierda:

\`\`\`c entrada="4072"
#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    int cifras = 0, suma = 0;
    while (n > 0) {
        int ultima = n % 10;
        printf("Cifra: %d\n", ultima);
        suma += ultima;
        cifras++;
        n = n / 10;
    }
    printf("%d cifras que suman %d\n", cifras, suma);
    return 0;
}
\`\`\`

| n | n % 10 | n / 10 |
|---|---|---|
| 4072 | 2 | 407 |
| 407 | 7 | 40 |
| 40 | 0 | 4 |
| 4 | 4 | 0 → para |
`,
      exercise: {
        task: md`
Lee un número entero positivo y escríbelo **al revés** (por ejemplo, 1234 → 4321). Construye el número invertido como un \`int\`: \`invertido = invertido * 10 + cifra\`. Escribe \`Al revés: X\`.

(No hace falta que funcione con números que acaban en 0.)
`,
        starter: md`#include <stdio.h>

int main() {
    int n;
    printf("Número: ");
    scanf("%d", &n);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int n;
    printf("Número: ");
    scanf("%d", &n);
    int invertido = 0;
    while (n > 0) {
        invertido = invertido * 10 + n % 10;
        n /= 10;
    }
    printf("Al revés: %d\n", invertido);
    return 0;
}
`,
        tests: [{ input: '1234\n' }, { input: '7\n' }, { input: '98761\n' }, { input: '12321\n', name: 'capicúa' }],
        hints: ['Empieza con invertido = 0.', 'En cada vuelta: invertido = invertido * 10 + n % 10; y después n /= 10;'],
        requires: [{ re: '\\bwhile\\s*\\(', msg: 'Usa un bucle while.' }],
      },
    },
    {
      id: 'wh-proyecto',
      title: 'Proyecto: adivina el número',
      kind: 'proyecto',
      theory: md`
## El juego clásico

El ordenador piensa un número secreto y tú intentas adivinarlo. Tras cada intento te dice si el secreto es **más alto** o **más bajo**.

Para que el juego sea distinto cada vez se usan números aleatorios (\`rand()\`, lo verás más adelante). En este ejercicio el secreto será **fijo** para poder comprobar tu programa, pero en la zona de **Práctica** tienes el ejemplo "Adivina el número" con secreto aleatorio para jugar de verdad.
`,
      exercise: {
        task: md`
El número secreto es \`#define SECRETO 37\`. Pide intentos con el mensaje \`Intento: \` hasta acertar. Tras cada intento fallido escribe \`Más alto\` o \`Más bajo\`. Al acertar escribe \`¡Correcto! Lo has adivinado en N intentos\`.
`,
        starter: md`#include <stdio.h>
#define SECRETO 37

int main() {
    int intento;

    return 0;
}
`,
        solution: md`#include <stdio.h>
#define SECRETO 37

int main() {
    int intento;
    int intentos = 1;
    printf("Intento: ");
    scanf("%d", &intento);
    while (intento != SECRETO) {
        if (intento < SECRETO) {
            printf("Más alto\n");
        } else {
            printf("Más bajo\n");
        }
        intentos++;
        printf("Intento: ");
        scanf("%d", &intento);
    }
    printf("¡Correcto! Lo has adivinado en %d intentos\n", intentos);
    return 0;
}
`,
        tests: [{ input: '50\n25\n37\n' }, { input: '37\n', name: 'a la primera' }, { input: '1\n2\n100\n40\n36\n38\n37\n' }],
        hints: ['Lee el primer intento antes del while (intento != SECRETO).', 'Dentro del bucle: dice más alto/más bajo, suma 1 a intentos y vuelve a leer.', 'Si empiezas intentos en 1 (por el primer intento), al acertar a la primera dirá 1.'],
        requires: [{ re: '\\bwhile\\s*\\(', msg: 'Usa un bucle while.' }],
      },
    },
    {
      id: 'wh-examen',
      title: 'Examen: while',
      kind: 'examen',
      theory: md`
## ¿Controlas los bucles?

Necesitas un **70 %**.
`,
      quiz: [
        { q: '¿Cuántas veces se escribe "hola"?', code: 'int i = 0;\nwhile (i < 4) {\n    printf("hola\\n");\n    i++;\n}', options: ['3', '4', '5', 'Infinitas'], answer: 1, explain: 'i toma los valores 0, 1, 2 y 3: cuatro vueltas.' },
        { q: '¿Qué le pasa a este bucle?', code: 'int i = 1;\nwhile (i <= 10) {\n    printf("%d\\n", i);\n}', options: ['Escribe del 1 al 10', 'No escribe nada', 'Es infinito: i nunca cambia', 'Da error de compilación'], answer: 2, explain: 'Falta i++: la condición siempre es cierta.' },
        { q: '¿Qué vale `s` al final?', code: 'int s = 0, k = 1;\nwhile (k < 5) {\n    s += k;\n    k += 2;\n}', options: ['4', '9', '10', '6'], answer: 0, explain: 'k vale 1 y 3 dentro del bucle: s = 1 + 3 = 4. Cuando k vale 5 sale.' },
        { q: '¿Cuántas veces entra en el bucle?', code: 'int x = 10;\nwhile (x < 5) {\n    x++;\n}', options: ['Ninguna', 'Una', 'Cinco', 'Infinitas'], answer: 0, explain: 'La condición es falsa desde el principio.' },
        { q: '¿Qué hace `n % 10` y `n / 10` con n = 357?', options: ['35 y 7', '7 y 35', '3 y 57', '57 y 3'], answer: 1, explain: 'n % 10 es la última cifra (7) y n / 10 quita esa cifra (35).' },
      ],
    },
  ],
};
