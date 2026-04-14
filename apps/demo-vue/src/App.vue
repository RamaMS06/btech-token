<script setup lang="ts">
import '@btech/tokens-web/styles.css';
import TenantDemo from './TenantDemo.vue';
</script>

<template>
  <div class="ds-page">
    <header class="ds-header">
      <h1>@btech/tokens-vue · Multi-Tenant Demo</h1>
      <p>One <code>&lt;Button&gt;</code> component · Three brand identities</p>
    </header>

    <main class="ds-grid">
      <TenantDemo tenant="default"    label="Default Tenant (Green)" />
      <TenantDemo tenant="tenant-a"   label="Tenant A (Blue · radius 4px)" />
      <TenantDemo tenant="tenant-bjb" label="Tenant BJB (Deep Blue · tight)" />
    </main>

    <footer class="ds-footer">
      <code>tokenPlugin({ tenant }) → sets data-tenant on &lt;html&gt; → CSS vars cascade</code>
    </footer>
  </div>
</template>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: Inter, system-ui, sans-serif; background: #f9fafb; color: #111827; min-height: 100vh; }
</style>

<style scoped>
.ds-page { display: flex; flex-direction: column; gap: 2rem; padding: 2rem; max-width: 960px; margin: 0 auto; }
.ds-header { text-align: center; }
.ds-header h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: .5rem; }
.ds-header p  { color: #6b7280; font-size: .95rem; }
.ds-header code { background: #f3f4f6; padding: 1px 6px; border-radius: 4px; font-size: .875rem; }
.ds-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.5rem; }
.ds-footer { text-align: center; }
.ds-footer code { font-size: .8rem; color: #9ca3af; background: #f3f4f6; padding: 6px 12px; border-radius: 6px; display: inline-block; }
</style>
