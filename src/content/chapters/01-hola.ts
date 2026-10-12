import type { Chapter } from '../types';

export const hola: Chapter = {
  id: 'hola',
  title: 'Hola, mundo',
  subtitle: 'Tu primer programa en C y la función printf',
  icon: '👋',
  color: '#4f8cff',
  level: 1,
  lessons: [
    {
      id: 'hola-primer-programa',
      title: 'Tu primer programa',
      theory: `
## ¿Qué es programar?

Programar es **darle instrucciones al ordenador**, una detrás de otra, en un idioma que entienda. Ese idioma es un **lenguaje de programación**. Aquí vas a aprender **C**, uno de los lenguajes más importantes de la historia: con él se escribieron Linux, Windows, partes de los videojuegos… y es la base de **C++**.

El ordenador no entiende C directamente. Primero, un programa llamado **compilador** traduce tu código a instrucciones de la máquina. Si te equivocas al escribir, el compilador te avisa con un **error**. ¡Tranquilo! Los errores son normales y aquí te los explicaremos en castellano.

## La estructura de un programa en C

Todos los programas en C tienen este esqueleto:

\`\`\`c
#include <stdio.h>

int main() {
    printf("¡Hola, mundo!\\n");
    return 0;
}
\`\`\`

Pulsa **▶ Ejecutar** en el código de arriba para verlo funcionar. Ahora, línea a línea:

| Línea | Qué hace |
|---|---|
| \`#include <stdio.h>\` | Trae la biblioteca **stdio** (*standard input/output*): las herramientas para escribir en pantalla y leer del teclado. Sin ella, no existe \`printf\`. |
| \`int main() {\` | Empieza la función **main**. Todo programa en C empieza a ejecutarse aquí. |
| \`printf("...");\` | Escribe en pantalla el texto que va entre comillas. |
| \`return 0;\` | Termina el programa diciendo "todo ha ido bien" (0 = sin errores). |
| \`}\` | Cierra la función main. |

> 💡 **Fíjate en los detalles:** cada instrucción termina con **punto y coma** \`;\`, el texto va entre **comillas dobles** \`"..."\` y las **llaves** \`{ }\` marcan dónde empieza y acaba main.

El \`\\n\` del final del texto no se ve: significa **salto de línea** (como pulsar Enter). Lo verás en la próxima lección.
`,
      exercise: {
        task: `
Escribe un programa que muestre exactamente este mensaje:

\`\`\`salida
¡Hola, mundo!
\`\`\`

Ya tienes el esqueleto preparado: solo falta la línea del \`printf\`.
`,
        starter: `#include <stdio.h>

int main() {
    // Escribe aquí tu printf

    return 0;
}
`,
        solution: `#include <stdio.h>

int main() {
    printf("¡Hola, mundo!\\n");
    return 0;
}
`,
        tests: [{ output: '¡Hola, mundo!\n' }],
        hints: [
          'Se escribe así: printf("texto que quieres");',
          'Copia el texto exacto, con los signos ¡ y !, y no olvides el ; al final.',
          'Para que el cursor baje a la línea siguiente, termina el texto con \\n: printf("¡Hola, mundo!\\n");',
        ],
        requires: [{ re: 'printf\\s*\\(', msg: 'Usa printf para escribir el mensaje.' }],
      },
    },
    {
      id: 'hola-printf',
      title: 'printf y los saltos de línea',
      theory: `
## Escribir varias líneas

\`printf\` escribe el texto **justo donde se quedó el cursor**. No salta de línea por su cuenta. Mira:

\`\`\`c
#include <stdio.h>

int main() {
    printf("Uno");
    printf("Dos");
    printf("Tres");
    return 0;
}
\`\`\`

Sale \`UnoDosTres\`, todo pegado. Para bajar a la línea siguiente se usa **\`\\n\`** (barra invertida + n), el **salto de línea**:

\`\`\`c
#include <stdio.h>

int main() {
    printf("Uno\\n");
    printf("Dos\\n");
    printf("Tres\\n");
    return 0;
}
\`\`\`

El \`\\n\` puede ir en cualquier parte del texto, incluso varias veces:

\`\`\`c
#include <stdio.h>

int main() {
    printf("Línea 1\\nLínea 2\\n\\nLínea 4 (la 3 está vacía)\\n");
    return 0;
}
\`\`\`

> 💡 Los programas se ejecutan **de arriba abajo**, una instrucción detrás de otra. El orden importa.

### También existe \`puts\`

\`puts("texto");\` escribe el texto **y añade el salto de línea** automáticamente. Es cómodo, pero \`printf\` es mucho más potente (pronto escribirás números con él), así que la usaremos casi siempre.
`,
      exercise: {
        task: `
Escribe un programa que muestre este menú de un restaurante, **cada plato en su línea**:

\`\`\`salida
MENÚ DEL DÍA
1. Sopa
2. Paella
3. Flan
\`\`\`
`,
        starter: `#include <stdio.h>

int main() {

    return 0;
}
`,
        solution: `#include <stdio.h>

int main() {
    printf("MENÚ DEL DÍA\\n");
    printf("1. Sopa\\n");
    printf("2. Paella\\n");
    printf("3. Flan\\n");
    return 0;
}
`,
        tests: [{ output: 'MENÚ DEL DÍA\n1. Sopa\n2. Paella\n3. Flan\n' }],
        hints: [
          'Puedes usar un printf por línea.',
          'Cada línea tiene que terminar con \\n para que la siguiente empiece debajo.',
        ],
      },
    },
    {
      id: 'hola-escapes',
      title: 'Caracteres especiales',
      theory: `
## Secuencias de escape

El \`\\n\` es una **secuencia de escape**: una barra invertida \`\\\` seguida de una letra que tiene un significado especial. Las más útiles son:

| Escribes | Sale | Para qué |
|---|---|---|
| \`\\n\` | salto de línea | bajar a la línea siguiente |
| \`\\t\` | tabulador | alinear columnas |
| \`\\"\` | \`"\` | escribir comillas dentro del texto |
| \`\\\\\` | \`\\\` | escribir una barra invertida |
| \`%%\` | \`%\` | escribir el símbolo de porcentaje en printf |

¿Por qué hace falta \`\\"\`? Porque las comillas marcan dónde empieza y termina el texto. Si escribes una comilla normal en medio, C cree que el texto se acaba ahí.

\`\`\`c
#include <stdio.h>

int main() {
    printf("Ella dijo: \\"¡Me encanta C!\\"\\n");
    printf("Nombre\\tNota\\n");
    printf("Ana\\t9\\n");
    printf("Luis\\t7\\n");
    printf("Ruta: C:\\\\juegos\\\\mario.exe\\n");
    printf("Descuento del 20%%\\n");
    return 0;
}
\`\`\`

> ⚠️ El símbolo \`%\` es especial en printf (lo usarás para escribir números). Para que salga un \`%\` normal, escribe **dos**: \`%%\`.
`,
      exercise: {
        task: `
Escribe un programa que muestre **exactamente** esto (entre "Producto" y "Precio" hay un **tabulador** \`\\t\`, igual que en las otras dos filas):

\`\`\`salida
Producto	Precio
"Pizza"	8 €
Oferta: 10% de descuento
\`\`\`
`,
        starter: `#include <stdio.h>

int main() {

    return 0;
}
`,
        solution: `#include <stdio.h>

int main() {
    printf("Producto\\tPrecio\\n");
    printf("\\"Pizza\\"\\t8 €\\n");
    printf("Oferta: 10%% de descuento\\n");
    return 0;
}
`,
        tests: [{ output: 'Producto\tPrecio\n"Pizza"\t8 €\nOferta: 10% de descuento\n' }],
        hints: [
          'El tabulador se escribe \\t dentro del texto.',
          'Para que salgan comillas dentro del texto escribe \\" (barra + comillas).',
          'El % se escribe doble: printf("10%% de descuento\\n");',
        ],
      },
    },
    {
      id: 'hola-comentarios',
      title: 'Comentarios',
      theory: `
## Notas para humanos

Un **comentario** es texto que el compilador **ignora**. Sirve para explicar tu código (a otras personas o a ti mismo dentro de un mes). En C hay dos tipos:

\`\`\`c
#include <stdio.h>

// Esto es un comentario de una línea: llega hasta el final de la línea.

/* Esto es un comentario
   de varias líneas.
   Termina con asterisco y barra. */

int main() {
    printf("Hola\\n"); // también puede ir al final de una línea de código
    // printf("Esto NO se ejecuta\\n");
    return 0;
}
\`\`\`

Ejecuta el ejemplo: la línea con \`// printf(...)\` no hace nada, porque está **comentada**.

> 💡 Un truco muy usado al programar: **comentar** una línea para "desactivarla" sin borrarla. Si luego la necesitas, quitas las \`//\` y vuelve a funcionar.
`,
      exercise: {
        task: `
Este programa escribe demasiadas cosas. Sin borrar ninguna línea, **comenta** los \`printf\` que sobran para que la salida sea solo:

\`\`\`salida
Me gusta programar
en C
\`\`\`
`,
        starter: `#include <stdio.h>

int main() {
    printf("Me gusta programar\\n");
    printf("pero odio los lunes\\n");
    printf("en C\\n");
    printf("y en ningún otro lenguaje\\n");
    return 0;
}
`,
        solution: `#include <stdio.h>

int main() {
    printf("Me gusta programar\\n");
    // printf("pero odio los lunes\\n");
    printf("en C\\n");
    // printf("y en ningún otro lenguaje\\n");
    return 0;
}
`,
        tests: [{ output: 'Me gusta programar\nen C\n' }],
        hints: ['Pon // al principio de las líneas que sobran.', 'Sobran la segunda y la cuarta línea de printf.'],
        requires: [{ re: 'printf[\\s\\S]*printf', msg: 'No borres los printf: coméntalos con // para que el compilador los ignore.' }],
      },
    },
    {
      id: 'hola-errores',
      title: 'Leer los errores',
      theory: `
## El compilador es tu amigo

Cuando algo está mal escrito, el compilador **no ejecuta el programa** y te muestra un **error de compilación**: en qué **línea** está y qué ha encontrado. Los errores más típicos al empezar son:

| Error | Ejemplo | Arreglo |
|---|---|---|
| Falta el punto y coma | \`printf("Hola")\` | \`printf("Hola");\` |
| Faltan comillas | \`printf("Hola);\` | \`printf("Hola");\` |
| Falta un paréntesis | \`printf("Hola";\` | \`printf("Hola");\` |
| Mayúsculas | \`Printf("Hola");\` | C distingue mayúsculas: \`printf\` |
| Falta la biblioteca | sin \`#include <stdio.h>\` | añádelo al principio |
| Falta cerrar llaves | \`int main() {\` sin \`}\` | cada \`{\` necesita su \`}\` |

> 💡 **Consejo de oro:** arregla **el primer error** y vuelve a probar. A veces un solo fallo provoca otros mensajes más abajo.

En el editor, los errores se subrayan en **rojo** mientras escribes. Pasa el ratón por encima (o mira la consola al ejecutar) para leer la explicación.

También hay **avisos** (en amarillo): el programa funciona, pero algo parece sospechoso. ¡Léelos siempre!
`,
      exercise: {
        task: `
Este programa tiene **cuatro errores**. Arréglalos para que muestre:

\`\`\`salida
Los errores
no me dan miedo
\`\`\`

Pulsa **▶ Ejecutar** para ver el primer error, arréglalo y repite.
`,
        starter: `#include <stdio.h>

int main() {
    printf("Los errores\\n")
    Printf("no me dan miedo\\n");
    return 0;
`,
        solution: `#include <stdio.h>

int main() {
    printf("Los errores\\n");
    printf("no me dan miedo\\n");
    return 0;
}
`,
        tests: [{ output: 'Los errores\nno me dan miedo\n' }],
        hints: [
          'Revisa el final de la primera línea de printf: ¿termina en ;?',
          'C distingue mayúsculas y minúsculas: Printf no es lo mismo que printf.',
          'La función main se abre con { … ¿dónde se cierra?',
        ],
      },
    },
    {
      id: 'hola-proyecto',
      title: 'Proyecto: tu tarjeta de visita',
      kind: 'proyecto',
      theory: `
## Proyecto del capítulo

¡Primer proyecto! Vas a juntar todo lo del capítulo para dibujar con texto. Los programas de consola antiguos hacían "dibujos" con caracteres: se llama **arte ASCII**.

Recuerda:
- Un \`printf\` por línea (o varios \`\\n\` en uno).
- Si quieres escribir \`\\\` tienes que poner \`\\\\\`; para \`"\` pon \`\\"\`.
- Los espacios dentro de las comillas **cuentan**.
`,
      exercise: {
        task: `
Dibuja esta tarjeta **exactamente** igual (fíjate en los espacios):

\`\`\`salida
+----------------------+
|  Programador en C    |
|  Nivel: principiante |
|  "Hola, mundo"       |
+----------------------+
\`\`\`
`,
        starter: `#include <stdio.h>

int main() {
    printf("+----------------------+\\n");

    return 0;
}
`,
        solution: `#include <stdio.h>

int main() {
    printf("+----------------------+\\n");
    printf("|  Programador en C    |\\n");
    printf("|  Nivel: principiante |\\n");
    printf("|  \\"Hola, mundo\\"       |\\n");
    printf("+----------------------+\\n");
    return 0;
}
`,
        tests: [{ output: '+----------------------+\n|  Programador en C    |\n|  Nivel: principiante |\n|  "Hola, mundo"       |\n+----------------------+\n' }],
        hints: [
          'Copia cada línea del dibujo dentro de un printf y termina con \\n.',
          'Las comillas de "Hola, mundo" se escriben \\" dentro del texto.',
          'Cuenta bien los espacios antes de cada | final: todas las líneas miden lo mismo.',
        ],
      },
    },
    {
      id: 'hola-examen',
      title: 'Examen: Hola, mundo',
      kind: 'examen',
      theory: `
## ¿Lo tienes claro?

Responde a estas preguntas. Necesitas acertar al menos el **70 %** para completar el capítulo. Si fallas, lee la explicación y vuelve a intentarlo.
`,
      quiz: [
        {
          q: '¿Qué hace la línea `#include <stdio.h>`?',
          options: ['Empieza el programa', 'Trae la biblioteca para escribir y leer (printf, scanf…)', 'Escribe "stdio" en pantalla', 'Es un comentario'],
          answer: 1,
          explain: 'stdio.h es la biblioteca de entrada y salida estándar. Sin ella, printf no existe.',
        },
        {
          q: '¿Dónde empieza a ejecutarse un programa en C?',
          options: ['En la primera línea del archivo', 'En la función main', 'En el primer printf', 'En el #include'],
          answer: 1,
          explain: 'Todo programa en C empieza en la función main.',
        },
        {
          q: '¿Qué escribe este código?',
          code: 'printf("A");\nprintf("B\\n");\nprintf("C");',
          options: ['A, B y C en tres líneas', 'AB en una línea y C en la siguiente', 'ABC', 'A en una línea y BC en la siguiente'],
          answer: 1,
          explain: 'printf no salta de línea solo. Solo hay un \\n, después de la B.',
        },
        {
          q: '¿Cómo se escribe el símbolo % con printf?',
          options: ['\\%', '%', '%%', '"%"'],
          answer: 2,
          explain: 'En printf el % es especial. Para que salga un % se escriben dos: %%.',
        },
        {
          q: '¿Qué le pasa al compilador con `printf("Hola")` sin punto y coma?',
          options: ['Nada, funciona igual', 'Da un error: falta el ;', 'Escribe Hola sin salto de línea', 'Escribe Hola dos veces'],
          answer: 1,
          explain: 'En C cada instrucción termina en ;. Si falta, es un error de compilación.',
        },
        {
          q: '¿Qué hace `// printf("Hola");`?',
          options: ['Escribe Hola', 'Escribe // Hola', 'Nada: es un comentario', 'Da error'],
          answer: 2,
          explain: 'Todo lo que va después de // en esa línea es un comentario y el compilador lo ignora.',
        },
      ],
    },
  ],
};
