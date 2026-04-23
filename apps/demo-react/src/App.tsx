import '@btech/tokens/styles.css';
import { setMode, token, BTechSpacing, BTechStroke, BTechRadius } from '@btech/tokens';
import { useState, useEffect, CSSProperties } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
type Tab = 'all' | 'color' | 'typography' | 'spacing' | 'stroke' | 'radius' | 'shadow' | 'examples';
type TokenKind = 'color' | 'text' | 'spacing' | 'stroke' | 'radius' | 'shadow';

interface TokenEntry {
  name: string;
  usage: string;
  value: string;
  category: string;
  tab: Tab;
  kind: TokenKind;
  cssVar?: string;
  spacing?: number;
  stroke?: number;
  radius?: number;
  shadow?: string;
}

// ── Token data ─────────────────────────────────────────────────────────────────
const TOKENS: TokenEntry[] = [
  // Background
  { name: 'primary',   usage: "token('color.bg.primary')",   value: token('color.bg.primary'),   category: 'Background', tab: 'color', kind: 'color', cssVar: '--bg-primary' },
  { name: 'secondary', usage: "token('color.bg.secondary')", value: token('color.bg.secondary'), category: 'Background', tab: 'color', kind: 'color', cssVar: '--bg-secondary' },
  { name: 'tertiary',  usage: "token('color.bg.tertiary')",  value: token('color.bg.tertiary'),  category: 'Background', tab: 'color', kind: 'color', cssVar: '--bg-tertiary' },
  { name: 'inverse',   usage: "token('color.bg.inverse')",   value: token('color.bg.inverse'),   category: 'Background', tab: 'color', kind: 'color', cssVar: '--bg-inverse' },
  { name: 'subtle',    usage: "token('color.bg.subtle')",    value: token('color.bg.subtle'),    category: 'Background', tab: 'color', kind: 'color', cssVar: '--bg-subtle' },
  { name: 'subtler',   usage: "token('color.bg.subtler')",   value: token('color.bg.subtler'),   category: 'Background', tab: 'color', kind: 'color', cssVar: '--bg-subtler' },
  { name: 'subtlest',  usage: "token('color.bg.subtlest')",  value: token('color.bg.subtlest'),  category: 'Background', tab: 'color', kind: 'color', cssVar: '--bg-subtlest' },
  // Text
  { name: 'primary',   usage: "token('color.text.primary')",   value: token('color.text.primary'),   category: 'Text', tab: 'color', kind: 'color', cssVar: '--text-primary' },
  { name: 'secondary', usage: "token('color.text.secondary')", value: token('color.text.secondary'), category: 'Text', tab: 'color', kind: 'color', cssVar: '--text-secondary' },
  { name: 'tertiary',  usage: "token('color.text.tertiary')",  value: token('color.text.tertiary'),  category: 'Text', tab: 'color', kind: 'color', cssVar: '--text-tertiary' },
  { name: 'inverse',   usage: "token('color.text.inverse')",   value: token('color.text.inverse'),   category: 'Text', tab: 'color', kind: 'color', cssVar: '--text-inverse' },
  { name: 'disabled',  usage: "token('color.text.disabled')",  value: token('color.text.disabled'),  category: 'Text', tab: 'color', kind: 'color', cssVar: '--text-disabled' },
  { name: 'link',      usage: "token('color.text.link')",      value: token('color.text.link'),      category: 'Text', tab: 'color', kind: 'color', cssVar: '--text-link' },
  { name: 'success',   usage: "token('color.text.success')",   value: token('color.text.success'),   category: 'Text', tab: 'color', kind: 'color', cssVar: '--text-success' },
  { name: 'error',     usage: "token('color.text.error')",     value: token('color.text.error'),     category: 'Text', tab: 'color', kind: 'color', cssVar: '--text-error' },
  { name: 'warning',   usage: "token('color.text.warning')",   value: token('color.text.warning'),   category: 'Text', tab: 'color', kind: 'color', cssVar: '--text-warning' },
  { name: 'info',      usage: "token('color.text.info')",      value: token('color.text.info'),      category: 'Text', tab: 'color', kind: 'color', cssVar: '--text-info' },
  // Icon
  { name: 'primary',   usage: "token('color.icon.primary')",   value: token('color.icon.primary'),   category: 'Icon', tab: 'color', kind: 'color', cssVar: '--icon-primary' },
  { name: 'secondary', usage: "token('color.icon.secondary')", value: token('color.icon.secondary'), category: 'Icon', tab: 'color', kind: 'color', cssVar: '--icon-secondary' },
  { name: 'link',      usage: "token('color.icon.link')",      value: token('color.icon.link'),      category: 'Icon', tab: 'color', kind: 'color', cssVar: '--icon-link' },
  { name: 'success',   usage: "token('color.icon.success')",   value: token('color.icon.success'),   category: 'Icon', tab: 'color', kind: 'color', cssVar: '--icon-success' },
  { name: 'error',     usage: "token('color.icon.error')",     value: token('color.icon.error'),     category: 'Icon', tab: 'color', kind: 'color', cssVar: '--icon-error' },
  { name: 'warning',   usage: "token('color.icon.warning')",   value: token('color.icon.warning'),   category: 'Icon', tab: 'color', kind: 'color', cssVar: '--icon-warning' },
  { name: 'info',      usage: "token('color.icon.info')",      value: token('color.icon.info'),      category: 'Icon', tab: 'color', kind: 'color', cssVar: '--icon-info' },
  // Border
  { name: 'primary',   usage: "token('color.border.primary')",   value: token('color.border.primary'),   category: 'Border', tab: 'color', kind: 'color', cssVar: '--border-primary' },
  { name: 'secondary', usage: "token('color.border.secondary')", value: token('color.border.secondary'), category: 'Border', tab: 'color', kind: 'color', cssVar: '--border-secondary' },
  { name: 'tertiary',  usage: "token('color.border.tertiary')",  value: token('color.border.tertiary'),  category: 'Border', tab: 'color', kind: 'color', cssVar: '--border-tertiary' },
  { name: 'inverse',   usage: "token('color.border.inverse')",   value: token('color.border.inverse'),   category: 'Border', tab: 'color', kind: 'color', cssVar: '--border-inverse' },
  { name: 'disabled',  usage: "token('color.border.disabled')",  value: token('color.border.disabled'),  category: 'Border', tab: 'color', kind: 'color', cssVar: '--border-disabled' },
  // Brand
  { name: 'primarySubtle',   usage: "token('color.brand.primary-subtle')",   value: token('color.brand.primary-subtle'),   category: 'Brand', tab: 'color', kind: 'color', cssVar: '--brand-primary-subtle' },
  { name: 'primary',         usage: "token('color.brand.primary')",           value: token('color.brand.primary'),           category: 'Brand', tab: 'color', kind: 'color', cssVar: '--brand-primary' },
  { name: 'primaryBold',     usage: "token('color.brand.primary-bold')",     value: token('color.brand.primary-bold'),     category: 'Brand', tab: 'color', kind: 'color', cssVar: '--brand-primary-bold' },
  { name: 'secondarySubtle', usage: "token('color.brand.secondary-subtle')", value: token('color.brand.secondary-subtle'), category: 'Brand', tab: 'color', kind: 'color', cssVar: '--brand-secondary-subtle' },
  { name: 'secondary',       usage: "token('color.brand.secondary')",         value: token('color.brand.secondary'),         category: 'Brand', tab: 'color', kind: 'color', cssVar: '--brand-secondary' },
  { name: 'secondaryBold',   usage: "token('color.brand.secondary-bold')",   value: token('color.brand.secondary-bold'),   category: 'Brand', tab: 'color', kind: 'color', cssVar: '--brand-secondary-bold' },
  // Extended
  { name: 'successSubtler', usage: "token('color.ext.success-subtler')", value: token('color.ext.success-subtler'), category: 'Extended', tab: 'color', kind: 'color', cssVar: '--ext-success-subtler' },
  { name: 'successSubtle',  usage: "token('color.ext.success-subtle')",  value: token('color.ext.success-subtle'),  category: 'Extended', tab: 'color', kind: 'color', cssVar: '--ext-success-subtle' },
  { name: 'success',        usage: "token('color.ext.success')",         value: token('color.ext.success'),         category: 'Extended', tab: 'color', kind: 'color', cssVar: '--ext-success' },
  { name: 'successBold',    usage: "token('color.ext.success-bold')",    value: token('color.ext.success-bold'),    category: 'Extended', tab: 'color', kind: 'color', cssVar: '--ext-success-bold' },
  { name: 'infoSubtler',    usage: "token('color.ext.info-subtler')",    value: token('color.ext.info-subtler'),    category: 'Extended', tab: 'color', kind: 'color', cssVar: '--ext-info-subtler' },
  { name: 'infoSubtle',     usage: "token('color.ext.info-subtle')",     value: token('color.ext.info-subtle'),     category: 'Extended', tab: 'color', kind: 'color', cssVar: '--ext-info-subtle' },
  { name: 'info',           usage: "token('color.ext.info')",            value: token('color.ext.info'),            category: 'Extended', tab: 'color', kind: 'color', cssVar: '--ext-info' },
  { name: 'infoBold',       usage: "token('color.ext.info-bold')",       value: token('color.ext.info-bold'),       category: 'Extended', tab: 'color', kind: 'color', cssVar: '--ext-info-bold' },
  { name: 'warningSubtler', usage: "token('color.ext.warning-subtler')", value: token('color.ext.warning-subtler'), category: 'Extended', tab: 'color', kind: 'color', cssVar: '--ext-warning-subtler' },
  { name: 'warningSubtle',  usage: "token('color.ext.warning-subtle')",  value: token('color.ext.warning-subtle'),  category: 'Extended', tab: 'color', kind: 'color', cssVar: '--ext-warning-subtle' },
  { name: 'warning',        usage: "token('color.ext.warning')",         value: token('color.ext.warning'),         category: 'Extended', tab: 'color', kind: 'color', cssVar: '--ext-warning' },
  { name: 'warningBold',    usage: "token('color.ext.warning-bold')",    value: token('color.ext.warning-bold'),    category: 'Extended', tab: 'color', kind: 'color', cssVar: '--ext-warning-bold' },
  { name: 'errorSubtler',   usage: "token('color.ext.error-subtler')",   value: token('color.ext.error-subtler'),   category: 'Extended', tab: 'color', kind: 'color', cssVar: '--ext-error-subtler' },
  { name: 'errorSubtle',    usage: "token('color.ext.error-subtle')",    value: token('color.ext.error-subtle'),    category: 'Extended', tab: 'color', kind: 'color', cssVar: '--ext-error-subtle' },
  { name: 'error',          usage: "token('color.ext.error')",           value: token('color.ext.error'),           category: 'Extended', tab: 'color', kind: 'color', cssVar: '--ext-error' },
  { name: 'errorBold',      usage: "token('color.ext.error-bold')",      value: token('color.ext.error-bold'),      category: 'Extended', tab: 'color', kind: 'color', cssVar: '--ext-error-bold' },
  // Typography
  { name: 'display',    usage: "token('typography.heading.display')", value: '40px / w700', category: 'Heading',    tab: 'typography', kind: 'text' },
  { name: 'h1',         usage: "token('typography.heading.h1')",      value: '32px / w700', category: 'Heading',    tab: 'typography', kind: 'text' },
  { name: 'h2',         usage: "token('typography.heading.h2')",      value: '28px / w700', category: 'Heading',    tab: 'typography', kind: 'text' },
  { name: 'h3',         usage: "token('typography.heading.h3')",      value: '24px / w600', category: 'Heading',    tab: 'typography', kind: 'text' },
  { name: 'h4',         usage: "token('typography.heading.h4')",      value: '20px / w600', category: 'Heading',    tab: 'typography', kind: 'text' },
  { name: 'h5',         usage: "token('typography.subheading.h5')",   value: '18px / w600', category: 'Subheading', tab: 'typography', kind: 'text' },
  { name: 'h6',         usage: "token('typography.subheading.h6')",   value: '16px / w600', category: 'Subheading', tab: 'typography', kind: 'text' },
  { name: 'h7',         usage: "token('typography.subheading.h7')",   value: '14px / w600', category: 'Subheading', tab: 'typography', kind: 'text' },
  { name: 'h8',         usage: "token('typography.subheading.h8')",   value: '12px / w600', category: 'Subheading', tab: 'typography', kind: 'text' },
  { name: 'large',      usage: "token('typography.body.large')",      value: '16px / w400', category: 'Body',       tab: 'typography', kind: 'text' },
  { name: 'regular',    usage: "token('typography.body.regular')",    value: '14px / w400', category: 'Body',       tab: 'typography', kind: 'text' },
  { name: 'small',      usage: "token('typography.body.small')",      value: '12px / w400', category: 'Body',       tab: 'typography', kind: 'text' },
  { name: 'xtrasmall',  usage: "token('typography.body.xtrasmall')",  value: '10px / w400', category: 'Body',       tab: 'typography', kind: 'text' },
  { name: 'micro',      usage: "token('typography.body.micro')",      value: '8px / w400',  category: 'Body',       tab: 'typography', kind: 'text' },
  { name: 'largeB',     usage: "token('typography.body.largeB')",     value: '16px / w700', category: 'Body',       tab: 'typography', kind: 'text' },
  { name: 'regularB',   usage: "token('typography.body.regularB')",   value: '14px / w700', category: 'Body',       tab: 'typography', kind: 'text' },
  { name: 'smallB',     usage: "token('typography.body.smallB')",     value: '12px / w700', category: 'Body',       tab: 'typography', kind: 'text' },
  { name: 'xtrasmallB', usage: "token('typography.body.xtrasmallB')", value: '10px / w700', category: 'Body',       tab: 'typography', kind: 'text' },
  { name: 'microB',     usage: "token('typography.body.microB')",     value: '8px / w700',  category: 'Body',       tab: 'typography', kind: 'text' },
  // Spacing
  { name: 's2xs', usage: "token('spacing.2xs')", value: `${BTechSpacing.s2xs}px`, category: 'Scale', tab: 'spacing', kind: 'spacing', spacing: BTechSpacing.s2xs },
  { name: 'xs',   usage: "token('spacing.xs')",  value: `${BTechSpacing.xs}px`,   category: 'Scale', tab: 'spacing', kind: 'spacing', spacing: BTechSpacing.xs   },
  { name: 'sm',   usage: "token('spacing.sm')",  value: `${BTechSpacing.sm}px`,   category: 'Scale', tab: 'spacing', kind: 'spacing', spacing: BTechSpacing.sm   },
  { name: 'md',   usage: "token('spacing.md')",  value: `${BTechSpacing.md}px`,   category: 'Scale', tab: 'spacing', kind: 'spacing', spacing: BTechSpacing.md   },
  { name: 'lg',   usage: "token('spacing.lg')",  value: `${BTechSpacing.lg}px`,   category: 'Scale', tab: 'spacing', kind: 'spacing', spacing: BTechSpacing.lg   },
  { name: 'xl',   usage: "token('spacing.xl')",  value: `${BTechSpacing.xl}px`,   category: 'Scale', tab: 'spacing', kind: 'spacing', spacing: BTechSpacing.xl   },
  { name: 's2xl', usage: "token('spacing.2xl')", value: `${BTechSpacing.s2xl}px`, category: 'Scale', tab: 'spacing', kind: 'spacing', spacing: BTechSpacing.s2xl },
  { name: 's3xl', usage: "token('spacing.3xl')", value: `${BTechSpacing.s3xl}px`, category: 'Scale', tab: 'spacing', kind: 'spacing', spacing: BTechSpacing.s3xl },
  // Stroke
  { name: 'xs', usage: "token('stroke.xs')", value: `${BTechStroke.xs}px`, category: 'Scale', tab: 'stroke', kind: 'stroke', stroke: BTechStroke.xs },
  { name: 'sm', usage: "token('stroke.sm')", value: `${BTechStroke.sm}px`, category: 'Scale', tab: 'stroke', kind: 'stroke', stroke: BTechStroke.sm },
  { name: 'md', usage: "token('stroke.md')", value: `${BTechStroke.md}px`, category: 'Scale', tab: 'stroke', kind: 'stroke', stroke: BTechStroke.md },
  { name: 'lg', usage: "token('stroke.lg')", value: `${BTechStroke.lg}px`, category: 'Scale', tab: 'stroke', kind: 'stroke', stroke: BTechStroke.lg },
  { name: 'xl', usage: "token('stroke.xl')", value: `${BTechStroke.xl}px`, category: 'Scale', tab: 'stroke', kind: 'stroke', stroke: BTechStroke.xl },
  // Radius
  { name: 's2xs', usage: "token('radius.2xs')", value: `${BTechRadius.s2xs}px`, category: 'Scale', tab: 'radius', kind: 'radius', radius: BTechRadius.s2xs },
  { name: 'xs',   usage: "token('radius.xs')",  value: `${BTechRadius.xs}px`,   category: 'Scale', tab: 'radius', kind: 'radius', radius: BTechRadius.xs   },
  { name: 'sm',   usage: "token('radius.sm')",  value: `${BTechRadius.sm}px`,   category: 'Scale', tab: 'radius', kind: 'radius', radius: BTechRadius.sm   },
  { name: 'md',   usage: "token('radius.md')",  value: `${BTechRadius.md}px`,   category: 'Scale', tab: 'radius', kind: 'radius', radius: BTechRadius.md   },
  { name: 'lg',   usage: "token('radius.lg')",  value: `${BTechRadius.lg}px`,   category: 'Scale', tab: 'radius', kind: 'radius', radius: BTechRadius.lg   },
  { name: 'xl',   usage: "token('radius.xl')",  value: `${BTechRadius.xl}px`,   category: 'Scale', tab: 'radius', kind: 'radius', radius: BTechRadius.xl   },
  { name: 's2xl', usage: "token('radius.2xl')", value: `${BTechRadius.s2xl}px`, category: 'Scale', tab: 'radius', kind: 'radius', radius: BTechRadius.s2xl },
  { name: 'rd',   usage: "token('radius.rd')",  value: `${BTechRadius.rd}px`,   category: 'Scale', tab: 'radius', kind: 'radius', radius: BTechRadius.rd   },
  // Shadow
  { name: 'button.pressed', usage: "token('shadow.button.pressed')", value: token('shadow.button.pressed'), category: 'Button',    tab: 'shadow', kind: 'shadow', shadow: token('shadow.button.pressed') },
  { name: 'table.left',     usage: "token('shadow.table.left')",     value: token('shadow.table.left'),     category: 'Table',     tab: 'shadow', kind: 'shadow', shadow: token('shadow.table.left')     },
  { name: 'table.right',    usage: "token('shadow.table.right')",    value: token('shadow.table.right'),    category: 'Table',     tab: 'shadow', kind: 'shadow', shadow: token('shadow.table.right')    },
  { name: 'elevation.xs',   usage: "token('shadow.elevation.xs')",   value: token('shadow.elevation.xs'),   category: 'Elevation', tab: 'shadow', kind: 'shadow', shadow: token('shadow.elevation.xs')   },
  { name: 'elevation.sm',   usage: "token('shadow.elevation.sm')",   value: token('shadow.elevation.sm'),   category: 'Elevation', tab: 'shadow', kind: 'shadow', shadow: token('shadow.elevation.sm')   },
  { name: 'elevation.md',   usage: "token('shadow.elevation.md')",   value: token('shadow.elevation.md'),   category: 'Elevation', tab: 'shadow', kind: 'shadow', shadow: token('shadow.elevation.md')   },
  { name: 'elevation.lg',   usage: "token('shadow.elevation.lg')",   value: token('shadow.elevation.lg'),   category: 'Elevation', tab: 'shadow', kind: 'shadow', shadow: token('shadow.elevation.lg')   },
  { name: 'elevation.xl',   usage: "token('shadow.elevation.xl')",   value: token('shadow.elevation.xl'),   category: 'Elevation', tab: 'shadow', kind: 'shadow', shadow: token('shadow.elevation.xl')   },
];

