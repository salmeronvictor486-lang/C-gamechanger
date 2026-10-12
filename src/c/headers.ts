// Cabeceras de la biblioteca estándar que entiende el intérprete. Son C de verdad
// (prototipos y macros): el parser las lee como si las hubieras escrito tú.
// Las funciones declaradas aquí sin cuerpo las implementa `lib.ts`.

const STDIO = `
typedef unsigned long size_t;
typedef struct __FILE FILE;
extern FILE *stdin;
extern FILE *stdout;
extern FILE *stderr;
int printf(const char *format, ...);
int scanf(const char *format, ...);
int puts(const char *s);
int putchar(int c);
int getchar(void);
char *gets(char *s);
char *fgets(char *s, int n, FILE *stream);
int fputs(const char *s, FILE *stream);
int fputc(int c, FILE *stream);
int putc(int c, FILE *stream);
int fgetc(FILE *stream);
int getc(FILE *stream);
int ungetc(int c, FILE *stream);
int fprintf(FILE *stream, const char *format, ...);
int fscanf(FILE *stream, const char *format, ...);
int sprintf(char *s, const char *format, ...);
int snprintf(char *s, size_t n, const char *format, ...);
int sscanf(const char *s, const char *format, ...);
int fflush(FILE *stream);
void perror(const char *s);
FILE *fopen(const char *name, const char *mode);
int fclose(FILE *stream);
int feof(FILE *stream);
int remove(const char *name);
void rewind(FILE *stream);
#define NULL ((void*)0)
#define EOF (-1)
#define BUFSIZ 8192
#define SEEK_SET 0
#define SEEK_CUR 1
#define SEEK_END 2
`;

const STDLIB = `
typedef unsigned long size_t;
void *malloc(size_t size);
void *calloc(size_t n, size_t size);
void *realloc(void *p, size_t size);
void free(void *p);
int abs(int x);
long labs(long x);
long long llabs(long long x);
int atoi(const char *s);
long atol(const char *s);
long long atoll(const char *s);
double atof(const char *s);
long strtol(const char *s, char **end, int base);
double strtod(const char *s, char **end);
int rand(void);
void srand(unsigned int seed);
void exit(int status);
int system(const char *command);
void qsort(void *base, size_t n, size_t size, int (*cmp)(const void *, const void *));
#define NULL ((void*)0)
#define RAND_MAX 2147483647
#define EXIT_SUCCESS 0
#define EXIT_FAILURE 1
`;

const STRING = `
typedef unsigned long size_t;
size_t strlen(const char *s);
char *strcpy(char *dest, const char *src);
char *strncpy(char *dest, const char *src, size_t n);
char *strcat(char *dest, const char *src);
char *strncat(char *dest, const char *src, size_t n);
int strcmp(const char *a, const char *b);
int strncmp(const char *a, const char *b, size_t n);
char *strchr(const char *s, int c);
char *strrchr(const char *s, int c);
char *strstr(const char *s, const char *sub);
size_t strspn(const char *s, const char *accept);
size_t strcspn(const char *s, const char *reject);
char *strpbrk(const char *s, const char *accept);
char *strtok(char *s, const char *delim);
char *strdup(const char *s);
void *memset(void *p, int c, size_t n);
void *memcpy(void *dest, const void *src, size_t n);
void *memmove(void *dest, const void *src, size_t n);
int memcmp(const void *a, const void *b, size_t n);
void *memchr(const void *s, int c, size_t n);
char *strrev(char *s);
char *strupr(char *s);
char *strlwr(char *s);
#define NULL ((void*)0)
`;

const MATH = `
double sqrt(double x);
double pow(double x, double y);
double fabs(double x);
double ceil(double x);
double floor(double x);
double round(double x);
double trunc(double x);
double sin(double x);
double cos(double x);
double tan(double x);
double asin(double x);
double acos(double x);
double atan(double x);
double atan2(double y, double x);
double sinh(double x);
double cosh(double x);
double tanh(double x);
double exp(double x);
double log(double x);
double log10(double x);
double log2(double x);
double fmod(double x, double y);
double hypot(double x, double y);
double cbrt(double x);
double fmax(double x, double y);
double fmin(double x, double y);
long lround(double x);
float sqrtf(float x);
float powf(float x, float y);
float fabsf(float x);
float roundf(float x);
float floorf(float x);
float ceilf(float x);
#define M_PI 3.14159265358979323846
#define M_E 2.7182818284590452354
#define M_SQRT2 1.41421356237309504880
#define INFINITY (1.0f/0.0f)
#define NAN (0.0f/0.0f)
#define HUGE_VAL (1.0/0.0)
`;

const CTYPE = `
int isalpha(int c);
int isdigit(int c);
int isalnum(int c);
int isspace(int c);
int isupper(int c);
int islower(int c);
int ispunct(int c);
int isxdigit(int c);
int isprint(int c);
int iscntrl(int c);
int isgraph(int c);
int toupper(int c);
int tolower(int c);
`;

const TIME = `
typedef long time_t;
typedef long clock_t;
time_t time(time_t *t);
clock_t clock(void);
double difftime(time_t a, time_t b);
#define CLOCKS_PER_SEC 1000000l
#define NULL ((void*)0)
`;

