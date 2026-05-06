<script setup lang="ts">
import '@btech/tokens/styles.css';
import '@btech/ui-vue/styles.css';
import { ref, watchEffect, computed } from 'vue';
import BTAvatarShowcase from './showcases/BTAvatarShowcase.vue';
import BTBadgeShowcase from './showcases/BTBadgeShowcase.vue';
import BTButtonShowcase from './showcases/BTButtonShowcase.vue';
import BTButtonLinkShowcase from './showcases/BTButtonLinkShowcase.vue';
import BTCheckboxShowcase from './showcases/BTCheckboxShowcase.vue';
import BTHintShowcase from './showcases/BTHintShowcase.vue';
import BTRadioButtonShowcase from './showcases/BTRadioButtonShowcase.vue';
import BTSeparatorShowcase from './showcases/BTSeparatorShowcase.vue';
import BTSliderShowcase from './showcases/BTSliderShowcase.vue';
import BTTabsShowcase from './showcases/BTTabsShowcase.vue';

// ── Sidebar registry ──────────────────────────────────────────────────────────
// Add new entries here as components are sliced.

interface ShowcasePage {
  id: string;
  group: string;
  label: string;
}

const PAGES: ShowcasePage[] = [
  { id: 'badge',       group: 'Atoms',     label: 'Badge'       },
  { id: 'button',      group: 'Atoms',     label: 'Button'      },
  { id: 'button-link', group: 'Atoms',     label: 'Button Link' },
  { id: 'checkbox',    group: 'Atoms',     label: 'Checkbox'    },
  { id: 'hint',        group: 'Atoms',     label: 'Hint'        },
  { id: 'radio',       group: 'Atoms',     label: 'Radio Button' },
  { id: 'separator',   group: 'Atoms',     label: 'Separator'   },
  { id: 'slider',      group: 'Atoms',     label: 'Slider'      },
  { id: 'avatar',      group: 'Molecules', label: 'Avatar'      },
  { id: 'tabs',        group: 'Molecules', label: 'Tabs'        },
];

// Group pages preserving insertion order
const groups = computed(() => {
  const map = new Map<string, ShowcasePage[]>();
  for (const p of PAGES) {
    if (!map.has(p.group)) map.set(p.group, []);
    map.get(p.group)!.push(p);
  }
  return map;
});

const dark = ref(false);
const selectedId = ref(PAGES[0].id);

watchEffect(() => {
  document.documentElement.setAttribute('data-mode', dark.value ? 'dark' : 'light');
});
</script>

<template>
  <div class="showcase-shell">
    <!-- Header -->
    <header class="showcase-header">
      <div class="showcase-header__left">
        <span class="showcase-header__title">BTech UI</span>
        <span class="showcase-header__subtitle">— component gallery (Vue)</span>
      </div>
      <button class="dark-mode-toggle" @click="dark = !dark" aria-label="Toggle dark mode">
        {{ dark ? '☀️ Light' : '🌙 Dark' }}
      </button>
    </header>

    <div class="showcase-body">
      <!-- Sidebar -->
      <nav class="showcase-sidebar" aria-label="Components">
        <div
          v-for="[group, items] in groups"
          :key="group"
          class="showcase-sidebar__group"
        >
          <div class="showcase-sidebar__group-label">{{ group }}</div>
          <button
            v-for="page in items"
            :key="page.id"
            class="showcase-sidebar__item"
            :class="{ 'showcase-sidebar__item--active': page.id === selectedId }"
            @click="selectedId = page.id"
          >
            {{ page.label }}
          </button>
        </div>
      </nav>

      <!-- Main content -->
      <main class="showcase-main">
        <BTBadgeShowcase v-if="selectedId === 'badge'" />
        <BTButtonShowcase v-else-if="selectedId === 'button'" />
        <BTButtonLinkShowcase v-else-if="selectedId === 'button-link'" />
        <BTCheckboxShowcase v-else-if="selectedId === 'checkbox'" />
        <BTHintShowcase v-else-if="selectedId === 'hint'" />
        <BTRadioButtonShowcase v-else-if="selectedId === 'radio'" />
        <BTSeparatorShowcase v-else-if="selectedId === 'separator'" />
        <BTSliderShowcase v-else-if="selectedId === 'slider'" />
        <BTAvatarShowcase v-else-if="selectedId === 'avatar'" />
        <BTTabsShowcase v-else-if="selectedId === 'tabs'" />
      </main>
    </div>
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

html {
  font-family: 'Poppins', system-ui, sans-serif;
}

body {
  background: var(--btech-color-bg-primary, #ffffff);
  color: var(--btech-color-text-primary, #1a1a1a);
  min-height: 100vh;
}

/* ── Shell ── */
.showcase-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* ── Header ── */
.showcase-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  height: 48px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--btech-color-border-primary, #e5e7eb);
  background: var(--btech-color-bg-primary, #ffffff);
  z-index: 100;
}

.showcase-header__left {
  display: flex;
  align-items: baseline;
}

.showcase-header__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--btech-color-text-primary, #1a1a1a);
  letter-spacing: -0.01em;
}

.showcase-header__subtitle {
  font-size: 12px;
  color: var(--btech-color-text-secondary, #6b7280);
  margin-left: 8px;
}

/* ── Dark mode toggle ── */
.dark-mode-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  border: 1px solid var(--btech-color-border-primary, #e5e7eb);
  background: transparent;
  color: var(--btech-color-text-secondary, #6b7280);
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s;
}

.dark-mode-toggle:hover {
  background: var(--btech-color-bg-subtle, #f9fafb);
}

/* ── Body ── */
.showcase-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ── Sidebar ── */
.showcase-sidebar {
  width: 220px;
  flex-shrink: 0;
  border-right: 1px solid var(--btech-color-border-primary, #e5e7eb);
  background: var(--btech-color-bg-subtle, #f9fafb);
  overflow-y: auto;
  padding: 16px 0;
}

.showcase-sidebar__group {
  margin-bottom: 8px;
}

.showcase-sidebar__group-label {
  padding: 4px 16px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--btech-color-text-tertiary, #9ca3af);
  user-select: none;
}

.showcase-sidebar__item {
  display: block;
  width: 100%;
  padding: 7px 16px;
  font-size: 13px;
  font-weight: 400;
  color: var(--btech-color-text-secondary, #6b7280);
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.1s, color 0.1s;
}

.showcase-sidebar__item:hover {
  background: var(--btech-color-bg-primary, #ffffff);
  color: var(--btech-color-text-primary, #1a1a1a);
}

.showcase-sidebar__item--active {
  font-weight: 600;
  color: var(--btech-color-text-primary, #1a1a1a);
  background: var(--btech-color-bg-primary, #ffffff);
  border-left: 2px solid #1a1a1a;
  padding-left: 14px;
}

/* ── Main content ── */
.showcase-main {
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px 80px;
}

/* ── Showcase section (used inside each showcase component) ── */
.showcase-section {
  max-width: 900px;
}

.showcase-section__title {
  font-size: 20px;
  font-weight: 700;
  color: var(--btech-color-text-primary, #1a1a1a);
  margin: 0 0 4px;
}

.showcase-section__subtitle {
  font-size: 13px;
  color: var(--btech-color-text-secondary, #6b7280);
  margin: 0 0 24px;
}

.showcase-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.showcase-row__label {
  width: 100px;
  font-size: 11px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--btech-color-text-tertiary, #9ca3af);
  flex-shrink: 0;
}

.showcase-row__items {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
</style>
