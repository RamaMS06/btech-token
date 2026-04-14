<script setup lang="ts">
defineProps<{ variant?: 'primary' | 'secondary' | 'danger' }>();
</script>

<template>
  <button :class="['ds-btn', `ds-btn--${variant ?? 'primary'}`]">
    <slot />
  </button>
</template>

<style>
/* Global so data-tenant on parent div can override via CSS cascade */
.ds-btn {
  padding: var(--btech-button-size-md-padding-y) var(--btech-button-size-md-padding-x);
  border-radius: var(--btech-button-primary-radius);
  font-size: var(--btech-button-size-md-font-size);
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 120ms ease, opacity 120ms ease;
  line-height: 1;
}
.ds-btn:hover { opacity: .88; }

.ds-btn--primary  { background: var(--btech-color-background-primary);   color: var(--btech-color-text-on-primary);   border-color: var(--btech-color-stroke-primary); }
.ds-btn--secondary{ background: var(--btech-color-background-secondary); color: var(--btech-color-text-on-secondary); border-color: var(--btech-color-stroke-secondary); }
.ds-btn--danger   { background: var(--btech-color-background-danger);    color: var(--btech-color-text-on-danger);    border-color: var(--btech-color-stroke-danger); }

[data-tenant="tenant-a"] .ds-btn {
  --btech-color-background-primary:     var(--btech-color-blue-500);
  --btech-color-text-on-primary:     #ffffff;
  --btech-color-stroke-primary: var(--btech-color-blue-700);
  --btech-button-primary-radius: 4px;
}
[data-tenant="tenant-bjb"] .ds-btn {
  --btech-color-background-primary:     var(--btech-color-blue-600);
  --btech-color-text-on-primary:     #ffffff;
  --btech-color-stroke-primary: var(--btech-color-blue-800);
  --btech-button-primary-radius: 4px;
}
</style>
