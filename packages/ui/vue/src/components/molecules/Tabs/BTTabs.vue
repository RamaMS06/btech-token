<!-- BTTabs — tab molecule (Figma 1:53 / Base/TabItem 434:5262).
 *
 * Two variants: 'segmented' (pill tray) · 'line' (underline).
 * Sliding indicator: absolutely-positioned div that animates left+width
 * instead of toggling classes — smooth slide on every tab change.
 * scrollable: overflow-x auto + centers the active tab on selection.
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
 *     :scrollable="true"
 *   />
 * </template>
 * ```
-->
<script setup lang="ts">
import './BTTabs.css';
import { computed, ref, watch, onMounted, nextTick } from 'vue';
import type { BTTabsProps } from './BTTabs.types';

const props = withDefaults(defineProps<BTTabsProps>(), {
  variant: 'segmented',
  activeIndex: 0,
  scrollable: false,
});

const emit = defineEmits<{
  (e: 'update:activeIndex', index: number): void;
}>();

const currentIndex = computed(() => props.activeIndex ?? 0);

// ── Refs ─────────────────────────────────────────────────────────────────────

const containerRef = ref<HTMLDivElement | null>(null);
const buttonRefs = ref<HTMLButtonElement[]>([]);

function storeButtonRef(el: unknown, i: number) {
  if (el) buttonRefs.value[i] = el as HTMLButtonElement;
}

// ── Sliding indicator state ───────────────────────────────────────────────────

const indicatorLeft = ref(0);
const indicatorWidth = ref(0);
// `isReady` prevents the CSS transition from firing on first paint
// (indicator jumps to correct position without sliding from 0).
const isReady = ref(false);

function updateIndicator() {
  const btn = buttonRefs.value[currentIndex.value];
  const container = containerRef.value;
  if (!btn || !container) return;

  indicatorLeft.value = btn.offsetLeft;
  indicatorWidth.value = btn.offsetWidth;

  // Center active tab when scrollable
  if (props.scrollable) {
    const center = btn.offsetLeft + btn.offsetWidth / 2;
    container.scrollTo({
      left: center - container.offsetWidth / 2,
      behavior: isReady.value ? 'smooth' : 'instant',
    });
  }
}

onMounted(async () => {
  // Wait for layout so offsetLeft values are populated
  await nextTick();
  updateIndicator();
  // Enable CSS transition only after the first position is painted
  await nextTick();
  isReady.value = true;
});

// Re-position indicator whenever active index changes
watch(currentIndex, updateIndicator);

// ── Event handling ────────────────────────────────────────────────────────────

function select(index: number, disabled?: boolean) {
  if (disabled) return;
  emit('update:activeIndex', index);
}

// ── Derived styles / classes ──────────────────────────────────────────────────

const rootClass = computed(() =>
  [
    'bt-tabs',
    `bt-tabs--${props.variant}`,
    props.scrollable ? 'bt-tabs--scrollable' : '',
    isReady.value ? 'bt-tabs--ready' : '',
    props.className,
  ].filter(Boolean),
);

const indicatorStyle = computed(() => ({
  left: `${indicatorLeft.value}px`,
  width: `${indicatorWidth.value}px`,
}));
</script>

<template>
  <div :class="rootClass" role="tablist" ref="containerRef">
    <!-- Sliding indicator — behind tab labels (z-index 0) -->
    <div
      class="bt-tabs__indicator"
      :style="indicatorStyle"
      aria-hidden="true"
    />

    <button
      v-for="(tab, i) in tabs"
      :key="i"
      role="tab"
      :ref="(el) => storeButtonRef(el, i)"
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
