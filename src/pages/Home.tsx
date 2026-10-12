import { href } from '../app/router';
import { ALL_LESSONS, CHAPTERS, chapterUnlocked, firstPending } from '../content';
import { LEVEL_NAMES, type Chapter } from '../content/types';
import { rankOf } from '../game/game';
import { currentStreak, useProgress } from '../state/progress';
import { Mascot } from '../ui/Mascot';

export function Home() {
  const p = useProgress();
  const doneCount = ALL_LESSONS.filter((l) => p.done[l.id]).length;
  const next = firstPending(p.done);
  const { rank, next: nextRank, progress } = rankOf(p.xp);
  const started = doneCount > 0;
  const levels = [1, 2, 3] as const;

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-text">
          <h1>
            Aprende a programar en <span className="c-big">C</span>
            <br />
            jugando.
          </h1>
          <p className="hero-sub">
            Lecciones cortas, ejercicios que se corrigen solos y un compilador que te explica los errores en castellano. Desde tu primer <code>printf</code> hasta punteros y memoria dinámica. Gratis y en el navegador.
          </p>
          <div className="hero-actions">
            {next ? (
              <a className="btn primary big" href={href({ page: 'lesson', id: next.id })}>
                {started ? '▶ Continuar' : '▶ Empezar ahora'}
              </a>
            ) : (
              <a className="btn primary big" href={href({ page: 'retos' })}>
                🏆 ¡Todo completado! Ir a los retos
              </a>
            )}
            <a className="btn ghost big" href={href({ page: 'playground' })}>
              Escribir código libre
            </a>
          </div>
          {next && started && (
            <div className="muted small">
              Siguiente: <strong>{next.title}</strong>
            </div>
          )}
        </div>
        <div className="hero-art">
          <Mascot size={150} />
          <div className="hero-code">
            <span className="tk-pre">#include &lt;stdio.h&gt;</span>
            <br />
            <span className="tk-type">int</span> <span className="tk-fn">main</span>() {'{'}
            <br />
            &nbsp;&nbsp;<span className="tk-fn">printf</span>(<span className="tk-str">"¡Hola!\n"</span>);
            <br />
            {'}'}
          </div>
        </div>
      </section>

      {started && (
        <section className="dash">
          <div className="dash-card">
            <div className="dash-label">Rango</div>
            <div className="dash-value">
              {rank.icon} {rank.name}
            </div>
            <div className="bar">
              <div className="bar-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <div className="muted small">{nextRank ? `${nextRank.min - p.xp} XP para «${nextRank.name}»` : '¡Rango máximo!'}</div>
          </div>
          <div className="dash-card">
            <div className="dash-label">Lecciones</div>
            <div className="dash-value">
              {doneCount} / {ALL_LESSONS.length}
            </div>
            <div className="bar">
              <div className="bar-fill green" style={{ width: `${Math.round((doneCount / ALL_LESSONS.length) * 100)}%` }} />
            </div>
          </div>
          <div className="dash-card">
            <div className="dash-label">Racha</div>
            <div className="dash-value">🔥 {currentStreak(p)} días</div>
            <div className="muted small">Mejor racha: {p.streak.best} días</div>
          </div>
        </section>
      )}

      {levels.map((lv) => {
        const chs = CHAPTERS.filter((c) => c.level === lv);
        if (!chs.length) return null;
        return (
          <section key={lv} className="level">
            <h2 className="level-title">{LEVEL_NAMES[lv]}</h2>
            <div className="map">
              {chs.map((ch, i) => (
                <ChapterCard key={ch.id} ch={ch} n={CHAPTERS.indexOf(ch) + 1} side={i % 2 === 0 ? 'left' : 'right'} />
              ))}
            </div>
          </section>
        );
      })}

      <section className="features">
        <div className="feature">
          <div className="feature-icon">🧠</div>
          <h3>Aprende haciendo</h3>
          <p>Cada lección termina con un ejercicio. Escribes el código, pulsas «Comprobar» y sabes al momento si funciona.</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🛠️</div>
          <h3>Errores explicados</h3>
          <p>Si te falta un punto y coma, te sales de un array o usas una variable sin valor, te lo decimos en castellano y con la línea exacta.</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🎮</div>
          <h3>Sube de nivel</h3>
          <p>Gana XP, mantén tu racha, desbloquea insignias y pasa de «Novato del printf» a «Maestro del C».</p>
        </div>
      </section>
    </div>
  );
}

function ChapterCard({ ch, n, side }: { ch: Chapter; n: number; side: 'left' | 'right' }) {
  const p = useProgress();
  const total = ch.lessons.length;
  const done = ch.lessons.filter((l) => p.done[l.id]).length;
  const unlocked = chapterUnlocked(ch, p.done);
  const complete = done === total;
  return (
    <a
      className={`chapter-card ${side} ${complete ? 'complete' : ''} ${unlocked ? '' : 'locked'}`}
      href={href({ page: 'chapter', id: ch.id })}
      style={{ '--ch': ch.color } as React.CSSProperties}
    >
      <div className="chapter-node">{complete ? '★' : unlocked ? ch.icon : '🔒'}</div>
      <div className="chapter-info">
        <div className="chapter-num">Capítulo {n}</div>
        <div className="chapter-title">{ch.title}</div>
        <div className="chapter-sub">{ch.subtitle}</div>
        <div className="bar small">
          <div className="bar-fill" style={{ width: `${(done / total) * 100}%`, background: ch.color }} />
        </div>
        <div className="muted small">
          {done}/{total} lecciones
        </div>
      </div>
    </a>
  );
}
