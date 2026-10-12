#include <stdio.h>
int potencia(int b, int e) { return e == 0 ? 1 : b * potencia(b, e - 1); }
int sumaDigitos(int n) { return n < 10 ? n : n % 10 + sumaDigitos(n / 10); }
void binario(int n) { if (n > 1) binario(n / 2); printf("%d", n % 2); }
int busquedaBinaria(int v[], int ini, int fin, int x) {
    if (ini > fin) return -1;
    int m = (ini + fin) / 2;
    if (v[m] == x) return m;
    if (v[m] < x) return busquedaBinaria(v, m + 1, fin, x);
    return busquedaBinaria(v, ini, m - 1, x);
}
void invertir(char *s, int i, int j) { if (i >= j) return; char t = s[i]; s[i] = s[j]; s[j] = t; invertir(s, i + 1, j - 1); }
int sumaHasta(int n) { return n == 0 ? 0 : n + sumaHasta(n - 1); }
int main() {
    printf("%d %d\n", potencia(2, 10), sumaDigitos(98765));
    binario(37); printf("\n");
    int v[] = {1, 3, 5, 7, 9, 11, 13};
    printf("%d %d\n", busquedaBinaria(v, 0, 6, 11), busquedaBinaria(v, 0, 6, 4));
    char s[] = "recursion";
    invertir(s, 0, 8);
    printf("%s\n", s);
    printf("%d\n", sumaHasta(800));
    return 0;
}
