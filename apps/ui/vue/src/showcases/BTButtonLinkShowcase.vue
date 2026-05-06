<!-- BTButtonLinkShowcase — Figma 480:3197 -->
<script setup lang="ts">
import { BTButtonLink } from '@btech/ui-vue';
import type { BTButtonLinkVariant } from '@btech/ui-vue';

const VARIANTS: BTButtonLinkVariant[] = [
  'primary',
  'secondary',
  'tertiary',
  'invert',
  'custom',
];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
</script>

<template>
  <section class="showcase-section">
    <h2 class="showcase-section__title">BTButtonLink — Figma 480:3197</h2>
    <p class="showcase-section__subtitle">
      5 variants. Hover → underline + bold. Active → neutral dim.
    </p>

    <!-- Default state -->
    <div class="showcase-row">
      <span class="showcase-row__label">default</span>
      <div class="showcase-row__items">
        <template v-for="v in VARIANTS" :key="v">
          <div
            :style="v === 'invert'
              ? 'background:#292f37;padding:4px 8px;border-radius:4px'
              : undefined"
          >
            <BTButtonLink :label="cap(v)" :variant="v" @click="() => {}" />
          </div>
        </template>
      </div>
    </div>

    <!-- Disabled -->
    <div class="showcase-row">
      <span class="showcase-row__label">disabled</span>
      <div class="showcase-row__items">
        <template v-for="v in VARIANTS" :key="v">
          <div
            :style="v === 'invert'
              ? 'background:#292f37;padding:4px 8px;border-radius:4px'
              : undefined"
          >
            <BTButtonLink :label="cap(v)" :variant="v" :disabled="true" />
          </div>
        </template>
      </div>
    </div>

    <!-- With icons (slots) -->
    <div class="showcase-row">
      <span class="showcase-row__label">with icons</span>
      <div class="showcase-row__items">
        <BTButtonLink label="Primary" variant="primary" @click="() => {}">
          <template #left-icon><span style="font-size:16px">←</span></template>
          <template #right-icon><span style="font-size:16px">→</span></template>
        </BTButtonLink>
        <BTButtonLink label="Secondary" variant="secondary" @click="() => {}">
          <template #left-icon><span style="font-size:16px">←</span></template>
        </BTButtonLink>
        <BTButtonLink label="Custom" variant="custom" @click="() => {}">
          <template #right-icon><span style="font-size:16px">→</span></template>
        </BTButtonLink>
      </div>
    </div>
  </section>
</template>
