import type { RunResult } from '../c/machine';
import type { RunSummary } from './protocol';

export function finishSummary(r: RunResult): RunSummary {
  switch (r.status) {
    case 'exit':
      return { status: 'exit', code: r.code };
    case 'error':
      return { status: 'error', message: r.message, hint: r.hint, line: r.line, stack: r.stack };
    case 'need-input':
      return { status: 'need-input' };
    case 'limit':
      return { status: 'limit', kind: r.kind, line: r.line };
  }
}
