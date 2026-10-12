#include <stdio.h>
int main() {
    char op;
    double a, b;
    int casos;
    scanf("%d", &casos);
    for (int i = 0; i < casos; i++) {
        scanf("%lf %c %lf", &a, &op, &b);
        switch (op) {
            case '+': printf("%.2f\n", a + b); break;
            case '-': printf("%.2f\n", a - b); break;
            case '*': printf("%.2f\n", a * b); break;
            case '/': if (b != 0) printf("%.2f\n", a / b); else printf("error\n"); break;
            default: printf("op?\n");
        }
    }
    int x, leidos = 0, suma = 0;
    while (scanf("%d", &x) != EOF) { suma += x; leidos++; }
    printf("%d numeros, suma %d\n", leidos, suma);
    return 0;
}
