<script setup lang="ts">
/**
 * BTCheckbox — Figma 504:4181
 *
 * @example
 * ```vue
 * <!-- Basic controlled checkbox -->
 * <BTCheckbox v-model="accepted" label="I agree" />
 *
 * <!-- Indeterminate / error / disabled -->
 * <BTCheckbox v-model="partial" :indeterminate="true" label="Select all" />
 * <BTCheckbox v-model="value" :error="true" subtext="Required field" />
 * <BTCheckbox v-model="value" :disabled="true" label="Unavailable" />
 * ```
 */
import { ref, watch, onMounted } from 'vue';
import './BTCheckbox.css';
import type { BTCheckboxProps } from './BTCheckbox.types';

const props = withDefaults(defineProps<BTCheckboxProps>(), {
  modelValue: false,
  indeterminate: false,
  disabled: false,
  error: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const inputRef = ref<HTMLInputElement | null>(null);

// Sync the non-attribute indeterminate property via DOM ref.
function syncIndeterminate() {
  if (inputRef.value) {
    inputRef.value.indeterminate = props.indeterminate;
  }
}

onMounted(syncIndeterminate);
watch(() => props.indeterminate, syncIndeterminate);

function onChange(event: Event) {
  if (props.disabled) return;
  emit('update:modelValue', (event.target as HTMLInputElement).checked);
}
</script>

<template>
  <label
    class="bt-checkbox"
    :class="{
      'bt-checkbox--disabled': disabled,
      'bt-checkbox--error': error && !disabled,
    }"
  >
    <span class="bt-checkbox__control">
      <input
        ref="inputRef"
        type="checkbox"
        class="bt-checkbox__input"
        :checked="modelValue"
        :disabled="disabled"
        @change="onChange"
      />
      <span class="bt-checkbox__box" aria-hidden="true" />
    </span>

    <span v-if="label || subtext" class="bt-checkbox__text">
      <span v-if="label" class="bt-checkbox__label">{{ label }}</span>
      <span v-if="subtext" class="bt-checkbox__subtext">{{ subtext }}</span>
    </span>
  </label>
</template>
