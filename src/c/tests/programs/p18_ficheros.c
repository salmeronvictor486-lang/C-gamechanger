#include <stdio.h>
int main() {
    FILE *f = fopen("datos.txt", "w");
    if (f == NULL) return 1;
    for (int i = 1; i <= 3; i++) fprintf(f, "%d %d\n", i, i * i);
    fclose(f);
    f = fopen("datos.txt", "r");
    int a, b, s = 0;
    while (fscanf(f, "%d %d", &a, &b) == 2) s += b;
    fclose(f);
    printf("suma %d\n", s);
    f = fopen("datos.txt", "a");
    fputs("fin\n", f);
    fclose(f);
    f = fopen("datos.txt", "r");
    char linea[50];
    int n = 0;
    while (fgets(linea, 50, f) != NULL) n++;
    fclose(f);
    printf("%d lineas\n", n);
    FILE *g = fopen("noexiste.txt", "r");
    printf("%s\n", g == NULL ? "no existe" : "existe");
    remove("datos.txt");
    return 0;
}
