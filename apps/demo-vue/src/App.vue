<script setup lang="ts">
import '@ramaMS06/tokens-web/styles.css';
import { token, activateTenant, type TokenPath } from '@ramaMS06/tokens-web';
import { ref, onMounted } from 'vue';

// ── Tenant switching ──────────────────────────────────────────────────────────
const activeTenant = ref('default');
const tenants = [
  { id: 'default', label: 'Default' },
  { id: 'tenant-a', label: 'Tenant A' },
  { id: 'tenant-bjb', label: 'Tenant BJB' },
];

function switchTenant(id: string) {
  activeTenant.value = id;
  activateTenant({ tenant: id });
}

onMounted(() => activateTenant({ tenant: 'default' }));

// ── token() style objects — all categories ────────────────────────────────────
// Color — background swatches
const colorSwatches = [
  { label: 'primary', bg: token('color.background.primary'), fg: token('color.text.on.primary'), path: 'color.background.primary' },
  { label: 'secondary', bg: token('color.background.secondary'), fg: token('color.text.neutral'), path: 'color.background.secondary' },
  { label: 'danger', bg: token('color.background.danger'), fg: token('color.text.on.danger'), path: 'color.background.danger' },
  { label: 'success', bg: token('color.background.success'), fg: token('color.text.on.primary'), path: 'color.background.success' },
  { label: 'warning', bg: token('color.background.warning'), fg: token('color.text.neutral'), path: 'color.background.warning' },
  { label: 'surface', bg: token('color.background.surface'), fg: token('color.text.neutral'), path: 'color.background.surface' },
  { label: 'surface.raised', bg: token('color.background.surface.raised'), fg: token('color.text.neutral'), path: 'color.background.surface.raised' },
];

// Color — text
const textSamples = [
  { label: 'neutral', color: token('color.text.neutral'), path: 'color.text.neutral' },
  { label: 'neutral.subtle', color: token('color.text.neutral.subtle'), path: 'color.text.neutral.subtle' },
  { label: 'neutral.disabled', color: token('color.text.neutral.disabled'), path: 'color.text.neutral.disabled' },
  { label: 'danger.base', color: token('color.text.danger.base'), path: 'color.text.danger.base' },
  { label: 'success.base', color: token('color.text.success.base'), path: 'color.text.success.base' },
  { label: 'warning.base', color: token('color.text.warning.base'), path: 'color.text.warning.base' },
];

// Color — border/stroke
const strokeSamples = [
  { label: 'stroke.neutral', path: 'color.stroke.neutral' as TokenPath },
  { label: 'stroke.neutral.strong', path: 'color.stroke.neutral.strong' as TokenPath },
  { label: 'stroke.primary', path: 'color.stroke.primary' as TokenPath },
  { label: 'stroke.danger', path: 'color.stroke.danger' as TokenPath },
];

// Spacing
const spacings: Array<{ key: string; path: TokenPath }> = [
  { key: 'xs', path: 'spacing.xs' },
  { key: 'sm', path: 'spacing.sm' },
  { key: 'md', path: 'spacing.md' },
  { key: 'lg', path: 'spacing.lg' },
  { key: 'xl', path: 'spacing.xl' },
  { key: 'xl2', path: 'spacing.xl2' },
  { key: 'xl3', path: 'spacing.xl3' },
];

// Font sizes
const fontSizes: Array<{ key: string; path: TokenPath }> = [
  { key: 'xs', path: 'typography.fontSize.xs' },
  { key: 'sm', path: 'typography.fontSize.sm' },
  { key: 'base', path: 'typography.fontSize.base' },
  { key: 'lg', path: 'typography.fontSize.lg' },
  { key: 'xl', path: 'typography.fontSize.xl' },
  { key: '2xl', path: 'typography.fontSize.2xl' },
  { key: '3xl', path: 'typography.fontSize.3xl' },
];

// Font weights
const fontWeights: Array<{ key: string; path: TokenPath }> = [
  { key: 'regular', path: 'typography.fontWeight.regular' },
  { key: 'medium', path: 'typography.fontWeight.medium' },
  { key: 'semibold', path: 'typography.fontWeight.semibold' },
  { key: 'bold', path: 'typography.fontWeight.bold' },
];

// Radius
const radii: Array<{ key: string; path: TokenPath }> = [
  { key: 'none', path: 'radius.none' },
  { key: 'sm', path: 'radius.sm' },
  { key: 'md', path: 'radius.md' },
  { key: 'lg', path: 'radius.lg' },
  { key: 'xl', path: 'radius.xl' },
  { key: 'full', path: 'radius.full' },
  { key: 'interactive', path: 'radius.interactive' },
  { key: 'card', path: 'radius.card' },
];

// Shadows
const shadows: Array<{ key: string; path: TokenPath }> = [
  { key: 'sm', path: 'shadow.sm' },
  { key: 'md', path: 'shadow.md' },
  { key: 'lg', path: 'shadow.lg' },
  { key: 'xl', path: 'shadow.xl' },
];

