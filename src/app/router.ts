// Rutas con # (GitHub Pages no sabe redirigir rutas a index.html).
import { useSyncExternalStore } from 'react';

export type Route =
  | { page: 'home' }
  | { page: 'chapter'; id: string }
  | { page: 'lesson'; id: string }
  | { page: 'playground'; code?: string }
  | { page: 'retos' }
  | { page: 'chuleta' }
  | { page: 'perfil' };

export function parseRoute(hash: string): Route {
  const h = hash.replace(/^#\/?/, '');
  const [path, query = ''] = h.split('?');
  const parts = path.split('/').filter(Boolean);
  switch (parts[0]) {
    case 'capitulo':
      return parts[1] ? { page: 'chapter', id: decodeURIComponent(parts[1]) } : { page: 'home' };
    case 'leccion':
      return parts[1] ? { page: 'lesson', id: decodeURIComponent(parts[1]) } : { page: 'home' };
    case 'practica': {
      const code = new URLSearchParams(query).get('codigo') ?? undefined;
      return { page: 'playground', code };
    }
    case 'retos':
      return { page: 'retos' };
    case 'chuleta':
      return { page: 'chuleta' };
    case 'perfil':
      return { page: 'perfil' };
    default:
      return { page: 'home' };
  }
}

export function href(r: Route): string {
  switch (r.page) {
    case 'home':
      return '#/';
    case 'chapter':
      return `#/capitulo/${encodeURIComponent(r.id)}`;
    case 'lesson':
      return `#/leccion/${encodeURIComponent(r.id)}`;
    case 'playground':
      return r.code ? `#/practica?codigo=${encodeURIComponent(r.code)}` : '#/practica';
    case 'retos':
      return '#/retos';
    case 'chuleta':
      return '#/chuleta';
    case 'perfil':
      return '#/perfil';
  }
}

export function go(r: Route): void {
  location.hash = href(r);
}

function subscribe(cb: () => void): () => void {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function useHash(): string {
  return useSyncExternalStore(subscribe, () => location.hash, () => '');
}

/** Código compartido por enlace: base64url de UTF-8. */
export function encodeShare(code: string): string {
  const bytes = new TextEncoder().encode(code);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeShare(s: string): string | null {
  try {
    const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}
