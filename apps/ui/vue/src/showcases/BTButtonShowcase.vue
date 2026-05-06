<!-- BTButtonShowcase — Figma 114:2645 -->
<script setup lang="ts">
import { BTButton } from '@btech/ui-vue';

const VARIANTS = [
  'primary',
  'secondary',
  'destructive',
  'outline',
  'ghost',
] as const;

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
</script>

<template>
  <section class="showcase-section">
    <h2 class="showcase-section__title">BTButton — Figma 114:2645</h2>
    <p class="showcase-section__subtitle">
      5 variants × default + small sizes. Hover/active/disabled via CSS pseudo-classes.
    </p>

    <!-- Default size -->
    <div class="showcase-row">
      <span class="showcase-row__label">default</span>
      <div class="showcase-row__items">
        <BTButton
          v-for="v in VARIANTS"
          :key="v"
          :label="cap(v)"
          :variant="v"
        />
      </div>
    </div>

    <!-- Small -->
    <div class="showcase-row">
      <span class="showcase-row__label">small</span>
      <div class="showcase-row__items">
        <BTButton
          v-for="v in VARIANTS"
          :key="v"
          :label="cap(v)"
          :variant="v"
          size="small"
        />
      </div>
    </div>

    <!-- Disabled -->
    <div class="showcase-row">
      <span class="showcase-row__label">disabled</span>
      <div class="showcase-row__items">
        <BTButton
          v-for="v in VARIANTS"
          :key="v"
          :label="cap(v)"
          :variant="v"
          :disabled="true"
        />
      </div>
    </div>

    <!-- With left icon -->
    <div class="showcase-row">
      <span class="showcase-row__label">left icon</span>
      <div class="showcase-row__items">
        <BTButton label="Upload" variant="primary">
          <template #leftIcon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" />
            </svg>
          </template>
        </BTButton>
        <BTButton label="Save" variant="secondary">
          <template #leftIcon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </template>
        </BTButton>
        <BTButton label="Delete" variant="destructive">
          <template #leftIcon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
            </svg>
          </template>
        </BTButton>
      </div>
    </div>

    <!-- Icon only -->
    <div class="showcase-row">
      <span class="showcase-row__label">icon only</span>
      <div class="showcase-row__items">
        <BTButton
          v-for="v in VARIANTS"
          :key="v"
          :variant="v"
          :icon-only="true"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </BTButton>
      </div>
    </div>

    <!-- Icon only small -->
    <div class="showcase-row">
      <span class="showcase-row__label">icon only sm</span>
      <div class="showcase-row__items">
        <BTButton
          v-for="v in VARIANTS"
          :key="v"
          :variant="v"
          :icon-only="true"
          size="small"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
        </BTButton>
      </div>
    </div>
  </section>
</template>
