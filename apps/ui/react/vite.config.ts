import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Resolve workspace UI packages directly from source so HMR works
    // without needing `pnpm build` after each edit.
    alias: {
      '@btech/ui-react': resolve(__dirname, '../../../packages/ui/react/src'),
    },
  },
  optimizeDeps: {
    exclude: ['@btech/tokens', '@btech/tokens-bspace', '@btech/ui-react'],
  },
  server: {
    port: 5178,
    watch: {
      // Un-ignore workspace source paths so Vite HMR picks up changes.
      ignored: [
        '!**/packages/tokens/platforms/web/**',
        '!**/packages/ui/react/src/**',
      ],
    },
  },
});
