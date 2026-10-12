import { href } from '../app/router';
import { CHAPTERS, chapterUnlocked, findChapter } from '../content';
import { lessonXp, type Lesson } from '../content/types';
import { useProgress } from '../state/progress';
import { BitSays } from '../ui/Mascot';

const KIND_LABEL: Record<string, string> = { proyecto: 'Proyecto', examen: 'Examen', reto: 'Reto' };

export function ChapterPage({ id }: { id: string }) {
  const ch = findChapter(id);
  const p = useProgress();
  if (!ch) {
    return (
      <div className="page narrow">
        <h1>No encuentro ese capítulo</h1>
        <a href="#/">Volver al inicio</a>
      </div>
    );
  }
  const n = CHAPTERS.indexOf(ch) + 1;
  const unlocked = chapterUnlocked(ch, p.done);
  const firstTodo = ch.lessons.find((l) => !p.done[l.id]);
  const prev = CHAPTERS[n - 2];
  const next = CHAPTERS[n];
  return (
    <div className="page narrow chapter-page" style={{ '--ch': ch.color } as React.CSSProperties}>
      <a className="back" href="#/">
        ← Mapa
      </a>
      <div className="chapter-head">
        <div className="chapter-big-icon">{ch.icon}</div>
        <div>
          <div className="chapter-num">Capítulo {n}</div>
          <h1>{ch.title}</h1>
          <p className="muted">{ch.subtitle}</p>
        </div>
      </div>
      {!unlocked && (
        <BitSays mood="think">
          Este capítulo usa cosas de los anteriores. Te recomiendo terminar antes <strong>{prev?.title}</strong>, pero si ya lo sabes, ¡adelante!
        </BitSays>
      )}
      {firstTodo && (
        <a className="btn primary" href={href({ page: 'lesson', id: firstTodo.id })}>
          ▶ {ch.lessons.some((l) => p.done[l.id]) ? 'Continuar' : 'Empezar'}: {firstTodo.title}
        </a>
      )}
      <ol className="lesson-list">
        {ch.lessons.map((l, i) => (
          <LessonRow key={l.id} l={l} i={i} done={!!p.done[l.id]} current={firstTodo?.id === l.id} />
        ))}
      </ol>
      <div className="chapter-nav">
        {prev ? <a href={href({ page: 'chapter', id: prev.id })}>← {prev.title}</a> : <span />}
        {next && <a href={href({ page: 'chapter', id: next.id })}>{next.title} →</a>}
      </div>
    </div>
  );
}

function LessonRow({ l, i, done, current }: { l: Lesson; i: number; done: boolean; current: boolean }) {
  return (
    <li>
      <a className={`lesson-row ${done ? 'done' : ''} ${current ? 'current' : ''} kind-${l.kind ?? 'leccion'}`} href={href({ page: 'lesson', id: l.id })}>
        <span className="lesson-check">{done ? '✓' : i + 1}</span>
        <span className="lesson-name">
          {l.kind && l.kind !== 'leccion' && <span className="tag">{KIND_LABEL[l.kind]}</span>}
          {l.title}
        </span>
        <span className="lesson-xp">+{lessonXp(l)} XP</span>
      </a>
    </li>
  );
}
