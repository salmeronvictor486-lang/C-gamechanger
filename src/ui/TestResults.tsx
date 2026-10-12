// Resultado de "Comprobar": cada prueba con su entrada, lo esperado y lo obtenido.
import { useState } from 'react';
import type { Diagnostic } from '../c/diagnostics';
import type { ExerciseTest } from '../content/types';
import { firstDiff, normalize, transcript, type Segment } from '../runner/check';
import type { RunDone } from '../runner/protocol';
import { CompileErrorView, RunStatusView } from './Console';

export interface TestRun {
  test: ExerciseTest;
  pass: boolean;
  expected: string;
  expectedMarks: number[];
  got: string;
  done: RunDone;
}

export interface CheckState {
  status: 'running' | 'done';
  compileError?: Diagnostic;
  warnings?: Diagnostic[];
  runs: TestRun[];
  total: number;
  requirements: string[];
}

export function TestResults({ check, onGoToLine }: { check: CheckState | null; onGoToLine: (l: number) => void }) {
  const firstFail = check?.runs.findIndex((r) => !r.pass) ?? -1;
  const [open, setOpen] = useState<number | null>(null);
  if (!check) {
    return <div className="tests-empty">Pulsa <strong>✔ Comprobar</strong> para probar tu programa con varias entradas y ver si hace lo que pide el ejercicio.</div>;
  }
  if (check.compileError) {
    return (
      <div className="tests">
        <CompileErrorView error={check.compileError} warnings={check.warnings} onGoToLine={onGoToLine} />
      </div>
    );
  }
  const passed = check.runs.filter((r) => r.pass).length;
  const allOk = check.status === 'done' && passed === check.total && check.requirements.length === 0;
  const shownOpen = open ?? (firstFail >= 0 ? firstFail : null);
  return (
    <div className="tests">
      <div className={`tests-summary ${check.status === 'running' ? '' : allOk ? 'ok' : 'bad'}`}>
        {check.status === 'running'
          ? `Probando… ${check.runs.length}/${check.total}`
          : allOk
            ? `✔ ¡Todas las pruebas superadas! (${passed}/${check.total})`
            : `${passed} de ${check.total} pruebas superadas`}
      </div>
      {check.requirements.map((r, i) => (
        <div key={i} className="test-req">
          ✘ {r}
        </div>
      ))}
      {check.runs.map((r, i) => (
        <div key={i} className={`test ${r.pass ? 'pass' : 'fail'}`}>
          <button className="test-head" onClick={() => setOpen(shownOpen === i ? -1 : i)}>
            <span className="test-icon">{r.pass ? '✔' : '✘'}</span>
            <span>
              Prueba {i + 1}
              {r.test.name ? `: ${r.test.name}` : ''}
              {r.test.input && !r.test.hidden && <span className="muted"> · entrada: {short(r.test.input)}</span>}
            </span>
            <span className="test-toggle">{shownOpen === i ? '▾' : '▸'}</span>
          </button>
          {shownOpen === i && <TestDetail r={r} onGoToLine={onGoToLine} />}
        </div>
      ))}
    </div>
  );
}

function short(s: string): string {
  const t = s.trim().replace(/\n/g, ' ⏎ ');
  return t.length > 40 ? t.slice(0, 40) + '…' : t;
}

function TestDetail({ r, onGoToLine }: { r: TestRun; onGoToLine: (l: number) => void }) {
  const input = r.test.input ?? '';
  const exp = transcript(r.expected, input, r.expectedMarks);
  const got = transcript(r.got, input, r.done.inputMarks);
  const diffLine = r.pass ? -1 : firstDiff(r.expected, r.got);
  const status = r.done.summary.status;
  return (
    <div className="test-detail">
      {input && (
        <div className="muted small">
          ⌨️ En esta prueba se teclea: <code>{input.trim().replace(/\n/g, ' ⏎ ')}</code> (en <span className="console-in">verde</span> en la consola)
        </div>
      )}
      <div className="test-cols">
        <div>
          <div className="test-col-label">Tu programa escribió</div>
          <Transcript segs={got} diffLine={diffLine} raw={r.got} />
        </div>
        <div>
          <div className="test-col-label">Se esperaba</div>
          <Transcript segs={exp} diffLine={diffLine} raw={r.expected} />
        </div>
      </div>
      {!r.pass && status === 'exit' && <DiffHint expected={r.expected} got={r.got} line={diffLine} />}
      {status !== 'exit' && <RunStatusView done={r.done} onGoToLine={onGoToLine} />}
    </div>
  );
}

