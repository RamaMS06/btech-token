<script setup lang="ts">
import { ref, onUnmounted, Teleport } from 'vue';
import { BTTooltip } from '@btech/ui-vue';
import { BTTooltipStep } from '@btech/ui-vue';
import type { BTTooltipPosition, BTTooltipArrowPosition, BTTooltipStepVariant } from '@btech/ui-vue';

const activeTab = ref<'ui' | 'usage'>('ui');

// ── Positions / arrow demo data ────────────────────────────────────────────
const positions: BTTooltipPosition[] = ['top', 'bottom', 'left', 'right'];
const arrowPositions: BTTooltipArrowPosition[] = ['left', 'left-mid', 'mid', 'right-mid', 'right'];
const stepVariants: BTTooltipStepVariant[] = ['button', 'link', 'centered'];

// ── 9-button positioned coachmark demo ────────────────────────────────────
interface DemoPoint {
  label: string;
  ttPos: BTTooltipPosition;
}

const demoPoints: DemoPoint[] = [
  { label: 'Top Left',     ttPos: 'bottom' },
  { label: 'Top Center',   ttPos: 'bottom' },
  { label: 'Top Right',    ttPos: 'bottom' },
  { label: 'Center Left',  ttPos: 'right'  },
  { label: 'Center',       ttPos: 'bottom' },
  { label: 'Center Right', ttPos: 'left'   },
  { label: 'Bottom Left',  ttPos: 'top'    },
  { label: 'Bottom Center',ttPos: 'top'    },
  { label: 'Bottom Right', ttPos: 'top'    },
];

const demoVariant = ref<BTTooltipStepVariant>('button');
const activeIdx = ref(-1);
const stepPos = ref({ top: 0, left: 0 });
const activeTTPos = ref<BTTooltipPosition>('bottom');
// Precise arrow offset computed from trigger centre after viewport clamping
const stepArrowOffset = ref('50%');
// Trigger bounding rect for the spotlight overlay (4 px padding each side)
const spotlightRect = ref<{ top: number; left: number; width: number; height: number } | null>(null);
// When false, tapping the backdrop will NOT close the coachmark
const dismissable = ref(true);

// Refs for each button element (populated via :ref callback in template)
const btnRefs = ref<HTMLElement[]>([]);
function setBtnRef(el: HTMLElement | null, i: number) {
  if (el) btnRefs.value[i] = el;
}

function showStep(idx: number) {
  const btn = btnRefs.value[idx];
  if (!btn) return;

  const rect = btn.getBoundingClientRect();
  // Capture trigger bounds for the spotlight overlay (4 px padding each side)
  spotlightRect.value = { top: rect.top, left: rect.left, width: rect.width, height: rect.height };

  const pt = demoPoints[idx];
  activeTTPos.value = pt.ttPos;

  const BALLOON_W = 320;
  const BALLOON_H = 160;
  const ARROW = 8;
  const GAP = 2;

  let top = 0;
  let left = 0;

  const tcx = rect.left + rect.width / 2;
  const tcy = rect.top + rect.height / 2;

  switch (pt.ttPos) {
    case 'top':
      top  = rect.top  - BALLOON_H - ARROW - GAP;
      left = tcx - BALLOON_W / 2;
      break;
    case 'bottom':
      // Arrow is INSIDE the balloon (at its top), so only GAP separates
      // the trigger from the balloon edge — not ARROW+GAP.
      top  = rect.bottom + GAP;
      left = tcx - BALLOON_W / 2;
      break;
    case 'left':
      top  = tcy - BALLOON_H / 2;
      left = rect.left - BALLOON_W - ARROW - GAP;
      break;
    case 'right':
      // Same as bottom: arrow is inside the balloon (at its left edge).
      top  = tcy - BALLOON_H / 2;
      left = rect.right + GAP;
      break;
  }

  // Clamp to viewport
  left = Math.max(8, Math.min(left, window.innerWidth  - BALLOON_W - 8));
  top  = Math.max(8, Math.min(top,  window.innerHeight - BALLOON_H - 8));

  // Dynamic arrow offset: px from balloon edge to trigger centre
  const offset =
    (pt.ttPos === 'left' || pt.ttPos === 'right')
      ? tcy - top   // vertical arrow → from balloon top to trigger centre Y
      : tcx - left; // horizontal arrow → from balloon left to trigger centre X
  stepArrowOffset.value = `${offset}px`;

  stepPos.value = { top, left };
  activeIdx.value = idx;
}

