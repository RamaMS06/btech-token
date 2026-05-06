<!-- BTTabs — tab molecule (Figma 1:53 / Base/TabItem 434:5262).
 *
 * Two variants: 'segmented' (pill tray) · 'line' (underline).
 *
 * Example:
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue';
 * import { BTTabs } from '@btech/ui-vue';
 * const active = ref(0);
 * </script>
 * <template>
 *   <BTTabs
 *     variant="segmented"
 *     :tabs="[{ label: 'Overview' }, { label: 'Details' }, { label: 'History' }]"
 *     v-model:activeIndex="active"
 *   />
 *   <BTTabs
 *     variant="line"
 *     :tabs="[{ label: 'Overview' }, { label: 'Details' }]"
 *     v-model:activeIndex="active"
 *   />
 * </template>
 * ```
-->
<script setup lang="ts">
import './BTTabs.css';
import { computed } from 'vue';
import type { BTTabsProps } from './BTTabs.types';

const props = withDefaults(defineProps<BTTabsProps>(), {
  variant: 'segmented',
  activeIndex: 0,
});

const emit = defineEmits<{
  (e: 'update:activeIndex', index: number): void;
}>();

const currentIndex = computed(() => props.activeIndex ?? 0);

function select(index: number, disabled?: boolean) {
  if (disabled) return;
  emit('update:activeIndex', index);
}

const rootClass = computed(() => [
  'bt-tabs',
  `bt-tabs--${props.variant}`,
  props.className,
]);
</script>

<template>
  <div :class="rootClass" role="tablist">
    <button
      v-for="(tab, i) in tabs"
      :key="i"
      role="tab"
      :class="[
        'bt-tabs__item',
        i === currentIndex && 'bt-tabs__item--active',
      ]"
      :aria-selected="i === currentIndex"
      :aria-disabled="tab.disabled || undefined"
      :disabled="tab.disabled"
      :tabindex="i === currentIndex ? 0 : -1"
      @click="select(i, tab.disabled)"
    >
      <!-- Optional leading icon via scoped slot -->
      <span v-if="$slots[`leading-icon-${i}`]" class="bt-tabs__icon">
        <slot :name="`leading-icon-${i}`" />
      </span>

      {{ tab.label }}

      <!-- Optional trailing icon via scoped slot -->
      <span v-if="$slots[`trailing-icon-${i}`]" class="bt-tabs__icon">
        <slot :name="`trailing-icon-${i}`" />
      </span>
    </button>
  </div>
</template>
