/**
 * BTAvatarShowcase v2 — visual smoke test for BTAvatar (molecule) +
 * BTAvatarGroup (organism). Sliced from Figma 497:979 + 504:705.
 *
 * v2 demonstrates the data-class API: pass a `BTAvatarItem` (with
 * `name`, optional `imageUrl`, optional `color`) and the component
 * auto-derives initials, falls back to image-error → initials, and
 * supports skeleton loading.
 */
import { BTAvatar, BTAvatarGroup, type BTAvatarItem } from '@btech/ui-react';
import { token } from '@btech/tokens';
import type { CSSProperties } from 'react';

const sectionStyle: CSSProperties = {
  padding: '24px',
  borderTop: `1px solid ${token('color.border.primary')}`,
  background: token('color.bg.primary'),
  fontFamily: token('typography.fontFamily.sans'),
};
const titleStyle: CSSProperties = {
  margin: '0 0 4px',
  fontSize: 18,
  fontWeight: 700,
  color: token('color.text.primary'),
};
const subtitleStyle: CSSProperties = {
  margin: '0 0 16px',
  fontSize: 13,
  color: token('color.text.secondary'),
};
const rowStyle: CSSProperties = {
  display: 'flex',
  gap: 16,
  alignItems: 'center',
  flexWrap: 'wrap',
  marginBottom: 16,
};
const rowLabelStyle: CSSProperties = {
  width: 120,
  fontSize: 12,
  color: token('color.text.tertiary'),
  fontFamily: 'var(--font-family-mono)',
};

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
const COLORS = ['green', 'blue', 'orange', 'purple', 'teal', 'pink'] as const;

const SAMPLE_ITEMS: BTAvatarItem[] = [
  { name: 'Person 1', imageUrl: 'https://api.dicebear.com/9.x/avataaars/png?seed=1' },
  { name: 'Person 2', imageUrl: 'https://api.dicebear.com/9.x/avataaars/png?seed=2' },
  { name: 'Person 3', imageUrl: 'https://api.dicebear.com/9.x/avataaars/png?seed=3' },
  { name: 'Person 4', imageUrl: 'https://api.dicebear.com/9.x/avataaars/png?seed=4' },
  { name: 'Person 5', imageUrl: 'https://api.dicebear.com/9.x/avataaars/png?seed=5' },
];

export function BTAvatarShowcase() {
  return (
    <section style={sectionStyle}>
      <h2 style={titleStyle}>BTAvatar v2 — Figma 497:979</h2>
      <p style={subtitleStyle}>
        Data-class API: pass a BTAvatarItem (name + optional imageUrl + color).
        Initials auto-derived from name. Skeleton loading + image errorBuilder fallback.
      </p>

      {/* Initials × size × color (auto-derived from name) */}
      {COLORS.map((color) => (
        <div key={color} style={rowStyle}>
          <span style={rowLabelStyle}>color={color}</span>
          {SIZES.map((size) => (
            <BTAvatar key={size} size={size} item={{ name: 'Faisal Lestari', color }} />
          ))}
        </div>
      ))}

      <div style={{ ...rowStyle, marginTop: 24 }}>
        <span style={rowLabelStyle}>image</span>
        {SIZES.map((size) => (
          <BTAvatar
            key={size}
            size={size}
            item={{ name: 'Sample', imageUrl: 'https://api.dicebear.com/9.x/avataaars/png?seed=BTech' }}
          />
        ))}
      </div>

      <div style={rowStyle}>
        <span style={rowLabelStyle}>isLoading</span>
        {SIZES.map((size) => (
          <BTAvatar key={size} size={size} item={{ name: '?' }} isLoading />
        ))}
      </div>

      {/* Empty state — person icon, bg/subtler (Figma 497:979) */}
      <div style={rowStyle}>
        <span style={rowLabelStyle}>empty (no item)</span>
        {SIZES.map((size) => (
          <BTAvatar key={size} size={size} />
        ))}
      </div>

      {/* Error state — hide_image icon, bg/subtler (Figma 497:979) */}
      <div style={rowStyle}>
        <span style={rowLabelStyle}>status=error</span>
        {SIZES.map((size) => (
          <BTAvatar key={size} size={size} status="error" />
        ))}
      </div>

      {/* Avatar Group — Figma 504:705 */}
      <h2 style={{ ...titleStyle, marginTop: 32 }}>BTAvatarGroup — Figma 504:705</h2>
      <p style={subtitleStyle}>
        Organism — stacks avatars with negative-margin overlap + "+N" overflow counter.
      </p>

      {SIZES.map((size) => (
        <div key={size} style={rowStyle}>
          <span style={rowLabelStyle}>size={size}</span>
          <BTAvatarGroup items={SAMPLE_ITEMS} max={3} size={size} />
        </div>
      ))}

      <div style={rowStyle}>
        <span style={rowLabelStyle}>max=4 (no overflow)</span>
        <BTAvatarGroup items={SAMPLE_ITEMS.slice(0, 3)} max={4} size="md" />
      </div>
      <div style={rowStyle}>
        <span style={rowLabelStyle}>customOverflow=99</span>
        <BTAvatarGroup items={SAMPLE_ITEMS} max={3} customOverflowNumber={99} size="md" />
      </div>
    </section>
  );
}
