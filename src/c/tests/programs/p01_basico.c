#include <stdio.h>
int main() {
    int a = 7, b = 2;
    printf("%d %d %d %d %d\n", a + b, a - b, a * b, a / b, a % b);
    printf("%d %d\n", -7 / 2, -7 % 2);
    float f = 7 / 2;
    double d = (double)a / b;
    printf("%f %.3f %lf\n", f, d, d);
    char c = 'A';
    printf("%c %d %c\n", c, c, c + 1);
    printf("[%5d] [%-5d] [%05d] [%+d] [% d]\n", 42, 42, 42, 42, 42);
    printf("[%8.3f] [%-8.2f] [%08.2f] [%.0f] [%.0f] [%.0f]\n", 3.14159, 2.5, -1.5, 0.5, 1.5, 2.5);
    printf("%x %X %o %#x %#o\n", 255, 255, 8, 255, 8);
    printf("%e %E %g %g %g %g\n", 123456.789, 0.000123, 100000.0, 1000000.0, 0.00001234, 3.0);
    printf("%s|%10s|%-10s|%.3s\n", "hola", "hola", "hola", "hola");
    printf("100%%\n");
    unsigned int u = 4294967295u;
    printf("%u %d\n", u, (int)u);
    long long big = 9223372036854775807LL;
    printf("%lld %ld\n", big, -5L);
    printf("%d\n", 2147483647 + 1 > 0);
    int x = 2147483647;
    x = x + 1;
    printf("%d\n", x);
    printf("%.2f %.2f %.2f\n", 1.005, 2.675, 1.125);
    printf("%g %g %g\n", 1e20, 1.5e-10, 123456789.0);
    printf("%10.4e|%-12g|\n", 3.14159, 2.5);
    return 0;
}
