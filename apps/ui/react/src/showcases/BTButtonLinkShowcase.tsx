// BTButtonLinkShowcase — visual smoke test for BTButtonLink (atom).
// Figma 480:3197 — 5 variants × default/hover/active/disabled.
import { BTButtonLink } from '@btech/ui-react';
import type { BTButtonLinkVariant } from '@btech/ui-react';

const VARIANTS: BTButtonLinkVariant[] = [
  'primary',
  'secondary',
  'tertiary',
  'invert',
  'custom',
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function BTButtonLinkShowcase() {
  return (
    <section className="showcase-section">
      <h2 className="showcase-section__title">BTButtonLink — Figma 480:3197</h2>
      <p className="showcase-section__subtitle">
        5 variants. Hover → underline + bold. Active → neutral dim. Invert shown on dark bg.
      </p>

      {/* Default state — all variants */}
      <div className="showcase-row">
        <span className="showcase-row__label">default</span>
        <div className="showcase-row__items">
          {VARIANTS.map((v) => (
            <div
              key={v}
              style={v === 'invert' ? { background: '#292f37', padding: '4px 8px', borderRadius: 4 } : undefined}
            >
              <BTButtonLink key={v} label={cap(v)} variant={v} onClick={() => {}} />
            </div>
          ))}
        </div>
      </div>

      {/* Disabled */}
      <div className="showcase-row">
        <span className="showcase-row__label">disabled</span>
        <div className="showcase-row__items">
          {VARIANTS.map((v) => (
            <div
              key={v}
              style={v === 'invert' ? { background: '#292f37', padding: '4px 8px', borderRadius: 4 } : undefined}
            >
              <BTButtonLink label={cap(v)} variant={v} disabled />
            </div>
          ))}
        </div>
      </div>

      {/* With left + right icons (placeholder spans) */}
      <div className="showcase-row">
        <span className="showcase-row__label">with icons</span>
        <div className="showcase-row__items">
          <BTButtonLink
            label="Primary"
            variant="primary"
            leftIcon={<span style={{ fontSize: 16 }}>←</span>}
            rightIcon={<span style={{ fontSize: 16 }}>→</span>}
            onClick={() => {}}
          />
          <BTButtonLink
            label="Secondary"
            variant="secondary"
            leftIcon={<span style={{ fontSize: 16 }}>←</span>}
            onClick={() => {}}
          />
          <BTButtonLink
            label="Custom"
            variant="custom"
            rightIcon={<span style={{ fontSize: 16 }}>→</span>}
            onClick={() => {}}
          />
        </div>
      </div>
    </section>
  );
}
