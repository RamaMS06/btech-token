<script setup lang="ts">
// ── 1. Import CSS variables (all tokens + tenant overrides) ──────────────────
import '@ramaMS06/tokens-web/styles.css';

// ── 2. Import typed TS token values (for JS logic, not styling) ──────────────
import { BTechColor, BTechRadius, BTechSpacing } from '@ramaMS06/tokens-web';

import { ref } from 'vue';
import TenantDemo from './TenantDemo.vue';

// ── 3. Runtime tenant switching ───────────────────────────────────────────────
// Trigger: set data-tenant on any ancestor element.
// CSS cascade picks it up automatically — no JS framework needed.
const activeTenant = ref<string>('default');

function switchTenant(tenant: string) {
  activeTenant.value = tenant;
  // Optional: set on <html> for app-wide switching
  document.documentElement.setAttribute('data-tenant', tenant);
}

const tenants = [
  { id: 'default',    label: 'Default',    color: BTechColor.background.primary },
  { id: 'tenant-a',   label: 'Tenant A',   color: '#3b82f6' },
  { id: 'tenant-bjb', label: 'Tenant BJB', color: '#2563eb' },
];
</script>

<template>
  <div class="ds-page">
    <header class="ds-header">
      <h1>@ramaMS06/tokens-web · Multi-Tenant Demo</h1>
      <p>One <code>&lt;Button&gt;</code> component · Three brand identities</p>

      <!-- ── Runtime tenant switcher ─────────────────────────────────────── -->
      <div class="ds-switcher">
        <span class="ds-switcher__label">Switch tenant:</span>
        <button
          v-for="t in tenants"
          :key="t.id"
          class="ds-switcher__btn"
          :class="{ 'ds-switcher__btn--active': activeTenant === t.id }"
          :style="{ '--dot': t.color }"
          @click="switchTenant(t.id)"
        >
          {{ t.label }}
        </button>
      </div>
    </header>

    <main class="ds-grid">
      <!-- Per-card scoping: data-tenant on wrapper div -->
      <TenantDemo tenant="default"    label="Default (Green)" />
      <TenantDemo tenant="tenant-a"   label="Tenant A (Blue)" />
      <TenantDemo tenant="tenant-bjb" label="Tenant BJB (Deep Blue)" />
    </main>

    <!-- ── Token values preview ───────────────────────────────────────────── -->
    <section class="ds-tokens-preview">
      <h2>Token values (from JS import)</h2>
      <div class="ds-token-row">
        <span class="ds-swatch" :style="{ background: BTechColor.background.primary }" />
        <code>BTechColor.background.primary = {{ BTechColor.background.primary }}</code>
      </div>
      <div class="ds-token-row">
        <span class="ds-swatch" :style="{ background: '#3b82f6' }" />
        <code>tenant-a primary = #3b82f6 (blue-500)</code>
      </div>
      <div class="ds-token-row">
        <span class="ds-swatch" :style="{ background: '#2563eb' }" />
        <code>tenant-bjb primary = #2563eb (blue-600)</code>
      </div>
      <div class="ds-token-row">
        <span class="ds-swatch ds-swatch--radius" :style="{ borderRadius: BTechRadius.interactive }" />
        <code>BTechRadius.interactive = {{ BTechRadius.interactive }}</code>
      </div>
      <div class="ds-token-row">
        <span class="ds-swatch ds-swatch--spacing" :style="{ width: BTechSpacing.md, height: BTechSpacing.md }" />
        <code>BTechSpacing.md = {{ BTechSpacing.md }}</code>
      </div>
    </section>

    <footer class="ds-footer">
      <code>
        tokens/tenants/tenant-a/overrides.json → pnpm generate → dist/styles.css
        → [data-tenant="tenant-a"] { --btech-* } → CSS cascade
      </code>
    </footer>
  </div>
</template>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: var(--btech-typography-font-family-sans);
  background: var(--btech-color-background-surface-subtle);
  color: var(--btech-color-text-neutral-default);
  min-height: 100vh;
}
</style>

<style scoped>
.ds-page { display: flex; flex-direction: column; gap: 2rem; padding: 2rem; max-width: 1000px; margin: 0 auto; }

/* ── Header ── */
.ds-header { text-align: center; display: flex; flex-direction: column; gap: 1rem; }
.ds-header h1 { font-size: 1.5rem; font-weight: 700; }
.ds-header p  { color: var(--btech-color-text-neutral-subtle); font-size: .95rem; }
.ds-header code { background: var(--btech-color-background-surface-subtle); padding: 1px 6px; border-radius: 4px; font-size: .875rem; }

/* ── Tenant switcher ── */
.ds-switcher { display: flex; align-items: center; gap: .5rem; justify-content: center; flex-wrap: wrap; }
.ds-switcher__label { font-size: .85rem; color: var(--btech-color-text-neutral-subtle); }
.ds-switcher__btn {
  display: flex; align-items: center; gap: .4rem;
  padding: 6px 14px; border-radius: var(--btech-radius-full);
  border: 1.5px solid var(--btech-color-stroke-neutral-default);
  background: white; cursor: pointer; font-size: .85rem;
  transition: all 150ms ease;
}
.ds-switcher__btn::before {
  content: ''; width: 10px; height: 10px;
  border-radius: 50%; background: var(--dot, #15803d);
}
.ds-switcher__btn--active {
  border-color: var(--btech-color-background-primary-default);
  background: var(--btech-color-background-surface-default);
  font-weight: 600;
}
.ds-switcher__btn:hover { border-color: var(--btech-color-stroke-neutral-strong); }

/* ── Card grid ── */
.ds-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; }

/* ── Token preview ── */
.ds-tokens-preview {
  background: white; border: 1px solid var(--btech-color-stroke-neutral-default);
  border-radius: var(--btech-radius-lg); padding: 1.5rem;
  display: flex; flex-direction: column; gap: .75rem;
}
.ds-tokens-preview h2 { font-size: .875rem; font-weight: 600; color: var(--btech-color-text-neutral-subtle); text-transform: uppercase; letter-spacing: .05em; }
.ds-token-row { display: flex; align-items: center; gap: .75rem; font-size: .8rem; }
.ds-swatch { width: 20px; height: 20px; border-radius: 4px; border: 1px solid rgba(0,0,0,.1); flex-shrink: 0; }
.ds-swatch--radius { background: var(--btech-color-background-primary-default); }
.ds-swatch--spacing { background: var(--btech-color-background-secondary-default); border-radius: 2px; }

/* ── Footer ── */
.ds-footer { text-align: center; }
.ds-footer code { font-size: .75rem; color: var(--btech-color-text-neutral-subtle); background: var(--btech-color-background-surface-subtle); padding: 8px 14px; border-radius: var(--btech-radius-md); display: inline-block; line-height: 1.8; }
</style>
