import { md, type Chapter } from '../types';

export const funciones: Chapter = {
  id: 'funciones',
  title: 'Funciones',
  subtitle: 'Divide y vencerás: parámetros, return, prototipos y recursividad',
  icon: '🧩',
  color: '#4f8cff',
  level: 3,
  lessons: [
    {
      id: 'fn-intro',
      title: 'Tu primera función',
      theory: md`
## Trozos de código con nombre

Una **función** es un bloque de código con nombre que puedes **llamar** (usar) todas las veces que quieras. Ya conoces muchas: \`printf\`, \`scanf\`, \`sqrt\`… y \`main\` también es una función. Ahora vas a crear las tuyas:

\`\`\`c
#include <stdio.h>

void linea(void) {
    printf("====================\n");
}

int main() {
    linea();
    printf("  MENÚ PRINCIPAL\n");
    linea();
    printf("1) Jugar\n2) Salir\n");
    linea();
    return 0;
}
\`\`\`

- \`void\` delante del nombre significa que la función **no devuelve** ningún valor.
- \`(void)\` entre paréntesis: no recibe datos (también vale \`()\`).
- Se **llama** escribiendo su nombre con paréntesis: \`linea();\`.
- La función tiene que estar escrita **antes** de usarla (o tener un prototipo; lo verás pronto).

## ¿Para qué sirven?

- **No repetir código**: si hay que cambiar la línea, se cambia en un sitio.
- **Organizar**: un programa largo se divide en piezas pequeñas con nombres claros.
- **Reutilizar**: una función bien hecha sirve en muchos programas.

> 💡 Las funciones se ejecutan cuando se las llama, no donde están escritas. El programa siempre empieza por \`main\`.
`,
      exercise: {
        task: md`
Escribe una función \`void cabecera(void)\` que escriba estas tres líneas:

\`\`\`text
*************
* C GAME    *
*************
\`\`\`

y llámala **dos veces** desde \`main\`, con la línea \`Partida 1\` entre medias. Es decir, la salida es la cabecera, \`Partida 1\` y otra vez la cabecera.
`,
        starter: md`#include <stdio.h>

// escribe aquí la función cabecera

int main() {

    return 0;
}
`,
        solution: md`#include <stdio.h>

void cabecera(void) {
    printf("*************\n");
    printf("* C GAME    *\n");
    printf("*************\n");
}

int main() {
    cabecera();
    printf("Partida 1\n");
    cabecera();
    return 0;
}
`,
        tests: [{ output: '*************\n* C GAME    *\n*************\nPartida 1\n*************\n* C GAME    *\n*************\n' }],
        hints: ['void cabecera(void) { ...tres printf... } antes de main.', 'En main: cabecera(); printf("Partida 1\\n"); cabecera();'],
        requires: [
          { re: 'void\\s+cabecera\\s*\\(', msg: 'Crea la función void cabecera(void).' },
          { re: 'cabecera\\s*\\(\\s*\\)\\s*;[\\s\\S]*cabecera\\s*\\(\\s*\\)\\s*;', msg: 'Llama a cabecera() dos veces desde main.' },
        ],
      },
    },
    {
      id: 'fn-parametros',
      title: 'Parámetros',
      theory: md`
## Pasarle datos a una función

Entre los paréntesis se declaran los **parámetros**: variables que reciben los valores con los que se llama a la función.

\`\`\`c
#include <stdio.h>

void linea(int largo, char simbolo) {
    for (int i = 0; i < largo; i++) {
        printf("%c", simbolo);
    }
    printf("\n");
}

int main() {
    linea(10, '-');
    linea(5, '*');
    int n = 3;
    linea(n * 4, '#');
    return 0;
}
\`\`\`

- Cada parámetro lleva su tipo: \`(int largo, char simbolo)\`.
- Al llamar, los valores (**argumentos**) van **en el mismo orden**: el primero a \`largo\`, el segundo a \`simbolo\`.
- Los argumentos pueden ser números, variables o expresiones.

> 💡 Los parámetros son **copias**. Si la función cambia \`largo\`, la variable \`n\` de \`main\` no cambia. (Para cambiarla hacen falta punteros: capítulo siguiente.)
`,
      exercise: {
        task: md`
Escribe \`void tabla(int n, int hasta)\` que escriba la tabla de multiplicar de \`n\` desde 1 hasta \`hasta\`, con el formato \`n x i = resultado\`. En \`main\`, lee dos números y llama a la función.
`,
        starter: md`#include <stdio.h>

int main() {
    int n, hasta;
    scanf("%d %d", &n, &hasta);

    return 0;
}
`,
        solution: md`#include <stdio.h>

void tabla(int n, int hasta) {
    for (int i = 1; i <= hasta; i++) {
        printf("%d x %d = %d\n", n, i, n * i);
    }
}

int main() {
    int n, hasta;
    scanf("%d %d", &n, &hasta);
    tabla(n, hasta);
    return 0;
}
`,
        tests: [{ input: '7 5\n' }, { input: '3 10\n' }, { input: '12 1\n' }],
        hints: ['void tabla(int n, int hasta) { for (...) printf(...); }', 'En main, después del scanf: tabla(n, hasta);'],
        requires: [{ re: 'void\\s+tabla\\s*\\(\\s*int\\s+\\w+\\s*,\\s*int\\s+\\w+\\s*\\)', msg: 'Crea la función void tabla(int n, int hasta).' }],
      },
    },
    {
      id: 'fn-return',
      title: 'Devolver un resultado: return',
      theory: md`
## Funciones que calculan

Muchas funciones **calculan algo y lo devuelven**, como \`sqrt\`. El tipo que devuelven va delante del nombre, y el valor se devuelve con \`return\`:

\`\`\`c
#include <stdio.h>

int maximo(int a, int b) {
    if (a > b) {
        return a;
    }
    return b;
}

double media(double x, double y) {
    return (x + y) / 2;
}

int main() {
    int m = maximo(7, 12);
    printf("Máximo: %d\n", m);
    printf("Máximo de tres: %d\n", maximo(maximo(3, 9), 5));
    printf("Media: %.1f\n", media(6.5, 8));
    return 0;
}
\`\`\`

- \`return\` **termina** la función en ese momento y entrega el valor.
- El valor devuelto se puede guardar en una variable, usar en un \`printf\` o pasar a otra función.
- Una función \`int\` tiene que llegar **siempre** a un \`return\` con un valor. Si hay un camino sin \`return\`, el compilador avisa.

> 💡 Una función devuelve **un solo valor**. Si necesitas devolver dos (por ejemplo, el mínimo y el máximo), lo verás con punteros.
`,
      exercise: {
        task: md`
Escribe estas funciones y úsalas desde \`main\`:

- \`int absoluto(int x)\`: el valor absoluto de \`x\` (sin usar \`abs\`).
- \`int esPar(int x)\`: devuelve 1 si \`x\` es par y 0 si no.
- \`double areaCirculo(double r)\`: \`3.14159 * r * r\`.

\`main\` lee un entero \`n\` y un decimal \`r\` y escribe:

\`\`\`text
Absoluto: A
Par: P
Área: X       (con 2 decimales)
\`\`\`
`,
        starter: md`#include <stdio.h>

int main() {
    int n;
    double r;
    scanf("%d %lf", &n, &r);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int absoluto(int x) {
    if (x < 0) {
        return -x;
    }
    return x;
}

int esPar(int x) {
    return x % 2 == 0;
}

double areaCirculo(double r) {
    return 3.14159 * r * r;
}

int main() {
    int n;
    double r;
    scanf("%d %lf", &n, &r);
    printf("Absoluto: %d\n", absoluto(n));
    printf("Par: %d\n", esPar(n));
    printf("Área: %.2f\n", areaCirculo(r));
    return 0;
}
`,
        tests: [{ input: '-8 2\n' }, { input: '7 1.5\n' }, { input: '0 10\n' }],
        hints: ['int absoluto(int x) { if (x < 0) return -x; return x; }', 'Una comparación ya vale 1 o 0: return x % 2 == 0;'],
        requires: [
          { re: 'int\\s+absoluto\\s*\\(', msg: 'Crea la función int absoluto(int x).' },
          { re: 'int\\s+esPar\\s*\\(', msg: 'Crea la función int esPar(int x).' },
          { re: 'double\\s+areaCirculo\\s*\\(', msg: 'Crea la función double areaCirculo(double r).' },
        ],
        forbids: [{ re: '\\babs\\s*\\(', msg: 'Calcula el valor absoluto sin usar abs().' }],
      },
    },
    {
      id: 'fn-prototipos',
      title: 'Prototipos',
      theory: md`
## Avisar antes de usar

C lee el programa **de arriba abajo**. Si \`main\` usa una función que está escrita **debajo**, el compilador todavía no la conoce y da error. Hay dos soluciones:

1. Escribir las funciones **antes** de \`main\` (lo que hemos hecho hasta ahora).
2. Poner arriba un **prototipo**: la primera línea de la función terminada en \`;\`. Así puedes dejar \`main\` al principio, que es como más se lee:

\`\`\`c
#include <stdio.h>

// prototipos: "estas funciones existen y son así"
int cuadrado(int x);
void saludar(char inicial);

int main() {
    saludar('V');
    printf("%d\n", cuadrado(9));
    return 0;
}

// definiciones
int cuadrado(int x) {
    return x * x;
}

void saludar(char inicial) {
    printf("Hola, %c.\n", inicial);
}
\`\`\`

El prototipo y la definición tienen que coincidir: mismo tipo devuelto, mismo nombre y mismos tipos de parámetros (los nombres de los parámetros pueden omitirse en el prototipo: \`int cuadrado(int);\`).
`,
      exercise: {
        task: md`
Este programa no compila porque \`main\` usa funciones que están debajo. **Añade los prototipos** necesarios (sin mover las funciones) para que funcione.
`,
        starter: md`#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("Suma: %d\n", suma(a, b));
    printf("Mayor: %d\n", mayor(a, b));
    mostrarDivision(a, b);
    return 0;
}

int suma(int x, int y) {
    return x + y;
}

int mayor(int x, int y) {
    return x > y ? x : y;
}

void mostrarDivision(int x, int y) {
    if (y == 0) {
        printf("No se puede dividir entre 0\n");
    } else {
        printf("División: %.2f\n", (double)x / y);
    }
}
`,
        solution: md`#include <stdio.h>

int suma(int x, int y);
int mayor(int x, int y);
void mostrarDivision(int x, int y);

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    printf("Suma: %d\n", suma(a, b));
    printf("Mayor: %d\n", mayor(a, b));
    mostrarDivision(a, b);
    return 0;
}

int suma(int x, int y) {
    return x + y;
}

int mayor(int x, int y) {
    return x > y ? x : y;
}

void mostrarDivision(int x, int y) {
    if (y == 0) {
        printf("No se puede dividir entre 0\n");
    } else {
        printf("División: %.2f\n", (double)x / y);
    }
}
`,
        tests: [{ input: '7 2\n' }, { input: '3 0\n' }, { input: '-5 10\n' }],
        hints: ['Copia la primera línea de cada función encima de main y termínala en ;', 'Ejemplo: int suma(int x, int y);'],
        requires: [{ re: 'int\\s+suma\\s*\\([^)]*\\)\\s*;', msg: 'Añade el prototipo de suma (terminado en ;) antes de main.' }],
      },
    },
    {
      id: 'fn-ambito',
      title: 'Ámbito: locales, globales y static',
      theory: md`
## ¿Dónde existe cada variable?

- Una variable declarada **dentro** de una función es **local**: solo existe dentro de ella, y desaparece al terminar. Otras funciones pueden tener variables con el mismo nombre sin problema.
- Una variable declarada **fuera** de todas las funciones es **global**: la ven todas. Empieza a 0.

\`\`\`c
#include <stdio.h>

int puntos = 0;              // global

void sumarPuntos(int p) {
    int bonus = 5;           // local de sumarPuntos
    puntos += p + bonus;
}

int main() {
    sumarPuntos(10);
    sumarPuntos(20);
    printf("Puntos: %d\n", puntos);
    // printf("%d", bonus);  ← error: bonus no existe aquí
    return 0;
}
\`\`\`

> ⚠️ Las globales son cómodas pero peligrosas: cualquier función puede cambiarlas y es difícil saber quién lo hizo. **Úsalas poco**; mejor pasar parámetros y devolver valores.

## static: una local que recuerda

Una variable local \`static\` se crea **una sola vez** y **conserva su valor** entre llamadas:

\`\`\`c
#include <stdio.h>

int siguienteId(void) {
    static int contador = 0;     // solo se pone a 0 la primera vez
    contador++;
    return contador;
}

int main() {
    printf("%d\n", siguienteId());
    printf("%d\n", siguienteId());
    printf("%d\n", siguienteId());
    return 0;
}
\`\`\`
`,
      exercise: {
        task: md`
Escribe \`int tirarDado(void)\` que tire un dado (\`rand() % 6 + 1\`), escriba \`Tirada N: X\` y devuelva el valor. N es el número de tirada: cuéntalo con una variable **\`static\`** dentro de la propia función (sin variables globales).

En \`main\`: \`srand(7)\`, lee cuántas tiradas hacer y suma sus resultados. Al final escribe \`Total: S\`.
`,
        starter: md`#include <stdio.h>
#include <stdlib.h>

int main() {
    int n, total = 0;
    srand(7);
    scanf("%d", &n);

    printf("Total: %d\n", total);
    return 0;
}
`,
        solution: md`#include <stdio.h>
#include <stdlib.h>

int tirarDado(void) {
    static int numero = 0;
    numero++;
    int valor = rand() % 6 + 1;
    printf("Tirada %d: %d\n", numero, valor);
    return valor;
}

int main() {
    int n, total = 0;
    srand(7);
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        total += tirarDado();
    }
    printf("Total: %d\n", total);
    return 0;
}
`,
        tests: [{ input: '3\n' }, { input: '1\n' }, { input: '8\n' }],
        hints: ['Dentro de tirarDado: static int numero = 0; numero++;', 'En main, un for que llame n veces: total += tirarDado();'],
        requires: [{ re: '\\bstatic\\s+int\\b', msg: 'Usa una variable static int para contar las tiradas.' }],
      },
    },
    {
      id: 'fn-arrays',
      title: 'Funciones con arrays',
      theory: md`
## Pasar un array a una función

Un array se pasa poniendo \`[]\` en el parámetro. Como la función **no sabe** cuántos elementos tiene, se pasa también el tamaño:

\`\`\`c
#include <stdio.h>

int suma(int v[], int n) {
    int s = 0;
    for (int i = 0; i < n; i++) {
        s += v[i];
    }
    return s;
}

void duplicar(int v[], int n) {
    for (int i = 0; i < n; i++) {
        v[i] *= 2;            // ¡cambia el array original!
    }
}

void mostrar(int v[], int n) {
    for (int i = 0; i < n; i++) printf("%d ", v[i]);
    printf("\n");
}

int main() {
    int datos[5] = {1, 2, 3, 4, 5};
    printf("Suma: %d\n", suma(datos, 5));
    duplicar(datos, 5);
    mostrar(datos, 5);
    return 0;
}
\`\`\`

> ⚠️ **Los arrays NO se copian**: la función trabaja sobre el **original**. Si la función lo cambia, cambia en \`main\`. (A diferencia de las variables normales, que sí se copian.)

> ⚠️ Dentro de la función, \`sizeof(v)\` no da el tamaño del array (da el de un puntero). Por eso se pasa \`n\`.
`,
      exercise: {
        task: md`
Escribe estas funciones:

- \`void leer(int v[], int n)\`: lee \`n\` números en el array.
- \`int posMaximo(int v[], int n)\`: devuelve la **posición** del mayor.
- \`void invertir(int v[], int n)\`: le da la vuelta al array (el primero pasa a ser el último…).
- \`void mostrar(int v[], int n)\`: escribe los números separados por espacios (con un espacio después de cada uno) y un salto de línea.

\`main\` lee \`n\` (máximo 50), lee el array, escribe \`Máximo en la posición P\`, lo invierte y lo muestra.
`,
        starter: md`#include <stdio.h>
#define MAX 50

int main() {
    int v[MAX];
    int n;
    scanf("%d", &n);

    return 0;
}
`,
        solution: md`#include <stdio.h>
#define MAX 50

void leer(int v[], int n) {
    for (int i = 0; i < n; i++) {
        scanf("%d", &v[i]);
    }
}

int posMaximo(int v[], int n) {
    int pos = 0;
    for (int i = 1; i < n; i++) {
        if (v[i] > v[pos]) {
            pos = i;
        }
    }
    return pos;
}

void invertir(int v[], int n) {
    for (int i = 0; i < n / 2; i++) {
        int aux = v[i];
        v[i] = v[n - 1 - i];
        v[n - 1 - i] = aux;
    }
}

void mostrar(int v[], int n) {
    for (int i = 0; i < n; i++) {
        printf("%d ", v[i]);
    }
    printf("\n");
}

int main() {
    int v[MAX];
    int n;
    scanf("%d", &n);
    leer(v, n);
    printf("Máximo en la posición %d\n", posMaximo(v, n));
    invertir(v, n);
    mostrar(v, n);
    return 0;
}
`,
        tests: [{ input: '5\n3 9 2 7 1\n' }, { input: '1\n8\n' }, { input: '6\n1 2 3 4 5 6\n' }],
        hints: ['Para invertir: intercambia v[i] con v[n - 1 - i] para i desde 0 hasta n / 2.', 'En posMaximo, guarda solo la posición y compara v[i] > v[pos].'],
        requires: [
          { re: 'void\\s+leer\\s*\\(', msg: 'Crea la función leer.' },
          { re: 'int\\s+posMaximo\\s*\\(', msg: 'Crea la función posMaximo.' },
          { re: 'void\\s+invertir\\s*\\(', msg: 'Crea la función invertir.' },
          { re: 'void\\s+mostrar\\s*\\(', msg: 'Crea la función mostrar.' },
        ],
      },
    },
    {
      id: 'fn-bool',
      title: 'Funciones que responden sí o no',
      theory: md`
## Funciones "pregunta"

Las funciones que responden verdadero o falso hacen el código muy legible. Se pueden devolver como \`int\` (1/0) o con el tipo \`bool\` de \`<stdbool.h>\` (\`true\`/\`false\`):

\`\`\`c
#include <stdio.h>
#include <stdbool.h>

bool esVocal(char c) {
    return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u';
}

bool esPrimo(int n) {
    if (n < 2) return false;
    for (int d = 2; d * d <= n; d++) {
        if (n % d == 0) return false;     // return sale de la función al momento
    }
    return true;
}

int main() {
    if (esPrimo(97)) printf("97 es primo\n");
    if (!esVocal('x')) printf("x no es vocal\n");
    return 0;
}
\`\`\`

Fíjate en cómo \`return false\` dentro del bucle sustituye a la bandera + \`break\` que usábamos antes.
`,
      exercise: {
        task: md`
Un número es **perfecto** si es igual a la suma de sus divisores menores que él (6 = 1 + 2 + 3). Escribe \`bool esPerfecto(int n)\` y úsala en \`main\` para escribir todos los números perfectos entre \`a\` y \`b\` (leídos del teclado), uno por línea. Si no hay ninguno, escribe \`Ninguno\`.
`,
        starter: md`#include <stdio.h>
#include <stdbool.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);

    return 0;
}
`,
        solution: md`#include <stdio.h>
#include <stdbool.h>

bool esPerfecto(int n) {
    if (n < 2) return false;
    int suma = 0;
    for (int d = 1; d < n; d++) {
        if (n % d == 0) {
            suma += d;
        }
    }
    return suma == n;
}

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    int encontrados = 0;
    for (int i = a; i <= b; i++) {
        if (esPerfecto(i)) {
            printf("%d\n", i);
            encontrados++;
        }
    }
    if (encontrados == 0) {
        printf("Ninguno\n");
    }
    return 0;
}
`,
        tests: [{ input: '1 30\n' }, { input: '1 1000\n' }, { input: '7 27\n', name: 'ninguno' }],
        hints: ['En esPerfecto, suma los d de 1 a n-1 con n % d == 0 y devuelve suma == n.', 'En main, cuenta cuántos encuentras para saber si escribir "Ninguno".'],
        requires: [{ re: 'bool\\s+esPerfecto\\s*\\(', msg: 'Crea la función bool esPerfecto(int n).' }],
      },
    },
    {
      id: 'fn-recursion',
      title: 'Recursividad',
      theory: md`
## Una función que se llama a sí misma

Una función **recursiva** se llama a sí misma con un problema **más pequeño**. Tiene dos partes:

1. **Caso base**: un caso tan sencillo que se responde directamente (y para la recursión).
2. **Caso recursivo**: resuelve el problema usando la respuesta de uno más pequeño.

El factorial es el ejemplo clásico: \`n! = n · (n-1)!\` y \`0! = 1\`.

\`\`\`c
#include <stdio.h>

long long factorial(int n) {
    if (n <= 1) {
        return 1;                      // caso base
    }
    return n * factorial(n - 1);       // caso recursivo
}

int main() {
    printf("5! = %lld\n", factorial(5));
    printf("20! = %lld\n", factorial(20));
    return 0;
}
\`\`\`

\`factorial(4)\` → \`4 * factorial(3)\` → \`4 * 3 * factorial(2)\` → \`4 * 3 * 2 * factorial(1)\` → \`4 * 3 * 2 * 1\` = 24.

> ⚠️ Sin caso base (o si las llamadas no se acercan a él), la función se llama infinitas veces hasta que el programa se queda sin memoria (*stack overflow*). Este compilador te lo avisa.

## Fibonacci

En la sucesión de Fibonacci cada número es la suma de los dos anteriores: 0, 1, 1, 2, 3, 5, 8, 13…

\`\`\`c
#include <stdio.h>

int fib(int n) {
    if (n < 2) return n;
    return fib(n - 1) + fib(n - 2);
}

int main() {
    for (int i = 0; i <= 10; i++) printf("%d ", fib(i));
    printf("\n");
    return 0;
}
\`\`\`
`,
      exercise: {
        task: md`
Escribe dos funciones **recursivas** (sin bucles):

- \`int sumaDigitos(int n)\`: la suma de las cifras de \`n\` (caso base: \`n < 10\`; si no, \`n % 10 + sumaDigitos(n / 10)\`).
- \`int potencia(int b, int e)\`: \`b\` elevado a \`e\` (caso base: \`e == 0\` devuelve 1).

\`main\` lee tres enteros \`n\`, \`b\`, \`e\` y escribe \`Suma de cifras: X\` y \`Potencia: Y\`.
`,
        starter: md`#include <stdio.h>

int main() {
    int n, b, e;
    scanf("%d %d %d", &n, &b, &e);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int sumaDigitos(int n) {
    if (n < 10) {
        return n;
    }
    return n % 10 + sumaDigitos(n / 10);
}

int potencia(int b, int e) {
    if (e == 0) {
        return 1;
    }
    return b * potencia(b, e - 1);
}

int main() {
    int n, b, e;
    scanf("%d %d %d", &n, &b, &e);
    printf("Suma de cifras: %d\n", sumaDigitos(n));
    printf("Potencia: %d\n", potencia(b, e));
    return 0;
}
`,
        tests: [{ input: '1234 2 10\n' }, { input: '7 5 0\n' }, { input: '99999 3 5\n' }],
        hints: ['sumaDigitos: if (n < 10) return n; return n % 10 + sumaDigitos(n / 10);', 'potencia: if (e == 0) return 1; return b * potencia(b, e - 1);'],
        forbids: [{ re: '\\b(for|while)\\s*\\(', msg: 'Hazlo con recursividad, sin bucles.' }],
      },
    },
    {
      id: 'fn-proyecto',
      title: 'Proyecto: biblioteca matemática',
      kind: 'proyecto',
      theory: md`
## Tu propia biblioteca

Vas a crear varias funciones matemáticas útiles y un menú para probarlas. Así se construyen los programas grandes: piezas pequeñas y bien probadas.

**Máximo común divisor** (algoritmo de Euclides): el mcd de \`a\` y \`b\` es igual al mcd de \`b\` y \`a % b\`, y el mcd de \`a\` y 0 es \`a\`. ¡Recursivo y precioso!

**Mínimo común múltiplo**: \`mcm(a, b) = a / mcd(a, b) * b\`.
`,
      exercise: {
        task: md`
Escribe \`int mcd(int a, int b)\` (recursiva, con Euclides), \`int mcm(int a, int b)\` (usando \`mcd\`) y \`int esPrimo(int n)\`. Después un menú con \`do-while\`:

\`\`\`text
1) MCD  2) MCM  3) ¿Primo?  0) Salir
Opción:
\`\`\`

- 1 y 2: leen dos números y escriben \`MCD = X\` / \`MCM = X\`.
- 3: lee un número y escribe \`N es primo\` o \`N no es primo\`.
- 0: \`Adiós\`.
`,
        starter: md`#include <stdio.h>

int main() {
    int opcion;

    return 0;
}
`,
        solution: md`#include <stdio.h>

int mcd(int a, int b) {
    if (b == 0) {
        return a;
    }
    return mcd(b, a % b);
}

int mcm(int a, int b) {
    return a / mcd(a, b) * b;
}

int esPrimo(int n) {
    if (n < 2) return 0;
    for (int d = 2; d * d <= n; d++) {
        if (n % d == 0) return 0;
    }
    return 1;
}

int main() {
    int opcion, a, b;
    do {
        printf("1) MCD  2) MCM  3) ¿Primo?  0) Salir\nOpción: ");
        scanf("%d", &opcion);
        switch (opcion) {
            case 1:
                scanf("%d %d", &a, &b);
                printf("MCD = %d\n", mcd(a, b));
                break;
            case 2:
                scanf("%d %d", &a, &b);
                printf("MCM = %d\n", mcm(a, b));
                break;
            case 3:
                scanf("%d", &a);
                printf("%d %s primo\n", a, esPrimo(a) ? "es" : "no es");
                break;
            case 0:
                printf("Adiós\n");
                break;
        }
    } while (opcion != 0);
    return 0;
}
`,
        tests: [{ input: '1\n48 18\n2\n4 6\n3\n97\n0\n' }, { input: '3\n1\n3\n91\n0\n' }, { input: '0\n' }],
        hints: ['mcd: if (b == 0) return a; return mcd(b, a % b);', 'mcm: return a / mcd(a, b) * b;', 'El menú es como el del capítulo do-while.'],
        requires: [{ re: 'int\\s+mcd\\s*\\(', msg: 'Crea la función mcd.' }, { re: 'mcd\\s*\\(\\s*b\\s*,', msg: 'Haz mcd recursiva con Euclides: mcd(b, a % b).' }],
      },
    },
    {
      id: 'fn-examen',
      title: 'Examen: funciones',
      kind: 'examen',
      theory: md`
## Examen de funciones

Necesitas un **70 %**.
`,
      quiz: [
        { q: '¿Qué significa `void` delante de una función?', options: ['Que no tiene parámetros', 'Que no devuelve ningún valor', 'Que está vacía', 'Que es privada'], answer: 1, explain: 'void como tipo de retorno: la función no devuelve nada.' },
        { q: '¿Qué escribe?', code: 'void cambia(int x) { x = 100; }\nint main() {\n  int a = 5;\n  cambia(a);\n  printf("%d", a);\n}', options: ['100', '5', '0', 'Error'], answer: 1, explain: 'x es una copia de a. Cambiar la copia no cambia a.' },
        { q: '¿Qué escribe?', code: 'void cambia(int v[]) { v[0] = 100; }\nint main() {\n  int a[2] = {5, 6};\n  cambia(a);\n  printf("%d", a[0]);\n}', options: ['100', '5', '6', 'Error'], answer: 0, explain: 'Los arrays no se copian: la función cambia el original.' },
        { q: '¿Para qué sirve un prototipo?', options: ['Para que la función sea más rápida', 'Para poder usar una función que está escrita más abajo', 'Para que devuelva varios valores', 'Es obligatorio en main'], answer: 1, explain: 'El prototipo le dice al compilador cómo es la función antes de usarla.' },
        { q: '¿Qué le falta a esta función recursiva?', code: 'int cuenta(int n) {\n  return 1 + cuenta(n - 1);\n}', options: ['Nada', 'Un caso base', 'Un parámetro más', 'Un bucle'], answer: 1, explain: 'Sin caso base nunca para.' },
        { q: '¿Qué devuelve `f(3)`?', code: 'int f(int n) {\n  if (n == 0) return 0;\n  return n + f(n - 1);\n}', options: ['3', '6', '0', '5'], answer: 1, explain: '3 + 2 + 1 + 0 = 6.' },
        { q: 'Una variable `static` dentro de una función…', options: ['Es global', 'Conserva su valor entre llamadas', 'No se puede cambiar', 'Se borra al salir'], answer: 1, explain: 'Se inicializa una vez y recuerda su valor.' },
      ],
    },
  ],
};
