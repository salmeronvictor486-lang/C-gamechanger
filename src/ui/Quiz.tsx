import { useState } from 'react';
import type { QuizQuestion } from '../content/types';
import { highlightC } from './highlight';
import { Markdown } from './Markdown';

interface Props {
  questions: QuizQuestion[];
  /** Se llama al terminar con la nota (0-1). */
  onFinish?: (score: number) => void;
  passMark?: number;
  title?: string;
}

export function Quiz({ questions, onFinish, passMark = 0.7, title = 'Repaso rápido' }: Props) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null));
  const [round, setRound] = useState(0);
  const answered = answers.filter((a) => a !== null).length;
  const correct = answers.filter((a, i) => a === questions[i].answer).length;
  const finished = answered === questions.length;
  const score = correct / questions.length;

  const choose = (qi: number, oi: number) => {
    if (answers[qi] !== null) return;
    const next = answers.slice();
    next[qi] = oi;
    setAnswers(next);
    if (next.every((a) => a !== null)) {
      const sc = next.filter((a, i) => a === questions[i].answer).length / questions.length;
      onFinish?.(sc);
    }
  };

  return (
    <div className="quiz" key={round}>
      <h2>📝 {title}</h2>
      {questions.map((q, qi) => {
        const a = answers[qi];
        return (
          <div key={qi} className="quiz-q">
            <div className="quiz-question">
              <span className="quiz-n">{qi + 1}</span>
              <Markdown text={q.q} className="inline-md" />
            </div>
            {q.code && <pre className="code" dangerouslySetInnerHTML={{ __html: highlightC(q.code) }} />}
            <div className="quiz-options">
              {q.options.map((o, oi) => {
                const state = a === null ? '' : oi === q.answer ? 'right' : oi === a ? 'wrong' : 'dim';
                return (
                  <button key={oi} className={`quiz-option ${state}`} onClick={() => choose(qi, oi)} disabled={a !== null}>
                    <span className="quiz-letter">{String.fromCharCode(65 + oi)}</span>
                    <Markdown text={o} className="inline-md" />
                  </button>
                );
              })}
            </div>
            {a !== null && (
              <div className={`quiz-explain ${a === q.answer ? 'right' : 'wrong'}`}>
                {a === q.answer ? '✔ ¡Correcto! ' : '✘ No exactamente. '}
                <Markdown text={q.explain} className="inline-md" />
              </div>
            )}
          </div>
        );
      })}
      {finished && (
        <div className={`quiz-result ${score >= passMark ? 'pass' : 'fail'}`}>
          <strong>
            {correct} de {questions.length} correctas ({Math.round(score * 100)} %)
          </strong>
          {score >= passMark ? ' — ¡Muy bien!' : ` — Necesitas al menos un ${Math.round(passMark * 100)} %.`}
          <button
            className="btn small"
            onClick={() => {
              setAnswers(questions.map(() => null));
              setRound((r) => r + 1);
            }}
          >
            ↺ Repetir
          </button>
        </div>
      )}
    </div>
  );
}