function closeStep() { activeIdx.value = -1; spotlightRect.value = null; }
function goPrev() { if (activeIdx.value > 0) showStep(activeIdx.value - 1); else closeStep(); }
function goNext() { if (activeIdx.value < demoPoints.length - 1) showStep(activeIdx.value + 1); else closeStep(); }

onUnmounted(closeStep);
</script>

<template>
  <section class="showcase">
    <h2 class="showcase__title">BTTooltip + BTTooltipStep</h2>

    <!-- Tabs -->
    <div class="showcase__tabs">
      <button
        :class="['showcase__tab', activeTab === 'ui' ? 'showcase__tab--active' : '']"
        @click="activeTab = 'ui'"
      >
        UI
      </button>
      <button
        :class="['showcase__tab', activeTab === 'usage' ? 'showcase__tab--active' : '']"
        @click="activeTab = 'usage'"
      >
        Usage
      </button>
    </div>

    <!-- ── UI Tab ─────────────────────────────────────────────────────── -->
    <template v-if="activeTab === 'ui'">

      <!-- Simple tooltip positions -->
      <h3 class="showcase__subtitle">BTTooltip — Positions</h3>
      <div class="showcase__row showcase__row--wrap" style="padding: 32px 0; gap: 48px;">
        <BTTooltip
          v-for="pos in positions"
          :key="pos"
          :position="pos"
          text="A message which appears when a cursor is positioned over an element."
        >
          <button class="demo-trigger">Hover ({{ pos }})</button>
        </BTTooltip>
      </div>

      <!-- Arrow positions -->
      <h3 class="showcase__subtitle">BTTooltip — Arrow Positions (position=bottom)</h3>
      <div class="showcase__row showcase__row--wrap" style="padding: 32px 0; gap: 48px;">
        <BTTooltip
          v-for="ap in arrowPositions"
          :key="ap"
          position="bottom"
          :arrow-position="ap"
          :text="`Arrow: ${ap}`"
        >
          <button class="demo-trigger">{{ ap }}</button>
        </BTTooltip>
      </div>

      <!-- Rich content slot -->
      <h3 class="showcase__subtitle">BTTooltip — Rich Content Slot</h3>
      <div class="showcase__row" style="padding: 32px 0;">
        <BTTooltip position="bottom" arrow-position="left">
          <button class="demo-trigger">Hover for rich content</button>
          <template #content>
            <p style="margin: 0 0 4px; color: white; font-weight: 700; font-size: 14px;">Status Breakdown</p>
            <p style="margin: 0; color: #94a3b8; font-size: 13px;">Active: 12 &nbsp;·&nbsp; Closed: 38</p>
          </template>
        </BTTooltip>
      </div>

      <!-- TooltipStep variants -->
      <h3 class="showcase__subtitle">BTTooltipStep — Step Variants</h3>
      <div style="display: flex; flex-wrap: wrap; gap: 32px; padding: 16px 0;">
        <div v-for="variant in stepVariants" :key="variant">
          <p style="font-size: 12px; color: #64748b; margin: 0 0 8px; text-transform: capitalize">{{ variant }}</p>
          <BTTooltipStep
            label="Fitur Baru"
            description="Klik tombol ini untuk melanjutkan ke langkah berikutnya."
            step-label="Step 1 of 5"
            :step-variant="variant"
            has-close
            position="bottom"
          />
        </div>
      </div>

      <!-- TooltipStep arrow positions -->
      <h3 class="showcase__subtitle">BTTooltipStep — Arrow Positions</h3>
      <div style="display: flex; flex-wrap: wrap; gap: 32px; padding: 16px 0;">
        <div v-for="pos in positions" :key="pos">
          <p style="font-size: 12px; color: #64748b; margin: 0 0 8px; text-transform: capitalize">position={{ pos }}</p>
          <BTTooltipStep
            :description="`Tooltip balloon dengan arrow di sisi ${pos}.`"
            step-label="Step 1 of 3"
            :position="pos"
          />
        </div>
      </div>

      <!-- Description only -->
      <h3 class="showcase__subtitle">BTTooltipStep — Description Only</h3>
      <div style="padding: 16px 0;">
        <BTTooltipStep
          description="A message which appears when a cursor is positioned over an icon, image, hyperlink, or other element in a graphical user interface."
          position="top"
          arrow-position="left"
        />
      </div>

    </template>

    <!-- ── Usage Tab ─────────────────────────────────────────────────────── -->
    <template v-if="activeTab === 'usage'">
      <h3 class="showcase__subtitle">Interactive Coachmark Demo</h3>
      <p style="font-size: 14px; color: #64748b; margin: 0 0 16px;">
        Pilih gaya tombol, lalu klik salah satu dari 9 posisi untuk melihat BTTooltipStep.
      </p>

      <!-- Variant selector + dismissable toggle -->
      <div style="display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; align-items: center;">
        <button
          v-for="v in stepVariants"
          :key="v"
          class="variant-btn"
          :class="{ 'variant-btn--active': demoVariant === v }"
          @click="demoVariant = v; closeStep()"
        >
          {{ v }}
        </button>
      </div>

      <!-- Dismissable toggle -->
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 24px;">
        <span style="font-size: 13px; color: #64748b;">Dismissable:</span>
        <button
          class="variant-btn"
          :class="{ 'variant-btn--active': dismissable }"
          @click="dismissable = !dismissable"
        >
          {{ dismissable ? 'ON' : 'OFF' }}
        </button>
        <span style="font-size: 12px; color: #9ca3af;">
          {{ dismissable ? '— klik luar untuk tutup' : '— klik luar tidak tutup' }}
        </span>
      </div>

      <!-- 9-button positioned grid -->
      <p style="font-size: 12px; color: #9ca3af; margin: 0 0 8px;">Klik tombol di posisi manapun:</p>
      <div class="demo-grid">
        <!-- hint text -->
        <div class="demo-grid__hint">← klik tombol manapun →</div>

        <!-- 9 buttons -->
        <button
          v-for="(pt, i) in demoPoints"
          :key="pt.label"
          :ref="(el) => setBtnRef(el as HTMLElement, i)"
          class="demo-grid-btn"
          :class="{ 'demo-grid-btn--active': activeIdx === i }"
          @click="showStep(i)"
        >
          {{ pt.label }}
        </button>
      </div>

      <!-- Overlay via Teleport — backdrop + step with enter/leave animation -->
      <Teleport to="body">
        <!-- Spotlight: dark overlay with a cutout (border-radius 5px) over the trigger -->
        <Transition name="backdrop">
          <div
            v-if="activeIdx >= 0 && spotlightRect"
            :style="{
              position: 'fixed',
              top:    `${spotlightRect.top    - 4}px`,
              left:   `${spotlightRect.left   - 4}px`,
              width:  `${spotlightRect.width  + 8}px`,
              height: `${spotlightRect.height + 8}px`,
              borderRadius: '5px',
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
              zIndex: 1999,
              cursor: 'pointer',
            }"
            @click="dismissable && closeStep()"
          />
        </Transition>

        <!-- Step balloon with ease-in-out transition per step change -->
        <Transition name="coachmark" mode="out-in">
          <div
            v-if="activeIdx >= 0"
            :key="activeIdx"
            class="step-overlay"
            :style="{ top: stepPos.top + 'px', left: stepPos.left + 'px' }"
          >
            <BTTooltipStep
              :label="demoPoints[activeIdx].label"
              :description="`Ini adalah langkah ${activeIdx + 1} dari ${demoPoints.length}.`"
              :step-label="`Step ${activeIdx + 1} of ${demoPoints.length}`"
              :step-variant="demoVariant"
              has-close
              prev-label="Kembali"
              next-label="Selanjutnya"
              :position="activeTTPos"
              :arrow-offset="stepArrowOffset"
              @prev="goPrev"
              @next="goNext"
              @close="closeStep"
            />
          </div>
        </Transition>
      </Teleport>

    </template>
  </section>
