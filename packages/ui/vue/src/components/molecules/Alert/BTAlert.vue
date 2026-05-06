<script setup lang="ts">
/**
 * BTAlert — contextual feedback banner.
 *
 * Without description: `[icon] [label] [action-link?] [dismiss?]`
 * With description:    `[icon] [label + description] [action-btn?] [dismiss?]`
 *
 * @example
 * ```vue
 * <BTAlert variant="success" label="Saved!" />
 * <BTAlert variant="error" label="Something went wrong"
 *   description="Please try again later."
 *   actionLabel="Retry" dismissible
 *   @action="retry" @dismiss="hideAlert" />
 * ```
 */
import './BTAlert.css';
import { computed } from 'vue';
import type { BTAlertProps, BTAlertVariant } from './BTAlert.types';

const props = withDefaults(defineProps<BTAlertProps>(), {
  variant: 'info',
  dismissible: false,
});

const emit = defineEmits<{
  /** Emitted when the action button / link is clicked. */
  (e: 'action'): void;
  /** Emitted when the dismiss × button is clicked. */
  (e: 'dismiss'): void;
}>();

const hasDescription = computed(() => Boolean(props.description));

const rootClass = computed(() => [
  'bt-alert',
  `bt-alert--${props.variant}`,
  hasDescription.value && 'bt-alert--with-description',
]);

// ── Icon SVG paths per variant ────────────────────────────────────────────────

/** Inner SVG markup for variant icons (viewBox="0 0 16 16"). */
const ICONS: Record<BTAlertVariant, string> = {
  info: `<path fill-rule="evenodd" clip-rule="evenodd" d="M8 1.333a6.667 6.667 0 1 0 0 13.334A6.667 6.667 0 0 0 8 1.333ZM8 4a.833.833 0 1 1 0 1.667A.833.833 0 0 1 8 4ZM7.333 6.667h1.334V11H7.333V6.667Z" fill="currentColor"/>`,
  success: `<path fill-rule="evenodd" clip-rule="evenodd" d="M8 1.333a6.667 6.667 0 1 0 0 13.334A6.667 6.667 0 0 0 8 1.333ZM11.138 6.195 7.333 10l-2-2-.943.943 2.943 2.943 4.748-4.748-.943-.943Z" fill="currentColor"/>`,
  error: `<path fill-rule="evenodd" clip-rule="evenodd" d="M8 1.333a6.667 6.667 0 1 0 0 13.334A6.667 6.667 0 0 0 8 1.333ZM7.333 4.667h1.334V9.5H7.333V4.667ZM8 10.833a.833.833 0 1 0 0 1.667.833.833 0 0 0 0-1.667Z" fill="currentColor"/>`,
  warning: `<path fill-rule="evenodd" clip-rule="evenodd" d="M8.866 2.167a1 1 0 0 0-1.732 0L1.2 12.5A1 1 0 0 0 2.067 14h11.866A1 1 0 0 0 14.8 12.5L8.866 2.167ZM7.333 6.5h1.334v3.333H7.333V6.5ZM8 11.167a.833.833 0 1 0 0 1.666.833.833 0 0 0 0-1.666Z" fill="currentColor"/>`,
  neutral: `<path fill-rule="evenodd" clip-rule="evenodd" d="M8 1.333a6.667 6.667 0 1 0 0 13.334A6.667 6.667 0 0 0 8 1.333ZM8 4a.833.833 0 1 1 0 1.667A.833.833 0 0 1 8 4ZM7.333 6.667h1.334V11H7.333V6.667Z" fill="currentColor"/>`,
  'neutral-dark': `<path fill-rule="evenodd" clip-rule="evenodd" d="M8 1.333a6.667 6.667 0 1 0 0 13.334A6.667 6.667 0 0 0 8 1.333ZM8 4a.833.833 0 1 1 0 1.667A.833.833 0 0 1 8 4ZM7.333 6.667h1.334V11H7.333V6.667Z" fill="currentColor"/>`,
};

const CLOSE_PATH = `<path d="M12 4.667 11.333 4 8 7.333 4.667 4 4 4.667 7.333 8 4 11.333l.667.667L8 8.667 11.333 12l.667-.667L8.667 8 12 4.667Z" fill="currentColor"/>`;

const iconPath = computed(() => ICONS[props.variant]);
</script>

<template>
  <div :class="rootClass" role="alert">
    <!-- Icon -->
    <span class="bt-alert__icon" aria-hidden="true">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" v-html="iconPath" />
    </span>

    <!-- Body: label + optional description -->
    <div class="bt-alert__body">
      <p class="bt-alert__label">{{ label }}</p>
      <p v-if="description" class="bt-alert__description">{{ description }}</p>
    </div>

    <!-- Action:
         · No description  → text link (variant-colored) on the right
         · With description → bordered button on the right              -->
    <button
      v-if="actionLabel && !hasDescription"
      class="bt-alert__action-link"
      type="button"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </button>

    <button
      v-if="actionLabel && hasDescription"
      class="bt-alert__action-btn"
      type="button"
      @click="emit('action')"
    >
      {{ actionLabel }}
    </button>

    <!-- Dismiss -->
    <button
      v-if="dismissible"
      class="bt-alert__dismiss"
      type="button"
      aria-label="Dismiss"
      @click="emit('dismiss')"
    >
      <!-- eslint-disable-next-line vue/no-v-html -->
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" v-html="CLOSE_PATH" />
    </button>
  </div>
</template>
