#include <stdio.h>
#include <stdlib.h>
typedef struct Nodo { int v; struct Nodo *izq, *der; } Nodo;
Nodo *insertar(Nodo *r, int v) {
    if (!r) { r = calloc(1, sizeof(Nodo)); r->v = v; return r; }
    if (v < r->v) r->izq = insertar(r->izq, v); else r->der = insertar(r->der, v);
    return r;
}
void inorden(Nodo *r) { if (!r) return; inorden(r->izq); printf("%d ", r->v); inorden(r->der); }
int altura(Nodo *r) { if (!r) return 0; int a = altura(r->izq), b = altura(r->der); return 1 + (a > b ? a : b); }
void liberar(Nodo *r) { if (!r) return; liberar(r->izq); liberar(r->der); free(r); }
int suma(int a, int b) { return a + b; }
int resta(int a, int b) { return a - b; }
int main() {
    Nodo *raiz = NULL;
    int datos[] = {50, 30, 70, 20, 40, 60, 80, 35};
    for (int i = 0; i < 8; i++) raiz = insertar(raiz, datos[i]);
    inorden(raiz);
    printf("\naltura %d\n", altura(raiz));
    liberar(raiz);
    int (*ops[2])(int, int) = {suma, resta};
    for (int i = 0; i < 2; i++) printf("%d ", ops[i](10, 4));
    printf("\n");
    int **m = malloc(3 * sizeof(int *));
    for (int i = 0; i < 3; i++) { m[i] = malloc(4 * sizeof(int)); for (int j = 0; j < 4; j++) m[i][j] = i * j; }
    int total = 0;
    for (int i = 0; i < 3; i++) for (int j = 0; j < 4; j++) total += *(*(m + i) + j);
    printf("%d\n", total);
    for (int i = 0; i < 3; i++) free(m[i]);
    free(m);
    int arr[5] = {1, 2, 3, 4, 5};
    int *ini = arr, *fin = arr + 4;
    while (ini < fin) { int t = *ini; *ini++ = *fin; *fin-- = t; }
    for (int i = 0; i < 5; i++) printf("%d", arr[i]);
    printf("\n");
    char *textos[] = {"cero", "uno", "dos"};
    char **pt = textos;
    printf("%s %c\n", *(pt + 2), **pt);
    return 0;
}
