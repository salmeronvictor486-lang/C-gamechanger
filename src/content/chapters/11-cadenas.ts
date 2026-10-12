import { md, type Chapter } from '../types';

export const cadenas: Chapter = {
  id: 'cadenas',
  title: 'Cadenas de texto',
  subtitle: "Arrays de char, el '\\0', fgets, string.h y ctype.h",
  icon: '🧵',
  color: '#f78c6c',
  level: 2,
  lessons: [
    {
      id: 'str-intro',
      title: "Las cadenas y el '\\0'",
      theory: md`
## Un texto es un array de char

En C no existe un tipo "texto". Una **cadena** es un array de \`char\` que termina con un carácter especial: el **\`'\0'\`** (carácter nulo, código 0). Así se sabe dónde acaba el texto:

\`\`\`c
#include <stdio.h>

int main() {
    char saludo[10] = "Hola";
    printf("%s\n", saludo);
    for (int i = 0; i < 6; i++) {
        printf("saludo[%d] = '%c' (código %d)\n", i, saludo[i], saludo[i]);
    }
    return 0;
}
\`\`\`

| Índice | 0 | 1 | 2 | 3 | 4 | 5…9 |
|---|---|---|---|---|---|---|
| \`saludo\` | \`'H'\` | \`'o'\` | \`'l'\` | \`'a'\` | \`'\0'\` | \`'\0'\` |

- \`"Hola"\` ocupa **5** caracteres: 4 letras + el \`'\0'\`. Por eso el array tiene que tener **siempre un hueco más** que letras.
- \`char s[] = "Hola";\` crea un array de 5 justo.
- \`%s\` escribe caracteres **hasta encontrar el \`'\0'\`**.

## Recorrer una cadena

Como no sabemos de antemano cuánto mide, se recorre **hasta el \`'\0'\`**:

\`\`\`c
#include <stdio.h>

int main() {
    char palabra[] = "programar";
    int longitud = 0;
    while (palabra[longitud] != '\0') {
        longitud++;
    }
    printf("\"%s\" tiene %d letras\n", palabra, longitud);
    return 0;
}
\`\`\`

> ⚠️ Las letras con tilde y la ñ ocupan **2 bytes** (2 posiciones del array). Por eso en los ejercicios de recorrer letras usaremos textos sin tildes.
`,
      exercise: {
        task: md`
Lee una palabra (sin tildes, máximo 49 letras) con \`scanf("%s", ...)\` y, recorriéndola **hasta el \`'\0'\`** (sin \`strlen\`), escribe:

\`\`\`text
Longitud: N
Primera letra: P
Última letra: U
\`\`\`
`,
        starter: md`#include <stdio.h>

int main() {
    char palabra[50];
    scanf("%s", palabra);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    char palabra[50];
    scanf("%s", palabra);
    int n = 0;
    while (palabra[n] != '\0') {
        n++;
    }
    printf("Longitud: %d\n", n);
    printf("Primera letra: %c\n", palabra[0]);
    printf("Última letra: %c\n", palabra[n - 1]);
    return 0;
}
`,
        tests: [{ input: 'ordenador\n' }, { input: 'C\n', name: 'una letra' }, { input: 'supercalifragilistico\n' }],
        hints: ["Cuenta con un while (palabra[n] != '\\0') n++;", 'La última letra está en palabra[n - 1] (en palabra[n] está el \\0).'],
        forbids: [{ re: '\\bstrlen\\s*\\(', msg: 'Hazlo sin strlen: recorre hasta el \\0.' }],
      },
    },
    {
      id: 'str-leer',
      title: 'Leer frases con fgets',
      theory: md`
## scanf("%s") solo lee una palabra

\`scanf("%s", s)\` se para en el primer espacio. Para leer una **línea completa** se usa \`fgets\`:

\`\`\`c norun
fgets(cadena, tamaño, stdin);
\`\`\`

- \`tamaño\` es el tamaño del array: fgets nunca escribe más de eso (¡más seguro!).
- \`stdin\` significa "del teclado".
- fgets **guarda también el Enter** (\`'\n'\`) al final, si cabe. Normalmente se quita así:

\`\`\`c entrada="Hola, me llamo Ada Lovelace"
#include <stdio.h>
#include <string.h>

int main() {
    char frase[100];
    printf("Escribe una frase: ");
    fgets(frase, sizeof(frase), stdin);
    frase[strcspn(frase, "\n")] = '\0';     // quita el salto de línea
    printf("Has escrito: [%s]\n", frase);
    return 0;
}
\`\`\`

\`strcspn(frase, "\n")\` (de \`<string.h>\`) dice en qué posición está el primer \`'\n'\`; ahí ponemos el final de la cadena.

> ⚠️ Si antes de \`fgets\` has hecho un \`scanf("%d", ...)\`, el Enter de ese número se queda esperando y fgets lo leerá como una línea vacía. Para evitarlo, después del scanf consume el resto de la línea: \`while (getchar() != '\n');\`

> ⚠️ Nunca uses \`gets\`: no comprueba el tamaño y por eso se eliminó del lenguaje.
`,
      exercise: {
        task: md`
Lee tu **edad** con \`scanf\` y después tu **nombre completo** (con espacios) con \`fgets\`. Escribe \`Hola, NOMBRE. Tienes EDAD años.\`

Cuidado con el Enter que deja el \`scanf\` (mira el último aviso de la teoría).
`,
        starter: md`#include <stdio.h>
#include <string.h>

int main() {
    int edad;
    char nombre[80];
    printf("Edad: ");
    scanf("%d", &edad);
    printf("Nombre completo: ");

    return 0;
}
`,
        solution: md`#include <stdio.h>
#include <string.h>

int main() {
    int edad;
    char nombre[80];
    printf("Edad: ");
    scanf("%d", &edad);
    while (getchar() != '\n');
    printf("Nombre completo: ");
    fgets(nombre, sizeof(nombre), stdin);
    nombre[strcspn(nombre, "\n")] = '\0';
    printf("Hola, %s. Tienes %d años.\n", nombre, edad);
    return 0;
}
`,
        tests: [{ input: '17\nAda Lovelace\n' }, { input: '30\nMaría de los Ángeles García\n' }, { input: '8\nLeo\n' }],
        hints: ["Después del scanf, vacía el resto de la línea: while (getchar() != '\\n');", 'fgets(nombre, sizeof(nombre), stdin);', 'Quita el salto de línea: nombre[strcspn(nombre, "\\n")] = \'\\0\';'],
        requires: [{ re: '\\bfgets\\s*\\(', msg: 'Lee el nombre con fgets.' }],
      },
    },
    {
      id: 'str-recorrer',
      title: 'Recorrer y contar letras',
      theory: md`
## Mirar letra a letra

Con un \`for\` hasta el \`'\0'\` puedes analizar cada carácter:

\`\`\`c
#include <stdio.h>

int main() {
    char texto[] = "El perro de San Roque no tiene rabo";
    int espacios = 0, erres = 0;
    for (int i = 0; texto[i] != '\0'; i++) {
        if (texto[i] == ' ') {
            espacios++;
        }
        if (texto[i] == 'r' || texto[i] == 'R') {
            erres++;
        }
    }
    printf("Palabras: %d\n", espacios + 1);
    printf("Erres: %d\n", erres);
    return 0;
}
\`\`\`

Fíjate en la condición del \`for\`: \`texto[i] != '\0'\`. ¡Muy habitual!

Como los \`char\` son números, puedes comprobar **rangos**: \`c >= 'a' && c <= 'z'\` es "letra minúscula", y \`c >= '0' && c <= '9'\` es "dígito".
`,
      exercise: {
        task: md`
Lee una frase (sin tildes) con \`fgets\` y cuenta cuántas **vocales** (mayúsculas o minúsculas), **consonantes**, **dígitos** y **espacios** tiene:

\`\`\`text
Vocales: V
Consonantes: C
Dígitos: D
Espacios: E
\`\`\`

Las consonantes son las letras (a-z, A-Z) que no son vocales. Los signos de puntuación no cuentan en ningún grupo.
`,
        starter: md`#include <stdio.h>

int main() {
    char frase[200];
    fgets(frase, sizeof(frase), stdin);

    return 0;
}
`,
        solution: md`#include <stdio.h>

int main() {
    char frase[200];
    fgets(frase, sizeof(frase), stdin);
    int vocales = 0, consonantes = 0, digitos = 0, espacios = 0;
    for (int i = 0; frase[i] != '\0'; i++) {
        char c = frase[i];
        if (c >= 'A' && c <= 'Z') {
            c = c + ('a' - 'A');
        }
        if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u') {
            vocales++;
        } else if (c >= 'a' && c <= 'z') {
            consonantes++;
        } else if (c >= '0' && c <= '9') {
            digitos++;
        } else if (c == ' ') {
            espacios++;
        }
    }
    printf("Vocales: %d\n", vocales);
    printf("Consonantes: %d\n", consonantes);
    printf("Dígitos: %d\n", digitos);
    printf("Espacios: %d\n", espacios);
    return 0;
}
`,
        tests: [{ input: 'Hola Mundo 2024\n' }, { input: 'AEIOU aeiou\n' }, { input: 'C es genial, 100%!\n' }],
        hints: ["Recorre con for (int i = 0; frase[i] != '\\0'; i++).", "Para no repetir mayúsculas y minúsculas, convierte la letra a minúscula: si está entre 'A' y 'Z', súmale 'a' - 'A'.", 'Comprueba primero si es vocal; si no, si es letra (consonante); si no, si es dígito; si no, si es espacio.'],
      },
    },
    {
      id: 'str-stringh',
      title: 'La biblioteca string.h',
      theory: md`
## Funciones para cadenas

Con \`#include <string.h>\` tienes funciones ya hechas:

| Función | Qué hace |
|---|---|
| \`strlen(s)\` | longitud (sin contar el \`'\0'\`) |
| \`strcpy(destino, origen)\` | copia \`origen\` en \`destino\` |
| \`strcat(destino, origen)\` | añade \`origen\` al final de \`destino\` |
| \`strcmp(a, b)\` | compara: **0 si son iguales**, negativo si \`a\` va antes en el diccionario, positivo si va después |

\`\`\`c
#include <stdio.h>
#include <string.h>

int main() {
    char nombre[50] = "Ada";
    char completo[100];
    strcpy(completo, nombre);          // completo = "Ada"
    strcat(completo, " Lovelace");     // completo = "Ada Lovelace"
    printf("%s tiene %d caracteres\n", completo, (int)strlen(completo));
    if (strcmp(nombre, "Ada") == 0) {
        printf("¡Hola, Ada!\n");
    }
    printf("%d\n", strcmp("gato", "perro") < 0);   // 1: gato va antes
    return 0;
}
\`\`\`

> ⚠️ **No** se puede asignar una cadena con \`=\` (\`s = "hola";\` da error) ni comparar con \`==\` (compara direcciones de memoria, no las letras). Usa \`strcpy\` y \`strcmp\`.

> ⚠️ El destino de \`strcpy\` y \`strcat\` tiene que tener **sitio de sobra**. Si no cabe, se sale del array.

> 💡 \`strlen\` devuelve un tipo especial (\`size_t\`). Para escribirlo con \`%d\`, conviértelo: \`(int)strlen(s)\`.
`,
      exercise: {
        task: md`
Haz un control de acceso. La contraseña correcta es \`"gamechanger"\`. Pide la contraseña (una palabra) hasta **3 veces**:

- Si es correcta: \`Acceso concedido\` y termina.
- Si no: \`Contraseña incorrecta (quedan N intentos)\`.
- Si falla las 3: en vez del mensaje del último intento, escribe \`Acceso bloqueado\`.

Pide cada intento con \`Contraseña: \`.
`,
        starter: md`#include <stdio.h>
#include <string.h>

int main() {
    char clave[50];

    return 0;
}
`,
        solution: md`#include <stdio.h>
#include <string.h>

int main() {
    char clave[50];
    int intentos = 3;
    while (intentos > 0) {
        printf("Contraseña: ");
        scanf("%49s", clave);
        if (strcmp(clave, "gamechanger") == 0) {
            printf("Acceso concedido\n");
            return 0;
        }
        intentos--;
        if (intentos > 0) {
            printf("Contraseña incorrecta (quedan %d intentos)\n", intentos);
        }
    }
    printf("Acceso bloqueado\n");
    return 0;
}
`,
        tests: [{ input: 'gamechanger\n' }, { input: 'hola\nGamechanger\ngamechanger\n', name: 'al tercer intento' }, { input: 'a\nb\nc\n', name: 'bloqueado' }],
        hints: ['Compara con strcmp(clave, "gamechanger") == 0.', 'Un bucle con un contador de intentos. Si acierta, puedes terminar con return 0;'],
        requires: [{ re: '\\bstrcmp\\s*\\(', msg: 'Compara las cadenas con strcmp.' }],
      },
    },
    {
      id: 'str-ctype',
      title: 'Clasificar caracteres: ctype.h',
      theory: md`
## Funciones de ctype.h

\`#include <ctype.h>\` trae funciones para preguntar cosas de un carácter (devuelven verdadero o falso) y para convertirlo:

| Función | Pregunta / hace |
|---|---|
| \`isalpha(c)\` | ¿es una letra? |
| \`isdigit(c)\` | ¿es un dígito? |
| \`isalnum(c)\` | ¿letra o dígito? |
| \`isspace(c)\` | ¿espacio, tabulador o salto de línea? |
| \`isupper(c)\` / \`islower(c)\` | ¿mayúscula? / ¿minúscula? |
| \`toupper(c)\` / \`tolower(c)\` | devuelve la letra en mayúscula / minúscula |

\`\`\`c
#include <stdio.h>
#include <ctype.h>

int main() {
    char s[] = "Hola Mundo 123";
    for (int i = 0; s[i] != '\0'; i++) {
        s[i] = toupper(s[i]);
    }
    printf("%s\n", s);
    printf("%d %d\n", isdigit('7') != 0, isalpha('7') != 0);
    return 0;
}
\`\`\`

> 💡 Las funciones \`is...\` devuelven "algo distinto de 0" si es cierto (no necesariamente 1). Úsalas directamente en un \`if\`: \`if (isdigit(c))\`.
`,
      exercise: {
        task: md`
Lee una frase con \`fgets\` y escribe:

1. La frase **"en formato título"**: la primera letra de cada palabra en mayúscula y las demás en minúscula.
2. En la siguiente línea, \`Mayúsculas originales: N\` (cuántas mayúsculas tenía la frase original).

Una letra es "primera de palabra" si está al principio o justo después de un espacio.
`,
        starter: md`#include <stdio.h>
#include <ctype.h>
#include <string.h>

int main() {
    char s[200];
    fgets(s, sizeof(s), stdin);
    s[strcspn(s, "\n")] = '\0';

    return 0;
}
`,
        solution: md`#include <stdio.h>
#include <ctype.h>
#include <string.h>

int main() {
    char s[200];
    fgets(s, sizeof(s), stdin);
    s[strcspn(s, "\n")] = '\0';
    int mayusculas = 0;
    for (int i = 0; s[i] != '\0'; i++) {
        if (isupper(s[i])) {
            mayusculas++;
        }
        if (i == 0 || s[i - 1] == ' ') {
            s[i] = toupper(s[i]);
        } else {
            s[i] = tolower(s[i]);
        }
    }
    printf("%s\n", s);
    printf("Mayúsculas originales: %d\n", mayusculas);
    return 0;
}
`,
        tests: [{ input: 'el SEÑOR de los anillos\n' }, { input: 'aprender c ES divertido\n' }, { input: 'x\n' }],
        hints: ['Cuenta las mayúsculas con isupper ANTES de cambiar la letra.', "La letra es primera de palabra si i == 0 o s[i - 1] == ' '.", 'Usa toupper para las primeras y tolower para el resto.'],
        requires: [{ re: '\\btoupper\\s*\\(', msg: 'Usa toupper de ctype.h.' }],
      },
    },
    {
      id: 'str-invertir',
      title: 'Invertir y palíndromos',
      theory: md`
## Dos índices que se cruzan

Para **invertir** una cadena en el mismo array se usan dos índices: uno al principio y otro al final. Se intercambian sus letras y se van acercando hasta cruzarse:

\`\`\`c
#include <stdio.h>
#include <string.h>

int main() {
    char s[] = "programacion";
    int i = 0, j = strlen(s) - 1;
    while (i < j) {
        char aux = s[i];
        s[i] = s[j];
        s[j] = aux;
        i++;
        j--;
    }
    printf("%s\n", s);
    return 0;
}
\`\`\`

Un **palíndromo** se lee igual al derecho y al revés: "reconocer", "anilina", "somos". Con la misma técnica de dos índices, basta comparar \`s[i]\` con \`s[j]\`: si alguna pareja es distinta, no es palíndromo.
`,
      exercise: {
        task: md`
Lee una frase (sin tildes) con \`fgets\` y di si es un **palíndromo** ignorando espacios y mayúsculas. Por ejemplo, "Anita lava la tina" lo es. Escribe \`Es un palíndromo\` o \`No es un palíndromo\`.

Una forma sencilla: primero copia en otra cadena solo las letras, pasadas a minúscula; después comprueba esa cadena con dos índices.
`,
        starter: md`#include <stdio.h>
#include <ctype.h>
#include <string.h>

int main() {
    char frase[200];
    char letras[200];
    fgets(frase, sizeof(frase), stdin);

    return 0;
}
`,
        solution: md`#include <stdio.h>
#include <ctype.h>
#include <string.h>

int main() {
    char frase[200];
    char letras[200];
    fgets(frase, sizeof(frase), stdin);
    int n = 0;
    for (int i = 0; frase[i] != '\0'; i++) {
        if (isalpha(frase[i])) {
            letras[n] = tolower(frase[i]);
            n++;
        }
    }
    letras[n] = '\0';
    int es = 1;
    for (int i = 0, j = n - 1; i < j; i++, j--) {
        if (letras[i] != letras[j]) {
            es = 0;
            break;
        }
    }
    printf("%s\n", es ? "Es un palíndromo" : "No es un palíndromo");
    return 0;
}
`,
        tests: [{ input: 'Anita lava la tina\n' }, { input: 'Hola mundo\n' }, { input: 'Dabale arroz a la zorra el abad\n' }, { input: 'abca\n' }, { input: 'x\n' }],
        hints: ["Recorre la frase y, si isalpha(frase[i]), guarda tolower(frase[i]) en letras[n++]. Termina letras con '\\0'.", 'Después compara letras[i] con letras[j] desde los extremos hacia el centro.'],
      },
    },
    {
      id: 'str-proyecto',
      title: 'Proyecto: cifrado César',
      kind: 'proyecto',
      theory: md`
## El código de Julio César

Julio César escribía sus mensajes secretos **desplazando** cada letra unas posiciones en el alfabeto. Con desplazamiento 3: A→D, B→E, … X→A, Y→B, Z→C (al llegar al final, vuelve al principio).

Como los \`char\` son números, desplazar es sumar. Para dar la vuelta se usa el resto (\`%\`):

\`\`\`c
#include <stdio.h>

int main() {
    char c = 'y';
    int k = 3;
    char cifrada = (c - 'a' + k) % 26 + 'a';
    printf("%c -> %c\n", c, cifrada);
    return 0;
}
\`\`\`

\`c - 'a'\` convierte la letra en un número de 0 a 25; se suma el desplazamiento, \`% 26\` da la vuelta y \`+ 'a'\` lo convierte otra vez en letra.
`,
      exercise: {
        task: md`
Lee un número \`k\` (de 0 a 25) y después una frase con \`fgets\`. Escribe la frase **cifrada** con desplazamiento \`k\`:

- Las minúsculas se cifran como minúsculas y las mayúsculas como mayúsculas.
- Todo lo demás (espacios, números, signos) se queda igual.

Ejemplo: con \`k = 3\`, \`Hola, Mundo!\` → \`Krod, Pxqgr!\`
`,
        starter: md`#include <stdio.h>
#include <string.h>

int main() {
    int k;
    char s[200];
    scanf("%d", &k);
    while (getchar() != '\n');
    fgets(s, sizeof(s), stdin);
    s[strcspn(s, "\n")] = '\0';

    printf("%s\n", s);
    return 0;
}
`,
        solution: md`#include <stdio.h>
#include <string.h>

int main() {
    int k;
    char s[200];
    scanf("%d", &k);
    while (getchar() != '\n');
    fgets(s, sizeof(s), stdin);
    s[strcspn(s, "\n")] = '\0';
    for (int i = 0; s[i] != '\0'; i++) {
        if (s[i] >= 'a' && s[i] <= 'z') {
            s[i] = (s[i] - 'a' + k) % 26 + 'a';
        } else if (s[i] >= 'A' && s[i] <= 'Z') {
            s[i] = (s[i] - 'A' + k) % 26 + 'A';
        }
    }
    printf("%s\n", s);
    return 0;
}
`,
        tests: [{ input: '3\nHola, Mundo!\n' }, { input: '13\nAprender C es divertido\n' }, { input: '0\nNada cambia 123\n' }, { input: '25\nxyz ABC\n' }],
        hints: ["Recorre la frase; si la letra está entre 'a' y 'z', aplícale la fórmula de la teoría.", "Para mayúsculas, la misma fórmula con 'A'."],
      },
    },
    {
      id: 'str-examen',
      title: 'Examen: cadenas',
      kind: 'examen',
      theory: md`
## ¡Último examen del nivel 2!

Necesitas un **70 %**.
`,
      quiz: [
        { q: '¿Cuántos `char` ocupa la cadena `"perro"`?', options: ['5', '6', '4', '10'], answer: 1, explain: "5 letras + el '\\0' del final." },
        { q: '¿Cómo se comprueba si la cadena `s` es igual a "si"?', options: ['`s == "si"`', '`strcmp(s, "si") == 0`', '`strcmp(s, "si") == 1`', '`s = "si"`'], answer: 1, explain: 'strcmp devuelve 0 si son iguales. == compara direcciones.' },
        { q: '¿Qué escribe?', code: 'char s[20] = "Hola";\nstrcat(s, "!!");\nprintf("%d", (int)strlen(s));', options: ['4', '6', '20', '7'], answer: 1, explain: '"Hola!!" tiene 6 letras.' },
        { q: '¿Qué problema tiene `char s[5]; strcpy(s, "Hola mundo");`?', options: ['Ninguno', 'El texto no cabe y se sale del array', 'Falta el &', 'strcpy no existe'], answer: 1, explain: '"Hola mundo" necesita 11 posiciones.' },
        { q: 'Si el usuario escribe `Ana Pérez`, ¿qué guarda `scanf("%s", s)`?', options: ['Ana Pérez', 'Ana', 'Pérez', 'Nada'], answer: 1, explain: '%s se para en el espacio. Para frases, fgets.' },
        { q: "¿Qué vale `'7' - '0'`?", options: ["'7'", '7', '55', '0'], answer: 1, explain: "Los dígitos son consecutivos en ASCII: '7' - '0' = 7. Así se convierte un dígito en su número." },
      ],
    },
  ],
};
