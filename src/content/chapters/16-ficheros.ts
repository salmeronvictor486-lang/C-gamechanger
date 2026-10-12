import { md, type Chapter } from '../types';

export const ficheros: Chapter = {
  id: 'ficheros',
  title: 'Ficheros',
  subtitle: 'Guardar y leer datos: fopen, fprintf, fscanf y fclose',
  icon: '💾',
  color: '#ffd166',
  level: 3,
  lessons: [
    {
      id: 'fich-escribir',
      title: 'Escribir en un fichero',
      theory: md`
## Que los datos sobrevivan

Cuando un programa termina, sus variables desaparecen. Para **guardar** datos (una partida, una lista de récords…) se escriben en un **fichero**. En C se usan las funciones de \`<stdio.h>\`:

\`\`\`c
#include <stdio.h>

int main() {
    FILE *f = fopen("records.txt", "w");      // abrir para escribir
    if (f == NULL) {
        printf("No se pudo abrir\n");
        return 1;
    }
    fprintf(f, "Ana %d\n", 1200);              // como printf, pero al fichero
    fprintf(f, "Luis %d\n", 980);
    fclose(f);                                 // cerrar: ¡imprescindible!
    printf("Guardado\n");
    return 0;
}
\`\`\`

| Modo | Para qué |
|---|---|
| \`"r"\` | leer (el fichero tiene que existir; si no, \`fopen\` devuelve \`NULL\`) |
| \`"w"\` | escribir (si existe, **lo borra** y empieza de cero) |
| \`"a"\` | añadir al final (*append*) |

- \`FILE *\` es un puntero a un fichero abierto.
- \`fprintf(f, ...)\` escribe en el fichero igual que \`printf\` en la pantalla. También hay \`fputs(texto, f)\` y \`fputc(c, f)\`.
- \`fclose(f)\` cierra el fichero y se asegura de que todo se ha guardado.

> 💡 En esta web los ficheros viven en una memoria temporal que se borra al terminar el programa: puedes escribirlos y leerlos dentro del mismo programa. En tu ordenador aparecerían en la carpeta del programa.
`,
      exercise: {
        task: md`
Lee \`n\` y después \`n\` pares \`nombre puntos\`. Guárdalos en el fichero \`"puntuaciones.txt"\` (una línea por jugador, \`nombre puntos\`). Después vuelve a abrir el fichero en modo \`"a"\` y añade la línea \`FIN\`. Cuando acabes, escribe en pantalla \`Guardados N jugadores\`.

Para comprobarlo, al final vuelve a abrirlo en modo \`"r"\` y escribe su contenido en pantalla línea a línea con \`fgets\`.
`,
        starter: md`#include <stdio.h>

int main() {
    int n, puntos;
    char nombre[30];
    scanf("%d", &n);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int n, puntos;
    char nombre[30];
    scanf("%d", &n);
    FILE *f = fopen("puntuaciones.txt", "w");
    if (f == NULL) {
        return 1;
    }
    for (int i = 0; i < n; i++) {
        scanf("%29s %d", nombre, &puntos);
        fprintf(f, "%s %d\n", nombre, puntos);
    }
    fclose(f);
    f = fopen("puntuaciones.txt", "a");
    fprintf(f, "FIN\n");
    fclose(f);
    printf("Guardados %d jugadores\n", n);
    char linea[100];
    f = fopen("puntuaciones.txt", "r");
    while (fgets(linea, sizeof(linea), f) != NULL) {
        printf("%s", linea);
    }
    fclose(f);
    return 0;
}
`,
        tests: [{ input: '3\nAna 1200\nLuis 980\nEva 1500\n' }, { input: '0\n' }],
        hints: ['FILE *f = fopen("puntuaciones.txt", "w"); y fprintf(f, "%s %d\\n", nombre, puntos);', 'Para añadir: fopen con "a".', 'Para leer línea a línea: while (fgets(linea, sizeof(linea), f) != NULL) printf("%s", linea);'],
        requires: [{ re: '\\bfopen\\s*\\(', msg: 'Abre el fichero con fopen.' }, { re: '\\bfprintf\\s*\\(', msg: 'Escribe en el fichero con fprintf.' }, { re: '\\bfclose\\s*\\(', msg: 'Cierra el fichero con fclose.' }],
      },
    },
    {
      id: 'fich-leer',
      title: 'Leer datos de un fichero',
      theory: md`
## fscanf y el final del fichero

\`fscanf(f, ...)\` lee del fichero igual que \`scanf\` del teclado. Devuelve cuántos datos ha leído, así que se puede leer **hasta que se acabe el fichero**:

\`\`\`c
#include <stdio.h>

int main() {
    FILE *f = fopen("notas.txt", "w");
    fprintf(f, "7.5\n9\n4.25\n");
    fclose(f);

    f = fopen("notas.txt", "r");
    double nota, suma = 0;
    int n = 0;
    while (fscanf(f, "%lf", &nota) == 1) {
        suma += nota;
        n++;
    }
    fclose(f);
    printf("%d notas, media %.2f\n", n, suma / n);
    return 0;
}
\`\`\`

Cuando no quedan datos, \`fscanf\` devuelve \`EOF\` (un número negativo), así que la condición \`== 1\` deja de cumplirse y el bucle termina.

> ⚠️ Comprueba siempre que \`fopen\` no devuelve \`NULL\` antes de leer: si el fichero no existe, el puntero es \`NULL\` y usarlo es un error.
`,
      exercise: {
        task: md`
Primero, el programa crea el fichero \`"ventas.txt"\` con los datos que lee del teclado: \`n\` y después \`n\` líneas \`producto unidades precio\`.

Después lo **vuelve a abrir para leer** y, usando \`fscanf\` hasta el final, calcula el total vendido (unidades × precio de cada línea) y el producto con más unidades. Escribe:

\`\`\`text
Total: T €          (2 decimales)
Más vendido: PRODUCTO
\`\`\`

Además, si intentas abrir \`"no_existe.txt"\` para leer, escribe \`El fichero no existe\` (hazlo al principio, para practicar la comprobación de \`NULL\`).
`,
        starter: md`#include <stdio.h>

int main() {

    return 0;
}
`,
        solution: md`#include <stdio.h>
#include <string.h>

int main() {
    FILE *prueba = fopen("no_existe.txt", "r");
    if (prueba == NULL) {
        printf("El fichero no existe\n");
    } else {
        fclose(prueba);
    }

    int n, unidades;
    double precio;
    char producto[30];
    scanf("%d", &n);
    FILE *f = fopen("ventas.txt", "w");
    for (int i = 0; i < n; i++) {
        scanf("%29s %d %lf", producto, &unidades, &precio);
        fprintf(f, "%s %d %.2f\n", producto, unidades, precio);
    }
    fclose(f);

    f = fopen("ventas.txt", "r");
    double total = 0;
    int maxUnidades = -1;
    char masVendido[30] = "";
    while (fscanf(f, "%29s %d %lf", producto, &unidades, &precio) == 3) {
        total += unidades * precio;
        if (unidades > maxUnidades) {
            maxUnidades = unidades;
            strcpy(masVendido, producto);
        }
    }
    fclose(f);
    printf("Total: %.2f €\n", total);
    printf("Más vendido: %s\n", masVendido);
    return 0;
}
`,
        tests: [{ input: '3\nCamiseta 10 12.5\nGorra 25 8\nSudadera 4 30\n' }, { input: '1\nTaza 3 5.99\n' }],
        hints: ['Para escribir el fichero: un for con scanf y fprintf.', 'Para leerlo: while (fscanf(f, "%29s %d %lf", producto, &unidades, &precio) == 3) { ... }', 'Para guardar el nombre del más vendido usa strcpy.'],
        requires: [{ re: '\\bfscanf\\s*\\(', msg: 'Lee el fichero con fscanf.' }],
      },
    },
    {
      id: 'fich-examen',
      title: 'Examen: ficheros',
      kind: 'examen',
      theory: md`
## ¡El último examen!

Si apruebas este, has completado todo el temario. Necesitas un **70 %**.
`,
      quiz: [
        { q: '¿Qué hace `fopen("datos.txt", "w")` si el fichero ya existe?', options: ['Añade al final', 'Lo borra y empieza vacío', 'Da error', 'Lo abre para leer'], answer: 1, explain: 'El modo "w" crea el fichero de cero. Para añadir se usa "a".' },
        { q: '¿Qué devuelve fopen si no puede abrir el fichero?', options: ['0', 'NULL', 'EOF', 'Un fichero vacío'], answer: 1, explain: 'Devuelve NULL; hay que comprobarlo.' },
        { q: '¿Cómo se escribe el número `x` en el fichero `f`?', options: ['`printf(f, "%d", x);`', '`fprintf(f, "%d", x);`', '`fprintf("%d", x, f);`', '`fwrite(x);`'], answer: 1, explain: 'fprintf lleva el fichero como primer argumento.' },
        { q: '¿Cuándo termina `while (fscanf(f, "%d", &x) == 1)`?', options: ['Nunca', 'Cuando no puede leer más números (fin del fichero)', 'Cuando x vale 0', 'Cuando x vale 1'], answer: 1, explain: 'fscanf devuelve 1 mientras lee un número.' },
        { q: '¿Para qué sirve fclose?', options: ['Para borrar el fichero', 'Para cerrarlo y asegurar que se guarda todo', 'Para leer la última línea', 'No hace falta nunca'], answer: 1, explain: 'Cierra el fichero y vuelca lo pendiente.' },
      ],
    },
  ],
};
