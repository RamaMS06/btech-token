// Per-tenant Python package generator.
//
// For each entry under sources/tenants/, produces a standalone Python package
// at packages/tokens/platforms/python/tenants/{id}/ containing:
//   pyproject.toml                — name = btech-tokens-{id}, version preserved
//   README.md                     — references the base package
//   btech_tokens_{id}/...         — same module layout as base, with tenant
//                                   overrides applied at generate time
//
// Standalone — no runtime dependency on btech_tokens. Mirrors web's per-tenant
// package pattern (see web-tenant-format.ts).

import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
} from 'fs';
import { ROOT, flattenDTCG, resolveRef } from '../utils.js';
import {
  buildDarkResolvedBaseMap,
  buildResolvedBaseMap,
  buildColorTree,
} from '../flutter/flutter-theme-generator.js';
import { loadTokenData } from '../token-loader.js';
import type { ResolvedTokenMap } from '../token-loader.js';
import {
  generatePythonPackageContents,
  snakeKeyed,
} from './python-generator.js';
import { pySafeName } from './python-utils.js';

interface MergedMaps {
  /** flat dot-path → resolved value, light mode */
  light: Record<string, string>;
  /** flat dot-path → resolved value, dark mode */
  dark: Record<string, string>;
}

/** Apply tenant overrides on top of base flat maps. */
function buildTenantMergedMaps(
  tenantOverridesPath: string,
  baseLightMap: Record<string, string>,
  baseDarkMap:  Record<string, string>,
): MergedMaps {
  const rawOverrides = flattenDTCG(
    JSON.parse(readFileSync(tenantOverridesPath, 'utf-8')),
  );

  const light: Record<string, string> = { ...baseLightMap };
  const dark:  Record<string, string> = { ...baseDarkMap  };

  for (const [path, rawVal] of Object.entries(rawOverrides)) {
    // Strip a `.default` suffix if present (mirrors web tenant generator).
    const cleanPath = path.replace(/\.default$/, '');
    // Resolve any { ... } reference against the LIGHT base map — references
    // in overrides typically point at primitive shades.
    const resolved = resolveRef(rawVal, baseLightMap);
    light[cleanPath] = resolved;
    dark[cleanPath]  = resolved;
  }

  return { light, dark };
}

/** Build a tenant-specific ResolvedTokenMap by overlaying merged values onto
 *  the base data structure. Only categories that the override schema can hit
 *  are looked up via the merged map; others (shadow, semantic typography,
 *  typeScale) pass through from base.
 */
function buildTenantData(base: ResolvedTokenMap, merged: MergedMaps): ResolvedTokenMap {
  const out: ResolvedTokenMap = {
    baseMap: merged.light,
    coreColors: base.coreColors,
    semanticColors: {},
    spacing: {},
    stroke:  {},
    radius:  {},
    shadow:  base.shadow,
    typography: {
      fontFamilies: {},
      fontSizes:    {},
      fontWeights:  {},
      lineHeights:  {},
      semantic:     base.typography.semantic,
      typeScale:    base.typography.typeScale,
    },
  };

  // Semantic colors — drive structure from buildColorTree so any new tenant
  // override category lands automatically.
  const tree = buildColorTree();
  for (const [group, fields] of Object.entries(tree)) {
    out.semanticColors[group] = {};
    for (const field of fields) {
      const dotPath = `color.${group}.${field}`;
      const baseField = base.semanticColors[group]?.[field];
      out.semanticColors[group][field] = merged.light[dotPath] ?? baseField ?? '#000000';
    }
  }

  for (const k of Object.keys(base.spacing)) {
    out.spacing[k] = merged.light[`spacing.${k}`] ?? base.spacing[k];
  }
  for (const k of Object.keys(base.stroke)) {
    out.stroke[k] = merged.light[`stroke.${k}`] ?? base.stroke[k];
  }
  for (const k of Object.keys(base.radius)) {
    out.radius[k] = merged.light[`radius.${k}`] ?? base.radius[k];
  }

  for (const k of Object.keys(base.typography.fontFamilies)) {
    out.typography.fontFamilies[k] =
      merged.light[`typography.fontFamily.${k}`] ?? base.typography.fontFamilies[k];
  }
  for (const k of Object.keys(base.typography.fontSizes)) {
    out.typography.fontSizes[k] =
      merged.light[`typography.fontSize.${k}`] ?? base.typography.fontSizes[k];
  }
  for (const k of Object.keys(base.typography.fontWeights)) {
    out.typography.fontWeights[k] =
      merged.light[`typography.fontWeight.${k}`] ?? base.typography.fontWeights[k];
  }
  for (const k of Object.keys(base.typography.lineHeights)) {
    out.typography.lineHeights[k] =
      merged.light[`typography.lineHeight.${k}`] ?? base.typography.lineHeights[k];
  }

  return out;
}

/** Build the tenant-specific dark colors map (group → field → hex). */
function buildTenantDarkColors(
  merged: MergedMaps,
): Record<string, Record<string, string>> {
  const tree = buildColorTree();
  const out: Record<string, Record<string, string>> = {};
  for (const [group, fields] of Object.entries(tree)) {
    out[group] = {};
    for (const field of fields) {
      const dotPath = `color.${group}.${field}`;
      const value = merged.dark[dotPath] ?? merged.light[dotPath] ?? '#000000';
      out[group][pySafeName(field)] = value;
    }
  }
  return out;
}