// Motion
const motions: Array<{ key: string; path: TokenPath }> = [
  { key: 'fast (100ms)', path: 'motion.duration.fast' },
  { key: 'normal (200ms)', path: 'motion.duration.normal' },
  { key: 'slow (400ms)', path: 'motion.duration.slow' },
];

// Hover expand for motion demo
function expand(e: MouseEvent) { (e.currentTarget as HTMLElement).style.transform = 'scaleX(1.6)'; }
function collapse(e: MouseEvent) { (e.currentTarget as HTMLElement).style.transform = 'scaleX(1)'; }
</script>

<template>
  <div class="page">

    <!-- ── Header ── -->
    <header class="header">
      <h1>token() · Full Token Showcase · Vue</h1>
      <p class="text-muted">Every style below is applied via <code>token('path')</code> — type-safe, zero magic strings
      </p>
      <div class="switcher">
        <span class="label-muted">Tenant:</span>
        <button v-for="t in tenants" :key="t.id" class="switcher-btn" :class="{ active: activeTenant === t.id }"
          :style="activeTenant === t.id
            ? { background: token('color.background.primary'), color: token('color.text.on.primary'), borderColor: token('color.stroke.primary') }
            : { background: token('color.background.surface.raised'), color: token('color.text.neutral'), borderColor: token('color.stroke.neutral') }" @click="switchTenant(t.id)">{{ t.label }}</button>
      </div>
    </header>

    <!-- ── Color — Background ── -->
    <section class="section">
      <h2 class="section-title">Color · Background</h2>
      <div class="grid-auto">
        <div v-for="s in colorSwatches" :key="s.label" class="swatch" :style="{ background: s.bg, color: s.fg }">
          <span class="swatch-name">{{ s.label }}</span>
          <code class="swatch-token">{{ s.path }}</code>
        </div>
      </div>
    </section>

    <!-- ── Color — Text ── -->
    <section class="section">
      <h2 class="section-title">Color · Text</h2>
      <div v-for="s in textSamples" :key="s.label" class="token-row">
        <span :style="{ color: s.color, fontSize: token('typography.fontSize.base') }">
          The quick brown fox — {{ s.label }}
        </span>
        <code>token('{{ s.path }}')</code>
      </div>
    </section>

    <!-- ── Color — Border / Stroke ── -->
    <section class="section">
      <h2 class="section-title">Color · Border / Stroke</h2>
      <div v-for="s in strokeSamples" :key="s.label" class="token-row">
        <div :style="{
          display: 'inline-block',
          padding: `${token('spacing.xs')} ${token('spacing.md')}`,
          border: `1.5px solid ${token(s.path)}`,
          borderRadius: token('radius.interactive'),
          fontSize: token('typography.fontSize.sm'),
          fontWeight: token('typography.fontWeight.medium'),
        }">{{ s.label }}</div>
        <code>token('{{ s.path }}')</code>
      </div>
    </section>

    <!-- ── Spacing ── -->
    <section class="section">
      <h2 class="section-title">Spacing</h2>
      <div v-for="s in spacings" :key="s.key" class="spacing-row">
        <div :style="{
          width: token(s.path),
          height: token(s.path),
          background: token('color.background.primary'),
          borderRadius: token('radius.sm'),
          flexShrink: '0',
        }" />
        <code>token('{{ s.path }}')</code>
        <span class="label-muted">→ <code>{{ token(s.path) }}</code></span>
      </div>
    </section>

    <!-- ── Typography — Font Family ── -->
    <section class="section">
      <h2 class="section-title">Typography · Font Family</h2>
      <div class="token-row">
        <span :style="{ fontFamily: token('typography.fontFamily.sans') }">
          Sans: The quick brown fox jumps over the lazy dog
        </span>
        <code>token('typography.fontFamily.sans')</code>
      </div>
      <div class="token-row">
        <span :style="{ fontFamily: token('typography.fontFamily.mono') }">
          Mono: const t = token('color.background.primary')
        </span>
        <code>token('typography.fontFamily.mono')</code>
      </div>
    </section>

    <!-- ── Typography — Font Size ── -->
    <section class="section">
      <h2 class="section-title">Typography · Font Size</h2>
      <div v-for="s in fontSizes" :key="s.key" class="token-row">
        <span :style="{ fontSize: token(s.path) }">Aa — {{ s.key }}</span>
        <code>token('{{ s.path }}')</code>
      </div>
    </section>

    <!-- ── Typography — Font Weight ── -->
    <section class="section">
      <h2 class="section-title">Typography · Font Weight</h2>
      <div v-for="w in fontWeights" :key="w.key" class="token-row">
        <span :style="{ fontWeight: token(w.path), fontSize: token('typography.fontSize.base') }">
          The quick brown fox — {{ w.key }}
        </span>
        <code>token('{{ w.path }}')</code>
      </div>
    </section>

    <!-- ── Radius ── -->
    <section class="section">
      <h2 class="section-title">Radius</h2>
      <div class="grid-auto">
        <div v-for="r in radii" :key="r.key" class="radius-box" :style="{
          borderRadius: token(r.path),
          background: token('color.background.secondary'),
          border: `1.5px solid ${token('color.stroke.primary')}`,
        }">
          <span class="swatch-name">{{ r.key }}</span>
          <code class="swatch-token">{{ token(r.path) }}</code>
        </div>
      </div>
    </section>

    <!-- ── Shadow ── -->
    <section class="section">
      <h2 class="section-title">Shadow</h2>
      <div class="grid-auto">
        <div v-for="s in shadows" :key="s.key" class="shadow-box" :style="{ boxShadow: token(s.path) }">
          <span class="swatch-name">{{ s.key }}</span>
          <code class="swatch-token">shadow.{{ s.key }}</code>
        </div>
      </div>
    </section>

    <!-- ── Motion ── -->
    <section class="section">
      <h2 class="section-title">Motion · Duration — hover the bar</h2>
      <div v-for="m in motions" :key="m.key" class="motion-row">
        <div class="motion-bar" :style="{
          background: token('color.background.primary'),
          transition: `transform ${token(m.path)} ${token('motion.easing.ease')}`,
        }" @mouseenter="expand" @mouseleave="collapse" />
        <div>
          <code>token('{{ m.path }}')</code>
          <span class="label-muted"> — {{ m.key }}</span>
        </div>
      </div>
    </section>

    <footer class="footer">
      <code>token('path') → var(--btech-*) · tenant-aware via CSS cascade · switch tenant above</code>
    </footer>
  </div>
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--btech-font-family-sans);
  background: var(--btech-background-surface);
  color: var(--btech-text-neutral);
  min-height: 100vh;
}

