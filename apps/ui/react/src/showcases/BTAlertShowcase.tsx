import { useState } from 'react';
import { BTAlert } from '@btech/ui-react';
import type { BTAlertVariant } from '@btech/ui-react';

interface AlertConfig {
  variant: BTAlertVariant;
  label: string;
  description?: string;
  actionLabel?: string;
  dismissible?: boolean;
}

const SIMPLE: AlertConfig[] = [
  { variant: 'info',         label: 'Info alert',         actionLabel: 'Action' },
  { variant: 'success',      label: 'Success alert',      actionLabel: 'Action' },
  { variant: 'error',        label: 'Error alert',        actionLabel: 'Action' },
  { variant: 'warning',      label: 'Warning alert',      actionLabel: 'Action' },
  { variant: 'neutral',      label: 'Neutral alert',      actionLabel: 'Action' },
  { variant: 'neutral-dark', label: 'Neutral dark alert', actionLabel: 'Action' },
];

const WITH_DESC: AlertConfig[] = [
  {
    variant: 'info',
    label: 'Info alert',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.',
    actionLabel: 'Action',
    dismissible: true,
  },
  {
    variant: 'success',
    label: 'Success alert',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.',
    actionLabel: 'Action',
    dismissible: true,
  },
  {
    variant: 'error',
    label: 'Error alert',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.',
    actionLabel: 'Action',
    dismissible: true,
  },
  {
    variant: 'warning',
    label: 'Warning alert',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.',
    actionLabel: 'Action',
    dismissible: true,
  },
  {
    variant: 'neutral',
    label: 'Neutral alert',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.',
    actionLabel: 'Action',
    dismissible: true,
  },
  {
    variant: 'neutral-dark',
    label: 'Neutral dark alert',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.',
    actionLabel: 'Action',
    dismissible: true,
  },
];

export function BTAlertShowcase() {
  const [dismissedSimple, setDismissedSimple] = useState<Record<number, boolean>>({});
  const [dismissedFull, setDismissedFull]     = useState<Record<number, boolean>>({});

  return (
    <section className="showcase-section">
      <h1 className="showcase-section__title">BTAlert</h1>
      <p className="showcase-section__subtitle">
        Figma 681:11285 — 6 variants, optional description, action, dismiss
      </p>

      {/* ── Simple ── */}
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px', color: 'var(--text-primary, #292f37)' }}>
        Simple (no description)
      </h2>
      <p className="showcase-section__subtitle">Label only — action renders as text link.</p>

      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setDismissedSimple({})}
          style={{
            padding: '6px 14px', fontSize: 12, fontWeight: 500,
            border: '1px solid var(--border-primary, #dbdde1)', borderRadius: 8,
            background: 'none', cursor: 'pointer', color: 'var(--text-primary, #292f37)',
          }}
        >
          Reset alerts
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 600 }}>
        {SIMPLE.map((cfg, i) =>
          dismissedSimple[i] ? null : (
            <BTAlert
              key={cfg.variant}
              variant={cfg.variant}
              label={cfg.label}
              actionLabel={cfg.actionLabel}
              dismissible
              onAction={() => console.log(`action: ${cfg.variant}`)}
              onDismiss={() => setDismissedSimple((prev) => ({ ...prev, [i]: true }))}
            />
          ),
        )}
      </div>

      {/* ── With description ── */}
      <h2 style={{ fontSize: 15, fontWeight: 600, margin: '32px 0 4px', color: 'var(--text-primary, #292f37)' }}>
        With description
      </h2>
      <p className="showcase-section__subtitle">
        Bold label + supporting text — action renders as bordered button.
      </p>

      <div style={{ marginBottom: 16 }}>
        <button
          onClick={() => setDismissedFull({})}
          style={{
            padding: '6px 14px', fontSize: 12, fontWeight: 500,
            border: '1px solid var(--border-primary, #dbdde1)', borderRadius: 8,
            background: 'none', cursor: 'pointer', color: 'var(--text-primary, #292f37)',
          }}
        >
          Reset alerts
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 600 }}>
        {WITH_DESC.map((cfg, i) =>
          dismissedFull[i] ? null : (
            <BTAlert
              key={cfg.variant}
              variant={cfg.variant}
              label={cfg.label}
              description={cfg.description}
              actionLabel={cfg.actionLabel}
              dismissible={cfg.dismissible}
              onAction={() => console.log(`action: ${cfg.variant}`)}
              onDismiss={() => setDismissedFull((prev) => ({ ...prev, [i]: true }))}
            />
          ),
        )}
      </div>
    </section>
  );
}
