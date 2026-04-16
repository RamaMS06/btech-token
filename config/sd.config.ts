import StyleDictionary from 'style-dictionary';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, readFileSync, writeFileSync, readdirSync } from 'fs';

import { ROOT, flattenDTCG, resolveRef } from './generators/utils.js';
import { loadTokenData } from './generators/token-loader.js';
import { generateDartFiles } from './generators/dart/dart-generator.js';
import { dartTenantsFormat } from './generators/dart/dart-tenant-format.js';
import { generateTsFiles } from './generators/web/web-generator.js';
import { generateTokenTypes } from './generators/web/web-token-types.js';
import { appendTenantCSS } from './generators/web/web-tenant-css.js';
import {
  loadFontRegistry,
  generateDartFontRegistry,
  generateWebFontRegistry,
  prependGoogleFontsCssImport,
} from './generators/font-registry-generator.js';

// =============================================================================
// Register custom Style Dictionary formats
// =============================================================================
StyleDictionary.registerFormat(dartTenantsFormat);

// =============================================================================
// Output paths
// =============================================================================
const DART_OUT = `${ROOT}/packages/tokens-dart/lib/src/`;
const WEB_OUT  = `${ROOT}/packages/tokens-web/dist/`;
const WEB_SRC  = `${ROOT}/packages/tokens-web/src/`;

mkdirSync(DART_OUT, { recursive: true });
mkdirSync(WEB_OUT,  { recursive: true });
mkdirSync(WEB_SRC,  { recursive: true });

// =============================================================================
// Style Dictionary — CSS custom properties + tenant.dart
// =============================================================================
const BASE_SOURCE = [
  `${ROOT}/tokens/core/**/*.json`,
  `${ROOT}/tokens/semantic/**/*.json`,
  `${ROOT}/tokens/components/**/*.json`,
];

const sd = new StyleDictionary({
  source: BASE_SOURCE,
  platforms: {
    // CSS custom properties → packages/tokens-web/dist/styles.css (:root block)
    css: {
      transformGroup: 'css',
      prefix: 'btech',
      buildPath: WEB_OUT,
      files: [{
        destination: 'styles.css',
        format: 'css/variables',
        options: { outputReferences: true, selector: ':root' },
      }],
    },

    // Dart tenant constants → packages/tokens-dart/lib/src/tenant.dart
    dart: {
      transformGroup: 'css',
      buildPath: DART_OUT,
      files: [{
        destination: 'tenant.dart',
        format: 'custom/dart-tenants',
      }],
    },
  },
});

// =============================================================================
// Main
// =============================================================================
(async () => {
  // Load all token data once — shared by all generators
  const data = loadTokenData();

  // Load font registry — drives font-loading decisions across all platforms
  const fontRegistry = loadFontRegistry();

  // Generate multi-file Dart output
  generateDartFiles(data);
  // Dart: font_registry.dart (BTechFontRegistry.isGoogleFont / isSystemFont)
  generateDartFontRegistry(`${DART_OUT}typography`, fontRegistry);
  console.log('  Flutter — multi-file token output generated');

  // Generate multi-file TypeScript output (framework-agnostic, in tokens-web/src/)
  generateTsFiles(data, WEB_SRC);
  // Web: font-registry.ts (fontRegistry map + buildGoogleFontsUrl)
  generateWebFontRegistry(`${WEB_SRC}/typography`, fontRegistry);
  console.log('  Web (shared) — multi-file token output generated');

  // Generate typed token() helper + TokenPath union type
  generateTokenTypes(WEB_SRC);
  console.log('  Token types  — token.ts + TokenPath generated');

  // Build Style Dictionary platforms (CSS + tenant.dart)
  await sd.buildAllPlatforms();

  // Post-build: strip `-default` suffix from CSS variable names & references
  // SD emits `--btech-color-background-primary-default`; we want the clean form.
  const cssPath = `${WEB_OUT}styles.css`;
  const rawCss  = readFileSync(cssPath, 'utf8');
  const cleanedCss = rawCss
    .replace(/--btech-([a-z0-9-]+)-default([\s:);,])/g, '--btech-$1$2')
    .replace(/--btech-([a-z0-9-]+)-default([\s:);,])/g, '--btech-$1$2'); // twice for chained refs
  writeFileSync(cssPath, cleanedCss, 'utf8');

  // Post-build: prepend Google Fonts @import to styles.css
  prependGoogleFontsCssImport(cssPath, fontRegistry);

  // Post-build: append [data-tenant="*"] overrides to styles.css
  const coreTokenFiles = [
    ...readdirSync(`${ROOT}/tokens/core`).map((f: string) => `${ROOT}/tokens/core/${f}`),
    ...readdirSync(`${ROOT}/tokens/semantic`).map((f: string) => `${ROOT}/tokens/semantic/${f}`),
  ];
  const rawBaseMap: Record<string, string> = {};
  for (const file of coreTokenFiles) {
    if (!file.endsWith('.json')) continue;
    Object.assign(rawBaseMap, flattenDTCG(JSON.parse(readFileSync(file, 'utf-8'))));
  }
  const resolvedBaseMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawBaseMap)) resolvedBaseMap[k] = resolveRef(v, rawBaseMap);
  for (const [k, v] of Object.entries(resolvedBaseMap)) resolvedBaseMap[k] = resolveRef(v, resolvedBaseMap);
  appendTenantCSS(resolvedBaseMap);

  console.log('\n pnpm generate complete\n');
  console.log('  Flutter   → packages/tokens-dart/lib/src/{color,spacing,radius,typography}/');
  console.log('                 packages/tokens-dart/lib/src/tenant.dart');
  console.log('  Web       → packages/tokens-web/src/{color,spacing,radius,typography}/');
  console.log('                 packages/tokens-web/src/token.ts (TokenPath + token())');
  console.log('                 packages/tokens-web/dist/styles.css');
  console.log('  React/Vue → re-export from @ramaMS06/tokens-web (no separate generation)');
  console.log('');
})();
