#include <stdio.h>
#include <math.h>
#include <limits.h>
#include <stdlib.h>
int main() {
    double vals[] = {0.0, -0.0, 1.0/3, 2.0/3, 1e-7, 123456789.123, 1e21, 0.5, 1.5, 2.5, -2.5, 0.125, 0.375, 1e300, 5e-324};
    for (int i = 0; i < 15; i++) printf("%f|%.0f|%.3e|%g|%.10g\n", vals[i], vals[i], vals[i], vals[i], vals[i]);
    printf("%d %d\n", INT_MAX, INT_MIN);
    printf("%lld\n", LLONG_MAX);
    printf("%.2f %.2f\n", round(-0.5), floor(-0.5));
    float f = 16777217;
    printf("%.1f\n", f);
    printf("%d %d %d\n", (int)2.9, (int)-2.9, (int)(0.1 + 0.2 == 0.3));
    printf("%e\n", pow(2, 100));
    printf("%.15f\n", M_PI);
    printf("%10.3f|%-10.1f|%010.2f\n", -3.14159, 2.0, 7.777);
    printf("%x %o %X %#x\n", 3054, 8, 48879, 0);
    printf("%hhd %hd\n", (char)300, (short)70000);
    short s = 32767; s++;
    printf("%d\n", s);
    char ch = 200;
    printf("%d\n", ch);
    unsigned char uc = 200;
    printf("%d\n", uc + 100);
    printf("%d\n", 7 / 2 * 2 + 7 % 2);
    printf("%.3f\n", sqrt(2) * sqrt(2));
    printf("%d\n", abs(-5) + (int)fabs(-2.5));
    return 0;
}
