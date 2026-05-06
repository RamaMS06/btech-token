<script setup lang="ts">
/**
 * BTTooltip — hover tooltip wrapping a trigger element.
 *
 * Figma: https://www.figma.com/design/WANr9drWYNYbMPuT2sMeHi/?node-id=479-2624
 *
 * @example
 * ```vue
 * <BTTooltip text="Klik untuk menyimpan" position="top">
 *   <BTButton>Simpan</BTButton>
 * </BTTooltip>
 *
 * <!-- Rich content slot -->
 * <BTTooltip position="bottom" arrow-position="left">
 *   <template #trigger><BTButton>Info</BTButton></template>
 *   <template #content>
 *     <strong>Custom</strong> content here.
 *   </template>
 * </BTTooltip>
 * ```
 */
import { ref, computed, nextTick, onUnmounted } from 'vue';
import type { BTTooltipPosition, BTTooltipArrowPosition } from './BTTooltip.types';
import './BTTooltip.css';

const props = withDefaults(
  defineProps<{
    text?: string;
    position?: BTTooltipPosition;
    arrowPosition?: BTTooltipArrowPosition;
    disabled?: boolean;
    showDelay?: number;
    hideDelay?: number;
  }>(),
  {
    position: 'top',
    arrowPosition: 'mid',
    disabled: false,
    showDelay: 0,
    hideDelay: 0,
  },
);

const emit = defineEmits<{
  (e: 'show'): void;
  (e: 'hide'): void;
}>();

// ── State ──────────────────────────────────────────────────────────────────

const triggerRef = ref<HTMLElement | null>(null);
const balloonRef = ref<HTMLElement | null>(null);
const isVisible = ref(false);

let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;

// ── Arrow geometry helpers ─────────────────────────────────────────────────

const GAP = 4; // px between trigger edge and balloon

/** Map arrow-position to horizontal offset (0..1) of the arrow's centre. */
function arrowFraction(ap: BTTooltipArrowPosition): number {
  const map: Record<BTTooltipArrowPosition, number> = {
    left: 17 / 320,
    'left-mid': 0.25,
    mid: 0.5,
    'right-mid': 0.75,
    right: (320 - 17) / 320,
  };
  return map[ap] ?? 0.5;
}

// ── Positioning ────────────────────────────────────────────────────────────

function updatePosition(): void {
  const trigger = triggerRef.value;
  const balloon = balloonRef.value;
  if (!trigger || !balloon) return;

  const tr = trigger.getBoundingClientRect();
  const bw = balloon.offsetWidth;
  const bh = balloon.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const af = arrowFraction(props.arrowPosition);

  let top = 0;
  let left = 0;

  switch (props.position) {
    case 'bottom':
      top = tr.bottom + GAP;
      left = tr.left + tr.width / 2 - bw * af;
      break;
    case 'left':
      top = tr.top + tr.height / 2 - bh * af;
      left = tr.left - bw - GAP;
      break;
    case 'right':
      top = tr.top + tr.height / 2 - bh * af;
      left = tr.right + GAP;
      break;
    case 'top':
    default:
      top = tr.top - bh - GAP;
      left = tr.left + tr.width / 2 - bw * af;
      break;
  }

  // Viewport clamping
  left = Math.max(8, Math.min(left, vw - bw - 8));
  top = Math.max(8, Math.min(top, vh - bh - 8));

  balloon.style.top = `${top}px`;
  balloon.style.left = `${left}px`;
}

// ── Visibility ─────────────────────────────────────────────────────────────

function show(): void {
  if (props.disabled) return;
  if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
  showTimer = setTimeout(async () => {
    isVisible.value = true;
    await nextTick();
    updatePosition();
    emit('show');
  }, props.showDelay);
}

function hide(): void {
  if (showTimer) { clearTimeout(showTimer); showTimer = null; }
  hideTimer = setTimeout(() => {
    isVisible.value = false;
    emit('hide');
  }, props.hideDelay);
}

onUnmounted(() => {
  if (showTimer) clearTimeout(showTimer);
  if (hideTimer) clearTimeout(hideTimer);
});

// ── Arrow SVG paths ────────────────────────────────────────────────────────

/** SVG path for the arrow, facing the trigger (pointing away from body). */
const arrowPath = computed<string>(() => {
  // All arrows: 16×8 (horizontal) or 8×16 (vertical).
  // Slightly rounded tip via quadratic bezier.
  switch (props.position) {
    case 'bottom': // arrow at top of balloon, pointing up toward trigger
      return 'M0 8 L7 1 Q8 0 9 1 L16 8 Z';
    case 'left':   // arrow at right of balloon, pointing right toward trigger
      return 'M0 0 L7 7 Q8 8 7 9 L0 16 Z';
    case 'right':  // arrow at left of balloon, pointing left toward trigger
      return 'M8 0 L1 7 Q0 8 1 9 L8 16 Z';
    case 'top':    // arrow at bottom of balloon, pointing down toward trigger
    default:
      return 'M0 0 L7 7 Q8 8 9 7 L16 0 Z';
  }
});

const arrowViewBox = computed<string>(() =>
  props.position === 'left' || props.position === 'right' ? '0 0 8 16' : '0 0 16 8',
);

const arrowWidth = computed<number>(() =>
  props.position === 'left' || props.position === 'right' ? 8 : 16,
);

const arrowHeight = computed<number>(() =>
  props.position === 'left' || props.position === 'right' ? 16 : 8,
);

const isHorizontalPosition = computed(() =>
  props.position === 'left' || props.position === 'right',
);

const balloonClasses = computed(() => [
  'bt-tooltip__balloon',
  `bt-tooltip__balloon--${props.position}`,
  isVisible.value ? 'bt-tooltip__balloon--visible' : '',
]);

const arrowRowClass = computed(() =>
  `bt-tooltip__arrow-row bt-tooltip__arrow-row--${props.arrowPosition}`,
);
const arrowColClass = computed(() =>
  `bt-tooltip__arrow-col bt-tooltip__arrow-col--${props.arrowPosition}`,
);
</script>

<template>
  <div
    ref="triggerRef"
    class="bt-tooltip"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide"
  >
    <!-- Trigger -->
    <slot />

    <!-- Floating balloon (Teleported to body to escape stacking contexts) -->
    <Teleport to="body">
      <div
        ref="balloonRef"
        :class="balloonClasses"
        role="tooltip"
        aria-live="polite"
      >
        <!-- Top / Bottom: horizontal arrow row -->
        <template v-if="!isHorizontalPosition">
          <!-- Arrow appears between trigger and body. For 'top', body is above → arrow below.
               flex-direction handles order; we always render arrow first in DOM for a11y. -->
          <div :class="arrowRowClass">
            <svg
              class="bt-tooltip__arrow"
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

        <!-- Left / Right: vertical arrow column -->
        <template v-if="isHorizontalPosition">
          <div :class="arrowColClass">
            <svg
              class="bt-tooltip__arrow"
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

        <!-- Body -->
        <div class="bt-tooltip__body">
          <!-- Rich content slot overrides text prop -->
          <slot name="content">
            <p v-if="text" class="bt-tooltip__text">{{ text }}</p>
          </slot>
        </div>
      </div>
    </Teleport>
  </div>
</template>
