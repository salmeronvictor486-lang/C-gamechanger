#include <stdio.h>
#include <stdlib.h>
#include <string.h>
typedef struct Nodo { int v; struct Nodo *sig; } Nodo;
Nodo *push(Nodo *cab, int v) { Nodo *n = malloc(sizeof(Nodo)); n->v = v; n->sig = cab; return n; }
int main() {
    int n;
    scanf("%d", &n);
    int *v = (int *)malloc(n * sizeof(int));
    if (v == NULL) return 1;
    for (int i = 0; i < n; i++) v[i] = i * i;
    v = realloc(v, 2 * n * sizeof(int));
    for (int i = n; i < 2 * n; i++) v[i] = -i;
    for (int i = 0; i < 2 * n; i++) printf("%d ", v[i]);
    printf("\n");
    free(v);
    int *c = calloc(4, sizeof(int));
    printf("%d %d\n", c[0], c[3]);
    free(c);
    Nodo *lista = NULL;
    for (int i = 1; i <= 4; i++) lista = push(lista, i * 10);
    int total = 0;
    while (lista) { Nodo *s = lista->sig; total += lista->v; printf("%d ", lista->v); free(lista); lista = s; }
    printf("total %d\n", total);
    char *s = malloc(20);
    strcpy(s, "dinamico");
    printf("%s %d\n", s, (int)strlen(s));
    free(s);
    int **mat = malloc(3 * sizeof(int *));
    for (int i = 0; i < 3; i++) { mat[i] = malloc(3 * sizeof(int)); for (int j = 0; j < 3; j++) mat[i][j] = i * 3 + j; }
    printf("%d %d\n", mat[1][2], mat[2][0]);
    for (int i = 0; i < 3; i++) free(mat[i]);
    free(mat);
    return 0;
}
