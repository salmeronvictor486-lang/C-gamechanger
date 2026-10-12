// Markdown de las lecciones. Los bloques ```c se pueden ejecutar ahí mismo.
import { marked, type Token, type Tokens } from 'marked';
import { useMemo, useState } from 'react';
import { encodeShare, href } from '../app/router';
import { runOnce } from '../runner/runner';
import type { RunDone } from '../runner/protocol';
import { RunStatusView } from './Console';
import { highlightC } from './highlight';

marked.setOptions({ gfm: true, breaks: false });

const renderer = new marked.Renderer();
renderer.codespan = ({ text }) => `<code class="inline">${text}</code>`;
renderer.link = ({ href: h, text }) => `<a href="${h}"${h.startsWith('http') ? ' target="_blank" rel="noreferrer"' : ''}>${text}</a>`;

export function Markdown({ text, className = '' }: { text: string; className?: string }) {
  const tokens = useMemo(() => marked.lexer(text), [text]);
  const parts: (Token[] | Tokens.Code)[] = [];
  for (const tok of tokens) {
    if (tok.type === 'code') parts.push(tok as Tokens.Code);
    else {
      const last = parts[parts.length - 1];
      if (Array.isArray(last)) last.push(tok);
      else parts.push([tok]);
    }
  }
  return (
    <div className={`md ${className}`}>
      {parts.map((p, i) =>
        Array.isArray(p) ? (
          <div key={i} dangerouslySetInnerHTML={{ __html: marked.parser(Object.assign(p, { links: tokens.links }) as never, { renderer }) }} />
        ) : (
          <CodeBlock key={i} code={p.text} info={p.lang ?? ''} />
        ),
      )}
    </div>
  );
}

function parseInfo(info: string): { lang: string; run: boolean; input: string } {
  const lang = info.split(/\s+/)[0] || '';
  const m = /entrada="([^"]*)"/.exec(info);
  return { lang, run: lang === 'c' && !/\bnorun\b/.test(info), input: m ? m[1].replace(/\\n/g, '\n') : '' };
}

export function CodeBlock({ code, info }: { code: string; info: string }) {
  const { lang, run, input } = parseInfo(info);
  const [result, setResult] = useState<{ out: string; done: RunDone } | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  if (lang === 'salida' || lang === 'consola' || lang === 'text') {
    return (
      <div className="code-out">
        <div className="code-out-label">{lang === 'text' ? '' : 'Salida'}</div>
        <pre>{code}</pre>
      </div>
    );
  }
  const isC = lang === 'c' || lang === 'cpp' || lang === '';
  const html = isC ? highlightC(code) : code.replace(/</g, '&lt;');
  const execute = async () => {
    setBusy(true);
    const r = await runOnce(code, input ? input + '\n' : '');
    setResult({ out: r.output, done: r.done });
    setBusy(false);
  };
  return (
    <div className="code-block">
      <pre className="code" dangerouslySetInnerHTML={{ __html: html }} />
      {isC && (
        <div className="code-actions">
          {run && (
            <button className="btn-mini primary" onClick={execute} disabled={busy}>
              {busy ? '…' : '▶ Ejecutar'}
            </button>
          )}
          <a className="btn-mini" href={href({ page: 'playground', code: encodeShare(code) })} title="Abrir este código en la zona de práctica para cambiarlo">
            ✎ Probar a cambiarlo
          </a>
          <button
            className="btn-mini"
            onClick={() => {
              void navigator.clipboard?.writeText(code);
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
          >
            {copied ? '✓ Copiado' : 'Copiar'}
          </button>
          {input && <span className="muted small">entrada de ejemplo: {input.replace(/\n/g, ' ⏎ ')}</span>}
        </div>
      )}
      {result && (
        <div className="code-out">
          <div className="code-out-label">Salida</div>
          <pre>{result.out || ' '}</pre>
          {result.done.summary.status !== 'exit' && <RunStatusView done={result.done} />}
        </div>
      )}
    </div>
  );
}
