import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'BtechUiVue',
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: { vue: 'Vue' },
        // Aggregate all imported component CSS into a single styles.css next to
        // the JS bundle. Consumers import once: `@btech/ui-vue/styles.css`.
        assetFileNames: (asset) => (asset.name === 'style.css' ? 'styles.css' : (asset.name ?? 'asset')),
      },
    },
    sourcemap: true,
  },
});