// ── Badge helper ───────────────────────────────────────────────────────────────
function badgeStyle(cat: string): CSSProperties {
  const map: Record<string, [string, string]> = {
    Background: [token('color.ext.info-subtler'),    token('color.text.info')],
    Text:       [token('color.ext.success-subtler'), token('color.text.success')],
    Icon:       [token('color.ext.success-subtler'), token('color.text.success')],
    Border:     [token('color.ext.warning-subtler'), token('color.text.warning')],
    Brand:      [token('color.ext.success-subtle'),  token('color.text.success')],
    Extended:   [token('color.ext.info-subtle'),     token('color.text.info')],
    Heading:    [token('color.ext.success-subtler'), token('color.text.success')],
    Subheading: [token('color.ext.info-subtler'),    token('color.text.info')],
    Body:       [token('color.ext.warning-subtler'), token('color.text.warning')],
    Scale:      [token('color.ext.warning-subtler'), token('color.text.warning')],
    Elevation:  [token('color.ext.error-subtler'),   token('color.text.error')],
    Button:     [token('color.ext.error-subtler'),   token('color.text.error')],
    Table:      [token('color.ext.error-subtler'),   token('color.text.error')],
    Stroke:     [token('color.ext.warning-subtler'), token('color.text.warning')],
    Shadow:     [token('color.ext.error-subtler'),   token('color.text.error')],
  };
  const [bg, color] = map[cat] ?? [token('color.bg.subtler'), token('color.text.secondary')];
  return {
    display: 'inline-block',
    padding: '2px 7px',
    borderRadius: 9999,
    fontSize: 10,
    fontWeight: 700,
    background: bg,
    color,
    whiteSpace: 'nowrap',
  };
}

