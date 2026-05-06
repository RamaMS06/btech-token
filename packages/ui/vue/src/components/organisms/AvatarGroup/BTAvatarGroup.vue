<!--
  BTAvatarGroup — stacked group of avatars with overflow counter.
  Sliced from Figma `Avatar Group` (node 504:705).

  Composition:
    - Renders min(items.length, max) BTAvatar instances overlapping
    - When items.length > max, shows "+N" overflow avatar (neutral bg)
    - Stacking via negative left-margin per size

  Cross-framework parity:
    - React: <BTAvatarGroup items={[...]} max={3} size="md" />
    - Flutter: BTAvatar.group(items: [...], max: 3, size: BTAvatarSize.md)
-->
<script setup lang="ts">
import { computed } from 'vue';
import BTAvatar from '../../molecules/Avatar/BTAvatar.vue';
import type { BTAvatarGroupProps } from './BTAvatarGroup.types';

const props = withDefaults(defineProps<BTAvatarGroupProps>(), {
  max: 3,
  size: 'md',
  isLoading: false,
});

const visible = computed(() => props.items.slice(0, props.max));

const overflowCount = computed(() => {
  if (props.customOverflowNumber !== undefined) return props.customOverflowNumber;
  const remaining = props.items.length - props.max;
  return remaining > 0 ? remaining : 0;
});

const showOverflow = computed(() => overflowCount.value > 0);

const groupClasses = computed(() => [
  'btech-avatar-group',
  `btech-avatar-group--${props.size}`,
]);
</script>

<template>
  <div :class="groupClasses" role="group" aria-label="Avatar group">
    <BTAvatar
      v-for="(item, idx) in visible"
      :key="idx"
      :item="item"
      :size="size"
      :is-loading="isLoading"
      class="btech-avatar-group__item"
    />

    <!-- Overflow "+N" — uses Figma "Number" color (neutral subtler bg) -->
    <div
      v-if="showOverflow"
      class="btech-avatar-group__overflow btech-avatar"
      :class="`btech-avatar--${size}`"
      role="img"
      :aria-label="`${overflowCount} more avatars`"
    >
      <span class="btech-avatar__count">+{{ overflowCount }}</span>
    </div>
  </div>
</template>

<style>
/* Stacking offsets per Figma 504:705 — negative left-margin overlap.
 * Container padding-right matches the offset so total width is correct. */

.btech-avatar-group {
  display: inline-flex;
  align-items: center;
  position: relative;
}

.btech-avatar-group__item,
.btech-avatar-group__overflow {
  flex-shrink: 0;
}

/* Each item except the FIRST gets the negative-margin pull-back */
.btech-avatar-group__item + .btech-avatar-group__item,
.btech-avatar-group__item + .btech-avatar-group__overflow,
.btech-avatar-group__overflow {
  /* default md offset; size-specific overrides below */
  margin-left: -12px;
}

/* Match Figma 504:705 stacking offsets */
.btech-avatar-group--xs  .btech-avatar-group__item + .btech-avatar-group__item,
.btech-avatar-group--xs  .btech-avatar-group__item + .btech-avatar-group__overflow,
.btech-avatar-group--xs  .btech-avatar-group__overflow { margin-left: -8px; }

.btech-avatar-group--sm  .btech-avatar-group__item + .btech-avatar-group__item,
.btech-avatar-group--sm  .btech-avatar-group__item + .btech-avatar-group__overflow,
.btech-avatar-group--sm  .btech-avatar-group__overflow { margin-left: -10px; }

.btech-avatar-group--md  .btech-avatar-group__item + .btech-avatar-group__item,
.btech-avatar-group--md  .btech-avatar-group__item + .btech-avatar-group__overflow,
.btech-avatar-group--md  .btech-avatar-group__overflow { margin-left: -12px; }

.btech-avatar-group--lg  .btech-avatar-group__item + .btech-avatar-group__item,
.btech-avatar-group--lg  .btech-avatar-group__item + .btech-avatar-group__overflow,
.btech-avatar-group--lg  .btech-avatar-group__overflow { margin-left: -16px; }

.btech-avatar-group--xl  .btech-avatar-group__item + .btech-avatar-group__item,
.btech-avatar-group--xl  .btech-avatar-group__item + .btech-avatar-group__overflow,
.btech-avatar-group--xl  .btech-avatar-group__overflow { margin-left: -20px; }

.btech-avatar-group--2xl .btech-avatar-group__item + .btech-avatar-group__item,
.btech-avatar-group--2xl .btech-avatar-group__item + .btech-avatar-group__overflow,
.btech-avatar-group--2xl .btech-avatar-group__overflow { margin-left: -32px; }

/* Overflow ("+N") avatar — neutral subtler background (Figma "Number" color) */
.btech-avatar-group__overflow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-subtler, #dbdde1);
  color: var(--text-secondary, #64748b);
  border-radius: var(--radius-rd, 9999px);
  font-family: 'Geist', system-ui, -apple-system, sans-serif;
  font-weight: 500;
  user-select: none;
}

.btech-avatar__count {
  display: inline-block;
  line-height: 1;
}
</style>
