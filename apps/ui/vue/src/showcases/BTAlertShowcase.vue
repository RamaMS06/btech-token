<script setup lang="ts">
import { ref } from 'vue';
import { BTAlert } from '@btech/ui-vue';
import type { BTAlertVariant } from '@btech/ui-vue';

// ── Trigger state ─────────────────────────────────────────────────────────────
// Each entry: { variant, label, description?, actionLabel?, dismissible }

interface AlertConfig {
  variant: BTAlertVariant;
  label: string;
  description?: string;
  actionLabel?: string;
  dismissible?: boolean;
}

const VARIANTS: AlertConfig[] = [
  { variant: 'info',         label: 'Info alert',         actionLabel: 'Action' },
  { variant: 'success',      label: 'Success alert',      actionLabel: 'Action' },
  { variant: 'error',        label: 'Error alert',        actionLabel: 'Action' },
  { variant: 'warning',      label: 'Warning alert',      actionLabel: 'Action' },
  { variant: 'neutral',      label: 'Neutral alert',      actionLabel: 'Action' },
  { variant: 'neutral-dark', label: 'Neutral dark alert', actionLabel: 'Action' },
];

const VARIANTS_WITH_DESC: AlertConfig[] = [
  {
    variant: 'info',
    label: 'Info alert',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.',
    actionLabel: 'Action',
    dismissible: true,
  },
  {
    variant: 'success',
    label: 'Success alert',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.',
    actionLabel: 'Action',
    dismissible: true,
  },
  {
    variant: 'error',
    label: 'Error alert',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.',
    actionLabel: 'Action',
    dismissible: true,
  },
  {
    variant: 'warning',
    label: 'Warning alert',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.',
    actionLabel: 'Action',
    dismissible: true,
  },
  {
    variant: 'neutral',
    label: 'Neutral alert',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.',
    actionLabel: 'Action',
    dismissible: true,
  },
  {
    variant: 'neutral-dark',
    label: 'Neutral dark alert',
    description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.',
    actionLabel: 'Action',
    dismissible: true,
  },
];

// Controlled visibility for dismissible alerts
const dismissedSimple = ref<Record<number, boolean>>({});
const dismissedFull   = ref<Record<number, boolean>>({});

function triggerSimple() {
  dismissedSimple.value = {};
}
function triggerFull() {
  dismissedFull.value = {};
}
function logAction(variant: string) {
  // eslint-disable-next-line no-console
  console.log(`[BTAlert] action clicked — variant: ${variant}`);
}
</script>

<template>
  <section class="showcase-section">
    <h1 class="showcase-section__title">BTAlert</h1>
    <p class="showcase-section__subtitle">
      Figma 681:11285 — 6 variants, optional description, action, dismiss
    </p>

    <!-- ── Simple (no description) ── -->
    <h2 class="showcase-group-title">Simple (no description)</h2>
    <p class="showcase-section__subtitle">Label only — action renders as text link.</p>

    <div class="showcase-alert-trigger-row">
      <button class="showcase-trigger-btn" @click="triggerSimple">
        Reset alerts
      </button>
    </div>

    <div class="showcase-alert-stack">
      <template v-for="(cfg, i) in VARIANTS" :key="cfg.variant">
        <BTAlert
          v-if="!dismissedSimple[i]"
          :variant="cfg.variant"
          :label="cfg.label"
          :action-label="cfg.actionLabel"
          dismissible
          @action="logAction(cfg.variant)"
          @dismiss="dismissedSimple[i] = true"
        />
      </template>
    </div>

    <!-- ── With description ── -->
    <h2 class="showcase-group-title" style="margin-top: 32px;">With description</h2>
    <p class="showcase-section__subtitle">
      Bold label + supporting text — action renders as bordered button.
    </p>

    <div class="showcase-alert-trigger-row">
      <button class="showcase-trigger-btn" @click="triggerFull">
        Reset alerts
      </button>
    </div>

    <div class="showcase-alert-stack">
      <template v-for="(cfg, i) in VARIANTS_WITH_DESC" :key="cfg.variant">
        <BTAlert
          v-if="!dismissedFull[i]"
          :variant="cfg.variant"
          :label="cfg.label"
          :description="cfg.description"
          :action-label="cfg.actionLabel"
          :dismissible="cfg.dismissible"
          @action="logAction(cfg.variant)"
          @dismiss="dismissedFull[i] = true"
        />
      </template>
    </div>
  </section>
</template>

<style scoped>
.showcase-group-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 4px;
  color: var(--text-primary, #292f37);
}

.showcase-alert-trigger-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.showcase-trigger-btn {
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--border-primary, #dbdde1);
  border-radius: 8px;
  background: none;
  cursor: pointer;
  color: var(--text-primary, #292f37);
  transition: background 0.12s;
}

.showcase-trigger-btn:hover {
  background: var(--bg-secondary, #ecedee);
}

.showcase-alert-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 600px;
}
</style>
