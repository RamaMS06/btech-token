import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { ROOT, flattenDTCG, resolveRef } from '../utils.js';

// =============================================================================
// Token field map — every semantic token that can differ per tenant.
// path   = dot-notation key in the resolved token map
// field  = Dart field name on BTechTenantTokens
// type   = Dart type
// =============================================================================
export const TENANT_FIELD_MAP: Array<{
  path: string;
  field: string;
  type: 'Color' | 'double' | 'String';
}> = [
  // ── color.background ────────────────────────────────────────────────────────
  { path: 'color.background.surface.default',   field: 'colorBackgroundSurface',          type: 'Color' },
  { path: 'color.background.surface.subtle',    field: 'colorBackgroundSurfaceSubtle',    type: 'Color' },
  { path: 'color.background.surface.raised',    field: 'colorBackgroundSurfaceRaised',    type: 'Color' },
  { path: 'color.background.primary.default',   field: 'colorBackgroundPrimary',          type: 'Color' },
  { path: 'color.background.primary.hover',     field: 'colorBackgroundPrimaryHover',     type: 'Color' },
  { path: 'color.background.primary.pressed',   field: 'colorBackgroundPrimaryPressed',   type: 'Color' },
  { path: 'color.background.primary.disable',   field: 'colorBackgroundPrimaryDisable',   type: 'Color' },
  { path: 'color.background.primary.subtle',    field: 'colorBackgroundPrimarySubtle',    type: 'Color' },
  { path: 'color.background.secondary.default', field: 'colorBackgroundSecondary',        type: 'Color' },
  { path: 'color.background.secondary.hover',   field: 'colorBackgroundSecondaryHover',   type: 'Color' },
  { path: 'color.background.secondary.pressed', field: 'colorBackgroundSecondaryPressed', type: 'Color' },
  { path: 'color.background.secondary.disable', field: 'colorBackgroundSecondaryDisable', type: 'Color' },
  { path: 'color.background.secondary.subtle',  field: 'colorBackgroundSecondarySubtle',  type: 'Color' },
  { path: 'color.background.danger.default',    field: 'colorBackgroundDanger',           type: 'Color' },
  { path: 'color.background.danger.hover',      field: 'colorBackgroundDangerHover',      type: 'Color' },
  { path: 'color.background.danger.pressed',    field: 'colorBackgroundDangerPressed',    type: 'Color' },
  { path: 'color.background.danger.disable',    field: 'colorBackgroundDangerDisable',    type: 'Color' },
  { path: 'color.background.danger.subtle',     field: 'colorBackgroundDangerSubtle',     type: 'Color' },
  { path: 'color.background.success.default',   field: 'colorBackgroundSuccess',          type: 'Color' },
  { path: 'color.background.success.subtle',    field: 'colorBackgroundSuccessSubtle',    type: 'Color' },
  { path: 'color.background.warning.default',   field: 'colorBackgroundWarning',          type: 'Color' },
  { path: 'color.background.warning.subtle',    field: 'colorBackgroundWarningSubtle',    type: 'Color' },
  { path: 'color.background.info.default',      field: 'colorBackgroundInfo',             type: 'Color' },
  { path: 'color.background.info.subtle',       field: 'colorBackgroundInfoSubtle',       type: 'Color' },
  { path: 'color.background.neutral.default',   field: 'colorBackgroundNeutral',          type: 'Color' },
  { path: 'color.background.neutral.subtle',    field: 'colorBackgroundNeutralSubtle',    type: 'Color' },
  // ── color.text ──────────────────────────────────────────────────────────────
  { path: 'color.text.neutral.default',         field: 'colorTextNeutral',                type: 'Color' },
  { path: 'color.text.neutral.subtle',          field: 'colorTextNeutralSubtle',          type: 'Color' },
  { path: 'color.text.neutral.disabled',        field: 'colorTextNeutralDisabled',        type: 'Color' },
  { path: 'color.text.neutral.inverse',         field: 'colorTextNeutralInverse',         type: 'Color' },
  { path: 'color.text.on.primary',              field: 'colorTextOnPrimary',              type: 'Color' },
  { path: 'color.text.on.secondary',            field: 'colorTextOnSecondary',            type: 'Color' },
  { path: 'color.text.on.danger',               field: 'colorTextOnDanger',               type: 'Color' },
  { path: 'color.text.on.info',                 field: 'colorTextOnInfo',                 type: 'Color' },
  // ── color.icon ──────────────────────────────────────────────────────────────
  { path: 'color.icon.neutral.default',         field: 'colorIconNeutral',                type: 'Color' },
  { path: 'color.icon.neutral.subtle',          field: 'colorIconNeutralSubtle',          type: 'Color' },
  { path: 'color.icon.neutral.disabled',        field: 'colorIconNeutralDisabled',        type: 'Color' },
  { path: 'color.icon.neutral.inverse',         field: 'colorIconNeutralInverse',         type: 'Color' },
  { path: 'color.icon.on.primary',              field: 'colorIconOnPrimary',              type: 'Color' },
  { path: 'color.icon.on.danger',               field: 'colorIconOnDanger',               type: 'Color' },
  // ── color.stroke ────────────────────────────────────────────────────────────
  { path: 'color.stroke.neutral.default',       field: 'colorStrokeNeutral',              type: 'Color' },
  { path: 'color.stroke.neutral.strong',        field: 'colorStrokeNeutralStrong',        type: 'Color' },
  { path: 'color.stroke.neutral.subtle',        field: 'colorStrokeNeutralSubtle',        type: 'Color' },
  { path: 'color.stroke.primary.default',       field: 'colorStrokePrimary',              type: 'Color' },
  { path: 'color.stroke.primary.bolder',        field: 'colorStrokePrimaryBolder',        type: 'Color' },
  { path: 'color.stroke.danger.default',        field: 'colorStrokeDanger',               type: 'Color' },
  // ── radius ──────────────────────────────────────────────────────────────────
  { path: 'radius.interactive',                 field: 'radiusInteractive',               type: 'double' },
  { path: 'radius.card',                        field: 'radiusCard',                      type: 'double' },
  { path: 'radius.badge',                       field: 'radiusBadge',                     type: 'double' },
  // ── typography ──────────────────────────────────────────────────────────────
  { path: 'typography.fontFamily.sans',         field: 'typographyFontFamilySans',        type: 'String' },
];

