import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    exclude: ['@btech/tokens', '@btech/tokens-bspace'],
  },
  server: {
    watch: {
      ignored: ['!**/packages/tokens/platforms/web/**'],
    },
  },
});
