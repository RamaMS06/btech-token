// Auto-generated showcase — do not edit manually
import { BTHint } from '@btech/ui-react';

export function BTHintShowcase() {
  return (
    <section style={{ padding: '24px 0', borderTop: '1px solid #e5e7eb' }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#6b7280' }}>
        Atoms › Hint — Figma 658:1960
      </h2>

      {(['lg', 'md', 'sm'] as const).map((size) => (
        <div key={size} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <span style={{ width: 24, fontSize: 12, color: '#9ca3af' }}>{size}</span>
          {/* Dot */}
          <BTHint size={size} />
          {/* 1-digit */}
          <BTHint count={5} size={size} />
          {/* 2-digit */}
          <BTHint count={22} size={size} />
          {/* 99+ */}
          <BTHint count={150} size={size} />
        </div>
      ))}
    </section>
  );
}
