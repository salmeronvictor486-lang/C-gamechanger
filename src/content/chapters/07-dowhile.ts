import { md, type Chapter } from '../types';

export const doWhile: Chapter = {
  id: 'dowhile',
  title: 'Bucle do-while',
  subtitle: 'Hazlo al menos una vez: menús y validaciones',
  icon: '🔂',
  color: '#c792ea',
  level: 2,
  lessons: [
    {
      id: 'do-basico',
      title: 'do … while',
      theory: md`
## Primero hace, luego pregunta

\`do-while\` es como \`while\`, pero comprueba la condición **al final**. Por eso el bloque se ejecuta **al menos una vez**:

\`\`\`c entrada="3\n-1"
#include <stdio.h>

int main() {
    int n;
    do {
        printf("Escribe un número positivo: ");
        scanf("%d", &n);
    } while (n <= 0);
    printf("Gracias, %d es positivo\n", n);
    return 0;
}
\`\`\`

¡Cuidado con la sintaxis! Después del \`while (condición)\` del final va un **punto y coma**.

| | while | do-while |
|---|---|---|
| Comprueba la condición | antes de cada vuelta | después de cada vuelta |
| Vueltas mínimas | 0 | 1 |
| Ideal para | contar, recorrer | menús, pedir datos |

Compara con la versión con \`while\` de la lección de validar: aquí no hace falta un \`scanf\` antes del bucle.
`,
      exercise: {
        task: md`
Usando \`do-while\`, lee números y ve sumándolos **hasta que el usuario escriba un 0** (el 0 también se "suma", pero no cambia nada). Pide cada número con \`Número: \`. Al final escribe \`Total: X\`.
`,
        starter: md`#include <stdio.h>

int main() {
    int n;
    int total = 0;

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int n;
    int total = 0;
    do {
        printf("Número: ");
        scanf("%d", &n);
        total += n;
    } while (n != 0);
    printf("Total: %d\n", total);
    return 0;
}
`,
        tests: [{ input: '5\n10\n-3\n0\n' }, { input: '0\n', name: 'solo un 0' }, { input: '100\n200\n0\n' }],
        hints: ['do { printf(...); scanf(...); total += n; } while (n != 0);', 'No olvides el ; después del while del final.'],
        requires: [{ re: '\\bdo\\s*\\{', msg: 'Usa un bucle do-while.' }],
      },
    },
    {
      id: 'do-menu',
      title: 'Menús',
      theory: md`
## El patrón del menú

Casi todos los programas de consola tienen un menú que se repite hasta elegir "Salir". \`do-while\` + \`switch\` es la combinación perfecta:

\`\`\`c entrada="1\n2\n0"
#include <stdio.h>

int main() {
    int opcion;
    int contador = 0;
    do {
        printf("\n1) Saludar\n2) Contar\n0) Salir\nOpción: ");
        scanf("%d", &opcion);
        switch (opcion) {
            case 1:
                printf("¡Hola!\n");
                break;
            case 2:
                contador++;
                printf("Contador: %d\n", contador);
                break;
            case 0:
                printf("Adiós\n");
                break;
            default:
                printf("Opción no válida\n");
        }
    } while (opcion != 0);
    return 0;
}
\`\`\`

Ejecútalo en el editor de la derecha y prueba distintas opciones.
`,
      exercise: {
        task: md`
Haz un menú para convertir temperaturas. En cada vuelta escribe:

\`\`\`text
1) Celsius a Fahrenheit
2) Fahrenheit a Celsius
0) Salir
Opción:
\`\`\`

- Opción 1: pide \`Grados: \`, lee un \`double\` y escribe \`= X ºF\` (1 decimal). F = C · 9/5 + 32.
- Opción 2: pide \`Grados: \` y escribe \`= X ºC\` (1 decimal). C = (F − 32) · 5/9.
- Opción 0: escribe \`¡Hasta luego!\` y termina.
- Otra: \`Opción no válida\`.
`,
        starter: md`#include <stdio.h>

int main() {
    int opcion;
    double grados;

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int opcion;
    double grados;
    do {
        printf("1) Celsius a Fahrenheit\n2) Fahrenheit a Celsius\n0) Salir\nOpción: ");
        scanf("%d", &opcion);
        switch (opcion) {
            case 1:
                printf("Grados: ");
                scanf("%lf", &grados);
                printf("= %.1f ºF\n", grados * 9 / 5 + 32);
                break;
            case 2:
                printf("Grados: ");
                scanf("%lf", &grados);
                printf("= %.1f ºC\n", (grados - 32) * 5 / 9);
                break;
            case 0:
                printf("¡Hasta luego!\n");
                break;
            default:
                printf("Opción no válida\n");
        }
    } while (opcion != 0);
    return 0;
}
`,
        tests: [{ input: '1\n100\n0\n' }, { input: '2\n212\n1\n-40\n0\n' }, { input: '7\n0\n', name: 'opción no válida' }, { input: '0\n' }],
        hints: ['Estructura: do { menú; scanf opción; switch (opcion) {...} } while (opcion != 0);', 'Como grados es double, grados * 9 / 5 ya da decimales.'],
        requires: [
          { re: '\\bdo\\s*\\{', msg: 'Usa un bucle do-while.' },
          { re: '\\bswitch\\s*\\(', msg: 'Usa switch para las opciones.' },
        ],
      },
    },
    {
      id: 'do-proyecto',
      title: 'Proyecto: cajero automático',
      kind: 'proyecto',
      theory: md`
## Tu propio cajero

Vas a programar un cajero con un saldo inicial y un menú. Es un buen repaso de todo: variables, \`scanf\`, \`if\`, \`switch\` y \`do-while\`.

Piensa en los casos raros: ¿qué pasa si alguien intenta sacar más dinero del que tiene? ¿Y si ingresa una cantidad negativa?
`,
      exercise: {
        task: md`
Saldo inicial: \`1000.00\`. Menú (se repite hasta elegir 0):

\`\`\`text
1) Consultar 2) Ingresar 3) Retirar 0) Salir
Opción:
\`\`\`

- **1**: escribe \`Saldo: X\` (2 decimales).
- **2**: pide \`Cantidad: \`. Si es mayor que 0, súmala y escribe \`Ingresado. Saldo: X\`; si no, \`Cantidad no válida\`.
- **3**: pide \`Cantidad: \`. Si es mayor que 0 y no supera el saldo, réstala y escribe \`Retirado. Saldo: X\`. Si es mayor que el saldo: \`Saldo insuficiente\`. Si es 0 o negativa: \`Cantidad no válida\`.
- **0**: \`Gracias por usar el cajero\`.
- Otra: \`Opción no válida\`.
`,
        starter: md`#include <stdio.h>

int main() {
    double saldo = 1000;
    double cantidad;
    int opcion;

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    double saldo = 1000;
    double cantidad;
    int opcion;
    do {
        printf("1) Consultar 2) Ingresar 3) Retirar 0) Salir\nOpción: ");
        scanf("%d", &opcion);
        switch (opcion) {
            case 1:
                printf("Saldo: %.2f\n", saldo);
                break;
            case 2:
                printf("Cantidad: ");
                scanf("%lf", &cantidad);
                if (cantidad > 0) {
                    saldo += cantidad;
                    printf("Ingresado. Saldo: %.2f\n", saldo);
                } else {
                    printf("Cantidad no válida\n");
                }
                break;
            case 3:
                printf("Cantidad: ");
                scanf("%lf", &cantidad);
                if (cantidad <= 0) {
                    printf("Cantidad no válida\n");
                } else if (cantidad > saldo) {
                    printf("Saldo insuficiente\n");
                } else {
                    saldo -= cantidad;
                    printf("Retirado. Saldo: %.2f\n", saldo);
                }
                break;
            case 0:
                printf("Gracias por usar el cajero\n");
                break;
            default:
                printf("Opción no válida\n");
        }
    } while (opcion != 0);
    return 0;
}
`,
        tests: [
          { input: '1\n0\n' },
          { input: '2\n250.5\n3\n100\n1\n0\n' },
          { input: '3\n5000\n3\n1000\n1\n0\n', name: 'retirar demasiado y todo' },
          { input: '2\n-50\n3\n0\n9\n0\n', name: 'cantidades no válidas' },
        ],
        hints: ['Es como el menú de la lección anterior, con cuatro casos.', 'En el 3, comprueba primero si la cantidad es <= 0, después si es > saldo, y si no, retira.'],
        requires: [{ re: '\\bdo\\s*\\{', msg: 'Usa un bucle do-while.' }],
      },
    },
    {
      id: 'do-examen',
      title: 'Examen: do-while',
      kind: 'examen',
      theory: md`
## Repaso rápido

Necesitas un **70 %**.
`,
      quiz: [
        { q: '¿Cuántas veces se ejecuta el bloque como mínimo en un do-while?', options: ['0', '1', '2', 'Depende del compilador'], answer: 1, explain: 'La condición se comprueba al final: siempre hay al menos una vuelta.' },
        { q: '¿Qué escribe este código?', code: 'int i = 10;\ndo {\n    printf("%d ", i);\n    i++;\n} while (i < 5);', options: ['Nada', '10', '10 11 12 13 14', 'Bucle infinito'], answer: 1, explain: 'Hace una vuelta (escribe 10), luego comprueba 11 < 5, que es falso, y sale.' },
        { q: '¿Qué falta en `do { x++; } while (x < 10)`?', options: ['Nada', 'Un ; al final', 'Llaves en el while', 'Un break'], answer: 1, explain: 'El do-while termina con punto y coma: while (x < 10);' },
        { q: '¿Para qué es ideal un do-while?', options: ['Recorrer un array', 'Un menú que se muestra hasta elegir salir', 'Contar del 1 al 10', 'Nada, siempre es mejor while'], answer: 1, explain: 'El menú se tiene que mostrar al menos una vez.' },
      ],
    },
  ],
};