// =============================================================================
// Helpers
// =============================================================================
function toColor(hex: string): string {
  return `const Color(0xFF${hex.replace('#', '').toUpperCase()})`;
}
function toDim(px: string): string {
  return String(parseFloat(String(px).replace('px', '')));
}
function toFont(s: string): string {
  return `'${String(s).split(',')[0].trim().replace(/'/g, '')}'`;
}
function formatVal(val: string, type: 'Color' | 'double' | 'String'): string {
  if (type === 'Color')  return toColor(val);
  if (type === 'double') return toDim(val);
  return toFont(val);
}

/** tenant-id → Dart variable name: default → btechTenantDefault, tenant-bjb → btechTenantBjb */
function toVarName(id: string): string {
  const pascal = id === 'default'
    ? 'Default'
    : id.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  return `btechTenant${pascal}`;
}

/** tenant-id → Dart file name: tenant-bjb → tenant_bjb.dart */
function toFileName(id: string): string {
  return `${id.replace(/-/g, '_')}.dart`;
}

// =============================================================================
// generateFlutterTenantFiles
//
// Produces:
//   platforms/flutter/lib/src/tenants/default.dart     ← const btechTenantDefault
//   platforms/flutter/lib/src/tenants/tenant_a.dart    ← const btechTenantA
//   platforms/flutter/lib/src/tenants/tenant_bjb.dart  ← const btechTenantBjb
//   platforms/flutter/lib/src/tenant.dart              ← BTechTenantTokens class + registry
// =============================================================================
export function generateFlutterTenantFiles(baseMap: Record<string, string>): void {
  const tenantsDir  = `${ROOT}/sources/tenants`;
  const outSrc      = `${ROOT}/platforms/flutter/lib/src`;
  const outTenants  = `${outSrc}/tenants`;

  mkdirSync(outTenants, { recursive: true });

  const tenantIds = readdirSync(tenantsDir)
    .filter(d => existsSync(`${tenantsDir}/${d}/overrides.json`))
    .sort((a, b) => (a === 'default' ? -1 : b === 'default' ? 1 : a.localeCompare(b)));

  // ── 1. One file per tenant ─────────────────────────────────────────────────
  for (const tenantId of tenantIds) {
    const overrides = flattenDTCG(
      JSON.parse(readFileSync(`${tenantsDir}/${tenantId}/overrides.json`, 'utf-8'))
    );

    function getResolved(tokenPath: string): string {
      return resolveRef(overrides[tokenPath] ?? baseMap[tokenPath] ?? '#000000', baseMap);
    }

    const varName = toVarName(tenantId);
    const label   = tenantId === 'default' ? 'Default tenant.' : `Tenant: ${tenantId}.`;

    const L: string[] = [
      '// AUTO-GENERATED by @btech/design-system — do not edit manually.',
      `// Source: packages/tokens/sources/tenants/${tenantId}/overrides.json`,
      '// Run `pnpm generate` to regenerate.',
      '',
      '// ignore_for_file: lines_longer_than_80_chars',
      '',
      "import 'package:flutter/material.dart';",
      "import '../tenant.dart';",
      '',
      `/// ${label}`,
      `/// Auto-generated from sources/tenants/${tenantId}/overrides.json`,
      `const BTechTenantTokens ${varName} = BTechTenantTokens(`,
    ];

    for (const f of TENANT_FIELD_MAP) {
      L.push(`  ${f.field}: ${formatVal(getResolved(f.path), f.type)},`);
    }
    L.push(');', '');

    writeFileSync(`${outTenants}/${toFileName(tenantId)}`, L.join('\n'), 'utf-8');
    console.log(`  Flutter tenant  — platforms/flutter/lib/src/tenants/${toFileName(tenantId)}`);
  }

  // ── 2. tenant.dart — class definition + registry ──────────────────────────
  const imports = tenantIds.map(id => `import 'tenants/${toFileName(id)}';`);
  const defaultVar = toVarName('default');

  const T: string[] = [
    '// AUTO-GENERATED by @btech/design-system — do not edit manually.',
    '// Run `pnpm generate` to regenerate from sources/tenants/**.',
    '',
    '// ignore_for_file: lines_longer_than_80_chars',
    '',
    "import 'package:flutter/material.dart';",
    ...imports,
    '',
    '/// Resolved semantic token set for a specific tenant.',
    '/// Use [BTechTenantTokens.forTenant] to look up by tenant ID,',
    '/// or reference a tenant directly: [BTechTenantTokens.defaultTokens].',
    '///',
    '/// In widgets, prefer the context extension:',
    '///   context.btechColor.background.primary',
    '///   context.btechRadius.interactive',
    '///   context.btechFont.sans',
    'class BTechTenantTokens {',
    '',
  ];

  // Fields
  for (const f of TENANT_FIELD_MAP) T.push(`  final ${f.type} ${f.field};`);
  T.push('');

  // Constructor
  T.push('  const BTechTenantTokens({');
  for (const f of TENANT_FIELD_MAP) T.push(`    required this.${f.field},`);
  T.push('  });');
  T.push('');

  // Static const references (delegating to individual tenant files)
  for (const tenantId of tenantIds) {
    const varName = toVarName(tenantId);
    const propName = tenantId === 'default'
      ? 'defaultTokens'
      : tenantId.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
    const label = tenantId === 'default' ? 'Default tenant.' : `Tenant: ${tenantId}.`;
    T.push(`  /// ${label}`);
    T.push(`  static const BTechTenantTokens ${propName} = ${varName};`);
    T.push('');
  }

  // Registry
  T.push('  /// Registry — add new tenants here after running `pnpm generate`.');
  T.push('  static const Map<String, BTechTenantTokens> _registry = {');
  for (const tenantId of tenantIds) {
    const propName = tenantId === 'default'
      ? 'defaultTokens'
      : tenantId.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
    T.push(`    '${tenantId}': ${propName},`);
  }
  T.push('  };');
  T.push('');

  // forTenant()
  T.push('  /// Resolve tokens for [tenantId]. Falls back to [defaultTokens] if unknown.');
  T.push('  static BTechTenantTokens forTenant(String tenantId) =>');
  T.push(`      _registry[tenantId] ?? ${defaultVar};`);
  T.push('}', '');

  writeFileSync(`${outSrc}/tenant.dart`, T.join('\n'), 'utf-8');
  console.log(`  Flutter tenant  — platforms/flutter/lib/src/tenant.dart (${tenantIds.length} tenants)`);
}
