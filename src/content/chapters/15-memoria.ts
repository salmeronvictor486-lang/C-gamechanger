import { md, type Chapter } from '../types';

export const memoria: Chapter = {
  id: 'memoria',
  title: 'Memoria dinámica',
  subtitle: 'malloc, free, realloc y listas enlazadas',
  icon: '🧠',
  color: '#9b7bff',
  level: 3,
  lessons: [
    {
      id: 'mem-malloc',
      title: 'malloc y free',
      theory: md`
## Pedir memoria mientras el programa funciona

Hasta ahora, el tamaño de los arrays se decidía al escribir el programa (\`int v[100]\`). Pero ¿y si el usuario quiere guardar 3 datos… o 3 millones? Con \`malloc\` (de \`<stdlib.h>\`) el programa **pide memoria al sistema** mientras se ejecuta:

\`\`\`c entrada="4\n10 20 30 40"
#include <stdio.h>
#include <stdlib.h>

int main() {
    int n;
    printf("¿Cuántos números? ");
    scanf("%d", &n);
    int *v = malloc(n * sizeof(int));     // n enteros
    if (v == NULL) {
        printf("No hay memoria\n");
        return 1;
    }
    for (int i = 0; i < n; i++) {
        scanf("%d", &v[i]);                // se usa como un array normal
    }
    int suma = 0;
    for (int i = 0; i < n; i++) suma += v[i];
    printf("Suma: %d\n", suma);
    free(v);                               // ¡devolver la memoria!
    return 0;
}
\`\`\`

- \`malloc(bytes)\` reserva esos bytes y devuelve un **puntero** al principio. Por eso se multiplica por \`sizeof(tipo)\`.
- Si no hay memoria, devuelve \`NULL\`: compruébalo siempre.
- Con el puntero se trabaja **igual que con un array**: \`v[i]\`.
- \`free(v)\` **libera** la memoria cuando ya no la necesitas. Si no lo haces, hay una **fuga de memoria** (*memory leak*): el programa va acumulando memoria que no usa. Esta web te avisa si te olvidas.

> ⚠️ Después de \`free(v)\`, no vuelvas a usar \`v\`. Ni hagas \`free\` dos veces del mismo puntero.

> 💡 \`malloc\` no pone la memoria a 0. Si la quieres a cero, usa \`calloc(n, sizeof(int))\`.
`,
      exercise: {
        task: md`
Lee \`n\` y después \`n\` números decimales en memoria reservada con \`malloc\`. Escribe los que están **por encima de la media**, separados por espacios (con 1 decimal y un espacio después de cada uno), y libera la memoria.
`,
        starter: md`#include <stdio.h>
#include <stdlib.h>

int main() {
    int n;
    scanf("%d", &n);

    return 0;
}
`,
        solution: md`#include <stdio.h>
#include <stdlib.h>

int main() {
    int n;
    scanf("%d", &n);
    double *v = malloc(n * sizeof(double));
    if (v == NULL) {
        return 1;
    }
    double suma = 0;
    for (int i = 0; i < n; i++) {
        scanf("%lf", &v[i]);
        suma += v[i];
    }
    double media = suma / n;
    for (int i = 0; i < n; i++) {
        if (v[i] > media) {
            printf("%.1f ", v[i]);
        }
    }
    printf("\n");
    free(v);
    return 0;
}
`,
        tests: [{ input: '5\n1 2 3 4 5\n' }, { input: '3\n7.5 7.5 7.5\n' }, { input: '6\n10 -2 3.5 8 0 4\n' }],
        hints: ['double *v = malloc(n * sizeof(double));', 'Usa v[i] como un array normal.', 'Al final, free(v);'],
        requires: [{ re: '\\bmalloc\\s*\\(', msg: 'Reserva la memoria con malloc.' }, { re: '\\bfree\\s*\\(', msg: 'Libera la memoria con free.' }],
      },
    },
    {
      id: 'mem-realloc',
      title: 'Crecer con realloc',
      theory: md`
## Cuando no sabes cuántos datos vendrán

\`realloc(p, nuevo_tamaño)\` cambia el tamaño de un bloque reservado con malloc: si hace falta, lo mueve a otro sitio **copiando** los datos, y devuelve el nuevo puntero.

La técnica típica es empezar con poca capacidad y **doblarla** cuando se llena:

\`\`\`c entrada="5 8 13 21 34 55 89 0"
#include <stdio.h>
#include <stdlib.h>

int main() {
    int capacidad = 2, n = 0, x;
    int *v = malloc(capacidad * sizeof(int));
    scanf("%d", &x);
    while (x != 0) {
        if (n == capacidad) {
            capacidad *= 2;
            v = realloc(v, capacidad * sizeof(int));
            printf("(ahora caben %d)\n", capacidad);
        }
        v[n] = x;
        n++;
        scanf("%d", &x);
    }
    printf("Has escrito %d números. El último: %d\n", n, v[n - 1]);
    free(v);
    return 0;
}
\`\`\`

Así funcionan por dentro las listas de muchos lenguajes (los \`vector\` de C++ o las listas de Python).
`,
      exercise: {
        task: md`
Lee números enteros hasta el \`0\` guardándolos en memoria dinámica que crece con \`realloc\` (empieza con capacidad 4 y dóblala cuando se llene). Después escríbelos **en orden inverso** (separados por espacios, con un espacio después de cada uno) y en otra línea \`Capacidad final: C\`. Libera la memoria.
`,
        starter: md`#include <stdio.h>
#include <stdlib.h>

int main() {
    int capacidad = 4, n = 0, x;
    int *v = malloc(capacidad * sizeof(int));

    return 0;
}
`,
        solution: md`#include <stdio.h>
#include <stdlib.h>

int main() {
    int capacidad = 4, n = 0, x;
    int *v = malloc(capacidad * sizeof(int));
    scanf("%d", &x);
    while (x != 0) {
        if (n == capacidad) {
            capacidad *= 2;
            v = realloc(v, capacidad * sizeof(int));
        }
        v[n++] = x;
        scanf("%d", &x);
    }
    for (int i = n - 1; i >= 0; i--) {
        printf("%d ", v[i]);
    }
    printf("\nCapacidad final: %d\n", capacidad);
    free(v);
    return 0;
}
`,
        tests: [{ input: '1 2 3 0\n' }, { input: '1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 0\n' }, { input: '0\n', name: 'ninguno' }],
        hints: ['Antes de guardar, si n == capacidad: capacidad *= 2; v = realloc(v, capacidad * sizeof(int));', 'Guarda con v[n] = x; n++;'],
        requires: [{ re: '\\brealloc\\s*\\(', msg: 'Haz crecer la memoria con realloc.' }],
      },
    },
    {
      id: 'mem-cadenas',
      title: 'Cadenas dinámicas',
      theory: md`
## Textos del tamaño justo

Si lees nombres en un array de 100 pero miden 5 letras, desperdicias memoria. Una opción es leer en un array temporal y después **reservar justo lo necesario** (¡con 1 más para el \`'\0'\`!):

\`\`\`c entrada="Margarita"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    char temp[100];
    scanf("%99s", temp);
    char *nombre = malloc(strlen(temp) + 1);
    strcpy(nombre, temp);
    printf("%s ocupa %d bytes\n", nombre, (int)strlen(nombre) + 1);
    free(nombre);
    return 0;
}
\`\`\`

> ⚠️ El error clásico es \`malloc(strlen(temp))\`, sin el \`+ 1\`: el \`'\0'\` no cabe y se escribe fuera de la memoria reservada.
`,
      exercise: {
        task: md`
Escribe \`char *repetir(const char *s, int veces)\` que devuelva una **cadena nueva** (reservada con \`malloc\`) con \`s\` repetida \`veces\` veces. \`main\` lee una palabra y un número, escribe el resultado entre corchetes \`[...]\` y su longitud, y libera la memoria.

Ejemplo: \`ja 3\` → \`[jajaja] (6 letras)\`
`,
        starter: md`#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int main() {
    char palabra[50];
    int veces;
    scanf("%49s %d", palabra, &veces);

    return 0;
}
`,
        solution: md`#include <stdio.h>
#include <stdlib.h>
#include <string.h>

char *repetir(const char *s, int veces) {
    int largo = strlen(s);
    char *r = malloc(largo * veces + 1);
    r[0] = '\0';
    for (int i = 0; i < veces; i++) {
        strcat(r, s);
    }
    return r;
}

int main() {
    char palabra[50];
    int veces;
    scanf("%49s %d", palabra, &veces);
    char *r = repetir(palabra, veces);
    printf("[%s] (%d letras)\n", r, (int)strlen(r));
    free(r);
    return 0;
}
`,
        tests: [{ input: 'ja 3\n' }, { input: 'C 10\n' }, { input: 'hola 0\n', name: 'cero veces' }],
        hints: ['Reserva largo * veces + 1 bytes.', "Empieza con r[0] = '\\0'; y añade s con strcat las veces que toque.", 'En main, guarda el resultado en un char * y haz free al final.'],
        requires: [{ re: 'char\\s*\\*\\s*repetir\\s*\\(', msg: 'Crea la función char *repetir(const char *s, int veces).' }, { re: '\\bfree\\s*\\(', msg: 'Libera la cadena con free.' }],
      },
    },
    {
      id: 'mem-lista',
      title: 'Listas enlazadas',
      theory: md`
## Nodos que apuntan al siguiente

Una **lista enlazada** es una cadena de **nodos** reservados con malloc. Cada nodo guarda un dato y un **puntero al siguiente**. El último apunta a \`NULL\`:

\`\`\`text
cabeza → [ 3 | •] → [ 7 | •] → [ 1 | NULL]
\`\`\`

\`\`\`c
#include <stdio.h>
#include <stdlib.h>

typedef struct Nodo {
    int valor;
    struct Nodo *sig;           // un struct puede apuntar a otro de su tipo
} Nodo;

Nodo *insertarDelante(Nodo *cabeza, int valor) {
    Nodo *nuevo = malloc(sizeof(Nodo));
    nuevo->valor = valor;
    nuevo->sig = cabeza;        // el nuevo apunta al que era el primero
    return nuevo;               // y pasa a ser la cabeza
}

int main() {
    Nodo *lista = NULL;          // lista vacía
    lista = insertarDelante(lista, 1);
    lista = insertarDelante(lista, 7);
    lista = insertarDelante(lista, 3);
    for (Nodo *p = lista; p != NULL; p = p->sig) {
        printf("%d -> ", p->valor);
    }
    printf("NULL\n");
    while (lista != NULL) {      // liberar nodo a nodo
        Nodo *siguiente = lista->sig;
        free(lista);
        lista = siguiente;
    }
    return 0;
}
\`\`\`

Ventaja: insertar o borrar al principio es instantáneo, sin mover nada. Inconveniente: para llegar al elemento 1000 hay que recorrer los 999 anteriores.
`,
      exercise: {
        task: md`
Lee números hasta el \`0\` y guárdalos en una lista enlazada **insertando al final** (para que queden en el orden en que se escribieron). Escribe la lista como \`a -> b -> c -> NULL\`, en otra línea \`Suma: S\`, y libera todos los nodos.

Para insertar al final sin recorrer la lista cada vez, guarda también un puntero al **último** nodo.
`,
        starter: md`#include <stdio.h>
#include <stdlib.h>

typedef struct Nodo {
    int valor;
    struct Nodo *sig;
} Nodo;

int main() {
    Nodo *cabeza = NULL, *ultimo = NULL;
    int x;

    return 0;
}
`,
        solution: md`#include <stdio.h>
#include <stdlib.h>

typedef struct Nodo {
    int valor;
    struct Nodo *sig;
} Nodo;

int main() {
    Nodo *cabeza = NULL, *ultimo = NULL;
    int x;
    scanf("%d", &x);
    while (x != 0) {
        Nodo *nuevo = malloc(sizeof(Nodo));
        nuevo->valor = x;
        nuevo->sig = NULL;
        if (cabeza == NULL) {
            cabeza = nuevo;
        } else {
            ultimo->sig = nuevo;
        }
        ultimo = nuevo;
        scanf("%d", &x);
    }
    int suma = 0;
    for (Nodo *p = cabeza; p != NULL; p = p->sig) {
        printf("%d -> ", p->valor);
        suma += p->valor;
    }
    printf("NULL\nSuma: %d\n", suma);
    while (cabeza != NULL) {
        Nodo *s = cabeza->sig;
        free(cabeza);
        cabeza = s;
    }
    return 0;
}
`,
        tests: [{ input: '3 7 1 0\n' }, { input: '0\n', name: 'vacía' }, { input: '5 0\n' }],
        hints: ['Cada nodo nuevo: malloc, valor = x, sig = NULL.', 'Si la lista está vacía (cabeza == NULL), el nuevo es la cabeza; si no, ultimo->sig = nuevo. En los dos casos, ultimo = nuevo.', 'Para liberar, guarda el siguiente antes de hacer free del actual.'],
        requires: [{ re: '\\bfree\\s*\\(', msg: 'Libera los nodos con free.' }],
      },
    },
    {
      id: 'mem-proyecto',
      title: 'Proyecto: lista de tareas',
      kind: 'proyecto',
      theory: md`
## Un gestor de tareas

Combina structs, memoria dinámica y un menú: una lista de tareas que crece con \`realloc\`, donde se pueden añadir tareas, marcarlas como hechas y listarlas.

Para leer el título con espacios después de leer la opción con scanf, recuerda limpiar el Enter: \`scanf(" %[^\n]", texto)\` lee hasta el final de la línea saltándose los espacios del principio.
`,
      exercise: {
        task: md`
Cada tarea tiene \`char titulo[50]\` e \`int hecha\`. Guarda las tareas en un array dinámico (empieza con capacidad 2 y dóblalo con \`realloc\`). Menú:

\`\`\`text
1) Añadir 2) Completar 3) Listar 0) Salir
Opción:
\`\`\`

- **1**: lee el título (puede tener espacios: \`scanf(" %49[^\n]", ...)\`). Escribe \`Tarea N añadida\` (N desde 1).
- **2**: lee un número de tarea; si existe, la marca como hecha y escribe \`Tarea N completada\`; si no, \`No existe esa tarea\`.
- **3**: cada tarea como \`N. [x] TITULO\` (hecha) o \`N. [ ] TITULO\` (pendiente), y al final \`Pendientes: P\`.
- **0**: libera la memoria y escribe \`Adiós\`.
`,
        starter: md`#include <stdio.h>
#include <stdlib.h>

typedef struct {
    char titulo[50];
    int hecha;
} Tarea;

int main() {
    int capacidad = 2, n = 0, opcion;
    Tarea *tareas = malloc(capacidad * sizeof(Tarea));

    return 0;
}
`,
        solution: md`#include <stdio.h>
#include <stdlib.h>

typedef struct {
    char titulo[50];
    int hecha;
} Tarea;

int main() {
    int capacidad = 2, n = 0, opcion, k;
    Tarea *tareas = malloc(capacidad * sizeof(Tarea));
    do {
        printf("1) Añadir 2) Completar 3) Listar 0) Salir\nOpción: ");
        scanf("%d", &opcion);
        switch (opcion) {
            case 1:
                if (n == capacidad) {
                    capacidad *= 2;
                    tareas = realloc(tareas, capacidad * sizeof(Tarea));
                }
                scanf(" %49[^\n]", tareas[n].titulo);
                tareas[n].hecha = 0;
                n++;
                printf("Tarea %d añadida\n", n);
                break;
            case 2:
                scanf("%d", &k);
                if (k >= 1 && k <= n) {
                    tareas[k - 1].hecha = 1;
                    printf("Tarea %d completada\n", k);
                } else {
                    printf("No existe esa tarea\n");
                }
                break;
            case 3: {
                int pendientes = 0;
                for (int i = 0; i < n; i++) {
                    printf("%d. [%c] %s\n", i + 1, tareas[i].hecha ? 'x' : ' ', tareas[i].titulo);
                    if (!tareas[i].hecha) pendientes++;
                }
                printf("Pendientes: %d\n", pendientes);
                break;
            }
            case 0:
                free(tareas);
                printf("Adiós\n");
                break;
        }
    } while (opcion != 0);
    return 0;
}
`,
        tests: [
          { input: '1\nHacer los deberes de C\n1\nComprar pan\n1\nLlamar a la abuela\n2\n2\n3\n2\n9\n0\n' },
          { input: '3\n0\n', name: 'sin tareas' },
        ],
        hints: ['Antes de añadir, si n == capacidad, dobla con realloc.', 'scanf(" %49[^\\n]", tareas[n].titulo); lee la línea entera.', "Para la marca: printf(\"[%c]\", tareas[i].hecha ? 'x' : ' ');"],
        requires: [{ re: '\\brealloc\\s*\\(', msg: 'Haz crecer el array con realloc.' }, { re: '\\bfree\\s*\\(', msg: 'Libera la memoria al salir.' }],
      },
    },
    {
      id: 'mem-examen',
      title: 'Examen: memoria dinámica',
      kind: 'examen',
      theory: md`
## Examen de memoria dinámica

Necesitas un **70 %**.
`,
      quiz: [
        { q: '¿Cuánta memoria reserva `malloc(10 * sizeof(int))`?', options: ['10 bytes', '40 bytes (con int de 4 bytes)', '10 enteros… o sea, 10 bytes', '4 bytes'], answer: 1, explain: '10 enteros de 4 bytes = 40 bytes.' },
        { q: '¿Qué devuelve malloc si no hay memoria?', options: ['0 bytes', 'NULL', '-1', 'Se cierra el programa'], answer: 1, explain: 'Devuelve NULL: hay que comprobarlo.' },
        { q: '¿Qué es una fuga de memoria?', options: ['Usar memoria ya liberada', 'Reservar memoria y no liberarla nunca', 'Salirse de un array', 'Un puntero NULL'], answer: 1, explain: 'La memoria queda ocupada sin uso.' },
        { q: '¿Qué tiene de malo `char *s = malloc(strlen(t)); strcpy(s, t);`?', options: ['Nada', "Falta un byte para el '\\0'", 'strcpy no funciona con malloc', 'Hay que usar calloc'], answer: 1, explain: "Hay que reservar strlen(t) + 1." },
        { q: '¿Qué pasa si haces `free(p)` y luego `*p = 5;`?', options: ['Funciona bien', 'Es un error: usas memoria liberada', 'p vuelve a reservarse', 'Se libera dos veces'], answer: 1, explain: 'Tras free, la memoria ya no es tuya.' },
      ],
    },
  ],
};