const LIMITS = `
#define CHAR_BIT 8
#define SCHAR_MIN (-128)
#define SCHAR_MAX 127
#define UCHAR_MAX 255
#define CHAR_MIN (-128)
#define CHAR_MAX 127
#define SHRT_MIN (-32768)
#define SHRT_MAX 32767
#define USHRT_MAX 65535
#define INT_MIN (-2147483647-1)
#define INT_MAX 2147483647
#define UINT_MAX 4294967295u
#define LONG_MIN (-9223372036854775807l-1)
#define LONG_MAX 9223372036854775807l
#define ULONG_MAX 18446744073709551615ul
#define LLONG_MIN (-9223372036854775807ll-1)
#define LLONG_MAX 9223372036854775807ll
#define ULLONG_MAX 18446744073709551615ull
`;

const FLOAT = `
#define FLT_MAX 3.40282346638528859812e+38f
#define FLT_MIN 1.17549435082228750797e-38f
#define FLT_EPSILON 1.1920928955078125e-07f
#define DBL_MAX 1.79769313486231570815e+308
#define DBL_MIN 2.22507385850720138309e-308
#define DBL_EPSILON 2.22044604925031308085e-16
#define FLT_DIG 6
#define DBL_DIG 15
`;

const STDINT = `
typedef signed char int8_t;
typedef short int16_t;
typedef int int32_t;
typedef long int64_t;
typedef unsigned char uint8_t;
typedef unsigned short uint16_t;
typedef unsigned int uint32_t;
typedef unsigned long uint64_t;
#define INT8_MAX 127
#define INT16_MAX 32767
#define INT32_MAX 2147483647
#define INT64_MAX 9223372036854775807l
#define INT32_MIN (-2147483647-1)
#define UINT8_MAX 255
#define UINT32_MAX 4294967295u
`;

const STDBOOL = `
#define bool _Bool
#define true 1
#define false 0
`;

const LOCALE = `
char *setlocale(int category, const char *locale);
#define LC_ALL 6
#define LC_CTYPE 0
#define LC_NUMERIC 1
#define LC_TIME 2
#define NULL ((void*)0)
`;

const CONIO = `
int getch(void);
int getche(void);
void clrscr(void);
`;

const WINDOWS = `
void Sleep(unsigned long ms);
`;

const UNISTD = `
unsigned int sleep(unsigned int seconds);
int usleep(unsigned int us);
`;

const STDDEF = `
typedef unsigned long size_t;
typedef long ptrdiff_t;
#define NULL ((void*)0)
`;

export const HEADERS: Record<string, string> = {
  'stdio.h': STDIO,
  'stdlib.h': STDLIB,
  'string.h': STRING,
  'math.h': MATH,
  'ctype.h': CTYPE,
  'time.h': TIME,
  'limits.h': LIMITS,
  'float.h': FLOAT,
  'stdint.h': STDINT,
  'stdbool.h': STDBOOL,
  'locale.h': LOCALE,
  'conio.h': CONIO,
  'windows.h': WINDOWS,
  'unistd.h': UNISTD,
  'stddef.h': STDDEF,
  'assert.h': '',
  'iso646.h': '#define and &&\n#define or ||\n#define not !\n',
};

/** Nombres de C++ para las mismas cabeceras: <cstdio> = <stdio.h>. */
export const CPP_ALIASES: Record<string, string> = {
  cstdio: 'stdio.h',
  cstdlib: 'stdlib.h',
  cstring: 'string.h',
  cmath: 'math.h',
  cctype: 'ctype.h',
  ctime: 'time.h',
  climits: 'limits.h',
  cfloat: 'float.h',
  cstdint: 'stdint.h',
  cstdbool: 'stdbool.h',
  clocale: 'locale.h',
  cstddef: 'stddef.h',
};

/** ¿En qué cabecera está cada función? Para decir "te falta #include <math.h>". */
export const FUNCTION_HEADER: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [h, text] of Object.entries(HEADERS)) {
    for (const m of text.matchAll(/\b([A-Za-z_]\w*)\s*\(/g)) {
      const name = m[1];
      if (!(name in map) && !['sizeof', 'int', 'void'].includes(name)) map[name] = h;
    }
    for (const m of text.matchAll(/#define\s+([A-Za-z_]\w*)/g)) {
      if (!(m[1] in map)) map[m[1]] = h;
    }
    for (const m of text.matchAll(/\b([A-Za-z_]\w*)\s*;/g)) {
      if (!(m[1] in map) && /^(size_t|FILE|stdin|stdout|stderr|time_t|clock_t|u?int\d+_t)$/.test(m[1])) map[m[1]] = h;
    }
  }
  map['abs'] = 'stdlib.h';
  map['bool'] = 'stdbool.h';
  return map;
})();

export const UNSUPPORTED_HEADERS: Record<string, string> = {
  iostream: 'En C (y en esta web) se usa <stdio.h> con printf y scanf en lugar de <iostream> con cout y cin.',
  'iostream.h': 'En C se usa <stdio.h> con printf y scanf en lugar de cout y cin.',
  string: 'Para cadenas en C usa arrays de char y <string.h> (strlen, strcpy, strcmp…).',
  vector: 'En C no hay vector: usa arrays normales o memoria dinámica con malloc.',
  fstream: 'Para ficheros en C se usa fopen, fprintf y fclose de <stdio.h>.',
  'bits/stdc++.h': 'Esa cabecera es de C++. Aquí incluye solo lo que uses: <stdio.h>, <math.h>…',
  'malloc.h': 'malloc y free están en <stdlib.h>.',
};
