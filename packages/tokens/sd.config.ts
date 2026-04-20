import StyleDictionary from 'style-dictionary';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, readFileSync, writeFileSync, readdirSync } from 'fs';

import { ROOT, flattenDTCG, resolveRef, pathToCssVarStem } from './generators/utils.js';
import { loadTokenData } from './generators/token-loader.js';
import { generateFlutterFiles } from './generators/flutter/flutter-generator.js';
import { flutterTenantsFormat } from './generators/flutter/flutter-tenant-format.js';
import { generateTsFiles } from './generators/web/web-generator.js';
import { generateTokenTypes } from './generators/web/web-token-types.js';
import { appendTenantCSS } from './generators/web/web-tenant-css.js';
import { generateTenantIsolatedCss } from './generators/web/web-tenant-isolated.js';
import { ensureTenantPackageJson } from './generators/web/web-tenant-package.js';
import {
  loadFontRegistry,
  generateFlutterFontRegistry,
  generateWebFontRegistry,
  prependGoogleFontsCssImport,
} from './generators/font-registry-generator.js';
import { generateUtilitiesCss } from './generators/web/web-utilities-generator.js';

// =============================================================================
// Register custom Style Dictionary formats + transforms
// =============================================================================
StyleDictionary.registerFormat(flutterTenantsFormat);

// Atlassian-aligned name transform:
//   color.background.primary → background-primary  (not color-background-primary)
//   color.stroke.neutral     → border-neutral       (stroke → border)
//   spacing.md               → space-md             (spacing → space)
//   typography.fontFamily.sans → font-family-sans   (drop typography.)
//   zIndex.modal             → z-modal
//   motion.duration.fast     → duration-fast        (drop motion.)
StyleDictionary.registerTransform({
  name: 'name/btech/aligned',
  type: 'name',
  transform(token: { path: string[] }, options?: { prefix?: string }): string {
    const stem = pathToCssVarStem(token.path)
      .replace(/([A-Z])/g, (m: string) => `-${m.toLowerCase()}`);
    const prefix = options?.prefix;
    return prefix ? `${prefix}-${stem}` : stem;
  },
});

// Custom transform group: CSS defaults with our name transform
StyleDictionary.registerTransformGroup({
  name: 'css/btech',
  transforms: [
    'attribute/cti',
    'name/btech/aligned',
    'time/seconds',
    'html/icon',
    'size/rem',
    'color/css',
    'asset/url',
    'fontFamily/css',
    'cubicBezier/css',
    'strokeStyle/css/shorthand',
    'border/css/shorthand',
    'typography/css/shorthand',
    'transition/css/shorthand',
    'shadow/css/shorthand',
  ],
});

// =============================================================================
// Output paths — ROOT = packages/tokens/
// =============================================================================
const FLUTTER_OUT = `${ROOT}/platforms/flutter/lib/src/`;
const WEB_OUT     = `${ROOT}/platforms/web/dist/`;
const WEB_SRC     = `${ROOT}/platforms/web/src/`;

mkdirSync(FLUTTER_OUT, { recursive: true });
mkdirSync(WEB_OUT,     { recursive: true });
mkdirSync(WEB_SRC,     { recursive: true });

// =============================================================================
// Style Dictionary — CSS custom properties + tenant.dart
// =============================================================================
const BASE_SOURCE = [
  `${ROOT}/sources/core/**/*.json`,
  `${ROOT}/sources/semantic/**/*.json`,
  `${ROOT}/sources/components/**/*.json`,
];

const sd = new StyleDictionary({
  source: BASE_SOURCE,
  platforms: {
    // CSS custom properties → platforms/web/dist/styles.css (:root block)
    css: {
      transformGroup: 'css/btech',
      prefix: 'btech',
      buildPath: WEB_OUT,
      files: [{
        destination: 'styles.css',
        format: 'css/variables',
        options: { outputReferences: true, selector: ':root' },
      }],
    },

    // Flutter tenant constants → platforms/flutter/lib/src/tenant.dart
    flutter: {
      transformGroup: 'css/btech',
      buildPath: FLUTTER_OUT,
      files: [{
        destination: 'tenant.dart',
        format: 'custom/flutter-tenants',
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

  // Generate multi-file Flutter output
  generateFlutterFiles(data);
  generateFlutterFontRegistry(`${FLUTTER_OUT}typography`, fontRegistry);
  console.log('  Flutter — multi-file token output generated');

  // Generate multi-file TypeScript output (framework-agnostic, in platforms/web/src/)
  generateTsFiles(data, WEB_SRC);
  generateWebFontRegistry(`${WEB_SRC}/typography`, fontRegistry);
  console.log('  Web (shared) — multi-file token output generated');

  // Generate typed token() helper + TokenPath union type
  generateTokenTypes(WEB_SRC);
  console.log('  Token types  — token.ts + TokenPath generated');

  // Build Style Dictionary platforms (CSS + tenant.dart)
  await sd.buildAllPlatforms();

  // Post-build: strip `-default` suffix from CSS variable names & references
  const cssPath = `${WEB_OUT}styles.css`;
  const rawCss  = readFileSync(cssPath, 'utf8');
  const cleanedCss = rawCss
    .replace(/(--btech-[a-z0-9-]+)-default([\s:);,])/g, '$1$2')
    .replace(/(--btech-[a-z0-9-]+)-default([\s:);,])/g, '$1$2');
  writeFileSync(cssPath, cleanedCss, 'utf8');

  // Post-build: prepend Google Fonts @import to styles.css
  prependGoogleFontsCssImport(cssPath, fontRegistry);

  // Generate utility CSS (bg-*, text-*, mt-*, rounded-*, etc.)
  generateUtilitiesCss(`${WEB_OUT}utilities.css`, data);

  // Post-build: append [data-tenant="*"] overrides to styles.css
  const coreTokenFiles = [
    ...readdirSync(`${ROOT}/sources/core`).map((f: string) => `${ROOT}/sources/core/${f}`),
    ...readdirSync(`${ROOT}/sources/semantic`).map((f: string) => `${ROOT}/sources/semantic/${f}`),
  ];
  const rawBaseMap: Record<string, string> = {};
  for (const file of coreTokenFiles) {
    if (!file.endsWith('.json')) continue;
    Object.assign(rawBaseMap, flattenDTCG(JSON.parse(readFileSync(file, 'utf-8'))));
  }
  const resolvedBaseMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawBaseMap)) resolvedBaseMap[k] = resolveRef(v, rawBaseMap);
  for (const [k, v] of Object.entries(resolvedBaseMap)) resolvedBaseMap[k] = resolveRef(v, resolvedBaseMap);
  // Parse --tenant flag
  const tenantIdx = process.argv.indexOf('--tenant');
  const tenantArg = tenantIdx !== -1
    ? process.argv[tenantIdx + 1]
    : process.argv.find(a => a.startsWith('--tenant='))?.split('=')[1];

  if (tenantArg) {
    // Per-tenant mode: generate isolated package for one tenant only
    console.log(`\n  Generating isolated package for tenant: ${tenantArg}\n`);
    generateTenantIsolatedCss(tenantArg, resolvedBaseMap);
    ensureTenantPackageJson(tenantArg);
    console.log(`\n  ✅ @btech/tokens-${tenantArg} ready\n`);
  } else {
    // Default mode: existing full-generate behavior (unchanged)
    appendTenantCSS(resolvedBaseMap);
    console.log('\n pnpm generate complete\n');
    console.log('  Flutter → packages/tokens/platforms/flutter/lib/src/');
    console.log('  Web     → packages/tokens/platforms/web/src/ + dist/');
    console.log('');
  }

})();
