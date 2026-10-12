#include <stdio.h>
#include <math.h>
#include <stdlib.h>
int main() {
    printf("%.4f %.4f %.1f %.1f\n", sqrt(2), pow(2, 10), fabs(-3.5), ceil(2.1));
    printf("%.1f %.1f %.1f %.1f\n", floor(-2.1), round(2.5), round(-2.5), trunc(-2.7));
    printf("%.5f %.5f %.5f\n", sin(M_PI / 6), cos(0), atan2(1, 1));
    printf("%.3f %.3f %.3f\n", exp(1), log(M_E), log10(1000));
    printf("%.2f %d %d\n", fmod(7.5, 2), abs(-4), (int)pow(3, 4));
    double r = 2.5;
    printf("area %.3f\n", M_PI * r * r);
    printf("%d %d\n", atoi("123abc"), atoi("  -42"));
    printf("%.2f\n", atof("3.75"));
    srand(1);
    int a = rand(), b = rand();
    printf("%d %d\n", a, b);
    srand(42);
    printf("%d\n", rand() % 100);
    printf("%f\n", 1.0 / 3);
    printf("%.10f\n", 0.1 + 0.2);
    float f = 0.1f;
    printf("%.10f %.10f\n", f, (double)f * 3);
    printf("%g\n", sqrt(-1));
    return 0;
}
