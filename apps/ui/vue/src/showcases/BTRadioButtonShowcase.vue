<!-- Auto-generated showcase — do not edit manually -->
<script setup lang="ts">
import { ref } from 'vue';
import { BTRadioButton } from '@btech/ui-vue';

const selected = ref<string>('active');
</script>

<template>
  <section class="showcase-section">
    <h2 class="showcase-section__title">Atoms › RadioButton — Figma 555:3529</h2>

    <!-- 5 states -->
    <div class="showcase-row" style="align-items: flex-start;">
      <BTRadioButton v-model="selected" value="default" label="Default" />
      <BTRadioButton v-model="selected" value="active" label="Active" />
      <BTRadioButton v-model="selected" value="disabled" label="Disable" :disabled="true" />
      <BTRadioButton v-model="selected" value="dis-active" label="Disable Active" :disabled="true" />
      <BTRadioButton v-model="selected" value="error" label="Error" :error="true" />
    </div>

    <!-- With subtext -->
    <div class="showcase-row" style="align-items: flex-start; margin-top: 16px;">
      <BTRadioButton v-model="selected" value="s-a" label="Label" subtext="Subtext" />
      <BTRadioButton v-model="selected" value="s-b" label="Label" subtext="Subtext" />
      <BTRadioButton v-model="selected" value="s-err" label="Label" subtext="Error message" :error="true" />
    </div>

    <p style="font-size: 12px; color: #9ca3af; margin-top: 12px;">
      Selected: <code>{{ selected }}</code>
    </p>
  </section>
</template>
