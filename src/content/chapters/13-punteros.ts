import { md, type Chapter } from '../types';

export const punteros: Chapter = {
  id: 'punteros',
  title: 'Punteros',
  subtitle: 'Direcciones de memoria, paso por referencia y aritmética de punteros',
  icon: '👉',
  color: '#ff7eb6',
  level: 3,
  lessons: [
    {
      id: 'ptr-direcciones',
      title: 'Direcciones y punteros',
      theory: md`
## Cada variable vive en una dirección

La memoria del ordenador es como una calle muy larga de casillas numeradas. Cada variable ocupa unas casillas, y el número de la primera es su **dirección**. Con \`&\` obtienes la dirección de una variable (¡por eso scanf lleva \`&\`!):

\`\`\`c
#include <stdio.h>

int main() {
    int edad = 15;
    printf("Valor: %d\n", edad);
    printf("Dirección: %p\n", (void *)&edad);
    return 0;
}
\`\`\`

## Punteros

Un **puntero** es una variable que guarda una **dirección**. Se declara con \`*\`:

\`\`\`c
#include <stdio.h>

int main() {
    int x = 10;
    int *p = &x;         // p "apunta a" x

    printf("x vale %d\n", x);
    printf("*p vale %d\n", *p);   // * = "lo que hay donde apunta p"

    *p = 25;              // cambia x a través de p
    printf("Ahora x vale %d\n", x);
    return 0;
}
\`\`\`

| Escribes | Significa |
|---|---|
| \`int *p;\` | \`p\` es un puntero a \`int\` |
| \`p = &x;\` | \`p\` guarda la dirección de \`x\` |
| \`*p\` | el valor al que apunta \`p\` (aquí, \`x\`) |
| \`*p = 5;\` | guarda 5 donde apunta \`p\` (cambia \`x\`) |

> 💡 Piensa en \`&\` como "**la dirección de**" y en \`*\` como "**lo que hay en**".

> ⚠️ Un puntero sin inicializar apunta a cualquier sitio. Usarlo es un error grave. Si todavía no apunta a nada, ponle \`NULL\`: \`int *p = NULL;\`
`,
      exercise: {
        task: md`
Declara \`int a = 3, b = 8;\` y un puntero \`int *p\`. Usando **solo el puntero** para cambiar los valores (nada de \`a = ...\` ni \`b = ...\` después de declararlas):

1. Haz que \`p\` apunte a \`a\` y multiplica \`a\` por 10 a través de \`p\`.
2. Haz que \`p\` apunte a \`b\` y súmale 1 a través de \`p\`.
3. Escribe \`a = 30, b = 9\`.
`,
        starter: md`#include <stdio.h>

int main() {
    int a = 3, b = 8;
    int *p;

    printf("a = %d, b = %d\n", a, b);
    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    int a = 3, b = 8;
    int *p;
    p = &a;
    *p = *p * 10;
    p = &b;
    *p = *p + 1;
    printf("a = %d, b = %d\n", a, b);
    return 0;
}
`,
        tests: [{ output: 'a = 30, b = 9\n' }],
        hints: ['p = &a; hace que p apunte a a.', '*p = *p * 10; multiplica lo que hay donde apunta p.'],
        requires: [{ re: 'p\\s*=\\s*&\\s*a', msg: 'Haz que p apunte a a con p = &a;' }, { re: 'p\\s*=\\s*&\\s*b', msg: 'Haz que p apunte a b con p = &b;' }],
        forbids: [{ re: '(?<!int\\s)(?<!,\\s)(?<!")\\b(a|b)\\s*(=\\s*[^=\\s%]|\\+=|\\*=|\\+\\+)', msg: 'Cambia a y b solo a través del puntero (*p).' }],
      },
    },
    {
      id: 'ptr-referencia',
      title: 'Paso por referencia',
      theory: md`
## Funciones que cambian variables de fuera

En el capítulo de funciones viste que los parámetros son **copias**: una función no puede cambiar las variables de quien la llama… a no ser que reciba su **dirección**. Eso se llama **paso por referencia**:

\`\`\`c
#include <stdio.h>

void intercambiar(int *a, int *b) {
    int aux = *a;
    *a = *b;
    *b = aux;
}

int main() {
    int x = 1, y = 2;
    intercambiar(&x, &y);           // pasamos las direcciones
    printf("x = %d, y = %d\n", x, y);
    return 0;
}
\`\`\`

- El parámetro es un puntero: \`int *a\`.
- Al llamar se pasa la dirección: \`&x\`.
- Dentro se trabaja con \`*a\`.

¡Ahora entiendes \`scanf("%d", &x)\`! scanf necesita la dirección para poder **cambiar** \`x\`.
`,
      exercise: {
        task: md`
Escribe \`void ordenar3(int *a, int *b, int *c)\` que deje los tres valores **ordenados de menor a mayor** (\`*a\` el menor, \`*c\` el mayor). Puedes escribir y usar una función \`intercambiar\`. \`main\` lee tres números, llama a \`ordenar3\` y escribe \`a b c\` ordenados (separados por espacios).
`,
        starter: md`#include <stdio.h>

int main() {
    int a, b, c;
    scanf("%d %d %d", &a, &b, &c);

    printf("%d %d %d\n", a, b, c);
    return 0;
}
`,
        solution: md`#include <stdio.h>

void intercambiar(int *x, int *y) {
    int aux = *x;
    *x = *y;
    *y = aux;
}

void ordenar3(int *a, int *b, int *c) {
    if (*a > *b) intercambiar(a, b);
    if (*b > *c) intercambiar(b, c);
    if (*a > *b) intercambiar(a, b);
}

int main() {
    int a, b, c;
    scanf("%d %d %d", &a, &b, &c);
    ordenar3(&a, &b, &c);
    printf("%d %d %d\n", a, b, c);
    return 0;
}
`,
        tests: [{ input: '3 1 2\n' }, { input: '1 2 3\n' }, { input: '9 5 -4\n' }, { input: '2 3 1\n' }, { input: '7 7 1\n' }],
        hints: ['Tres comparaciones bastan: (a,b), luego (b,c) y otra vez (a,b), intercambiando si están desordenados.', 'Dentro de ordenar3, a ya es un puntero: llama intercambiar(a, b) sin &.', 'En main: ordenar3(&a, &b, &c);'],
        requires: [{ re: 'void\\s+ordenar3\\s*\\(\\s*int\\s*\\*', msg: 'Crea void ordenar3(int *a, int *b, int *c).' }],
      },
    },
    {
      id: 'ptr-varios',
      title: 'Devolver varios resultados',
      theory: md`
## Más de un return

Una función solo puede devolver un valor con \`return\`. Si necesitas devolver varios (el mínimo **y** el máximo, el cociente **y** el resto…), pasa **punteros** donde la función deje los resultados:

\`\`\`c
#include <stdio.h>

void dividir(int a, int b, int *cociente, int *resto) {
    *cociente = a / b;
    *resto = a % b;
}

int main() {
    int c, r;
    dividir(17, 5, &c, &r);
    printf("17 / 5 = %d y sobran %d\n", c, r);
    return 0;
}
\`\`\`

Se llaman **parámetros de salida**. Es lo que hace scanf: devuelve en tus variables lo que lee.
`,
      exercise: {
        task: md`
Escribe \`void estadisticas(int v[], int n, int *min, int *max, double *media)\` que calcule las tres cosas de una vez. \`main\` lee \`n\` (máximo 100) y \`n\` números, llama a la función y escribe:

\`\`\`text
Mínimo: X
Máximo: Y
Media: Z      (2 decimales)
\`\`\`
`,
        starter: md`#include <stdio.h>
#define MAX 100

int main() {
    int v[MAX], n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &v[i]);
    }

    return 0;
}
`,
        solution: md`#include <stdio.h>
#define MAX 100

void estadisticas(int v[], int n, int *min, int *max, double *media) {
    int suma = 0;
    *min = v[0];
    *max = v[0];
    for (int i = 0; i < n; i++) {
        if (v[i] < *min) *min = v[i];
        if (v[i] > *max) *max = v[i];
        suma += v[i];
    }
    *media = (double)suma / n;
}

int main() {
    int v[MAX], n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &v[i]);
    }
    int mn, mx;
    double med;
    estadisticas(v, n, &mn, &mx, &med);
    printf("Mínimo: %d\n", mn);
    printf("Máximo: %d\n", mx);
    printf("Media: %.2f\n", med);
    return 0;
}
`,
        tests: [{ input: '5\n4 8 -2 10 5\n' }, { input: '1\n7\n' }, { input: '4\n3 3 3 4\n' }],
        hints: ['Dentro de la función, escribe los resultados con *min = ..., *max = ..., *media = ...', 'En main declara int mn, mx; double med; y llama estadisticas(v, n, &mn, &mx, &med);'],
        requires: [{ re: 'void\\s+estadisticas\\s*\\(', msg: 'Crea la función estadisticas.' }],
      },
    },
    {
      id: 'ptr-arrays',
      title: 'Punteros y arrays',
      theory: md`
## El nombre de un array es un puntero

El nombre de un array, usado solo, es la **dirección de su primer elemento**: \`v\` es lo mismo que \`&v[0]\`. Por eso a scanf no le hace falta \`&\` con los arrays de char, y por eso las funciones pueden cambiar los arrays.

## Aritmética de punteros

Si \`p\` apunta a un elemento de un array, \`p + 1\` apunta al **siguiente** (C ya sabe cuántos bytes saltar según el tipo). Y \`*(p + i)\` es lo mismo que \`p[i]\`:

\`\`\`c
#include <stdio.h>

int main() {
    int v[5] = {10, 20, 30, 40, 50};
    int *p = v;                      // igual que &v[0]
    printf("%d %d %d\n", *p, *(p + 2), p[4]);
    p++;                             // ahora apunta a v[1]
    printf("%d\n", *p);
    for (int *q = v; q < v + 5; q++) {   // recorrer con un puntero
        printf("%d ", *q);
    }
    printf("\n");
    printf("Distancia: %d elementos\n", (int)(p - v));
    return 0;
}
\`\`\`

| Expresión | Significa |
|---|---|
| \`v\` | \`&v[0]\` |
| \`v + i\` | \`&v[i]\` |
| \`*(v + i)\` | \`v[i]\` |
| \`q - p\` | cuántos elementos hay entre dos punteros |
`,
      exercise: {
        task: md`
Escribe \`int sumaPares(int *inicio, int *fin)\` que sume los números **pares** desde \`inicio\` hasta **antes** de \`fin\`, recorriendo **con un puntero** (sin usar corchetes \`[]\` dentro de la función). \`main\` lee 8 números y escribe \`Suma de pares: X\` llamando a \`sumaPares(v, v + 8)\`, y \`Mitad derecha: Y\` llamando a \`sumaPares(v + 4, v + 8)\`.
`,
        starter: md`#include <stdio.h>

int main() {
    int v[8];
    for (int i = 0; i < 8; i++) {
        scanf("%d", &v[i]);
    }

    return 0;
}
`,
        solution: md`#include <stdio.h>

int sumaPares(int *inicio, int *fin) {
    int suma = 0;
    for (int *p = inicio; p < fin; p++) {
        if (*p % 2 == 0) {
            suma += *p;
        }
    }
    return suma;
}

int main() {
    int v[8];
    for (int i = 0; i < 8; i++) {
        scanf("%d", &v[i]);
    }
    printf("Suma de pares: %d\n", sumaPares(v, v + 8));
    printf("Mitad derecha: %d\n", sumaPares(v + 4, v + 8));
    return 0;
}
`,
        tests: [{ input: '1 2 3 4 5 6 7 8\n' }, { input: '2 2 2 2 1 1 1 1\n' }, { input: '-4 3 0 7 10 11 12 13\n' }],
        hints: ['for (int *p = inicio; p < fin; p++) { ... *p ... }', 'Dentro del bucle, *p es el número actual.'],
        requires: [{ re: 'int\\s+sumaPares\\s*\\(\\s*int\\s*\\*', msg: 'Crea int sumaPares(int *inicio, int *fin).' }],
      },
    },
    {
      id: 'ptr-cadenas',
      title: 'Punteros y cadenas',
      theory: md`
## Recorrer una cadena con un puntero

Una cadena es un array de char, así que se puede recorrer con un \`char *\` hasta llegar al \`'\0'\`. Es el estilo de las funciones de la biblioteca:

\`\`\`c
#include <stdio.h>

int miStrlen(const char *s) {
    const char *p = s;
    while (*p != '\0') {
        p++;
    }
    return p - s;            // cuántos ha avanzado
}

void aMayusculas(char *s) {
    for (; *s; s++) {        // *s es falso cuando llega al '\0'
        if (*s >= 'a' && *s <= 'z') {
            *s = *s - 'a' + 'A';
        }
    }
}

int main() {
    char texto[] = "punteros y cadenas";
    printf("%d\n", miStrlen(texto));
    aMayusculas(texto);
    printf("%s\n", texto);
    return 0;
}
\`\`\`

- \`const char *s\` promete que la función **no cambiará** la cadena.
- \`while (*p)\` es lo mismo que \`while (*p != '\0')\`.

> ⚠️ \`char *s = "hola";\` apunta a un texto **de solo lectura**: no puedes cambiar sus letras. Si necesitas modificarlo, usa un array: \`char s[] = "hola";\`
`,
      exercise: {
        task: md`
Escribe \`int contarCaracter(const char *s, char c)\` que cuente cuántas veces aparece \`c\` en \`s\`, recorriendo con un puntero. Escribe también \`void reemplazar(char *s, char viejo, char nuevo)\`.

\`main\` lee una palabra (máximo 99 letras) y dos caracteres, escribe \`La letra X aparece N veces\`, reemplaza la primera letra por la segunda en toda la palabra y la escribe.
`,
        starter: md`#include <stdio.h>

int main() {
    char palabra[100];
    char viejo, nuevo;
    scanf("%99s %c %c", palabra, &viejo, &nuevo);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int contarCaracter(const char *s, char c) {
    int n = 0;
    while (*s) {
        if (*s == c) {
            n++;
        }
        s++;
    }
    return n;
}

void reemplazar(char *s, char viejo, char nuevo) {
    for (; *s; s++) {
        if (*s == viejo) {
            *s = nuevo;
        }
    }
}

int main() {
    char palabra[100];
    char viejo, nuevo;
    scanf("%99s %c %c", palabra, &viejo, &nuevo);
    printf("La letra %c aparece %d veces\n", viejo, contarCaracter(palabra, viejo));
    reemplazar(palabra, viejo, nuevo);
    printf("%s\n", palabra);
    return 0;
}
`,
        tests: [{ input: 'banana a o\n' }, { input: 'programacion x y\n' }, { input: 'aaaa a b\n' }],
        hints: ['while (*s) { if (*s == c) n++; s++; }', 'reemplazar es igual pero cambiando *s = nuevo cuando *s == viejo.'],
        requires: [{ re: 'int\\s+contarCaracter\\s*\\(\\s*const\\s+char\\s*\\*', msg: 'Crea int contarCaracter(const char *s, char c).' }],
      },
    },
    {
      id: 'ptr-proyecto',
      title: 'Proyecto: tus funciones de cadenas',
      kind: 'proyecto',
      theory: md`
## Reinventar la rueda (para entenderla)

Las funciones de \`<string.h>\` no son magia: se escriben con punteros en unas pocas líneas. Escribir las tuyas es el mejor ejercicio de punteros.

\`\`\`c norun
char *strcpy(char *dest, const char *src) {
    char *inicio = dest;
    while (*src) {
        *dest = *src;
        dest++;
        src++;
    }
    *dest = '\0';
    return inicio;
}
\`\`\`
`,
      exercise: {
        task: md`
Escribe, **sin usar \`string.h\`** y recorriendo con punteros:

- \`void miStrcpy(char *dest, const char *src)\`
- \`void miStrcat(char *dest, const char *src)\` (avanza hasta el final de \`dest\` y copia ahí)
- \`int miStrcmp(const char *a, const char *b)\`: 0 si son iguales, negativo si \`a\` va antes, positivo si va después (devuelve la resta de los primeros caracteres distintos).

\`main\` lee dos palabras (máximo 49 letras cada una) y escribe:

\`\`\`text
Comparación: menor / igual / mayor
Unidas: palabra1palabra2
\`\`\`

(\`menor\` si la primera va antes en el diccionario, según \`miStrcmp\`). Para unirlas, copia la primera en un array de 100 con \`miStrcpy\` y añade la segunda con \`miStrcat\`.
`,
        starter: md`#include <stdio.h>

int main() {
    char a[50], b[50], unidas[100];
    scanf("%49s %49s", a, b);

    return 0;
}
`,
        solution: md`#include <stdio.h>

void miStrcpy(char *dest, const char *src) {
    while (*src) {
        *dest = *src;
        dest++;
        src++;
    }
    *dest = '\0';
}

void miStrcat(char *dest, const char *src) {
    while (*dest) {
        dest++;
    }
    miStrcpy(dest, src);
}

int miStrcmp(const char *a, const char *b) {
    while (*a && *a == *b) {
        a++;
        b++;
    }
    return *a - *b;
}

int main() {
    char a[50], b[50], unidas[100];
    scanf("%49s %49s", a, b);
    int c = miStrcmp(a, b);
    printf("Comparación: %s\n", c < 0 ? "menor" : (c == 0 ? "igual" : "mayor"));
    miStrcpy(unidas, a);
    miStrcat(unidas, b);
    printf("Unidas: %s\n", unidas);
    return 0;
}
`,
        tests: [{ input: 'gato perro\n' }, { input: 'sol sol\n' }, { input: 'zapato zapatilla\n' }, { input: 'ab abc\n' }],
        hints: ['miStrcpy: copia carácter a carácter con un while y al final pon *dest = \'\\0\';', 'miStrcat: avanza dest hasta su \\0 y después llama a miStrcpy(dest, src).', 'miStrcmp: avanza mientras los dos sean iguales y no se acabe a; devuelve *a - *b.'],
        forbids: [{ re: '#\\s*include\\s*<string\\.h>', msg: 'Hazlo sin string.h.' }],
      },
    },
    {
      id: 'ptr-examen',
      title: 'Examen: punteros',
      kind: 'examen',
      theory: md`
## El examen más temido de C

Tranquilo, ¡ya lo dominas! Necesitas un **70 %**.
`,
      quiz: [
        { q: 'Si `int x = 5; int *p = &x;`, ¿qué vale `*p`?', options: ['La dirección de x', '5', 'p', '0'], answer: 1, explain: '*p es el valor al que apunta p: x, que vale 5.' },
        { q: '¿Qué escribe?', code: 'int a = 1;\nint *p = &a;\n*p = *p + 4;\nprintf("%d", a);', options: ['1', '4', '5', 'Una dirección'], answer: 2, explain: 'Cambiar *p es cambiar a: 1 + 4 = 5.' },
        { q: '¿Cómo se llama a `void f(int *x)` para que cambie la variable `n`?', options: ['`f(n);`', '`f(&n);`', '`f(*n);`', '`f(n*);`'], answer: 1, explain: 'Hay que pasar la dirección de n.' },
        { q: 'Con `int v[4] = {2, 4, 6, 8}; int *p = v + 1;`, ¿qué vale `*(p + 2)`?', options: ['6', '8', '4', 'Error'], answer: 1, explain: 'p apunta a v[1]; p + 2 apunta a v[3], que vale 8.' },
        { q: '¿Qué es `NULL`?', options: ['El número 1', 'Un puntero que no apunta a nada', 'Una cadena vacía', 'Un error'], answer: 1, explain: 'NULL indica que el puntero no apunta a ningún sitio válido.' },
        { q: '¿Por qué `scanf("%s", nombre)` no lleva & si `nombre` es `char nombre[20]`?', options: ['Es un error', 'Porque el nombre del array ya es una dirección', 'Porque %s no lo necesita nunca', 'Porque es char'], answer: 1, explain: 'nombre equivale a &nombre[0].' },
      ],
    },
  ],
};
