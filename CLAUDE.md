# CLAUDE.md — C Gamechanger

Guía del proyecto (para Victor y para el asistente de código). **Actualízala al terminar cada cambio grande.**

## Qué es
Web para aprender a programar en C (con `stdio.h`) al estilo de Codédex: lecciones por niveles,
ejercicios corregidos automáticamente, XP, rachas e insignias. Funciona entera en el navegador y se
publica gratis en GitHub Pages. Todo en castellano.

## Cómo trabajamos
- Hablar en castellano y explicar cada decisión técnica en 2-3 frases sencillas.
- Commits pequeños con Conventional Commits (`feat:`, `fix:`, `docs:`…), con el correo privado
  de GitHub (`237393936+salmeronvictor486-lang@users.noreply.github.com`).
- 0 € en servicios: sin backends, sin cuentas, sin telemetría. El progreso vive en `localStorage`.

## Stack
- React 19 + TypeScript 6 (estricto) + Vite 8. Editor: CodeMirror 6. Markdown: `marked`.
- Fuentes empaquetadas con `@fontsource` (Inter, JetBrains Mono, Pixelify Sans para la marca).
- Tests: Vitest. Comparan el intérprete con `gcc` si está instalado (en CI siempre).

## Arquitectura
```
src/
  c/              Intérprete de C propio
    lexer.ts        Tokens (y errores como comillas tipográficas o tildes en nombres)
    preprocessor.ts #include, #define (con parámetros), #if…
    headers.ts      Cabeceras de la biblioteca como C de verdad (prototipos y macros)
    parser.ts       Parser + comprobación de tipos en una pasada; todos los mensajes en castellano
    ast.ts, types.ts, ops.ts  Árbol con tipos, tipos de C (LP64) y aritmética de C
    machine.ts      Convierte el árbol en closures y ejecuta sobre memoria de bytes con comprobaciones
    lib.ts, format.ts  stdio/stdlib/string/math/ctype/time; printf con redondeo exacto como glibc
    tests/          programs/*.c comparados con gcc + tests de los mensajes de error
  runner/         Web Worker que ejecuta, sesión interactiva (scanf) y comprobación de ejercicios
  content/        Temario: chapters/NN-*.ts, retos.ts, reference.ts (chuleta); content.test.ts los valida
  pages/          Home (mapa), ChapterPage, LessonPage, Playground, Challenges, Reference, Profile
  ui/             Editor, Console, Markdown (bloques ```c ejecutables), Quiz, TestResults, Celebration, Mascot (Bit)
  state/          progress.ts (localStorage)
  game/           Rangos e insignias
```

## Decisiones tomadas
1. **Intérprete propio en vez de un compilador real (clang/tcc en WebAssembly)**: pesa poco, arranca
   al instante, y permite detectar errores que en C real son "comportamiento indefinido" (salirse de
   un array, usar variables sin valor, punteros NULL o liberados) y explicarlos en castellano.
2. **Mismo comportamiento que gcc en Linux x86-64**: `int` 4 bytes, `long` 8, punteros 8; `printf`
   redondea con el valor binario exacto (al par en los empates) y `rand()` usa el algoritmo de glibc.
3. **Valores en memoria de bytes** con un "mapa de inicialización" (para avisar de variables sin
   valor) y punteros con procedencia (`{a, o}`: dirección + objeto) para saber de qué array te sales.
4. **scanf interactivo sin bloquear**: el Worker ejecuta de forma síncrona; cuando falta entrada,
   para y, al escribir una línea, se vuelve a ejecutar desde el principio con toda la entrada y solo
   se muestra la salida nueva. Es determinista porque la hora y `rand()` se fijan al empezar.
5. **Los ejemplos de ejecución de cada ejercicio se generan ejecutando la solución**, así nunca están
   mal escritos. Si una prueba no trae `output`, la salida esperada es la de la solución.
6. **Etiqueta `md\`...\``** para escribir el temario: las barras invertidas se quedan tal cual.
7. **Rutas con `#`** y `base: './'` en Vite: GitHub Pages sirve archivos estáticos sin redirecciones.
8. **Recursión limitada a unas mil llamadas anidadas** (la pila de JavaScript); el mensaje lo explica.

## Comandos
| Comando | Qué hace |
| --- | --- |
| `npm install` | Instala dependencias |
| `npm run dev` | Web en local (http://localhost:5173) |
| `npm test` | Tests (intérprete vs gcc, mensajes, todas las lecciones) |
| `npm run typecheck` | Tipos |
| `npm run build` | Genera `dist/` |

## Añadir una lección
1. En `src/content/chapters/NN-tema.ts`, añade un objeto `Lesson` (teoría, `exercise` con `starter`,
   `solution`, `tests`, `hints`, y opcionalmente `requires`/`forbids` o `quiz`).
2. `npm test`: comprueba que la solución compila sin avisos, pasa sus pruebas y coincide con gcc.

## Publicación
`.github/workflows/pages.yml` publica en GitHub Pages en cada push a `main` (activar una vez en
Settings → Pages → Source: GitHub Actions). `ci.yml` pasa tipos, tests y build en cada push.
