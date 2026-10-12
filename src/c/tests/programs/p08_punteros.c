#include <stdio.h>
void intercambiar(int *a, int *b) { int t = *a; *a = *b; *b = t; }
void minmax(int v[], int n, int *mn, int *mx) {
    *mn = *mx = v[0];
    for (int i = 1; i < n; i++) { if (v[i] < *mn) *mn = v[i]; if (v[i] > *mx) *mx = v[i]; }
}
int longitud(const char *s) { const char *p = s; while (*p) p++; return p - s; }
int main() {
    int x = 5, y = 10;
    int *p = &x;
    *p = 20;
    printf("%d %d\n", x, *p);
    intercambiar(&x, &y);
    printf("%d %d\n", x, y);
    int v[] = {4, 8, 1, 9, 3};
    int mn, mx;
    minmax(v, 5, &mn, &mx);
    printf("%d %d\n", mn, mx);
    int *q = v;
    printf("%d %d %d\n", *q, *(q + 2), q[4]);
    q++;
    printf("%d %d\n", *q, (int)(q - v));
    for (int *r = v; r < v + 5; r++) printf("%d ", *r);
    printf("\n%d\n", longitud("programar"));
    int **pp = &p;
    **pp = 99;
    printf("%d\n", x);
    char s[] = "abc";
    char *c = s;
    while (*c) { *c = *c - 32; c++; }
    printf("%s\n", s);
    int *nulo = NULL;
    printf("%d\n", nulo == NULL);
    printf("%d\n", p == &x);
    return 0;
}