function Transcript({ segs, diffLine, raw }: { segs: Segment[]; diffLine: number; raw: string }) {
  if (!raw && segs.every((s) => s.kind === 'out')) return <pre className="transcript empty">(nada)</pre>;
  // marca la línea distinta: contamos los saltos de línea de la salida
  let outLine = 0;
  const parts: React.ReactNode[] = [];
  segs.forEach((s, si) => {
    if (s.kind === 'in') {
      parts.push(
        <span key={si} className="console-in">
          {s.text}
        </span>,
      );
      return;
    }
    const lines = s.text.split('\n');
    const lastSeg = si === segs.length - 1;
    lines.forEach((ln, li) => {
      const isDiff = outLine === diffLine;
      // los espacios finales solo importan si la línea termina de verdad (no si después se teclea algo)
      const complete = li < lines.length - 1 || lastSeg;
      const plain = ln.replace(/ /g, '·').replace(/\t/g, '→   ') === ln || (!complete && !ln.includes('\t'));
      parts.push(
        <span key={`${si}-${li}`} className={isDiff ? 'diff-line' : ''}>
          {plain ? ln : <Visible text={ln} trailing={complete} />}
          {li < lines.length - 1 ? '\n' : ''}
        </span>,
      );
      if (li < lines.length - 1) outLine++;
    });
  });
  return <pre className="transcript">{parts}</pre>;
}

/** Muestra los espacios finales y tabuladores para que se vean las diferencias. */
function Visible({ text, trailing }: { text: string; trailing: boolean }) {
  const m = trailing ? /^(.*?)([ \t]*)$/.exec(text)! : ([text, text, ''] as unknown as RegExpExecArray);
  return (
    <>
      {m[1].split('\t').map((p, i, arr) => (
        <span key={i}>
          {p}
          {i < arr.length - 1 && <span className="ws">→{'   '}</span>}
        </span>
      ))}
      {m[2] && <span className="ws">{m[2].replace(/ /g, '·').replace(/\t/g, '→')}</span>}
    </>
  );
}

function DiffHint({ expected, got, line }: { expected: string; got: string; line: number }) {
  const e = normalize(expected).split('\n');
  const g = normalize(got).split('\n');
  let msg: string;
  if (line < 0) return null;
  const q = (t: string) => `«${t.length > 40 ? t.slice(0, 40) + '…' : t}»`;
  if (line >= g.length) msg = `A tu salida le faltan líneas: después debería venir ${q(e[line])}.`;
  else if (line >= e.length) msg = `Tu programa escribe líneas de más: ${q(g[line])} no debería salir.`;
  else {
    const a = e[line];
    const b = g[line];
    if (a.toLowerCase() === b.toLowerCase()) msg = `La línea ${q(b)} solo cambia en mayúsculas/minúsculas: se esperaba ${q(a)}.`;
    else if (a.replace(/\s+/g, '') === b.replace(/\s+/g, '')) msg = `La línea ${q(b)} solo cambia en los espacios. Se esperaba ${q(a)}: revisa espacios y tabuladores.`;
    else if (b === '' && a !== '') msg = `Hay una línea vacía donde se esperaba ${q(a)}. ¿Sobra un \\n?`;
    else if (a === '' && b !== '') msg = `Se esperaba una línea vacía antes de ${q(b)}. ¿Falta un \\n?`;
    else {
      let k = 0;
      while (k < a.length && a[k] === b[k]) k++;
      msg = `En la línea ${q(b)}, a partir del carácter ${k + 1} se esperaba ${q(a.slice(k, k + 15) || '(fin de línea)')} y aparece ${q(b.slice(k, k + 15) || '(fin de línea)')}.`;
    }
  }
  return <div className="diff-hint">🔎 {msg}</div>;
}