code {
  font-family: var(--btech-font-family-mono);
  font-size: var(--btech-font-size-xs);
  background: var(--btech-background-surface-subtle);
  padding: 1px 5px;
  border-radius: 4px;
}
</style>

<style scoped>
.page {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--btech-space-xl);
  display: flex;
  flex-direction: column;
  gap: var(--btech-space-xl);
}

/* Header */
.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--btech-space-md);
  text-align: center;
}

.header h1 {
  font-size: var(--btech-font-size-xl);
  font-weight: var(--btech-font-weight-bold);
}

.header p {
  color: var(--btech-text-neutral-subtle);
  font-size: var(--btech-font-size-sm);
}

/* Switcher */
.switcher {
  display: flex;
  align-items: center;
  gap: var(--btech-space-sm);
}

.switcher-btn {
  padding: var(--btech-space-xs) var(--btech-space-md);
  border-radius: var(--btech-radius-interactive);
  border: 1.5px solid;
  cursor: pointer;
  font-size: var(--btech-font-size-sm);
  font-weight: var(--btech-font-weight-medium);
  transition: all var(--btech-duration-fast) var(--btech-easing-ease);
}

/* Section */
.section {
  background: var(--btech-background-surface-raised);
  border: 1px solid var(--btech-border-neutral);
  border-radius: var(--btech-radius-card);
  padding: var(--btech-space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--btech-space-md);
  box-shadow: var(--btech-shadow-sm);
}

.section-title {
  font-size: var(--btech-font-size-xs);
  font-weight: var(--btech-font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--btech-text-neutral-subtle);
  border-bottom: 1px solid var(--btech-border-neutral);
  padding-bottom: var(--btech-space-sm);
}

/* Color grid */
.grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: var(--btech-space-sm);
}

.swatch {
  border-radius: var(--btech-radius-md);
  padding: var(--btech-space-sm);
  min-height: 72px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 2px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.swatch-name {
  font-size: 11px;
  font-weight: 600;
  opacity: .9;
}

.swatch-token {
  font-size: 9px;
  opacity: .75;
  background: transparent !important;
  padding: 0 !important;
}

/* Token row */
.token-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--btech-space-md);
  padding: var(--btech-space-xs) 0;
  border-bottom: 1px solid var(--btech-border-neutral);
}

.token-row:last-child {
  border-bottom: none;
}

/* Spacing */
.spacing-row {
  display: flex;
  align-items: center;
  gap: var(--btech-space-md);
}

.text-muted {
  color: var(--btech-color-blue-200);
}

.label-muted {
  font-size: var(--btech-font-size-xs);
  color: var(--btech-text-neutral-subtle);
}

/* Radius */
.radius-box {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: var(--btech-space-sm);
  text-align: center;
}

/* Shadow */
.shadow-box {
  background: var(--btech-background-surface-raised);
  border-radius: var(--btech-radius-md);
  padding: var(--btech-space-md);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 4px;
  min-height: 72px;
}

/* Motion */
.motion-row {
  display: flex;
  align-items: center;
  gap: var(--btech-space-md);
  padding: var(--btech-space-sm) 0;
}

.motion-bar {
  width: 80px;
  height: 24px;
  border-radius: var(--btech-radius-sm);
  transform-origin: left;
  cursor: pointer;
  flex-shrink: 0;
}

/* Footer */
.footer {
  text-align: center;
  padding: var(--btech-space-md);
  color: var(--btech-text-neutral-subtle);
}
</style>
