<!--
  BTAvatar v2 — circular badge with image, initials, empty, or error state.
  Sliced from Figma `Avatar` (node 497:979).

  Variant precedence (highest first — mirrors Flutter + React exactly):
    1. isLoading=true              → skeleton placeholder
    2. status='error' | imageError → hide_image icon on bg/subtler
    3. item == undefined           → person icon on bg/subtler (empty)
    4. item.imageUrl               → <img>; onError → error state
    5. (default)                   → initials on colored background

  Usage:
    <BTAvatar :item="{ name: 'Faisal Lestari' }" size="md" />
    <BTAvatar :item="{ name: 'JD', imageUrl: 'https://...' }" size="lg" />
    <BTAvatar :item="{ name: 'AB', color: 'purple' }" />
    <BTAvatar :item="{ name: '?' }" :is-loading="true" />
    <BTAvatar status="error" />
    <BTAvatar />  <!-- empty state — person icon -->
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { BTAvatarProps } from './BTAvatar.types';
import { deriveInitials } from './BTAvatar.types';

const props = withDefaults(defineProps<BTAvatarProps>(), {
  size: 'md',
  isLoading: false,
  // item and status are optional — omit from withDefaults so Vue treats
  // them as undefined by default (including undefined causes runtime errors)
});

// Image-load error tracking → triggers error variant on failure.
const imageErrored = ref(false);
watch(
  () => props.item?.imageUrl,
  () => {
    imageErrored.value = false;
  },
);

const variant = computed<'loading' | 'error' | 'empty' | 'image' | 'initials'>(() => {
  if (props.isLoading) return 'loading';
  if (props.status === 'error' || imageErrored.value) return 'error';
  if (props.item == null) return 'empty';
  if (props.item.imageUrl && !imageErrored.value) return 'image';
  return 'initials';
});

const initials = computed(() =>
  props.item ? deriveInitials(props.item.name) : '',
);

const colorClass = computed(() => {
  if (variant.value !== 'initials' && variant.value !== 'image') return null;
  return `btech-avatar--color-${props.item?.color ?? 'green'}`;
});

const classes = computed(() => [
  'btech-avatar',
  `btech-avatar--${props.size}`,
  `btech-avatar--${variant.value}`,
  colorClass.value,
]);

const ariaLabel = computed(
  () => props.item?.name ?? (variant.value === 'error' ? 'Error' : 'Empty'),
);
</script>

<template>
  <div :class="classes" role="img" :aria-label="ariaLabel">
    <!-- Skeleton variant — shimmer placeholder -->
    <div v-if="variant === 'loading'" class="btech-avatar__skeleton" />

    <!-- Error variant — hide_image icon on bg/subtler (Figma 497:979) -->
    <span v-else-if="variant === 'error'" class="btech-avatar__icon">
      <!-- Material hide_image (outlined) -->
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM18.5 10l-5.33 6.5-3.67-4.34L6 17h12l-2.5-3.33z" />
        <path d="M4.34 2.93 2.93 4.34 19.07 20.48l1.41-1.41z" />
      </svg>
    </span>

    <!-- Empty variant — person icon on bg/subtler (Figma 497:979) -->
    <span v-else-if="variant === 'empty'" class="btech-avatar__icon">
      <!-- Material person (filled) -->
      <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </span>

    <!-- Image variant — falls back to error icon on load failure -->
    <img
      v-else-if="variant === 'image'"
      class="btech-avatar__img"
      :src="item!.imageUrl"
      :alt="item!.name"
      @error="imageErrored = true"
    />

    <!-- Initials variant (default) -->
    <span v-else class="btech-avatar__initials">{{ initials }}</span>
  </div>
</template>

<style>
/* Mirrors @btech/ui-react CSS exactly. Shared design tokens via
 * `var(--btech-...)`. Component-specific brand palette is hardcoded
 * per the figma-visual-rule + component-specific-colors policy. */

.btech-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-rd, 9999px);
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
  font-family: 'Geist', system-ui, -apple-system, sans-serif;
  font-weight: 500;
  letter-spacing: var(--letterSpacing-normal, 0);
  text-align: center;
  user-select: none;
}

/* ── Sizes (Figma 497:979 ramp) ─────────────────────────────────────── */
.btech-avatar--xs  { width: 24px; height: 24px; font-size: var(--fontSize-2xs, 10px); line-height: var(--lineHeight-xs, 16px); }
.btech-avatar--sm  { width: 32px; height: 32px; font-size: var(--fontSize-sm, 14px); line-height: var(--lineHeight-xs, 16px); }
.btech-avatar--md  { width: 40px; height: 40px; font-size: var(--fontSize-md, 16px); line-height: var(--lineHeight-sm, 20px); }
.btech-avatar--lg  { width: 48px; height: 48px; font-size: var(--fontSize-xl, 20px); line-height: var(--lineHeight-md, 24px); }
.btech-avatar--xl  { width: 64px; height: 64px; font-size: var(--fontSize-3xl, 28px); line-height: var(--lineHeight-xl, 32px); }
.btech-avatar--2xl { width: 96px; height: 96px; font-size: var(--fontSize-5xl, 40px); line-height: var(--lineHeight-4xl, 48px); }

/* ── Component-specific palette — HARDCODED per figma-visual-rule ───── */
.btech-avatar--initials              { color: var(--text-inverse, #ffffff); }
.btech-avatar--color-green   { background: #89ae68; }
.btech-avatar--color-blue    { background: #93c6ef; }
.btech-avatar--color-orange  { background: #fc7b1f; }
.btech-avatar--color-purple  { background: #8873bd; }
.btech-avatar--color-teal    { background: #2fa0a1; }
.btech-avatar--color-pink    { background: #f37a98; }

/* ── Image variant ──────────────────────────────────────────────────── */
.btech-avatar--image .btech-avatar__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

/* ── Empty + Error variants (Figma 497:979) — bg/subtler + icon ─────── */
.btech-avatar--empty,
.btech-avatar--error {
  background: var(--bg-subtler, #dbdde1);
}
.btech-avatar__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary, #64748b);
}
/* Scale SVG icon ~56% of avatar diameter */
.btech-avatar--xs  .btech-avatar__icon svg { width: 14px; height: 14px; }
.btech-avatar--sm  .btech-avatar__icon svg { width: 18px; height: 18px; }
.btech-avatar--md  .btech-avatar__icon svg { width: 22px; height: 22px; }
.btech-avatar--lg  .btech-avatar__icon svg { width: 26px; height: 26px; }
.btech-avatar--xl  .btech-avatar__icon svg { width: 36px; height: 36px; }
.btech-avatar--2xl .btech-avatar__icon svg { width: 54px; height: 54px; }

/* ── Loading skeleton (Figma uses subtle bg + shimmer) ──────────────── */
.btech-avatar--loading {
  background: var(--bg-subtler, #dbdde1);
}
.btech-avatar__skeleton {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
  background-size: 200% 100%;
  animation: btech-avatar-shimmer 1.4s infinite;
}
@keyframes btech-avatar-shimmer {
  from { background-position: 200% 0; }
  to   { background-position: -200% 0; }
}

.btech-avatar__initials {
  display: inline-block;
  line-height: 1;
}
</style>
