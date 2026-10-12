import { md, type Chapter } from '../types';

export const matrices: Chapter = {
  id: 'matrices',
  title: 'Matrices',
  subtitle: 'Arrays de dos dimensiones: tablas, tableros y mapas',
  icon: '🟩',
  color: '#82aaff',
  level: 2,
  lessons: [
    {
      id: 'mat-intro',
      title: 'Arrays de dos dimensiones',
      theory: md`
## Tablas

Una **matriz** es un array con **filas y columnas**, como una hoja de cálculo o un tablero de ajedrez. Se declara con dos tamaños: \`[filas][columnas]\`:

\`\`\`c
#include <stdio.h>

int main() {
    int m[3][4] = {
        {1, 2, 3, 4},
        {5, 6, 7, 8},
        {9, 10, 11, 12}
    };
    printf("Fila 0, columna 2: %d\n", m[0][2]);
    printf("Fila 2, columna 3: %d\n", m[2][3]);
    m[1][1] = 0;
    printf("Ahora m[1][1] vale %d\n", m[1][1]);
    return 0;
}
\`\`\`

| | col 0 | col 1 | col 2 | col 3 |
|---|---|---|---|---|
| **fila 0** | 1 | 2 | 3 | 4 |
| **fila 1** | 5 | 6 | 7 | 8 |
| **fila 2** | 9 | 10 | 11 | 12 |

- \`m[f][c]\`: primero la **fila**, después la **columna**.
- Las filas van de 0 a F-1 y las columnas de 0 a C-1.
- \`int m[3][4] = {0};\` pone toda la matriz a cero.

## Recorrerla: dos for anidados

\`\`\`c
#include <stdio.h>
#define F 3
#define C 4

int main() {
    int m[F][C];
    for (int f = 0; f < F; f++) {
        for (int c = 0; c < C; c++) {
            m[f][c] = f * 10 + c;
        }
    }
    for (int f = 0; f < F; f++) {
        for (int c = 0; c < C; c++) {
            printf("%4d", m[f][c]);
        }
        printf("\n");
    }
    return 0;
}
\`\`\`
`,
      exercise: {
        task: md`
Crea una matriz \`int tabla[5][5]\` donde cada casilla \`tabla[f][c]\` valga \`(f + 1) * (c + 1)\` (la tabla de multiplicar del 1 al 5). Después escríbela con cada número con \`%3d\` y un salto de línea al final de cada fila.
`,
        starter: md`#include <stdio.h>
#define N 5

int main() {
    int tabla[N][N];

    return 0;
}
`,
        solution: md`#include <stdio.h>
#define N 5

int main() {
    int tabla[N][N];
    for (int f = 0; f < N; f++) {
        for (int c = 0; c < N; c++) {
            tabla[f][c] = (f + 1) * (c + 1);
        }
    }
    for (int f = 0; f < N; f++) {
        for (int c = 0; c < N; c++) {
            printf("%3d", tabla[f][c]);
        }
        printf("\n");
    }
    return 0;
}
`,
        tests: [{}],
        examples: 0,
        hints: ['Primero dos for para rellenar: tabla[f][c] = (f + 1) * (c + 1);', 'Luego otros dos for para escribir, con printf("\\n") al final de cada fila.'],
        requires: [{ re: 'tabla\\s*\\[\\s*\\w+\\s*\\]\\s*\\[\\s*\\w+\\s*\\]\\s*=', msg: 'Guarda los valores en la matriz tabla[f][c].' }],
      },
    },
    {
      id: 'mat-leer',
      title: 'Leer una matriz',
      theory: md`
## Del teclado a la matriz

Se lee igual que se recorre: dos bucles y \`scanf\` con \`&m[f][c]\`. El usuario puede escribir los números en una línea o fila a fila, da igual (scanf se salta los espacios y saltos de línea):

\`\`\`c entrada="2 3\n1 2 3\n4 5 6"
#include <stdio.h>
#define MAX 10

int main() {
    int m[MAX][MAX];
    int filas, cols;
    scanf("%d %d", &filas, &cols);
    for (int f = 0; f < filas; f++) {
        for (int c = 0; c < cols; c++) {
            scanf("%d", &m[f][c]);
        }
    }
    int total = 0;
    for (int f = 0; f < filas; f++) {
        for (int c = 0; c < cols; c++) {
            total += m[f][c];
        }
    }
    printf("Suma de todo: %d\n", total);
    return 0;
}
\`\`\`

Un truco habitual: declarar la matriz con un tamaño **máximo** (\`MAX\`) y usar solo la parte que hace falta.
`,
      exercise: {
        task: md`
Lee el número de filas y columnas (máximo 10 cada uno) y después la matriz. Escribe el **mayor** elemento y su posición, y cuántos elementos son **negativos**:

\`\`\`text
Mayor: X en la fila F, columna C
Negativos: N
\`\`\`

(Filas y columnas numeradas desde 0. Si el mayor se repite, el primero que encuentres recorriendo por filas.)
`,
        starter: md`#include <stdio.h>
#define MAX 10

int main() {
    int m[MAX][MAX];
    int filas, cols;
    scanf("%d %d", &filas, &cols);

    return 0;
}
`,
        solution: md`#include <stdio.h>
#define MAX 10

int main() {
    int m[MAX][MAX];
    int filas, cols;
    scanf("%d %d", &filas, &cols);
    for (int f = 0; f < filas; f++) {
        for (int c = 0; c < cols; c++) {
            scanf("%d", &m[f][c]);
        }
    }
    int mayor = m[0][0], fm = 0, cm = 0, negativos = 0;
    for (int f = 0; f < filas; f++) {
        for (int c = 0; c < cols; c++) {
            if (m[f][c] > mayor) {
                mayor = m[f][c];
                fm = f;
                cm = c;
            }
            if (m[f][c] < 0) {
                negativos++;
            }
        }
    }
    printf("Mayor: %d en la fila %d, columna %d\n", mayor, fm, cm);
    printf("Negativos: %d\n", negativos);
    return 0;
}
`,
        tests: [{ input: '3 3\n1 -2 3\n4 9 -6\n7 8 -9\n' }, { input: '1 1\n-5\n' }, { input: '2 4\n0 0 0 0\n0 0 1 1\n' }],
        hints: ['Lee con dos for anidados y scanf("%d", &m[f][c]);', 'Para el mayor, empieza con m[0][0] y guarda también la fila y la columna cuando encuentres uno mayor.'],
      },
    },
    {
      id: 'mat-filas-cols',
      title: 'Sumar filas y columnas',
      theory: md`
## Totales por fila y por columna

Para la suma de **cada fila**, el bucle de fuera recorre las filas y el acumulador se reinicia en cada fila:

\`\`\`c
#include <stdio.h>
#define F 3
#define C 3

int main() {
    int ventas[F][C] = {{5, 3, 8}, {2, 7, 1}, {6, 6, 4}};
    for (int f = 0; f < F; f++) {
        int sumaFila = 0;                  // se reinicia en cada fila
        for (int c = 0; c < C; c++) {
            sumaFila += ventas[f][c];
        }
        printf("Tienda %d: %d\n", f + 1, sumaFila);
    }
    for (int c = 0; c < C; c++) {          // ahora fuera van las columnas
        int sumaCol = 0;
        for (int f = 0; f < F; f++) {
            sumaCol += ventas[f][c];
        }
        printf("Producto %d: %d\n", c + 1, sumaCol);
    }
    return 0;
}
\`\`\`

Para las **columnas**, se cambia el orden de los bucles: fuera las columnas, dentro las filas.
`,
      exercise: {
        task: md`
Lee una matriz de **4 alumnos × 3 exámenes** (notas enteras). Escribe la tabla con la **media de cada alumno** al final de su fila y, debajo, la **media de cada examen**. Formato:

\`\`\`text
Alumno 1:  7  8  6 | 7.00
...
Medias:   x.xx x.xx x.xx
\`\`\`

- Cada nota con \`%3d\`, después \` | \` y la media con \`%.2f\`.
- La última línea: \`Medias:\` y cada media con \` %.2f\` (un espacio delante de cada una).
`,
        starter: md`#include <stdio.h>
#define ALUMNOS 4
#define EXAMENES 3

int main() {
    int notas[ALUMNOS][EXAMENES];
    for (int a = 0; a < ALUMNOS; a++) {
        for (int e = 0; e < EXAMENES; e++) {
            scanf("%d", &notas[a][e]);
        }
    }

    return 0;
}
`,
        solution: md`#include <stdio.h>
#define ALUMNOS 4
#define EXAMENES 3

int main() {
    int notas[ALUMNOS][EXAMENES];
    for (int a = 0; a < ALUMNOS; a++) {
        for (int e = 0; e < EXAMENES; e++) {
            scanf("%d", &notas[a][e]);
        }
    }
    for (int a = 0; a < ALUMNOS; a++) {
        int suma = 0;
        printf("Alumno %d:", a + 1);
        for (int e = 0; e < EXAMENES; e++) {
            printf("%3d", notas[a][e]);
            suma += notas[a][e];
        }
        printf(" | %.2f\n", (double)suma / EXAMENES);
    }
    printf("Medias:");
    for (int e = 0; e < EXAMENES; e++) {
        int suma = 0;
        for (int a = 0; a < ALUMNOS; a++) {
            suma += notas[a][e];
        }
        printf(" %.2f", (double)suma / ALUMNOS);
    }
    printf("\n");
    return 0;
}
`,
        tests: [{ input: '7 8 6\n5 5 4\n10 9 9\n3 6 2\n' }, { input: '5 5 5\n5 5 5\n5 5 5\n5 5 5\n' }],
        hints: ['Para cada alumno: escribe "Alumno N:", luego sus notas con %3d sumándolas, y al final " | %.2f\\n".', 'Para las medias de los exámenes, el bucle de fuera recorre los exámenes.', 'No olvides convertir a double antes de dividir.'],
      },
    },
    {
      id: 'mat-diagonal',
      title: 'Diagonales y traspuesta',
      theory: md`
## Matrices cuadradas

En una matriz **cuadrada** (mismas filas que columnas) hay dos diagonales:

- **Principal**: las casillas donde \`f == c\`: \`m[0][0]\`, \`m[1][1]\`, \`m[2][2]\`…
- **Secundaria**: donde \`f + c == N - 1\`: \`m[0][N-1]\`, \`m[1][N-2]\`…

\`\`\`c
#include <stdio.h>
#define N 3

int main() {
    int m[N][N] = {{1, 2, 3}, {4, 5, 6}, {7, 8, 9}};
    int principal = 0, secundaria = 0;
    for (int i = 0; i < N; i++) {
        principal += m[i][i];
        secundaria += m[i][N - 1 - i];
    }
    printf("Diagonal principal: %d\n", principal);
    printf("Diagonal secundaria: %d\n", secundaria);

    // traspuesta: las filas pasan a ser columnas
    for (int f = 0; f < N; f++) {
        for (int c = 0; c < N; c++) {
            printf("%d ", m[c][f]);
        }
        printf("\n");
    }
    return 0;
}
\`\`\`

La **traspuesta** de una matriz se obtiene cambiando filas por columnas: lo que estaba en \`m[f][c]\` pasa a \`t[c][f]\`.
`,
      exercise: {
        task: md`
Lee \`n\` (máximo 10) y una matriz \`n × n\`. Comprueba si es **simétrica** (igual a su traspuesta: \`m[f][c] == m[c][f]\` para todas las casillas). Escribe \`Es simétrica\` o \`No es simétrica\`, y en la línea siguiente \`Traza: X\` (la suma de la diagonal principal).
`,
        starter: md`#include <stdio.h>
#define MAX 10

int main() {
    int m[MAX][MAX];
    int n;
    scanf("%d", &n);
    for (int f = 0; f < n; f++) {
        for (int c = 0; c < n; c++) {
            scanf("%d", &m[f][c]);
        }
    }

    return 0;
}
`,
        solution: md`#include <stdio.h>
#define MAX 10

int main() {
    int m[MAX][MAX];
    int n;
    scanf("%d", &n);
    for (int f = 0; f < n; f++) {
        for (int c = 0; c < n; c++) {
            scanf("%d", &m[f][c]);
        }
    }
    int simetrica = 1;
    for (int f = 0; f < n; f++) {
        for (int c = 0; c < n; c++) {
            if (m[f][c] != m[c][f]) {
                simetrica = 0;
            }
        }
    }
    int traza = 0;
    for (int i = 0; i < n; i++) {
        traza += m[i][i];
    }
    printf("%s\n", simetrica ? "Es simétrica" : "No es simétrica");
    printf("Traza: %d\n", traza);
    return 0;
}
`,
        tests: [{ input: '3\n1 2 3\n2 5 6\n3 6 9\n' }, { input: '3\n1 2 3\n4 5 6\n7 8 9\n' }, { input: '1\n7\n' }, { input: '2\n0 1\n1 0\n' }],
        hints: ['Usa una bandera simetrica = 1 y ponla a 0 si encuentras m[f][c] != m[c][f].', 'La traza es la suma de m[i][i].'],
      },
    },
    {
      id: 'mat-suma',
      title: 'Operar con matrices',
      theory: md`
## Sumar y multiplicar matrices

**Sumar** dos matrices del mismo tamaño es sumar casilla a casilla: \`r[f][c] = a[f][c] + b[f][c]\`.

**Multiplicar** es más curioso: la casilla \`r[f][c]\` es la suma de multiplicar la **fila f** de \`a\` por la **columna c** de \`b\`, elemento a elemento. Hacen falta **tres** bucles:

\`\`\`c
#include <stdio.h>
#define N 2

int main() {
    int a[N][N] = {{1, 2}, {3, 4}};
    int b[N][N] = {{5, 6}, {7, 8}};
    int r[N][N] = {0};
    for (int f = 0; f < N; f++) {
        for (int c = 0; c < N; c++) {
            for (int k = 0; k < N; k++) {
                r[f][c] += a[f][k] * b[k][c];
            }
        }
    }
    for (int f = 0; f < N; f++) {
        for (int c = 0; c < N; c++) printf("%4d", r[f][c]);
        printf("\n");
    }
    return 0;
}
\`\`\`

Las matrices se usan muchísimo en gráficos 3D, inteligencia artificial y videojuegos (¡mover y girar objetos es multiplicar matrices!).
`,
      exercise: {
        task: md`
Lee dos matrices de **3×3** (primero toda la \`a\`, después toda la \`b\`) y escribe su **suma** y después su **producto**, con cada número con \`%5d\`:

\`\`\`text
Suma:
...
Producto:
...
\`\`\`
`,
        starter: md`#include <stdio.h>
#define N 3

int main() {
    int a[N][N], b[N][N];

    return 0;
}
`,
        solution: md`#include <stdio.h>
#define N 3

int main() {
    int a[N][N], b[N][N];
    for (int f = 0; f < N; f++)
        for (int c = 0; c < N; c++)
            scanf("%d", &a[f][c]);
    for (int f = 0; f < N; f++)
        for (int c = 0; c < N; c++)
            scanf("%d", &b[f][c]);
    printf("Suma:\n");
    for (int f = 0; f < N; f++) {
        for (int c = 0; c < N; c++) {
            printf("%5d", a[f][c] + b[f][c]);
        }
        printf("\n");
    }
    printf("Producto:\n");
    for (int f = 0; f < N; f++) {
        for (int c = 0; c < N; c++) {
            int s = 0;
            for (int k = 0; k < N; k++) {
                s += a[f][k] * b[k][c];
            }
            printf("%5d", s);
        }
        printf("\n");
    }
    return 0;
}
`,
        tests: [{ input: '1 2 3\n4 5 6\n7 8 9\n1 0 0\n0 1 0\n0 0 1\n', name: 'por la identidad' }, { input: '1 2 3\n4 5 6\n7 8 9\n9 8 7\n6 5 4\n3 2 1\n' }],
        hints: ['Lee primero a con dos for y luego b con otros dos.', 'Para el producto: tres for; el de dentro acumula a[f][k] * b[k][c].'],
      },
    },
    {
      id: 'mat-proyecto',
      title: 'Proyecto: tres en raya',
      kind: 'proyecto',
      theory: md`
## ¿Quién ha ganado?

Un tablero de tres en raya es una matriz de \`char\` de 3×3 con \`'X'\`, \`'O'\` o \`'.'\` (vacía). Para saber si alguien ha ganado hay que comprobar:

- Las **3 filas**: \`t[f][0] == t[f][1] && t[f][1] == t[f][2]\` (y que no sea \`'.'\`).
- Las **3 columnas**.
- Las **2 diagonales**.

Leer una matriz de \`char\` se hace con \`" %c"\` (con el espacio, para saltarse los saltos de línea):

\`\`\`c entrada="XOX\nOXO\nOOX"
#include <stdio.h>

int main() {
    char t[3][3];
    for (int f = 0; f < 3; f++)
        for (int c = 0; c < 3; c++)
            scanf(" %c", &t[f][c]);
    for (int f = 0; f < 3; f++) {
        for (int c = 0; c < 3; c++) printf("%c ", t[f][c]);
        printf("\n");
    }
    return 0;
}
\`\`\`
`,
      exercise: {
        task: md`
Lee un tablero de 3 en raya (3 líneas de 3 caracteres: \`X\`, \`O\` o \`.\`). Escribe:

- \`Gana X\` o \`Gana O\` si hay tres en raya (en los tableros de prueba, como mucho gana uno).
- Si nadie gana y no quedan casillas vacías: \`Empate\`.
- Si nadie gana y quedan casillas libres: \`La partida sigue\`.
`,
        starter: md`#include <stdio.h>

int main() {
    char t[3][3];
    for (int f = 0; f < 3; f++)
        for (int c = 0; c < 3; c++)
            scanf(" %c", &t[f][c]);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    char t[3][3];
    for (int f = 0; f < 3; f++)
        for (int c = 0; c < 3; c++)
            scanf(" %c", &t[f][c]);
    char ganador = '.';
    for (int i = 0; i < 3; i++) {
        if (t[i][0] != '.' && t[i][0] == t[i][1] && t[i][1] == t[i][2]) ganador = t[i][0];
        if (t[0][i] != '.' && t[0][i] == t[1][i] && t[1][i] == t[2][i]) ganador = t[0][i];
    }
    if (t[1][1] != '.' && t[0][0] == t[1][1] && t[1][1] == t[2][2]) ganador = t[1][1];
    if (t[1][1] != '.' && t[0][2] == t[1][1] && t[1][1] == t[2][0]) ganador = t[1][1];
    int libres = 0;
    for (int f = 0; f < 3; f++)
        for (int c = 0; c < 3; c++)
            if (t[f][c] == '.') libres++;
    if (ganador != '.') {
        printf("Gana %c\n", ganador);
    } else if (libres == 0) {
        printf("Empate\n");
    } else {
        printf("La partida sigue\n");
    }
    return 0;
}
`,
        tests: [
          { input: 'XXX\nO.O\n.O.\n', name: 'fila' },
          { input: 'XO.\nXO.\n.OX\n', name: 'columna' },
          { input: 'X.O\n.XO\nO.X\n', name: 'diagonal' },
          { input: 'XOO\n.OX\nOX.\n', name: 'diagonal secundaria' },
          { input: 'XOX\nXOO\nOXX\n', name: 'empate' },
          { input: 'X..\n.O.\n...\n', name: 'sigue' },
        ],
        hints: [
          'Guarda el ganador en una variable char ganador = \'.\'; y cámbiala si encuentras tres iguales.',
          'Con un for de i = 0 a 2 compruebas a la vez la fila i y la columna i.',
          'Cuenta las casillas \'.\' para distinguir empate de partida sin terminar.',
        ],
      },
    },
    {
      id: 'mat-examen',
      title: 'Examen: matrices',
      kind: 'examen',
      theory: md`
## Examen de matrices

Necesitas un **70 %**.
`,
      quiz: [
        { q: 'En `int m[4][6];`, ¿cuántos elementos hay?', options: ['10', '24', '20', '35'], answer: 1, explain: '4 filas × 6 columnas = 24.' },
        { q: '¿Cuál es el último elemento de `int m[4][6];`?', options: ['`m[4][6]`', '`m[3][5]`', '`m[6][4]`', '`m[5][3]`'], answer: 1, explain: 'Filas de 0 a 3 y columnas de 0 a 5.' },
        { q: '¿Qué casillas forman la diagonal principal?', options: ['Las que tienen f + c == N', 'Las que tienen f == c', 'La primera fila', 'La última columna'], answer: 1, explain: 'm[0][0], m[1][1], m[2][2]…' },
        { q: '¿Qué escribe?', code: 'int m[2][3] = {{1, 2, 3}, {4, 5, 6}};\nprintf("%d", m[1][0] + m[0][2]);', options: ['5', '7', '6', '3'], answer: 1, explain: 'm[1][0] = 4 y m[0][2] = 3: 7.' },
        { q: 'Para sumar cada COLUMNA, ¿qué bucle va fuera?', options: ['El de las filas', 'El de las columnas', 'Da igual', 'Hace falta un tercer bucle'], answer: 1, explain: 'Fuera las columnas; dentro, recorres las filas de esa columna.' },
      ],
    },
  ],
};
