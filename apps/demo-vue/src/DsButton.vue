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
  padding: var(--ds-button-size-md-padding-y) var(--ds-button-size-md-padding-x);
  border-radius: var(--ds-button-primary-radius);
  font-size: var(--ds-button-size-md-font-size);
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 120ms ease, opacity 120ms ease;
  line-height: 1;
}
.ds-btn:hover { opacity: .88; }

.ds-btn--primary  { background: var(--ds-color-primary-bg);   color: var(--ds-color-primary-fg);   border-color: var(--ds-color-primary-border); }
.ds-btn--secondary{ background: var(--ds-color-secondary-bg); color: var(--ds-color-secondary-fg); border-color: var(--ds-color-secondary-border); }
.ds-btn--danger   { background: var(--ds-color-danger-bg);    color: var(--ds-color-danger-fg);    border-color: var(--ds-color-danger-border); }

[data-tenant="tenant-a"] .ds-btn {
  --ds-color-primary-bg:     var(--ds-color-blue-500);
  --ds-color-primary-fg:     #ffffff;
  --ds-color-primary-border: var(--ds-color-blue-700);
  --ds-button-primary-radius: 4px;
}
[data-tenant="tenant-bjb"] .ds-btn {
  --ds-color-primary-bg:     var(--ds-color-blue-600);
  --ds-color-primary-fg:     #ffffff;
  --ds-color-primary-border: var(--ds-color-blue-800);
  --ds-button-primary-radius: 4px;
}
</style>
