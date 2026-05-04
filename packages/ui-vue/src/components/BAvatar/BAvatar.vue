<!--
  BAvatar — circular badge with image / initials / count / placeholder.
  Sliced from Figma `Avatar` (node 497:979).

  Variant precedence (highest first):
    1. status="error"  → broken-image icon on neutral background
    2. src             → image (with optional bg color tint)
    3. count           → "+N" overflow counter
    4. initials        → 1-2 letters on colored background
    5. (nothing)       → empty placeholder (person icon)

  Mirrors @btech/ui-react Avatar one-to-one. The shared Figma schema
  guarantees prop names + variant values stay in sync across frameworks.
-->
<script setup lang="ts">
import { computed } from 'vue';
import type { BAvatarProps } from './BAvatar.types';

const props = withDefaults(defineProps<BAvatarProps>(), {
  size: 'md',
  color: 'green',
});

// Resolve the visual variant. Order matches Avatar.tsx.
const variant = computed<'error' | 'image' | 'count' | 'initials' | 'empty'>(() => {
  if (props.status === 'error') return 'error';
  if (props.src) return 'image';
  if (typeof props.count === 'number') return 'count';
  if (props.initials) return 'initials';
  return 'empty';
});

const classes = computed(() => {
  const base = ['btech-avatar', `btech-avatar--${props.size}`];
  switch (variant.value) {
    case 'error':
      base.push('btech-avatar--error');
      break;
    case 'image':
      base.push('btech-avatar--image', `btech-avatar--color-${props.color}`);
      break;
    case 'count':
      base.push('btech-avatar--count');
      break;
    case 'initials':
      base.push('btech-avatar--initials', `btech-avatar--color-${props.color}`);
      break;
    case 'empty':
      base.push('btech-avatar--empty');
      break;
  }
  return base;
});

const ariaLabel = computed(
  () => props.alt ?? props.initials ?? (typeof props.count === 'number' ? `+${props.count}` : 'avatar'),
);
</script>

<template>
  <div :class="classes" role="img" :aria-label="ariaLabel">
    <img
      v-if="variant === 'image' && src"
      class="btech-avatar__img"
      :src="src"
      :alt="alt ?? ''"
    />
    <span v-else-if="variant === 'initials'">{{ initials }}</span>
    <span v-else-if="variant === 'count'">{{ `+${count}` }}</span>

    <!-- Person icon (empty state) -->
    <svg v-else-if="variant === 'empty'" class="btech-avatar__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-3.33 0-10 1.67-10 5v3h20v-3c0-3.33-6.67-5-10-5Z" />
    </svg>

    <!-- Hide-image icon (error state) -->
    <svg v-else class="btech-avatar__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M3 3l18 18-1.4 1.4-2-2H5a2 2 0 0 1-2-2V5.4L1.6 4 3 3Zm2 2v14h12.6L5 6.4V5Zm16 14V5a2 2 0 0 0-2-2H7l2 2h10v10l2 2Z" />
    </svg>
  </div>
</template>

<style>
/* Identical CSS to @btech/ui-react. Kept duplicated rather than shared
 * across packages to avoid coupling — when a token changes, only the file
 * that needs updating gets touched. The Figma schema (D4 slicer) is the
 * canonical source of truth, not this file. */
.btech-avatar {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-none, 0);
  gap: var(--spacing-none, 0);
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
.btech-avatar--xs  { width: 24px; height: 24px; font-size: var(--fontSize-2xs, 10px); line-height: var(--lineHeight-xs, 16px); }
.btech-avatar--sm  { width: 32px; height: 32px; font-size: var(--fontSize-sm, 14px); line-height: var(--lineHeight-xs, 16px); }
.btech-avatar--md  { width: 40px; height: 40px; font-size: var(--fontSize-md, 16px); line-height: var(--lineHeight-sm, 20px); }
.btech-avatar--lg  { width: 48px; height: 48px; font-size: var(--fontSize-xl, 20px); line-height: var(--lineHeight-md, 24px); }
.btech-avatar--xl  { width: 64px; height: 64px; font-size: var(--fontSize-3xl, 28px); line-height: var(--lineHeight-xl, 32px); }
.btech-avatar--2xl { width: 96px; height: 96px; font-size: var(--fontSize-5xl, 40px); line-height: var(--lineHeight-4xl, 48px); }

.btech-avatar--initials      { color: var(--text-inverse, #ffffff); }
.btech-avatar--color-green   { background: #89ae68; }
.btech-avatar--color-blue    { background: #93c6ef; }
.btech-avatar--color-orange  { background: #fc7b1f; }
.btech-avatar--color-purple  { background: #8873bd; }
.btech-avatar--color-teal    { background: #2fa0a1; }
.btech-avatar--color-pink    { background: #f37a98; }

.btech-avatar--image { background: transparent; }
.btech-avatar__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

.btech-avatar--empty,
.btech-avatar--error,
.btech-avatar--count {
  background: var(--bg-subtler, #dbdde1);
  color: var(--text-secondary, #64748b);
}

.btech-avatar__icon {
  display: inline-block;
  width: 67%;
  height: 67%;
  fill: currentColor;
}
</style>
