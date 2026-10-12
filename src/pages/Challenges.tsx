import { useState } from 'react';
import { href } from '../app/router';
import { RETOS } from '../content';
import { lessonXp } from '../content/types';
import { useProgress } from '../state/progress';
import { BitSays } from '../ui/Mascot';

const DIFF = { 1: '🟢 Fácil', 2: '🟡 Medio', 3: '🔴 Difícil' } as const;

export function Challenges() {
  const p = useProgress();
  const [filter, setFilter] = useState<0 | 1 | 2 | 3>(0);
  const list = RETOS.filter((r) => !filter || r.difficulty === filter).sort((a, b) => (a.difficulty ?? 1) - (b.difficulty ?? 1));
  const done = RETOS.filter((r) => p.done[r.id]).length;
  return (
    <div className="page">
      <h1>🏆 Retos</h1>
      <BitSays>
        Problemas extra para practicar todo lo que has aprendido. Cada uno dice qué temas necesitas. ¡Llevas <strong>{done}</strong> de {RETOS.length}!
      </BitSays>
      <div className="filters">
        {([0, 1, 2, 3] as const).map((d) => (
          <button key={d} className={`chip ${filter === d ? 'active' : ''}`} onClick={() => setFilter(d)}>
            {d === 0 ? 'Todos' : DIFF[d]}
          </button>
        ))}
      </div>
      <div className="retos-grid">
        {list.map((r) => (
          <a key={r.id} className={`reto-card ${p.done[r.id] ? 'done' : ''}`} href={href({ page: 'lesson', id: r.id })}>
            <div className="reto-top">
              <span className="small">{DIFF[r.difficulty ?? 1]}</span>
              <span className="reto-xp">{p.done[r.id] ? '✓' : `+${lessonXp(r)} XP`}</span>
            </div>
            <div className="reto-title">{r.title}</div>
            <div className="reto-desc muted small">{(/^>?\s*\*\*Temas:\*\*\s*(.*)$/m.exec(r.theory)?.[1] ?? '').trim()}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
