import { useRef } from 'react';
import { ALL_LESSONS, CHAPTERS, RETOS } from '../content';
import { BADGES, RANKS, rankOf } from '../game/game';
import { currentStreak, exportProgress, importProgress, resetProgress, today, update, useProgress } from '../state/progress';
import { Mascot } from '../ui/Mascot';

export function Profile() {
  const p = useProgress();
  const file = useRef<HTMLInputElement>(null);
  const { rank, next, progress } = rankOf(p.xp);
  const done = ALL_LESSONS.filter((l) => p.done[l.id]).length;
  const retos = RETOS.filter((l) => p.done[l.id]).length;

  // últimas 10 semanas de actividad
  const days: { d: string; n: number }[] = [];
  const now = new Date();
  for (let i = 69; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const k = today(d);
    days.push({ d: k, n: p.days[k] ?? 0 });
  }

  const doExport = () => {
    const blob = new Blob([exportProgress()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'c-gamechanger-progreso.json';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="page narrow profile">
      <div className="profile-head">
        <Mascot size={90} />
        <div>
          <input
            className="name-input"
            placeholder="Tu nombre"
            value={p.name}
            maxLength={30}
            onChange={(e) =>
              update((pp) => {
                pp.name = e.target.value;
              })
            }
          />
          <div className="profile-rank">
            {rank.icon} {rank.name}
          </div>
          <div className="bar">
            <div className="bar-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <div className="muted small">{next ? `${p.xp} XP · faltan ${next.min - p.xp} para «${next.name}»` : `${p.xp} XP · ¡rango máximo!`}</div>
        </div>
      </div>

      <div className="dash">
        <div className="dash-card">
          <div className="dash-label">Lecciones</div>
          <div className="dash-value">
            {done}/{ALL_LESSONS.length}
          </div>
        </div>
        <div className="dash-card">
          <div className="dash-label">Retos</div>
          <div className="dash-value">
            {retos}/{RETOS.length}
          </div>
        </div>
        <div className="dash-card">
          <div className="dash-label">Racha</div>
          <div className="dash-value">🔥 {currentStreak(p)}</div>
          <div className="muted small">mejor: {p.streak.best}</div>
        </div>
        <div className="dash-card">
          <div className="dash-label">Programas ejecutados</div>
          <div className="dash-value">{p.runs}</div>
        </div>
      </div>

      <h2>Actividad</h2>
      <div className="heatmap">
        {days.map((d) => (
          <span key={d.d} className={`heat h${Math.min(4, Math.ceil(d.n / 2))}`} title={`${d.d}: ${d.n} lecciones/actividades`} />
        ))}
      </div>

      <h2>Capítulos</h2>
      <div className="chapter-progress">
        {CHAPTERS.map((c) => {
          const n = c.lessons.filter((l) => p.done[l.id]).length;
          return (
            <div key={c.id} className="cp-row">
              <span className="cp-icon">{c.icon}</span>
              <span className="cp-name">{c.title}</span>
              <div className="bar small">
                <div className="bar-fill" style={{ width: `${(n / c.lessons.length) * 100}%`, background: c.color }} />
              </div>
              <span className="muted small">
                {n}/{c.lessons.length}
              </span>
            </div>
          );
        })}
      </div>

      <h2>Insignias</h2>
      <div className="badges">
        {BADGES.map((b) => (
          <div key={b.id} className={`badge ${p.badges[b.id] ? 'earned' : ''}`} title={b.desc}>
            <div className="badge-icon">{p.badges[b.id] ? b.icon : '🔒'}</div>
            <div className="badge-name">{b.name}</div>
            <div className="badge-desc">{b.desc}</div>
          </div>
        ))}
      </div>

      <h2>Rangos</h2>
      <div className="ranks">
        {RANKS.map((r) => (
          <div key={r.name} className={`rank-row ${p.xp >= r.min ? 'got' : ''}`}>
            <span>{r.icon}</span> <span>{r.name}</span> <span className="muted">{r.min} XP</span>
          </div>
        ))}
      </div>

      <h2>Ajustes</h2>
      <div className="settings">
        <label>
          Tema:{' '}
          <select
            className="select"
            value={p.settings.theme}
            onChange={(e) =>
              update((pp) => {
                pp.settings.theme = e.target.value as 'dark' | 'light' | 'auto';
              })
            }
          >
            <option value="dark">Oscuro</option>
            <option value="light">Claro</option>
            <option value="auto">Como el sistema</option>
          </select>
        </label>
        <label>
          Tamaño de letra del editor:{' '}
          <input
            type="range"
            min={11}
            max={24}
            value={p.settings.fontSize}
            onChange={(e) =>
              update((pp) => {
                pp.settings.fontSize = Number(e.target.value);
              })
            }
          />{' '}
          {p.settings.fontSize}px
        </label>
      </div>

      <h2>Tu progreso</h2>
      <p className="muted">Se guarda en este navegador. Para pasarlo a otro ordenador, descárgalo y cárgalo allí.</p>
      <div className="settings-actions">
        <button className="btn ghost" onClick={doExport}>
          ⬇ Descargar progreso
        </button>
        <button className="btn ghost" onClick={() => file.current?.click()}>
          ⬆ Cargar progreso
        </button>
        <input
          ref={file}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const ok = importProgress(await f.text());
            alert(ok ? '¡Progreso cargado!' : 'Ese archivo no es un progreso válido.');
            e.target.value = '';
          }}
        />
        <button
          className="btn danger"
          onClick={() => {
            if (confirm('¿Borrar TODO tu progreso? No se puede deshacer.')) resetProgress();
          }}
        >
          🗑 Empezar de cero
        </button>
      </div>
    </div>
  );
}
