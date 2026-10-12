#include <stdio.h>
int main() {
    int a, b, n;
    char c;
    char linea[50];
    scanf("%d%d", &a, &b);
    printf("%d\n", a * b);
    scanf(" %c", &c);
    printf("[%c]\n", c);
    n = scanf("%d", &a);
    printf("n=%d\n", n);
    scanf("%s", linea);
    printf("<%s>\n", linea);
    while ((c = getchar()) != '\n' && c != EOF);
    fgets(linea, 50, stdin);
    printf("fgets:%s", linea);
    double d;
    float f;
    scanf("%lf %f", &d, &f);
    printf("%.3f %.3f\n", d, f);
    int h, m;
    scanf("%d:%d", &h, &m);
    printf("%02d.%02d\n", h, m);
    int r = scanf("%d", &a);
    printf("r=%d\n", r);
    return 0;
}
