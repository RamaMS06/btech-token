<script setup lang="ts">
/**
 * BTAvatarShowcase v2 — visual smoke test for BTAvatar (molecule) +
 * BTAvatarGroup (organism). Sliced from Figma 497:979 + 504:705.
 *
 * Demonstrates the data-class API: pass a BTAvatarItem (with name,
 * optional imageUrl, optional color) and the component auto-derives
 * initials, falls back image-error → initials, supports skeleton loading.
 */
import { BTAvatar, BTAvatarGroup, type BTAvatarItem } from '@btech/ui-vue';

const SIZES = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const;
const COLORS = ['green', 'blue', 'orange', 'purple', 'teal', 'pink'] as const;

const SAMPLE_ITEMS: BTAvatarItem[] = [
  { name: 'Person 1', imageUrl: 'https://api.dicebear.com/9.x/avataaars/png?seed=1' },
  { name: 'Person 2', imageUrl: 'https://api.dicebear.com/9.x/avataaars/png?seed=2' },
  { name: 'Person 3', imageUrl: 'https://api.dicebear.com/9.x/avataaars/png?seed=3' },
  { name: 'Person 4', imageUrl: 'https://api.dicebear.com/9.x/avataaars/png?seed=4' },
  { name: 'Person 5', imageUrl: 'https://api.dicebear.com/9.x/avataaars/png?seed=5' },
];
</script>

<template>
  <section class="showcase-section">
    <h2 class="showcase-section__title">BTAvatar v2 — Figma 497:979</h2>
    <p class="showcase-section__subtitle">
      Data-class API: pass a BTAvatarItem (name + optional imageUrl + color).
      Initials auto-derived from name. Skeleton loading + image errorBuilder fallback.
    </p>

    <div v-for="color in COLORS" :key="color" class="showcase-row">
      <span class="showcase-row__label">color={{ color }}</span>
      <BTAvatar
        v-for="size in SIZES"
        :key="size"
        :size="size"
        :item="{ name: 'Faisal Lestari', color }"
      />
    </div>

    <div class="showcase-row" style="margin-top: 24px">
      <span class="showcase-row__label">image</span>
      <BTAvatar
        v-for="size in SIZES"
        :key="size"
        :size="size"
        :item="{ name: 'Sample', imageUrl: 'https://api.dicebear.com/9.x/avataaars/png?seed=BTech' }"
      />
    </div>

    <div class="showcase-row">
      <span class="showcase-row__label">isLoading</span>
      <BTAvatar
        v-for="size in SIZES"
        :key="size"
        :size="size"
        :item="{ name: '?' }"
        :is-loading="true"
      />
    </div>

    <!-- Empty state — person icon, bg/subtler (Figma 497:979) -->
    <div class="showcase-row">
      <span class="showcase-row__label">empty (no item)</span>
      <BTAvatar v-for="size in SIZES" :key="size" :size="size" />
    </div>

    <!-- Error state — hide_image icon, bg/subtler (Figma 497:979) -->
    <div class="showcase-row">
      <span class="showcase-row__label">status=error</span>
      <BTAvatar v-for="size in SIZES" :key="size" :size="size" status="error" />
    </div>

    <h2 class="showcase-section__title" style="margin-top: 32px">BTAvatarGroup — Figma 504:705</h2>
    <p class="showcase-section__subtitle">
      Organism — stacks avatars with negative-margin overlap + "+N" overflow counter.
    </p>

    <div v-for="size in SIZES" :key="size" class="showcase-row">
      <span class="showcase-row__label">size={{ size }}</span>
      <BTAvatarGroup :items="SAMPLE_ITEMS" :max="3" :size="size" />
    </div>

    <div class="showcase-row">
      <span class="showcase-row__label">max=4 (no overflow)</span>
      <BTAvatarGroup :items="SAMPLE_ITEMS.slice(0, 3)" :max="4" size="md" />
    </div>
    <div class="showcase-row">
      <span class="showcase-row__label">customOverflow=99</span>
      <BTAvatarGroup :items="SAMPLE_ITEMS" :max="3" :custom-overflow-number="99" size="md" />
    </div>
  </section>
</template>

<style scoped>
.showcase-section {
  padding: 24px;
  border-top: 1px solid var(--btech-color-border-primary, #e5e7eb);
  background: var(--btech-color-bg-primary, #ffffff);
  font-family: var(--btech-typography-font-family-sans, 'Poppins', sans-serif);
}

.showcase-section__title {
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 700;
  color: var(--btech-color-text-primary, #1a1a1a);
}

.showcase-section__subtitle {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--btech-color-text-secondary, #6b7280);
}

.showcase-row {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.showcase-row__label {
  width: 120px;
  font-size: 12px;
  color: var(--btech-color-text-tertiary, #9ca3af);
  font-family: var(--font-family-mono, monospace);
}
</style>
