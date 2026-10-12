#include <stdio.h>
int main() {
    int i, j;
    for (i = 1; i <= 5; i++) {
        for (j = 1; j <= i; j++) printf("*");
        printf("\n");
    }
    i = 10;
    while (i > 0) { printf("%d ", i); i -= 3; }
    printf("\n");
    do { printf("do %d\n", i); i++; } while (i < 2);
    int suma = 0;
    for (i = 0; i < 100; i++) {
        if (i % 3 == 0) continue;
        if (i > 50) break;
        suma += i;
    }
    printf("suma=%d\n", suma);
    long long f = 1;
    for (i = 1; i <= 20; i++) f *= i;
    printf("20! = %lld\n", f);
    for (i = 1; i <= 15; i++) {
        if (i % 15 == 0) printf("FizzBuzz\n");
        else if (i % 3 == 0) printf("Fizz\n");
        else if (i % 5 == 0) printf("Buzz\n");
        else printf("%d\n", i);
    }
    // piramide
    int n = 4;
    for (i = 1; i <= n; i++) {
        for (j = 0; j < n - i; j++) printf(" ");
        for (j = 0; j < 2 * i - 1; j++) printf("#");
        printf("\n");
    }
    return 0;
}
