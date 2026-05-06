<!-- Auto-generated showcase — do not edit manually -->
<script setup lang="ts">
import { BTHint } from '@btech/ui-vue';

const sizes = ['lg', 'md', 'sm'] as const;
</script>

<template>
  <section class="showcase-section">
    <h2 class="showcase-section__title">Atoms › Hint — Figma 658:1960</h2>
    <div v-for="size in sizes" :key="size" class="showcase-row">
      <span class="showcase-row__label">{{ size }}</span>
      <!-- Dot -->
      <BTHint :size="size" />
      <!-- 1-digit -->
      <BTHint :count="5" :size="size" />
      <!-- 2-digit -->
      <BTHint :count="22" :size="size" />
      <!-- 99+ -->
      <BTHint :count="150" :size="size" />
    </div>
  </section>
</template>
