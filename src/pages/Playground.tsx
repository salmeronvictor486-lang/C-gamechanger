// Zona de práctica: escribe cualquier programa y ejecútalo.
import { useCallback, useEffect, useRef, useState } from 'react';
import { decodeShare, encodeShare } from '../app/router';
import { getProgress, setPlayground, useProgress, update } from '../state/progress';
import { Console } from '../ui/Console';
import { Editor, type EditorHandle } from '../ui/Editor';
import { useRunner } from '../ui/useRunner';

const EXAMPLES: { name: string; code: string }[] = [
  {
    name: 'Hola, mundo',
    code: `#include <stdio.h>

int main() {
    printf("¡Hola, mundo!\\n");
    return 0;
}
`,
  },
  {
    name: 'Calculadora',
    code: `#include <stdio.h>

int main() {
    double a, b;
    char op;
    printf("Escribe una operación (por ejemplo 3 + 4): ");
    scanf("%lf %c %lf", &a, &op, &b);
    switch (op) {
        case '+': printf("= %g\\n", a + b); break;
        case '-': printf("= %g\\n", a - b); break;
        case '*': printf("= %g\\n", a * b); break;
        case '/':
            if (b != 0) printf("= %g\\n", a / b);
            else printf("No se puede dividir entre 0\\n");
            break;
        default: printf("Operación desconocida\\n");
    }
    return 0;
}
`,
  },
  {
    name: 'Adivina el número',
    code: `#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int main() {
    srand(time(NULL));
    int secreto = rand() % 100 + 1;
    int intento, intentos = 0;
    printf("He pensado un número del 1 al 100.\\n");
    do {
        printf("Tu intento: ");
        scanf("%d", &intento);
        intentos++;
        if (intento < secreto) printf("Más alto ⬆\\n");
        else if (intento > secreto) printf("Más bajo ⬇\\n");
    } while (intento != secreto);
    printf("¡Acertaste en %d intentos!\\n", intentos);
    return 0;
}
`,
  },
  {
    name: 'Tabla de multiplicar',
    code: `#include <stdio.h>

int main() {
    int n;
    printf("¿Qué tabla quieres? ");
    scanf("%d", &n);
    for (int i = 1; i <= 10; i++) {
        printf("%2d x %2d = %3d\\n", n, i, n * i);
    }
    return 0;
}
`,
  },
  {
    name: 'Triángulo de asteriscos',
    code: `#include <stdio.h>

int main() {
    int altura = 5;
    for (int fila = 1; fila <= altura; fila++) {
        for (int e = 0; e < altura - fila; e++) printf(" ");
        for (int a = 0; a < 2 * fila - 1; a++) printf("*");
        printf("\\n");
    }
    return 0;
}
`,
  },
  {
    name: 'Ordenar un array (burbuja)',
    code: `#include <stdio.h>

#define N 8

int main() {
    int v[N] = {42, 7, 19, 3, 88, 25, 1, 60};
    for (int i = 0; i < N - 1; i++) {
        for (int j = 0; j < N - 1 - i; j++) {
            if (v[j] > v[j + 1]) {
                int aux = v[j];
                v[j] = v[j + 1];
                v[j + 1] = aux;
            }
        }
    }
    for (int i = 0; i < N; i++) printf("%d ", v[i]);
    printf("\\n");
    return 0;
}
`,
  },
  {
    name: 'Fibonacci recursivo',
    code: `#include <stdio.h>

int fib(int n) {
    if (n < 2) return n;
    return fib(n - 1) + fib(n - 2);
}

int main() {
    for (int i = 0; i <= 20; i++) printf("fib(%d) = %d\\n", i, fib(i));
    return 0;
}
`,
  },
  {
    name: 'Error: fuera del array',
    code: `#include <stdio.h>

int main() {
    int notas[5] = {7, 8, 5, 9, 6};
    int suma = 0;
    // ¿Ves el fallo? Ejecuta y lee el mensaje.
    for (int i = 0; i <= 5; i++) {
        suma += notas[i];
    }
    printf("Suma: %d\\n", suma);
    return 0;
}
`,
  },
];

export function Playground({ shared }: { shared?: string }) {
  const p = useProgress();
  const [code, setCode] = useState(() => {
    if (shared) {
      const c = decodeShare(shared);
      if (c) return c;
    }
    return getProgress().playground || EXAMPLES[0].code;
  });
  const [copied, setCopied] = useState(false);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const editor = useRef<EditorHandle>(null);
  const runner = useRunner();

  useEffect(() => {
    if (shared) {
      const c = decodeShare(shared);
      if (c) setCode(c);
    }
  }, [shared]);

  useEffect(() => {
    const s = runner.state.done?.summary;
    if (s && (s.status === 'error' || s.status === 'limit') && s.line > 0) setErrorLine(s.line);
    else if (s && s.status === 'compile-error') setErrorLine(s.error.line);
  }, [runner.state.done]);

  const onChange = useCallback((v: string) => {
    setCode(v);
    setPlayground(v);
  }, []);

  const run = () => {
    setErrorLine(null);
    runner.start(code);
  };

  const share = () => {
    const url = `${location.origin}${location.pathname}#/practica?codigo=${encodeShare(code)}`;
    void navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const blob = new Blob([code], { type: 'text/x-c' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'programa.c';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const setFont = (d: number) =>
    update((pp) => {
      pp.settings.fontSize = Math.min(24, Math.max(11, pp.settings.fontSize + d));
    });

  return (
    <div className="playground">
      <div className="toolbar">
        <button className="btn run" onClick={run} title="Ejecutar (Ctrl+Enter)">
          ▶ Ejecutar
        </button>
        <select
          className="select"
          value=""
          onChange={(e) => {
            const ex = EXAMPLES[Number(e.target.value)];
            if (ex && (code === '' || confirm(`¿Cargar el ejemplo «${ex.name}»? Se sustituirá el código actual.`))) onChange(ex.code);
          }}
        >
          <option value="">📂 Ejemplos…</option>
          {EXAMPLES.map((ex, i) => (
            <option key={i} value={i}>
              {ex.name}
            </option>
          ))}
        </select>
        <span className="spacer" />
        <button className="btn-icon" onClick={share} title="Copiar un enlace con este código">
          {copied ? '✓ Enlace copiado' : '🔗 Compartir'}
        </button>
        <button className="btn-icon" onClick={download} title="Descargar como programa.c">
          ⬇ .c
        </button>
        <button className="btn-icon font" onClick={() => setFont(-1)}>
          A−
        </button>
        <button className="btn-icon font" onClick={() => setFont(1)}>
          A+
        </button>
      </div>
      <div className="playground-body">
        <div className="editor-wrap">
          <Editor ref={editor} value={code} onChange={onChange} onRun={run} fontSize={p.settings.fontSize} errorLine={errorLine} />
        </div>
        <div className="playground-console">
          <Console runner={runner} onGoToLine={(l) => editor.current?.goToLine(l)} emptyText="Escribe tu programa y pulsa ▶ Ejecutar. Si usa scanf, podrás escribir aquí la entrada." />
        </div>
      </div>
    </div>
  );
}
