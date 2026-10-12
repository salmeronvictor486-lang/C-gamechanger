import { REFERENCE } from '../content/reference';
import { Markdown } from '../ui/Markdown';

export function Reference() {
  return (
    <div className="page reference">
      <h1>📋 Chuleta de C</h1>
      <p className="muted">Todo lo importante en una página. Guárdala en favoritos para consultarla mientras programas.</p>
      <nav className="toc">
        {REFERENCE.map((s) => (
          <a key={s.id} href={`#/chuleta`} onClick={(e) => {
            e.preventDefault();
            document.getElementById(`ref-${s.id}`)?.scrollIntoView({ behavior: 'smooth' });
          }}>
            {s.title}
          </a>
        ))}
      </nav>
      <div className="ref-grid">
        {REFERENCE.map((s) => (
          <section key={s.id} id={`ref-${s.id}`} className="ref-card">
            <h2>{s.title}</h2>
            <Markdown text={s.md} />
          </section>
        ))}
      </div>
    </div>
  );
}
