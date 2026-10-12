#include <stdio.h>
#include <string.h>
struct Punto { int x, y; };
typedef struct {
    char nombre[30];
    int edad;
    float nota;
} Alumno;
typedef struct Nodo { int valor; struct Nodo *sig; } Nodo;
struct Punto mover(struct Punto p, int dx) { p.x += dx; return p; }
void cumple(Alumno *a) { a->edad++; }
float mediaNotas(Alumno v[], int n) { float s = 0; for (int i = 0; i < n; i++) s += v[i].nota; return s / n; }
int main() {
    struct Punto a = {1, 2}, b;
    b = a;
    b.x = 10;
    struct Punto c = mover(a, 5);
    printf("%d %d %d %d %d\n", a.x, a.y, b.x, c.x, c.y);
    Alumno al[3] = {{"Ana", 20, 8.5f}, {"Luis", 22, 6.0f}, {"Eva", 19, 9.25f}};
    cumple(&al[1]);
    for (int i = 0; i < 3; i++) printf("%-6s %3d %5.2f\n", al[i].nombre, al[i].edad, al[i].nota);
    printf("media %.3f\n", mediaNotas(al, 3));
    Alumno nuevo;
    strcpy(nuevo.nombre, "Mar");
    nuevo.edad = 30;
    nuevo.nota = 7.75;
    Alumno *pa = &nuevo;
    printf("%s %d %.2f\n", pa->nombre, (*pa).edad, pa->nota);
    Nodo n3 = {3, NULL}, n2 = {2, &n3}, n1 = {1, &n2};
    for (Nodo *it = &n1; it != NULL; it = it->sig) printf("%d->", it->valor);
    printf("NULL\n");
    printf("%d %d\n", (int)sizeof(struct Punto), (int)sizeof(Alumno));
    struct { char c; double d; int i; } mix;
    printf("%d\n", (int)sizeof(mix));
    enum Dia { LUNES, MARTES, MIERCOLES = 5, JUEVES };
    enum Dia d = JUEVES;
    printf("%d %d\n", MARTES, d);
    return 0;
}
