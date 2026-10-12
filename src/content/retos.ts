// Retos extra: problemas para practicar, de fácil a difícil.
import { md, type Lesson } from './types';

const reto = (l: Omit<Lesson, 'kind'>): Lesson => ({ ...l, kind: 'reto' });

export const retos: Lesson[] = [
  // ───────────── fáciles ─────────────
  reto({
    id: 'reto-dni',
    title: 'La letra del DNI',
    difficulty: 1,
    theory: md`
**Temas:** operadores, resto (%), cadenas

La letra del DNI español no es aleatoria: se calcula con el **resto** de dividir el número entre 23, que indica la posición en esta cadena:

\`\`\`text
TRWAGMYFPDXBNJZSQVHLCKE
\`\`\`

Si el resto es 0 la letra es \`T\`, si es 1 es \`R\`, y así sucesivamente.
`,
    exercise: {
      task: md`
Lee un número de DNI (8 cifras) y escribe el DNI completo con su letra: \`12345678Z\`. Si el número no tiene como mucho 8 cifras (es decir, si es negativo o mayor que 99999999), escribe \`DNI no válido\`.
`,
      starter: md`#include <stdio.h>

int main() {
    int dni;
    scanf("%d", &dni);

    return 0;
}
`,
      solution: md`#include <stdio.h>

int main() {
    int dni;
    char letras[] = "TRWAGMYFPDXBNJZSQVHLCKE";
    scanf("%d", &dni);
    if (dni < 0 || dni > 99999999) {
        printf("DNI no válido\n");
    } else {
        printf("%08d%c\n", dni, letras[dni % 23]);
    }
    return 0;
}
`,
      tests: [{ input: '12345678\n' }, { input: '0\n' }, { input: '87654321\n' }, { input: '123456\n', name: 'con ceros delante' }, { input: '-5\n' }],
      hints: ['Guarda las letras en char letras[] = "TRWAGMYFPDXBNJZSQVHLCKE"; y usa letras[dni % 23].', 'Para que salgan los ceros de delante: %08d.'],
    },
  }),
  reto({
    id: 'reto-cambio',
    title: 'Dar el cambio',
    difficulty: 1,
    theory: md`
**Temas:** división entera, resto, arrays

Una máquina expendedora tiene que devolver el cambio con el **menor número de monedas** posible. Con monedas de 200, 100, 50, 20, 10, 5, 2 y 1 céntimos, basta con usar siempre la moneda más grande que quepa (algoritmo **voraz**).
`,
    exercise: {
      task: md`
Lee una cantidad en céntimos y escribe cuántas monedas de cada tipo hay que dar, solo de las que se usan, con el formato \`N x M cent\` (de mayor a menor). Al final escribe \`Total: T monedas\`.
`,
      starter: md`#include <stdio.h>

int main() {
    int monedas[8] = {200, 100, 50, 20, 10, 5, 2, 1};
    int cantidad;
    scanf("%d", &cantidad);

    return 0;
}
`,
      solution: md`#include <stdio.h>

int main() {
    int monedas[8] = {200, 100, 50, 20, 10, 5, 2, 1};
    int cantidad;
    scanf("%d", &cantidad);
    int total = 0;
    for (int i = 0; i < 8; i++) {
        int n = cantidad / monedas[i];
        if (n > 0) {
            printf("%d x %d cent\n", n, monedas[i]);
            cantidad %= monedas[i];
            total += n;
        }
    }
    printf("Total: %d monedas\n", total);
    return 0;
}
`,
      tests: [{ input: '388\n' }, { input: '5\n' }, { input: '1000\n' }, { input: '0\n' }],
      hints: ['Recorre las monedas de mayor a menor: cuántas caben es cantidad / moneda.', 'Lo que queda por devolver es cantidad % moneda.'],
    },
  }),
  reto({
    id: 'reto-triangulo',
    title: '¿Qué triángulo es?',
    difficulty: 1,
    theory: md`
**Temas:** condicionales, operadores lógicos

Tres longitudes forman un triángulo solo si **cada lado es menor que la suma de los otros dos**. Según sus lados, un triángulo es:

- **Equilátero**: los tres iguales.
- **Isósceles**: exactamente dos iguales.
- **Escaleno**: los tres distintos.
`,
    exercise: {
      task: md`
Lee tres lados enteros y escribe \`Equilátero\`, \`Isósceles\`, \`Escaleno\` o \`No es un triángulo\`.
`,
      starter: md`#include <stdio.h>

int main() {
    int a, b, c;
    scanf("%d %d %d", &a, &b, &c);

    return 0;
}
`,
      solution: md`#include <stdio.h>

int main() {
    int a, b, c;
    scanf("%d %d %d", &a, &b, &c);
    if (a <= 0 || b <= 0 || c <= 0 || a >= b + c || b >= a + c || c >= a + b) {
        printf("No es un triángulo\n");
    } else if (a == b && b == c) {
        printf("Equilátero\n");
    } else if (a == b || b == c || a == c) {
        printf("Isósceles\n");
    } else {
        printf("Escaleno\n");
    }
    return 0;
}
`,
      tests: [{ input: '3 3 3\n' }, { input: '3 3 5\n' }, { input: '5 3 3\n' }, { input: '3 4 5\n' }, { input: '1 2 3\n', name: 'degenerado' }, { input: '1 1 10\n' }],
      hints: ['Primero comprueba si NO es triángulo: algún lado mayor o igual que la suma de los otros dos.', 'Después, de más a menos exigente: los tres iguales, luego dos iguales.'],
    },
  }),
  reto({
    id: 'reto-multiplos',
    title: 'Múltiplos de 3 o 5',
    difficulty: 1,
    theory: md`
**Temas:** bucles, resto, acumuladores

El primer problema del famoso **Proyecto Euler**: si listamos los números menores que 10 que son múltiplos de 3 o de 5, obtenemos 3, 5, 6 y 9, que suman 23.
`,
    exercise: {
      task: md`
Lee \`n\` y escribe la suma de todos los números **menores que n** que son múltiplos de 3 **o** de 5. Usa \`long long\` para la suma.
`,
      starter: md`#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);

    return 0;
}
`,
      solution: md`#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    long long suma = 0;
    for (int i = 1; i < n; i++) {
        if (i % 3 == 0 || i % 5 == 0) {
            suma += i;
        }
    }
    printf("%lld\n", suma);
    return 0;
}
`,
      tests: [{ input: '10\n' }, { input: '1000\n' }, { input: '1\n' }, { input: '100000\n' }],
      hints: ['for (int i = 1; i < n; i++) y suma los que cumplan i % 3 == 0 || i % 5 == 0.'],
    },
  }),
  reto({
    id: 'reto-capicua',
    title: 'Números capicúa',
    difficulty: 1,
    theory: md`
**Temas:** while, cifras (% y /)

Un número es **capicúa** si se lee igual al derecho y al revés: 121, 4554, 7. Para comprobarlo, invierte el número cifra a cifra y compáralo con el original.
`,
    exercise: {
      task: md`
Lee números hasta que se escriba un número negativo. Para cada uno escribe \`N es capicúa\` o \`N no es capicúa\`. Al final escribe \`Capicúas: X\`.
`,
      starter: md`#include <stdio.h>

int main() {
    int n;

    return 0;
}
`,
      solution: md`#include <stdio.h>

int main() {
    int n, capicuas = 0;
    scanf("%d", &n);
    while (n >= 0) {
        int original = n, invertido = 0, x = n;
        while (x > 0) {
            invertido = invertido * 10 + x % 10;
            x /= 10;
        }
        if (invertido == original) {
            printf("%d es capicúa\n", original);
            capicuas++;
        } else {
            printf("%d no es capicúa\n", original);
        }
        scanf("%d", &n);
    }
    printf("Capicúas: %d\n", capicuas);
    return 0;
}
`,
      tests: [{ input: '121 4554 123 7 0 10 -1\n' }, { input: '-1\n' }],
      hints: ['Para cada número, invierte una copia (no el original: lo necesitas para comparar).', 'Cuidado con el 0: su invertido es 0, así que es capicúa.'],
    },
  }),
  reto({
    id: 'reto-cuadrado',
    title: 'Marco de asteriscos',
    difficulty: 1,
    theory: md`
**Temas:** bucles anidados, condicionales

Dibujar un cuadrado **hueco** es como dibujar uno lleno, pero escribiendo un \`*\` solo en los bordes (primera o última fila, primera o última columna) y un espacio en el resto.
`,
    exercise: {
      task: md`
Lee \`n\` (al menos 2) y dibuja un cuadrado hueco de \`n × n\`. Por ejemplo, con \`n = 4\`:

\`\`\`text
****
*  *
*  *
****
\`\`\`
`,
      starter: md`#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);

    return 0;
}
`,
      solution: md`#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);
    for (int f = 0; f < n; f++) {
        for (int c = 0; c < n; c++) {
            if (f == 0 || f == n - 1 || c == 0 || c == n - 1) {
                printf("*");
            } else {
                printf(" ");
            }
        }
        printf("\n");
    }
    return 0;
}
`,
      tests: [{ input: '4\n' }, { input: '2\n' }, { input: '7\n' }],
      examples: 0,
      hints: ['Dos for: filas y columnas.', 'Escribe * si f == 0, f == n - 1, c == 0 o c == n - 1; si no, un espacio.'],
    },
  }),
  reto({
    id: 'reto-cronometro',
    title: 'Formato de cronómetro',
    difficulty: 1,
    theory: md`
**Temas:** división entera, resto, printf con %02d

Los cronómetros escriben el tiempo como \`hh:mm:ss\`, siempre con dos cifras. Con \`%02d\`, printf rellena con un cero a la izquierda si hace falta: \`printf("%02d", 7)\` escribe \`07\`.
`,
    exercise: {
      task: md`
Lee dos duraciones en segundos (la de una carrera y la de otra) y escribe cada una en formato \`hh:mm:ss\`, y en una tercera línea la **diferencia** (siempre positiva) en el mismo formato, precedida de \`Diferencia: \`.
`,
      starter: md`#include <stdio.h>

int main() {
    int a, b;
    scanf("%d %d", &a, &b);

    return 0;
}
`,
      solution: md`#include <stdio.h>

void mostrar(int s) {
    printf("%02d:%02d:%02d\n", s / 3600, s % 3600 / 60, s % 60);
}

int main() {
    int a, b;
    scanf("%d %d", &a, &b);
    mostrar(a);
    mostrar(b);
    int d = a > b ? a - b : b - a;
    printf("Diferencia: ");
    mostrar(d);
    return 0;
}
`,
      tests: [{ input: '3725 3600\n' }, { input: '59 61\n' }, { input: '86399 0\n' }],
      hints: ['Horas: s / 3600. Minutos: s % 3600 / 60. Segundos: s % 60.', 'Una función void mostrar(int s) te ahorra repetir el printf tres veces.'],
    },
  }),

  // ───────────── medios ─────────────
  reto({
    id: 'reto-collatz',
    title: 'La conjetura de Collatz',
    difficulty: 2,
    theory: md`
**Temas:** while, condicionales, long long

Empieza con cualquier número positivo. Si es par, divídelo entre 2; si es impar, multiplícalo por 3 y súmale 1. Repite. La **conjetura de Collatz** dice que siempre se acaba llegando a 1… y nadie ha conseguido demostrarlo todavía.

Ejemplo con 6: 6 → 3 → 10 → 5 → 16 → 8 → 4 → 2 → 1 (8 pasos).
`,
    exercise: {
      task: md`
Lee un número y escribe la secuencia hasta llegar a 1, separada por \` -> \`, y en la línea siguiente \`Pasos: P\` y \`Máximo: M\` (el número más alto alcanzado) en dos líneas. Usa \`long long\`, porque la secuencia puede crecer mucho.
`,
      starter: md`#include <stdio.h>

int main() {
    long long n;
    scanf("%lld", &n);

    return 0;
}
`,
      solution: md`#include <stdio.h>

int main() {
    long long n;
    scanf("%lld", &n);
    int pasos = 0;
    long long max = n;
    printf("%lld", n);
    while (n != 1) {
        if (n % 2 == 0) {
            n /= 2;
        } else {
            n = 3 * n + 1;
        }
        if (n > max) max = n;
        pasos++;
        printf(" -> %lld", n);
    }
    printf("\nPasos: %d\nMáximo: %lld\n", pasos, max);
    return 0;
}
`,
      tests: [{ input: '6\n' }, { input: '1\n' }, { input: '27\n' }],
      hints: ['while (n != 1) { si es par n /= 2; si no n = 3 * n + 1; }', 'Escribe el primero antes del bucle y los siguientes con " -> %lld".'],
    },
  }),
  reto({
    id: 'reto-binario',
    title: 'Decimal a binario',
    difficulty: 2,
    theory: md`
**Temas:** while, arrays, división entre 2

Los ordenadores guardan todo en **binario** (ceros y unos). Para pasar un número a binario, se divide entre 2 una y otra vez: los **restos**, leídos al revés, son las cifras binarias.

13 → 13 % 2 = 1, 6 % 2 = 0, 3 % 2 = 1, 1 % 2 = 1 → al revés: **1101**.
`,
    exercise: {
      task: md`
Lee números positivos hasta el \`0\` y escribe cada uno en binario con el formato \`N = BINARIO\` (el 0 no se procesa). Guarda los restos en un array y escríbelos al revés.
`,
      starter: md`#include <stdio.h>

int main() {
    int n;

    return 0;
}
`,
      solution: md`#include <stdio.h>

int main() {
    int n;
    int bits[32];
    scanf("%d", &n);
    while (n != 0) {
        int k = 0, x = n;
        while (x > 0) {
            bits[k] = x % 2;
            x /= 2;
            k++;
        }
        printf("%d = ", n);
        for (int i = k - 1; i >= 0; i--) {
            printf("%d", bits[i]);
        }
        printf("\n");
        scanf("%d", &n);
    }
    return 0;
}
`,
      tests: [{ input: '13 1 2 255 1024 0\n' }, { input: '0\n' }],
      hints: ['Guarda los restos x % 2 en un array mientras x > 0 (dividiendo x entre 2).', 'Luego recorre el array del final al principio.'],
    },
  }),
  reto({
    id: 'reto-romanos',
    title: 'Números romanos',
    difficulty: 2,
    theory: md`
**Temas:** arrays paralelos, bucles

Los romanos usaban letras con valor: M=1000, D=500, C=100, L=50, X=10, V=5, I=1, y combinaciones restando como CM=900, CD=400, XC=90, XL=40, IX=9 e IV=4.

Con dos arrays "paralelos" (valores y símbolos) se convierte igual que el problema del cambio: usa el mayor valor que quepa, repítelo y sigue con los siguientes.
`,
    exercise: {
      task: md`
Lee un número del 1 al 3999 y escríbelo en números romanos. Si está fuera del rango, escribe \`Fuera de rango\`.
`,
      starter: md`#include <stdio.h>

int main() {
    int valores[] = {1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1};
    char *simbolos[] = {"M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"};
    int n;
    scanf("%d", &n);

    return 0;
}
`,
      solution: md`#include <stdio.h>

int main() {
    int valores[] = {1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1};
    char *simbolos[] = {"M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"};
    int n;
    scanf("%d", &n);
    if (n < 1 || n > 3999) {
        printf("Fuera de rango\n");
        return 0;
    }
    for (int i = 0; i < 13; i++) {
        while (n >= valores[i]) {
            printf("%s", simbolos[i]);
            n -= valores[i];
        }
    }
    printf("\n");
    return 0;
}
`,
      tests: [{ input: '1994\n' }, { input: '4\n' }, { input: '3999\n' }, { input: '2024\n' }, { input: '0\n' }],
      hints: ['Recorre los valores de mayor a menor; mientras n >= valores[i], escribe el símbolo y resta.'],
    },
  }),
  reto({
    id: 'reto-rombo',
    title: 'Rombo',
    difficulty: 2,
    theory: md`
**Temas:** bucles anidados, patrones

Un rombo es una pirámide y una pirámide invertida, una debajo de la otra (sin repetir la fila del medio). Haz una tabla de espacios y asteriscos por fila y busca las fórmulas.
`,
    exercise: {
      task: md`
Lee \`n\` y dibuja un rombo de asteriscos de altura \`2n - 1\`, sin espacios al final de las líneas. Con \`n = 3\`:

\`\`\`text
  *
 ***
*****
 ***
  *
\`\`\`
`,
      starter: md`#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);

    return 0;
}
`,
      solution: md`#include <stdio.h>

void fila(int espacios, int asteriscos) {
    for (int i = 0; i < espacios; i++) printf(" ");
    for (int i = 0; i < asteriscos; i++) printf("*");
    printf("\n");
}

int main() {
    int n;
    scanf("%d", &n);
    for (int i = 1; i <= n; i++) fila(n - i, 2 * i - 1);
    for (int i = n - 1; i >= 1; i--) fila(n - i, 2 * i - 1);
    return 0;
}
`,
      tests: [{ input: '3\n' }, { input: '1\n' }, { input: '6\n' }],
      examples: 0,
      hints: ['La mitad de arriba es la pirámide del capítulo for.', 'La de abajo, la misma con el bucle al revés, empezando en n - 1.'],
    },
  }),
  reto({
    id: 'reto-criba',
    title: 'La criba de Eratóstenes',
    difficulty: 2,
    theory: md`
**Temas:** arrays, bucles anidados

Hace 2200 años, Eratóstenes inventó un método rapidísimo para encontrar primos:

1. Escribe los números del 2 al n.
2. El primero sin tachar es primo. **Tacha todos sus múltiplos.**
3. Repite con el siguiente sin tachar.

En C, un array \`tachado[n + 1]\` de 0 y 1 hace de "papel".
`,
    exercise: {
      task: md`
Lee \`n\` (hasta 100000) y, con la criba, escribe cuántos primos hay hasta \`n\` y el **mayor** de ellos: \`Hay X primos. El mayor es P\`. Si no hay ninguno, \`No hay primos\`.
`,
      starter: md`#include <stdio.h>

int tachado[100001];

int main() {
    int n;
    scanf("%d", &n);

    return 0;
}
`,
      solution: md`#include <stdio.h>

int tachado[100001];

int main() {
    int n;
    scanf("%d", &n);
    int cuantos = 0, mayor = 0;
    for (int i = 2; i <= n; i++) {
        if (!tachado[i]) {
            cuantos++;
            mayor = i;
            for (long long m = (long long)i * i; m <= n; m += i) {
                tachado[m] = 1;
            }
        }
    }
    if (cuantos == 0) {
        printf("No hay primos\n");
    } else {
        printf("Hay %d primos. El mayor es %d\n", cuantos, mayor);
    }
    return 0;
}
`,
      tests: [{ input: '10\n' }, { input: '100000\n' }, { input: '1\n' }, { input: '2\n' }],
      hints: ['El array es global para que empiece a 0 y quepa sin problemas.', 'Si tachado[i] es 0, i es primo: tacha i*i, i*i + i, i*i + 2i… hasta n.'],
    },
  }),
  reto({
    id: 'reto-frecuencias',
    title: 'Frecuencia de letras',
    difficulty: 2,
    theory: md`
**Temas:** cadenas, arrays de contadores, ctype.h

En criptografía, contar qué letras aparecen más en un texto ayuda a romper cifrados: en castellano, la letra más frecuente suele ser la **e**. Usa un array de 26 contadores, uno por letra: \`cuenta[c - 'a']\`.
`,
    exercise: {
      task: md`
Lee un texto (una línea, sin tildes) y escribe, en orden alfabético, cada letra que aparece con su número de apariciones (sin distinguir mayúsculas), con el formato \`a: 3\`. Al final, \`Más frecuente: X\` (si hay empate, la primera en el alfabeto).
`,
      starter: md`#include <stdio.h>
#include <ctype.h>

int main() {
    char texto[500];
    int cuenta[26] = {0};
    fgets(texto, sizeof(texto), stdin);

    return 0;
}
`,
      solution: md`#include <stdio.h>
#include <ctype.h>

int main() {
    char texto[500];
    int cuenta[26] = {0};
    fgets(texto, sizeof(texto), stdin);
    for (int i = 0; texto[i] != '\0'; i++) {
        if (isalpha(texto[i])) {
            cuenta[tolower(texto[i]) - 'a']++;
        }
    }
    int max = 0;
    for (int i = 0; i < 26; i++) {
        if (cuenta[i] > 0) {
            printf("%c: %d\n", 'a' + i, cuenta[i]);
        }
        if (cuenta[i] > cuenta[max]) {
            max = i;
        }
    }
    printf("Más frecuente: %c\n", 'a' + max);
    return 0;
}
`,
      tests: [{ input: 'Hola Mundo\n' }, { input: 'El perro de San Roque no tiene rabo\n' }],
      hints: ["Para cada letra: cuenta[tolower(c) - 'a']++;", "Para escribir la letra i: printf(\"%c\", 'a' + i);"],
    },
  }),
  reto({
    id: 'reto-calendario',
    title: 'Calendario del mes',
    difficulty: 2,
    theory: md`
**Temas:** bucles, %, formato con anchos

Para dibujar un calendario hay que saber en qué día de la semana empieza el mes y cuántos días tiene. Cada día ocupa 3 caracteres (\`%3d\`) y hay que saltar de línea después de cada domingo.
`,
    exercise: {
      task: md`
Lee el día de la semana en que empieza el mes (1 = lunes … 7 = domingo) y el número de días. Escribe la cabecera \`  L  M  X  J  V  S  D\` y el calendario: cada día con \`%3d\`, los huecos del principio con 3 espacios, salto de línea tras cada domingo y al final (sin repetir el salto si el mes acaba en domingo).
`,
      starter: md`#include <stdio.h>

int main() {
    int inicio, dias;
    scanf("%d %d", &inicio, &dias);
    printf("  L  M  X  J  V  S  D\n");

    return 0;
}
`,
      solution: md`#include <stdio.h>

int main() {
    int inicio, dias;
    scanf("%d %d", &inicio, &dias);
    printf("  L  M  X  J  V  S  D\n");
    for (int i = 1; i < inicio; i++) {
        printf("   ");
    }
    int columna = inicio;
    for (int d = 1; d <= dias; d++) {
        printf("%3d", d);
        if (columna == 7) {
            printf("\n");
            columna = 1;
        } else {
            columna++;
        }
    }
    if (columna != 1) {
        printf("\n");
    }
    return 0;
}
`,
      tests: [{ input: '3 31\n' }, { input: '1 28\n', name: 'febrero perfecto' }, { input: '7 30\n' }],
      examples: 0,
      hints: ['Escribe inicio - 1 huecos de 3 espacios antes del día 1.', 'Lleva la cuenta de la columna (1 a 7); al escribir un domingo, salta de línea y vuelve a 1.'],
    },
  }),
  reto({
    id: 'reto-hanoi',
    title: 'Las torres de Hanói',
    difficulty: 2,
    theory: md`
**Temas:** recursividad

Hay tres postes (A, B y C) y n discos de distintos tamaños en el A, del más grande abajo al más pequeño arriba. Hay que pasarlos todos al C moviendo **un disco cada vez** y **sin poner nunca uno grande encima de uno pequeño**.

La solución recursiva es preciosa: para mover n discos de A a C usando B como ayuda:
1. Mueve n − 1 discos de A a B (usando C).
2. Mueve el disco grande de A a C.
3. Mueve los n − 1 discos de B a C (usando A).
`,
    exercise: {
      task: md`
Lee \`n\` y escribe todos los movimientos como \`Disco D: X -> Y\` (D es el tamaño del disco, 1 el más pequeño) y al final \`Movimientos: M\`.
`,
      starter: md`#include <stdio.h>

int main() {
    int n;
    scanf("%d", &n);

    return 0;
}
`,
      solution: md`#include <stdio.h>

int movimientos = 0;

void hanoi(int n, char origen, char destino, char ayuda) {
    if (n == 0) return;
    hanoi(n - 1, origen, ayuda, destino);
    printf("Disco %d: %c -> %c\n", n, origen, destino);
    movimientos++;
    hanoi(n - 1, ayuda, destino, origen);
}

int main() {
    int n;
    scanf("%d", &n);
    hanoi(n, 'A', 'C', 'B');
    printf("Movimientos: %d\n", movimientos);
    return 0;
}
`,
      tests: [{ input: '3\n' }, { input: '1\n' }, { input: '5\n' }],
      hints: ['void hanoi(int n, char origen, char destino, char ayuda) con caso base n == 0.', 'Llamada inicial: hanoi(n, \'A\', \'C\', \'B\');'],
    },
  }),

  // ───────────── difíciles ─────────────
  reto({
    id: 'reto-espiral',
    title: 'Matriz en espiral',
    difficulty: 3,
    theory: md`
**Temas:** matrices, bucles, control de límites

Rellena una matriz con los números 1, 2, 3… siguiendo una **espiral** hacia dentro: primero la fila de arriba hacia la derecha, luego la columna derecha hacia abajo, la fila de abajo hacia la izquierda, la columna izquierda hacia arriba… y vuelta a empezar más adentro.

Una técnica: guarda cuatro límites (\`arriba\`, \`abajo\`, \`izq\`, \`der\`) y estréchalos después de recorrer cada lado.
`,
    exercise: {
      task: md`
Lee \`n\` (hasta 10) y escribe la matriz espiral de \`n × n\` con cada número con \`%4d\`. Con \`n = 3\`:

\`\`\`text
   1   2   3
   8   9   4
   7   6   5
\`\`\`
`,
      starter: md`#include <stdio.h>

int main() {
    int m[10][10];
    int n;
    scanf("%d", &n);

    return 0;
}
`,
      solution: md`#include <stdio.h>

int main() {
    int m[10][10];
    int n;
    scanf("%d", &n);
    int arriba = 0, abajo = n - 1, izq = 0, der = n - 1, k = 1;
    while (arriba <= abajo && izq <= der) {
        for (int c = izq; c <= der; c++) m[arriba][c] = k++;
        arriba++;
        for (int f = arriba; f <= abajo; f++) m[f][der] = k++;
        der--;
        if (arriba <= abajo) {
            for (int c = der; c >= izq; c--) m[abajo][c] = k++;
            abajo--;
        }
        if (izq <= der) {
            for (int f = abajo; f >= arriba; f--) m[f][izq] = k++;
            izq++;
        }
    }
    for (int f = 0; f < n; f++) {
        for (int c = 0; c < n; c++) printf("%4d", m[f][c]);
        printf("\n");
    }
    return 0;
}
`,
      tests: [{ input: '3\n' }, { input: '1\n' }, { input: '4\n' }, { input: '7\n' }],
      examples: 0,
      hints: ['Cuatro bucles por vuelta: derecha, abajo, izquierda y arriba.', 'Después de cada lado, mueve el límite correspondiente hacia dentro.', 'Comprueba que los límites no se han cruzado antes de los lados de abajo y de la izquierda.'],
    },
  }),
  reto({
    id: 'reto-buscaminas',
    title: 'Buscaminas',
    difficulty: 3,
    theory: md`
**Temas:** matrices de char, vecinos, límites

En el Buscaminas, cada casilla sin mina muestra cuántas minas hay en sus **8 casillas vecinas**. Para recorrer los vecinos de \`(f, c)\` se usan dos bucles de \`-1\` a \`1\` y se ignoran los que se salen del tablero.
`,
    exercise: {
      task: md`
Lee filas y columnas (máximo 20) y el tablero (\`*\` = mina, \`.\` = vacía). Escribe el tablero resuelto: las minas como \`*\` y cada casilla vacía con el número de minas vecinas (\`0\` si no hay ninguna).
`,
      starter: md`#include <stdio.h>

int main() {
    char t[20][20];
    int filas, cols;
    scanf("%d %d", &filas, &cols);
    for (int f = 0; f < filas; f++)
        for (int c = 0; c < cols; c++)
            scanf(" %c", &t[f][c]);

    return 0;
}
`,
      solution: md`#include <stdio.h>

int main() {
    char t[20][20];
    int filas, cols;
    scanf("%d %d", &filas, &cols);
    for (int f = 0; f < filas; f++)
        for (int c = 0; c < cols; c++)
            scanf(" %c", &t[f][c]);
    for (int f = 0; f < filas; f++) {
        for (int c = 0; c < cols; c++) {
            if (t[f][c] == '*') {
                printf("*");
                continue;
            }
            int minas = 0;
            for (int df = -1; df <= 1; df++) {
                for (int dc = -1; dc <= 1; dc++) {
                    int nf = f + df, nc = c + dc;
                    if (nf >= 0 && nf < filas && nc >= 0 && nc < cols && t[nf][nc] == '*') {
                        minas++;
                    }
                }
            }
            printf("%d", minas);
        }
        printf("\n");
    }
    return 0;
}
`,
      tests: [{ input: '4 4\n*...\n....\n.*..\n....\n' }, { input: '3 5\n**...\n.....\n.*...\n' }, { input: '1 1\n.\n' }],
      hints: ['Para cada casilla vacía, recorre df y dc de -1 a 1.', 'Antes de mirar t[nf][nc], comprueba que nf y nc están dentro del tablero.'],
    },
  }),
  reto({
    id: 'reto-vida',
    title: 'El juego de la vida',
    difficulty: 3,
    theory: md`
**Temas:** matrices, vecinos, copiar matrices

El **juego de la vida** de John Conway es un "juego" sin jugadores: una cuadrícula de células vivas (\`#\`) o muertas (\`.\`) que evoluciona sola con estas reglas, aplicadas **a la vez** a todas las células:

- Una célula viva con 2 o 3 vecinas vivas **sobrevive**; si no, muere.
- Una célula muerta con exactamente 3 vecinas vivas **nace**.

Importante: hay que calcular la generación nueva en **otra matriz**, porque si cambias la original mientras la recorres, los vecinos de las siguientes células ya no son los de antes.
`,
    exercise: {
      task: md`
Lee filas, columnas (máximo 20), el número de generaciones \`g\` y la cuadrícula. Calcula \`g\` generaciones (los bordes no dan la vuelta: fuera del tablero todo está muerto) y escribe la cuadrícula final.
`,
      starter: md`#include <stdio.h>

int main() {
    char t[20][20], nueva[20][20];
    int filas, cols, g;
    scanf("%d %d %d", &filas, &cols, &g);
    for (int f = 0; f < filas; f++)
        for (int c = 0; c < cols; c++)
            scanf(" %c", &t[f][c]);

    return 0;
}
`,
      solution: md`#include <stdio.h>

int main() {
    char t[20][20], nueva[20][20];
    int filas, cols, g;
    scanf("%d %d %d", &filas, &cols, &g);
    for (int f = 0; f < filas; f++)
        for (int c = 0; c < cols; c++)
            scanf(" %c", &t[f][c]);
    for (int gen = 0; gen < g; gen++) {
        for (int f = 0; f < filas; f++) {
            for (int c = 0; c < cols; c++) {
                int vivas = 0;
                for (int df = -1; df <= 1; df++) {
                    for (int dc = -1; dc <= 1; dc++) {
                        if (df == 0 && dc == 0) continue;
                        int nf = f + df, nc = c + dc;
                        if (nf >= 0 && nf < filas && nc >= 0 && nc < cols && t[nf][nc] == '#') vivas++;
                    }
                }
                if (t[f][c] == '#') nueva[f][c] = (vivas == 2 || vivas == 3) ? '#' : '.';
                else nueva[f][c] = (vivas == 3) ? '#' : '.';
            }
        }
        for (int f = 0; f < filas; f++)
            for (int c = 0; c < cols; c++)
                t[f][c] = nueva[f][c];
    }
    for (int f = 0; f < filas; f++) {
        for (int c = 0; c < cols; c++) printf("%c", t[f][c]);
        printf("\n");
    }
    return 0;
}
`,
      tests: [
        { input: '5 5 1\n.....\n..#..\n..#..\n..#..\n.....\n', name: 'parpadeador' },
        { input: '5 5 2\n.....\n..#..\n..#..\n..#..\n.....\n' },
        { input: '6 6 4\n.#....\n..#...\n###...\n......\n......\n......\n', name: 'planeador' },
      ],
      hints: ['Cuenta las vecinas vivas sin contar la propia célula (df == 0 && dc == 0).', 'Escribe el resultado en nueva y, al acabar la generación, cópiala en t.'],
    },
  }),
  reto({
    id: 'reto-ordenar-palabras',
    title: 'Ordenar palabras',
    difficulty: 3,
    theory: md`
**Temas:** arrays de cadenas, strcmp, strcpy, ordenación

Una lista de palabras se guarda en una **matriz de char**: \`char palabras[50][30]\` son 50 palabras de hasta 29 letras. \`palabras[i]\` es la palabra i (una cadena normal). Para ordenarlas se compara con \`strcmp\` y se intercambian con \`strcpy\` y un array auxiliar.
`,
    exercise: {
      task: md`
Lee \`n\` (máximo 50) y \`n\` palabras (en minúsculas, sin tildes). Escríbelas ordenadas alfabéticamente, una por línea, **sin repetir** las que aparezcan varias veces, y al final \`Distintas: D\`.
`,
      starter: md`#include <stdio.h>
#include <string.h>

int main() {
    char palabras[50][30];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%29s", palabras[i]);
    }

    return 0;
}
`,
      solution: md`#include <stdio.h>
#include <string.h>

int main() {
    char palabras[50][30];
    int n;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%29s", palabras[i]);
    }
    char aux[30];
    for (int p = 0; p < n - 1; p++) {
        for (int j = 0; j < n - 1 - p; j++) {
            if (strcmp(palabras[j], palabras[j + 1]) > 0) {
                strcpy(aux, palabras[j]);
                strcpy(palabras[j], palabras[j + 1]);
                strcpy(palabras[j + 1], aux);
            }
        }
    }
    int distintas = 0;
    for (int i = 0; i < n; i++) {
        if (i == 0 || strcmp(palabras[i], palabras[i - 1]) != 0) {
            printf("%s\n", palabras[i]);
            distintas++;
        }
    }
    printf("Distintas: %d\n", distintas);
    return 0;
}
`,
      tests: [{ input: '6\nperro gato zorro gato abeja perro\n' }, { input: '1\nhola\n' }, { input: '4\nb a b a\n' }],
      hints: ['Burbuja con strcmp(palabras[j], palabras[j + 1]) > 0 y tres strcpy para intercambiar.', 'Una vez ordenadas, las repetidas quedan juntas: escribe una palabra solo si es distinta de la anterior.'],
    },
  }),
  reto({
    id: 'reto-binaria',
    title: 'Búsqueda binaria',
    difficulty: 3,
    theory: md`
**Temas:** arrays ordenados, while, divide y vencerás

Buscar en un array **ordenado** se puede hacer muchísimo más rápido que mirando uno a uno. Como en un diccionario: miras el centro; si lo que buscas va antes, descartas la mitad derecha, y si va después, la izquierda. En cada paso descartas la mitad: con un millón de elementos, bastan **20 pasos**.
`,
    exercise: {
      task: md`
Lee \`n\` (máximo 1000) números **ordenados de menor a mayor**, después \`q\` consultas. Para cada consulta, búscala con búsqueda binaria y escribe \`X está en la posición P (K pasos)\` o \`X no está (K pasos)\`, donde K es el número de veces que se miró un elemento central.
`,
      starter: md`#include <stdio.h>

int main() {
    int v[1000];
    int n, q, x;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &v[i]);
    }
    scanf("%d", &q);

    return 0;
}
`,
      solution: md`#include <stdio.h>

int main() {
    int v[1000];
    int n, q, x;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        scanf("%d", &v[i]);
    }
    scanf("%d", &q);
    for (int k = 0; k < q; k++) {
        scanf("%d", &x);
        int ini = 0, fin = n - 1, pasos = 0, pos = -1;
        while (ini <= fin) {
            int medio = (ini + fin) / 2;
            pasos++;
            if (v[medio] == x) {
                pos = medio;
                break;
            } else if (v[medio] < x) {
                ini = medio + 1;
            } else {
                fin = medio - 1;
            }
        }
        if (pos >= 0) printf("%d está en la posición %d (%d pasos)\n", x, pos, pasos);
        else printf("%d no está (%d pasos)\n", x, pasos);
    }
    return 0;
}
`,
      tests: [{ input: '10\n1 3 5 7 9 11 13 15 17 19\n4\n7 1 19 8\n' }, { input: '1\n5\n2\n5 6\n' }],
      hints: ['Dos índices ini y fin; mientras ini <= fin, mira el del medio.', 'Si v[medio] < x, ini = medio + 1; si es mayor, fin = medio - 1.'],
    },
  }),
  reto({
    id: 'reto-anagramas',
    title: 'Anagramas',
    difficulty: 2,
    theory: md`
**Temas:** cadenas, arrays de contadores

Dos palabras son **anagramas** si tienen exactamente las mismas letras en distinto orden: "amor" y "roma", "monja" y "jamón"… Un método sencillo: cuenta cuántas veces aparece cada letra en las dos palabras y compara los contadores.
`,
    exercise: {
      task: md`
Lee parejas de palabras (minúsculas, sin tildes) hasta encontrar la pareja \`fin fin\`. Para cada pareja escribe \`A y B son anagramas\` o \`A y B no son anagramas\`.
`,
      starter: md`#include <stdio.h>
#include <string.h>

int main() {
    char a[50], b[50];

    return 0;
}
`,
      solution: md`#include <stdio.h>
#include <string.h>

int sonAnagramas(const char *a, const char *b) {
    int cuenta[26] = {0};
    for (int i = 0; a[i]; i++) cuenta[a[i] - 'a']++;
    for (int i = 0; b[i]; i++) cuenta[b[i] - 'a']--;
    for (int i = 0; i < 26; i++) {
        if (cuenta[i] != 0) return 0;
    }
    return 1;
}

int main() {
    char a[50], b[50];
    while (scanf("%49s %49s", a, b) == 2 && !(strcmp(a, "fin") == 0 && strcmp(b, "fin") == 0)) {
        printf("%s y %s %s anagramas\n", a, b, sonAnagramas(a, b) ? "son" : "no son");
    }
    return 0;
}
`,
      tests: [{ input: 'amor roma\nhola halo\ngato toga\nperro pero\nfin fin\n' }, { input: 'fin fin\n' }],
      hints: ["Suma 1 en cuenta[letra - 'a'] por cada letra de la primera palabra y resta 1 por cada letra de la segunda.", 'Si al final todos los contadores son 0, son anagramas.'],
    },
  }),
  reto({
    id: 'reto-palabras',
    title: 'Estadísticas de un texto',
    difficulty: 2,
    theory: md`
**Temas:** cadenas, recorrer carácter a carácter, estados

¿Cuántas palabras tiene un texto? No basta con contar espacios: puede haber varios seguidos, o espacios al principio. Un truco: recorre el texto recordando si estás **dentro** de una palabra; cada vez que pasas de "fuera" a "dentro", empieza una palabra nueva.
`,
    exercise: {
      task: md`
Lee una línea de texto y escribe \`Palabras: N\`, \`Palabra más larga: P\` (la primera si hay empate) y \`Longitud media: M\` (1 decimal). Considera que una palabra es una secuencia de caracteres que no son espacios. Si no hay palabras, escribe solo \`Palabras: 0\`.
`,
      starter: md`#include <stdio.h>
#include <string.h>

int main() {
    char s[500];
    fgets(s, sizeof(s), stdin);
    s[strcspn(s, "\n")] = '\0';

    return 0;
}
`,
      solution: md`#include <stdio.h>
#include <string.h>

int main() {
    char s[500];
    fgets(s, sizeof(s), stdin);
    s[strcspn(s, "\n")] = '\0';
    int palabras = 0, letras = 0, mejorInicio = 0, mejorLargo = 0;
    int i = 0;
    while (s[i] != '\0') {
        while (s[i] == ' ') i++;
        if (s[i] == '\0') break;
        int inicio = i;
        while (s[i] != ' ' && s[i] != '\0') i++;
        int largo = i - inicio;
        palabras++;
        letras += largo;
        if (largo > mejorLargo) {
            mejorLargo = largo;
            mejorInicio = inicio;
        }
    }
    printf("Palabras: %d\n", palabras);
    if (palabras > 0) {
        printf("Palabra más larga: %.*s\n", mejorLargo, s + mejorInicio);
        printf("Longitud media: %.1f\n", (double)letras / palabras);
    }
    return 0;
}
`,
      tests: [{ input: 'El lenguaje C es muy rapido\n' }, { input: '   hola    mundo   \n' }, { input: '\n', name: 'vacía' }],
      hints: ['Salta los espacios, recuerda dónde empieza la palabra y avanza hasta el siguiente espacio.', 'Para escribir solo una parte de una cadena: printf("%.*s", largo, s + inicio); (o cópiala con strncpy).'],
    },
  }),
];
