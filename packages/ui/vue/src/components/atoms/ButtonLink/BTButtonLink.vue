<!--
  BTButtonLink — inline hyperlink-style action atom.
  Figma source: node 480:3197.

  Usage:
  ```vue
  <BTButtonLink label="View details" @click="goToDetails" />

  <BTButtonLink
    label="Cancel"
    variant="secondary"
    :disabled="loading"
    @click="handleCancel"
  >
    <template #left-icon><IconClose :size="16" /></template>
  </BTButtonLink>

  <BTButtonLink label="Learn more" variant="invert" @click="openUrl" />
  ```
-->
<script setup lang="ts">
import './BTButtonLink.css';
import type { BTButtonLinkProps } from './BTButtonLink.types';

const props = withDefaults(defineProps<BTButtonLinkProps>(), {
  variant: 'primary',
  disabled: false,
});

const emit = defineEmits<{ click: [] }>();

const onClick = () => {
  if (!props.disabled) emit('click');
};
</script>

<template>
  <button
    class="bt-button-link"
    :class="`bt-button-link--${variant}`"
    :disabled="disabled"
    type="button"
    data-testid="bt-button-link"
    @click="onClick"
  >
    <slot name="left-icon" />
    <span class="bt-button-link__label">{{ label }}</span>
    <slot name="right-icon" />
  </button>
</template>
