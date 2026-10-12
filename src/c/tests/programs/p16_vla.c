#include <stdio.h>
void imprimir(int f, int c, int m[f][c]) {
    for (int i = 0; i < f; i++) { for (int j = 0; j < c; j++) printf("%d ", m[i][j]); printf("\n"); }
}
int main() {
    int n, f, c;
    scanf("%d", &n);
    int v[n];
    for (int i = 0; i < n; i++) v[i] = i * 2;
    int s = 0;
    for (int i = 0; i < n; i++) s += v[i];
    printf("%d %d\n", s, (int)sizeof(v));
    scanf("%d %d", &f, &c);
    int m[f][c];
    for (int i = 0; i < f; i++) for (int j = 0; j < c; j++) m[i][j] = i + j;
    imprimir(f, c, m);
    return 0;
}
