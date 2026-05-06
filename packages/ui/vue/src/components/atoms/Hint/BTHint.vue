<script setup lang="ts">
/**
 * BTHint — notification indicator atom.
 *
 * Renders as a red dot or a red badge containing a count value.
 * Numbers > 99 are automatically clamped to "99+".
 *
 * @example
 * <!-- Dot indicator (no count) -->
 * <BTHint />
 * <BTHint size="sm" />
 *
 * @example
 * <!-- Count badge -->
 * <BTHint :count="5" />
 * <BTHint :count="22" size="md" />
 * <BTHint :count="150" />  <!-- renders "99+" -->
 */
import { computed } from 'vue';
import './BTHint.css';
import type { BTHintProps } from './BTHint.types';

const props = withDefaults(defineProps<BTHintProps>(), {
  count: undefined,
  size: 'lg',
});

/** Resolved display string, or null when rendering as a dot. */
const displayText = computed<string | null>(() => {
  if (props.count === null || props.count === undefined) return null;
  return props.count > 99 ? '99+' : String(props.count);
});

const isDot = computed(() => displayText.value === null);
const isOverflow = computed(() => displayText.value === '99+');
const isSingle = computed(() =>
  displayText.value !== null && displayText.value.length === 1,
);
const isMulti = computed(() =>
  displayText.value !== null && displayText.value.length === 2,
);

const classes = computed(() => [
  'bt-hint',
  `bt-hint--${props.size}`,
  isDot.value ? 'bt-hint--dot' : 'bt-hint--count',
  isOverflow.value && 'bt-hint--overflow',
  isSingle.value && 'bt-hint--single',
  isMulti.value && 'bt-hint--multi',
]);
</script>

<template>
  <span :class="classes" role="status" :aria-label="displayText ?? 'notification'">
    <template v-if="!isDot">{{ displayText }}</template>
  </span>
</template>
