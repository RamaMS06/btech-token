import '@btech/tokens/styles.css';
import '@btech/tokens/utilities.css';
import { token, activateTenant, type TokenPath } from '@btech/tokens';
import { useState, useEffect, CSSProperties } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
type Tenant = 'default' | 'tenant-a' | 'tenant-bjb';

const TENANTS: { id: Tenant; label: string }[] = [
  { id: 'default',    label: 'Default' },
  { id: 'tenant-a',   label: 'Tenant A' },
  { id: 'tenant-bjb', label: 'Tenant BJB' },
];

// ── Global page styles (using token() in JS) ───────────────────────────────────
const pageStyle: CSSProperties = {
  maxWidth: 900,
  margin: '0 auto',
  padding: token('spacing.xl'),
  display: 'flex',
  flexDirection: 'column',
  gap: token('spacing.xl'),
  fontFamily: token('typography.fontFamily.sans'),
};

// ── Tenant switcher ───────────────────────────────────────────────────────────
function TenantSwitcher({ active, onChange }: { active: Tenant; onChange: (t: Tenant) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: token('spacing.sm') }}>
      <span style={{ fontSize: token('typography.fontSize.sm'), color: token('color.text.neutral.subtle') }}>
        Tenant:
      </span>
      {TENANTS.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: `${token('spacing.xs')} ${token('spacing.md')}`,
            borderRadius: token('radius.interactive'),
            border: `1.5px solid ${active === t.id ? token('color.stroke.primary') : token('color.stroke.neutral')}`,
            background: active === t.id ? token('color.background.primary') : token('color.background.surface.raised'),
            color: active === t.id ? token('color.text.on.primary') : token('color.text.neutral'),
            fontFamily: token('typography.fontFamily.sans'),
            fontSize: token('typography.fontSize.sm'),
            fontWeight: active === t.id ? token('typography.fontWeight.semibold') : token('typography.fontWeight.regular'),
            cursor: 'pointer',
            transition: `all ${token('motion.duration.fast')} ${token('motion.easing.ease')}`,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: token('color.background.surface.raised'),
      border: `1px solid ${token('color.stroke.neutral')}`,
      borderRadius: token('radius.card'),
      padding: token('spacing.lg'),
      display: 'flex',
      flexDirection: 'column',
      gap: token('spacing.md'),
      boxShadow: token('shadow.sm'),
    }}>
      <h2 style={{
        fontSize: token('typography.fontSize.xs'),
        fontWeight: token('typography.fontWeight.semibold'),
        textTransform: 'uppercase',
        letterSpacing: '0.07em',
        color: token('color.text.neutral.subtle'),
        borderBottom: `1px solid ${token('color.stroke.neutral')}`,
        paddingBottom: token('spacing.sm'),
      }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

// ── Color swatch ──────────────────────────────────────────────────────────────
function Swatch({ label, bg, fg, tokenPath }: { label: string; bg: string; fg: string; tokenPath: string }) {
  return (
    <div style={{
      background: bg, color: fg,
      borderRadius: token('radius.md'),
      padding: token('spacing.sm'),
      minHeight: 72,
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 2,
      border: '1px solid rgba(0,0,0,0.08)',
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, opacity: .9 }}>{label}</span>
      <code style={{ fontSize: 9, opacity: .75, background: 'transparent', padding: 0 }}>{tokenPath}</code>
    </div>
  );
}

// ── Token row — generic label + code ─────────────────────────────────────────
function TokenRow({ children, code }: { children: React.ReactNode; code: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: token('spacing.md'),
      padding: `${token('spacing.xs')} 0`,
      borderBottom: `1px solid ${token('color.stroke.neutral')}`,
    }}>
      <div style={{ flex: 1 }}>{children}</div>
      <code style={{ fontSize: token('typography.fontSize.xs'), flexShrink: 0 }}>{code}</code>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [tenant, setTenant] = useState<Tenant>('default');

  useEffect(() => {
    activateTenant({ tenant });
  }, [tenant]);

  // Spacing rows
  const spacings: Array<{ key: string; path: TokenPath }> = [
    { key: 'xs',  path: 'spacing.xs' },
    { key: 'sm',  path: 'spacing.sm' },
    { key: 'md',  path: 'spacing.md' },
    { key: 'lg',  path: 'spacing.lg' },
    { key: 'xl',  path: 'spacing.xl' },
    { key: 'xl2', path: 'spacing.xl2' },
    { key: 'xl3', path: 'spacing.xl3' },
  ];

  // Font sizes
  const fontSizes: Array<{ key: string; path: TokenPath }> = [
    { key: 'xs',   path: 'typography.fontSize.xs' },
    { key: 'sm',   path: 'typography.fontSize.sm' },
    { key: 'base', path: 'typography.fontSize.base' },
    { key: 'lg',   path: 'typography.fontSize.lg' },
    { key: 'xl',   path: 'typography.fontSize.xl' },
    { key: '2xl',  path: 'typography.fontSize.2xl' },
    { key: '3xl',  path: 'typography.fontSize.3xl' },
  ];

  // Font weights
  const fontWeights: Array<{ key: string; path: TokenPath }> = [
    { key: 'regular',  path: 'typography.fontWeight.regular' },
    { key: 'medium',   path: 'typography.fontWeight.medium' },
    { key: 'semibold', path: 'typography.fontWeight.semibold' },
    { key: 'bold',     path: 'typography.fontWeight.bold' },
  ];

  // Radii
  const radii: Array<{ key: string; path: TokenPath }> = [
    { key: 'none',        path: 'radius.none' },
    { key: 'sm',          path: 'radius.sm' },
    { key: 'md',          path: 'radius.md' },
    { key: 'lg',          path: 'radius.lg' },
    { key: 'xl',          path: 'radius.xl' },
    { key: 'full',        path: 'radius.full' },
    { key: 'interactive', path: 'radius.interactive' },
    { key: 'card',        path: 'radius.card' },
  ];

  // Shadows
  const shadows: Array<{ key: string; path: TokenPath }> = [
    { key: 'sm', path: 'shadow.sm' },
    { key: 'md', path: 'shadow.md' },
    { key: 'lg', path: 'shadow.lg' },
    { key: 'xl', path: 'shadow.xl' },
  ];

  // Motions
  const motions: Array<{ key: string; path: TokenPath }> = [
    { key: 'fast',   path: 'motion.duration.fast' },
    { key: 'normal', path: 'motion.duration.normal' },
    { key: 'slow',   path: 'motion.duration.slow' },
  ];

  return (
    <div style={{ background: token('color.background.surface'), minHeight: '100vh' }}>
      <div style={pageStyle}>

        {/* Header */}
        <header style={{ display: 'flex', flexDirection: 'column', gap: token('spacing.md'), alignItems: 'center', textAlign: 'center' }}>
          <h1 style={{ fontSize: token('typography.fontSize.xl'), fontWeight: token('typography.fontWeight.bold'), color: token('color.text.neutral') }}>
            token() · Full Token Showcase · React
          </h1>
          <p style={{ color: token('color.text.neutral.subtle'), fontSize: token('typography.fontSize.sm') }}>
            Every style below is applied via <code>token('path')</code> — type-safe, zero magic strings
          </p>
          <TenantSwitcher active={tenant} onChange={setTenant} />
        </header>

        {/* Color — Background */}
        <Section title="Color · Background">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: token('spacing.sm') }}>
            <Swatch label="primary"   bg={token('color.background.primary')}        fg={token('color.text.on.primary')} tokenPath="color.background.primary" />
            <Swatch label="secondary" bg={token('color.background.secondary')}      fg={token('color.text.neutral')}    tokenPath="color.background.secondary" />
            <Swatch label="danger"    bg={token('color.background.danger')}         fg={token('color.text.on.danger')}  tokenPath="color.background.danger" />
            <Swatch label="success"   bg={token('color.background.success')}        fg={token('color.text.on.primary')} tokenPath="color.background.success" />
            <Swatch label="warning"   bg={token('color.background.warning')}        fg={token('color.text.neutral')}    tokenPath="color.background.warning" />
            <Swatch label="surface"   bg={token('color.background.surface')}        fg={token('color.text.neutral')}    tokenPath="color.background.surface" />
            <Swatch label="raised"    bg={token('color.background.surface.raised')} fg={token('color.text.neutral')}    tokenPath="color.background.surface.raised" />
          </div>
        </Section>

        {/* Color — Text */}
        <Section title="Color · Text">
          {[
            { label: 'neutral',   path: 'color.text.neutral' as TokenPath },
            { label: 'subtle',    path: 'color.text.neutral.subtle' as TokenPath },
            { label: 'disabled',  path: 'color.text.neutral.disabled' as TokenPath },
            { label: 'danger',    path: 'color.text.danger.base' as TokenPath },
            { label: 'success',   path: 'color.text.success.base' as TokenPath },
            { label: 'warning',   path: 'color.text.warning.base' as TokenPath },
          ].map(({ label, path }) => (
            <TokenRow key={label} code={`token('${path}')`}>
              <span style={{ color: token(path), fontSize: token('typography.fontSize.base') }}>
                The quick brown fox — {label}
              </span>
            </TokenRow>
          ))}
        </Section>

        {/* Color — Border / Stroke */}
        <Section title="Color · Border / Stroke">
          {[
            { label: 'neutral',        path: 'color.stroke.neutral' as TokenPath },
            { label: 'neutral.strong', path: 'color.stroke.neutral.strong' as TokenPath },
            { label: 'primary',        path: 'color.stroke.primary' as TokenPath },
            { label: 'danger',         path: 'color.stroke.danger' as TokenPath },
          ].map(({ label, path }) => (
            <TokenRow key={label} code={`token('${path}')`}>
              <div style={{
                display: 'inline-block',
                padding: `${token('spacing.xs')} ${token('spacing.md')}`,
                border: `1.5px solid ${token(path)}`,
                borderRadius: token('radius.interactive'),
                fontSize: token('typography.fontSize.sm'),
                fontWeight: token('typography.fontWeight.medium'),
                color: token('color.text.neutral'),
              }}>
                {label}
              </div>
            </TokenRow>
          ))}
        </Section>

        {/* Spacing */}
        <Section title="Spacing">
          {spacings.map(({ key, path }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: token('spacing.md') }}>
              <div style={{
                width: token(path), height: token(path),
                background: token('color.background.primary'),
                borderRadius: token('radius.sm'),
                flexShrink: 0,
              }} />
              <code>{`token('${path}')`}</code>
              <span style={{ color: token('color.text.neutral.subtle'), fontSize: token('typography.fontSize.xs') }}>
                → <code>{token(path)}</code>
              </span>
            </div>
          ))}
        </Section>

        {/* Typography — Font Family */}
        <Section title="Typography · Font Family">
          <TokenRow code="token('typography.fontFamily.sans')">
            <span style={{ fontFamily: token('typography.fontFamily.sans') }}>Sans: The quick brown fox jumps over the lazy dog</span>
          </TokenRow>
          <TokenRow code="token('typography.fontFamily.mono')">
            <span style={{ fontFamily: token('typography.fontFamily.mono') }}>Mono: const t = token('color.background.primary')</span>
          </TokenRow>
        </Section>

        {/* Typography — Font Size */}
        <Section title="Typography · Font Size">
          {fontSizes.map(({ key, path }) => (
            <TokenRow key={key} code={`token('${path}')`}>
              <span style={{ fontSize: token(path), color: token('color.text.neutral') }}>
                Aa — {key}
              </span>
            </TokenRow>
          ))}
        </Section>

        {/* Typography — Font Weight */}
        <Section title="Typography · Font Weight">
          {fontWeights.map(({ key, path }) => (
            <TokenRow key={key} code={`token('${path}')`}>
              <span style={{ fontWeight: token(path), fontSize: token('typography.fontSize.base'), color: token('color.text.neutral') }}>
                The quick brown fox — {key}
              </span>
            </TokenRow>
          ))}
        </Section>

        {/* Radius */}
        <Section title="Radius">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: token('spacing.sm') }}>
            {radii.map(({ key, path }) => (
              <div key={key} style={{
                aspectRatio: '1',
                background: token('color.background.secondary'),
                border: `1.5px solid ${token('color.stroke.primary')}`,
                borderRadius: token(path),
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                padding: token('spacing.sm'), textAlign: 'center',
              }}>
                <span style={{ fontSize: 11, fontWeight: 600 }}>{key}</span>
                <code style={{ fontSize: 9, background: 'transparent', padding: 0 }}>{token(path)}</code>
              </div>
            ))}
          </div>
        </Section>

        {/* Shadow */}
        <Section title="Shadow">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: token('spacing.md') }}>
            {shadows.map(({ key, path }) => (
              <div key={key} style={{
                background: token('color.background.surface.raised'),
                borderRadius: token('radius.md'),
                padding: token('spacing.md'),
                boxShadow: token(path),
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 4, minHeight: 72,
              }}>
                <span style={{ fontSize: 11, fontWeight: 600 }}>{key}</span>
                <code style={{ fontSize: 9, background: 'transparent', padding: 0 }}>shadow.{key}</code>
              </div>
            ))}
          </div>
        </Section>

        {/* Motion */}
        <Section title="Motion · Duration — hover the bar">
          {motions.map(({ key, path }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: token('spacing.md'), padding: `${token('spacing.sm')} 0` }}>
              <div
                style={{
                  width: 80, height: 24,
                  background: token('color.background.primary'),
                  borderRadius: token('radius.sm'),
                  transformOrigin: 'left',
                  transition: `transform ${token(path)} ${token('motion.easing.ease')}`,
                  cursor: 'pointer', flexShrink: 0,
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scaleX(1.6)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scaleX(1)')}
              />
              <div>
                <code>{`token('${path}')`}</code>
                <span style={{ fontSize: token('typography.fontSize.xs'), color: token('color.text.neutral.subtle'), marginLeft: 6 }}>
                  — {key}
                </span>
              </div>
            </div>
          ))}
        </Section>

        {/* Utility Classes */}
        <Section title="Utility Classes (HTML className)">
          <p style={{ fontSize: token('typography.fontSize.sm'), color: token('color.text.neutral.subtle') }}>
            Classes from <code>utilities.css</code> — same tokens, zero JS, fully tenant-aware.
          </p>

          {/* Spacing */}
          <p style={{ fontSize: token('typography.fontSize.xs'), fontWeight: token('typography.fontWeight.semibold'), marginBottom: 4 }}>
            Spacing — <code>mt-lg</code>, <code>px-sm</code>, <code>gap-md</code>
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span className="bg-secondary text-neutral rounded-sm" style={{ padding: '4px 10px', fontSize: 12 }}>mt-lg</span>
            <span className="bg-secondary text-neutral rounded-sm" style={{ padding: '4px 10px', fontSize: 12 }}>px-sm</span>
            <span className="bg-secondary text-neutral rounded-sm" style={{ padding: '4px 10px', fontSize: 12 }}>px-md</span>
            <span className="bg-secondary text-neutral rounded-sm" style={{ padding: '4px 10px', fontSize: 12 }}>px-lg</span>
          </div>

          {/* Background */}
          <p style={{ fontSize: token('typography.fontSize.xs'), fontWeight: token('typography.fontWeight.semibold'), marginTop: 12, marginBottom: 4 }}>
            Background — <code>bg-primary</code>, <code>bg-danger-subtle</code>
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span className="bg-primary text-on-primary rounded-interactive" style={{ padding: '4px 12px', fontSize: 12 }}>bg-primary</span>
            <span className="bg-danger text-on-danger rounded-interactive" style={{ padding: '4px 12px', fontSize: 12 }}>bg-danger</span>
            <span className="bg-success text-on-primary rounded-interactive" style={{ padding: '4px 12px', fontSize: 12 }}>bg-success</span>
            <span className="bg-warning text-neutral rounded-interactive" style={{ padding: '4px 12px', fontSize: 12 }}>bg-warning</span>
            <span className="bg-danger-subtle text-neutral rounded-interactive" style={{ padding: '4px 12px', fontSize: 12, border: '1px solid' }} >bg-danger-subtle</span>
            <span className="bg-surface text-neutral rounded-interactive" style={{ padding: '4px 12px', fontSize: 12, border: '1px solid rgba(0,0,0,0.1)' }}>bg-surface</span>
          </div>

          {/* Typography */}
          <p style={{ fontSize: token('typography.fontSize.xs'), fontWeight: token('typography.fontWeight.semibold'), marginTop: 12, marginBottom: 4 }}>
            Typography — <code>text-xs</code>, <code>font-bold</code>
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span className="text-xs text-neutral-subtle">text-xs · The quick brown fox</span>
            <span className="text-sm text-neutral">text-sm · The quick brown fox</span>
            <span className="text-base text-neutral font-normal">text-base font-normal</span>
            <span className="text-lg text-neutral font-semibold">text-lg font-semibold</span>
            <span className="text-xl text-neutral font-bold">text-xl font-bold</span>
          </div>

          {/* Border */}
          <p style={{ fontSize: token('typography.fontSize.xs'), fontWeight: token('typography.fontWeight.semibold'), marginTop: 12, marginBottom: 4 }}>
            Border — <code>border-neutral</code>, <code>border-primary</code>
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span className="border-neutral rounded-interactive" style={{ padding: '4px 12px', fontSize: 12, border: '1.5px solid' }}>border-neutral</span>
            <span className="border-primary rounded-interactive" style={{ padding: '4px 12px', fontSize: 12, border: '1.5px solid' }}>border-primary</span>
            <span className="border-danger rounded-interactive" style={{ padding: '4px 12px', fontSize: 12, border: '1.5px solid' }}>border-danger</span>
          </div>

          {/* Radius */}
          <p style={{ fontSize: token('typography.fontSize.xs'), fontWeight: token('typography.fontWeight.semibold'), marginTop: 12, marginBottom: 4 }}>
            Radius — <code>rounded-sm</code>, <code>rounded-interactive</code>, <code>rounded-full</code>
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <span className="bg-primary text-on-primary rounded-none" style={{ padding: '4px 12px', fontSize: 12 }}>rounded-none</span>
            <span className="bg-primary text-on-primary rounded-sm" style={{ padding: '4px 12px', fontSize: 12 }}>rounded-sm</span>
            <span className="bg-primary text-on-primary rounded-md" style={{ padding: '4px 12px', fontSize: 12 }}>rounded-md</span>
            <span className="bg-primary text-on-primary rounded-interactive" style={{ padding: '4px 12px', fontSize: 12 }}>rounded-interactive</span>
            <span className="bg-primary text-on-primary rounded-card" style={{ padding: '4px 12px', fontSize: 12 }}>rounded-card</span>
            <span className="bg-primary text-on-primary rounded-full" style={{ padding: '4px 12px', fontSize: 12 }}>rounded-full</span>
          </div>
        </Section>

        <footer style={{ textAlign: 'center', padding: token('spacing.md'), color: token('color.text.neutral.subtle') }}>
          <code>token('path') → var(--btech-*) · tenant-aware via CSS cascade · switch tenant above</code>
        </footer>
      </div>
    </div>
  );
}
