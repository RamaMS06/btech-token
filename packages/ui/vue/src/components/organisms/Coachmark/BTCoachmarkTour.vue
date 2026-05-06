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

// ── Wrapper ref for 2-pass height measurement (left / right positions) ──────
const stepWrapperRef = ref<HTMLElement | null>(null);

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
const BALLOON_H_EST = 160; // first-pass estimate; actual measured via stepWrapperRef
const ARROW = 8;
const GAP = 10; // SPOTLIGHT_PAD(4) + visual gap(6)
const SPOTLIGHT_PAD = 4;

// ── Reactive layout state ──────────────────────────────────────────────────

// top/bottom are mutually exclusive — set one, leave other undefined.
const stepCSS = ref<{ top?: number; bottom?: number; left: number }>({ left: 0 });

/** Resolved inline style for the step wrapper div. */
const stepWrapperStyle = computed(() => {
  const s: Record<string, string | number> = {
    position: 'fixed',
    left: `${stepCSS.value.left}px`,
    zIndex: 9001,
    pointerEvents: 'all',
  };
  if (stepCSS.value.top    !== undefined) s['top']    = `${stepCSS.value.top}px`;
  if (stepCSS.value.bottom !== undefined) s['bottom'] = `${stepCSS.value.bottom}px`;
  return s;
});
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

function computeLayout(idx: number, actualH?: number): void {
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

  switch (pos) {
    case 'top': {
      // 2-pass: arrow tip = balloon BOTTOM = rect.top - GAP (6px above spotlight).
      // top = balloon bottom − h = rect.top − GAP − h.
      const left = Math.max(8, Math.min(tcx - BALLOON_W / 2, window.innerWidth - BALLOON_W - 8));
      const h = actualH ?? BALLOON_H_EST;
      const top = Math.max(8, rect.top - GAP - h);
      stepCSS.value = { top, bottom: undefined, left };
      stepArrowOffset.value = `${tcx - left}px`;
      break;
    }
    case 'bottom': {
      // Arrow tip = balloon TOP = rect.bottom + GAP (6px below spotlight).
      const left = Math.max(8, Math.min(tcx - BALLOON_W / 2, window.innerWidth - BALLOON_W - 8));
      stepCSS.value = { top: rect.bottom + GAP, bottom: undefined, left };
      stepArrowOffset.value = `${tcx - left}px`;
      break;
    }
    case 'left': {
      const left = Math.max(8, Math.min(rect.left - BALLOON_W - ARROW - GAP, window.innerWidth - BALLOON_W - 8));
      const h = actualH ?? BALLOON_H_EST;
      const top = Math.max(8, Math.min(tcy - h / 2, window.innerHeight - h - 8));
      stepCSS.value = { top, bottom: undefined, left };
      stepArrowOffset.value = `${tcy - top}px`;
      break;
    }
    case 'right': {
      const left = Math.max(8, Math.min(rect.right + GAP, window.innerWidth - BALLOON_W - 8));
      const h = actualH ?? BALLOON_H_EST;
      const top = Math.max(8, Math.min(tcy - h / 2, window.innerHeight - h - 8));
      stepCSS.value = { top, bottom: undefined, left };
      stepArrowOffset.value = `${tcy - top}px`;
      break;
    }
  }
}

watch(
  () => props.step,
  async (idx) => {
    if (idx < 0 || idx >= props.steps.length) {
      spotlightRect.value = null;
      return;
    }
    // Pass 1: first tick so the target element is mounted/measured.
    await nextTick();
    computeLayout(idx);

    // Pass 2 (top / left / right): wait for balloon to render with the estimate,
    // then measure its actual height and recompute position.
    // • top    → exact top = rect.top − GAP − h (arrow-tip anchored)
    // • left/right → correct vertical centering
    if (activeTTPos.value !== 'bottom') {
      await nextTick();
      const h = stepWrapperRef.value?.offsetHeight;
      if (h) computeLayout(idx, h);
    }
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
        ref="stepWrapperRef"
        :style="stepWrapperStyle"
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