// ── Typography style helper ────────────────────────────────────────────────────
function typoStyle(name: string): CSSProperties {
  const sizes: Record<string, string> = {
    display:'40px', h1:'32px', h2:'28px', h3:'24px', h4:'20px',
    h5:'18px', h6:'16px', h7:'14px', h8:'12px',
    large:'16px', regular:'14px', small:'12px', xtrasmall:'10px', micro:'8px',
    largeB:'16px', regularB:'14px', smallB:'12px', xtrasmallB:'10px', microB:'8px',
  };
  const isBold = name.endsWith('B') || ['display','h1','h2'].includes(name);
  const isSemi = ['h3','h4','h5','h6','h7','h8'].includes(name);
  return {
    fontSize: sizes[name] ?? '14px',
    fontWeight: isBold ? 700 : isSemi ? 600 : 400,
    fontFamily: token('typography.fontFamily.sans'),
    color: token('color.text.primary'),
    lineHeight: 1.3,
  };
}

// ── Examples Panel ────────────────────────────────────────────────────────────
function ExamplesPanel() {
  // Syntax-coloring helpers for code blocks
  const cm = (t: string) => <span style={{ color: '#94a3b8' }}>{t}</span>;   // comment
  const st = (t: string) => <span style={{ color: '#86efac' }}>{t}</span>;   // string / var
  const fn = (t: string) => <span style={{ color: '#7dd3fc' }}>{t}</span>;   // function / tag

  const codeBlock: CSSProperties = {
    fontFamily: 'var(--typography-font-family-mono)',
    fontSize: 12,
    lineHeight: 1.8,
    background: '#0f172a',
    color: '#cbd5e1',
    padding: '18px 20px',
    margin: 0,
    overflowX: 'auto',
    whiteSpace: 'pre',
    display: 'block',
  };
  const card: CSSProperties = {
    background: token('color.bg.primary'),
    border: `1px solid ${token('color.border.primary')}`,
    borderRadius: token('radius.md'),
    overflow: 'hidden',
  };
  const cardHead: CSSProperties = {
    padding: '10px 16px',
    borderBottom: `1px solid ${token('color.border.primary')}`,
    background: token('color.bg.subtle'),
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };
  const label = (text: string, bg: string, fg: string) => (
    <span style={{ fontSize: 11, fontWeight: 700, background: bg, color: fg, padding: '2px 8px', borderRadius: 9999 }}>
      {text}
    </span>
  );
  const desc = (text: string) => (
    <span style={{ fontSize: 12, color: token('color.text.secondary'), fontFamily: 'var(--typography-font-family-sans)' }}>
      {text}
    </span>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: token('spacing.md') }}>

      {/* ── Live preview ── */}
      <div style={card}>
        <div style={cardHead}>
          <span style={{ fontSize: 12, fontWeight: 600, color: token('color.text.secondary'), fontFamily: 'var(--typography-font-family-sans)' }}>
            Live preview — all properties use token() and react to dark mode
          </span>
        </div>
        <div style={{ padding: token('spacing.md'), display: 'flex', gap: token('spacing.md'), flexWrap: 'wrap' }}>

          {/* Demo card */}
          <div style={{
            flex: '1 1 260px',
            background: token('color.bg.primary'),
            border: `1px solid ${token('color.border.primary')}`,
            borderRadius: token('radius.md'),
            padding: token('spacing.md'),
            boxShadow: token('shadow.elevation.md'),
            fontFamily: token('typography.fontFamily.sans'),
          }}>
            <p style={{ margin: '0 0 8px', fontSize: 11, color: token('color.text.tertiary'), fontFamily: 'var(--font-family-mono)' }}>
              shadow.elevation.md · radius.md · spacing.md
            </p>
            <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: token('color.text.primary') }}>
              Styled with design tokens
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: token('color.text.secondary') }}>
              Tenant via CSS import · dark mode via setMode()
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{
                padding: '6px 14px', border: 'none', cursor: 'pointer',
                background: token('color.brand.primary'), color: 'white',
                borderRadius: token('radius.sm'), fontSize: 13, fontWeight: 600,
                fontFamily: token('typography.fontFamily.sans'),
              }}>Primary</button>
              <button style={{
                padding: '6px 14px', cursor: 'pointer', background: 'transparent',
                color: token('color.brand.primary'),
                border: `1.5px solid ${token('color.brand.primary')}`,
                borderRadius: token('radius.sm'), fontSize: 13, fontWeight: 600,
                fontFamily: token('typography.fontFamily.sans'),
              }}>Outline</button>
            </div>
          </div>

          {/* Status badge strip */}
          <div style={{
            flex: '0 1 180px',
            background: token('color.bg.subtle'),
            border: `1px solid ${token('color.border.primary')}`,
            borderRadius: token('radius.md'),
            padding: token('spacing.md'),
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <p style={{ margin: 0, fontSize: 11, color: token('color.text.tertiary'), fontFamily: 'var(--font-family-mono)' }}>
              color.ext.* status palette
            </p>
            {([
              ['Success', token('color.ext.success-subtler'), token('color.text.success')],
              ['Warning', token('color.ext.warning-subtler'), token('color.text.warning')],
              ['Error',   token('color.ext.error-subtler'),   token('color.text.error')],
              ['Info',    token('color.ext.info-subtler'),    token('color.text.info')],
            ] as [string, string, string][]).map(([lbl, bg, fg]) => (
              <span key={lbl} style={{
                display: 'inline-block', padding: '3px 10px', borderRadius: 9999,
                background: bg, color: fg, fontSize: 12, fontWeight: 700,
                fontFamily: token('typography.fontFamily.sans'),
              }}>{lbl}</span>
            ))}
          </div>

        </div>
      </div>

      {/* ── Three context cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: token('spacing.md') }}>

        {/* JS / TS */}
        <div style={card}>
          <div style={cardHead}>
            {label('JS / TS', token('color.ext.info-subtler'), token('color.text.info'))}
            {desc('token() — inline styles, JSX, CSS-in-JS')}
          </div>
          <pre style={codeBlock}><code>
{`import { `}{fn('token')}{`, `}{fn('cssVar')}{`, `}{fn('tokenCalc')}{` }\n`}
{`  from `}{st("'@btech/tokens'")}{`;\n\n`}
{cm('// token() returns a CSS var string\n')}
{`const style = {\n`}
{`  background:   `}{fn('token')}{`(`}{st("'color.bg.primary'")}{`),\n`}
{`  color:        `}{fn('token')}{`(`}{st("'color.text.primary'")}{`),\n`}
{`  padding:      `}{fn('token')}{`(`}{st("'spacing.md'")}{`),\n`}
{`  borderRadius: `}{fn('token')}{`(`}{st("'radius.sm'")}{`),\n`}
{`  boxShadow:    `}{fn('token')}{`(`}{st("'shadow.elevation.md'")}{`),\n`}
{`  fontFamily:   `}{fn('token')}{`(`}{st("'typography.fontFamily.sans'")}{`),\n`}
{`};\n\n`}
{cm('// Optional CSS fallback value\n')}
{fn('token')}{`(`}{st("'color.bg.primary'")}{`, `}{st("'#fff'")}{`)\n`}
{cm("//  → 'var(--bg-primary, #fff)'\n\n")}
{cm('// Raw var name — for setProperty() or calc()\n')}
{fn('cssVar')}{`(`}{st("'color.bg.primary'")}{`)\n`}
{cm("//  → '--bg-primary'\n")}
{fn('tokenCalc')}{`(`}{st("'spacing.md'")}{`, `}{st("'* 2'")}{`)\n`}
{cm("//  → 'calc(var(--space-md) * 2)'")}
          </code></pre>
        </div>

        {/* CSS */}
        <div style={card}>
          <div style={cardHead}>
            {label('CSS', token('color.ext.success-subtler'), token('color.text.success'))}
            {desc('var() — stylesheets & CSS modules')}
          </div>
          <pre style={codeBlock}><code>
{cm('/* No import needed — use var() directly */\n')}
{`.card {\n`}
{`  background:    `}{st('var(--bg-primary)')}{`;\n`}
{`  color:         `}{st('var(--text-primary)')}{`;\n`}
{`  padding:       `}{st('var(--space-md)')}{`;\n`}
{`  border-radius: `}{st('var(--radius-sm)')}{`;\n`}
{`  box-shadow:    `}{st('var(--shadow-elevation-md)')}{`;\n`}
{`  font-family:   `}{st('var(--typography-font-family-sans)')}{`;\n`}
{`}\n\n`}
{cm('/* Dark mode — driven by data-mode attribute on :root */\n')}
{`[data-mode=`}{st('"dark"')}{`] { `}{cm('/* dark palette — toggled via setMode() */')}{` }\n\n`}
{cm('/* Arithmetic on spacing tokens */\n')}
{`.gap {\n`}
{`  gap: `}{st('calc(var(--space-md) * 2)')}{`;\n`}
{`}`}
          </code></pre>
        </div>

        {/* HTML */}
        <div style={card}>
          <div style={cardHead}>
            {label('HTML', token('color.ext.warning-subtler'), token('color.text.warning'))}
            {desc('var() — inline style attributes')}
          </div>
          <pre style={codeBlock}><code>
{cm('<!-- 1. Import tenant package — sets all token vars -->\n')}
{`<`}{fn('link')}{` rel=`}{st('"stylesheet"')}{` href=`}{st('"@btech/tokens-bspace/styles.css"')}{`>\n\n`}
{cm('<!-- 2. Use var() directly in any element -->\n')}
{`<`}{fn('div')}{` style="\n`}
{`  background:    `}{st('var(--bg-primary)')}{`;\n`}
{`  color:         `}{st('var(--text-primary)')}{`;\n`}
{`  padding:       `}{st('var(--space-md)')}{`;\n`}
{`  border-radius: `}{st('var(--radius-sm)')}{`;\n`}
{`  font:          `}{st('var(--typography-heading-h3)')}{`;\n`}
{`">\n`}
{`  Content\n`}
{`</`}{fn('div')}{`>\n\n`}
{cm('<!-- 3. Optional: control dark/light mode at runtime -->\n')}
{`<`}{fn('script')}{` type=`}{st('"module"')}{`>\n`}
{`  import { `}{fn('setMode')}{`, `}{fn('followSystemMode')}{` }\n`}
{`    from `}{st("'@btech/tokens'")}{`;\n`}
{`\n`}
{`  `}{fn('setMode')}{`(`}{st("'dark'")}{`);\n`}
{`  // or auto-sync with OS:\n`}
{`  `}{fn('followSystemMode')}{`();\n`}
{`</`}{fn('script')}{`>`}
          </code></pre>
        </div>

      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────────────────────────────
const TABS: { id: Tab; label: string }[] = [
  { id: 'all',        label: 'All' },
  { id: 'color',      label: 'Color' },
  { id: 'typography', label: 'Typography' },
  { id: 'spacing',    label: 'Spacing' },
  { id: 'stroke',     label: 'Stroke' },
  { id: 'radius',     label: 'Radius' },
  { id: 'shadow',     label: 'Shadow' },
  { id: 'examples',   label: 'Usage' },
];

export default function App() {
  const [dark, setDark] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setMode(dark ? 'dark' : 'light');
  }, [dark]);

  const filtered = TOKENS.filter(t => {
    const tabOk = activeTab === 'all' || t.tab === activeTab;
    const q = search.toLowerCase().trim();
    const qOk = !q || t.name.toLowerCase().includes(q) || t.usage.toLowerCase().includes(q)
                   || t.value.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
    return tabOk && qOk;
  });

  return (
    <div style={{ background: token('color.bg.subtle'), minHeight: '100vh', fontFamily: token('typography.fontFamily.sans') }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: token('spacing.lg'), display: 'flex', flexDirection: 'column', gap: token('spacing.md') }}>

        {/* ── Topbar ── */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center',
          gap: token('spacing.sm'),
          background: token('color.bg.primary'),
          border: `1px solid ${token('color.border.primary')}`,
          borderRadius: token('radius.md'),
          padding: `${token('spacing.sm')} ${token('spacing.md')}`,
        }}>
          {/* Tabs */}
          <nav style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  padding: '5px 14px',
                  borderRadius: token('radius.sm'),
                  border: `1.5px solid ${activeTab === t.id ? token('color.ext.success-subtle') : 'transparent'}`,
                  background: activeTab === t.id ? token('color.ext.success-subtler') : 'transparent',
                  color: activeTab === t.id ? token('color.text.success') : token('color.text.secondary'),
                  fontSize: 'var(--typography-font-size-sm)',
                  fontWeight: activeTab === t.id ? 600 : 400,
                  fontFamily: token('typography.fontFamily.sans'),
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >{t.label}</button>
            ))}
          </nav>
          {/* Search — hidden on the Usage tab */}
          {activeTab !== 'examples' && (
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍  Search token…"
              style={{
                marginLeft: 'auto',
                flex: 1, minWidth: 180, maxWidth: 280,
                padding: '7px 12px',
                borderRadius: token('radius.sm'),
                border: `1.5px solid ${token('color.border.primary')}`,
                background: token('color.bg.subtle'),
                color: token('color.text.primary'),
                fontSize: 'var(--typography-font-size-sm)',
                fontFamily: token('typography.fontFamily.sans'),
                outline: 'none',
              }}
            />
          )}
        </div>

        {/* ── Content: examples panel OR token table ── */}
        {activeTab === 'examples' ? (
          <ExamplesPanel />
        ) : (
          <div style={{
            background: token('color.bg.primary'),
            border: `1px solid ${token('color.border.primary')}`,
            borderRadius: token('radius.md'),
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center',
              padding: '8px 16px',
              background: token('color.bg.subtler'),
              borderBottom: `1px solid ${token('color.border.primary')}`,
              fontSize: 'var(--typography-font-size-xs)',
              fontWeight: 600,
              color: token('color.text.secondary'),
              gap: 12,
            }}>
              <div style={{ width: 68, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>Usage</div>
              <div style={{ width: 160, flexShrink: 0 }}>Value</div>
            </div>

            {/* Rows */}
            {filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: token('color.text.tertiary'), fontSize: 'var(--typography-font-size-sm)' }}>
                No tokens found
              </div>
            ) : filtered.map((t, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', alignItems: 'center',
                  padding: '10px 16px', gap: 12,
                  background: i % 2 === 0 ? token('color.bg.primary') : token('color.bg.subtle'),
                  borderBottom: i < filtered.length - 1 ? `1px solid ${token('color.border.primary')}` : 'none',
                }}
              >
                {/* Slot 1 — Preview */}
                <div style={{ width: 68, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {t.kind === 'color' && (
                    <div style={{
                      width: 52, height: 38,
                      background: `var(${t.cssVar})`,
                      borderRadius: 6,
                      border: `0.5px solid ${token('color.border.primary')}`,
                    }} />
                  )}
                  {t.kind === 'text' && (
                    <span style={{ display: 'block', textAlign: 'center', width: 52, ...typoStyle(t.name) }}>Aa</span>
                  )}
                  {t.kind === 'spacing' && (
                    <div style={{ width: 52, height: 38, display: 'flex', alignItems: 'center', paddingLeft: 2 }}>
                      <div style={{
                        height: 8,
                        width: Math.min(t.spacing ?? 4, 52),
                        background: token('color.brand.primary'),
                        borderRadius: 2,
                      }} />
                    </div>
                  )}
                  {t.kind === 'radius' && (
                    <div style={{
                      width: 52, height: 38,
                      border: `2px solid ${token('color.brand.primary')}`,
                      borderRadius: Math.min(t.radius ?? 0, 28),
                    }} />
                  )}
                  {t.kind === 'stroke' && (
                    <div style={{ width: 52, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{
                        width: 44,
                        height: t.stroke ?? 1,
                        background: token('color.brand.primary'),
                        borderRadius: 1,
                      }} />
                    </div>
                  )}
                  {t.kind === 'shadow' && (
                    <div style={{
                      width: 44, height: 34,
                      background: token('color.bg.primary'),
                      borderRadius: 6,
                      boxShadow: t.shadow,
                    }} />
                  )}
                </div>

                {/* Slot 2 — Usage + badge */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <code style={{
                    fontFamily: 'var(--typography-font-family-mono)',
                    fontSize: 'var(--typography-font-size-xs)',
                    color: token('color.text.primary'),
                    background: 'none',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{t.usage}</code>
                  <span style={badgeStyle(t.category)}>{t.category}</span>
                </div>

                {/* Slot 3 — Value */}
                <div style={{ width: 160, flexShrink: 0 }}>
                  <code style={{
                    fontFamily: 'var(--typography-font-family-mono)',
                    fontSize: 'var(--typography-font-size-xs)',
                    color: token('color.text.secondary'),
                    background: 'none',
                  }}>{t.value}</code>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── FAB ── */}
        <button
          onClick={() => setDark(d => !d)}
          title={dark ? 'Switch to light' : 'Switch to dark'}
          style={{
            position: 'fixed', bottom: 28, right: 28,
            width: 52, height: 52,
            borderRadius: 9999,
            border: 'none',
            background: token('color.brand.primary'),
            color: 'white',
            fontSize: 20,
            cursor: 'pointer',
            boxShadow: token('shadow.elevation.lg'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 100,
          }}
        >
          {dark ? '☀️' : '🌙'}
        </button>

      </div>
    </div>
  );
}
