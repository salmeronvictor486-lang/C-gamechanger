import { useEffect, useMemo } from 'react';
import type { Badge } from '../game/game';
import { Mascot } from './Mascot';

interface Props {
  xp: number;
  badges: Badge[];
  firstTime: boolean;
  nextHref: string | null;
  nextTitle?: string;
  onClose: () => void;
}

const PHRASES = ['¡Genial!', '¡Lo has clavado!', '¡Bien hecho!', '¡Eres una máquina!', '¡Perfecto!', '¡Así se hace!', '¡Brutal!'];

export function Celebration({ xp, badges, firstTime, nextHref, nextTitle, onClose }: Props) {
  const phrase = useMemo(() => PHRASES[Math.floor(Math.random() * PHRASES.length)], []);
  const pieces = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 1.6 + Math.random() * 1.4,
        color: ['#4f8cff', '#3ddc97', '#ffd166', '#ff5c8a', '#9b7bff'][i % 5],
        rot: Math.random() * 360,
      })),
    [],
  );
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter' && nextHref) location.hash = nextHref;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, nextHref]);
  return (
    <div className="modal-back" onClick={onClose}>
      <div className="confetti" aria-hidden="true">
        {pieces.map((p, i) => (
          <i key={i} style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`, background: p.color, transform: `rotate(${p.rot}deg)` }} />
        ))}
      </div>
      <div className="modal celebrate" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <Mascot size={110} mood="wow" className="bounce" />
        <h2>{phrase}</h2>
        {firstTime ? <div className="xp-gain">+{xp} XP</div> : <p className="muted">Ya habías completado esta lección (no suma XP otra vez).</p>}
        {badges.length > 0 && (
          <div className="new-badges">
            <div className="muted small">¡Nueva insignia!</div>
            {badges.map((b) => (
              <div key={b.id} className="badge-pill">
                <span className="badge-icon">{b.icon}</span> <strong>{b.name}</strong> <span className="muted">— {b.desc}</span>
              </div>
            ))}
          </div>
        )}
        <div className="modal-actions">
          <button className="btn ghost" onClick={onClose}>
            Quedarme aquí
          </button>
          {nextHref && (
            <a className="btn primary" href={nextHref}>
              Siguiente: {nextTitle} →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
