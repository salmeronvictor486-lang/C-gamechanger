#include <stdio.h>
int main() {
    int n;
    while (scanf("%d", &n) == 1) {
        if (n > 0) printf("%d positivo\n", n);
        else if (n < 0) printf("%d negativo\n", n);
        else printf("cero\n");
        if (n % 2 == 0 && n != 0) printf("par\n"); else if (n != 0) printf("impar\n");
        switch (n) {
            case 1: printf("uno\n"); break;
            case 2:
            case 3: printf("dos o tres\n"); break;
            default: printf("otro\n");
        }
        printf("%s\n", n >= 10 ? "grande" : "pequeño");
    }
    return 0;
}
