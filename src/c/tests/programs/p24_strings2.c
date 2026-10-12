#include <stdio.h>
#include <string.h>
#include <ctype.h>
#include <stdlib.h>
int main() {
    char a[50] = "Hola", b[] = " mundo";
    strcat(a, b);
    printf("%s %d\n", a, (int)strlen(a));
    printf("%d %d\n", strcmp("abc", "abc") == 0, strncmp("abcdef", "abcxyz", 3));
    char *p = strstr(a, "mun");
    printf("%s %d\n", p, (int)(p - a));
    char copia[50];
    strncpy(copia, a, 4);
    copia[4] = '\0';
    printf("%s\n", copia);
    char num[] = "  -123xyz";
    printf("%d %ld %.2f\n", atoi(num), strtol("ff", NULL, 16), atof("2.5e2"));
    char buf[100];
    snprintf(buf, sizeof buf, "%s-%03d", "id", 7);
    printf("%s\n", buf);
    int x; char w[10];
    sscanf("42 hola", "%d %9s", &x, w);
    printf("%d %s\n", x, w);
    char frase[] = "  muchos   espacios aqui  ";
    int palabras = 0, dentro = 0;
    for (int i = 0; frase[i]; i++) {
        if (isspace((unsigned char)frase[i])) dentro = 0;
        else if (!dentro) { dentro = 1; palabras++; }
    }
    printf("%d\n", palabras);
    char t[] = "a,b;c d";
    for (char *tok = strtok(t, ",; "); tok; tok = strtok(NULL, ",; ")) printf("[%s]", tok);
    printf("\n");
    printf("%c %c %d\n", toupper('q'), tolower('Q'), isalnum('_') != 0);
    char *r = strrchr("a/b/c.txt", '/');
    printf("%s\n", r + 1);
    memset(buf, '*', 5);
    buf[5] = 0;
    printf("%s\n", buf);
    printf("%d\n", (int)strspn("123abc", "0123456789"));
    return 0;
}
