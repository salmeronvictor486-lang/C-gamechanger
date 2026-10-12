#include <stdio.h>
int main() {
    int c, letras = 0, lineas = 0, digitos = 0;
    while ((c = getchar()) != EOF) {
        if (c == '\n') lineas++;
        else if (c >= '0' && c <= '9') digitos++;
        else if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) letras++;
        putchar(c >= 'a' && c <= 'z' ? c - 'a' + 'A' : c);
    }
    printf("letras=%d lineas=%d digitos=%d\n", letras, lineas, digitos);
    char x = 'z';
    x++;
    printf("%d\n", x);
    unsigned char u = 250;
    u += 10;
    printf("%d\n", u);
    for (char ch = 'a'; ch <= 'e'; ch++) printf("%c=%d ", ch, ch);
    printf("\n");
    return 0;
}