</template>

<style scoped>
.showcase { padding: 24px; }
.showcase__title { font-size: 20px; font-weight: 700; margin: 0 0 16px; }
.showcase__subtitle { font-size: 14px; font-weight: 600; color: #334155; margin: 24px 0 8px; }
.showcase__tabs { display: flex; gap: 4px; margin-bottom: 24px; }
.showcase__tab {
  padding: 6px 16px; border-radius: 6px; border: 1px solid #e2e8f0;
  background: white; color: #334155; cursor: pointer; font-size: 14px; font-weight: 500;
}
.showcase__tab--active { background: #1e293b; color: white; border-color: #1e293b; }
.showcase__row { display: flex; align-items: center; }
.showcase__row--wrap { flex-wrap: wrap; }

.demo-trigger {
  padding: 8px 16px; border-radius: 6px; border: 1px solid #e2e8f0;
  background: white; color: #334155; cursor: pointer; font-size: 14px; font-weight: 500;
}
.demo-trigger:hover { background: #f1f5f9; }

/* ── Variant selector ── */
.variant-btn {
  padding: 6px 12px; border-radius: 6px; border: 1px solid #e2e8f0;
  background: white; color: #334155; cursor: pointer; font-size: 13px; font-weight: 500;
}
.variant-btn--active { background: #1e293b; color: white; border-color: #1e293b; }

/* ── 9-button demo grid ── */
.demo-grid {
  position: relative;
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto 1fr auto;
  gap: 0;
  min-height: 360px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 24px;
}

.demo-grid__hint {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #e2e8f0;
  pointer-events: none;
  user-select: none;
}

.demo-grid-btn {
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  margin: 12px;
  background: #4a9d5b;
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.1s;
  align-self: start;
  /* prevent center button from stretching too wide */
  justify-self: center;
}

.demo-grid-btn:nth-child(n+5):nth-child(-n+7) { align-self: center; }
.demo-grid-btn:nth-child(n+8) { align-self: end; }
/* center button (5th) — keep compact */
.demo-grid-btn:nth-child(6) { justify-self: center; }

.demo-grid-btn--active { background: #1e293b; }
.demo-grid-btn:hover:not(.demo-grid-btn--active) { background: #3b8a4b; }

/* Spotlight div has all styles inline; only the fade transition is here */

/* ── Step overlay ── */
.step-overlay {
  position: fixed;
  z-index: 2000;
  pointer-events: all;
}

/* ── Backdrop transition ── */
.backdrop-enter-active { transition: opacity 0.2s ease; }
.backdrop-leave-active { transition: opacity 0.15s ease; }
.backdrop-enter-from,
.backdrop-leave-to    { opacity: 0; }

/* ── Coachmark step transition (ease in/out per step) ── */
.coachmark-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.coachmark-leave-active { transition: opacity 0.12s ease, transform 0.12s ease; }
.coachmark-enter-from   { opacity: 0; transform: scale(0.92); }
.coachmark-leave-to     { opacity: 0; transform: scale(0.92); }
</style>
