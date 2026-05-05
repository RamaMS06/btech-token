<script setup lang="ts">
import '@btech/tokens-bspace/styles.css';
import '@btech/ui-vue/styles.css';
import { ref, watchEffect } from 'vue';
import BTAvatarShowcase from './showcases/BTAvatarShowcase.vue';

const dark = ref(false);

watchEffect(() => {
  document.documentElement.setAttribute('data-theme', dark.value ? 'dark' : 'light');
});
</script>

<template>
  <header class="showcase-header">
    <div class="showcase-header__left">
      <span class="showcase-header__title">BTech UI Showcase</span>
      <span class="showcase-header__subtitle">— Vue component gallery</span>
    </div>
    <button class="dark-mode-toggle" @click="dark = !dark" aria-label="Toggle dark mode">
      {{ dark ? '☀️ Light' : '🌙 Dark' }}
    </button>
  </header>

  <main class="showcase-main">
    <BTAvatarShowcase />
    <!-- Add more <BComponentShowcase /> sections here as components are sliced -->
  </main>
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

.showcase-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--btech-color-border-primary, #e5e7eb);
  background: var(--btech-color-bg-primary, #ffffff);
  position: sticky;
  top: 0;
  z-index: 100;
}

.showcase-header__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--btech-color-text-primary, #1a1a1a);
  letter-spacing: -0.01em;
}

.showcase-header__subtitle {
  font-size: 12px;
  color: var(--btech-color-text-secondary, #6b7280);
  margin-left: 12px;
}

.dark-mode-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid var(--btech-color-border-primary, #e5e7eb);
  background: transparent;
  color: var(--btech-color-text-secondary, #6b7280);
  font-family: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.dark-mode-toggle:hover {
  background: var(--btech-color-bg-subtle, #f9fafb);
}

.showcase-main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 24px 80px;
}
</style>
