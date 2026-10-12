// La chuleta: todo C (con stdio.h) en una página.
export const REFERENCE: { id: string; title: string; md: string }[] = [
  {
    id: 'estructura',
    title: 'Estructura',
    md: `
\`\`\`c
#include <stdio.h>      // printf, scanf…

int main() {
    // tu código
    return 0;           // 0 = todo bien
}
\`\`\`
- Cada instrucción acaba en \`;\` · los bloques van entre \`{ }\`
- Comentarios: \`// una línea\` y \`/* varias líneas */\`
`,
  },
  {
    id: 'tipos',
    title: 'Tipos y formatos',
    md: `
| Tipo | Guarda | Ejemplo | printf | scanf |
|---|---|---|---|---|
| \`int\` | enteros | \`int edad = 15;\` | \`%d\` | \`%d\` |
| \`long long\` | enteros grandes | \`long long n = 1e12;\` | \`%lld\` | \`%lld\` |
| \`float\` | decimales (≈7 cifras) | \`float p = 2.5;\` | \`%f\` | \`%f\` |
| \`double\` | decimales (≈15 cifras) | \`double pi = 3.14159;\` | \`%f\` / \`%lf\` | **\`%lf\`** |
| \`char\` | un carácter | \`char letra = 'A';\` | \`%c\` | \`" %c"\` |
| \`char[]\` | texto | \`char nombre[30];\` | \`%s\` | \`%s\` (sin &) |
| \`bool\` | verdadero/falso | \`bool ok = true;\` (stdbool.h) | \`%d\` | — |

Formatos útiles: \`%.2f\` (2 decimales) · \`%5d\` (ancho 5) · \`%-10s\` (a la izquierda) · \`%05d\` (rellena con ceros) · \`%%\` (el símbolo %)

Escapes: \`\\n\` salto de línea · \`\\t\` tabulador · \`\\"\` comillas · \`\\\\\` barra

Constantes: \`#define MAX 100\` · \`const float IVA = 0.21;\`
`,
  },
  {
    id: 'operadores',
    title: 'Operadores',
    md: `
| Tipo | Operadores |
|---|---|
| Aritméticos | \`+  -  *  /  %\` (\`7/2\` = 3 con enteros; \`%\` = resto) |
| Asignación | \`=  +=  -=  *=  /=  %=\` |
| Incremento | \`x++\`  \`x--\`  \`++x\`  \`--x\` |
| Comparación | \`==  !=  <  >  <=  >=\` |
| Lógicos | \`&&\` (y)  \`\\|\\|\` (o)  \`!\` (no) |
| Conversión | \`(float)a / b\` |

⚠️ \`=\` asigna, \`==\` compara. La potencia no es \`^\`: usa \`pow(a, b)\` de \`<math.h>\`.
`,
  },
  {
    id: 'entrada',
    title: 'Entrada y salida',
    md: `
\`\`\`c norun
printf("Tienes %d años y mides %.2f m\\n", edad, altura);
scanf("%d", &edad);          // ¡con &!
scanf("%lf", &altura);       // double → %lf
scanf(" %c", &letra);        // espacio antes de %c
scanf("%s", nombre);         // array de char: sin &
fgets(frase, 100, stdin);    // línea completa (con espacios)
\`\`\`
`,
  },
  {
    id: 'condicionales',
    title: 'Condicionales',
    md: `
\`\`\`c norun
if (nota >= 5) {
    printf("Aprobado\\n");
} else if (nota >= 4) {
    printf("Casi\\n");
} else {
    printf("Suspenso\\n");
}

switch (opcion) {
    case 1: printf("Uno\\n"); break;
    case 2: printf("Dos\\n"); break;
    default: printf("Otro\\n");
}

max = (a > b) ? a : b;    // operador ternario
\`\`\`
`,
  },
  {
    id: 'bucles',
    title: 'Bucles',
    md: `
\`\`\`c norun
for (int i = 0; i < 10; i++) { ... }    // número fijo de vueltas

while (x > 0) { ... }                    // mientras se cumpla

do { ... } while (opcion != 0);          // al menos una vez

break;      // sale del bucle
continue;   // salta a la siguiente vuelta
\`\`\`
`,
  },
  {
    id: 'arrays',
    title: 'Arrays y matrices',
    md: `
\`\`\`c norun
int v[5] = {1, 2, 3, 4, 5};       // índices 0..4
int ceros[100] = {0};             // todo a 0
for (int i = 0; i < 5; i++) printf("%d ", v[i]);

int m[3][4];                      // 3 filas, 4 columnas
for (int f = 0; f < 3; f++)
    for (int c = 0; c < 4; c++)
        m[f][c] = 0;

int n = sizeof(v) / sizeof(v[0]); // número de elementos
\`\`\`
⚠️ Un array de N elementos va de **0 a N-1**.
`,
  },
  {
    id: 'cadenas',
    title: 'Cadenas (string.h)',
    md: `
| Función | Qué hace |
|---|---|
| \`strlen(s)\` | longitud (sin el \`'\\0'\`) |
| \`strcpy(dest, src)\` | copia src en dest |
| \`strcat(dest, src)\` | añade src al final de dest |
| \`strcmp(a, b)\` | 0 si son iguales, <0 si a va antes, >0 si después |
| \`strchr(s, c)\` | puntero a la primera c (o NULL) |
| \`strstr(s, t)\` | puntero a la primera aparición de t (o NULL) |

\`ctype.h\`: \`isdigit\`, \`isalpha\`, \`isspace\`, \`isupper\`, \`islower\`, \`toupper\`, \`tolower\`

Todo texto acaba en \`'\\0'\`: \`char s[6]\` cabe "Hola!" (5 letras + \`'\\0'\`).
`,
  },
  {
    id: 'funciones',
    title: 'Funciones',
    md: `
\`\`\`c norun
int suma(int a, int b);            // prototipo (antes de main)

int main() {
    printf("%d\\n", suma(2, 3));
    return 0;
}

int suma(int a, int b) {           // definición
    return a + b;
}

void saluda(void) { printf("Hola\\n"); }   // no devuelve nada
void dobla(int v[], int n) { ... }          // los arrays se pasan por referencia
\`\`\`
`,
  },
  {
    id: 'punteros',
    title: 'Punteros',
    md: `
\`\`\`c norun
int x = 5;
int *p = &x;     // p guarda la dirección de x
*p = 10;         // cambia x a través de p
void intercambia(int *a, int *b) { int t = *a; *a = *b; *b = t; }
intercambia(&x, &y);

int v[3];  int *q = v;   // q apunta a v[0];  q[i] == *(q + i)
\`\`\`
`,
  },
  {
    id: 'structs',
    title: 'Structs',
    md: `
\`\`\`c norun
typedef struct {
    char nombre[30];
    int edad;
} Persona;

Persona p = {"Ana", 20};
printf("%s %d\\n", p.nombre, p.edad);
Persona *pp = &p;
pp->edad++;              // con punteros: ->
Persona grupo[10];       // array de structs
\`\`\`
`,
  },
  {
    id: 'memoria',
    title: 'Memoria dinámica (stdlib.h)',
    md: `
\`\`\`c norun
int *v = malloc(n * sizeof(int));   // reservar
if (v == NULL) { /* sin memoria */ }
v = realloc(v, 2 * n * sizeof(int)); // agrandar
free(v);                             // liberar SIEMPRE
\`\`\`
`,
  },
  {
    id: 'math',
    title: 'math.h y stdlib.h',
    md: `
| Función | Ejemplo |
|---|---|
| \`sqrt(x)\` | raíz cuadrada |
| \`pow(b, e)\` | potencia |
| \`fabs(x)\` / \`abs(n)\` | valor absoluto (decimal / entero) |
| \`round\`, \`floor\`, \`ceil\` | redondear, hacia abajo, hacia arriba |
| \`sin\`, \`cos\`, \`tan\` | trigonometría (en radianes), \`M_PI\` |
| \`rand() % 6 + 1\` | dado de 1 a 6 (\`srand(time(NULL))\` al empezar) |
| \`atoi(s)\`, \`atof(s)\` | texto → número |
`,
  },
  {
    id: 'errores',
    title: 'Errores típicos',
    md: `
| Síntoma | Causa probable |
|---|---|
| "Falta ;" | olvidaste el punto y coma en la línea anterior |
| scanf no guarda nada | falta el \`&\`: \`scanf("%d", &x)\` |
| El double leído sale mal | en scanf usa \`%lf\` |
| \`7/2\` da 3 | división entera: usa \`7.0/2\` o \`(float)a/b\` |
| El \`if\` siempre se cumple | usaste \`=\` en vez de \`==\` |
| Te sales del array | el bucle va hasta \`<= N\`; debe ser \`< N\` |
| El \`%c\` se salta | quedó un \`\\n\` en la entrada: usa \`" %c"\` |
| Bucle infinito | la variable de la condición no cambia dentro del bucle |
| Cadenas con \`==\` | usa \`strcmp(a, b) == 0\` |
`,
  },
];
