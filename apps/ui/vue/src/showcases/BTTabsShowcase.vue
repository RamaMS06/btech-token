<script setup lang="ts">
/**
 * BTTabsShowcase — visual smoke test for BTTabs (molecule).
 * Sliced from Figma node 1:53 · Base/TabItem 434:5262.
 *
 * Demonstrates: segmented + line variants, scrollable + centering,
 * disabled tabs, optional leading/trailing icon slots.
 */
import { ref } from 'vue';
import { BTTabs } from '@btech/ui-vue';

const segActive = ref(0);
const lineActive = ref(0);
const scrollSegActive = ref(0);
const scrollLineActive = ref(0);
const iconActive = ref(0);
const disabledActive = ref(0);

const BASIC_TABS = [
  { label: 'Overview' },
  { label: 'Details' },
  { label: 'History' },
];

const MANY_TABS = [
  { label: 'Dashboard' },
  { label: 'Analytics' },
  { label: 'Reports' },
  { label: 'Transactions' },
  { label: 'Customers' },
  { label: 'Products' },
  { label: 'Settings' },
  { label: 'Billing' },
];

const ICON_TABS = [
  { label: 'List' },
  { label: 'Grid' },
  { label: 'Map' },
];

const DISABLED_TABS = [
  { label: 'Active' },
  { label: 'Disabled', disabled: true },
  { label: 'Other' },
];
</script>

<template>
  <section class="showcase-section">
    <h2 class="showcase-section__title">BTTabs — Figma 1:53</h2>
    <p class="showcase-section__subtitle">
      Sliding indicator (not opacity toggle). scrollable auto-centers selected tab.
    </p>

    <!-- Segmented -->
    <div class="showcase-row" style="flex-direction: column; align-items: flex-start; gap: 12px;">
      <span class="showcase-row__label">segmented</span>
      <BTTabs
        variant="segmented"
        :tabs="BASIC_TABS"
        v-model:activeIndex="segActive"
      />
      <span style="font-size: 12px; color: #9ca3af">active: {{ BASIC_TABS[segActive].label }}</span>
    </div>

    <!-- Line -->
    <div class="showcase-row" style="flex-direction: column; align-items: flex-start; gap: 12px; margin-top: 24px;">
      <span class="showcase-row__label">line</span>
      <BTTabs
        variant="line"
        :tabs="BASIC_TABS"
        v-model:activeIndex="lineActive"
      />
      <span style="font-size: 12px; color: #9ca3af">active: {{ BASIC_TABS[lineActive].label }}</span>
    </div>

    <!-- Scrollable segmented (many tabs, constrained width) -->
    <div class="showcase-row" style="flex-direction: column; align-items: flex-start; gap: 12px; margin-top: 24px;">
      <span class="showcase-row__label">scrollable segmented</span>
      <div style="width: 320px; overflow: hidden;">
        <BTTabs
          variant="segmented"
          :tabs="MANY_TABS"
          :scrollable="true"
          v-model:activeIndex="scrollSegActive"
        />
      </div>
      <span style="font-size: 12px; color: #9ca3af">active: {{ MANY_TABS[scrollSegActive].label }}</span>
    </div>

    <!-- Scrollable line (many tabs, constrained width) -->
    <div class="showcase-row" style="flex-direction: column; align-items: flex-start; gap: 12px; margin-top: 24px;">
      <span class="showcase-row__label">scrollable line</span>
      <div style="width: 320px; overflow: hidden;">
        <BTTabs
          variant="line"
          :tabs="MANY_TABS"
          :scrollable="true"
          v-model:activeIndex="scrollLineActive"
        />
      </div>
      <span style="font-size: 12px; color: #9ca3af">active: {{ MANY_TABS[scrollLineActive].label }}</span>
    </div>

    <!-- With icons (leading) -->
    <div class="showcase-row" style="flex-direction: column; align-items: flex-start; gap: 12px; margin-top: 24px;">
      <span class="showcase-row__label">segmented + leading icons</span>
      <BTTabs
        variant="segmented"
        :tabs="ICON_TABS"
        v-model:activeIndex="iconActive"
      >
        <template #leading-icon-0>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        </template>
        <template #leading-icon-1>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        </template>
        <template #leading-icon-2>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
        </template>
      </BTTabs>
    </div>

    <!-- Disabled tab -->
    <div class="showcase-row" style="flex-direction: column; align-items: flex-start; gap: 12px; margin-top: 24px;">
      <span class="showcase-row__label">disabled tab</span>
      <BTTabs
        variant="segmented"
        :tabs="DISABLED_TABS"
        v-model:activeIndex="disabledActive"
      />
      <BTTabs
        variant="line"
        :tabs="DISABLED_TABS"
        v-model:activeIndex="disabledActive"
        style="margin-top: 8px;"
      />
    </div>
  </section>
</template>
