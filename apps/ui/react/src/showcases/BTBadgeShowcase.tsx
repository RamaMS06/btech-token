// BTBadgeShowcase — visual smoke test for BTBadge (atom).
// Sliced from Figma 72:1516.
import { BTBadge } from '@btech/ui-react';

const VARIANTS = ['success', 'waiting', 'neutral', 'draft', 'reject', 'custom'] as const;

export function BTBadgeShowcase() {
  return (
    <section className="showcase-section">
      <h2 className="showcase-section__title">BTBadge — Figma 72:1516</h2>
      <p className="showcase-section__subtitle">
        6 variants × normal + reverse. Optional left/right icon slots.
      </p>

      <div className="showcase-row">
        <span className="showcase-row__label">normal</span>
        <div className="showcase-row__items">
          {VARIANTS.map((v) => (
            <BTBadge key={v} label={v.charAt(0).toUpperCase() + v.slice(1)} variant={v} />
          ))}
        </div>
      </div>

      <div className="showcase-row">
        <span className="showcase-row__label">reverse</span>
        <div className="showcase-row__items">
          {VARIANTS.map((v) => (
            <BTBadge
              key={v}
              label={v.charAt(0).toUpperCase() + v.slice(1)}
              variant={v}
              reverseColors
            />
          ))}
        </div>
      </div>

      <div className="showcase-row">
        <span className="showcase-row__label">left icon</span>
        <div className="showcase-row__items">
          <BTBadge label="Success" variant="success" leftIcon={<CheckIcon />} />
          <BTBadge label="Waiting" variant="waiting" leftIcon={<ClockIcon />} />
          <BTBadge label="Reject" variant="reject" leftIcon={<XIcon />} />
        </div>
      </div>

      <div className="showcase-row">
        <span className="showcase-row__label">right icon</span>
        <div className="showcase-row__items">
          <BTBadge label="Draft" variant="draft" rightIcon={<EditIcon />} />
          <BTBadge label="Custom" variant="custom" rightIcon={<ArrowIcon />} />
        </div>
      </div>
    </section>
  );
}

// ── Inline icons (16×16 Material-path SVGs, no external dep) ─────────────────

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
    </svg>
  );
}
