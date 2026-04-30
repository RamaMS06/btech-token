/**
 * TokenJsonView — read-only DTCG JSON view of the active set
 * ------------------------------------------------------------
 * The JSON tab from the toolbar's view-mode toggle. It serialises the active
 * set's tree using the same util the push flow uses, so what designers see
 * here is exactly what would land in the repo.
 *
 * Read-only by design (Phase 1):
 *   In-place editing introduces parsing/validation complexity that's better
 *   handled by the structured editor in preview mode. A "Copy" button is
 *   provided for offline inspection.
 *
 * Highlighting is intentionally simple — a small regex pass to colour keys,
 * strings, numbers, and DTCG aliases. We avoid Prism / highlight.js to keep
 * the bundle small (the inlined HTML already carries two woff2 fonts).
 */

import React, { useMemo, useState } from 'react';
import type { TokenSet } from '../../shared/types.js';
import { serializeSetToJson } from '../../shared/transform.js';

// ── Highlighter ──────────────────────────────────────────────────────────────

/**
 * Token kinds the highlighter recognises. Each maps to a CSS class so the
 * actual colours live in globals.css and stay in sync with Figma's theme
 * variables (light/dark). We never colour the punctuation — keeps it readable.
 */
type Tok = 'key' | 'string' | 'alias' | 'number' | 'boolean' | 'null' | 'plain';

interface Span { kind: Tok; text: string; }

/**
 * Lex one line of pretty-printed JSON into coloured spans. The serializer
 * always emits 2-space indentation with double-quoted keys + strings, so a
 * deterministic regex chain works fine here — no full parser needed.
 */
function lexLine(line: string): Span[] {
  const spans: Span[] = [];
  let i = 0;
  while (i < line.length) {
    const rest = line.slice(i);

    // 1. Object key: "key": …
    const keyMatch = /^(\s*)("(?:\\.|[^"\\])*")(\s*:)/.exec(rest);
    if (keyMatch) {
      const [whole, ws, key, colon] = keyMatch;
      if (ws) spans.push({ kind: 'plain', text: ws });
      spans.push({ kind: 'key', text: key });
      spans.push({ kind: 'plain', text: colon });
      i += whole.length;
      continue;
    }

    // 2. String value (after a colon, or inside an array)
    const strMatch = /^("(?:\\.|[^"\\])*")/.exec(rest);
    if (strMatch) {
      const [whole, str] = strMatch;
      // Detect DTCG alias inside the string: "{some.path}"
      const inner = str.slice(1, -1);
      const isAlias = inner.startsWith('{') && inner.endsWith('}');
      spans.push({ kind: isAlias ? 'alias' : 'string', text: str });
      i += whole.length;
      continue;
    }

    // 3. Number (int / float / negative / scientific)
    const numMatch = /^(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(rest);
    if (numMatch) {
      spans.push({ kind: 'number', text: numMatch[1] });
      i += numMatch[1].length;
      continue;
    }

    // 4. Boolean / null
    const litMatch = /^(true|false|null)\b/.exec(rest);
    if (litMatch) {
      const word = litMatch[1];
      spans.push({ kind: word === 'null' ? 'null' : 'boolean', text: word });
      i += word.length;
      continue;
    }

    // 5. Anything else (punctuation, whitespace) → plain
    spans.push({ kind: 'plain', text: line[i] });
    i += 1;
  }
  return spans;
}

// ── Component ─────────────────────────────────────────────────────────────────

interface TokenJsonViewProps {
  activeSet: TokenSet;
}

export function TokenJsonView({ activeSet }: TokenJsonViewProps) {
  const [copied, setCopied] = useState(false);

  // Re-serialise on every set change so the view always matches the in-memory
  // edit state. The serializer is fast (pure JSON.stringify), so memoising on
  // `activeSet` reference is sufficient — no debounce needed.
  const json = useMemo(() => serializeSetToJson(activeSet), [activeSet]);
  const lines = useMemo(() => json.split('\n'), [json]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      // Reset after a moment so the user can copy again — no debounce lib needed
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard failures (rare in Figma's iframe) — silently ignored;
      // designers can still select the text manually with the cursor.
      setCopied(false);
    }
  }

  return (
    <div className="json-view">
      <div className="json-view__toolbar">
        <span className="json-view__path">{activeSet.path}</span>
        <button
          type="button"
          className="json-view__copy"
          onClick={handleCopy}
          aria-label="Copy JSON to clipboard"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="json-view__pre">
        {lines.map((line, idx) => (
          <span key={idx} className="json-view__line">
            <span className="json-view__lineno">{idx + 1}</span>
            <span className="json-view__code">
              {lexLine(line).map((span, i) => (
                <span key={i} className={`tok tok--${span.kind}`}>
                  {span.text}
                </span>
              ))}
            </span>
            {'\n'}
          </span>
        ))}
      </pre>
    </div>
  );
}
