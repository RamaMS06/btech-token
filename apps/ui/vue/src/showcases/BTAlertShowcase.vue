<script setup lang="ts">
import { ref } from 'vue';
import { BTAlert, BTAlertContainer, useAlert } from '@btech/ui-vue';
import type { BTAlertVariant } from '@btech/ui-vue';

// ── Tab state ─────────────────────────────────────────────────────────────────
const activeTab = ref<'ui' | 'usage'>('ui');

// ── UI tab state ──────────────────────────────────────────────────────────────
interface AlertConfig {
  variant: BTAlertVariant;
  label: string;
  description?: string;
  linkLabel?: string;
  actionLabel?: string;
  dismissible?: boolean;
}

const SIMPLE: AlertConfig[] = [
  { variant: 'info',         label: 'Info alert',         actionLabel: 'Action' },
  { variant: 'success',      label: 'Success alert',      actionLabel: 'Action' },
  { variant: 'error',        label: 'Error alert',        actionLabel: 'Action' },
  { variant: 'warning',      label: 'Warning alert',      actionLabel: 'Action' },
  { variant: 'neutral',      label: 'Neutral alert',      actionLabel: 'Action' },
  { variant: 'neutral-dark', label: 'Neutral dark alert', actionLabel: 'Action' },
];

const WITH_DESC: AlertConfig[] = [
  { variant: 'info',         label: 'Info alert',         description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.', linkLabel: 'Learn more', actionLabel: 'Action', dismissible: true },
  { variant: 'success',      label: 'Success alert',      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.', linkLabel: 'Learn more', actionLabel: 'Action', dismissible: true },
  { variant: 'error',        label: 'Error alert',        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.', linkLabel: 'Learn more', actionLabel: 'Action', dismissible: true },
  { variant: 'warning',      label: 'Warning alert',      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.', linkLabel: 'Learn more', actionLabel: 'Action', dismissible: true },
  { variant: 'neutral',      label: 'Neutral alert',      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.', linkLabel: 'Learn more', actionLabel: 'Action', dismissible: true },
  { variant: 'neutral-dark', label: 'Neutral dark alert', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing.', linkLabel: 'Learn more', actionLabel: 'Action', dismissible: true },
];

const dismissedSimple = ref<Record<number, boolean>>({});
const dismissedFull   = ref<Record<number, boolean>>({});

// ── Usage tab ─────────────────────────────────────────────────────────────────
const { show } = useAlert();

const SHOW_CONFIGS: Array<{ variant: BTAlertVariant; label: string; description?: string; withDesc: boolean }> = [
  { variant: 'info',         label: 'Info — simple',          withDesc: false },
  { variant: 'success',      label: 'Success — simple',       withDesc: false },
  { variant: 'error',        label: 'Error — simple',         withDesc: false },
  { variant: 'warning',      label: 'Warning — simple',       withDesc: false },
  { variant: 'neutral',      label: 'Neutral — simple',       withDesc: false },
  { variant: 'neutral-dark', label: 'Neutral dark — simple',  withDesc: false },
  { variant: 'info',         label: 'Info — with description',    description: 'Something needs your attention right now.',     withDesc: true },
  { variant: 'success',      label: 'Success — with description', description: 'Your changes have been saved successfully.',     withDesc: true },
  { variant: 'error',        label: 'Error — with description',   description: 'Could not complete the request. Try again.',     withDesc: true },
  { variant: 'warning',      label: 'Warning — with description', description: 'This action may have unintended side effects.', withDesc: true },
];

function triggerAlert(cfg: typeof SHOW_CONFIGS[0]) {
  show({
    variant: cfg.variant,
    label: cfg.label,
    description: cfg.description,
    linkLabel: cfg.description ? 'Learn more' : undefined,
    actionLabel: 'Action',
    dismissible: true,
    duration: 5000,
    onAction: () => console.log(`[BTAlert] action — ${cfg.variant}`),
    onLink: () => console.log(`[BTAlert] link — ${cfg.variant}`),
  });
}
</script>

<template>
  <section class="showcase-section">
    <h1 class="showcase-section__title">BTAlert</h1>
    <p class="showcase-section__subtitle">
      Figma 681:11285 — 6 variants, optional description, inline link, action, dismiss
    </p>

    <!-- ── Tabs ── -->
    <div class="showcase-tabs">
      <button
        class="showcase-tab"
        :class="{ 'showcase-tab--active': activeTab === 'ui' }"
        @click="activeTab = 'ui'"
      >
        UI
      </button>
      <button
        class="showcase-tab"
        :class="{ 'showcase-tab--active': activeTab === 'usage' }"
        @click="activeTab = 'usage'"
      >
        Usage
      </button>
    </div>

    <!-- ── Tab: UI ── -->
    <div v-if="activeTab === 'ui'" class="showcase-tab-content">

      <!-- Simple -->
      <h2 class="showcase-group-title">Simple (no description)</h2>
      <p class="showcase-section__subtitle">Label only — action renders as text link.</p>
      <div class="showcase-alert-trigger-row">
        <button class="showcase-trigger-btn" @click="dismissedSimple = {}">Reset alerts</button>
      </div>
      <div class="showcase-alert-stack">
        <template v-for="(cfg, i) in SIMPLE" :key="cfg.variant">
          <BTAlert
            v-if="!dismissedSimple[i]"
            :variant="cfg.variant"
            :label="cfg.label"
            :action-label="cfg.actionLabel"
            dismissible
            @dismiss="dismissedSimple[i] = true"
          />
        </template>
      </div>

      <!-- With description + link -->
      <h2 class="showcase-group-title" style="margin-top: 32px;">With description + link</h2>
      <p class="showcase-section__subtitle">Bold label + text + inline link — action renders as bordered button.</p>
      <div class="showcase-alert-trigger-row">
        <button class="showcase-trigger-btn" @click="dismissedFull = {}">Reset alerts</button>
      </div>
      <div class="showcase-alert-stack">
        <template v-for="(cfg, i) in WITH_DESC" :key="cfg.variant">
          <BTAlert
            v-if="!dismissedFull[i]"
            :variant="cfg.variant"
            :label="cfg.label"
            :description="cfg.description"
            :link-label="cfg.linkLabel"
            :action-label="cfg.actionLabel"
            :dismissible="cfg.dismissible"
            @dismiss="dismissedFull[i] = true"
          />
        </template>
      </div>
    </div>

    <!-- ── Tab: Usage ── -->
    <div v-if="activeTab === 'usage'" class="showcase-tab-content">
      <h2 class="showcase-group-title">showAlert — programmatic trigger</h2>
      <p class="showcase-section__subtitle">
        Each button calls <code>useAlert().show()</code>. Alerts appear bottom-right, auto-dismiss after 5s.
      </p>
      <div class="showcase-usage-grid">
        <button
          v-for="cfg in SHOW_CONFIGS"
          :key="`${cfg.variant}-${cfg.withDesc}`"
          class="showcase-trigger-btn"
          @click="triggerAlert(cfg)"
        >
          {{ cfg.label }}
        </button>
      </div>
    </div>

    <!-- ── Alert container (renders in body via Teleport) ── -->
    <BTAlertContainer />
  </section>
</template>

<style scoped>
.showcase-group-title { font-size: 15px; font-weight: 600; margin: 0 0 4px; color: var(--text-primary); }
.showcase-alert-trigger-row { display: flex; gap: 8px; margin-bottom: 16px; }
.showcase-trigger-btn { padding: 6px 14px; font-size: 12px; font-weight: 500; border: 1px solid var(--border-primary); border-radius: 8px; background: none; cursor: pointer; color: var(--text-primary); transition: background 0.12s; }
.showcase-trigger-btn:hover { background: var(--bg-secondary); }
.showcase-alert-stack { display: flex; flex-direction: column; gap: 8px; max-width: 600px; }
.showcase-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border-primary); margin-bottom: 24px; }
.showcase-tab { padding: 8px 20px; font-size: 13px; font-weight: 500; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; color: var(--text-secondary); transition: color 0.12s, border-color 0.12s; }
.showcase-tab--active { color: var(--text-primary); border-bottom-color: var(--text-primary); }
.showcase-usage-grid { display: flex; flex-wrap: wrap; gap: 8px; max-width: 700px; }
</style>
