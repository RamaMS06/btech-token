<script setup lang="ts">
// BTSliderShowcase — Figma 434:7617
import { ref } from 'vue';
import { BTSlider } from '@btech/ui-vue';

const single    = ref(40);
const secondary = ref(60);
const destr     = ref(75);
const vertical  = ref(55);
const rangeFrom = ref(20);
const rangeTo   = ref(80);
const disabled  = ref(30);
</script>

<template>
  <section class="showcase-section">
    <h2 class="showcase-section__title">BTSlider — Figma 434:7617</h2>
    <p class="showcase-section__subtitle">
      3 types (default · range · vertical) × 3 variants (primary · secondary · destructive) ·
      tooltip · disabled state.
    </p>

    <!-- Default type — all 3 variants -->
    <div class="showcase-row">
      <span class="showcase-row__label">primary</span>
      <div class="showcase-row__items" style="width: 300px;">
        <BTSlider v-model:value="single" />
      </div>
    </div>

    <div class="showcase-row">
      <span class="showcase-row__label">secondary</span>
      <div class="showcase-row__items" style="width: 300px;">
        <BTSlider v-model:value="secondary" variant="secondary" />
      </div>
    </div>

    <div class="showcase-row">
      <span class="showcase-row__label">destructive</span>
      <div class="showcase-row__items" style="width: 300px;">
        <BTSlider v-model:value="destr" variant="destructive" />
      </div>
    </div>

    <!-- No tooltip -->
    <div class="showcase-row" style="margin-top: 16px;">
      <span class="showcase-row__label">no tooltip</span>
      <div class="showcase-row__items" style="width: 300px;">
        <BTSlider v-model:value="single" :show-tooltip="false" />
      </div>
    </div>

    <!-- Disabled -->
    <div class="showcase-row">
      <span class="showcase-row__label">disabled</span>
      <div class="showcase-row__items" style="width: 300px;">
        <BTSlider v-model:value="disabled" :disabled="true" />
      </div>
    </div>

    <!-- Range type -->
    <div class="showcase-row" style="margin-top: 16px;">
      <span class="showcase-row__label">range</span>
      <div class="showcase-row__items" style="width: 300px;">
        <BTSlider
          type="range"
          v-model:startValue="rangeFrom"
          v-model:endValue="rangeTo"
        />
      </div>
    </div>

    <div class="showcase-row">
      <span class="showcase-row__label">range destr.</span>
      <div class="showcase-row__items" style="width: 300px;">
        <BTSlider
          type="range"
          variant="destructive"
          v-model:startValue="rangeFrom"
          v-model:endValue="rangeTo"
        />
      </div>
    </div>

    <!-- Vertical type -->
    <div class="showcase-row" style="margin-top: 16px; align-items: flex-start;">
      <span class="showcase-row__label" style="padding-top: 8px;">vertical</span>
      <div class="showcase-row__items" style="gap: 32px;">
        <BTSlider type="vertical" v-model:value="vertical" />
        <BTSlider type="vertical" variant="secondary" v-model:value="vertical" />
        <BTSlider type="vertical" variant="destructive" v-model:value="vertical" />
        <BTSlider type="vertical" :disabled="true" v-model:value="disabled" />
      </div>
    </div>

    <!-- Value display -->
    <div class="showcase-row" style="margin-top: 16px;">
      <span class="showcase-row__label">values</span>
      <div class="showcase-row__items" style="font-size: 11px; color: var(--btech-color-text-tertiary, #9ca3af); font-family: monospace;">
        single={{ single }} · range={{ rangeFrom }}–{{ rangeTo }} · vertical={{ vertical }}
      </div>
    </div>
  </section>
</template>
