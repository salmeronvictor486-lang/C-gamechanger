// Resaltado de sintaxis de C para los bloques de código de las lecciones.

const KEYWORDS = new Set(
  'auto break case const continue default do else enum extern for goto if inline register restrict return sizeof static struct switch typedef union volatile while true false NULL'.split(
    ' ',
  ),
);
const TYPES = new Set('void char short int long float double signed unsigned bool _Bool FILE size_t time_t'.split(' '));

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const RE =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?)|(^[ \t]*#[^\n]*)|(\b\d+(?:\.\d*)?(?:[eE][+-]?\d+)?[fFuUlL]*\b|\b0[xX][0-9a-fA-F]+\b)|([A-Za-z_]\w*)(\s*\()?/gm;

export function highlightC(code: string): string {
  let out = '';
  let last = 0;
  RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = RE.exec(code))) {
    out += esc(code.slice(last, m.index));
    last = m.index + m[0].length;
    if (m[1]) out += `<span class="tk-com">${esc(m[1])}</span>`;
    else if (m[2]) out += `<span class="tk-str">${highlightFormat(m[2])}</span>`;
    else if (m[3]) out += `<span class="tk-pre">${esc(m[3])}</span>`;
    else if (m[4]) out += `<span class="tk-num">${esc(m[4])}</span>`;
    else if (m[5]) {
      const w = m[5];
      const cls = KEYWORDS.has(w) ? 'tk-kw' : TYPES.has(w) ? 'tk-type' : m[6] ? 'tk-fn' : 'tk-id';
      out += `<span class="${cls}">${esc(w)}</span>${m[6] ? esc(m[6]) : ''}`;
    }
  }
  out += esc(code.slice(last));
  return out;
}

function highlightFormat(s: string): string {
  return esc(s).replace(/(%[-+ #0]*\d*(?:\.\d+)?(?:hh|h|ll|l|L|z)?[diouxXcsfFeEgGp%]|\\[ntr0\\"'])/g, '<span class="tk-fmt">$1</span>');
}
