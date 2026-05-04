/**
 * AvatarShowcase — visual smoke test for the Avatar component sliced from
 * Figma 497:979. Renders every variant axis (size × color × state) so we
 * can eyeball-compare against the source frame.
 *
 * Imported at the bottom of App.tsx; intentionally NOT a separate route to
 * avoid polluting the existing token-explorer demo with router setup.
 */
import { Avatar } from '@btech/ui-react';
import '@btech/ui-react/styles.css';
import { token } from '@btech/tokens-bspace';
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
  width: 80,
  fontSize: 12,
  color: token('color.text.tertiary'),
  fontFamily: 'var(--font-family-mono)',
};

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
const COLORS = ['green', 'blue', 'orange', 'purple', 'teal', 'pink'] as const;

export function AvatarShowcase() {
  return (
    <section style={sectionStyle}>
      <h2 style={titleStyle}>Avatar — sliced from Figma 497:979</h2>
      <p style={subtitleStyle}>
        First component sliced through the new pipeline. Compare side-by-side with the Figma frame.
      </p>

      {/* Initials × size × color */}
      {COLORS.map((color) => (
        <div key={color} style={rowStyle}>
          <span style={rowLabelStyle}>color={color}</span>
          {SIZES.map((size) => (
            <Avatar key={size} size={size} initials="FL" color={color} />
          ))}
        </div>
      ))}

      {/* Empty / Error / Count states */}
      <div style={{ ...rowStyle, marginTop: 24 }}>
        <span style={rowLabelStyle}>state=empty</span>
        {SIZES.map((size) => (
          <Avatar key={size} size={size} />
        ))}
      </div>
      <div style={rowStyle}>
        <span style={rowLabelStyle}>state=error</span>
        {SIZES.map((size) => (
          <Avatar key={size} size={size} status="error" />
        ))}
      </div>
      <div style={rowStyle}>
        <span style={rowLabelStyle}>count=5</span>
        {SIZES.map((size) => (
          <Avatar key={size} size={size} count={5} />
        ))}
      </div>

      {/* Image variant */}
      <div style={rowStyle}>
        <span style={rowLabelStyle}>image</span>
        {SIZES.map((size) => (
          <Avatar
            key={size}
            size={size}
            src="https://api.dicebear.com/9.x/avataaars/png?seed=BTech"
            alt="Sample"
            color="green"
          />
        ))}
      </div>
    </section>
  );
}
