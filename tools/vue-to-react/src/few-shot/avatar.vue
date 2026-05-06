<!--
  EXEMPLAR — paired with avatar.tsx in the same folder. Both files
  shipped to the converter as a few-shot example. Do NOT edit casually
  — changes here invalidate the prompt cache.
-->
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { BTAvatarProps } from './BTAvatar.types';
import { deriveInitials } from './BTAvatar.types';

const props = withDefaults(defineProps<BTAvatarProps>(), {
  size: 'md',
  isLoading: false,
});

const imageErrored = ref(false);
watch(() => props.item.imageUrl, () => { imageErrored.value = false; });

const variant = computed<'loading' | 'image' | 'initials'>(() => {
  if (props.isLoading) return 'loading';
  if (props.item.imageUrl && !imageErrored.value) return 'image';
  return 'initials';
});

const initials = computed(() => deriveInitials(props.item.name));
</script>

<template>
  <div :class="['btech-avatar', `btech-avatar--${size}`, `btech-avatar--${variant}`]" role="img" :aria-label="item.name">
    <div v-if="variant === 'loading'" class="btech-avatar__skeleton" />
    <img v-else-if="variant === 'image'" :src="item.imageUrl" :alt="item.name" @error="imageErrored = true" />
    <span v-else>{{ initials }}</span>
  </div>
</template>
