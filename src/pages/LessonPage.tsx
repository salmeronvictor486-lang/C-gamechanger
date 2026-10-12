import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { href } from '../app/router';
import { compile } from '../c/parser';
import { findLesson, nextLesson, prevLesson } from '../content';
import { lessonXp, type Exercise, type Lesson } from '../content/types';
import { BADGES, type Badge } from '../game/game';
import { failedRequirements, sameOutput, transcript } from '../runner/check';
import { createWorker, runOnce, type BatchResult } from '../runner/runner';
import { CHAPTERS } from '../content';
import { getProgress, setCode, touchStreak, update, useProgress } from '../state/progress';
import { Celebration } from '../ui/Celebration';
import { Console } from '../ui/Console';
import { Editor, type EditorHandle } from '../ui/Editor';
import { Markdown } from '../ui/Markdown';
import { BitSays } from '../ui/Mascot';
import { Quiz } from '../ui/Quiz';
import { TestResults, type CheckState, type TestRun } from '../ui/TestResults';
import { useRunner } from '../ui/useRunner';
import { highlightC } from '../ui/highlight';

/** Ejemplos de ejecución sacados de la solución (así nunca están mal). */
function Examples({ lesson, ex }: { lesson: Lesson; ex: Exercise }) {
  const [runs, setRuns] = useState<BatchResult[] | null>(null);
  const n = ex.examples ?? (ex.tests.some((t) => t.input) ? 1 : 0);
  useEffect(() => {
    let alive = true;
    if (n > 0) void solutionRuns(lesson, ex).then((r) => alive && setRuns(r));
    return () => {
      alive = false;
    };
  }, [lesson, ex, n]);
  if (n === 0) return null;
  const shown = ex.tests
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => !t.hidden)
    .slice(0, n);
  return (
    <div className="examples">
      {shown.map(({ t, i }) => (
        <div key={i} className="example">
          <div className="example-label">{shown.length > 1 ? `Ejemplo ${shown.indexOf(shown.find((x) => x.i === i)!) + 1}` : 'Ejemplo'}{t.input ? ' (lo verde es lo que escribe el usuario)' : ''}</div>
          {runs ? (
            <pre className="transcript">
              {transcript(runs[i].output, t.input ?? '', runs[i].done.inputMarks).map((sg, k) => (
                <span key={k} className={sg.kind === 'in' ? 'console-in' : ''}>
                  {sg.text}
                </span>
              ))}
            </pre>
          ) : (
            <pre className="transcript empty">…</pre>
          )}
        </div>
      ))}
    </div>
  );
}

const KIND_LABEL: Record<string, string> = { proyecto: '🏗️ Proyecto', examen: '📝 Examen', reto: '🏆 Reto' };

/** Resultados de la solución por lección (para saber la salida esperada). */
const solutionCache = new Map<string, Promise<BatchResult[]>>();

function solutionRuns(lesson: Lesson, ex: Exercise): Promise<BatchResult[]> {
  let p = solutionCache.get(lesson.id);
  if (!p) {
    p = (async () => {
      const worker = createWorker();
      const out: BatchResult[] = [];
      for (const t of ex.tests) out.push(await runOnce(ex.solution, t.input ?? '', { worker, maxMs: 8000 }));
      worker.terminate();
      return out;
    })();
    solutionCache.set(lesson.id, p);
  }
  return p;
}

/** Concede la lección: XP, racha e insignias nuevas. */
export function completeLesson(lesson: Lesson): { xp: number; badges: Badge[]; firstTime: boolean } {
  let xp = 0;
  let firstTime = false;
  const newBadges: Badge[] = [];
  update((p) => {
    if (!p.done[lesson.id]) {
      firstTime = true;
      const used = !!p.seenSolution[lesson.id];
      xp = used ? Math.round(lessonXp(lesson) / 2) : lessonXp(lesson);
      p.done[lesson.id] = { at: Date.now(), xp, usedSolution: used };
      p.xp += xp;
    }
    touchStreak(p);
    for (const b of BADGES) {
      if (!p.badges[b.id] && b.earned(p, CHAPTERS)) {
        p.badges[b.id] = Date.now();
        newBadges.push(b);
      }
    }
  });
  return { xp, badges: newBadges, firstTime };
}

