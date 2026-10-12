#include <stdio.h>
#include <stdlib.h>
#include <string.h>
int cmp(const void *a, const void *b) { return *(const int *)a - *(const int *)b; }
int desc(const void *a, const void *b) { return *(int *)b - *(int *)a; }
typedef struct { char n[10]; int p; } J;
int porPuntos(const void *a, const void *b) { return ((J *)b)->p - ((J *)a)->p; }
int aplicar(int (*f)(int), int x) { return f(x); }
int doble(int x) { return 2 * x; }
int main() {
    int v[] = {5, 2, 8, 1, 9, 3};
    qsort(v, 6, sizeof(int), cmp);
    for (int i = 0; i < 6; i++) printf("%d ", v[i]);
    printf("\n");
    qsort(v, 6, sizeof(int), desc);
    for (int i = 0; i < 6; i++) printf("%d ", v[i]);
    printf("\n");
    J js[3] = {{"ana", 5}, {"bea", 9}, {"cid", 7}};
    qsort(js, 3, sizeof(J), porPuntos);
    for (int i = 0; i < 3; i++) printf("%s:%d ", js[i].n, js[i].p);
    printf("\n%d\n", aplicar(doble, 21));
    int (*fp)(int) = doble;
    printf("%d\n", fp(4));
    return 0;
}
