<script setup lang="ts">
/**
 * BTCoachmarkTour — multi-step coachmark / onboarding overlay.
 *
 * Renders a darkened backdrop with a spotlight cutout around the
 * current step's target, plus a positioned [BTTooltipStep] balloon
 * that fades / scales in. Use `v-model:step` to drive the active
 * index from the host:
 *
 * @example
 * ```vue
 * <BTCoachmarkTour
 *   :steps="steps"
 *   v-model:step="tourStep"
 *   :dismissable="true"
 *   step-variant="button"
 *   @finish="tourStep = -1"
 * />
 * ```
 *
 * `steps[i].targetRef` must be a Vue `Ref<HTMLElement | null>`. When
 * `step` becomes >= 0 the tour shows that index; -1 hides it.
 */
import { computed, nextTick, ref, watch } from 'vue';
import BTTooltipStep from '../../molecules/TooltipStep/BTTooltipStep.vue';
import type { BTTooltipStepPosition, BTTooltipStepVariant } from '../../molecules/TooltipStep/BTTooltipStep.types';
import type { BTCoachmarkStep } from './BTCoachmark.types';

const props = withDefaults(
  defineProps<{
    steps: BTCoachmarkStep[];
    /** Current step index. -1 = hidden. Use `v-model:step`. */
    step: number;
    /** Click backdrop to dismiss. @default true */
    dismissable?: boolean;
    /** Tour-level default footer variant. @default 'button' */
    stepVariant?: BTTooltipStepVariant;
    /** Tour-level default prev label. @default 'Prev' */
    prevLabel?: string;
    /** Tour-level default next label. @default 'Next' */
    nextLabel?: string;
  }>(),
  {
    dismissable: true,
    stepVariant: 'button',
    prevLabel: 'Prev',
    nextLabel: 'Next',
  },
);

const emit = defineEmits<{
  (e: 'update:step', value: number): void;
  (e: 'finish'): void;
  (e: 'prev', step: number): void;
  (e: 'next', step: number): void;
}>();

// ── Layout constants (must match BTCoachmarkController in Flutter) ─────────

const BALLOON_W = 320;
const BALLOON_H = 160;
const ARROW = 8;
const GAP = 2;
const SPOTLIGHT_PAD = 4;

// ── Reactive layout state ──────────────────────────────────────────────────

const stepPos = ref({ top: 0, left: 0 });
const activeTTPos = ref<BTTooltipStepPosition>('bottom');
const stepArrowOffset = ref('50%');
const spotlightRect = ref<{ top: number; left: number; width: number; height: number } | null>(null);

const visible = computed(() => props.step >= 0 && props.step < props.steps.length);
const activeStep = computed(() =>
  visible.value ? props.steps[props.step] : null,
);

// ── Position computation ───────────────────────────────────────────────────

function autoPosition(rect: DOMRect): BTTooltipStepPosition {
  const cy = rect.top + rect.height / 2;
  return cy > window.innerHeight * 0.6 ? 'top' : 'bottom';
}

function computeLayout(idx: number): void {
  const stepDef = props.steps[idx];
  if (!stepDef) return;
  const target = stepDef.targetRef.value;
  if (!target) return;

  const rect = target.getBoundingClientRect();
  spotlightRect.value = {
    top: rect.top, left: rect.left, width: rect.width, height: rect.height,
  };

  const pos = stepDef.position ?? autoPosition(rect);
  activeTTPos.value = pos;

  const tcx = rect.left + rect.width / 2;
  const tcy = rect.top + rect.height / 2;
  let top = 0;
  let left = 0;

  switch (pos) {
    case 'top':
      top  = rect.top - BALLOON_H - ARROW - GAP;
      left = tcx - BALLOON_W / 2;
      break;
    case 'bottom':
      // Arrow is INSIDE the balloon (top edge): only GAP separates.
      top  = rect.bottom + GAP;
      left = tcx - BALLOON_W / 2;
      break;
    case 'left':
      top  = tcy - BALLOON_H / 2;
      left = rect.left - BALLOON_W - ARROW - GAP;
      break;
    case 'right':
      // Arrow is INSIDE the balloon (left edge): only GAP separates.
      top  = tcy - BALLOON_H / 2;
      left = rect.right + GAP;
      break;
  }

  left = Math.max(8, Math.min(left, window.innerWidth  - BALLOON_W - 8));
  top  = Math.max(8, Math.min(top,  window.innerHeight - BALLOON_H - 8));

  const offset = (pos === 'left' || pos === 'right') ? tcy - top : tcx - left;
  stepArrowOffset.value = `${offset}px`;
  stepPos.value = { top, left };
}

watch(
  () => props.step,
  async (idx) => {
    if (idx < 0 || idx >= props.steps.length) {
      spotlightRect.value = null;
      return;
    }
    // Wait a tick so the target element is mounted/measured.
    await nextTick();
    computeLayout(idx);
  },
  { immediate: true },
);

// ── Navigation ─────────────────────────────────────────────────────────────

function close(): void {
  emit('update:step', -1);
  emit('finish');
}

function backdropClick(): void {
  if (props.dismissable) close();
}

function goPrev(): void {
  if (props.step > 0) {
    emit('prev', props.step);
    emit('update:step', props.step - 1);
  } else {
    close();
  }
}

function goNext(): void {
  if (props.step < props.steps.length - 1) {
    emit('next', props.step);
    emit('update:step', props.step + 1);
  } else {
    close();
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="bt-coachmark-backdrop">
      <div
        v-if="visible && spotlightRect"
        :style="{
          position: 'fixed',
          top:    `${spotlightRect.top    - SPOTLIGHT_PAD}px`,
          left:   `${spotlightRect.left   - SPOTLIGHT_PAD}px`,
          width:  `${spotlightRect.width  + SPOTLIGHT_PAD * 2}px`,
          height: `${spotlightRect.height + SPOTLIGHT_PAD * 2}px`,
          borderRadius: '5px',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
          zIndex: 9000,
          cursor: dismissable ? 'pointer' : 'default',
        }"
        @click="backdropClick"
      />
    </Transition>

    <Transition name="bt-coachmark-step" mode="out-in">
      <div
        v-if="visible && activeStep"
        :key="props.step"
        :style="{
          position: 'fixed',
          top: `${stepPos.top}px`,
          left: `${stepPos.left}px`,
          zIndex: 9001,
          pointerEvents: 'all',
        }"
      >
        <BTTooltipStep
          :label="activeStep.label"
          :description="activeStep.description"
          :step-label="activeStep.stepLabel"
          :step-variant="activeStep.stepVariant ?? stepVariant"
          has-close
          :prev-label="activeStep.prevLabel ?? prevLabel"
          :next-label="activeStep.nextLabel ?? nextLabel"
          :position="activeTTPos"
          :arrow-offset="stepArrowOffset"
          @prev="goPrev"
          @next="goNext"
          @close="close"
        />
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.bt-coachmark-backdrop-enter-active { transition: opacity 0.2s ease; }
.bt-coachmark-backdrop-leave-active { transition: opacity 0.15s ease; }
.bt-coachmark-backdrop-enter-from,
.bt-coachmark-backdrop-leave-to { opacity: 0; }

.bt-coachmark-step-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.bt-coachmark-step-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.bt-coachmark-step-enter-from,
.bt-coachmark-step-leave-to { opacity: 0; transform: scale(0.92); }
</style>
