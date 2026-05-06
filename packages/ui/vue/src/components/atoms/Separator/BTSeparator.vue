<!-- BTSeparator — visual divider atom (Figma 194:756).
 *
 * Renders a 1px line using border.primary token.
 * Orientation: 'horizontal' (default) | 'vertical'.
 *
 * Example:
 * ```vue
 * <!-- Horizontal (default) — inside a flex-col container -->
 * <BTSeparator />
 *
 * <!-- Vertical — inside a flex-row container with defined height -->
 * <BTSeparator orientation="vertical" />
 * ```
-->
<script setup lang="ts">
import './BTSeparator.css';
import type { BTSeparatorProps } from './BTSeparator.types';

withDefaults(defineProps<BTSeparatorProps>(), {
  orientation: 'horizontal',
});
</script>

<template>
  <div
    role="separator"
    :aria-orientation="orientation"
    :class="['bt-separator', `bt-separator--${orientation}`]"
  />
</template>