export function LessonPage({ id }: { id: string }) {
  const ref = findLesson(id);
  if (!ref) {
    return (
      <div className="page narrow">
        <h1>No encuentro esa lección</h1>
        <a href="#/">Volver al inicio</a>
      </div>
    );
  }
  return <LessonView lesson={ref.lesson} />;
}

function LessonView({ lesson }: { lesson: Lesson }) {
  const p = useProgress();
  const ex = lesson.exercise;
  const ref = findLesson(lesson.id)!;
  const chapter = ref.chapter;
  const [code, setCodeState] = useState(() => p.code[lesson.id] ?? ex?.starter ?? '');
  const [tab, setTab] = useState<'teoria' | 'codigo'>('teoria');
  const [panel, setPanel] = useState<'consola' | 'pruebas'>('consola');
  const [check, setCheck] = useState<CheckState | null>(null);
  const [celebrate, setCelebrate] = useState<{ xp: number; badges: Badge[]; firstTime: boolean } | null>(null);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const editor = useRef<EditorHandle>(null);
  const runner = useRunner();
  const hints = p.hints[lesson.id] ?? 0;
  const done = !!p.done[lesson.id];
  const next = nextLesson(lesson.id);
  const prev = prevLesson(lesson.id);
  const leftRef = useRef<HTMLElement>(null);

  const onChange = useCallback(
    (v: string) => {
      setCodeState(v);
      setCode(lesson.id, v);
    },
    [lesson.id],
  );

  // precalcula la salida de la solución para que "Comprobar" sea instantáneo
  useEffect(() => {
    if (ex) void solutionRuns(lesson, ex);
  }, [lesson, ex]);

  // línea del error de ejecución
  useEffect(() => {
    const s = runner.state.done?.summary;
    if (s && (s.status === 'error' || s.status === 'limit') && s.line > 0) setErrorLine(s.line);
    else if (s && s.status === 'compile-error') setErrorLine(s.error.line);
  }, [runner.state.done]);

  const goToLine = useCallback((l: number) => {
    setTab('codigo');
    setTimeout(() => editor.current?.goToLine(l), 30);
  }, []);

  const run = useCallback(() => {
    setPanel('consola');
    setErrorLine(null);
    setTab('codigo');
    runner.start(code);
  }, [code, runner]);

  const finish = useCallback(() => {
    const r = completeLesson(lesson);
    setCelebrate(r);
  }, [lesson]);

  const runCheck = useCallback(async () => {
    if (!ex) return;
    setPanel('pruebas');
    setTab('codigo');
    setErrorLine(null);
    runner.stop();
    update((pp) => {
      pp.attempts[lesson.id] = (pp.attempts[lesson.id] ?? 0) + 1;
      pp.runs += 1;
    });
    const compiled = compile(code);
    if (!compiled.ok) {
      setCheck({ status: 'done', compileError: compiled.error, warnings: compiled.warnings, runs: [], total: ex.tests.length, requirements: [] });
      setErrorLine(compiled.error.line);
      return;
    }
    const requirements = failedRequirements(code, ex);
    const state: CheckState = { status: 'running', runs: [], total: ex.tests.length, requirements };
    setCheck({ ...state });
    const expected = await solutionRuns(lesson, ex);
    let worker = createWorker();
    const runs: TestRun[] = [];
    for (let i = 0; i < ex.tests.length; i++) {
      const t = ex.tests[i];
      const r = await runOnce(code, t.input ?? '', { worker, maxMs: 4000 });
      if (r.done.summary.status === 'limit') {
        worker.terminate();
        worker = createWorker();
      }
      const exp = t.output ?? expected[i].output;
      const pass = r.done.summary.status === 'exit' && sameOutput(exp, r.output);
      runs.push({ test: t, pass, expected: exp, expectedMarks: expected[i].done.inputMarks, got: r.output, done: r.done });
      setCheck({ ...state, runs: runs.slice() });
      const s = r.done.summary;
      if (s.status === 'error' && s.line > 0) setErrorLine(s.line);
    }
    worker.terminate();
    const ok = runs.every((r) => r.pass) && requirements.length === 0;
    setCheck({ ...state, status: 'done', runs });
    if (ok) finish();
  }, [code, ex, finish, lesson, runner]);

  // atajos de teclado
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        void runCheck();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [runCheck]);

  const showHint = () =>
    update((pp) => {
      pp.hints[lesson.id] = Math.min((pp.hints[lesson.id] ?? 0) + 1, ex?.hints.length ?? 0);
    });

  const revealSolution = () => {
    if (!done && !getProgress().seenSolution[lesson.id]) {
      if (!confirm('Si ves la solución antes de resolverlo, esta lección te dará la mitad de XP. ¿Quieres verla?')) return;
    }
    update((pp) => {
      pp.seenSolution[lesson.id] = true;
    });
    setShowSolution(true);
  };

  const reset = () => {
    if (!ex) return;
    if (code !== ex.starter && !confirm('¿Volver al código inicial? Perderás lo que has escrito en este ejercicio.')) return;
    onChange(ex.starter);
    setCheck(null);
    setErrorLine(null);
  };

  const fontSize = p.settings.fontSize;
  const setFont = (d: number) =>
    update((pp) => {
      pp.settings.fontSize = Math.min(24, Math.max(11, pp.settings.fontSize + d));
    });

  const lessonIndex = chapter ? chapter.lessons.indexOf(lesson) : -1;
  const kindLabel = lesson.kind ? KIND_LABEL[lesson.kind] : null;
  const isExam = !ex && !!lesson.quiz;
  const isReading = !ex && !lesson.quiz;

  const dots = useMemo(
    () =>
      chapter?.lessons.map((l) => (
        <a key={l.id} href={href({ page: 'lesson', id: l.id })} className={`dot-step ${p.done[l.id] ? 'done' : ''} ${l.id === lesson.id ? 'here' : ''}`} title={l.title} />
      )),
    [chapter, p.done, lesson.id],
  );

  return (
    <div className={`lesson ${ex ? 'with-code' : 'no-code'}`} data-tab={tab}>
      <section className="lesson-left" ref={leftRef}>
        <div className="lesson-crumbs">
          {chapter ? (
            <a href={href({ page: 'chapter', id: chapter.id })}>
              {chapter.icon} {chapter.title}
            </a>
          ) : (
            <a href={href({ page: 'retos' })}>🏆 Retos</a>
          )}
          <div className="dots">{dots}</div>
        </div>
        <div className="lesson-title-row">
          {kindLabel && <span className="kind-tag">{kindLabel}</span>}
          <h1>
            {lessonIndex >= 0 && <span className="lesson-num">{lessonIndex + 1}. </span>}
            {lesson.title}
          </h1>
          {done && <span className="done-tag">✓ Completada</span>}
        </div>
        <Markdown text={lesson.theory} />

        {ex && (
          <div className="task-card">
            <h2>🎯 Tu misión</h2>
            <Markdown text={ex.task} />
            <Examples lesson={lesson} ex={ex} />
            <div className="task-actions">
              <button className="btn primary mobile-only" onClick={() => setTab('codigo')}>
                ✎ Ir al código
              </button>
              {hints < ex.hints.length && (
                <button className="btn ghost small" onClick={showHint}>
                  💡 {hints === 0 ? 'Necesito una pista' : 'Otra pista'} ({hints}/{ex.hints.length})
                </button>
              )}
              {(hints >= ex.hints.length || done) && !showSolution && (
                <button className="btn ghost small" onClick={revealSolution}>
                  👀 Ver la solución
                </button>
              )}
            </div>
            {hints > 0 && (
              <div className="hints">
                {ex.hints.slice(0, hints).map((h, i) => (
                  <BitSays key={i} mood="think">
                    <strong>Pista {i + 1}:</strong> <Markdown text={h} className="inline-md" />
                  </BitSays>
                ))}
              </div>
            )}
            {showSolution && (
              <div className="solution">
                <div className="solution-head">
                  <strong>Una solución posible</strong>
                  <button
                    className="btn-mini"
                    onClick={() => {
                      if (confirm('¿Copiar la solución al editor? Se sustituirá tu código.')) onChange(ex.solution);
                    }}
                  >
                    Copiar al editor
                  </button>
                </div>
                <pre className="code" dangerouslySetInnerHTML={{ __html: highlightC(ex.solution) }} />
                <div className="muted small">Hay muchas formas correctas de resolverlo. Intenta entender cada línea antes de seguir.</div>
              </div>
            )}
          </div>
        )}

        {lesson.quiz && (
          <Quiz
            questions={lesson.quiz}
            title={isExam ? 'Preguntas' : 'Repaso rápido'}
            onFinish={(score) => {
              update((pp) => {
                pp.quiz[lesson.id] = Math.max(pp.quiz[lesson.id] ?? 0, score);
              });
              if (isExam && score >= 0.7) finish();
            }}
          />
        )}

        {isReading && (
          <div className="read-done">
            <button className="btn primary" onClick={finish}>
              {done ? '✓ Leída' : '✓ Entendido'}
            </button>
          </div>
        )}

        <div className="lesson-foot">
          {prev ? (
            <a className="btn ghost small" href={href({ page: 'lesson', id: prev.id })}>
              ← {prev.title}
            </a>
          ) : (
            <span />
          )}
          {next && (
            <a className={`btn small ${done ? 'primary' : 'ghost'}`} href={href({ page: 'lesson', id: next.id })}>
              {next.title} →
            </a>
          )}
        </div>
      </section>

      {ex && (
        <section className="lesson-right">
          <div className="toolbar">
            <button className="btn run" onClick={run} title="Ejecutar (Ctrl+Enter)">
              ▶ Ejecutar
            </button>
            <button className="btn check" onClick={() => void runCheck()} title="Comprobar (Ctrl+Shift+Enter)" disabled={check?.status === 'running'}>
              ✔ Comprobar
            </button>
            <span className="spacer" />
            <button className="btn-icon" onClick={() => setFont(-1)} title="Letra más pequeña">
              A−
            </button>
            <button className="btn-icon" onClick={() => setFont(1)} title="Letra más grande">
              A+
            </button>
            <button className="btn-icon" onClick={reset} title="Volver al código inicial">
              ↺
            </button>
          </div>
          <div className="editor-wrap">
            <Editor ref={editor} value={code} onChange={onChange} onRun={run} fontSize={fontSize} errorLine={errorLine} />
          </div>
          <div className="bottom-panel">
            <div className="panel-tabs">
              <button className={panel === 'consola' ? 'active' : ''} onClick={() => setPanel('consola')}>
                Consola
              </button>
              <button className={panel === 'pruebas' ? 'active' : ''} onClick={() => setPanel('pruebas')}>
                Pruebas{' '}
                {check?.status === 'done' && !check.compileError && (
                  <span className={check.runs.every((r) => r.pass) && check.requirements.length === 0 ? 'pill ok' : 'pill bad'}>
                    {check.runs.filter((r) => r.pass).length}/{check.total}
                  </span>
                )}
              </button>
            </div>
            <div className="panel-body">
              {panel === 'consola' ? <Console runner={runner} onGoToLine={goToLine} /> : <TestResults check={check} onGoToLine={goToLine} />}
            </div>
          </div>
        </section>
      )}

      {ex && (
        <div className="mobile-tabs">
          <button className={tab === 'teoria' ? 'active' : ''} onClick={() => setTab('teoria')}>
            📖 Lección
          </button>
          <button className={tab === 'codigo' ? 'active' : ''} onClick={() => setTab('codigo')}>
            ✎ Código
          </button>
        </div>
      )}

      {celebrate && (
        <Celebration
          {...celebrate}
          nextHref={next ? href({ page: 'lesson', id: next.id }) : null}
          nextTitle={next?.title}
          onClose={() => setCelebrate(null)}
        />
      )}
    </div>
  );
}
