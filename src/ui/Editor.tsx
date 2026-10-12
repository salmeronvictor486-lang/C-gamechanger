// Editor de código con CodeMirror 6: colores de C, autocompletado en castellano y
// errores subrayados mientras escribes (con el mismo compilador que ejecuta).
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap, snippetCompletion, type Completion } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { cpp } from '@codemirror/lang-cpp';
import { bracketMatching, HighlightStyle, indentOnInput, syntaxHighlighting } from '@codemirror/language';
import { linter, lintGutter, type Diagnostic as CMDiagnostic } from '@codemirror/lint';
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search';
import { Compartment, EditorState, StateEffect, StateField } from '@codemirror/state';
import { Decoration, drawSelection, EditorView, highlightActiveLine, highlightActiveLineGutter, keymap, lineNumbers, placeholder, type DecorationSet } from '@codemirror/view';
import { tags as t } from '@lezer/highlight';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { compile } from '../c/parser';

export interface EditorHandle {
  goToLine(line: number): void;
  setValue(v: string): void;
  focus(): void;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  onRun?: () => void;
  fontSize?: number;
  readOnly?: boolean;
  /** Línea a marcar como error de ejecución. */
  errorLine?: number | null;
}

const style = HighlightStyle.define([
  { tag: t.keyword, color: 'var(--syn-kw)', fontWeight: '600' },
  { tag: [t.typeName, t.standard(t.typeName)], color: 'var(--syn-type)' },
  { tag: [t.string, t.character], color: 'var(--syn-str)' },
  { tag: [t.number, t.bool, t.null], color: 'var(--syn-num)' },
  { tag: [t.comment, t.lineComment, t.blockComment], color: 'var(--syn-com)', fontStyle: 'italic' },
  { tag: [t.processingInstruction, t.meta], color: 'var(--syn-pre)' },
  { tag: [t.function(t.variableName)], color: 'var(--syn-fn)' },
  { tag: t.operator, color: 'var(--syn-op)' },
  { tag: t.escape, color: 'var(--syn-fmt)' },
  { tag: [t.definition(t.variableName)], color: 'var(--text)' },
  { tag: t.propertyName, color: 'var(--syn-prop)' },
]);

const theme = EditorView.theme({
  '&': { height: '100%', background: 'var(--editor-bg)', color: 'var(--text)' },
  '.cm-content': { fontFamily: 'var(--font-code)', caretColor: 'var(--accent)', padding: '10px 0' },
  '.cm-gutters': { background: 'var(--editor-gutter)', color: 'var(--muted)', border: 'none' },
  '.cm-activeLine': { background: 'var(--editor-active)' },
  '.cm-activeLineGutter': { background: 'var(--editor-active)', color: 'var(--text)' },
  '.cm-cursor': { borderLeftColor: 'var(--accent)', borderLeftWidth: '2px' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { background: 'var(--editor-sel) !important' },
  '.cm-matchingBracket': { background: 'var(--editor-match)', outline: 'none' },
  '.cm-tooltip': { background: 'var(--panel-2)', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: '8px' },
  '.cm-tooltip-autocomplete ul li[aria-selected]': { background: 'var(--accent)', color: '#fff' },
  '.cm-errorLine': { background: 'var(--editor-err)' },
  '.cm-diagnostic': { fontFamily: 'var(--font-ui)', fontSize: '13px', maxWidth: '420px' },
  '.cm-placeholder': { color: 'var(--muted)' },
});

const S = (label: string, tpl: string, detail: string, info?: string): Completion => snippetCompletion(tpl, { label, detail, info, type: 'function' });

const COMPLETIONS: Completion[] = [
  S('printf', 'printf("${texto}\\n");', 'escribir en pantalla', 'printf("Hola %d\\n", x); — %d enteros, %f decimales, %c caracteres, %s textos'),
  S('scanf', 'scanf("%d", &${variable});', 'leer del teclado', 'Recuerda el & delante de la variable (salvo en arrays de char).'),
  S('for', 'for (int ${i} = 0; ${i} < ${n}; ${i}++) {\n\t${}\n}', 'bucle for'),
  S('while', 'while (${condicion}) {\n\t${}\n}', 'bucle while'),
  S('do', 'do {\n\t${}\n} while (${condicion});', 'bucle do-while'),
  S('if', 'if (${condicion}) {\n\t${}\n}', 'condicional'),
  S('ifelse', 'if (${condicion}) {\n\t${}\n} else {\n\t\n}', 'if con else'),
  S('switch', 'switch (${variable}) {\n\tcase 1:\n\t\t${}\n\t\tbreak;\n\tdefault:\n\t\tbreak;\n}', 'switch con casos'),
  S('main', 'int main() {\n\t${}\n\treturn 0;\n}', 'función principal'),
  S('include', '#include <${stdio.h}>', 'incluir biblioteca'),
  ...['int', 'float', 'double', 'char', 'void', 'long', 'unsigned', 'const', 'return', 'break', 'continue', 'struct', 'typedef', 'sizeof', 'else', 'case', 'default', 'bool', 'true', 'false', 'NULL'].map(
    (k): Completion => ({ label: k, type: 'keyword' }),
  ),
  ...[
    ['puts', 'escribe un texto y salta de línea'],
    ['putchar', 'escribe un carácter'],
    ['getchar', 'lee un carácter'],
    ['fgets', 'lee una línea: fgets(s, tam, stdin)'],
    ['strlen', 'longitud de un texto (string.h)'],
    ['strcpy', 'copia un texto (string.h)'],
    ['strcat', 'une textos (string.h)'],
    ['strcmp', 'compara textos: 0 si son iguales (string.h)'],
    ['sqrt', 'raíz cuadrada (math.h)'],
    ['pow', 'potencia: pow(base, exp) (math.h)'],
    ['fabs', 'valor absoluto de un decimal (math.h)'],
    ['abs', 'valor absoluto de un entero (stdlib.h)'],
    ['rand', 'número aleatorio (stdlib.h)'],
    ['srand', 'semilla de rand (stdlib.h)'],
    ['malloc', 'reserva memoria (stdlib.h)'],
    ['free', 'libera memoria (stdlib.h)'],
    ['toupper', 'a mayúscula (ctype.h)'],
    ['tolower', 'a minúscula (ctype.h)'],
    ['isdigit', '¿es un dígito? (ctype.h)'],
    ['isalpha', '¿es una letra? (ctype.h)'],
  ].map(([label, detail]): Completion => ({ label, detail, type: 'function', apply: label + '(' })),
];

const setErrorLine = StateEffect.define<number | null>();
const errorLineField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(setErrorLine)) {
        if (e.value === null || e.value < 1 || e.value > tr.state.doc.lines) deco = Decoration.none;
        else {
          const line = tr.state.doc.line(e.value);
          deco = Decoration.set([Decoration.line({ class: 'cm-errorLine' }).range(line.from)]);
        }
      }
    }
    if (tr.docChanged) deco = Decoration.none;
    return deco;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const cLinter = linter(
  (view) => {
    const doc = view.state.doc;
    const src = doc.toString();
    if (!src.trim()) return [];
    const r = compile(src);
    const out: CMDiagnostic[] = [];
    const toPos = (line: number, col: number) => {
      const l = doc.line(Math.min(Math.max(1, line), doc.lines));
      const from = Math.min(l.from + Math.max(0, col - 1), l.to);
      // subraya la palabra
      let to = from;
      const text = l.text;
      let k = from - l.from;
      while (k < text.length && /[\w.]/.test(text[k])) k++;
      to = l.from + k;
      if (to === from) to = Math.min(from + 1, l.to);
      return { from, to: Math.max(to, from) };
    };
    if (!r.ok) {
      const p = toPos(r.error.line, r.error.col);
      out.push({ ...p, severity: 'error', message: r.error.message + (r.error.hint ? `\n💡 ${r.error.hint}` : '') });
    }
    for (const w of r.warnings) {
      const p = toPos(w.line, w.col);
      out.push({ ...p, severity: 'warning', message: w.message + (w.hint ? `\n💡 ${w.hint}` : '') });
    }
    return out;
  },
  { delay: 700 },
);

