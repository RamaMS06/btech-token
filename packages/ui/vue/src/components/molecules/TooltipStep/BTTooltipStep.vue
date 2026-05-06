<script setup lang="ts">
/**
 * BTTooltipStep — coachmark / pagination-step balloon.
 *
 * Figma: https://www.figma.com/design/WANr9drWYNYbMPuT2sMeHi/?node-id=478-2463
 *
 * A standalone tooltip card used for onboarding coach marks. The component
 * renders the balloon shell (arrow + body); positioning relative to the
 * target element is the responsibility of the parent.
 *
 * @example
 * ```vue
 * <!-- Step 1 of 3 — base button variant -->
 * <BTTooltipStep
 *   label="Fitur Baru"
 *   description="Klik tombol ini untuk memulai."
 *   step-label="Step 1 of 3"
 *   step-variant="button"
 *   has-close
 *   prev-label="Kembali"
 *   next-label="Selanjutnya"
 *   position="bottom"
 *   @prev="goPrev"
 *   @next="goNext"
 *   @close="endTour"
 * />
 * ```
 */
import { computed } from 'vue';
import type {
  BTTooltipStepVariant,
  BTTooltipStepPosition,
  BTTooltipStepArrowPosition,
} from './BTTooltipStep.types';
import './BTTooltipStep.css';

const props = withDefaults(
  defineProps<{
    label?: string;
    description: string;
    stepLabel?: string;
    stepVariant?: BTTooltipStepVariant;
    hasClose?: boolean;
    prevLabel?: string;
    nextLabel?: string;
    position?: BTTooltipStepPosition;
    arrowPosition?: BTTooltipStepArrowPosition;
    /**
     * Optional dynamic arrow offset (e.g. "120px") — overrides the
     * arrowPosition enum when provided.  Used by coachmark overlays that
     * compute the exact trigger-centre distance after viewport clamping.
     */
    arrowOffset?: string;
  }>(),
  {
    stepVariant: 'button',
    hasClose: false,
    prevLabel: 'Prev',
    nextLabel: 'Next',
    position: 'top',
    arrowPosition: 'mid',
  },
);

const emit = defineEmits<{
  (e: 'prev'): void;
  (e: 'next'): void;
  (e: 'close'): void;
}>();

// ── Computed ────────────────────────────────────────────────────────────────

const isHorizontalPosition = computed(
  () => props.position === 'left' || props.position === 'right',
);

const hasFooter = computed(
  () => !!props.stepLabel || props.stepVariant !== undefined,
);

const hasHeader = computed(() => !!props.label || props.hasClose);

/** SVG path for the caret arrow, pointing toward the target (away from body). */
const arrowPath = computed<string>(() => {
  switch (props.position) {
    case 'bottom':
      return 'M0 8 L7 1 Q8 0 9 1 L16 8 Z'; // ▲ top of balloon → trigger below
    case 'left':
      return 'M0 0 L7 7 Q8 8 7 9 L0 16 Z';  // ▶ right of balloon → trigger left
    case 'right':
      return 'M8 0 L1 7 Q0 8 1 9 L8 16 Z';  // ◀ left of balloon → trigger right
    case 'top':
    default:
      return 'M0 0 L7 7 Q8 8 9 7 L16 0 Z';  // ▼ bottom of balloon → trigger above
  }
});

const arrowViewBox = computed<string>(() =>
  isHorizontalPosition.value ? '0 0 8 16' : '0 0 16 8',
);
const arrowWidth = computed<number>(() => (isHorizontalPosition.value ? 8 : 16));
const arrowHeight = computed<number>(() => (isHorizontalPosition.value ? 16 : 8));

const outerClass = computed(() => [
  'bt-tooltip-step',
  `bt-tooltip-step--${props.position}`,
]);

const arrowRowClass = computed(() =>
  `bt-tooltip-step__arrow-row bt-tooltip-step__arrow-row--${props.arrowPosition}`,
);

const arrowColClass = computed(() =>
  `bt-tooltip-step__arrow-col bt-tooltip-step__arrow-col--${props.arrowPosition}`,
);

const footerClass = computed(() => [
  'bt-tooltip-step__footer',
  props.stepVariant === 'centered' ? 'bt-tooltip-step__footer--centered' : '',
]);
</script>

