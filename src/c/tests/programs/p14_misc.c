#include <stdio.h>
#include <stdbool.h>
#include <limits.h>
#define MAX(a, b) ((a) > (b) ? (a) : (b))
#define CUADRADO(x) ((x) * (x))
const int LIMITE = 3;
int global[5];
bool esPar(int n) { return n % 2 == 0; }
int main() {
    printf("%d %d %d\n", MAX(3, 9), CUADRADO(5), LIMITE);
    printf("%d %d\n", INT_MAX, INT_MIN);
    printf("%d %d %d\n", global[0], global[4], esPar(4));
    bool b = 5;
    printf("%d %d\n", b, true + true);
    int a = 5, c;
    c = a++ + ++a;
    printf("%d %d\n", a, c);
    int x = 10;
    x += 5; x -= 3; x *= 2; x /= 4; x %= 4;
    printf("%d\n", x);
    printf("%d %d %d\n", 5 & 3, 5 | 3, 5 ^ 3);
    printf("%d %d %d\n", 1 << 4, -16 >> 2, ~0);
    printf("%d %d %d\n", !0, !5, (3 > 2) + (2 > 3));
    int i = 0;
    if (i != 0 && 10 / i > 1) printf("no\n"); else printf("cortocircuito\n");
    printf("%lu %lu %lu %lu\n", sizeof(char), sizeof(int), sizeof(double), sizeof(long long));
    printf("%d\n", (int)3.99);
    printf("%d\n", (int)-3.99);
    printf("%.2f\n", (float)10 / 4);
    unsigned u = 3;
    printf("%d\n", -1 < u);
    printf("%d\n", 'a' + 1);
    int arr[3][2] = {{1, 2}, {3, 4}, {5, 6}};
    int *flat = &arr[0][0];
    printf("%d\n", flat[5]);
    int k;
    for (k = 0; k < 3; k++);
    printf("%d\n", k);
    return 0;
}
