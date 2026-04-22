<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import DsButton from './DsButton.vue';

const props = defineProps<{ tenant: string; label: string }>();

// Each card scopes its tenant via a wrapper div's data-tenant attribute
// (in a real app, tokenPlugin sets this on <html> at root level)
</script>

<template>
  <div class="ds-card" :data-tenant="tenant">
    <div class="ds-card__header">
      <h2 class="ds-card__title">{{ label }}</h2>
      <span class="ds-badge">tenant: {{ tenant }}</span>
    </div>
    <p class="ds-card__desc">
      Same component code — different brand tokens via
      <code>data-tenant="{{ tenant }}"</code>.
    </p>
    <div class="ds-btn-row">
      <DsButton variant="primary">Primary Action</DsButton>
      <DsButton variant="secondary">Secondary</DsButton>
      <DsButton variant="danger">Delete</DsButton>
    </div>
  </div>
</template>

<style scoped>
.ds-card { background: white; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.ds-card__header { display: flex; align-items: center; justify-content: space-between; gap: .5rem; flex-wrap: wrap; }
.ds-card__title { font-size: 1rem; font-weight: 600; }
.ds-card__desc { font-size: .85rem; color: #6b7280; line-height: 1.5; }
.ds-card__desc code { background: #f3f4f6; padding: 1px 5px; border-radius: 3px; font-size: .8rem; }
.ds-badge { font-size: .7rem; background: #f3f4f6; color: #6b7280; padding: 2px 8px; border-radius: 999px; white-space: nowrap; }
.ds-btn-row { display: flex; gap: .75rem; flex-wrap: wrap; }
</style>