<template>
  <div :class="outerClass" role="dialog" aria-modal="false">
    <!-- Arrow (horizontal: row wrapper; vertical: col wrapper).
         arrowOffset prop sets --bt-arrow-offset inline (beats the class-based
         enum default), enabling pixel-accurate arrow pointing in overlays. -->
    <template v-if="!isHorizontalPosition">
      <div
        :class="arrowRowClass"
        :style="arrowOffset ? { '--bt-arrow-offset': arrowOffset } : undefined"
      >
        <svg
          class="bt-tooltip-step__arrow"
          :width="arrowWidth"
          :height="arrowHeight"
          :viewBox="arrowViewBox"
          fill="none"
          aria-hidden="true"
        >
          <path :d="arrowPath" fill="var(--bg-inverse)" />
        </svg>
      </div>
    </template>
    <template v-else>
      <div
        :class="arrowColClass"
        :style="arrowOffset ? { '--bt-arrow-offset': arrowOffset } : undefined"
      >
        <svg
          class="bt-tooltip-step__arrow"
          :width="arrowWidth"
          :height="arrowHeight"
          :viewBox="arrowViewBox"
          fill="none"
          aria-hidden="true"
        >
          <path :d="arrowPath" fill="var(--bg-inverse)" />
        </svg>
      </div>
    </template>

    <!-- Body card -->
    <div class="bt-tooltip-step__body">
      <!-- Header: label + optional close button -->
      <div v-if="hasHeader" class="bt-tooltip-step__header">
        <p v-if="label" class="bt-tooltip-step__label">{{ label }}</p>
        <div v-if="!label && hasClose" style="flex: 1" />
        <button
          v-if="hasClose"
          class="bt-tooltip-step__close"
          type="button"
          aria-label="Tutup"
          @click="emit('close')"
        >
          <!-- Close × icon -->
          <svg viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path
              d="M14 4L4 14M4 4l10 10"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>

      <!-- Description -->
      <p class="bt-tooltip-step__description">{{ description }}</p>

      <!-- Optional rich content slot -->
      <slot />

      <!-- Footer: step label + navigation buttons -->
      <div v-if="hasFooter" :class="footerClass">
        <!-- ── variant: button (default) ── -->
        <template v-if="stepVariant === 'button'">
          <p v-if="stepLabel" class="bt-tooltip-step__step-label">{{ stepLabel }}</p>
          <div style="display: flex; gap: 8px; flex-shrink: 0">
            <button
              class="bt-tooltip-step__btn"
              type="button"
              @click="emit('prev')"
            >
              {{ prevLabel }}
            </button>
            <button
              class="bt-tooltip-step__btn"
              type="button"
              @click="emit('next')"
            >
              {{ nextLabel }}
            </button>
          </div>
        </template>

        <!-- ── variant: link ── -->
        <template v-else-if="stepVariant === 'link'">
          <p v-if="stepLabel" class="bt-tooltip-step__step-label">{{ stepLabel }}</p>
          <div style="display: flex; gap: 12px; flex-shrink: 0">
            <button
              class="bt-tooltip-step__btn-link bt-tooltip-step__btn-link--prev"
              type="button"
              @click="emit('prev')"
            >
              {{ prevLabel }}
            </button>
            <button
              class="bt-tooltip-step__btn-link bt-tooltip-step__btn-link--next"
              type="button"
              @click="emit('next')"
            >
              {{ nextLabel }}
            </button>
          </div>
        </template>

        <!-- ── variant: centered ── -->
        <template v-else-if="stepVariant === 'centered'">
          <!-- Prev icon button -->
          <button
            class="bt-tooltip-step__btn-icon"
            type="button"
            aria-label="Sebelumnya"
            @click="emit('prev')"
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M10 12L6 8l4-4"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>

          <p v-if="stepLabel" class="bt-tooltip-step__step-label">{{ stepLabel }}</p>

          <!-- Next icon button -->
          <button
            class="bt-tooltip-step__btn-icon"
            type="button"
            aria-label="Selanjutnya"
            @click="emit('next')"
          >
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M6 12l4-4-4-4"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
