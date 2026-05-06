<!-- BTBadge — status label atom.
     Figma source: node 72:1516.
     All visual values come from Figma. Reference repo (buma-ui Vue) used for
     code pattern (withDefaults, script setup, named slots) only.
-->
<script setup lang="ts">
import { computed } from 'vue';
import './BTBadge.css';
import type { BTBadgeProps } from './BTBadge.types';

const props = withDefaults(defineProps<BTBadgeProps>(), {
  label: 'Badge',
  variant: 'success',
  reverseColors: false,
});

const badgeClass = computed(() =>
  [
    'bt-badge',
    `bt-badge--${props.variant}`,
    props.reverseColors ? 'bt-badge--reverse' : '',
  ]
    .filter(Boolean)
    .join(' '),
);
</script>

<template>
  <span :class="badgeClass" data-testid="bt-badge">
    <slot name="leftIcon" />
    <span class="bt-badge__label">{{ label }}</span>
    <slot name="rightIcon" />
  </span>
</template>
