import StyleDictionary from 'style-dictionary';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, readFileSync, writeFileSync, readdirSync } from 'fs';

import { ROOT, flattenDTCG, resolveRef, pathToCssVarStem } from './generators/utils.js';
import { loadTokenData } from './generators/token-loader.js';
import { generateFlutterFiles } from './generators/flutter/flutter-generator.js';
import { generateTsFiles } from './generators/web/web-generator.js';
import { generateTokenTypes } from './generators/web/web-token-types.js';
import { generateTenantIsolatedCss } from './generators/web/web-tenant-isolated.js';
import { ensureTenantPackageJson } from './generators/web/web-tenant-package.js';
import { appendDarkModeCss } from './generators/web/web-dark-generator.js';
import { generateWebTenantPackages } from './generators/web/web-tenant-format.js';
import {
  loadFontRegistry,
  generateFlutterFontRegistry,
  generateWebFontRegistry,
  prependGoogleFontsCssImport,
} from './generators/font-registry-generator.js';
import { generateUtilitiesCss } from './generators/web/web-utilities-generator.js';
import { appendTypographyCompositesCss } from './generators/web/web-typography-composites.js';
import { generateFlutterTenantPackages } from './generators/flutter/flutter-tenant-format.js';
import { generatePythonFiles } from './generators/python/python-generator.js';
import { generatePythonTenantPackages } from './generators/python/python-tenant-format.js';

// =============================================================================
// Register custom Style Dictionary transforms
// =============================================================================

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
// Output paths
//   ROOT                                    = packages/tokens/
//   ROOT/platforms/flutter/token/lib/src/   = packages/tokens/platforms/flutter/token/lib/src/
//   ROOT/platforms/web/token/               = packages/tokens/platforms/web/token/
// =============================================================================
const FLUTTER_OUT   = `${ROOT}/platforms/flutter/token/lib/src/`;
const WEB_OUT       = `${ROOT}/platforms/web/token/dist/`;
const WEB_SRC       = `${ROOT}/platforms/web/token/src/`;

mkdirSync(FLUTTER_OUT, { recursive: true });
mkdirSync(WEB_OUT,     { recursive: true });
mkdirSync(WEB_SRC,     { recursive: true });

// =============================================================================
// Style Dictionary — CSS custom properties only
// Flutter outputs are generated via custom generators, not SD platforms.
// =============================================================================
const BASE_SOURCE = [
  `${ROOT}/sources/primitives/**/*.json`,
  `${ROOT}/sources/brand/**/*.json`,
  `${ROOT}/sources/semantic-color/**/*.json`,
  `${ROOT}/sources/spacing-and-radius/**/*.json`,
  `${ROOT}/sources/typography/font.json`,
  `${ROOT}/sources/typography/scale.json`,
  `${ROOT}/sources/shadow/**/*.json`,
  `${ROOT}/sources/stroke/**/*.json`,
  `${ROOT}/sources/components/**/*.json`,
];

const sd = new StyleDictionary({
  source: BASE_SOURCE,
  platforms: {
    // CSS custom properties → platforms/web/dist/styles.css (:root block)
    css: {
      transformGroup: 'css/btech',
      prefix: '',
      buildPath: WEB_OUT,
      files: [{
        destination: 'styles.css',
        format: 'css/variables',
        options: { outputReferences: true, selector: ':root' },
      }],
    },
  },
});

// =============================================================================
// Shared helper — builds the fully-resolved base token map from core + semantic
// sources. Used by both modes; does NOT write any files.
// =============================================================================
function buildResolvedBaseMap(): Record<string, string> {
  const SOURCE_DIRS = [
    `${ROOT}/sources/primitives`,
    `${ROOT}/sources/brand`,
    `${ROOT}/sources/semantic-color`,
    `${ROOT}/sources/spacing-and-radius`,
    `${ROOT}/sources/shadow`,
    `${ROOT}/sources/stroke`,
  ];
  const rawBaseMap: Record<string, string> = {};
  for (const dir of SOURCE_DIRS) {
    for (const f of readdirSync(dir).filter((f: string) => f.endsWith('.json'))) {
      Object.assign(rawBaseMap, flattenDTCG(JSON.parse(readFileSync(`${dir}/${f}`, 'utf-8'))));
    }
  }
  // Also include typography token files (but not font-registry.json)
  for (const f of ['font.json', 'scale.json']) {
    Object.assign(rawBaseMap, flattenDTCG(JSON.parse(readFileSync(`${ROOT}/sources/typography/${f}`, 'utf-8'))));
  }
  const resolvedBaseMap: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawBaseMap)) resolvedBaseMap[k] = resolveRef(v, rawBaseMap);
  for (const [k, v] of Object.entries(resolvedBaseMap)) resolvedBaseMap[k] = resolveRef(v, resolvedBaseMap);

  // Strip the `-default` disambiguator suffix from keys after resolution, if any remain.
  // (Previously used for color.brand.primary-default to avoid SD path collision — now resolved.)
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(resolvedBaseMap)) {
    const cleanKey = k.replace(/-default(\.|$)/, '$1');
    out[cleanKey] = v;
  }
  return out;
}

