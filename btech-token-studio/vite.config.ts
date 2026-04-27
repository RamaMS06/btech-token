/**
 * Vite build configuration — two targets
 * ----------------------------------------
 * The Figma plugin requires two separate build outputs:
 *
 *   dist/code.js  — Main thread (runs in Figma sandbox, no DOM)
 *     - Bundled as a self-contained IIFE (no ESM imports/exports)
 *     - No external dependencies — everything inlined
 *     - Build mode: `--mode main`
 *
 *   dist/ui.html  — UI iframe (standard browser environment)
 *     - React 18 app, CSS inlined, single HTML file via vite-plugin-singlefile
 *     - Vite's standard app build — index.html as root
 *     - Build mode: `--mode ui`
 *
 * Why two modes instead of two config files?
 *   A single vite.config.ts with mode-switching is easier to maintain than
 *   two separate files and avoids duplicating the resolve / alias config.
 *   The build script in package.json runs both: `vite build --mode main && vite build --mode ui`.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  if (mode === 'main') {
    // ── Main thread build ──────────────────────────────────────────────────
    // Figma's plugin sandbox executes a plain script tag — no module system.
    // IIFE format with no external references is the correct target.
    return {
      build: {
        outDir: 'dist',
        emptyOutDir: true, // Clean dist before the first (main) build
        lib: {
          entry: resolve(__dirname, 'src/main/code.ts'),
          name: 'code',
          fileName: () => 'code.js',
          formats: ['iife'],
        },
        rollupOptions: {
          // All deps must be bundled — the sandbox has no module loader
          external: [],
          output: {
            // Figma's sandbox doesn't support ESM — IIFE only
            format: 'iife',
            inlineDynamicImports: true,
          },
        },
        // Minification is optional but keeps the dist file small
        minify: false,
        sourcemap: false,
      },
    };
  }

  // ── UI build ─────────────────────────────────────────────────────────────
  // Standard Vite app build with React, inlined to a single HTML file so
  // the entire UI lives in dist/ui.html (required by Figma's ui manifest key).
  //
  // vite-plugin-singlefile rewrites the HTML to inline all JS and CSS assets.
  // The HTML output filename is derived from the input key in rollupOptions —
  // keying the input as "ui" causes Rollup to emit "ui.html" (not "index.html").
  return {
    root: resolve(__dirname, 'src/ui'),
    plugins: [
      react(),
      viteSingleFile(),
    ],
    build: {
      outDir: resolve(__dirname, 'dist'),
      emptyOutDir: false,
      rollupOptions: {
        // Key "ui" → output becomes dist/ui.html, which matches manifest.json
        input: { ui: resolve(__dirname, 'src/ui/index.html') },
        output: {
          entryFileNames: '[name].js',
          assetFileNames: '[name].[ext]',
        },
      },
      // target: 'esnext' gives us modern JS features in the iframe
      target: 'esnext',
      minify: false,
      sourcemap: false,
    },
    resolve: {
      alias: {
        // Allow importing from shared without ../ traversal issues
        '@shared': resolve(__dirname, 'src/shared'),
      },
    },
  };
});
