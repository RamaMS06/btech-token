<!-- BTBadge — status label atom.
     Figma source: node 72:1516.
     All visual values come from Figma. Reference repo (buma-ui Vue) used for
     code pattern (withDefaults, script setup, named slots) only.
-->
<script setup lang="ts">
import { computed } from 'vue'
import type { BTBadgeProps } from './BTBadge.types'

const props = withDefaults(defineProps<BTBadgeProps>(), {
  label: 'Badge',
  variant: 'success',
  reverseColors: false,
})

const badgeClass = computed(() =>
  [
    'bt-badge',
    `bt-badge--${props.variant}`,
    props.reverseColors ? 'bt-badge--reverse' : '',
  ]
    .filter(Boolean)
    .join(' '),
)
</script>

<template>
  <span :class="badgeClass" data-testid="bt-badge">
    <slot name="leftIcon" />
    <span class="bt-badge__label">{{ label }}</span>
    <slot name="rightIcon" />
  </span>
</template>

<style>
/* BTBadge styles — Figma 72:1516. Component-specific palette hardcoded. */
.bt-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 9999px;
  font-family: var(--btech-font-family-sans);
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  letter-spacing: 0;
  white-space: nowrap;
}

/* Normal mode — hex values map 1-to-1 to btech semantic tokens (Figma 72:1516).
   btech token → web CSS var not yet available (web generator outputs Tailwind
   primitives, not btech custom primitives). Use hex until web generator is fixed.
   Flutter equivalent: context.btechColor.ext.* / brand.* / bg.* / text.*        */
.bt-badge--success { background: #e2f3e9; color: #0a853e; } /* ext.successSubtler / ext.successBold */
.bt-badge--waiting { background: #fcf3d0; color: #be9e0f; } /* ext.warningSubtler / ext.warningBold */
.bt-badge--neutral { background: #ecedee; color: #292f37; } /* bg.secondary / text.primary */
.bt-badge--draft   { background: #e7f0f4; color: #0f81b4; } /* ext.infoSubtler / ext.infoBold */
.bt-badge--reject  { background: #f6eaea; color: #d81818; } /* ext.errorSubtler / ext.errorBold */
.bt-badge--custom  { background: #f9f6f1; color: #bd7c0c; } /* brand.secondarySubtle / brand.secondaryBold */

/* Reverse mode — solid bg + white text */
.bt-badge--success.bt-badge--reverse { background: #08a94c; color: #ffffff; } /* ext.success / text.inverse */
.bt-badge--waiting.bt-badge--reverse { background: #eec513; color: #ffffff; } /* ext.warning / text.inverse */
.bt-badge--neutral.bt-badge--reverse { background: #64748b; color: #ffffff; } /* bg.tertiary / text.inverse */
.bt-badge--draft.bt-badge--reverse   { background: #0ea5e9; color: #ffffff; } /* ext.info / text.inverse */
.bt-badge--reject.bt-badge--reverse  { background: #ef4444; color: #ffffff; } /* ext.error / text.inverse */
.bt-badge--custom.bt-badge--reverse  { background: #f59e0b; color: #ffffff; } /* brand.secondary / text.inverse */

.bt-badge__label {
  flex-shrink: 0;
}
</style>
