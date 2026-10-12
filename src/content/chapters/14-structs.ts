import { md, type Chapter } from '../types';

export const structs: Chapter = {
  id: 'structs',
  title: 'Estructuras',
  subtitle: 'Agrupar datos: struct, typedef, arrays de structs y ->',
  icon: '🏗️',
  color: '#3ddc97',
  level: 3,
  lessons: [
    {
      id: 'st-intro',
      title: 'struct: datos que van juntos',
      theory: md`
## Un tipo hecho por ti

Un alumno tiene nombre, edad y nota. Un punto tiene \`x\` e \`y\`. Un \`struct\` (estructura) agrupa **varios datos de distinto tipo** bajo un solo nombre:

\`\`\`c
#include <stdio.h>

struct Punto {
    int x;
    int y;
};                          // ¡ojo al punto y coma!

int main() {
    struct Punto p;
    p.x = 3;
    p.y = 4;
    struct Punto q = {10, -2};      // inicializar en orden
    printf("p = (%d, %d)\n", p.x, p.y);
    printf("q = (%d, %d)\n", q.x, q.y);
    q = p;                           // los structs sí se pueden copiar con =
    printf("q = (%d, %d)\n", q.x, q.y);
    return 0;
}
\`\`\`

- \`struct Punto { ... };\` **define** el tipo (fuera de las funciones, normalmente arriba).
- \`struct Punto p;\` crea una variable de ese tipo.
- Cada dato es un **campo** (o miembro) y se usa con un **punto**: \`p.x\`.

> 💡 Un struct es como una ficha con varios apartados. Te permite pensar en "un alumno" en vez de en tres variables sueltas.
`,
      exercise: {
        task: md`
Define \`struct Punto { double x; double y; };\`. Lee dos puntos (cuatro números: x1 y1 x2 y2) y escribe la **distancia** entre ellos (\`√((x2−x1)² + (y2−y1)²)\`) y su **punto medio**, con 2 decimales:

\`\`\`text
Distancia: D
Punto medio: (X, Y)
\`\`\`
`,
        starter: md`#include <stdio.h>
#include <math.h>

int main() {

    return 0;
}
`,
        solution: md`#include <stdio.h>
#include <math.h>

struct Punto {
    double x;
    double y;
};

int main() {
    struct Punto a, b;
    scanf("%lf %lf %lf %lf", &a.x, &a.y, &b.x, &b.y);
    double dx = b.x - a.x;
    double dy = b.y - a.y;
    struct Punto medio = {(a.x + b.x) / 2, (a.y + b.y) / 2};
    printf("Distancia: %.2f\n", sqrt(dx * dx + dy * dy));
    printf("Punto medio: (%.2f, %.2f)\n", medio.x, medio.y);
    return 0;
}
`,
        tests: [{ input: '0 0 3 4\n' }, { input: '-1 2.5 4 -3\n' }, { input: '1 1 1 1\n' }],
        hints: ['Se lee un campo con &: scanf("%lf", &a.x);', 'dx = b.x - a.x; distancia = sqrt(dx*dx + dy*dy)'],
        requires: [{ re: 'struct\\s+Punto\\s*\\{', msg: 'Define struct Punto con x e y.' }],
      },
    },
    {
      id: 'st-typedef',
      title: 'typedef',
      theory: md`
## Nombres más cortos

Escribir \`struct Alumno\` cada vez es largo. Con \`typedef\` le das un nombre nuevo a un tipo:

\`\`\`c
#include <stdio.h>
#include <string.h>

typedef struct {
    char nombre[30];
    int edad;
    double nota;
} Alumno;

int main() {
    Alumno a = {"Lucía", 16, 8.75};
    Alumno b;
    strcpy(b.nombre, "Hugo");        // las cadenas, con strcpy
    b.edad = 17;
    b.nota = 6.5;
    printf("%s (%d años): %.2f\n", a.nombre, a.edad, a.nota);
    printf("%s (%d años): %.2f\n", b.nombre, b.edad, b.nota);
    return 0;
}
\`\`\`

Ahora el tipo se llama simplemente \`Alumno\`. Es la forma más habitual de trabajar con structs en C.

> ⚠️ Un campo de texto es un array de char: no se puede asignar con \`=\` (\`b.nombre = "Hugo"\` da error). Usa \`strcpy\`, o léelo con \`scanf("%s", b.nombre)\`.
`,
      exercise: {
        task: md`
Define con \`typedef\` el tipo \`Producto\` con \`char nombre[40]\`, \`double precio\` e \`int unidades\`. Lee un producto (nombre de una palabra, precio y unidades) y escribe una ficha:

\`\`\`text
Producto: NOMBRE
Precio: P €      (2 decimales)
Stock: U unidades
Valor del stock: V €     (precio × unidades, 2 decimales)
\`\`\`
`,
        starter: md`#include <stdio.h>

int main() {

    return 0;
}
`,
        solution: md`#include <stdio.h>

typedef struct {
    char nombre[40];
    double precio;
    int unidades;
} Producto;

int main() {
    Producto p;
    scanf("%39s %lf %d", p.nombre, &p.precio, &p.unidades);
    printf("Producto: %s\n", p.nombre);
    printf("Precio: %.2f €\n", p.precio);
    printf("Stock: %d unidades\n", p.unidades);
    printf("Valor del stock: %.2f €\n", p.precio * p.unidades);
    return 0;
}
`,
        tests: [{ input: 'Teclado 24.99 12\n' }, { input: 'Lapiz 0.5 300\n' }],
        hints: ['typedef struct { ...campos... } Producto;', 'scanf("%39s %lf %d", p.nombre, &p.precio, &p.unidades); (el nombre sin &)'],
        requires: [{ re: '}\\s*Producto\\s*;', msg: 'Define el tipo Producto con typedef struct { ... } Producto;' }],
      },
    },
    {
      id: 'st-arrays',
      title: 'Arrays de structs',
      theory: md`
## Una lista de fichas

Un array de structs es como una tabla: cada elemento es una fila con todos sus campos. Se accede con el índice y después el campo: \`clase[i].nota\`.

\`\`\`c
#include <stdio.h>

typedef struct {
    char nombre[20];
    int puntos;
} Jugador;

int main() {
    Jugador equipo[4] = {{"Ana", 120}, {"Bea", 340}, {"Carlos", 95}, {"Dani", 210}};
    int mejor = 0;
    for (int i = 1; i < 4; i++) {
        if (equipo[i].puntos > equipo[mejor].puntos) {
            mejor = i;
        }
    }
    printf("Gana %s con %d puntos\n", equipo[mejor].nombre, equipo[mejor].puntos);
    for (int i = 0; i < 4; i++) {
        printf("%-8s %4d\n", equipo[i].nombre, equipo[i].puntos);
    }
    return 0;
}
\`\`\`

Y como los structs se pueden copiar con \`=\`, para **ordenar** un array de structs se intercambian enteros con una variable auxiliar del mismo tipo.
`,
      exercise: {
        task: md`
Lee \`n\` (máximo 30) y después \`n\` alumnos (nombre de una palabra y nota decimal). Ordénalos de **mayor a menor nota** (burbuja, intercambiando structs completos) y escribe el ranking:

\`\`\`text
1. NOMBRE NOTA
2. ...
\`\`\`

con la nota con 1 decimal. Si hay empate, mantén el orden en que se escribieron.
`,
        starter: md`#include <stdio.h>
#define MAX 30

typedef struct {
    char nombre[30];
    double nota;
} Alumno;

int main() {
    Alumno clase[MAX];
    int n;
    scanf("%d", &n);

    return 0;
}
`,
        solution: md`#include <stdio.h>
#define MAX 30

typedef struct {
    char nombre[30];
    double nota;
} Alumno;

int main() {
    Alumno clase[MAX];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%29s %lf", clase[i].nombre, &clase[i].nota);
    }
    for (int p = 0; p < n - 1; p++) {
        for (int j = 0; j < n - 1 - p; j++) {
            if (clase[j].nota < clase[j + 1].nota) {
                Alumno aux = clase[j];
                clase[j] = clase[j + 1];
                clase[j + 1] = aux;
            }
        }
    }
    for (int i = 0; i < n; i++) {
        printf("%d. %s %.1f\n", i + 1, clase[i].nombre, clase[i].nota);
    }
    return 0;
}
`,
        tests: [{ input: '4\nAna 7.5\nBea 9.25\nCarlos 5\nDani 8\n' }, { input: '1\nSolo 10\n' }, { input: '3\nX 6\nY 6\nZ 7\n', name: 'empate' }],
        hints: ['Lee cada alumno: scanf("%29s %lf", clase[i].nombre, &clase[i].nota);', 'En la burbuja compara clase[j].nota < clase[j + 1].nota y, si toca, intercambia con Alumno aux = clase[j]; ...', 'Con < estricto, los empates no se intercambian y conservan su orden.'],
      },
    },
    {
      id: 'st-punteros',
      title: 'Structs, funciones y el operador ->',
      theory: md`
## Pasar structs a funciones

Un struct se puede pasar a una función **por valor** (se copia entero) o **por referencia** (con un puntero, para modificarlo o para no copiar algo grande):

\`\`\`c
#include <stdio.h>

typedef struct {
    char nombre[20];
    int vida;
    int ataque;
} Personaje;

void mostrar(Personaje p) {                 // por valor: una copia
    printf("%s [vida %d, ataque %d]\n", p.nombre, p.vida, p.ataque);
}

void recibirGolpe(Personaje *p, int danio) { // por referencia
    p->vida -= danio;                        // p->vida es (*p).vida
    if (p->vida < 0) {
        p->vida = 0;
    }
}

int main() {
    Personaje heroe = {"Link", 100, 15};
    recibirGolpe(&heroe, 30);
    recibirGolpe(&heroe, 80);
    mostrar(heroe);
    return 0;
}
\`\`\`

Con un **puntero a struct**, los campos se usan con **flecha** \`->\` en vez de punto: \`p->vida\` es una forma cómoda de escribir \`(*p).vida\`.

| Tienes | Escribes |
|---|---|
| un struct \`h\` | \`h.vida\` |
| un puntero \`p\` a struct | \`p->vida\` |
`,
      exercise: {
        task: md`
Con este tipo:

\`\`\`c norun
typedef struct {
    char nombre[30];
    double sueldo;
    int antiguedad;
} Empleado;
\`\`\`

escribe \`void subirSueldo(Empleado *e, double porcentaje)\` (sube el sueldo ese porcentaje y, si la antigüedad es de 10 años o más, un 5 % extra encima) y \`void mostrar(const Empleado *e)\` que escriba \`NOMBRE: SUELDO €\` (2 decimales).

\`main\` lee un empleado (nombre, sueldo, antigüedad) y un porcentaje, lo muestra, le sube el sueldo y lo vuelve a mostrar.
`,
        starter: md`#include <stdio.h>

typedef struct {
    char nombre[30];
    double sueldo;
    int antiguedad;
} Empleado;

int main() {
    Empleado e;
    double porcentaje;
    scanf("%29s %lf %d %lf", e.nombre, &e.sueldo, &e.antiguedad, &porcentaje);

    return 0;
}
`,
        solution: md`#include <stdio.h>

typedef struct {
    char nombre[30];
    double sueldo;
    int antiguedad;
} Empleado;

void subirSueldo(Empleado *e, double porcentaje) {
    e->sueldo *= 1 + porcentaje / 100;
    if (e->antiguedad >= 10) {
        e->sueldo *= 1.05;
    }
}

void mostrar(const Empleado *e) {
    printf("%s: %.2f €\n", e->nombre, e->sueldo);
}

int main() {
    Empleado e;
    double porcentaje;
    scanf("%29s %lf %d %lf", e.nombre, &e.sueldo, &e.antiguedad, &porcentaje);
    mostrar(&e);
    subirSueldo(&e, porcentaje);
    mostrar(&e);
    return 0;
}
`,
        tests: [{ input: 'Marta 2000 12 3\n' }, { input: 'Luis 1500 2 10\n' }, { input: 'Ana 1800 10 0\n' }],
        hints: ['Dentro de subirSueldo usa e->sueldo.', 'Subir un porcentaje: e->sueldo *= 1 + porcentaje / 100;', 'Llama con la dirección: subirSueldo(&e, porcentaje); mostrar(&e);'],
        requires: [{ re: '->', msg: 'Usa el operador -> con los punteros a struct.' }],
      },
    },
    {
      id: 'st-anidados',
      title: 'Structs dentro de structs',
      theory: md`
## Fichas con apartados

Un campo de un struct puede ser **otro struct**. Así se modelan cosas reales: una persona tiene una **fecha** de nacimiento, que a su vez tiene día, mes y año:

\`\`\`c
#include <stdio.h>

typedef struct {
    int dia, mes, anio;
} Fecha;

typedef struct {
    char nombre[30];
    Fecha nacimiento;
} Persona;

int main() {
    Persona p = {"Ada", {10, 12, 1815}};
    printf("%s nació el %02d/%02d/%d\n", p.nombre, p.nacimiento.dia, p.nacimiento.mes, p.nacimiento.anio);
    return 0;
}
\`\`\`

Para llegar al día se encadenan puntos: \`p.nacimiento.dia\`.

## Comparar fechas

Una fecha es anterior a otra si su año es menor; si el año es igual, si el mes es menor; y si el mes también es igual, si el día es menor.
`,
      exercise: {
        task: md`
Define \`Fecha\` y \`Persona\` como en la teoría. Escribe \`int edad(Persona p, Fecha hoy)\` que calcule los años cumplidos (resta los años y quita uno si este año todavía no ha llegado su cumpleaños).

\`main\` lee la fecha de hoy (\`d m a\`), después \`n\` personas (nombre y fecha de nacimiento \`d m a\`) y escribe cada una con su edad, \`NOMBRE: E años\`, y al final quién es la **más joven**: \`Más joven: NOMBRE\`.
`,
        starter: md`#include <stdio.h>

int main() {

    return 0;
}
`,
        solution: md`#include <stdio.h>

typedef struct {
    int dia, mes, anio;
} Fecha;

typedef struct {
    char nombre[30];
    Fecha nacimiento;
} Persona;

int edad(Persona p, Fecha hoy) {
    int e = hoy.anio - p.nacimiento.anio;
    if (hoy.mes < p.nacimiento.mes || (hoy.mes == p.nacimiento.mes && hoy.dia < p.nacimiento.dia)) {
        e--;
    }
    return e;
}

int main() {
    Fecha hoy;
    Persona gente[20];
    int n;
    scanf("%d %d %d", &hoy.dia, &hoy.mes, &hoy.anio);
    scanf("%d", &n);
    int joven = 0;
    for (int i = 0; i < n; i++) {
        Persona *p = &gente[i];
        scanf("%29s %d %d %d", p->nombre, &p->nacimiento.dia, &p->nacimiento.mes, &p->nacimiento.anio);
        printf("%s: %d años\n", p->nombre, edad(*p, hoy));
        Fecha a = gente[joven].nacimiento;
        Fecha b = p->nacimiento;
        if (b.anio > a.anio || (b.anio == a.anio && (b.mes > a.mes || (b.mes == a.mes && b.dia > a.dia)))) {
            joven = i;
        }
    }
    printf("Más joven: %s\n", gente[joven].nombre);
    return 0;
}
`,
        tests: [{ input: '15 6 2025\n3\nAna 20 6 2000\nBea 1 1 2005\nCarlos 15 6 1990\n' }, { input: '1 1 2024\n1\nSolo 1 1 2023\n' }],
        hints: ['edad: e = hoy.anio - nacimiento.anio; si el mes de hoy es menor, o es el mismo mes y el día es menor, resta 1.', 'Para el más joven, compara fechas: la persona más joven es la que nació más tarde.'],
        requires: [{ re: 'int\\s+edad\\s*\\(', msg: 'Crea la función int edad(Persona p, Fecha hoy).' }],
      },
    },
    {
      id: 'st-proyecto',
      title: 'Proyecto: agenda de contactos',
      kind: 'proyecto',
      theory: md`
## Una aplicación de verdad

Vas a programar una pequeña **agenda**: un array de contactos y un menú para añadir, listar y buscar. Es la estructura de muchísimos programas: **datos** (array de structs) + **operaciones** (funciones) + **interfaz** (menú).

Organízalo con funciones: \`anadir\`, \`listar\`, \`buscar\`… cada una recibe el array y el número de contactos (por puntero si lo tiene que cambiar).
`,
      exercise: {
        task: md`
Contactos con \`char nombre[30]\` y \`char telefono[15]\`, máximo 10. Menú:

\`\`\`text
1) Añadir 2) Listar 3) Buscar 0) Salir
Opción:
\`\`\`

- **1**: lee nombre y teléfono (una palabra cada uno). Si la agenda está llena: \`Agenda llena\`; si no, \`Contacto guardado\`.
- **2**: si está vacía, \`Agenda vacía\`; si no, cada contacto como \`N. NOMBRE - TELEFONO\` (N desde 1).
- **3**: lee un nombre; escribe \`TELEFONO\` del primero que coincida exactamente o \`No encontrado\`.
- **0**: \`Hasta pronto\`.
`,
        starter: md`#include <stdio.h>
#include <string.h>
#define MAX 10

typedef struct {
    char nombre[30];
    char telefono[15];
} Contacto;

int main() {
    Contacto agenda[MAX];
    int n = 0;
    int opcion;

    return 0;
}
`,
        solution: md`#include <stdio.h>
#include <string.h>
#define MAX 10

typedef struct {
    char nombre[30];
    char telefono[15];
} Contacto;

void anadir(Contacto agenda[], int *n) {
    Contacto c;
    scanf("%29s %14s", c.nombre, c.telefono);
    if (*n == MAX) {
        printf("Agenda llena\n");
        return;
    }
    agenda[*n] = c;
    (*n)++;
    printf("Contacto guardado\n");
}

void listar(Contacto agenda[], int n) {
    if (n == 0) {
        printf("Agenda vacía\n");
        return;
    }
    for (int i = 0; i < n; i++) {
        printf("%d. %s - %s\n", i + 1, agenda[i].nombre, agenda[i].telefono);
    }
}

void buscar(Contacto agenda[], int n) {
    char nombre[30];
    scanf("%29s", nombre);
    for (int i = 0; i < n; i++) {
        if (strcmp(agenda[i].nombre, nombre) == 0) {
            printf("%s\n", agenda[i].telefono);
            return;
        }
    }
    printf("No encontrado\n");
}

int main() {
    Contacto agenda[MAX];
    int n = 0;
    int opcion;
    do {
        printf("1) Añadir 2) Listar 3) Buscar 0) Salir\nOpción: ");
        scanf("%d", &opcion);
        switch (opcion) {
            case 1:
                anadir(agenda, &n);
                break;
            case 2:
                listar(agenda, n);
                break;
            case 3:
                buscar(agenda, n);
                break;
            case 0:
                printf("Hasta pronto\n");
                break;
        }
    } while (opcion != 0);
    return 0;
}
`,
        tests: [
          { input: '2\n1\nAna 600111222\n1\nLuis 699888777\n2\n3\nLuis\n3\nPepe\n0\n' },
          { input: '1\na 1\n1\nb 2\n1\nc 3\n1\nd 4\n1\ne 5\n1\nf 6\n1\ng 7\n1\nh 8\n1\ni 9\n1\nj 10\n1\nk 11\n2\n0\n', name: 'agenda llena' },
        ],
        hints: ['Lleva la cuenta de contactos en n. Para que una función cambie n, pásale &n.', 'Para buscar compara con strcmp(agenda[i].nombre, nombre) == 0.', 'Aunque la agenda esté llena, lee igualmente el nombre y el teléfono (para no descolocar la entrada).'],
      },
    },
    {
      id: 'st-examen',
      title: 'Examen: estructuras',
      kind: 'examen',
      theory: md`
## Examen de structs

Necesitas un **70 %**.
`,
      quiz: [
        { q: '¿Qué falta?', code: 'struct Punto {\n    int x, y;\n}', options: ['Nada', 'Un ; después de la llave', 'La palabra typedef', 'Un main'], answer: 1, explain: 'La definición de un struct termina en ;' },
        { q: 'Con `Alumno a;`, ¿cómo se pone la edad a 15?', options: ['`a->edad = 15;`', '`a.edad = 15;`', '`edad.a = 15;`', '`Alumno.edad = 15;`'], answer: 1, explain: 'Con una variable struct se usa el punto.' },
        { q: 'Con `Alumno *p = &a;`, ¿cómo se pone la edad a 15?', options: ['`p.edad = 15;`', '`p->edad = 15;`', '`*p.edad = 15;`', '`&p.edad = 15;`'], answer: 1, explain: 'Con un puntero a struct se usa la flecha (o (*p).edad).' },
        { q: '¿Cómo se guarda "Ana" en el campo `char nombre[20]` de `a`?', options: ['`a.nombre = "Ana";`', '`strcpy(a.nombre, "Ana");`', '`a.nombre == "Ana";`', '`a->nombre = "Ana";`'], answer: 1, explain: 'Los arrays de char se copian con strcpy.' },
        { q: '¿Se puede copiar un struct entero con `=`?', options: ['Sí', 'No, hay que copiar campo a campo', 'Solo si no tiene arrays', 'Solo con typedef'], answer: 0, explain: 'b = a; copia todos los campos (incluidos los arrays de dentro).' },
      ],
    },
  ],
};
