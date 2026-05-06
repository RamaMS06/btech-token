<script setup lang="ts">
/**
 * BTButton — interactive action atom.
 * Figma source: node 114:2645.
 * All visual values come from Figma. Token CSS vars from @btech/tokens
 *
 * @example Primary (default)
 * <BTButton label="Save" />
 *
 * @example With left icon
 * <BTButton label="Upload" variant="secondary">
 *   <template #leftIcon><UploadIcon /></template>
 * </BTButton>
 *
 * @example Icon only
 * <BTButton :icon-only="true" variant="ghost">
 *   <CloseIcon />
 * </BTButton>
 *
 * @example Disabled
 * <BTButton label="Submit" :disabled="true" />
 */
import { computed } from 'vue'
import type { BTButtonProps } from './BTButton.types'
import './BTButton.css'

const props = withDefaults(defineProps<BTButtonProps>(), {
  variant: 'primary',
  size: 'default',
  disabled: false,
  iconOnly: false,
  label: '',
})

const btnClass = computed(() =>
  [
    'bt-button',
    `bt-button--${props.variant}`,
    props.size === 'small' ? 'bt-button--small' : '',
    props.iconOnly ? 'bt-button--icon-only' : '',
  ]
    .filter(Boolean)
    .join(' '),
)
</script>

<template>
  <button
    :class="btnClass"
    :disabled="disabled"
    data-testid="bt-button"
  >
    <!-- Icon-only: renders default slot as the single icon -->
    <slot v-if="iconOnly" />

    <!-- Regular: optional left icon · label · optional right icon -->
    <template v-else>
      <slot name="leftIcon" />
      <span v-if="label" class="bt-button__label">{{ label }}</span>
      <slot name="rightIcon" />
    </template>
  </button>
</template>
