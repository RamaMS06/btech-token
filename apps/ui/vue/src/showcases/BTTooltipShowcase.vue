<script setup lang="ts">
import { ref } from 'vue';
import { BTTooltip } from '@btech/ui-vue';
import { BTTooltipStep } from '@btech/ui-vue';
import type { BTTooltipPosition, BTTooltipArrowPosition, BTTooltipStepVariant } from '@btech/ui-vue';

const activeTab = ref<'ui' | 'usage'>('ui');

// ── Pagination step demo state ─────────────────────────────────────────────
const demoStep = ref(1);
const totalSteps = 5;
const demoVariant = ref<BTTooltipStepVariant>('button');
const showStep = ref(true);

function goPrev() {
  if (demoStep.value > 1) demoStep.value--;
}
function goNext() {
  if (demoStep.value < totalSteps) demoStep.value++;
  else showStep.value = false;
}
function endTour() {
  showStep.value = false;
  demoStep.value = 1;
}
function startTour() {
  showStep.value = true;
  demoStep.value = 1;
}

const positions: BTTooltipPosition[] = ['top', 'bottom', 'left', 'right'];
const arrowPositions: BTTooltipArrowPosition[] = ['left', 'left-mid', 'mid', 'right-mid', 'right'];
const stepVariants: BTTooltipStepVariant[] = ['button', 'link', 'centered'];
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
      <div class="showcase__row" style="flex-wrap: wrap; gap: 48px; padding: 32px 0;">
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
      <div class="showcase__row" style="flex-wrap: wrap; gap: 48px; padding: 32px 0;">
        <BTTooltip
          v-for="ap in arrowPositions"
          :key="ap"
          position="bottom"
          :arrow-position="ap"
          text="Arrow position: {{ ap }}"
        >
          <button class="demo-trigger">{{ ap }}</button>
        </BTTooltip>
      </div>

      <!-- Tooltip with rich content slot -->
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
            description="Tooltip balloon dengan arrow di sisi {{ pos }}."
            step-label="Step 1 of 3"
            :position="pos"
          />
        </div>
      </div>

      <!-- TooltipStep no header (description only) -->
      <h3 class="showcase__subtitle">BTTooltipStep — Description Only</h3>
      <div style="padding: 16px 0;">
        <BTTooltipStep
          description="A message which appears when a cursor is positioned over an icon, image, hyperlink, or other element in a graphical user interface."
          position="top"
          arrow-position="left"
        />
      </div>

    </template>

    <!-- ── Usage Tab ──────────────────────────────────────────────────── -->
    <template v-if="activeTab === 'usage'">
      <h3 class="showcase__subtitle">Interactive Coachmark Tour</h3>
      <p style="font-size: 14px; color: #64748b; margin-bottom: 16px;">
        Pilih style tombol navigasi lalu klik "Start Tour" untuk melihat BTTooltipStep interaktif.
      </p>

      <!-- Variant selector -->
      <div style="display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap;">
        <button
          v-for="v in stepVariants"
          :key="v"
          :style="{
            padding: '6px 12px',
            borderRadius: '6px',
            border: '1px solid #e2e8f0',
            background: demoVariant === v ? '#1e293b' : 'white',
            color: demoVariant === v ? 'white' : '#334155',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '500',
          }"
          @click="demoVariant = v"
        >
          {{ v }}
        </button>
        <button
          style="padding: 6px 12px; border-radius: 6px; border: 1px solid #145bc3; background: #145bc3; color: white; cursor: pointer; font-size: 13px; font-weight: 500; margin-left: auto;"
          @click="startTour"
        >
          Start Tour
        </button>
      </div>

      <!-- Demo coachmark (inline, positioned below a fake target) -->
      <div v-if="showStep" style="max-width: 360px;">
        <BTTooltipStep
          label="Contoh Coachmark"
          :description="`Ini adalah langkah ${demoStep} dari ${totalSteps}. ${demoVariant === 'link' ? 'Gunakan link untuk navigasi.' : demoVariant === 'centered' ? 'Tombol ikon di tengah untuk navigasi.' : 'Tombol secondary untuk navigasi.'}`"
          :step-label="`Step ${demoStep} of ${totalSteps}`"
          :step-variant="demoVariant"
          has-close
          prev-label="Kembali"
          next-label="Selanjutnya"
          position="bottom"
          @prev="goPrev"
          @next="goNext"
          @close="endTour"
        />
      </div>
      <div v-else style="padding: 16px; background: #f8fafc; border-radius: 8px; color: #64748b; font-size: 14px;">
        Tour selesai. Klik "Start Tour" untuk mengulang.
      </div>
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
.demo-trigger {
  padding: 8px 16px; border-radius: 6px; border: 1px solid #e2e8f0;
  background: white; color: #334155; cursor: pointer; font-size: 14px; font-weight: 500;
}
.demo-trigger:hover { background: #f1f5f9; }
</style>
