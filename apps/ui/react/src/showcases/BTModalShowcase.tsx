import { useState, type CSSProperties } from 'react';
import { BTModal } from '@btech/ui-react';
import type { BTModalSize } from '@btech/ui-react';

const SIZES: BTModalSize[] = ['sm', 'md', 'lg'];

const tabBtnStyle = (active: boolean): CSSProperties => ({
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 500,
  border: '1px solid var(--border-primary)',
  borderRadius: 8,
  background: active ? 'var(--bg-secondary)' : 'none',
  color: 'var(--text-primary)',
  cursor: 'pointer',
});

const ctlBtnStyle: CSSProperties = {
  padding: '6px 14px',
  fontSize: 12,
  fontWeight: 500,
  border: '1px solid var(--border-primary)',
  borderRadius: 8,
  background: 'var(--color-brand-primary)',
  color: 'var(--text-inverse)',
  cursor: 'pointer',
};

// Inline static panel — used for visual-spec rows.
function StaticPanel({
  size,
  hasClose = true,
  hasCheckbox = false,
  title,
  subtext,
}: {
  size: BTModalSize;
  hasClose?: boolean;
  hasCheckbox?: boolean;
  title: string;
  subtext?: string;
}) {
  return (
    <div className={`bt-modal-panel bt-modal-panel--${size}`} style={{ position: 'relative' }}>
      <div className="bt-modal-header">
        <h2 className="bt-modal-title">{title}</h2>
        {subtext && <p className="bt-modal-subtext">{subtext}</p>}
        {hasClose && (
          <button type="button" className="bt-modal-close" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M3.5 3.5 L12.5 12.5 M12.5 3.5 L3.5 12.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
      <div className="bt-modal-footer">
        {hasCheckbox && (
          <div className="bt-modal-footer__left">
            <input id={`static-cbx-${size}`} type="checkbox" className="bt-modal-footer__checkbox" />
            <label htmlFor={`static-cbx-${size}`} className="bt-modal-footer__checkbox-label">
              Don&apos;t show again
            </label>
          </div>
        )}
        <button type="button" className="bt-modal-btn bt-modal-btn--secondary">Cancel</button>
        <button type="button" className="bt-modal-btn bt-modal-btn--primary">Confirm</button>
      </div>
    </div>
  );
}

export function BTModalShowcase() {
  const [activeTab, setActiveTab] = useState<'ui' | 'usage'>('ui');

  // Usage tab playground
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState<BTModalSize>('sm');
  const [hasClose, setHasClose] = useState(true);
  const [hasFooter, setHasFooter] = useState(true);
  const [hasSecondaryButton, setHasSecondaryButton] = useState(true);
  const [hasCheckbox, setHasCheckbox] = useState(false);

  return (
    <section className="showcase-section">
      <h1 className="showcase-section__title">BTModal</h1>
      <p className="showcase-section__subtitle">
        Figma 2123:1992 (D-Modal) — 3 sizes, header + content + footer, primary/secondary/checkbox/close
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button style={tabBtnStyle(activeTab === 'ui')} onClick={() => setActiveTab('ui')}>UI</button>
        <button style={tabBtnStyle(activeTab === 'usage')} onClick={() => setActiveTab('usage')}>Usage</button>
      </div>

      {activeTab === 'ui' && (
        <>
          {SIZES.map((s) => (
            <div
              key={s}
              className="showcase-row"
              style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: 32 }}
            >
              <span className="showcase-row__label">size = {s}</span>
              <StaticPanel
                size={s}
                title={`Modal title — ${s}`}
                subtext="Supporting subtext describing what this modal does."
              />
            </div>
          ))}

          <div
            className="showcase-row"
            style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: 32 }}
          >
            <span className="showcase-row__label">hasClose = false</span>
            <StaticPanel
              size="sm"
              hasClose={false}
              title="No close button"
              subtext="Force users to choose an action."
            />
          </div>

          <div
            className="showcase-row"
            style={{ flexDirection: 'column', alignItems: 'flex-start' }}
          >
            <span className="showcase-row__label">hasCheckbox = true</span>
            <StaticPanel
              size="sm"
              hasCheckbox
              title="Modal with checkbox"
              subtext="Footer left side hosts a checkbox + label."
            />
          </div>
        </>
      )}

      {activeTab === 'usage' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 600, marginBottom: 24 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
              Size
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as BTModalSize)}
                style={{ padding: 6, border: '1px solid var(--border-primary)', borderRadius: 4 }}
              >
                <option value="sm">sm (500 px)</option>
                <option value="md">md (720 px)</option>
                <option value="lg">lg (1042 px)</option>
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-primary)' }}>
              <input type="checkbox" checked={hasClose} onChange={(e) => setHasClose(e.target.checked)} /> Has close
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-primary)' }}>
              <input type="checkbox" checked={hasFooter} onChange={(e) => setHasFooter(e.target.checked)} /> Has footer
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-primary)' }}>
              <input type="checkbox" checked={hasSecondaryButton} onChange={(e) => setHasSecondaryButton(e.target.checked)} /> Has secondary button
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-primary)' }}>
              <input type="checkbox" checked={hasCheckbox} onChange={(e) => setHasCheckbox(e.target.checked)} /> Has checkbox
            </label>
          </div>

          <button style={ctlBtnStyle} onClick={() => setOpen(true)}>Open Modal</button>

          <BTModal
            open={open}
            title="Confirm action"
            subtext="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
            size={size}
            hasClose={hasClose}
            hasFooter={hasFooter}
            hasSecondaryButton={hasSecondaryButton}
            hasCheckbox={hasCheckbox}
            onPrimary={() => setOpen(false)}
            onSecondary={() => setOpen(false)}
            onClose={() => setOpen(false)}
          >
            <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.5 }}>
              This is an optional content slot. Anything passed as children renders
              inside the white header section, below the title.
            </p>
          </BTModal>
        </>
      )}
    </section>
  );
}
