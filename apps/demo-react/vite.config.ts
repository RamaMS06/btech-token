import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@ramaMS06/tokens-web'],
  },
  server: {
    watch: {
      ignored: ['!**/packages/tokens-web/**'],
    },
  },
});
