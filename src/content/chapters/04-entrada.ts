import { md, type Chapter } from '../types';

export const entrada: Chapter = {
  id: 'entrada',
  title: 'Leer datos con scanf',
  subtitle: 'Programas que preguntan: scanf, &, %lf y " %c"',
  icon: '⌨️',
  color: '#9b7bff',
  level: 1,
  lessons: [
    {
      id: 'in-scanf',
      title: 'Leer un número',
      theory: md`
## Programas que preguntan

Hasta ahora los datos estaban escritos en el código. Con \`scanf\` el programa **espera** a que el usuario escriba algo en el teclado y pulse Enter, y lo guarda en una variable:

\`\`\`c entrada="15"
#include <stdio.h>

int main() {
    int edad;
    printf("¿Cuántos años tienes? ");
    scanf("%d", &edad);
    printf("El año que viene tendrás %d años\n", edad + 1);
    return 0;
}
\`\`\`

Pruébalo con **▶ Ejecutar** en el editor de la derecha (cuando pidas datos, la consola te dejará escribir).

- \`"%d"\`: qué tipo de dato se lee (igual que en printf: \`%d\` para \`int\`).
- \`&edad\`: **dónde** se guarda. El \`&\` significa "la dirección de". scanf necesita saber en qué caja dejar el número, no lo que la caja tiene ahora.

> ⚠️ **El error más típico de C:** olvidar el \`&\`. \`scanf("%d", edad);\` no funciona. Aquí el compilador te avisará; en otros, el programa se cuelga.

> 💡 Es buena idea escribir un mensaje antes del scanf (\`printf("¿Cuántos años tienes? ");\`) para que el usuario sepa qué tiene que escribir. Fíjate en que ese printf **no** lleva \`\n\`: así el usuario escribe en la misma línea.
`,
      exercise: {
        task: md`
Pide un número entero y escribe su **doble** y su **cuadrado**. El mensaje para pedirlo ya está escrito en el código: añade el \`scanf\` y los cálculos.

Si el usuario escribe \`7\`, la consola tiene que quedar así:

\`\`\`salida
Escribe un número: 7
El doble es 14
El cuadrado es 49
\`\`\`
`,
        starter: md`#include <stdio.h>

int main() {
    int n;
    printf("Escribe un número: ");

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int n;
    printf("Escribe un número: ");
    scanf("%d", &n);
    printf("El doble es %d\n", n * 2);
    printf("El cuadrado es %d\n", n * n);
    return 0;
}
`,
        tests: [{ input: '7\n' }, { input: '12\n' }, { input: '-3\n' }, { input: '0\n' }],
        examples: 0,
        hints: ['scanf("%d", &n); justo después del printf que pregunta.', 'El cuadrado es n * n.'],
        requires: [{ re: 'scanf\\s*\\(', msg: 'Lee el número con scanf.' }],
      },
    },
    {
      id: 'in-varios',
      title: 'Leer varios datos',
      theory: md`
## Varios datos en un scanf

Un \`scanf\` puede leer varios valores. El usuario los escribe separados por **espacios o Enter**:

\`\`\`c entrada="8 3"
#include <stdio.h>

int main() {
    int a, b;
    printf("Escribe dos números: ");
    scanf("%d %d", &a, &b);
    printf("%d + %d = %d\n", a, b, a + b);
    printf("%d - %d = %d\n", a, b, a - b);
    return 0;
}
\`\`\`

Cada \`%d\` necesita su variable con \`&\`, en el mismo orden.

Si escribes algo entre los formatos, el usuario tendrá que escribirlo igual. Por ejemplo, para leer una fecha como \`25/12/2024\`:

\`\`\`c entrada="25/12/2024"
#include <stdio.h>

int main() {
    int d, m, a;
    printf("Fecha (dd/mm/aaaa): ");
    scanf("%d/%d/%d", &d, &m, &a);
    printf("Día %d del mes %d del año %d\n", d, m, a);
    return 0;
}
\`\`\`
`,
      exercise: {
        task: md`
Lee la **base** y la **altura** de un rectángulo (dos enteros en el mismo scanf) y escribe su área y su perímetro.

\`\`\`salida
Base y altura: 6 4
Área: 24
Perímetro: 20
\`\`\`
`,
        starter: md`#include <stdio.h>

int main() {
    int base, altura;
    printf("Base y altura: ");

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int base, altura;
    printf("Base y altura: ");
    scanf("%d %d", &base, &altura);
    printf("Área: %d\n", base * altura);
    printf("Perímetro: %d\n", 2 * (base + altura));
    return 0;
}
`,
        tests: [{ input: '6 4\n' }, { input: '10\n3\n' }, { input: '1 1\n' }],
        examples: 0,
        hints: ['scanf("%d %d", &base, &altura);', 'El perímetro es 2 * (base + altura).'],
        requires: [{ re: 'scanf\\s*\\(\\s*"[^"]*%d[^"]*%d', msg: 'Lee los dos números en un solo scanf: scanf("%d %d", &base, &altura);' }],
      },
    },
    {
      id: 'in-decimales',
      title: 'Leer decimales: %f y %lf',
      theory: md`
## Cuidado: en scanf, double es %lf

En \`printf\` da igual \`%f\` para \`float\` y \`double\`. En **scanf no**:

| Tipo | printf | scanf |
|---|---|---|
| \`float\` | \`%f\` | \`%f\` |
| \`double\` | \`%f\` (o \`%lf\`) | **\`%lf\`** (con ele) |

\`\`\`c entrada="1.75 68.5"
#include <stdio.h>

int main() {
    double altura, peso;
    printf("Altura (m) y peso (kg): ");
    scanf("%lf %lf", &altura, &peso);
    printf("Mides %.2f m y pesas %.1f kg\n", altura, peso);
    return 0;
}
\`\`\`

> ⚠️ Si lees un \`double\` con \`%f\`, scanf mete un \`float\` en una caja de \`double\` y el número sale con un valor absurdo. Este compilador te lo marca como error para que no te pase.

El usuario escribe los decimales con **punto**: \`1.75\`, no \`1,75\`.
`,
      exercise: {
        task: md`
Lee el **precio** de un producto (\`double\`) y la **cantidad** (\`int\`) y escribe el total, el IVA (21 %) y el total con IVA, todo con 2 decimales:

\`\`\`salida
Precio: 2.5
Cantidad: 4
Total: 10.00
IVA: 2.10
Total con IVA: 12.10
\`\`\`
`,
        starter: md`#include <stdio.h>

int main() {
    double precio;
    int cantidad;
    printf("Precio: ");

    printf("Cantidad: ");

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    double precio;
    int cantidad;
    printf("Precio: ");
    scanf("%lf", &precio);
    printf("Cantidad: ");
    scanf("%d", &cantidad);
    double total = precio * cantidad;
    double iva = total * 0.21;
    printf("Total: %.2f\n", total);
    printf("IVA: %.2f\n", iva);
    printf("Total con IVA: %.2f\n", total + iva);
    return 0;
}
`,
        tests: [{ input: '2.5\n4\n' }, { input: '19.99\n3\n' }, { input: '100\n1\n' }],
        examples: 0,
        hints: ['El precio es double: se lee con %lf. La cantidad es int: %d.', 'El IVA es total * 0.21.'],
        requires: [{ re: '%lf', msg: 'El precio es double: léelo con %lf.' }],
      },
    },
    {
      id: 'in-char',
      title: 'Leer un carácter',
      theory: md`
## El truco del espacio en " %c"

Para leer un \`char\` se usa \`%c\`. Pero hay una trampa: cuando el usuario escribe un número y pulsa **Enter**, ese Enter (\`\n\`) se queda esperando en la entrada. El siguiente \`%c\` lo lee a él en vez de la letra:

\`\`\`c entrada="20\nS"
#include <stdio.h>

int main() {
    int edad;
    char respuesta;
    printf("Edad: ");
    scanf("%d", &edad);
    printf("¿Tienes carné? (S/N): ");
    scanf("%c", &respuesta);           // lee el Enter de antes :(
    printf("Has respondido: [%c] (código %d)\n", respuesta, respuesta);
    return 0;
}
\`\`\`

El código 10 es el salto de línea. La solución es poner un **espacio antes** de \`%c\`: \`" %c"\`. Ese espacio le dice a scanf "sáltate los espacios y Enters que haya":

\`\`\`c entrada="20\nS"
#include <stdio.h>

int main() {
    int edad;
    char respuesta;
    printf("Edad: ");
    scanf("%d", &edad);
    printf("¿Tienes carné? (S/N): ");
    scanf(" %c", &respuesta);          // con espacio
    printf("Has respondido: [%c]\n", respuesta);
    return 0;
}
\`\`\`

> 💡 Regla fácil: **lee siempre los char con \`" %c"\`**.
`,
      exercise: {
        task: md`
Pide un **número de mesa** (entero) y después la **inicial** del camarero (un \`char\`). Escribe la frase de confirmación:

\`\`\`salida
Mesa: 12
Inicial del camarero: L
La mesa 12 la atiende L.
\`\`\`
`,
        starter: md`#include <stdio.h>

int main() {
    int mesa;
    char inicial;
    printf("Mesa: ");
    scanf("%d", &mesa);
    printf("Inicial del camarero: ");
    scanf("%c", &inicial);
    printf("La mesa %d la atiende %c.\n", mesa, inicial);
    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int mesa;
    char inicial;
    printf("Mesa: ");
    scanf("%d", &mesa);
    printf("Inicial del camarero: ");
    scanf(" %c", &inicial);
    printf("La mesa %d la atiende %c.\n", mesa, inicial);
    return 0;
}
`,
        tests: [{ input: '12\nL\n' }, { input: '3\nA\n' }, { input: '7 M\n' }],
        examples: 0,
        hints: ['El código ya está casi bien… ejecútalo y mira qué se lee en la inicial.', 'Pon un espacio antes del %c: scanf(" %c", &inicial);'],
      },
    },
    {
      id: 'in-texto',
      title: 'Leer una palabra',
      theory: md`
## Textos: arrays de char

Un texto (una **cadena**) se guarda en un **array de char**: varias cajas \`char\` seguidas. Se declara con el número máximo de letras entre corchetes:

\`\`\`c entrada="Lucía"
#include <stdio.h>

int main() {
    char nombre[30];             // hasta 29 letras (+ 1 para el final)
    printf("¿Cómo te llamas? ");
    scanf("%s", nombre);         // ¡sin &!
    printf("Encantado, %s\n", nombre);
    return 0;
}
\`\`\`

- Se lee y se escribe con **\`%s\`** (de *string*).
- Con arrays **no se pone \`&\`** en scanf: el nombre del array ya es su dirección.
- \`%s\` lee **una sola palabra**: se para en el primer espacio. Para frases enteras hay otra función (\`fgets\`) que verás en el capítulo de cadenas.

Las cadenas tienen mucho más que contar: tienen su propio capítulo más adelante.
`,
      exercise: {
        task: md`
Pide el **nombre** (una palabra) y la **ciudad** (otra palabra) y escribe:

\`\`\`salida
Nombre: Marta
Ciudad: Sevilla
Hola, Marta de Sevilla!
\`\`\`
`,
        starter: md`#include <stdio.h>

int main() {
    char nombre[40];
    char ciudad[40];

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    char nombre[40];
    char ciudad[40];
    printf("Nombre: ");
    scanf("%s", nombre);
    printf("Ciudad: ");
    scanf("%s", ciudad);
    printf("Hola, %s de %s!\n", nombre, ciudad);
    return 0;
}
`,
        tests: [{ input: 'Marta\nSevilla\n' }, { input: 'Pau\nGirona\n' }],
        examples: 0,
        hints: ['printf("Nombre: "); y scanf("%s", nombre); (sin &).', 'Al final: printf("Hola, %s de %s!\\n", nombre, ciudad);'],
      },
    },
    {
      id: 'in-proyecto',
      title: 'Proyecto: calculadora de IMC',
      kind: 'proyecto',
      theory: md`
## Índice de Masa Corporal

El IMC es una medida que relaciona peso y altura:

**IMC = peso / altura²** (peso en kg, altura en metros)

Vas a hacer un programa que pregunte el nombre, el peso y la altura y calcule el IMC. ¡Repaso de todo el bloque: variables, operadores, printf y scanf!
`,
      exercise: {
        task: md`
Pide nombre (una palabra), peso (\`double\`, kg) y altura (\`double\`, en **centímetros**). Pasa la altura a metros, calcula el IMC y escribe el resultado con 1 decimal. Usa estos mensajes:

\`\`\`salida
Nombre: Leo
Peso (kg): 70
Altura (cm): 175
Leo, tu IMC es 22.9
\`\`\`
`,
        starter: md`#include <stdio.h>

int main() {
    char nombre[30];
    double peso, altura;

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    char nombre[30];
    double peso, altura;
    printf("Nombre: ");
    scanf("%s", nombre);
    printf("Peso (kg): ");
    scanf("%lf", &peso);
    printf("Altura (cm): ");
    scanf("%lf", &altura);
    double metros = altura / 100;
    double imc = peso / (metros * metros);
    printf("%s, tu IMC es %.1f\n", nombre, imc);
    return 0;
}
`,
        tests: [{ input: 'Leo\n70\n175\n' }, { input: 'Ana\n55.5\n162\n' }, { input: 'Max\n98\n190\n' }],
        examples: 0,
        hints: ['Lee peso y altura con %lf (son double).', 'altura en metros = altura / 100.', 'imc = peso / (metros * metros);'],
      },
    },
    {
      id: 'in-examen',
      title: 'Examen: scanf',
      kind: 'examen',
      theory: md`
## Última parada del nivel de entrada

Necesitas un **70 %**.
`,
      quiz: [
        { q: '¿Qué falta en `scanf("%d", x);`?', options: ['Un punto y coma', 'El & delante de x', 'Un \\n', 'Nada, está bien'], answer: 1, explain: 'scanf necesita la dirección de la variable: &x.' },
        { q: '¿Con qué formato se lee un `double` en scanf?', options: ['`%d`', '`%f`', '`%lf`', '`%df`'], answer: 2, explain: 'En scanf, double se lee con %lf.' },
        {
          q: '¿Por qué se escribe `" %c"` (con un espacio) para leer un char?',
          options: ['Porque lo dice la norma', 'Para saltar el Enter que quedó de la lectura anterior', 'Para leer dos caracteres', 'Para escribir un espacio'],
          answer: 1,
          explain: 'El espacio hace que scanf se salte espacios y saltos de línea antes de leer el carácter.',
        },
        { q: '¿Qué lee `scanf("%s", nombre);` si el usuario escribe `Ana María`?', options: ['Ana María', 'Ana', 'María', 'Nada'], answer: 1, explain: '%s se detiene en el primer espacio.' },
        { q: '¿Por qué no lleva & `scanf("%s", nombre);`?', options: ['Es un error, debería llevarlo', 'Porque nombre es un array y su nombre ya es una dirección', 'Porque %s no usa variables', 'Porque es un char'], answer: 1, explain: 'El nombre de un array ya indica dónde empieza en memoria.' },
      ],
    },
  ],
};
