#include <stdio.h>
#define N 8
int main() {
    int v[N] = {5, 3, 9, 1, 7, 2, 8, 4};
    int i, j, max = v[0], min = v[0], suma = 0;
    for (i = 0; i < N; i++) {
        suma += v[i];
        if (v[i] > max) max = v[i];
        if (v[i] < min) min = v[i];
    }
    printf("suma=%d max=%d min=%d media=%.2f\n", suma, max, min, (float)suma / N);
    for (i = 0; i < N - 1; i++)
        for (j = 0; j < N - 1 - i; j++)
            if (v[j] > v[j + 1]) { int t = v[j]; v[j] = v[j + 1]; v[j + 1] = t; }
    for (i = 0; i < N; i++) printf("%d%c", v[i], i == N - 1 ? '\n' : ' ');
    int w[] = {1, 2, 3};
    printf("%d %d\n", (int)(sizeof(w) / sizeof(w[0])), (int)sizeof(v));
    int z[5] = {0};
    z[2] = 9;
    for (i = 0; i < 5; i++) printf("%d", z[i]);
    printf("\n");
    double notas[4];
    for (i = 0; i < 4; i++) scanf("%lf", &notas[i]);
    double s = 0;
    for (i = 0; i < 4; i++) s += notas[i];
    printf("media %.2f\n", s / 4);
    int buscar = 7, pos = -1;
    int orig[N] = {5, 3, 9, 1, 7, 2, 8, 4};
    for (i = 0; i < N; i++) if (orig[i] == buscar) { pos = i; break; }
    printf("pos %d\n", pos);
    return 0;
}
