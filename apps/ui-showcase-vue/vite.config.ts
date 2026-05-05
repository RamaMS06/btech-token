import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    // Resolve workspace UI packages directly from source so HMR works
    // without needing `pnpm build` after each edit.
    alias: {
      // Map to directory so both `@btech/ui-vue` (→ index.ts) and
      // `@btech/ui-vue/styles.css` (→ src/styles.css) resolve correctly.
      '@btech/ui-vue': resolve(__dirname, '../../packages/ui/vue/src'),
    },
  },
  optimizeDeps: {
    exclude: ['@btech/tokens', '@btech/tokens-bspace', '@btech/ui-vue'],
  },
  server: {
    port: 5179,
    watch: {
      // Un-ignore workspace source paths so Vite HMR picks up changes.
      ignored: [
        '!**/packages/tokens/platforms/web/**',
        '!**/packages/ui/vue/src/**',
      ],
    },
  },
});