// =============================================================================
// Main
// =============================================================================
(async () => {
  // Parse --tenant flag
  const tenantIdx = process.argv.indexOf('--tenant');
  const tenantArg = tenantIdx !== -1
    ? process.argv[tenantIdx + 1]
    : process.argv.find(a => a.startsWith('--tenant='))?.split('=')[1];

  if (tenantArg) {
    // =========================================================================
    // TENANT MODE
    // Web:     packages/platforms/web/tenants/{id}/
    // Flutter: packages/tokens/platforms/flutter/tenants/{id}/
    // Does NOT touch base platform outputs.
    // =========================================================================
    console.log(`\n  Tenant mode — generating isolated packages for: ${tenantArg}\n`);

    const resolvedBaseMap = buildResolvedBaseMap();

    // Web — isolated :root CSS + npm package scaffold
    generateTenantIsolatedCss(tenantArg, resolvedBaseMap);
    ensureTenantPackageJson(tenantArg);

    // Flutter — generate all tenant packages
    generateFlutterTenantPackages(resolvedBaseMap);

    console.log(`\n  tenant packages ready for: ${tenantArg}`);
    console.log(`  Web     → packages/tokens/platforms/web/${tenantArg}/dist/styles.css`);
    console.log(`  Flutter → packages/tokens/platforms/flutter/${tenantArg}/\n`);

  } else {
    // =========================================================================
    // BASE MODE — full generation of shared platform outputs (unchanged)
    // Does NOT touch packages/tokens-{id}/
    // =========================================================================
    const data = loadTokenData();
    const fontRegistry = loadFontRegistry();

    // Pass --skip-flutter to skip Flutter generation (web-only mode for local dev).
    // Used by `pnpm generate:web` so demo apps can build styles.css without
    // touching Dart files and causing unwanted git changes.
    const skipFlutter = process.argv.includes('--skip-flutter');

    if (!skipFlutter) {
      // Generate multi-file Flutter output (color, spacing, radius, typography)
      generateFlutterFiles(data);
      generateFlutterFontRegistry(`${FLUTTER_OUT}typography`, fontRegistry);
      console.log('  Flutter — multi-file token output generated');

      // Generate per-tenant Dart files:
      //   src/tenants/default.dart, src/tenants/tenant_a.dart, ...
      //   src/tenant.dart (BTechTenantTokens class + registry)
      const resolvedBaseMap = buildResolvedBaseMap();
      generateFlutterTenantPackages(resolvedBaseMap);
      console.log('  Flutter — tenant files generated');
    }

    // Generate Python package (btech_tokens) under platforms/python/btech_tokens/
    generatePythonFiles(data);
    console.log('  Python  — base package generated');

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
      .replace(/(--[a-z][a-z0-9-]+)-default([\s:);,])/g, '$1$2')
      .replace(/(--[a-z][a-z0-9-]+)-default([\s:);,])/g, '$1$2');

    // Post-build: SD4's shadow/css/shorthand omits the `inset` keyword.
    // Fix: prepend `inset ` to the buttonPressed shadow value.
    const fixedCss = cleanedCss
      .replace(
        /(--shadow-button-pressed:\s*)(0px)/g,
        '$1inset $2',
      );
    writeFileSync(cssPath, fixedCss, 'utf8');

    // Post-build: prepend Google Fonts @import to styles.css
    prependGoogleFontsCssImport(cssPath, fontRegistry);

    // Generate utility CSS (bg-*, text-*, mt-*, rounded-*, etc.)
    generateUtilitiesCss(`${WEB_OUT}utilities.css`, data);

    // Append composite typography CSS vars + utility classes to styles.css
    appendTypographyCompositesCss(`${WEB_OUT}styles.css`);

    // Post-build: append [data-mode="dark"] color overrides to styles.css
    appendDarkModeCss(`${WEB_OUT}styles.css`);

    // Post-build: generate per-tenant web packages (platforms/web/tenants/{id}/)
    generateWebTenantPackages();

    // Python — per-tenant packages
    generatePythonTenantPackages();

    console.log('\n pnpm generate complete\n');
    console.log('  Flutter → packages/tokens/platforms/flutter/lib/src/');
    console.log('  Web     → packages/tokens/platforms/web/src/ + dist/');
    console.log('  Python  → packages/tokens/platforms/python/btech_tokens/');
    console.log('');
  }

})();
