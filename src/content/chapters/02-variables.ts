import { md, type Chapter } from '../types';

export const variables: Chapter = {
  id: 'variables',
  title: 'Variables y tipos',
  subtitle: 'Guardar datos: int, float, double, char y constantes',
  icon: '📦',
  color: '#3ddc97',
  level: 1,
  lessons: [
    {
      id: 'var-int',
      title: 'Variables enteras (int)',
      theory: md`
## Cajas con nombre

Una **variable** es como una **caja con nombre** donde el programa guarda un dato para usarlo después. En C, antes de usar una variable hay que **declararla**: decir de qué **tipo** es y cómo se llama.

\`\`\`c
#include <stdio.h>

int main() {
    int edad;        // declaro una caja llamada edad que guarda enteros
    edad = 15;       // guardo el 15 dentro (asignación)
    printf("Tengo %d años\n", edad);

    int puntos = 100;   // declarar y dar valor a la vez
    puntos = 250;       // cambiar el valor: el 100 se pierde
    printf("Puntos: %d\n", puntos);
    return 0;
}
\`\`\`

- \`int\` (de *integer*, entero) guarda números **sin decimales**: \`-3\`, \`0\`, \`42\`, \`2024\`…
- El signo \`=\` **no es "igual"** como en matemáticas: significa **"guarda en"**. Lo de la derecha se guarda en la variable de la izquierda.

## Escribir variables con printf: \`%d\`

Para mostrar el valor de una variable, dentro del texto de \`printf\` pones un **hueco** \`%d\` y, después del texto, separada por una coma, la variable que va en ese hueco:

\`\`\`c
#include <stdio.h>

int main() {
    int goles = 3;
    printf("Hemos marcado %d goles\n", goles);
    printf("%d\n", goles);           // solo el número
    return 0;
}
\`\`\`

> 💡 **Nombres de variables:** pueden tener letras, números y \`_\`, pero no pueden empezar por número ni llevar tildes, ñ o espacios. \`nota1\`, \`total_puntos\` y \`numeroAlumnos\` valen; \`1nota\`, \`año\` o \`mi nota\` no. Además, C distingue mayúsculas: \`Edad\` y \`edad\` son variables distintas.

> ⚠️ Si usas una variable **sin haberle dado valor**, su contenido es "basura" (lo que hubiera en la memoria). Aquí te avisaremos con un error; en un ordenador normal, el programa simplemente haría cosas raras.
`,
      exercise: {
        task: md`
Declara una variable \`int\` llamada \`anio\` con el valor \`2024\` y otra llamada \`nacimiento\` con el valor \`2010\`. Después escribe exactamente:

\`\`\`salida
Estamos en 2024
Nací en 2010
\`\`\`

Usa \`%d\` para que los números salgan de las variables (no los escribas a mano en el texto).
`,
        starter: md`#include <stdio.h>

int main() {
    // Declara aquí tus variables

    printf("Estamos en ...\n");
    printf("Nací en ...\n");
    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int anio = 2024;
    int nacimiento = 2010;
    printf("Estamos en %d\n", anio);
    printf("Nací en %d\n", nacimiento);
    return 0;
}
`,
        tests: [{ output: 'Estamos en 2024\nNací en 2010\n' }],
        hints: [
          'Una variable se declara así: int anio = 2024;',
          'En el texto, cambia los números por %d y añade la variable después de una coma: printf("Estamos en %d\\n", anio);',
        ],
        requires: [
          { re: '\\bint\\s+anio\\b', msg: 'Declara la variable anio con int.' },
          { re: '%d', msg: 'Usa %d para escribir las variables.' },
          { re: 'printf\\s*\\([^;]*,\\s*anio', msg: 'Escribe el año con printf usando la variable anio.' },
        ],
      },
    },
    {
      id: 'var-varias',
      title: 'Varias variables en un printf',
      theory: md`
## Varios huecos

Un mismo \`printf\` puede tener **varios** \`%d\`. Se rellenan **en orden** con las variables que pongas detrás, separadas por comas:

\`\`\`c
#include <stdio.h>

int main() {
    int dia = 12, mes = 10, anio = 2024;   // varias variables en una línea
    printf("Hoy es %d/%d/%d\n", dia, mes, anio);
    return 0;
}
\`\`\`

El primer \`%d\` se cambia por \`dia\`, el segundo por \`mes\` y el tercero por \`anio\`.

## Operar dentro del printf

Detrás de la coma no tiene por qué ir una variable sola: puede ir **una cuenta**. También puedes guardar el resultado en otra variable:

\`\`\`c
#include <stdio.h>

int main() {
    int manzanas = 7;
    int peras = 5;
    int total = manzanas + peras;
    printf("%d + %d = %d\n", manzanas, peras, total);
    printf("El doble son %d frutas\n", total * 2);
    return 0;
}
\`\`\`

> ⚠️ Tiene que haber **tantos valores como huecos**. Si pones dos \`%d\` y solo una variable, el compilador te avisará.
`,
      exercise: {
        task: md`
En una tienda hay \`camisetas = 12\` y \`pantalones = 8\`. Crea esas dos variables y escribe:

\`\`\`salida
Camisetas: 12
Pantalones: 8
Total de prendas: 20
\`\`\`

El total tiene que **calcularlo el programa** con una suma.
`,
        starter: md`#include <stdio.h>

int main() {
    int camisetas = 12;

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int camisetas = 12;
    int pantalones = 8;
    int total = camisetas + pantalones;
    printf("Camisetas: %d\n", camisetas);
    printf("Pantalones: %d\n", pantalones);
    printf("Total de prendas: %d\n", total);
    return 0;
}
`,
        tests: [{ output: 'Camisetas: 12\nPantalones: 8\nTotal de prendas: 20\n' }],
        hints: ['Declara int pantalones = 8; debajo de camisetas.', 'Puedes calcular el total así: int total = camisetas + pantalones;'],
        requires: [{ re: 'camisetas\\s*\\+\\s*pantalones|pantalones\\s*\\+\\s*camisetas', msg: 'El total tiene que salir de sumar las variables camisetas y pantalones.' }],
      },
    },
    {
      id: 'var-decimales',
      title: 'Decimales: float y double',
      theory: md`
## Números con coma

\`int\` no guarda decimales. Para eso hay dos tipos:

| Tipo | Precisión | Ejemplo |
|---|---|---|
| \`float\` | unas 7 cifras | \`float precio = 9.99;\` |
| \`double\` | unas 15 cifras (el doble) | \`double pi = 3.14159265358979;\` |

> ⚠️ En C los decimales se escriben con **punto**, no con coma: \`3.5\`, nunca \`3,5\`.

Para escribirlos con \`printf\` se usa **\`%f\`**. Por defecto salen 6 decimales; para elegir cuántos se pone \`%.2f\` (2 decimales), \`%.1f\` (1 decimal), etc. ¡Y redondea!

\`\`\`c
#include <stdio.h>

int main() {
    double precio = 19.5;
    float descuento = 0.15;
    double final = precio - precio * descuento;
    printf("%f\n", final);
    printf("%.2f euros\n", final);
    printf("%.0f euros (redondeado)\n", final);
    return 0;
}
\`\`\`

## ¿float o double?

\`double\` es más preciso y en los ordenadores actuales no es más lento, así que **usaremos \`double\` casi siempre**. Mira lo que pasa con poca precisión:

\`\`\`c
#include <stdio.h>

int main() {
    float f = 1234567.89;
    double d = 1234567.89;
    printf("float:  %.2f\n", f);
    printf("double: %.2f\n", d);
    return 0;
}
\`\`\`

> 💡 Si mezclas enteros y decimales en una cuenta (\`3 * 1.5\`), el resultado es decimal.
`,
      exercise: {
        task: md`
Una pizza cuesta \`15.6\` euros y sois \`4\` amigos. Guarda el precio en una variable \`double\`, el número de amigos en un \`int\`, calcula cuánto paga cada uno y escribe:

\`\`\`salida
Precio de la pizza: 15.60 euros
Somos 4 amigos
Cada uno paga: 3.90 euros
\`\`\`

(Los precios, con **2 decimales**.)
`,
        starter: md`#include <stdio.h>

int main() {

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    double precio = 15.6;
    int amigos = 4;
    double cadaUno = precio / amigos;
    printf("Precio de la pizza: %.2f euros\n", precio);
    printf("Somos %d amigos\n", amigos);
    printf("Cada uno paga: %.2f euros\n", cadaUno);
    return 0;
}
`,
        tests: [{ output: 'Precio de la pizza: 15.60 euros\nSomos 4 amigos\nCada uno paga: 3.90 euros\n' }],
        hints: ['double precio = 15.6; e int amigos = 4;', 'Para escribir con 2 decimales usa %.2f', 'Lo que paga cada uno es precio / amigos.'],
        requires: [{ re: '\\b(double|float)\\s+\\w+', msg: 'Guarda el precio en una variable double.' }],
      },
    },
    {
      id: 'var-char',
      title: 'Caracteres: char',
      theory: md`
## Una sola letra

El tipo \`char\` guarda **un carácter**: una letra, un dígito, un signo… Se escribe entre **comillas simples**:

\`\`\`c
#include <stdio.h>

int main() {
    char inicial = 'A';
    char simbolo = '#';
    char digito = '7';
    printf("Inicial: %c\n", inicial);
    printf("%c%c%c\n", simbolo, digito, simbolo);
    return 0;
}
\`\`\`

- Para escribir un \`char\` con printf se usa **\`%c\`**.
- **Comillas simples** \`'A'\` para un carácter; **comillas dobles** \`"Hola"\` para un texto. ¡No son lo mismo!

## Por dentro, un char es un número

El ordenador solo sabe guardar números. Cada carácter tiene un número según la tabla **ASCII**: \`'A'\` es 65, \`'B'\` es 66, \`'a'\` es 97, \`'0'\` es 48… Si escribes un \`char\` con \`%d\`, ves su número:

\`\`\`c
#include <stdio.h>

int main() {
    char letra = 'A';
    printf("%c tiene el código %d\n", letra, letra);
    printf("La siguiente es %c\n", letra + 1);
    printf("%c\n", 72);
    return 0;
}
\`\`\`

> 💡 Como son números, puedes sumarles: \`'A' + 1\` es \`'B'\`. Esto será muy útil para cifrar mensajes más adelante.

> ⚠️ Las letras con tilde y la ñ no caben en un \`char\` (ocupan 2 bytes). Úsalas solo dentro de textos \`"..."\`.
`,
      exercise: {
        task: md`
Declara tres variables \`char\` con las iniciales \`'C'\`, \`'O'\` y \`'D'\` y escribe:

\`\`\`salida
Iniciales: C.O.D.
La C tiene el código ASCII 67
\`\`\`
`,
        starter: md`#include <stdio.h>

int main() {
    char a = 'C';

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    char a = 'C';
    char b = 'O';
    char c = 'D';
    printf("Iniciales: %c.%c.%c.\n", a, b, c);
    printf("La %c tiene el código ASCII %d\n", a, a);
    return 0;
}
`,
        tests: [{ output: 'Iniciales: C.O.D.\nLa C tiene el código ASCII 67\n' }],
        hints: ['Cada inicial en su variable: char b = \'O\';', 'Para el código usa %d con la misma variable: printf("%d", a);'],
        requires: [
          { re: '%c', msg: 'Escribe las letras con %c.' },
          { re: 'char\\s+\\w+\\s*=[\\s\\S]*char\\s+\\w+\\s*=[\\s\\S]*char\\s+\\w+\\s*=|char\\s+\\w+\\s*=[^;]*,[^;]*,', msg: 'Guarda las tres iniciales en variables char.' },
        ],
      },
    },
    {
      id: 'var-constantes',
      title: 'Constantes',
      theory: md`
## Valores que no cambian

A veces un valor **no debe cambiar nunca** en todo el programa: el número π, el IVA, el máximo de alumnos… Hay dos formas de crear constantes:

### 1. \`#define\`

Va arriba, junto a los \`#include\`. **Sin** \`=\` y **sin** \`;\`. Por costumbre, su nombre va en MAYÚSCULAS:

\`\`\`c
#include <stdio.h>
#define PI 3.14159
#define VIDAS 3

int main() {
    double radio = 2.0;
    printf("Área: %.2f\n", PI * radio * radio);
    printf("Empiezas con %d vidas\n", VIDAS);
    return 0;
}
\`\`\`

Antes de compilar, C **sustituye** cada \`PI\` del código por \`3.14159\`, como un "buscar y reemplazar".

### 2. \`const\`

Es una variable normal pero con \`const\` delante: si intentas cambiarla, el compilador da error.

\`\`\`c
#include <stdio.h>

int main() {
    const double IVA = 0.21;
    double precio = 50;
    printf("Con IVA: %.2f\n", precio * (1 + IVA));
    // IVA = 0.10;   ← error: IVA es const
    return 0;
}
\`\`\`

> 💡 **¿Por qué usar constantes?** Si el IVA cambia, lo cambias en **un solo sitio**. Y el código se entiende mejor: \`precio * IVA\` dice más que \`precio * 0.21\`.
`,
      exercise: {
        task: md`
Crea una constante \`PI\` con \`#define\` (valor \`3.14159\`) y calcula el **perímetro** (\`2 · π · r\`) y el **área** (\`π · r²\`) de un círculo de radio \`5\`. Escribe, con 2 decimales:

\`\`\`salida
Radio: 5
Perímetro: 31.42
Área: 78.54
\`\`\`
`,
        starter: md`#include <stdio.h>

int main() {
    int radio = 5;

    return 0;
}
`,
        solution: md`#include <stdio.h>
#define PI 3.14159

int main() {
    int radio = 5;
    double perimetro = 2 * PI * radio;
    double area = PI * radio * radio;
    printf("Radio: %d\n", radio);
    printf("Perímetro: %.2f\n", perimetro);
    printf("Área: %.2f\n", area);
    return 0;
}
`,
        tests: [{ output: 'Radio: 5\nPerímetro: 31.42\nÁrea: 78.54\n' }],
        hints: ['La línea #define PI 3.14159 va arriba, debajo del #include.', 'r² es radio * radio.', 'Para 2 decimales: %.2f'],
        requires: [{ re: '#\\s*define\\s+PI\\b', msg: 'Crea la constante con #define PI 3.14159' }],
      },
    },
    {
      id: 'var-tamanos',
      title: 'Tamaños y límites',
      theory: md`
## Cada tipo ocupa un sitio

La memoria del ordenador se mide en **bytes** (8 bits). Cada tipo ocupa un número fijo de bytes, y eso limita qué números caben. Con \`sizeof\` puedes preguntarlo:

\`\`\`c
#include <stdio.h>

int main() {
    printf("char:      %d byte\n", (int)sizeof(char));
    printf("int:       %d bytes\n", (int)sizeof(int));
    printf("long long: %d bytes\n", (int)sizeof(long long));
    printf("float:     %d bytes\n", (int)sizeof(float));
    printf("double:    %d bytes\n", (int)sizeof(double));
    return 0;
}
\`\`\`

| Tipo | Bytes | Rango aproximado |
|---|---|---|
| \`char\` | 1 | -128 a 127 |
| \`int\` | 4 | -2 147 483 648 a 2 147 483 647 |
| \`long long\` | 8 | ±9 trillones (9·10¹⁸) |
| \`float\` | 4 | 7 cifras significativas |
| \`double\` | 8 | 15 cifras significativas |

## Desbordamiento

¿Qué pasa si te pasas del máximo? El número **da la vuelta** al otro extremo, como el cuentakilómetros de un coche viejo:

\`\`\`c
#include <stdio.h>
#include <limits.h>

int main() {
    int maximo = INT_MAX;     // 2147483647, definido en limits.h
    printf("%d\n", maximo);
    maximo = maximo + 1;
    printf("%d\n", maximo);   // ¡negativo!
    long long grande = 2147483647LL + 1;
    printf("%lld\n", grande); // con long long sí cabe (se escribe con %lld)
    return 0;
}
\`\`\`

> 💡 Para números muy grandes (factoriales, poblaciones…) usa \`long long\` y escríbelo con \`%lld\`. Para escribir \`unsigned\` (sin signo) se usa \`%u\`.
`,
      quiz: [
        {
          q: '¿Qué tipo usarías para guardar el precio de un producto, como 4.99?',
          options: ['int', 'char', 'double', 'long long'],
          answer: 2,
          explain: 'Los precios tienen decimales: double (o float).',
        },
        {
          q: '¿Qué escribe `printf("%d", sizeof(int) * 2);` en un ordenador normal?',
          options: ['4', '8', '16', '2'],
          answer: 1,
          explain: 'Un int ocupa 4 bytes; 4 · 2 = 8.',
        },
        {
          q: '¿Qué tipo usarías para guardar la población del mundo (unos 8 000 000 000)?',
          options: ['int', 'long long', 'char', 'float'],
          answer: 1,
          explain: '8 mil millones no cabe en un int (máximo ≈ 2 147 millones). long long sí.',
        },
      ],
    },
    {
      id: 'var-proyecto',
      title: 'Proyecto: ficha de personaje',
      kind: 'proyecto',
      theory: md`
## Tu personaje de rol

En los videojuegos, cada personaje tiene sus datos guardados en variables: nombre, nivel, vida, fuerza… Vas a hacer la **ficha** de un personaje usando variables de varios tipos.

Un truco de \`printf\` para hacer tablas: entre el \`%\` y la letra puedes poner un **ancho**. \`%5d\` reserva 5 espacios (rellena con espacios a la izquierda) y \`%-5d\` alinea a la izquierda:

\`\`\`c
#include <stdio.h>

int main() {
    printf("[%5d]\n", 42);
    printf("[%-5d]\n", 42);
    printf("[%8.2f]\n", 3.14159);
    printf("[%03d]\n", 7);
    return 0;
}
\`\`\`
`,
      exercise: {
        task: md`
Crea estas variables con estos valores: \`char clase = 'M'\`, \`int nivel = 7\`, \`int vida = 85\`, \`int vidaMax = 120\`, \`double fuerza = 13.75\`. Escribe la ficha **exactamente así**:

\`\`\`salida
=== FICHA ===
Clase: M
Nivel: 007
Vida: 85/120
Fuerza: 13.8
Vida restante: 70.83%
\`\`\`

- El nivel con **3 cifras** (rellenando con ceros): \`%03d\`.
- La fuerza con **1 decimal**.
- El porcentaje de vida es \`vida * 100.0 / vidaMax\`, con 2 decimales y el símbolo \`%\` al final (recuerda: \`%%\`).
`,
        starter: md`#include <stdio.h>

int main() {
    char clase = 'M';
    int nivel = 7;
    int vida = 85;
    int vidaMax = 120;
    double fuerza = 13.75;

    printf("=== FICHA ===\n");

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    char clase = 'M';
    int nivel = 7;
    int vida = 85;
    int vidaMax = 120;
    double fuerza = 13.75;

    printf("=== FICHA ===\n");
    printf("Clase: %c\n", clase);
    printf("Nivel: %03d\n", nivel);
    printf("Vida: %d/%d\n", vida, vidaMax);
    printf("Fuerza: %.1f\n", fuerza);
    printf("Vida restante: %.2f%%\n", vida * 100.0 / vidaMax);
    return 0;
}
`,
        tests: [{ output: '=== FICHA ===\nClase: M\nNivel: 007\nVida: 85/120\nFuerza: 13.8\nVida restante: 70.83%\n' }],
        hints: [
          'Para la clase usa %c; para el nivel %03d.',
          'La vida se escribe con dos %d separados por /: printf("Vida: %d/%d\\n", vida, vidaMax);',
          'El símbolo % al final se escribe %%: printf("%.2f%%\\n", ...);',
        ],
        requires: [{ re: 'vidaMax', msg: 'Calcula el porcentaje usando las variables vida y vidaMax.' }],
      },
    },
    {
      id: 'var-examen',
      title: 'Examen: variables',
      kind: 'examen',
      theory: md`
## Pon a prueba lo aprendido

Necesitas un **70 %** de aciertos para completar el capítulo.
`,
      quiz: [
        {
          q: '¿Cuál de estas declaraciones es correcta?',
          options: ['`int 2puntos = 5;`', '`int puntos = 5;`', '`int puntos = 5`', '`puntos int = 5;`'],
          answer: 1,
          explain: 'Primero el tipo, luego el nombre (que no puede empezar por número) y punto y coma al final.',
        },
        {
          q: '¿Qué escribe este programa?',
          code: 'int x = 4;\nx = x + 3;\nx = x * 2;\nprintf("%d", x);',
          options: ['4', '7', '14', '11'],
          answer: 2,
          explain: 'x empieza en 4, luego vale 4+3 = 7 y después 7·2 = 14.',
        },
        {
          q: '¿Con qué formato se escribe un `double` con 3 decimales?',
          options: ['`%d3`', '`%.3d`', '`%.3f`', '`%3f`'],
          answer: 2,
          explain: '%.3f: la f es de decimales y el .3 indica cuántos.',
        },
        {
          q: '¿Qué diferencia hay entre `\'A\'` y `"A"`?',
          options: ['Ninguna', '`\'A\'` es un carácter (char); `"A"` es un texto', '`"A"` es un carácter; `\'A\'` es un texto', 'Las comillas simples dan error'],
          answer: 1,
          explain: 'Comillas simples: un char. Comillas dobles: una cadena de texto.',
        },
        {
          q: '¿Qué escribe `printf("%c", \'a\' + 2);`?',
          options: ['a2', 'c', '99', 'b'],
          answer: 1,
          explain: "'a' + 2 es el carácter dos posiciones más allá en la tabla ASCII: 'c'.",
        },
        {
          q: '¿Cómo se define bien una constante con #define?',
          options: ['`#define MAX = 100;`', '`#define MAX 100`', '`#define MAX 100;`', '`define MAX 100`'],
          answer: 1,
          explain: '#define va sin = y sin punto y coma.',
        },
      ],
    },
  ],
};
