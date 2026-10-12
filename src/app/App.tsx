import { useEffect } from 'react';
import { rankOf } from '../game/game';
import { ChapterPage } from '../pages/ChapterPage';
import { Home } from '../pages/Home';
import { LessonPage } from '../pages/LessonPage';
import { Playground } from '../pages/Playground';
import { Profile } from '../pages/Profile';
import { Reference } from '../pages/Reference';
import { Challenges } from '../pages/Challenges';
import { currentStreak, useProgress } from '../state/progress';
import { Mascot } from '../ui/Mascot';
import { href, parseRoute, useHash } from './router';

export function App() {
  const hash = useHash();
  const route = parseRoute(hash);
  const p = useProgress();

  useEffect(() => {
    const theme = p.settings.theme === 'auto' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : p.settings.theme;
    document.documentElement.dataset.theme = theme;
  }, [p.settings.theme]);

  useEffect(() => {
    if (route.page !== 'lesson') window.scrollTo(0, 0);
  }, [hash, route.page]);

  const { rank } = rankOf(p.xp);
  const streak = currentStreak(p);
  const fullBleed = route.page === 'lesson' || route.page === 'playground';

  return (
    <div className={`app ${fullBleed ? 'app-full' : ''}`}>
      <header className="topbar">
        <a className="brand" href="#/">
          <Mascot size={30} />
          <span className="brand-name">
            <span className="brand-c">C</span> <span className="brand-accent">Gamechanger</span>
          </span>
        </a>
        <nav className="nav">
          <a className={route.page === 'home' || route.page === 'chapter' ? 'active' : ''} href="#/">
            Aprender
          </a>
          <a className={route.page === 'retos' ? 'active' : ''} href={href({ page: 'retos' })}>
            Retos
          </a>
          <a className={route.page === 'playground' ? 'active' : ''} href={href({ page: 'playground' })}>
            Práctica
          </a>
          <a className={route.page === 'chuleta' ? 'active' : ''} href={href({ page: 'chuleta' })}>
            Chuleta
          </a>
        </nav>
        <a className="stats" href={href({ page: 'perfil' })} title="Tu perfil">
          <span className="stat" title="Días seguidos programando">
            🔥 {streak}
          </span>
          <span className="stat xp" title="Experiencia">
            ⚡ {p.xp} XP
          </span>
          <span className="stat rank" title={rank.name}>
            {rank.icon}
          </span>
        </a>
      </header>
      <main className="main">
        {route.page === 'home' && <Home />}
        {route.page === 'chapter' && <ChapterPage id={route.id} />}
        {route.page === 'lesson' && <LessonPage key={route.id} id={route.id} />}
        {route.page === 'playground' && <Playground shared={route.code} />}
        {route.page === 'retos' && <Challenges />}
        {route.page === 'chuleta' && <Reference />}
        {route.page === 'perfil' && <Profile />}
      </main>
    </div>
  );
}
