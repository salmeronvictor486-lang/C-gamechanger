import { md, type Chapter } from '../types';

export const arrays: Chapter = {
  id: 'arrays',
  title: 'Arrays',
  subtitle: 'Listas de datos: recorrer, buscar, contar y ordenar',
  icon: '📚',
  color: '#3ddc97',
  level: 2,
  lessons: [
    {
      id: 'arr-intro',
      title: '¿Qué es un array?',
      theory: md`
## Muchas cajas con un solo nombre

Si tienes que guardar las notas de 30 alumnos, no vas a crear 30 variables. Un **array** (vector, arreglo) es una fila de cajas **del mismo tipo** con un único nombre. Cada caja se identifica por su **posición** (índice) entre corchetes:

\`\`\`c
#include <stdio.h>

int main() {
    int notas[5] = {7, 4, 9, 6, 8};
    printf("Primera nota: %d\n", notas[0]);
    printf("Tercera nota: %d\n", notas[2]);
    printf("Última nota:  %d\n", notas[4]);
    notas[1] = 5;                       // cambiar una nota
    printf("Segunda nota corregida: %d\n", notas[1]);
    return 0;
}
\`\`\`

| Índice | 0 | 1 | 2 | 3 | 4 |
|---|---|---|---|---|---|
| \`notas\` | 7 | 4 | 9 | 6 | 8 |

> ⚠️ **Los índices empiezan en 0.** Un array de 5 elementos va de \`notas[0]\` a \`notas[4]\`. \`notas[5]\` **no existe**: es el error más frecuente con arrays.

## Formas de crear un array

\`\`\`c norun
int a[5];                    // 5 enteros sin valor (¡basura!)
int b[5] = {1, 2, 3};        // los que faltan se ponen a 0: {1, 2, 3, 0, 0}
int c[100] = {0};            // truco: todo a cero
int d[] = {4, 8, 15, 16};    // el tamaño (4) lo cuenta C
double precios[3] = {1.5, 2.25, 9.99};
#define N 10
int e[N];                    // con una constante (lo más recomendable)
\`\`\`
`,
      exercise: {
        task: md`
Crea el array \`int temperaturas[7] = {18, 21, 25, 19, 23, 27, 22};\` (de lunes a domingo). Después:

1. Escribe \`Lunes: 18\` y \`Domingo: 22\` usando el array.
2. El miércoles se midió mal: cámbialo a \`24\`.
3. Escribe \`Miércoles corregido: 24\`.
4. Escribe \`Diferencia sábado-lunes: 9\` (calculada).
`,
        starter: md`#include <stdio.h>

int main() {
    int temperaturas[7] = {18, 21, 25, 19, 23, 27, 22};

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int temperaturas[7] = {18, 21, 25, 19, 23, 27, 22};
    printf("Lunes: %d\n", temperaturas[0]);
    printf("Domingo: %d\n", temperaturas[6]);
    temperaturas[2] = 24;
    printf("Miércoles corregido: %d\n", temperaturas[2]);
    printf("Diferencia sábado-lunes: %d\n", temperaturas[5] - temperaturas[0]);
    return 0;
}
`,
        tests: [{ output: 'Lunes: 18\nDomingo: 22\nMiércoles corregido: 24\nDiferencia sábado-lunes: 9\n' }],
        hints: ['El lunes es temperaturas[0] y el domingo temperaturas[6].', 'El miércoles es la posición 2: temperaturas[2] = 24;', 'El sábado es temperaturas[5].'],
        requires: [{ re: 'temperaturas\\s*\\[\\s*2\\s*\\]\\s*=', msg: 'Cambia el miércoles con temperaturas[2] = 24;' }],
      },
    },
    {
      id: 'arr-recorrer',
      title: 'Recorrer un array con for',
      theory: md`
## El for y los arrays, mejores amigos

Para hacer algo con **todos** los elementos se usa un \`for\` cuyo contador recorre los índices de 0 a N-1:

\`\`\`c
#include <stdio.h>
#define N 5

int main() {
    int v[N] = {3, 1, 4, 1, 5};
    for (int i = 0; i < N; i++) {
        printf("v[%d] = %d\n", i, v[i]);
    }
    return 0;
}
\`\`\`

Fíjate en la condición: \`i < N\` (no \`<=\`).

## Leer un array desde el teclado

Igual, con \`scanf\` dentro del bucle (con \`&\`, porque \`v[i]\` es un \`int\` normal):

\`\`\`c entrada="10 20 30 40 50"
#include <stdio.h>
#define N 5

int main() {
    int v[N];
    printf("Escribe %d números: ", N);
    for (int i = 0; i < N; i++) {
        scanf("%d", &v[i]);
    }
    printf("Del último al primero: ");
    for (int i = N - 1; i >= 0; i--) {
        printf("%d ", v[i]);
    }
    printf("\n");
    return 0;
}
\`\`\`
`,
      exercise: {
        task: md`
Lee primero un número \`n\` (como mucho 100) y después \`n\` números enteros. Guárdalos en un array y escribe:

- En una línea, los números **en orden inverso**, separados por un espacio.
- En otra, solo los que están en **posiciones pares** (0, 2, 4…), también separados por un espacio.

Cada línea termina con un espacio y \`\n\` (o sea: \`printf("%d ", ...)\` y después \`printf("\n")\`).
`,
        starter: md`#include <stdio.h>
#define MAX 100

int main() {
    int v[MAX];
    int n;
    scanf("%d", &n);

    return 0;
}
`,
        solution: md`#include <stdio.h>
#define MAX 100

int main() {
    int v[MAX];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &v[i]);
    }
    for (int i = n - 1; i >= 0; i--) {
        printf("%d ", v[i]);
    }
    printf("\n");
    for (int i = 0; i < n; i += 2) {
        printf("%d ", v[i]);
    }
    printf("\n");
    return 0;
}
`,
        tests: [{ input: '5\n1 2 3 4 5\n' }, { input: '1\n42\n' }, { input: '6\n9 8 7 6 5 4\n' }],
        hints: ['Lee los n números con un for y scanf("%d", &v[i]);', 'Para el orden inverso, el for empieza en n - 1 y baja hasta 0.', 'Para las posiciones pares: for (int i = 0; i < n; i += 2)'],
        requires: [{ re: '&\\s*v\\s*\\[', msg: 'Lee cada número en el array con scanf("%d", &v[i]).' }],
      },
    },
    {
      id: 'arr-suma-media',
      title: 'Suma y media',
      theory: md`
## Recorrer y acumular

Con un acumulador recorres el array y sumas todo:

\`\`\`c
#include <stdio.h>
#define N 6

int main() {
    double gastos[N] = {12.5, 8, 30.25, 4.75, 15, 9.5};
    double total = 0;
    for (int i = 0; i < N; i++) {
        total += gastos[i];
    }
    printf("Total: %.2f\n", total);
    printf("Media: %.2f\n", total / N);
    return 0;
}
\`\`\`

Si además quieres saber cuántos cumplen algo, combina con un contador y un \`if\` dentro del bucle.
`,
      exercise: {
        task: md`
Lee \`n\` (máximo 50) y después \`n\` notas decimales. Escribe la **media** (2 decimales), cuántas notas están **por encima de la media** y cuántos **aprobados** (nota ≥ 5) hay:

\`\`\`text
Media: M
Por encima de la media: X
Aprobados: Y
\`\`\`

Pista importante: para saber cuáles superan la media, primero tienes que **calcular la media** (un bucle) y después **volver a recorrer** las notas (otro bucle). ¡Por eso hacen falta arrays!
`,
        starter: md`#include <stdio.h>
#define MAX 50

int main() {
    double notas[MAX];
    int n;
    scanf("%d", &n);

    return 0;
}
`,
        solution: md`#include <stdio.h>
#define MAX 50

int main() {
    double notas[MAX];
    int n;
    scanf("%d", &n);
    double suma = 0;
    for (int i = 0; i < n; i++) {
        scanf("%lf", &notas[i]);
        suma += notas[i];
    }
    double media = suma / n;
    int encima = 0, aprobados = 0;
    for (int i = 0; i < n; i++) {
        if (notas[i] > media) {
            encima++;
        }
        if (notas[i] >= 5) {
            aprobados++;
        }
    }
    printf("Media: %.2f\n", media);
    printf("Por encima de la media: %d\n", encima);
    printf("Aprobados: %d\n", aprobados);
    return 0;
}
`,
        tests: [{ input: '5\n7 4.5 9 6 3\n' }, { input: '1\n8\n' }, { input: '4\n5 5 5 5\n', name: 'todas iguales' }, { input: '6\n10 9.5 2 1.5 4.9 5\n' }],
        hints: ['Primer bucle: leer y sumar. Luego media = suma / n.', 'Segundo bucle: contar las que superan la media y los aprobados.'],
      },
    },
    {
      id: 'arr-max-min',
      title: 'Máximo y mínimo',
      theory: md`
## El mejor y el peor

Para buscar el mayor valor de un array:
1. Supón que el mayor es el **primero**.
2. Recorre el resto: si alguno es más grande, ese pasa a ser el mayor.

Si además guardas **en qué posición** está, sabrás de quién es:

\`\`\`c
#include <stdio.h>
#define N 6

int main() {
    int puntos[N] = {340, 512, 128, 980, 460, 975};
    int max = puntos[0], posMax = 0;
    for (int i = 1; i < N; i++) {
        if (puntos[i] > max) {
            max = puntos[i];
            posMax = i;
        }
    }
    printf("Récord: %d puntos (jugador %d)\n", max, posMax + 1);
    return 0;
}
\`\`\`

> ⚠️ No empieces con \`max = 0\`: si todos los valores son negativos, el resultado sería 0, que ni siquiera está en el array.
`,
      exercise: {
        task: md`
Lee 7 temperaturas (enteros, de lunes a domingo). Escribe la **máxima** y la **mínima** con el día en que se dieron (el día como número del 1 al 7). Si hay empate, vale el **primer** día:

\`\`\`text
Máxima: X (día D)
Mínima: Y (día E)
\`\`\`
`,
        starter: md`#include <stdio.h>
#define DIAS 7

int main() {
    int t[DIAS];
    for (int i = 0; i < DIAS; i++) {
        scanf("%d", &t[i]);
    }

    return 0;
}
`,
        solution: md`#include <stdio.h>
#define DIAS 7

int main() {
    int t[DIAS];
    for (int i = 0; i < DIAS; i++) {
        scanf("%d", &t[i]);
    }
    int max = t[0], min = t[0];
    int diaMax = 0, diaMin = 0;
    for (int i = 1; i < DIAS; i++) {
        if (t[i] > max) {
            max = t[i];
            diaMax = i;
        }
        if (t[i] < min) {
            min = t[i];
            diaMin = i;
        }
    }
    printf("Máxima: %d (día %d)\n", max, diaMax + 1);
    printf("Mínima: %d (día %d)\n", min, diaMin + 1);
    return 0;
}
`,
        tests: [{ input: '18 21 25 19 23 27 22\n' }, { input: '-3 -1 -7 -2 -7 0 -1\n', name: 'negativas' }, { input: '20 20 20 20 20 20 20\n', name: 'todas iguales' }],
        hints: ['Empieza con max = t[0] y min = t[0], y sus días a 0.', 'Usa > y < estrictos para quedarte con el primer día en caso de empate.', 'Al escribir el día, súmale 1 (los índices empiezan en 0).'],
      },
    },
    {
      id: 'arr-buscar',
      title: 'Buscar un elemento',
      theory: md`
## Búsqueda lineal

Para saber si un valor está en un array, lo recorres comparando. En cuanto lo encuentras, guardas la posición y paras con \`break\`. Si terminas sin encontrarlo, no está:

\`\`\`c entrada="15"
#include <stdio.h>
#define N 8

int main() {
    int v[N] = {4, 8, 15, 16, 23, 42, 7, 1};
    int buscado;
    printf("¿Qué número buscas? ");
    scanf("%d", &buscado);
    int pos = -1;                 // -1 = "no encontrado"
    for (int i = 0; i < N; i++) {
        if (v[i] == buscado) {
            pos = i;
            break;
        }
    }
    if (pos == -1) {
        printf("No está\n");
    } else {
        printf("Está en la posición %d\n", pos);
    }
    return 0;
}
\`\`\`

Usar \`-1\` como "no encontrado" es un truco muy común: ninguna posición real es negativa.
`,
      exercise: {
        task: md`
Lee 10 números enteros y después un número a buscar. Escribe:

- Si no aparece: \`X no aparece\`
- Si aparece: \`X aparece N veces. Primera posición: P, última: U\`
`,
        starter: md`#include <stdio.h>
#define N 10

int main() {
    int v[N];
    int x;
    for (int i = 0; i < N; i++) {
        scanf("%d", &v[i]);
    }
    scanf("%d", &x);

    return 0;
}
`,
        solution: md`#include <stdio.h>
#define N 10

int main() {
    int v[N];
    int x;
    for (int i = 0; i < N; i++) {
        scanf("%d", &v[i]);
    }
    scanf("%d", &x);
    int veces = 0, primera = -1, ultima = -1;
    for (int i = 0; i < N; i++) {
        if (v[i] == x) {
            if (primera == -1) {
                primera = i;
            }
            ultima = i;
            veces++;
        }
    }
    if (veces == 0) {
        printf("%d no aparece\n", x);
    } else {
        printf("%d aparece %d veces. Primera posición: %d, última: %d\n", x, veces, primera, ultima);
    }
    return 0;
}
`,
        tests: [
          { input: '3 7 3 1 9 3 0 2 8 5\n3\n' },
          { input: '3 7 3 1 9 3 0 2 8 5\n4\n', name: 'no está' },
          { input: '1 2 3 4 5 6 7 8 9 10\n10\n', name: 'al final' },
          { input: '5 5 5 5 5 5 5 5 5 5\n5\n' },
        ],
        hints: ['Aquí no puedes parar en el primero: hay que contar todos. Recorre el array entero.', 'La primera vez que lo encuentras (primera == -1) guardas primera; la última posición la actualizas siempre.'],
      },
    },
    {
      id: 'arr-contar',
      title: 'Contar con un array',
      theory: md`
## El array como tabla de contadores

Un truco muy potente: usar el **valor** de un dato como **índice** de un array de contadores. Por ejemplo, para contar cuántas veces sale cada cara de un dado, un array \`cuenta[7]\` donde \`cuenta[3]\` es cuántas veces salió el 3:

\`\`\`c
#include <stdio.h>
#include <stdlib.h>

int main() {
    int cuenta[7] = {0};       // usamos de la 1 a la 6
    srand(1);
    for (int i = 0; i < 600; i++) {
        int dado = rand() % 6 + 1;
        cuenta[dado]++;        // ¡una línea!
    }
    for (int cara = 1; cara <= 6; cara++) {
        printf("%d: %d veces\n", cara, cuenta[cara]);
    }
    return 0;
}
\`\`\`

Esto se llama un **histograma** de frecuencias.
`,
      exercise: {
        task: md`
Lee notas **enteras** de 0 a 10 hasta que se escriba \`-1\`. Cuenta cuántas veces sale cada nota usando un array de 11 contadores y escribe un histograma solo con las notas que aparecen al menos una vez, con un \`*\` por cada aparición:

\`\`\`text
5: ***
7: *
\`\`\`
`,
        starter: md`#include <stdio.h>

int main() {
    int cuenta[11] = {0};
    int nota;

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int cuenta[11] = {0};
    int nota;
    scanf("%d", &nota);
    while (nota != -1) {
        cuenta[nota]++;
        scanf("%d", &nota);
    }
    for (int i = 0; i <= 10; i++) {
        if (cuenta[i] > 0) {
            printf("%d: ", i);
            for (int k = 0; k < cuenta[i]; k++) {
                printf("*");
            }
            printf("\n");
        }
    }
    return 0;
}
`,
        tests: [{ input: '5 7 5 5 10 0 -1\n' }, { input: '-1\n', name: 'sin notas' }, { input: '8 8 8 8 8 8 9 -1\n' }],
        hints: ['Lee hasta -1 con un while y haz cuenta[nota]++;', 'Después recorre cuenta de 0 a 10; si cuenta[i] > 0, escribe la nota y un bucle de asteriscos.'],
        requires: [{ re: 'cuenta\\s*\\[\\s*nota\\s*\\]\\s*\\+\\+|\\+\\+\\s*cuenta\\s*\\[\\s*nota\\s*\\]|cuenta\\s*\\[\\s*nota\\s*\\]\\s*\\+=', msg: 'Usa la nota como índice: cuenta[nota]++;' }],
      },
    },
    {
      id: 'arr-ordenar',
      title: 'Ordenar: el método de la burbuja',
      theory: md`
## Burbuja

Hay muchas formas de ordenar. La más sencilla de entender es el **método de la burbuja**: recorres el array comparando cada elemento con el siguiente y, si están desordenados, los **intercambias**. Tras la primera pasada, el mayor ha "subido" al final como una burbuja. Repites hasta que todo está en orden.

\`\`\`c
#include <stdio.h>
#define N 6

int main() {
    int v[N] = {29, 10, 14, 37, 13, 5};
    for (int pasada = 0; pasada < N - 1; pasada++) {
        for (int j = 0; j < N - 1 - pasada; j++) {
            if (v[j] > v[j + 1]) {
                int aux = v[j];       // intercambio con una variable auxiliar
                v[j] = v[j + 1];
                v[j + 1] = aux;
            }
        }
    }
    for (int i = 0; i < N; i++) printf("%d ", v[i]);
    printf("\n");
    return 0;
}
\`\`\`

- \`j < N - 1 - pasada\`: el \`j + 1\` no puede pasarse del array, y los últimos ya están colocados.
- Para **intercambiar** dos variables hace falta una tercera (\`aux\`): si haces \`v[j] = v[j+1]; v[j+1] = v[j];\` pierdes un valor.
- Para ordenar de **mayor a menor**, cambia \`>\` por \`<\`.
`,
      exercise: {
        task: md`
Lee \`n\` (máximo 100) y \`n\` números. Ordénalos de **mayor a menor** con el método de la burbuja y escríbelos separados por espacios (con un espacio después de cada uno). En la línea siguiente escribe la **mediana**: el elemento del centro (posición \`n / 2\` del array ordenado).
`,
        starter: md`#include <stdio.h>
#define MAX 100

int main() {
    int v[MAX];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &v[i]);
    }

    return 0;
}
`,
        solution: md`#include <stdio.h>
#define MAX 100

int main() {
    int v[MAX];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &v[i]);
    }
    for (int p = 0; p < n - 1; p++) {
        for (int j = 0; j < n - 1 - p; j++) {
            if (v[j] < v[j + 1]) {
                int aux = v[j];
                v[j] = v[j + 1];
                v[j + 1] = aux;
            }
        }
    }
    for (int i = 0; i < n; i++) {
        printf("%d ", v[i]);
    }
    printf("\nMediana: %d\n", v[n / 2]);
    return 0;
}
`,
        tests: [{ input: '5\n3 9 1 7 5\n' }, { input: '1\n4\n' }, { input: '8\n5 -2 9 9 0 13 -7 4\n' }, { input: '6\n6 5 4 3 2 1\n', name: 'ya ordenado' }],
        hints: ['Copia la burbuja de la teoría y cambia > por < para ordenar al revés.', 'La mediana es v[n / 2] después de ordenar.'],
        requires: [{ re: 'for[\\s\\S]*for', msg: 'Usa el método de la burbuja (dos bucles for anidados).' }],
        forbids: [{ re: '\\bqsort\\s*\\(', msg: 'Hazlo con la burbuja, sin qsort.' }],
      },
    },
    {
      id: 'arr-errores',
      title: 'Salirse del array',
      theory: md`
## El error número uno

C **no comprueba** si un índice está dentro del array. Si escribes \`v[10]\` en un array de 10 elementos, el programa lee o escribe en la memoria de al lado, que puede ser otra variable… Los resultados son impredecibles: valores raros, el programa se cierra de golpe ("violación de segmento") o, peor, parece que funciona.

En esta web **sí** lo comprobamos y te avisamos con la línea exacta. Ejecuta este programa con el fallo típico (\`<=\` en vez de \`<\`):

\`\`\`c error
#include <stdio.h>

int main() {
    int dias[7] = {1, 2, 3, 4, 5, 6, 7};
    int suma = 0;
    for (int i = 0; i <= 7; i++) {
        suma += dias[i];
    }
    printf("%d\n", suma);
    return 0;
}
\`\`\`

## Cómo evitarlo

- Usa **constantes** para el tamaño (\`#define N 7\`) y \`i < N\` en los bucles.
- Cuando leas datos, comprueba que no te pasas del máximo.
- Si usas \`v[i + 1]\` dentro del bucle, el bucle tiene que acabar una vuelta antes (\`i < N - 1\`).
- Ojo con \`v[i - 1]\` cuando \`i\` vale 0.
`,
      exercise: {
        task: md`
Este programa calcula, para cada par de días seguidos, cuánto ha cambiado la temperatura. Tiene **dos errores** que hacen que se salga del array. Encuéntralos y arréglalos. La salida correcta empieza así:

\`\`\`text
Día 2: +3
Día 3: +4
\`\`\`
`,
        starter: md`#include <stdio.h>
#define N 7

int main() {
    int t[N] = {18, 21, 25, 19, 23, 27, 22};
    for (int i = 0; i < N; i++) {
        int cambio = t[i] - t[i - 1];
        if (cambio >= 0) {
            printf("Día %d: +%d\n", i + 1, cambio);
        } else {
            printf("Día %d: %d\n", i + 1, cambio);
        }
    }
    int sumaFinde = 0;
    for (int i = 5; i <= N; i++) {
        sumaFinde += t[i];
    }
    printf("Media del finde: %.1f\n", sumaFinde / 2.0);
    return 0;
}
`,
        solution: md`#include <stdio.h>
#define N 7

int main() {
    int t[N] = {18, 21, 25, 19, 23, 27, 22};
    for (int i = 1; i < N; i++) {
        int cambio = t[i] - t[i - 1];
        if (cambio >= 0) {
            printf("Día %d: +%d\n", i + 1, cambio);
        } else {
            printf("Día %d: %d\n", i + 1, cambio);
        }
    }
    int sumaFinde = 0;
    for (int i = 5; i < N; i++) {
        sumaFinde += t[i];
    }
    printf("Media del finde: %.1f\n", sumaFinde / 2.0);
    return 0;
}
`,
        tests: [{}],
        examples: 0,
        hints: ['Ejecuta el programa: el mensaje de error te dice en qué línea se sale.', 'En el primer bucle, t[i - 1] con i = 0 es t[-1]. ¿Desde qué día tiene sentido calcular el cambio?', 'En el segundo bucle, i <= N llega hasta t[7].'],
      },
    },
    {
      id: 'arr-proyecto',
      title: 'Proyecto: estadísticas de la clase',
      kind: 'proyecto',
      theory: md`
## Todo junto

Un programa que analiza las notas de una clase usa todo lo del capítulo: leer un array, sumar, buscar máximo y mínimo, contar y ordenar.

Organiza el código en partes (lectura, cálculos, salida) y comenta cada una. Cuando un programa crece, el orden te salva.
`,
      exercise: {
        task: md`
Lee \`n\` (1 a 40) y \`n\` notas enteras de 0 a 10. Escribe:

\`\`\`text
Media: M          (con 2 decimales)
Máxima: X
Mínima: Y
Aprobados: A (P%)     (P = porcentaje de aprobados con 1 decimal)
Ordenadas: ...    (de menor a mayor, separadas por espacios)
\`\`\`

La línea de \`Ordenadas:\` lleva un espacio antes de cada nota: \`Ordenadas: 3 5 7\`.
`,
        starter: md`#include <stdio.h>
#define MAX 40

int main() {
    int notas[MAX];
    int n;
    scanf("%d", &n);

    return 0;
}
`,
        solution: md`#include <stdio.h>
#define MAX 40

int main() {
    int notas[MAX];
    int n;
    scanf("%d", &n);

    // lectura y suma
    int suma = 0;
    for (int i = 0; i < n; i++) {
        scanf("%d", &notas[i]);
        suma += notas[i];
    }

    // máximo, mínimo y aprobados
    int max = notas[0], min = notas[0], aprobados = 0;
    for (int i = 0; i < n; i++) {
        if (notas[i] > max) max = notas[i];
        if (notas[i] < min) min = notas[i];
        if (notas[i] >= 5) aprobados++;
    }

    // ordenar (burbuja)
    for (int p = 0; p < n - 1; p++) {
        for (int j = 0; j < n - 1 - p; j++) {
            if (notas[j] > notas[j + 1]) {
                int aux = notas[j];
                notas[j] = notas[j + 1];
                notas[j + 1] = aux;
            }
        }
    }

    printf("Media: %.2f\n", (double)suma / n);
    printf("Máxima: %d\n", max);
    printf("Mínima: %d\n", min);
    printf("Aprobados: %d (%.1f%%)\n", aprobados, aprobados * 100.0 / n);
    printf("Ordenadas:");
    for (int i = 0; i < n; i++) {
        printf(" %d", notas[i]);
    }
    printf("\n");
    return 0;
}
`,
        tests: [{ input: '6\n7 3 9 5 4 10\n' }, { input: '1\n6\n' }, { input: '3\n0 0 0\n' }, { input: '10\n5 6 7 8 9 10 1 2 3 4\n' }],
        hints: ['Haz cada parte por separado y pruébala con ▶ Ejecutar antes de seguir.', 'El porcentaje: aprobados * 100.0 / n (con 100.0 para que tenga decimales).', 'Para escribir el símbolo % dentro del printf: %%.'],
      },
    },
    {
      id: 'arr-examen',
      title: 'Examen: arrays',
      kind: 'examen',
      theory: md`
## Examen de arrays

Necesitas un **70 %**.
`,
      quiz: [
        { q: 'Con `int v[10];`, ¿cuál es el último elemento válido?', options: ['`v[10]`', '`v[9]`', '`v[11]`', '`v[0]`'], answer: 1, explain: 'Los índices van de 0 a 9.' },
        { q: '¿Qué contiene `int a[5] = {1, 2};`?', options: ['{1, 2} y basura', '{1, 2, 0, 0, 0}', '{1, 2, 1, 2, 1}', 'Da error'], answer: 1, explain: 'Si das algunos valores, el resto se pone a 0.' },
        { q: '¿Qué escribe?', code: 'int v[] = {5, 10, 15, 20};\nint s = 0;\nfor (int i = 1; i < 4; i += 2)\n    s += v[i];\nprintf("%d", s);', options: ['50', '30', '20', '15'], answer: 1, explain: 'Suma v[1] y v[3]: 10 + 20 = 30.' },
        { q: '¿Cuántos elementos tiene `int d[] = {4, 8, 15, 16, 23, 42};`?', options: ['5', '6', '7', 'No se sabe'], answer: 1, explain: 'C cuenta los valores de la lista: 6.' },
        { q: '¿Cuál es el error?', code: 'int v[5];\nfor (int i = 1; i <= 5; i++)\n    v[i] = 0;', options: ['Ninguno', 'Empieza en 1 (no pone v[0]) y escribe en v[5], que no existe', 'Falta el &', 'v no tiene valores'], answer: 1, explain: 'Debería ser for (int i = 0; i < 5; i++).' },
        { q: 'Para intercambiar `a` y `b`, ¿qué es correcto?', options: ['`a = b; b = a;`', '`aux = a; a = b; b = aux;`', '`a = a + b;`', '`swap(a, b);`'], answer: 1, explain: 'Hace falta una variable auxiliar para no perder un valor.' },
      ],
    },
  ],
};
