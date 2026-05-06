<!-- BTSlider — interactive range slider atom (Figma 434:7617).
 *
 * Three layout types: 'default' (horizontal · 1 thumb), 'range'
 * (horizontal · 2 thumbs), 'vertical' (1 thumb).
 * Three color variants: 'primary' · 'secondary' · 'destructive'.
 *
 * Example:
 * ```vue
 * <BTSlider v-model:value="brightness" />
 * <BTSlider type="range" v-model:startValue="from" v-model:endValue="to" />
 * <BTSlider type="vertical" variant="destructive" v-model:value="level" />
 * ```
-->
<script setup lang="ts">
import './BTSlider.css';
import { computed, ref, watch } from 'vue';
import type { BTSliderProps } from './BTSlider.types';

const props = withDefaults(defineProps<BTSliderProps>(), {
  type: 'default',
  variant: 'primary',
  min: 0,
  max: 100,
  step: 1,
  showTooltip: true,
  alwaysShown: true,
  disabled: false,
});

const emit = defineEmits<{
  (e: 'update:value', v: number): void;
  (e: 'update:startValue', v: number): void;
  (e: 'update:endValue', v: number): void;
}>();

// ── Internal state (uncontrolled fallback) ────────────────────────────────
const _value = ref(props.value ?? Math.round((props.min + props.max) / 2));
const _start = ref(props.startValue ?? props.min + Math.round((props.max - props.min) * 0.2));
const _end   = ref(props.endValue   ?? props.max - Math.round((props.max - props.min) * 0.2));

watch(() => props.value,      (v) => { if (v !== undefined) _value.value = v; });
watch(() => props.startValue, (v) => { if (v !== undefined) _start.value = v; });
watch(() => props.endValue,   (v) => { if (v !== undefined) _end.value   = v; });

const val   = computed(() => props.value      ?? _value.value);
const start = computed(() => props.startValue ?? _start.value);
const end   = computed(() => props.endValue   ?? _end.value);

// ── Helpers ───────────────────────────────────────────────────────────────
function toRatio(v: number) {
  return (v - props.min) / (props.max - props.min);
}
function clamp(v: number) {
  return Math.min(props.max, Math.max(props.min, v));
}

// Horizontal thumb / tooltip left (accounts for thumb radius so thumb
// center travels from 12 px to containerWidth − 12 px).
function hLeft(ratio: number) {
  return `calc(${ratio} * (100% - 24px) + 12px)`;
}

// ── Derived styles ────────────────────────────────────────────────────────
const fillStyle = computed(() => {
  if (props.type === 'range') {
    return { left: `${toRatio(start.value) * 100}%`, right: `${(1 - toRatio(end.value)) * 100}%` };
  }
  if (props.type === 'vertical') {
    return { height: `${toRatio(val.value) * 100}%` };
  }
  return { left: '0%', right: `${(1 - toRatio(val.value)) * 100}%` };
});

const thumbStyle = computed(() => ({
  left: hLeft(toRatio(val.value)),
}));
const thumbStartStyle = computed(() => ({
  left: hLeft(toRatio(start.value)),
}));
const thumbEndStyle = computed(() => ({
  left: hLeft(toRatio(end.value)),
}));

// Vertical thumb: bottom position
const vThumbStyle = computed(() => ({
  bottom: `calc(${toRatio(val.value)} * (100% - 24px))`,
  left: '50%',
}));
const vTooltipStyle = computed(() => ({
  bottom: `calc(${toRatio(val.value)} * (100% - 24px) + 12px)`,
}));

const tooltipStyle   = computed(() => ({ left: hLeft(toRatio(val.value)) }));
const ttStartStyle   = computed(() => ({ left: hLeft(toRatio(start.value)) }));
const ttEndStyle     = computed(() => ({ left: hLeft(toRatio(end.value)) }));

// ── Events ────────────────────────────────────────────────────────────────
function onValueInput(e: Event) {
  const v = clamp(Number((e.target as HTMLInputElement).value));
  _value.value = v;
  emit('update:value', v);
}

function onStartInput(e: Event) {
  const v = clamp(Math.min(Number((e.target as HTMLInputElement).value), end.value - props.step));
  _start.value = v;
  emit('update:startValue', v);
}

function onEndInput(e: Event) {
  const v = clamp(Math.max(Number((e.target as HTMLInputElement).value), start.value + props.step));
  _end.value = v;
  emit('update:endValue', v);
}

// Range: raise z-index of whichever thumb is on the right so user can
// drag it leftward past the other thumb.
const startZ = computed(() => (toRatio(start.value) > 0.9 ? 4 : 3));
const endZ   = computed(() => (toRatio(end.value)   < 0.1 ? 4 : 3));
</script>

<template>
  <div
    :class="[
      'bt-slider',
      type === 'vertical' ? 'bt-slider--vertical' : 'bt-slider--horizontal',
      `bt-slider--${variant}`,
      disabled && 'bt-slider--disabled',
      showTooltip && !alwaysShown && 'bt-slider--tooltip-hover',
      className,
    ]"
  >
    <!-- ── Default / Vertical (single thumb) ─────────────────────────── -->
    <template v-if="type !== 'range'">
      <!-- Tooltip -->
      <div
        v-if="showTooltip"
        class="bt-slider__tooltip"
        :style="type === 'vertical' ? vTooltipStyle : tooltipStyle"
      >
        {{ val }}
      </div>

      <!-- Track -->
      <div class="bt-slider__track">
        <div class="bt-slider__fill" :style="fillStyle" />
      </div>

      <!-- Native input (invisible, handles interaction) -->
      <input
        class="bt-slider__input"
        type="range"
        :min="min"
        :max="max"
        :step="step"
        :value="val"
        :disabled="disabled"
        :aria-orientation="type === 'vertical' ? 'vertical' : 'horizontal'"
        :aria-valuemin="min"
        :aria-valuemax="max"
        :aria-valuenow="val"
        @input="onValueInput"
      />

      <!-- Visual thumb -->
      <div
        class="bt-slider__thumb"
        :style="type === 'vertical' ? vThumbStyle : thumbStyle"
      />
    </template>

    <!-- ── Range (two thumbs) ─────────────────────────────────────────── -->
    <template v-else>
      <!-- Tooltips -->
      <div v-if="showTooltip" class="bt-slider__tooltip" :style="ttStartStyle">{{ start }}</div>
      <div v-if="showTooltip" class="bt-slider__tooltip" :style="ttEndStyle">{{ end }}</div>

      <!-- Track -->
      <div class="bt-slider__track">
        <div class="bt-slider__fill" :style="fillStyle" />
      </div>

      <!-- Start input -->
      <input
        class="bt-slider__input bt-slider__input--start"
        type="range"
        :style="{ zIndex: startZ }"
        :min="min"
        :max="max"
        :step="step"
        :value="start"
        :disabled="disabled"
        aria-label="Range start"
        @input="onStartInput"
      />
      <!-- End input -->
      <input
        class="bt-slider__input bt-slider__input--end"
        type="range"
        :style="{ zIndex: endZ }"
        :min="min"
        :max="max"
        :step="step"
        :value="end"
        :disabled="disabled"
        aria-label="Range end"
        @input="onEndInput"
      />

      <!-- Visual thumbs -->
      <div class="bt-slider__thumb" :style="thumbStartStyle" />
      <div class="bt-slider__thumb" :style="thumbEndStyle" />
    </template>
  </div>
</template>