/** Build the tenant-specific light colors map (group → field → hex), with
 *  snake_case-ified field names. */
function buildTenantLightColors(
  tenantData: ResolvedTokenMap,
): Record<string, Record<string, string>> {
  const out: Record<string, Record<string, string>> = {};
  for (const [group, fields] of Object.entries(tenantData.semanticColors)) {
    out[group] = snakeKeyed(fields);
  }
  return out;
}

/** Write or preserve the tenant pyproject.toml.
 *  Version is preserved across regenerations; only on first scaffold do we
 *  seed it with the current platform version. Same hybrid versioning
 *  contract the web tenant generator uses.
 *
 *  Seed source: the repo-root package.json holds the canonical platform
 *  version (single source of truth across web/flutter/python). Reading from
 *  there rather than the python base pyproject keeps the seed
 *  platform-agnostic.
 */
function ensureTenantPyproject(outDir: string, tenantId: string): void {
  const pyprojectPath = `${outDir}/pyproject.toml`;
  const rootPkgPath = `${ROOT}/../../package.json`; // packages/tokens/ → repo root
  const baseVersion = existsSync(rootPkgPath)
    ? (JSON.parse(readFileSync(rootPkgPath, 'utf-8')).version ?? '1.0.0')
    : '1.0.0';

  const existingVersion = existsSync(pyprojectPath)
    ? readFileSync(pyprojectPath, 'utf-8').match(/^version = "([^"]+)"/m)?.[1]
    : undefined;

  const version = existingVersion ?? baseVersion;
  const pkgName = `btech-tokens-${tenantId}`;
  const moduleName = `btech_tokens_${tenantId}`;

  const toml = `[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "${pkgName}"
version = "${version}"
description = "BTech design tokens — ${tenantId} tenant — auto-generated, do not edit"
readme = "README.md"
requires-python = ">=3.10"
license = { text = "Proprietary" }
authors = [{ name = "BUMA — BTech Design System" }]
keywords = ["design-tokens", "design-system", "btech", "${tenantId}"]
classifiers = [
  "Programming Language :: Python :: 3",
  "Programming Language :: Python :: 3.10",
  "Programming Language :: Python :: 3.11",
  "Programming Language :: Python :: 3.12",
  "Typing :: Typed",
]

[tool.hatch.build.targets.wheel]
packages = ["${moduleName}"]

[tool.hatch.build.targets.sdist]
include = ["${moduleName}", "README.md", "pyproject.toml"]
`;
  writeFileSync(pyprojectPath, toml, 'utf-8');
}

function writeTenantReadme(outDir: string, tenantId: string): void {
  const md = `# btech-tokens-${tenantId}

Tenant variant of \`btech-tokens\` with \`${tenantId}\`-specific token
overrides applied at generate time. Auto-generated — do not edit by hand.

## Install

\`\`\`bash
pip install \\
  --index-url https://pkgs.dev.azure.com/buma/BUMA%20-%20Bspace%20Design%20System/_packaging/btech/pypi/simple/ \\
  btech-tokens-${tenantId}
\`\`\`

## Use

Identical API to the base \`btech-tokens\` package — just import from the
tenant module instead:

\`\`\`python
from btech_tokens_${tenantId} import BTechColor, BTechSpacing, set_mode, to_css

BTechColor.background.primary    # ← ${tenantId} override
\`\`\`

See the base \`btech-tokens\` README for full API documentation.
`;
  writeFileSync(`${outDir}/README.md`, md, 'utf-8');
}

/** Generate one tenant package. */
function generatePythonTenantPackage(
  tenantId: string,
  base: ResolvedTokenMap,
  baseLightMap: Record<string, string>,
  baseDarkMap:  Record<string, string>,
): void {
  const overridesPath = `${ROOT}/sources/tenants/${tenantId}/overrides.json`;
  const outDir = `${ROOT}/platforms/python/tenants/${tenantId}`;
  const moduleDir = `${outDir}/btech_tokens_${tenantId}`;

  mkdirSync(moduleDir, { recursive: true });

  const merged = buildTenantMergedMaps(overridesPath, baseLightMap, baseDarkMap);
  const tenantData  = buildTenantData(base, merged);
  const lightColors = buildTenantLightColors(tenantData);
  const darkColors  = buildTenantDarkColors(merged);

  generatePythonPackageContents(moduleDir, tenantData, lightColors, darkColors);

  ensureTenantPyproject(outDir, tenantId);
  writeTenantReadme(outDir, tenantId);

  console.log(`  Python tenant — platforms/python/tenants/${tenantId}/  (btech-tokens-${tenantId})`);
}

/** Public entry — runs from sd.config.ts in base mode. */
export function generatePythonTenantPackages(): void {
  const tenantsDir = `${ROOT}/sources/tenants`;
  if (!existsSync(tenantsDir)) return;

  const tenantIds = readdirSync(tenantsDir)
    .filter((d: string) =>
      d !== 'default' && existsSync(`${tenantsDir}/${d}/overrides.json`),
    )
    .sort();

  if (tenantIds.length === 0) return;

  const base = loadTokenData();
  const baseLightMap = buildResolvedBaseMap();
  const baseDarkMap  = buildDarkResolvedBaseMap();

  for (const tenantId of tenantIds) {
    generatePythonTenantPackage(tenantId, base, baseLightMap, baseDarkMap);
  }
}
