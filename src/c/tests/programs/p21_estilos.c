#include <stdio.h>
#include <string.h>
#include <stdbool.h>
#define TAM 5
#define CUADRADO(x) ((x)*(x))
#define MAX(a,b) ((a)>(b)?(a):(b))
enum Color { ROJO, VERDE, AZUL };
struct Alumno { char nombre[20]; int notas[3]; };
typedef struct { int x, y; } P;
static int contador = 0;
const char *dias[] = {"lunes", "martes", "miercoles"};
int suma(int n, ...);
void cuenta(void) { contador++; }
int main(void) {
    int i, j;
    bool ok = true;
    printf("%d\n", ok);
    for (i = 0; i < 3; i++) printf("%s%s", dias[i], i < 2 ? ", " : "\n");
    struct Alumno a[2] = {{"Ana", {5, 6, 7}}, {"Bo", {9, 8, 10}}};
    for (i = 0; i < 2; i++) {
        int s = 0;
        for (j = 0; j < 3; j++) s += a[i].notas[j];
        printf("%-5s|%5.2f|\n", a[i].nombre, s / 3.0);
    }
    P pts[] = {[1] = {3, 4}, [0] = {.y = 2, .x = 1}};
    printf("%d %d %d %d\n", pts[0].x, pts[0].y, pts[1].x, pts[1].y);
    enum Color c = AZUL;
    switch (c) { case ROJO: puts("rojo"); break; case AZUL: puts("azul"); break; default: break; }
    printf("%d %d\n", CUADRADO(3 + 1), MAX(7, 2 * 5));
    for (i = 0; i < TAM; i++) cuenta();
    printf("contador=%d\n", contador);
    char nombres[3][10] = {"uno", "dos", "tres"};
    for (i = 0; i < 3; i++) printf("%s(%d) ", nombres[i], (int)strlen(nombres[i]));
    printf("\n");
    unsigned int u = 0;
    u--;
    printf("%u %x\n", u, u);
    long l = 1234567890123L;
    printf("%ld %lu\n", l, sizeof(l));
    int x = 10, y = 3;
    printf("%d %d %d %.3f\n", x / y, x % y, -x / y, (float)x / y);
    printf("%5s|%-5s|%.2s\n", "ab", "cd", "efgh");
    printf("%c%c%c\n", 72, 'i', 33);
    printf("%+.1e %G\n", 12345.6789, 0.000012345);
    int *p = &x, **pp = &p;
    **pp = 99;
    printf("%d\n", x);
    char s[] = "Hola";
    char *q = s + strlen(s) - 1;
    while (q >= s) putchar(*q--);
    putchar('\n');
    return 0;
}
