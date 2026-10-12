// Hook para ejecutar un programa en una consola interactiva.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { RunDone } from '../runner/protocol';
import { InteractiveSession } from '../runner/runner';
import { update } from '../state/progress';

export interface ConsoleSeg {
  kind: 'out' | 'in' | 'eof';
  text: string;
}

export type RunStatus = 'idle' | 'running' | 'waiting' | 'done';

export interface RunnerState {
  status: RunStatus;
  segs: ConsoleSeg[];
  done: RunDone | null;
}

const CLEAR = '\x1b[2J';

export function useRunner(files?: Record<string, string>) {
  const [state, setState] = useState<RunnerState>({ status: 'idle', segs: [], done: null });
  const session = useRef<InteractiveSession | null>(null);

  const append = useCallback((seg: ConsoleSeg) => {
    setState((s) => {
      if (seg.kind === 'out' && seg.text.includes(CLEAR)) {
        const after = seg.text.slice(seg.text.lastIndexOf(CLEAR) + CLEAR.length);
        return { ...s, segs: after ? [{ kind: 'out', text: after }] : [] };
      }
      const segs = s.segs.slice();
      const last = segs[segs.length - 1];
      if (last && last.kind === seg.kind && seg.kind === 'out') segs[segs.length - 1] = { ...last, text: last.text + seg.text };
      else segs.push(seg);
      return { ...s, segs };
    });
  }, []);

  const stop = useCallback(() => {
    session.current?.stop();
    session.current = null;
    setState((s) => (s.status === 'running' || s.status === 'waiting' ? { ...s, status: 'idle' } : s));
  }, []);

  const start = useCallback(
    (code: string) => {
      session.current?.stop();
      setState({ status: 'running', segs: [], done: null });
      update((p) => {
        p.runs += 1;
      });
      const s = new InteractiveSession(
        code,
        {
          onOutput: (text) => append({ kind: 'out', text }),
          onNeedInput: () => setState((st) => ({ ...st, status: 'waiting' })),
          onDone: (done) => {
            setState((st) => ({ ...st, status: 'done', done }));
            if (session.current === s) session.current = null;
          },
        },
        { files },
      );
      session.current = s;
      s.start();
    },
    [append, files],
  );

  const send = useCallback(
    (line: string) => {
      if (!session.current) return;
      append({ kind: 'in', text: line + '\n' });
      setState((st) => ({ ...st, status: 'running' }));
      session.current.send(line);
    },
    [append],
  );

  const eof = useCallback(() => {
    if (!session.current) return;
    append({ kind: 'eof', text: '^D\n' });
    setState((st) => ({ ...st, status: 'running' }));
    session.current.sendEOF();
  }, [append]);

  const clear = useCallback(() => {
    session.current?.stop();
    session.current = null;
    setState({ status: 'idle', segs: [], done: null });
  }, []);

  useEffect(() => () => session.current?.stop(), []);

  return { state, start, send, eof, stop, clear };
}

export type Runner = ReturnType<typeof useRunner>;
