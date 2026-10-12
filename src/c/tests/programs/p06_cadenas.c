#include <stdio.h>
#include <string.h>
#include <ctype.h>
int main() {
    char nombre[50];
    char frase[100];
    scanf("%49s", nombre);
    getchar();
    fgets(frase, sizeof(frase), stdin);
    frase[strcspn(frase, "\n")] = '\0';
    printf("Hola %s (%d letras)\n", nombre, (int)strlen(nombre));
    int vocales = 0, i;
    for (i = 0; frase[i] != '\0'; i++) {
        char c = tolower(frase[i]);
        if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') vocales++;
    }
    printf("vocales: %d\n", vocales);
    char copia[100];
    strcpy(copia, frase);
    strcat(copia, "!!");
    printf("%s\n", copia);
    printf("%d %d %d\n", strcmp("abc", "abd") < 0, strcmp("b", "a") > 0, strcmp("x", "x"));
    for (i = 0; copia[i]; i++) copia[i] = toupper(copia[i]);
    printf("%s\n", copia);
    char inv[100];
    int n = strlen(frase);
    for (i = 0; i < n; i++) inv[i] = frase[n - 1 - i];
    inv[n] = '\0';
    printf("%s\n", inv);
    char pal[] = "reconocer";
    int ok = 1, L = strlen(pal);
    for (i = 0; i < L / 2; i++) if (pal[i] != pal[L - 1 - i]) ok = 0;
    printf("%s %s\n", pal, ok ? "es palindromo" : "no");
    char *p = strchr(frase, 'o');
    if (p) printf("desde o: %s\n", p);
    char tok[] = "uno,dos,,tres";
    char *t = strtok(tok, ",");
    while (t != NULL) { printf("[%s]", t); t = strtok(NULL, ","); }
    printf("\n");
    char buf[64];
    sprintf(buf, "%d-%s-%.1f", 42, "x", 2.25);
    printf("%s %d\n", buf, (int)strlen(buf));
    int edad; char ciudad[20];
    sscanf("25 Madrid", "%d %s", &edad, ciudad);
    printf("%d %s\n", edad, ciudad);
    printf("%d %d %d\n", isdigit('5'), isalpha('5') != 0, isspace(' ') != 0);
    char s2[10] = "ab";
    strncpy(s2, "xyz", 2);
    printf("%s\n", s2);
    printf("%s\n", strstr("buenos dias", "dia"));
    return 0;
}
