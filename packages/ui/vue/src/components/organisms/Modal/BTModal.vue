<script setup lang="ts">
/**
 * BTModal — centred dialog with backdrop, header, optional content, footer.
 *
 * Figma: D-Modal 2123:1992 (web) · M-Modal 2124:2190 (mobile).
 *
 * @example
 * ```vue
 * <BTModal
 *   v-model:open="open"
 *   title="Confirm action"
 *   subtext="Are you sure you want to continue?"
 *   size="md"
 *   @primary="open = false"
 *   @secondary="open = false"
 * >
 *   <p>Optional content goes here.</p>
 * </BTModal>
 * ```
 */
import { computed, ref, useSlots, watch } from 'vue';
import './BTModal.css';
import type { BTModalProps } from './BTModal.types';

const props = withDefaults(defineProps<BTModalProps>(), {
  size: 'sm',
  hasClose: true,
  hasFooter: true,
  primaryLabel: 'Confirm',
  hasSecondaryButton: true,
  secondaryLabel: 'Cancel',
  hasCheckbox: false,
  checkboxLabel: "Don't show again",
  dismissable: true,
});

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'primary'): void;
  (e: 'secondary'): void;
  (e: 'close'): void;
  (e: 'checkbox', checked: boolean): void;
}>();

const slots = useSlots();
const checked = ref(false);

const panelClass = computed(() => `bt-modal-panel bt-modal-panel--${props.size}`);

function close(): void {
  emit('update:open', false);
  emit('close');
}

function backdropClick(): void {
  if (props.dismissable) close();
}

function onPrimary(): void {
  emit('primary');
}

function onSecondary(): void {
  emit('secondary');
}

function onCheckboxChange(e: Event): void {
  const target = e.target as HTMLInputElement;
  checked.value = target.checked;
  emit('checkbox', target.checked);
}

// ── Body scroll lock ───────────────────────────────────────────────────────
watch(
  () => props.open,
  (isOpen) => {
    if (typeof document === 'undefined') return;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  },
  { immediate: true },
);
</script>

<template>
  <Teleport to="body">
    <Transition name="bt-modal">
      <div
        v-if="open"
        class="bt-modal-backdrop"
        @click.self="backdropClick"
      >
        <div :class="panelClass" role="dialog" aria-modal="true">
          <!-- Header -->
          <div class="bt-modal-header">
            <h2 class="bt-modal-title">{{ title }}</h2>
            <p v-if="subtext" class="bt-modal-subtext">{{ subtext }}</p>
            <button
              v-if="hasClose"
              type="button"
              class="bt-modal-close"
              aria-label="Close"
              @click="close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path
                  d="M3.5 3.5 L12.5 12.5 M12.5 3.5 L3.5 12.5"
                  stroke="currentColor"
                  stroke-width="1.6"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>

          <!-- Optional content -->
          <div v-if="slots.default" class="bt-modal-content">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="hasFooter" class="bt-modal-footer">
            <div v-if="hasCheckbox" class="bt-modal-footer__left">
              <input
                id="bt-modal-checkbox"
                type="checkbox"
                class="bt-modal-footer__checkbox"
                :checked="checked"
                @change="onCheckboxChange"
              >
              <label for="bt-modal-checkbox" class="bt-modal-footer__checkbox-label">
                {{ checkboxLabel }}
              </label>
            </div>
            <button
              v-if="hasSecondaryButton"
              type="button"
              class="bt-modal-btn bt-modal-btn--secondary"
              @click="onSecondary"
            >
              {{ secondaryLabel }}
            </button>
            <button
              type="button"
              class="bt-modal-btn bt-modal-btn--primary"
              @click="onPrimary"
            >
              {{ primaryLabel }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
