import { md, type Chapter } from '../types';

export const condicionales: Chapter = {
  id: 'condicionales',
  title: 'Condicionales',
  subtitle: 'Tomar decisiones: if, else, operadores lógicos y switch',
  icon: '🔀',
  color: '#ff5c8a',
  level: 1,
  lessons: [
    {
      id: 'if-basico',
      title: 'La sentencia if',
      theory: md`
## Si pasa algo, haz esto

Con \`if\` (si, en inglés) el programa **decide**: ejecuta un bloque de código **solo si** se cumple una condición.

\`\`\`c entrada="-4"
#include <stdio.h>

int main() {
    int temperatura;
    printf("Temperatura: ");
    scanf("%d", &temperatura);
    if (temperatura < 0) {
        printf("¡Cuidado, hiela!\n");
    }
    printf("Fin del informe\n");
    return 0;
}
\`\`\`

La condición va **entre paréntesis** y el bloque, **entre llaves**. "Fin del informe" sale siempre, porque está fuera del \`if\`.

## Operadores de comparación

| Operador | Significa |
|---|---|
| \`==\` | igual que |
| \`!=\` | distinto de |
| \`<\` / \`>\` | menor / mayor que |
| \`<=\` / \`>=\` | menor o igual / mayor o igual |

> ⚠️ **Comparar es \`==\`** (dos iguales). Un solo \`=\` **asigna**: \`if (x = 5)\` no compara, ¡cambia \`x\` a 5! El editor te avisará si lo haces.

> ⚠️ No pongas \`;\` justo después del paréntesis: \`if (x > 0);\` termina el if ahí y el bloque de debajo se ejecuta **siempre**.

> 💡 Para C, una condición es un número: **0 es falso** y cualquier otro valor es verdadero. \`x > 3\` vale 1 si es cierto y 0 si no.
`,
      exercise: {
        task: md`
Lee la nota de un examen (entero). Si es **5 o más**, escribe \`¡Aprobado!\`. Después, **siempre**, escribe \`Nota: \` seguido de la nota.
`,
        starter: md`#include <stdio.h>

int main() {
    int nota;
    printf("Nota: ");
    scanf("%d", &nota);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int nota;
    printf("Nota: ");
    scanf("%d", &nota);
    if (nota >= 5) {
        printf("¡Aprobado!\n");
    }
    printf("Nota: %d\n", nota);
    return 0;
}
`,
        tests: [{ input: '7\n', name: 'aprobado' }, { input: '3\n', name: 'suspenso' }, { input: '5\n', name: 'justo un 5' }, { input: '10\n' }],
        hints: ['if (nota >= 5) { ... }', 'El printf de la nota va fuera del if, para que salga siempre.'],
        requires: [{ re: '\\bif\\s*\\(', msg: 'Usa un if.' }],
      },
    },
    {
      id: 'if-else',
      title: 'if … else',
      theory: md`
## Si no, haz lo otro

\`else\` (si no) añade un bloque que se ejecuta cuando la condición **no** se cumple. Siempre se ejecuta **uno de los dos**, nunca ambos:

\`\`\`c entrada="16"
#include <stdio.h>

int main() {
    int edad;
    printf("Edad: ");
    scanf("%d", &edad);
    if (edad >= 18) {
        printf("Puedes votar\n");
    } else {
        printf("Te faltan %d años para votar\n", 18 - edad);
    }
    return 0;
}
\`\`\`

## Par o impar

Un clásico: un número es par si el resto de dividirlo entre 2 es 0.

\`\`\`c entrada="7"
#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    if (n % 2 == 0) {
        printf("%d es par\n", n);
    } else {
        printf("%d es impar\n", n);
    }
    return 0;
}
\`\`\`

> 💡 Si el bloque tiene **una sola instrucción**, las llaves son opcionales. Pero al empezar, **ponlas siempre**: evitan muchos errores al añadir líneas después.
`,
      exercise: {
        task: md`
Lee el precio de un artículo (\`double\`) y el dinero que tienes (\`double\`). Si te llega, escribe \`Puedes comprarlo. Te sobran X euros\`; si no, \`Te faltan X euros\` (con 2 decimales).
`,
        starter: md`#include <stdio.h>

int main() {
    double precio, dinero;
    printf("Precio: ");
    scanf("%lf", &precio);
    printf("Dinero: ");
    scanf("%lf", &dinero);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    double precio, dinero;
    printf("Precio: ");
    scanf("%lf", &precio);
    printf("Dinero: ");
    scanf("%lf", &dinero);
    if (dinero >= precio) {
        printf("Puedes comprarlo. Te sobran %.2f euros\n", dinero - precio);
    } else {
        printf("Te faltan %.2f euros\n", precio - dinero);
    }
    return 0;
}
`,
        tests: [{ input: '20\n50\n' }, { input: '59.99\n40\n' }, { input: '10\n10\n', name: 'justo' }],
        hints: ['Si dinero >= precio, te llega.', 'Te sobran dinero - precio; te faltan precio - dinero.'],
        requires: [{ re: '\\belse\\b', msg: 'Usa if y else.' }],
      },
    },
    {
      id: 'if-elseif',
      title: 'Varias opciones: else if',
      theory: md`
## Una escalera de condiciones

Cuando hay **más de dos** casos, se encadenan con \`else if\`. C las comprueba **de arriba abajo** y ejecuta **solo la primera** que se cumpla:

\`\`\`c entrada="23"
#include <stdio.h>

int main() {
    int temp;
    printf("Temperatura: ");
    scanf("%d", &temp);
    if (temp < 10) {
        printf("Hace frío 🥶\n");
    } else if (temp < 20) {
        printf("Se está bien\n");
    } else if (temp < 30) {
        printf("Hace calor\n");
    } else {
        printf("¡Hace muchísimo calor! 🥵\n");
    }
    return 0;
}
\`\`\`

Fíjate: en el segundo caso no hace falta poner \`temp >= 10 && temp < 20\`. Si hemos llegado ahí, es que **no** era menor que 10.

> 💡 El \`else\` final recoge "todo lo demás". Es opcional.
`,
      exercise: {
        task: md`
Lee una nota (entero de 0 a 10) y escribe su calificación:

| Nota | Calificación |
|---|---|
| menos de 5 | \`Suspenso\` |
| 5 | \`Suficiente\` |
| 6 | \`Bien\` |
| 7 u 8 | \`Notable\` |
| 9 o 10 | \`Sobresaliente\` |
`,
        starter: md`#include <stdio.h>

int main() {
    int nota;
    printf("Nota: ");
    scanf("%d", &nota);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int nota;
    printf("Nota: ");
    scanf("%d", &nota);
    if (nota < 5) {
        printf("Suspenso\n");
    } else if (nota == 5) {
        printf("Suficiente\n");
    } else if (nota == 6) {
        printf("Bien\n");
    } else if (nota <= 8) {
        printf("Notable\n");
    } else {
        printf("Sobresaliente\n");
    }
    return 0;
}
`,
        tests: [{ input: '3\n' }, { input: '5\n' }, { input: '6\n' }, { input: '7\n' }, { input: '8\n' }, { input: '9\n' }, { input: '10\n' }, { input: '0\n' }],
        hints: ['Empieza por el caso más bajo: if (nota < 5) ...', 'Encadena con else if (nota == 5), else if (nota == 6), else if (nota <= 8) y un else final.'],
        requires: [{ re: 'else\\s+if', msg: 'Usa else if para encadenar los casos.' }],
      },
    },
    {
      id: 'if-logicos',
      title: 'Y, o, no: && || !',
      theory: md`
## Combinar condiciones

| Operador | Nombre | Es cierto si… |
|---|---|---|
| \`a && b\` | Y | **las dos** son ciertas |
| \`a \|\| b\` | O | **al menos una** es cierta |
| \`!a\` | NO | \`a\` es falsa |

\`\`\`c entrada="15"
#include <stdio.h>

int main() {
    int edad;
    printf("Edad: ");
    scanf("%d", &edad);
    if (edad >= 13 && edad <= 19) {
        printf("Eres adolescente\n");
    }
    if (edad < 5 || edad >= 65) {
        printf("Entrada gratis\n");
    } else {
        printf("Entrada: 8 euros\n");
    }
    return 0;
}
\`\`\`

> ⚠️ En C **no** se puede escribir \`13 <= edad <= 19\` como en matemáticas: compila, pero hace otra cosa. Siempre: \`edad >= 13 && edad <= 19\`.

> 💡 \`&&\` y \`||\` son "perezosos": si con la primera parte ya se sabe el resultado, la segunda ni se evalúa. Así \`if (b != 0 && a / b > 2)\` nunca divide entre cero.

## Año bisiesto

Un año es bisiesto si es divisible entre 4, **excepto** los divisibles entre 100, **salvo** que también lo sean entre 400. En C:

\`\`\`c norun
(anio % 4 == 0 && anio % 100 != 0) || anio % 400 == 0
\`\`\`
`,
      exercise: {
        task: md`
Lee un año y escribe \`2024 es bisiesto\` o \`2023 no es bisiesto\` (con el año que sea). Usa la regla de la teoría.
`,
        starter: md`#include <stdio.h>

int main() {
    int anio;
    printf("Año: ");
    scanf("%d", &anio);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int anio;
    printf("Año: ");
    scanf("%d", &anio);
    if ((anio % 4 == 0 && anio % 100 != 0) || anio % 400 == 0) {
        printf("%d es bisiesto\n", anio);
    } else {
        printf("%d no es bisiesto\n", anio);
    }
    return 0;
}
`,
        tests: [{ input: '2024\n' }, { input: '2023\n' }, { input: '1900\n', name: 'divisible entre 100' }, { input: '2000\n', name: 'divisible entre 400' }, { input: '2100\n' }],
        hints: ['La condición completa: (anio % 4 == 0 && anio % 100 != 0) || anio % 400 == 0', 'Escribe el año con %d en los dos mensajes.'],
        requires: [{ re: '&&|\\|\\|', msg: 'Combina las condiciones con && y ||.' }],
      },
    },
    {
      id: 'if-anidados',
      title: 'Condicionales anidados',
      theory: md`
## Un if dentro de otro

Dentro de un bloque puede haber otro \`if\`. Sirve cuando una decisión depende de otra:

\`\`\`c entrada="1 25"
#include <stdio.h>

int main() {
    int socio, edad;
    printf("¿Eres socio? (1 = sí, 0 = no) y edad: ");
    scanf("%d %d", &socio, &edad);
    if (socio) {
        if (edad < 18) {
            printf("Socio joven: 50%% de descuento\n");
        } else {
            printf("Socio: 20%% de descuento\n");
        }
    } else {
        printf("Sin descuento. ¿Quieres hacerte socio?\n");
    }
    return 0;
}
\`\`\`

Usa la **sangría** (los espacios al principio de la línea) para ver qué está dentro de qué. A C le da igual, pero a las personas no.

## El mayor de tres números

Un ejercicio clásico. Hay varias formas; una es suponer que el primero es el mayor e ir comprobando:

\`\`\`c entrada="4 9 2"
#include <stdio.h>

int main() {
    int a, b, c;
    scanf("%d %d %d", &a, &b, &c);
    int mayor = a;
    if (b > mayor) {
        mayor = b;
    }
    if (c > mayor) {
        mayor = c;
    }
    printf("El mayor es %d\n", mayor);
    return 0;
}
\`\`\`
`,
      exercise: {
        task: md`
Lee tres números enteros distintos y escríbelos **ordenados de menor a mayor**, separados por espacios.
`,
        starter: md`#include <stdio.h>

int main() {
    int a, b, c;
    printf("Tres números: ");
    scanf("%d %d %d", &a, &b, &c);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int a, b, c;
    printf("Tres números: ");
    scanf("%d %d %d", &a, &b, &c);
    if (a < b) {
        if (b < c) {
            printf("%d %d %d\n", a, b, c);
        } else if (a < c) {
            printf("%d %d %d\n", a, c, b);
        } else {
            printf("%d %d %d\n", c, a, b);
        }
    } else {
        if (a < c) {
            printf("%d %d %d\n", b, a, c);
        } else if (b < c) {
            printf("%d %d %d\n", b, c, a);
        } else {
            printf("%d %d %d\n", c, b, a);
        }
    }
    return 0;
}
`,
        tests: [{ input: '1 2 3\n' }, { input: '1 3 2\n' }, { input: '2 1 3\n' }, { input: '2 3 1\n' }, { input: '3 1 2\n' }, { input: '3 2 1\n' }, { input: '-5 10 0\n' }],
        hints: [
          'Hay 6 órdenes posibles. Empieza comparando a y b, y dentro de cada caso compara con c.',
          'Otra forma: usa una variable auxiliar para intercambiar valores: si a > b, intercámbialos; si b > c, intercámbialos; si a > b, otra vez.',
          'Para intercambiar a y b: int aux = a; a = b; b = aux;',
        ],
      },
    },
    {
      id: 'if-switch',
      title: 'La sentencia switch',
      theory: md`
## Elegir entre muchos valores

Cuando comparas **una variable** con **muchos valores concretos**, \`switch\` es más claro que una escalera de \`else if\`:

\`\`\`c entrada="3"
#include <stdio.h>

int main() {
    int dia;
    printf("Día de la semana (1-7): ");
    scanf("%d", &dia);
    switch (dia) {
        case 1:
            printf("Lunes\n");
            break;
        case 2:
            printf("Martes\n");
            break;
        case 3:
            printf("Miércoles\n");
            break;
        case 6:
        case 7:
            printf("¡Fin de semana!\n");
            break;
        default:
            printf("Otro día laborable\n");
    }
    return 0;
}
\`\`\`

- Cada \`case\` lleva un **valor fijo** y dos puntos \`:\`.
- **\`break\`** sale del switch. ¡No lo olvides! Sin \`break\`, el programa **sigue** ejecutando el siguiente \`case\` (eso se usa a propósito para agrupar casos, como el 6 y el 7).
- \`default\` recoge cualquier otro valor (como el \`else\`).

> ⚠️ \`switch\` solo funciona con **enteros y caracteres**, no con decimales ni con textos.
`,
      exercise: {
        task: md`
Lee un número de mes (1-12) y escribe cuántos días tiene: \`31 días\`, \`30 días\` o \`28 días\` (febrero). Si el número no es un mes, escribe \`Mes no válido\`. Usa \`switch\` agrupando los meses que tienen los mismos días.

(Tienen 31 días: 1, 3, 5, 7, 8, 10 y 12. Tienen 30: 4, 6, 9 y 11.)
`,
        starter: md`#include <stdio.h>

int main() {
    int mes;
    printf("Mes: ");
    scanf("%d", &mes);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int mes;
    printf("Mes: ");
    scanf("%d", &mes);
    switch (mes) {
        case 1:
        case 3:
        case 5:
        case 7:
        case 8:
        case 10:
        case 12:
            printf("31 días\n");
            break;
        case 4:
        case 6:
        case 9:
        case 11:
            printf("30 días\n");
            break;
        case 2:
            printf("28 días\n");
            break;
        default:
            printf("Mes no válido\n");
    }
    return 0;
}
`,
        tests: [{ input: '1\n' }, { input: '2\n' }, { input: '4\n' }, { input: '8\n' }, { input: '11\n' }, { input: '12\n' }, { input: '13\n', name: 'mes que no existe' }, { input: '0\n' }],
        hints: ['Pon varios case seguidos sin break para agruparlos: case 1: case 3: ... printf(...); break;', 'El default recoge los números que no son meses.'],
        requires: [{ re: '\\bswitch\\s*\\(', msg: 'Usa switch.' }],
      },
    },
    {
      id: 'if-switch-char',
      title: 'switch con caracteres',
      theory: md`
## Menús y operadores

\`switch\` también funciona con \`char\`, porque por dentro son números. Así se hacen menús de letras o calculadoras:

\`\`\`c entrada="b"
#include <stdio.h>

int main() {
    char opcion;
    printf("a) Jugar  b) Opciones  c) Salir: ");
    scanf(" %c", &opcion);
    switch (opcion) {
        case 'a':
        case 'A':
            printf("¡A jugar!\n");
            break;
        case 'b':
        case 'B':
            printf("Abriendo opciones...\n");
            break;
        case 'c':
        case 'C':
            printf("Adiós\n");
            break;
        default:
            printf("Opción desconocida\n");
    }
    return 0;
}
\`\`\`

Los valores de los \`case\` van entre **comillas simples**.
`,
      exercise: {
        task: md`
Haz una calculadora: lee una operación escrita como \`número operador número\` (por ejemplo \`7 * 3\`) con \`scanf("%lf %c %lf", ...)\` y escribe el resultado con 2 decimales: \`= 21.00\`.

- Operadores: \`+\`, \`-\`, \`*\` y \`/\`.
- Si es una división entre 0, escribe \`Error: división entre cero\`.
- Si el operador es otro, escribe \`Operador no válido\`.
`,
        starter: md`#include <stdio.h>

int main() {
    double a, b;
    char op;
    printf("Operación: ");
    scanf("%lf %c %lf", &a, &op, &b);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    double a, b;
    char op;
    printf("Operación: ");
    scanf("%lf %c %lf", &a, &op, &b);
    switch (op) {
        case '+':
            printf("= %.2f\n", a + b);
            break;
        case '-':
            printf("= %.2f\n", a - b);
            break;
        case '*':
            printf("= %.2f\n", a * b);
            break;
        case '/':
            if (b == 0) {
                printf("Error: división entre cero\n");
            } else {
                printf("= %.2f\n", a / b);
            }
            break;
        default:
            printf("Operador no válido\n");
    }
    return 0;
}
`,
        tests: [{ input: '7 * 3\n' }, { input: '10 / 4\n' }, { input: '2.5 + 1.25\n' }, { input: '3 - 8\n' }, { input: '5 / 0\n', name: 'división entre 0' }, { input: '2 ^ 3\n', name: 'operador raro' }],
        hints: ["switch (op) { case '+': ... break; ... }", "En el case '/' pon un if que compruebe si b == 0."],
        requires: [{ re: '\\bswitch\\s*\\(', msg: 'Usa switch con el operador.' }],
      },
    },
    {
      id: 'if-ternario',
      title: 'El operador ternario',
      theory: md`
## Un if en una línea

El operador \`? :\` elige entre dos valores según una condición:

\`\`\`c norun
resultado = condición ? valor_si_es_cierta : valor_si_es_falsa;
\`\`\`

\`\`\`c entrada="-8 3"
#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    int mayor = (a > b) ? a : b;
    int absoluto = (a < 0) ? -a : a;
    printf("Mayor: %d\n", mayor);
    printf("Valor absoluto de %d: %d\n", a, absoluto);
    printf("%d es %s\n", b, (b % 2 == 0) ? "par" : "impar");
    return 0;
}
\`\`\`

Es muy cómodo dentro de un \`printf\`. Pero no abuses: si la condición es complicada, un \`if\` normal se lee mejor.
`,
      exercise: {
        task: md`
Lee un número entero \`n\` y, usando el **operador ternario**, escribe:

- \`n es positivo\`, \`n es negativo\` o \`n es cero\` (puedes anidar dos ternarios o combinar con if).
- En otra línea, \`Hay N elemento\` si n es 1, o \`Hay N elementos\` en otro caso (la "s" la decide un ternario).
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
    printf("%d es %s\n", n, n > 0 ? "positivo" : (n < 0 ? "negativo" : "cero"));
    printf("Hay %d elemento%s\n", n, n == 1 ? "" : "s");
    return 0;
}
`,
        tests: [{ input: '5\n' }, { input: '1\n' }, { input: '0\n' }, { input: '-2\n' }],
        hints: ['printf("%d es %s\\n", n, n > 0 ? "positivo" : "...");', 'Para la "s": printf("Hay %d elemento%s\\n", n, n == 1 ? "" : "s");'],
        requires: [{ re: '\\?[^:;]*:', msg: 'Usa el operador ternario ? :' }],
      },
    },
    {
      id: 'if-proyecto',
      title: 'Proyecto: piedra, papel o tijera',
      kind: 'proyecto',
      theory: md`
## ¡A jugar!

Dos jugadores eligen piedra (\`R\`, de *rock*), papel (\`P\`) o tijera (\`T\`):

- La piedra gana a la tijera.
- La tijera gana al papel.
- El papel gana a la piedra.
- Si eligen lo mismo, empate.

Piensa antes de programar: ¿cuántas combinaciones hay? ¿Cómo las agrupas para escribir pocas condiciones? Una pista: primero comprueba el **empate**, luego las **3 formas** en que gana el jugador 1, y si no es nada de eso… gana el 2.
`,
      exercise: {
        task: md`
Lee la jugada del jugador 1 y la del jugador 2 (letras \`R\`, \`P\` o \`T\`, en mayúscula) y escribe \`Empate\`, \`Gana el jugador 1\` o \`Gana el jugador 2\`. Si alguna letra no es válida, escribe \`Jugada no válida\`.
`,
        starter: md`#include <stdio.h>

int main() {
    char j1, j2;
    printf("Jugador 1 (R/P/T): ");
    scanf(" %c", &j1);
    printf("Jugador 2 (R/P/T): ");
    scanf(" %c", &j2);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    char j1, j2;
    printf("Jugador 1 (R/P/T): ");
    scanf(" %c", &j1);
    printf("Jugador 2 (R/P/T): ");
    scanf(" %c", &j2);
    int valido1 = j1 == 'R' || j1 == 'P' || j1 == 'T';
    int valido2 = j2 == 'R' || j2 == 'P' || j2 == 'T';
    if (!valido1 || !valido2) {
        printf("Jugada no válida\n");
    } else if (j1 == j2) {
        printf("Empate\n");
    } else if ((j1 == 'R' && j2 == 'T') || (j1 == 'T' && j2 == 'P') || (j1 == 'P' && j2 == 'R')) {
        printf("Gana el jugador 1\n");
    } else {
        printf("Gana el jugador 2\n");
    }
    return 0;
}
`,
        tests: [
          { input: 'R\nT\n' },
          { input: 'T\nR\n' },
          { input: 'P\nP\n' },
          { input: 'P\nR\n' },
          { input: 'R\nP\n' },
          { input: 'T\nP\n' },
          { input: 'P\nT\n' },
          { input: 'X\nR\n', name: 'letra no válida' },
          { input: 'R\nQ\n', name: 'letra no válida' },
        ],
        hints: [
          'Primero comprueba que las dos letras son R, P o T. Si no, "Jugada no válida".',
          'Después, si j1 == j2 es empate.',
          "Gana el 1 si: (j1 == 'R' && j2 == 'T') || (j1 == 'T' && j2 == 'P') || (j1 == 'P' && j2 == 'R'). Si no, gana el 2.",
        ],
      },
    },
    {
      id: 'if-examen',
      title: 'Examen: condicionales',
      kind: 'examen',
      theory: md`
## Examen final del nivel 1

¡Si apruebas, has terminado el nivel principiante! Necesitas un **70 %**.
`,
      quiz: [
        { q: '¿Qué escribe este código?', code: 'int x = 5;\nif (x > 3) printf("A");\nelse printf("B");\nprintf("C");', options: ['A', 'AC', 'BC', 'ABC'], answer: 1, explain: 'x > 3 es cierto: se escribe A. La C está fuera del if/else y sale siempre.' },
        { q: '¿Qué pasa con `if (x = 0)`?', options: ['Compara x con 0', 'Asigna 0 a x y la condición es falsa', 'Da error de compilación', 'Asigna 0 y la condición es cierta'], answer: 1, explain: 'Un solo = asigna. El valor de la asignación es 0, que es falso.' },
        { q: '¿Cómo se escribe "x está entre 1 y 10 (incluidos)"?', options: ['`1 <= x <= 10`', '`x >= 1 && x <= 10`', '`x >= 1 || x <= 10`', '`x > 1 && x < 10`'], answer: 1, explain: 'Hacen falta las dos comparaciones unidas con && (y).' },
        { q: '¿Qué escribe este switch si `n` vale 2?', code: 'switch (n) {\n  case 1: printf("uno ");\n  case 2: printf("dos ");\n  case 3: printf("tres ");\n  default: printf("fin");\n}', options: ['dos', 'dos tres', 'dos tres fin', 'uno dos tres fin'], answer: 2, explain: 'Sin break, al entrar en el case 2 se siguen ejecutando todos los de debajo.' },
        { q: '¿Cuánto vale `(7 > 3) + (2 == 2) + (5 != 5)`?', options: ['0', '1', '2', '3'], answer: 2, explain: 'Cada comparación vale 1 si es cierta y 0 si no: 1 + 1 + 0 = 2.' },
        { q: '¿Qué valor guarda `m = (a < b) ? a : b;`?', options: ['El mayor de a y b', 'El menor de a y b', 'Siempre a', 'a < b'], answer: 1, explain: 'Si a < b, guarda a (el menor); si no, guarda b.' },
        { q: '¿Con qué tipos NO funciona switch?', options: ['int', 'char', 'double', 'long'], answer: 2, explain: 'switch solo funciona con enteros y caracteres.' },
      ],
    },
  ],
};
