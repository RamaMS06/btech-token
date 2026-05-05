// BTButtonShowcase — visual smoke test for BTButton (atom).
// Figma 114:2645 — 5 variants × default/small sizes × all states.
import { BTButton } from '@btech/ui-react';

const VARIANTS = [
  'primary',
  'secondary',
  'destructive',
  'outline',
  'ghost',
] as const;

export function BTButtonShowcase() {
  return (
    <section className="showcase-section">
      <h2 className="showcase-section__title">BTButton — Figma 114:2645</h2>
      <p className="showcase-section__subtitle">
        5 variants × default + small sizes. Hover/active/disabled via CSS pseudo-classes.
      </p>

      {/* Default size — all variants */}
      <div className="showcase-row">
        <span className="showcase-row__label">default</span>
        <div className="showcase-row__items">
          {VARIANTS.map((v) => (
            <BTButton key={v} label={cap(v)} variant={v} />
          ))}
        </div>
      </div>

      {/* Small size */}
      <div className="showcase-row">
        <span className="showcase-row__label">small</span>
        <div className="showcase-row__items">
          {VARIANTS.map((v) => (
            <BTButton key={v} label={cap(v)} variant={v} size="small" />
          ))}
        </div>
      </div>

      {/* Disabled */}
      <div className="showcase-row">
        <span className="showcase-row__label">disabled</span>
        <div className="showcase-row__items">
          {VARIANTS.map((v) => (
            <BTButton key={v} label={cap(v)} variant={v} disabled />
          ))}
        </div>
      </div>

      {/* With left icon */}
      <div className="showcase-row">
        <span className="showcase-row__label">left icon</span>
        <div className="showcase-row__items">
          <BTButton label="Upload" variant="primary" leftIcon={<UploadIcon />} />
          <BTButton label="Save" variant="secondary" leftIcon={<CheckIcon />} />
          <BTButton label="Delete" variant="destructive" leftIcon={<TrashIcon />} />
        </div>
      </div>

      {/* Icon only */}
      <div className="showcase-row">
        <span className="showcase-row__label">icon only</span>
        <div className="showcase-row__items">
          {VARIANTS.map((v) => (
            <BTButton key={v} iconOnly variant={v}><PlusIcon /></BTButton>
          ))}
        </div>
      </div>

      {/* Icon only — small */}
      <div className="showcase-row">
        <span className="showcase-row__label">icon only sm</span>
        <div className="showcase-row__items">
          {VARIANTS.map((v) => (
            <BTButton key={v} iconOnly variant={v} size="small"><PlusIcon /></BTButton>
          ))}
        </div>
      </div>
    </section>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Inline icons (16×16 Material-path SVGs) ──────────────────────────────────

function UploadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  );
}
