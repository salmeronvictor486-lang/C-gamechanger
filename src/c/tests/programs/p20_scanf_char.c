#include <stdio.h>
int main() {
    int n;
    char c;
    scanf("%d", &n);
    scanf("%c", &c);
    printf("[%d]", c);
    scanf(" %c", &c);
    printf("[%c]\n", c);
    char nombre[20], ap[20];
    scanf("%s %s", nombre, ap);
    printf("%s, %s\n", ap, nombre);
    int d, m, y;
    scanf("%d/%d/%d", &d, &m, &y);
    printf("%02d-%02d-%04d\n", d, m, y);
    char linea[30];
    scanf(" %[^\n]", linea);
    printf("<%s>\n", linea);
    int r = scanf("%d", &n);
    printf("%d\n", r);
    return 0;
}
