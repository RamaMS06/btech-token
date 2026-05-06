<script setup lang="ts">
import { computed, onUnmounted, ref } from 'vue';
import { BTTooltip, BTTooltipStep, BTCoachmarkTour } from '@btech/ui-vue';
import type {
  BTTooltipPosition,
  BTTooltipArrowPosition,
  BTTooltipStepVariant,
  BTCoachmarkStep,
} from '@btech/ui-vue';

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
const dismissable = ref(true);
const tourStep = ref(-1);

// One ref per button — must be a ref<HTMLElement | null> each.
const btnRefs = demoPoints.map(() => ref<HTMLElement | null>(null));

const steps = computed<BTCoachmarkStep[]>(() =>
  demoPoints.map((pt, i) => ({
    targetRef: btnRefs[i]!,
    label: pt.label,
    description: `Ini adalah langkah ${i + 1} dari ${demoPoints.length}.`,
    stepLabel: `Step ${i + 1} of ${demoPoints.length}`,
    stepVariant: demoVariant.value,
    position: pt.ttPos,
    prevLabel: 'Kembali',
    nextLabel: 'Selanjutnya',
  })),
);

function showStep(idx: number) { tourStep.value = idx; }
function closeStep() { tourStep.value = -1; }

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

      <!-- Variant selector -->
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
        <div class="demo-grid__hint">← klik tombol manapun →</div>

        <button
          v-for="(pt, i) in demoPoints"
          :key="pt.label"
          :ref="(el) => { btnRefs[i]!.value = el as HTMLElement | null; }"
          class="demo-grid-btn"
          @click="showStep(i)"
        >
          {{ pt.label }}
        </button>
      </div>

      <!-- The tour overlay (renders to body via Teleport internally) -->
      <BTCoachmarkTour
        v-model:step="tourStep"
        :steps="steps"
        :dismissable="dismissable"
        :step-variant="demoVariant"
        @finish="tourStep = -1"
      />

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
  justify-self: center;
}

.demo-grid-btn:nth-child(n+5):nth-child(-n+7) { align-self: center; }
.demo-grid-btn:nth-child(n+8) { align-self: end; }
.demo-grid-btn:nth-child(6) { justify-self: center; }

.demo-grid-btn:hover { background: #3b8a4b; }
</style>
