import { useState } from 'react';
import { BTAlert, BTAlertProvider, useAlert } from '@btech/ui-react';
import type { BTAlertVariant } from '@btech/ui-react';

// ── Config ────────────────────────────────────────────────────────────────────

interface AlertConfig {
  variant: BTAlertVariant;
  label: string;
  description?: string;
  linkLabel?: string;
  actionLabel?: string;
  dismissible?: boolean;
  withDesc?: boolean;
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
  { variant: 'info',         label: 'Info alert',         description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.', linkLabel: 'Learn more', actionLabel: 'Action', dismissible: true },
  { variant: 'success',      label: 'Success alert',      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.', linkLabel: 'Learn more', actionLabel: 'Action', dismissible: true },
  { variant: 'error',        label: 'Error alert',        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.', linkLabel: 'Learn more', actionLabel: 'Action', dismissible: true },
  { variant: 'warning',      label: 'Warning alert',      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.', linkLabel: 'Learn more', actionLabel: 'Action', dismissible: true },
  { variant: 'neutral',      label: 'Neutral alert',      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.', linkLabel: 'Learn more', actionLabel: 'Action', dismissible: true },
  { variant: 'neutral-dark', label: 'Neutral dark alert', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.', linkLabel: 'Learn more', actionLabel: 'Action', dismissible: true },
];

const SHOW_CONFIGS: AlertConfig[] = [
  { variant: 'info',         label: 'Info — simple',              withDesc: false },
  { variant: 'success',      label: 'Success — simple',           withDesc: false },
  { variant: 'error',        label: 'Error — simple',             withDesc: false },
  { variant: 'warning',      label: 'Warning — simple',           withDesc: false },
  { variant: 'neutral',      label: 'Neutral — simple',           withDesc: false },
  { variant: 'neutral-dark', label: 'Neutral dark — simple',      withDesc: false },
  { variant: 'info',         label: 'Info — with description',    description: 'Something needs your attention right now.',     withDesc: true },
  { variant: 'success',      label: 'Success — with description', description: 'Your changes have been saved successfully.',     withDesc: true },
  { variant: 'error',        label: 'Error — with description',   description: 'Could not complete the request. Try again.',     withDesc: true },
  { variant: 'warning',      label: 'Warning — with description', description: 'This action may have unintended side effects.', withDesc: true },
];

const btnStyle: React.CSSProperties = {
  padding: '6px 14px', fontSize: 12, fontWeight: 500,
  border: '1px solid var(--border-primary)', borderRadius: 8,
  background: 'none', cursor: 'pointer', color: 'var(--text-primary)',
};

// ── Inner content (needs useAlert, so must be inside BTAlertProvider) ─────────

function BTAlertShowcaseInner() {
  const [activeTab, setActiveTab] = useState<'ui' | 'usage'>('ui');
  const [dismissedSimple, setDismissedSimple] = useState<Record<number, boolean>>({});
  const [dismissedFull, setDismissedFull]     = useState<Record<number, boolean>>({});
  const { show } = useAlert();

  function triggerAlert(cfg: AlertConfig) {
    show({
      variant: cfg.variant,
      label: cfg.label,
      description: cfg.description,
      linkLabel: cfg.description ? 'Learn more' : undefined,
      actionLabel: 'Action',
      dismissible: true,
      duration: 5000,
    });
  }

  return (
    <section className="showcase-section">
      <h1 className="showcase-section__title">BTAlert</h1>
      <p className="showcase-section__subtitle">
        Figma 681:11285 — 6 variants, optional description, inline link, action, dismiss
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)', marginBottom: 24 }}>
        {(['ui', 'usage'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '8px 20px', fontSize: 13, fontWeight: 500,
              background: 'none', border: 'none',
              borderBottom: `2px solid ${activeTab === tab ? 'var(--text-primary)' : 'transparent'}`,
              cursor: 'pointer',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              transition: 'color 0.12s, border-color 0.12s',
            }}
          >
            {tab === 'ui' ? 'UI' : 'Usage'}
          </button>
        ))}
      </div>

      {/* ── UI tab ── */}
      {activeTab === 'ui' && (
        <>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px', color: 'var(--text-primary)' }}>
            Simple (no description)
          </h2>
          <p className="showcase-section__subtitle">Label only — action renders as text link.</p>
          <div style={{ marginBottom: 16 }}>
            <button onClick={() => setDismissedSimple({})} style={btnStyle}>Reset alerts</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 600 }}>
            {SIMPLE.map((cfg, i) => dismissedSimple[i] ? null : (
              <BTAlert key={cfg.variant} variant={cfg.variant} label={cfg.label} actionLabel={cfg.actionLabel} dismissible
                onDismiss={() => setDismissedSimple((p) => ({ ...p, [i]: true }))} />
            ))}
          </div>

          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '32px 0 4px', color: 'var(--text-primary)' }}>
            With description + link
          </h2>
          <p className="showcase-section__subtitle">Bold label + text + inline link — action as bordered button.</p>
          <div style={{ marginBottom: 16 }}>
            <button onClick={() => setDismissedFull({})} style={btnStyle}>Reset alerts</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 600 }}>
            {WITH_DESC.map((cfg, i) => dismissedFull[i] ? null : (
              <BTAlert key={cfg.variant} variant={cfg.variant} label={cfg.label}
                description={cfg.description} linkLabel={cfg.linkLabel}
                actionLabel={cfg.actionLabel} dismissible={cfg.dismissible}
                onDismiss={() => setDismissedFull((p) => ({ ...p, [i]: true }))} />
            ))}
          </div>
        </>
      )}

      {/* ── Usage tab ── */}
      {activeTab === 'usage' && (
        <>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 4px', color: 'var(--text-primary)' }}>
            showAlert — programmatic trigger
          </h2>
          <p className="showcase-section__subtitle">
            Each button calls <code>useAlert().show()</code>. Alerts appear bottom-right, auto-dismiss after 5s.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 700 }}>
            {SHOW_CONFIGS.map((cfg) => (
              <button key={`${cfg.variant}-${cfg.withDesc}`} onClick={() => triggerAlert(cfg)} style={btnStyle}>
                {cfg.label}
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ── Exported showcase (wraps with provider) ───────────────────────────────────

export function BTAlertShowcase() {
  return (
    <BTAlertProvider>
      <BTAlertShowcaseInner />
    </BTAlertProvider>
  );
}
