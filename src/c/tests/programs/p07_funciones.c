#include <stdio.h>
int cuadrado(int x);
int esPrimo(int n) {
    if (n < 2) return 0;
    for (int i = 2; i * i <= n; i++) if (n % i == 0) return 0;
    return 1;
}
int mcd(int a, int b) { return b == 0 ? a : mcd(b, a % b); }
long long factorial(int n) { if (n <= 1) return 1; return n * factorial(n - 1); }
int fib(int n) { return n < 2 ? n : fib(n - 1) + fib(n - 2); }
void hanoi(int n, char a, char b, char c, int *movs) {
    if (n == 0) return;
    hanoi(n - 1, a, c, b, movs);
    (*movs)++;
    hanoi(n - 1, c, b, a, movs);
}
int contador = 0;
void incrementa(void) { contador++; }
int suma(int v[], int n) { int s = 0; for (int i = 0; i < n; i++) s += v[i]; return s; }
void dobla(int v[], int n) { for (int i = 0; i < n; i++) v[i] *= 2; }
double media(const int *v, int n) { return (double)suma((int *)v, n) / n; }
int veces(void) { static int k = 0; return ++k; }
int main() {
    printf("%d\n", cuadrado(7));
    for (int i = 0; i < 20; i++) if (esPrimo(i)) printf("%d ", i);
    printf("\n%d %lld %d\n", mcd(48, 18), factorial(15), fib(20));
    int movs = 0;
    hanoi(10, 'A', 'B', 'C', &movs);
    printf("hanoi %d\n", movs);
    incrementa(); incrementa();
    printf("contador %d\n", contador);
    int v[5] = {1, 2, 3, 4, 5};
    dobla(v, 5);
    printf("%d %.2f\n", suma(v, 5), media(v, 5));
    veces(); veces();
    printf("veces %d\n", veces());
    return 0;
}
int cuadrado(int x) { return x * x; }
