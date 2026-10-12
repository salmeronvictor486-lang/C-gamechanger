// Consola: muestra la salida del programa y deja escribir cuando hace scanf.
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Diagnostic } from '../c/diagnostics';
import type { RunDone } from '../runner/protocol';
import type { Runner } from './useRunner';

interface Props {
  runner: Runner;
  onGoToLine?: (line: number) => void;
  emptyText?: ReactNode;
}

export function Console({ runner, onGoToLine, emptyText }: Props) {
  const { state } = runner;
  const [line, setLine] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === 'waiting') inputRef.current?.focus({ preventScroll: true });
  }, [state.status]);

  useEffect(() => {
    const el = boxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.segs, state.status, state.done]);

  const submit = () => {
    runner.send(line);
    setLine('');
  };

  const running = state.status === 'running' || state.status === 'waiting';

  return (
    <div className="console" onClick={() => state.status === 'waiting' && inputRef.current?.focus()}>
      <div className="console-bar">
        <span className="console-title">
          <span className={`dot ${running ? 'dot-on' : ''}`} /> {state.status === 'waiting' ? 'Esperando entrada…' : running ? 'Ejecutando…' : 'Salida'}
        </span>
        <span className="console-actions">
          {state.status === 'waiting' && (
            <button className="btn-mini" onClick={() => runner.eof()} title="Simula el fin de la entrada (Ctrl+D)">
              Fin de entrada
            </button>
          )}
          {running && (
            <button className="btn-mini danger" onClick={() => runner.stop()}>
              ■ Parar
            </button>
          )}
          {!running && state.segs.length > 0 && (
            <button className="btn-mini" onClick={() => runner.clear()}>
              Limpiar
            </button>
          )}
        </span>
      </div>
      <div className="console-body" ref={boxRef}>
        {state.status === 'idle' && state.segs.length === 0 && (
          <div className="console-empty">{emptyText ?? 'Pulsa ▶ Ejecutar para ver aquí lo que escribe tu programa.'}</div>
        )}
        <pre className="console-text">
          {state.segs.map((s, i) => (
            <span key={i} className={s.kind === 'out' ? '' : 'console-in'}>
              {s.text}
            </span>
          ))}
          {state.status === 'waiting' && (
            <span className="console-input-wrap">
              <input
                ref={inputRef}
                className="console-input"
                value={line}
                spellCheck={false}
                autoComplete="off"
                aria-label="Entrada del programa"
                onChange={(e) => setLine(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    submit();
                  } else if (e.key === 'd' && e.ctrlKey) {
                    e.preventDefault();
                    runner.eof();
                  }
                }}
                style={{ width: `${Math.max(2, line.length + 1)}ch` }}
              />
            </span>
          )}
          {state.status === 'running' && <span className="console-cursor">▋</span>}
        </pre>
        {state.status === 'waiting' && (
          <div className="console-hint">⌨️ Tu programa espera que escribas algo. Escríbelo y pulsa Enter.</div>
        )}
        {state.done && <RunStatusView done={state.done} onGoToLine={onGoToLine} />}
      </div>
    </div>
  );
}

export function RunStatusView({ done, onGoToLine }: { done: RunDone; onGoToLine?: (line: number) => void }) {
  const s = done.summary;
  const lineLink = (line: number) =>
    line > 0 ? (
      <button className="link" onClick={() => onGoToLine?.(line)}>
        línea {line}
      </button>
    ) : null;
  switch (s.status) {
    case 'exit':
      return (
        <div className={`run-status ${s.code === 0 ? 'ok' : 'warn'}`}>
          {s.code === 0 ? '✔ El programa terminó bien' : `El programa terminó con código ${s.code}`}
          <span className="muted"> · {formatMs(done.ms)}</span>
          {done.leaks.count > 0 && (
            <div className="run-leak">
              🧹 Quedaron {done.leaks.count} bloque{done.leaks.count === 1 ? '' : 's'} de memoria sin liberar ({done.leaks.bytes} bytes). Usa free() con todo lo que reserves.
            </div>
          )}
        </div>
      );
    case 'error':
      return (
        <div className="run-status err">
          <strong>💥 Error al ejecutar</strong> en la {lineLink(s.line)}
          {s.stack.length > 1 && <span className="muted"> (dentro de {s.stack[0]})</span>}
          <div className="err-msg">{s.message}</div>
          {s.hint && <div className="err-hint">💡 {s.hint}</div>}
        </div>
      );
    case 'limit':
      return (
        <div className="run-status err">
          <strong>⏱️ El programa tarda demasiado</strong>
          {s.line > 0 && <> (iba por la {lineLink(s.line)})</>}
          <div className="err-hint">
            💡 ¿Hay un bucle infinito? Comprueba que la condición del bucle llega a ser falsa: por ejemplo, que la variable del while cambia dentro del bucle.
          </div>
        </div>
      );
    case 'compile-error':
      return <CompileErrorView error={s.error} warnings={done.warnings} onGoToLine={onGoToLine} />;
    default:
      return null;
  }
}

export function CompileErrorView({ error, warnings, onGoToLine }: { error: Diagnostic; warnings?: Diagnostic[]; onGoToLine?: (line: number) => void }) {
  return (
    <div className="run-status err">
      <strong>🛠️ Error de compilación</strong> en la{' '}
      <button className="link" onClick={() => onGoToLine?.(error.line)}>
        línea {error.line}
      </button>
      <div className="err-msg">{error.message}</div>
      {error.hint && <div className="err-hint">💡 {error.hint}</div>}
      {warnings && warnings.length > 0 && <WarningsList warnings={warnings} onGoToLine={onGoToLine} />}
    </div>
  );
}

export function WarningsList({ warnings, onGoToLine }: { warnings: Diagnostic[]; onGoToLine?: (line: number) => void }) {
  if (!warnings.length) return null;
  return (
    <div className="warnings">
      {warnings.slice(0, 5).map((w, i) => (
        <div key={i} className="warning">
          ⚠️{' '}
          <button className="link" onClick={() => onGoToLine?.(w.line)}>
            Línea {w.line}
          </button>
          : {w.message}
          {w.hint && <div className="err-hint">{w.hint}</div>}
        </div>
      ))}
    </div>
  );
}

function formatMs(ms: number): string {
  return ms < 1000 ? `${Math.max(1, Math.round(ms))} ms` : `${(ms / 1000).toFixed(1)} s`;
}
