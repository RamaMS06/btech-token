<!-- BTBadgeShowcase — visual smoke test for BTBadge (atom). Figma 72:1516. -->
<script setup lang="ts">
import { BTBadge } from '@btech/ui-vue'

const variants = ['success', 'waiting', 'neutral', 'draft', 'reject', 'custom'] as const
type Variant = (typeof variants)[number]

function capitalize(s: Variant) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
</script>

<template>
  <section class="showcase-section">
    <h2 class="showcase-section__title">BTBadge — Figma 72:1516</h2>
    <p class="showcase-section__subtitle">6 variants × normal + reverse. Optional left/right icon slots.</p>

    <div class="showcase-row">
      <span class="showcase-row__label">normal</span>
      <div class="showcase-row__items">
        <BTBadge v-for="v in variants" :key="v" :label="capitalize(v)" :variant="v" />
      </div>
    </div>

    <div class="showcase-row">
      <span class="showcase-row__label">reverse</span>
      <div class="showcase-row__items">
        <BTBadge v-for="v in variants" :key="v" :label="capitalize(v)" :variant="v" :reverseColors="true" />
      </div>
    </div>

    <div class="showcase-row">
      <span class="showcase-row__label">left icon</span>
      <div class="showcase-row__items">
        <BTBadge label="Success" variant="success">
          <template #leftIcon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </template>
        </BTBadge>
        <BTBadge label="Waiting" variant="waiting">
          <template #leftIcon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z" />
            </svg>
          </template>
        </BTBadge>
        <BTBadge label="Reject" variant="reject">
          <template #leftIcon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </template>
        </BTBadge>
      </div>
    </div>

    <div class="showcase-row">
      <span class="showcase-row__label">right icon</span>
      <div class="showcase-row__items">
        <BTBadge label="Draft" variant="draft">
          <template #rightIcon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
          </template>
        </BTBadge>
        <BTBadge label="Custom" variant="custom">
          <template #rightIcon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
            </svg>
          </template>
        </BTBadge>
      </div>
    </div>
  </section>
</template>
