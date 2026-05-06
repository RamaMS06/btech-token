<script setup lang="ts">
import { ref } from 'vue';
import { BTModal } from '@btech/ui-vue';
import type { BTModalSize } from '@btech/ui-vue';

const activeTab = ref<'ui' | 'usage'>('ui');

// ── Usage tab playground state ────────────────────────────────────────────
const open = ref(false);
const size = ref<BTModalSize>('sm');
const hasClose = ref(true);
const hasFooter = ref(true);
const hasSecondaryButton = ref(true);
const hasCheckbox = ref(false);

const sizes: BTModalSize[] = ['sm', 'md', 'lg'];

const tabBtnStyle = (active: boolean) => ({
  padding: '6px 14px',
  fontSize: '12px',
  fontWeight: 500,
  border: '1px solid var(--border-primary)',
  borderRadius: '8px',
  background: active ? 'var(--bg-secondary)' : 'none',
  color: 'var(--text-primary)',
  cursor: 'pointer',
});

const ctlBtnStyle = {
  padding: '6px 14px',
  fontSize: '12px',
  fontWeight: 500,
  border: '1px solid var(--border-primary)',
  borderRadius: '8px',
  background: 'var(--color-brand-primary)',
  color: 'var(--text-inverse)',
  cursor: 'pointer',
};
</script>

<template>
  <section class="showcase-section">
    <h1 class="showcase-section__title">BTModal</h1>
    <p class="showcase-section__subtitle">
      Figma 2123:1992 (D-Modal) — 3 sizes, header + content + footer, primary/secondary/checkbox/close
    </p>

    <!-- Tabs -->
    <div style="display: flex; gap: 8px; margin-bottom: 24px;">
      <button :style="tabBtnStyle(activeTab === 'ui')" @click="activeTab = 'ui'">UI</button>
      <button :style="tabBtnStyle(activeTab === 'usage')" @click="activeTab = 'usage'">Usage</button>
    </div>

    <!-- ── UI tab ─────────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'ui'">
      <div
        v-for="s in sizes"
        :key="s"
        class="showcase-row"
        style="flex-direction: column; align-items: flex-start; margin-bottom: 32px;"
      >
        <span class="showcase-row__label">size = {{ s }}</span>
        <div style="position: relative; width: 100%;">
          <!-- Static panel: forced visible, embedded inline (no portal) -->
          <div :class="`bt-modal-panel bt-modal-panel--${s}`" style="position: relative; margin: 0;">
            <div class="bt-modal-header">
              <h2 class="bt-modal-title">Modal title — {{ s }}</h2>
              <p class="bt-modal-subtext">Supporting subtext describing what this modal does.</p>
              <button type="button" class="bt-modal-close" aria-label="Close">
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3.5 3.5 L12.5 12.5 M12.5 3.5 L3.5 12.5"
                        stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
                </svg>
              </button>
            </div>
            <div class="bt-modal-footer">
              <button type="button" class="bt-modal-btn bt-modal-btn--secondary">Cancel</button>
              <button type="button" class="bt-modal-btn bt-modal-btn--primary">Confirm</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Variant: no close button -->
      <div class="showcase-row" style="flex-direction: column; align-items: flex-start; margin-bottom: 32px;">
        <span class="showcase-row__label">hasClose = false</span>
        <div class="bt-modal-panel bt-modal-panel--sm" style="position: relative;">
          <div class="bt-modal-header">
            <h2 class="bt-modal-title">No close button</h2>
            <p class="bt-modal-subtext">Force users to choose an action.</p>
          </div>
          <div class="bt-modal-footer">
            <button type="button" class="bt-modal-btn bt-modal-btn--secondary">Cancel</button>
            <button type="button" class="bt-modal-btn bt-modal-btn--primary">Confirm</button>
          </div>
        </div>
      </div>

      <!-- Variant: with checkbox -->
      <div class="showcase-row" style="flex-direction: column; align-items: flex-start;">
        <span class="showcase-row__label">hasCheckbox = true</span>
        <div class="bt-modal-panel bt-modal-panel--sm" style="position: relative;">
          <div class="bt-modal-header">
            <h2 class="bt-modal-title">Modal with checkbox</h2>
            <p class="bt-modal-subtext">Footer left side hosts a checkbox + label.</p>
            <button type="button" class="bt-modal-close" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3.5 3.5 L12.5 12.5 M12.5 3.5 L3.5 12.5"
                      stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <div class="bt-modal-footer">
            <div class="bt-modal-footer__left">
              <input id="static-cbx" type="checkbox" class="bt-modal-footer__checkbox">
              <label for="static-cbx" class="bt-modal-footer__checkbox-label">Don't show again</label>
            </div>
            <button type="button" class="bt-modal-btn bt-modal-btn--secondary">Cancel</button>
            <button type="button" class="bt-modal-btn bt-modal-btn--primary">Confirm</button>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Usage tab ─────────────────────────────────────────────────────── -->
    <div v-if="activeTab === 'usage'">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-width: 600px; margin-bottom: 24px;">
        <label style="display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: var(--text-secondary);">
          Size
          <select v-model="size" style="padding: 6px; border: 1px solid var(--border-primary); border-radius: 4px;">
            <option value="sm">sm (500 px)</option>
            <option value="md">md (720 px)</option>
            <option value="lg">lg (1042 px)</option>
          </select>
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-primary);">
          <input type="checkbox" v-model="hasClose"> Has close
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-primary);">
          <input type="checkbox" v-model="hasFooter"> Has footer
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-primary);">
          <input type="checkbox" v-model="hasSecondaryButton"> Has secondary button
        </label>
        <label style="display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-primary);">
          <input type="checkbox" v-model="hasCheckbox"> Has checkbox
        </label>
      </div>

      <button :style="ctlBtnStyle" @click="open = true">Open Modal</button>

      <BTModal
        v-model:open="open"
        title="Confirm action"
        subtext="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
        :size="size"
        :has-close="hasClose"
        :has-footer="hasFooter"
        :has-secondary-button="hasSecondaryButton"
        :has-checkbox="hasCheckbox"
        @primary="open = false"
        @secondary="open = false"
      >
        <p style="font-size: 14px; color: var(--text-primary); line-height: 1.5;">
          This is an optional content slot. Anything passed via the default slot
          renders inside the white header section, below the title.
        </p>
      </BTModal>
    </div>
  </section>
</template>
