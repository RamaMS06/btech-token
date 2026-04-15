import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    exclude: ['@ramaMS06/tokens-web'],
  },
  server: {
    watch: {
      ignored: ['!**/packages/tokens-web/**'],
    },
  },
});
