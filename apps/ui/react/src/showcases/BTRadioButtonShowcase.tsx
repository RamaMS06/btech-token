// Auto-generated showcase — do not edit manually
import { useState } from 'react';
import { BTRadioButton } from '@btech/ui-react';

export function BTRadioButtonShowcase() {
  const [selected, setSelected] = useState<string>('active');

  return (
    <section style={{ padding: '24px 0', borderTop: '1px solid #e5e7eb' }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: '#6b7280' }}>
        Atoms › RadioButton — Figma 555:3529
      </h2>

      {/* All 5 states */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <BTRadioButton modelValue={selected} value="default" onChange={setSelected} label="Default" />
        <BTRadioButton modelValue={selected} value="active" onChange={setSelected} label="Active" />
        <BTRadioButton modelValue={selected} value="disabled" onChange={setSelected} label="Disable" disabled />
        <BTRadioButton modelValue={selected} value="dis-active" onChange={setSelected} label="Disable Active" disabled />
        <BTRadioButton modelValue={selected} value="error" onChange={setSelected} label="Error" error />
      </div>

      {/* With subtext */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <BTRadioButton modelValue={selected} value="s-default" onChange={setSelected} label="Label" subtext="Subtext" />
        <BTRadioButton modelValue={selected} value="s-active" onChange={setSelected} label="Label" subtext="Subtext" />
        <BTRadioButton modelValue={selected} value="s-error" onChange={setSelected} label="Label" subtext="Error message" error />
      </div>

      {/* Interactive group */}
      <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>Selected: <code>{selected}</code></p>
    </section>
  );
}
