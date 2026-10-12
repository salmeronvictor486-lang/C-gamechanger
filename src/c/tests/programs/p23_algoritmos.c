#include <stdio.h>
#include <stdlib.h>
#include <string.h>
void insercion(int v[], int n) {
    for (int i = 1; i < n; i++) {
        int x = v[i], j = i - 1;
        while (j >= 0 && v[j] > x) { v[j + 1] = v[j]; j--; }
        v[j + 1] = x;
    }
}
void seleccion(int *v, int n) {
    for (int i = 0; i < n - 1; i++) {
        int m = i;
        for (int j = i + 1; j < n; j++) if (v[j] < v[m]) m = j;
        int t = v[i]; v[i] = v[m]; v[m] = t;
    }
}
void merge(int *v, int *aux, int a, int b) {
    if (b - a < 2) return;
    int m = (a + b) / 2;
    merge(v, aux, a, m); merge(v, aux, m, b);
    int i = a, j = m, k = a;
    while (i < m && j < b) aux[k++] = v[i] <= v[j] ? v[i++] : v[j++];
    while (i < m) aux[k++] = v[i++];
    while (j < b) aux[k++] = v[j++];
    memcpy(v + a, aux + a, (b - a) * sizeof(int));
}
long long fibm[91];
long long fib(int n) { if (n < 2) return n; if (fibm[n]) return fibm[n]; return fibm[n] = fib(n - 1) + fib(n - 2); }
int main() {
    int v[10] = {9, 3, 7, 1, 8, 2, 6, 0, 5, 4}, w[10], z[10];
    memcpy(w, v, sizeof v);
    memcpy(z, v, sizeof(v));
    insercion(v, 10); seleccion(w, 10);
    int *aux = malloc(10 * sizeof *aux);
    merge(z, aux, 0, 10);
    free(aux);
    for (int i = 0; i < 10; i++) printf("%d%d%d ", v[i], w[i], z[i]);
    printf("\n%lld %lld\n", fib(50), fib(90));
    char palabra[] = "programacion";
    int freq[26] = {0};
    for (char *p = palabra; *p; p++) freq[*p - 'a']++;
    for (int i = 0; i < 26; i++) if (freq[i]) printf("%c%d", 'a' + i, freq[i]);
    printf("\n");
    int m[4][4];
    for (int i = 0; i < 4; i++) for (int j = 0; j < 4; j++) m[i][j] = (i == j) ? 1 : (i < j ? 2 : 3);
    for (int i = 0; i < 4; i++) { for (int j = 0; j < 4; j++) printf("%d", m[i][j]); printf("\n"); }
    return 0;
}
