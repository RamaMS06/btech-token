<script setup lang="ts">
import { BTSeparator } from '@btech/ui-vue';
</script>

<template>
  <section class="showcase-section">
    <h2 class="showcase-section__title">Separator</h2>
    <p class="showcase-section__subtitle">
      1px divider line — horizontal (default) or vertical. Figma node 194:756.
    </p>

    <!-- Horizontal -->
    <div class="showcase-row">
      <span class="showcase-row__label">horizontal</span>
      <div class="showcase-row__items" style="width: 100%; flex-direction: column; gap: 12px;">
        <div style="padding: 16px; background: var(--bg-subtle); border-radius: 4px; display: flex; flex-direction: column; gap: 12px;">
          <span style="font-size: 13px; color: var(--text-primary);">Section A</span>
          <BTSeparator />
          <span style="font-size: 13px; color: var(--text-primary);">Section B</span>
          <BTSeparator />
          <span style="font-size: 13px; color: var(--text-primary);">Section C</span>
        </div>
      </div>
    </div>

    <!-- Vertical -->
    <div class="showcase-row">
      <span class="showcase-row__label">vertical</span>
      <div class="showcase-row__items">
        <div style="display: flex; align-items: center; gap: 12px; height: 32px; padding: 0 8px; background: var(--bg-subtle); border-radius: 4px;">
          <span style="font-size: 13px; color: var(--text-primary);">Item A</span>
          <BTSeparator orientation="vertical" />
          <span style="font-size: 13px; color: var(--text-primary);">Item B</span>
          <BTSeparator orientation="vertical" />
          <span style="font-size: 13px; color: var(--text-primary);">Item C</span>
        </div>
      </div>
    </div>
  </section>
</template>
