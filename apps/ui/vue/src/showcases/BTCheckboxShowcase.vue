<script setup lang="ts">
// BTCheckboxShowcase — Figma 504:4181
import { ref } from 'vue';
import { BTCheckbox } from '@btech/ui-vue';

const interactive = ref(false);
</script>

<template>
  <section class="showcase-section">
    <h2 class="showcase-section__title">BTCheckbox — Figma 504:4181</h2>
    <p class="showcase-section__subtitle">
      7 states · optional label + subtext · indeterminate via prop ·
      error border + subtext colour.
    </p>

    <!-- Box only — all 7 states -->
    <div class="showcase-row">
      <span class="showcase-row__label">uncheck</span>
      <div class="showcase-row__items">
        <BTCheckbox :model-value="false" />
      </div>
    </div>

    <div class="showcase-row">
      <span class="showcase-row__label">check</span>
      <div class="showcase-row__items">
        <BTCheckbox :model-value="true" />
      </div>
    </div>

    <div class="showcase-row">
      <span class="showcase-row__label">indeterminate</span>
      <div class="showcase-row__items">
        <BTCheckbox :model-value="false" :indeterminate="true" />
      </div>
    </div>

    <div class="showcase-row">
      <span class="showcase-row__label">disable uncheck</span>
      <div class="showcase-row__items">
        <BTCheckbox :model-value="false" :disabled="true" />
      </div>
    </div>

    <div class="showcase-row">
      <span class="showcase-row__label">disable check</span>
      <div class="showcase-row__items">
        <BTCheckbox :model-value="true" :disabled="true" />
      </div>
    </div>

    <div class="showcase-row">
      <span class="showcase-row__label">disable indet.</span>
      <div class="showcase-row__items">
        <BTCheckbox :model-value="false" :indeterminate="true" :disabled="true" />
      </div>
    </div>

    <div class="showcase-row">
      <span class="showcase-row__label">error</span>
      <div class="showcase-row__items">
        <BTCheckbox :model-value="false" :error="true" />
      </div>
    </div>

    <!-- With label -->
    <div class="showcase-row" style="margin-top: 16px;">
      <span class="showcase-row__label">with label</span>
      <div class="showcase-row__items">
        <BTCheckbox :model-value="false" label="Accept terms" />
        <BTCheckbox :model-value="true" label="Checked" />
        <BTCheckbox :model-value="false" :disabled="true" label="Disabled" />
      </div>
    </div>

    <!-- With label + subtext -->
    <div class="showcase-row">
      <span class="showcase-row__label">with subtext</span>
      <div class="showcase-row__items">
        <BTCheckbox
          :model-value="false"
          label="Subscribe"
          subtext="Receive weekly digest"
        />
        <BTCheckbox
          :model-value="false"
          :error="true"
          label="Required"
          subtext="Please accept to continue"
        />
        <BTCheckbox
          :model-value="true"
          :disabled="true"
          label="Locked"
          subtext="Cannot be changed"
        />
      </div>
    </div>

    <!-- Interactive -->
    <div class="showcase-row" style="margin-top: 16px;">
      <span class="showcase-row__label">interactive</span>
      <div class="showcase-row__items">
        <BTCheckbox
          v-model="interactive"
          label="Toggle me"
          :subtext="interactive ? 'Checked ✓' : 'Unchecked'"
        />
      </div>
    </div>
  </section>
</template>
