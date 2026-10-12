# C Gamechanger

**Aprende a programar en C (con `stdio.h`, la base de C++) jugando, directamente en el navegador.**

Una web al estilo de Codédex: lecciones cortas, ejercicios que se corrigen solos, experiencia (XP), rachas, rangos e insignias. Todo es gratis, sin cuentas y sin servidores: el código C se ejecuta dentro de tu navegador.

👉 **Web:** https://salmeronvictor486-lang.github.io/C-gamechanger/

## Qué incluye

- **16 capítulos y 118 lecciones** en tres niveles:
  - **Principiante:** hola mundo y `printf`, variables y tipos, operadores, leer datos con `scanf`, condicionales (`if`, `else if`, `switch`, operador ternario).
  - **Intermedio:** bucles `while`, `do-while` y `for`, arrays, matrices y cadenas de texto.
  - **Avanzado:** funciones y recursividad, punteros, estructuras, memoria dinámica (`malloc`, `free`, listas enlazadas) y ficheros.
- Cada lección tiene **teoría con ejemplos que se ejecutan ahí mismo**, un **ejercicio** con pruebas automáticas, **pistas** y la **solución**.
- **Proyectos** al final de cada capítulo (calculadora, cajero automático, tres en raya, cifrado César, agenda…) y un **examen** tipo test.
- **22 retos extra** de fácil a difícil (letra del DNI, números romanos, Hanói, buscaminas, el juego de la vida…).
- **Zona de práctica** para escribir cualquier programa, con ejemplos y enlaces para compartir código.
- **Chuleta** con todo C en una página.
- **Perfil** con XP, rangos («Novato del printf» → «Maestro del C»), racha de días, insignias y exportar/importar el progreso.

## Un compilador de C que explica los errores

La web incluye un intérprete de C propio, escrito en TypeScript, que entiende el C que se enseña en clase (`stdio.h`, `stdlib.h`, `string.h`, `math.h`, `ctype.h`, `time.h`…) y además **avisa en castellano** de los fallos típicos de quien empieza:

- `Falta ';' al final de la línea 4`
- `A scanf hay que pasarle la dirección de 'x': falta el &`
- `Te sales del array 'v': usas v[5], pero solo tiene 5 elementos (del 0 al 4)`
- `La variable 'suma' se usa sin haberle dado un valor`
- `%d es para enteros, pero 'x' es decimal (float)`
- `Para leer un double con scanf se usa %lf`
- `En C, "a < b < c" no funciona como en matemáticas`
- punteros `NULL`, memoria liberada dos veces, bucles infinitos, recursión sin caso base…

`scanf` es **interactivo**: la consola te deja escribir mientras el programa espera. La salida de `printf` (incluidos `%f`, `%e`, `%g` y los redondeos) y `rand()` dan exactamente lo mismo que `gcc` en Linux: los tests lo comprueban con decenas de programas.

## Para desarrollar

Hace falta [Node.js](https://nodejs.org) 22 o más nuevo.

```bash
npm install        # instala las dependencias
npm run dev        # abre la web en http://localhost:5173
npm test           # tests: el intérprete comparado con gcc y todas las lecciones
npm run build      # genera la web en dist/
```

Los tests comparan con `gcc` si está instalado (en GitHub Actions siempre lo está).

## Publicarla (gratis)

La web se publica en **GitHub Pages** con el workflow `.github/workflows/pages.yml` cada vez que se sube algo a `main`. La primera vez hay que activarlo una sola vez en GitHub:

**Settings → Pages → Build and deployment → Source: GitHub Actions**

Después, cada cambio en `main` actualiza la web en `https://salmeronvictor486-lang.github.io/C-gamechanger/`.

## Cómo está hecho

- **React 19 + TypeScript + Vite**, editor **CodeMirror 6**.
- `src/c/`: el intérprete (lexer, preprocesador, parser con tipos, máquina que ejecuta sobre memoria de bytes y biblioteca estándar).
- `src/runner/`: ejecuta los programas en un Web Worker (se pueden parar) y comprueba los ejercicios.
- `src/content/`: el temario. Cada lección es un objeto con teoría, ejercicio, pruebas, pistas y solución; los tests verifican que cada solución compila sin avisos, supera sus pruebas y da lo mismo que gcc.
- El progreso se guarda en el navegador (`localStorage`).
