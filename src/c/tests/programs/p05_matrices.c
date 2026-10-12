#include <stdio.h>
#define F 3
#define C 4
int main() {
    int m[F][C];
    int i, j, k = 1;
    for (i = 0; i < F; i++) for (j = 0; j < C; j++) m[i][j] = k++;
    for (i = 0; i < F; i++) {
        int fila = 0;
        for (j = 0; j < C; j++) { printf("%4d", m[i][j]); fila += m[i][j]; }
        printf(" | %d\n", fila);
    }
    for (j = 0; j < C; j++) {
        int col = 0;
        for (i = 0; i < F; i++) col += m[i][j];
        printf("%4d", col);
    }
    printf("\n");
    int t[C][F];
    for (i = 0; i < F; i++) for (j = 0; j < C; j++) t[j][i] = m[i][j];
    for (i = 0; i < C; i++) { for (j = 0; j < F; j++) printf("%3d", t[i][j]); printf("\n"); }
    int id[3][3] = {{1, 0, 0}, {0, 1, 0}, {0, 0, 1}};
    int a[3][3] = {1, 2, 3, 4, 5, 6, 7, 8, 9};
    int r[3][3] = {0};
    for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) for (k = 0; k < 3; k++) r[i][j] += a[i][k] * id[k][j];
    int diag = 0;
    for (i = 0; i < 3; i++) diag += r[i][i];
    printf("diag %d %d\n", diag, r[2][1]);
    char tablero[3][3];
    for (i = 0; i < 3; i++) for (j = 0; j < 3; j++) tablero[i][j] = (i + j) % 2 ? 'X' : 'O';
    for (i = 0; i < 3; i++) { for (j = 0; j < 3; j++) printf("%c", tablero[i][j]); printf("\n"); }
    printf("%d\n", (int)sizeof(m));
    return 0;
}
