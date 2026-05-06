<script setup lang="ts">
/**
 * BTRadioButton — radio selection atom (Figma 555:3529).
 *
 * Use multiple BTRadioButton with the same v-model to form a radio group.
 * Each item selects itself when clicked by emitting its own `value`.
 *
 * @example
 * <BTRadioButton v-model="selected" value="a" label="Option A" />
 * <BTRadioButton v-model="selected" value="b" label="Option B" subtext="Helper text" />
 * <BTRadioButton v-model="selected" value="c" label="Option C" disabled />
 * <BTRadioButton v-model="selected" value="d" label="Option D" error subtext="Error message" />
 */
import { computed } from 'vue';
import './BTRadioButton.css';
import type { BTRadioButtonProps } from './BTRadioButton.types';

const props = withDefaults(defineProps<BTRadioButtonProps>(), {
  label: undefined,
  subtext: undefined,
  disabled: false,
  error: false,
  name: undefined,
});

const emit = defineEmits<{
  'update:modelValue': [value: typeof props.value];
}>();

const isActive = computed(() => props.modelValue === props.value);

const classes = computed(() => [
  'bt-radio',
  isActive.value && 'bt-radio--active',
  props.disabled && 'bt-radio--disabled',
  props.error && !props.disabled && 'bt-radio--error',
]);

function handleChange() {
  if (!props.disabled) emit('update:modelValue', props.value);
}
</script>

<template>
  <label :class="classes">
    <input
      class="bt-radio__input"
      type="radio"
      :name="name"
      :value="value"
      :checked="isActive"
      :disabled="disabled"
      :aria-checked="isActive"
      @change="handleChange"
    />

    <span class="bt-radio__circle" aria-hidden="true">
      <span class="bt-radio__dot" />
    </span>

    <span v-if="label || subtext" class="bt-radio__text">
      <span v-if="label" class="bt-radio__label">{{ label }}</span>
      <span v-if="subtext" class="bt-radio__subtext">{{ subtext }}</span>
    </span>
  </label>
</template>
