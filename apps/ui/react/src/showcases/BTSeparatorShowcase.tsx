import { BTSeparator } from '@btech/ui-react';

export function BTSeparatorShowcase() {
  return (
    <section className="showcase-section">
      <h2 className="showcase-section__title">Separator</h2>
      <p className="showcase-section__subtitle">
        1px divider line — horizontal (default) or vertical. Figma node 194:756.
      </p>

      {/* Horizontal */}
      <div className="showcase-row">
        <span className="showcase-row__label">horizontal</span>
        <div className="showcase-row__items" style={{ width: '100%', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: 16, background: 'var(--bg-subtle)', borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Section A</span>
            <BTSeparator />
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Section B</span>
            <BTSeparator />
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Section C</span>
          </div>
        </div>
      </div>

      {/* Vertical */}
      <div className="showcase-row">
        <span className="showcase-row__label">vertical</span>
        <div className="showcase-row__items">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 32, padding: '0 8px', background: 'var(--bg-subtle)', borderRadius: 4 }}>
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Item A</span>
            <BTSeparator orientation="vertical" />
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Item B</span>
            <BTSeparator orientation="vertical" />
            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>Item C</span>
          </div>
        </div>
      </div>
    </section>
  );
}