export const Editor = forwardRef<EditorHandle, Props>(function Editor({ value, onChange, onRun, fontSize = 15, readOnly = false, errorLine = null }, ref) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onRunRef = useRef(onRun);
  const fontComp = useRef(new Compartment());
  const roComp = useRef(new Compartment());
  onChangeRef.current = onChange;
  onRunRef.current = onRun;

  useEffect(() => {
    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        history(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        cpp(),
        syntaxHighlighting(style),
        autocompletion({ override: [(ctx) => {
          const w = ctx.matchBefore(/[A-Za-z_]\w*/);
          if (!w || (w.from === w.to && !ctx.explicit)) return null;
          return { from: w.from, options: COMPLETIONS, validFor: /^\w*$/ };
        }] }),
        lintGutter(),
        cLinter,
        errorLineField,
        placeholder('Escribe aquí tu código en C…'),
        theme,
        EditorState.tabSize.of(4),
        fontComp.current.of(EditorView.theme({ '.cm-content, .cm-gutters': { fontSize: `${fontSize}px` } })),
        roComp.current.of(EditorState.readOnly.of(readOnly)),
        keymap.of([
          { key: 'Mod-Enter', run: () => (onRunRef.current?.(), true), preventDefault: true },
          { key: 'Mod-s', run: () => true, preventDefault: true },
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...completionKeymap,
          indentWithTab,
        ]),
        EditorView.updateListener.of((u) => {
          if (u.docChanged) onChangeRef.current(u.state.doc.toString());
        }),
      ],
    });
    view.current = new EditorView({ state, parent: host.current! });
    return () => view.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // valor cambiado desde fuera (reiniciar, ver solución…)
  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) {
      v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
    }
  }, [value]);

  useEffect(() => {
    view.current?.dispatch({ effects: fontComp.current.reconfigure(EditorView.theme({ '.cm-content, .cm-gutters': { fontSize: `${fontSize}px` } })) });
  }, [fontSize]);

  useEffect(() => {
    view.current?.dispatch({ effects: roComp.current.reconfigure(EditorState.readOnly.of(readOnly)) });
  }, [readOnly]);

  useEffect(() => {
    view.current?.dispatch({ effects: setErrorLine.of(errorLine) });
  }, [errorLine]);

  useImperativeHandle(ref, () => ({
    goToLine(line: number) {
      const v = view.current;
      if (!v) return;
      const l = v.state.doc.line(Math.min(Math.max(1, line), v.state.doc.lines));
      v.dispatch({ selection: { anchor: l.from, head: l.to }, effects: [EditorView.scrollIntoView(l.from, { y: 'center' }), setErrorLine.of(line)] });
      v.focus();
    },
    setValue(s: string) {
      const v = view.current;
      if (v) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: s } });
    },
    focus() {
      view.current?.focus();
    },
  }));

  return <div className="editor" ref={host} />;
});
