import type { Format } from 'style-dictionary/types';
import { readFileSync, readdirSync, existsSync } from 'fs';
import { ROOT, flattenDTCG, resolveRef } from '../utils.js';

export const TENANT_FIELD_MAP: Array<{
  path: string;
  field: string;
  type: 'Color' | 'double' | 'String';
}> = [
  // ── color.background ────────────────────────────────────────────────────────
  { path: 'color.background.surface.default',   field: 'colorBackgroundSurface',              type: 'Color' },
  { path: 'color.background.surface.subtle',    field: 'colorBackgroundSurfaceSubtle',        type: 'Color' },
  { path: 'color.background.surface.raised',    field: 'colorBackgroundSurfaceRaised',        type: 'Color' },
  { path: 'color.background.primary.default',   field: 'colorBackgroundPrimary',              type: 'Color' },
  { path: 'color.background.primary.hover',     field: 'colorBackgroundPrimaryHover',         type: 'Color' },
  { path: 'color.background.primary.pressed',   field: 'colorBackgroundPrimaryPressed',       type: 'Color' },
  { path: 'color.background.primary.disable',   field: 'colorBackgroundPrimaryDisable',       type: 'Color' },
  { path: 'color.background.primary.subtle',    field: 'colorBackgroundPrimarySubtle',        type: 'Color' },
  { path: 'color.background.secondary.default', field: 'colorBackgroundSecondary',            type: 'Color' },
  { path: 'color.background.secondary.hover',   field: 'colorBackgroundSecondaryHover',       type: 'Color' },
  { path: 'color.background.secondary.pressed', field: 'colorBackgroundSecondaryPressed',     type: 'Color' },
  { path: 'color.background.secondary.disable', field: 'colorBackgroundSecondaryDisable',     type: 'Color' },
  { path: 'color.background.secondary.subtle',  field: 'colorBackgroundSecondarySubtle',      type: 'Color' },
  { path: 'color.background.danger.default',    field: 'colorBackgroundDanger',               type: 'Color' },
  { path: 'color.background.danger.hover',      field: 'colorBackgroundDangerHover',          type: 'Color' },
  { path: 'color.background.danger.pressed',    field: 'colorBackgroundDangerPressed',        type: 'Color' },
  { path: 'color.background.danger.disable',    field: 'colorBackgroundDangerDisable',        type: 'Color' },
  { path: 'color.background.danger.subtle',     field: 'colorBackgroundDangerSubtle',         type: 'Color' },
  { path: 'color.background.success.default',   field: 'colorBackgroundSuccess',              type: 'Color' },
  { path: 'color.background.success.subtle',    field: 'colorBackgroundSuccessSubtle',        type: 'Color' },
  { path: 'color.background.warning.default',   field: 'colorBackgroundWarning',              type: 'Color' },
  { path: 'color.background.warning.subtle',    field: 'colorBackgroundWarningSubtle',        type: 'Color' },
  { path: 'color.background.info.default',      field: 'colorBackgroundInfo',                 type: 'Color' },
  { path: 'color.background.info.subtle',       field: 'colorBackgroundInfoSubtle',           type: 'Color' },
  { path: 'color.background.neutral.default',   field: 'colorBackgroundNeutral',              type: 'Color' },
  { path: 'color.background.neutral.subtle',    field: 'colorBackgroundNeutralSubtle',        type: 'Color' },
  // ── color.text ──────────────────────────────────────────────────────────────
  { path: 'color.text.neutral.default',         field: 'colorTextNeutral',                    type: 'Color' },
  { path: 'color.text.neutral.subtle',          field: 'colorTextNeutralSubtle',              type: 'Color' },
  { path: 'color.text.neutral.disabled',        field: 'colorTextNeutralDisabled',            type: 'Color' },
  { path: 'color.text.neutral.inverse',         field: 'colorTextNeutralInverse',             type: 'Color' },
  { path: 'color.text.on.primary',              field: 'colorTextOnPrimary',                  type: 'Color' },
  { path: 'color.text.on.secondary',            field: 'colorTextOnSecondary',                type: 'Color' },
  { path: 'color.text.on.danger',               field: 'colorTextOnDanger',                   type: 'Color' },
  { path: 'color.text.on.info',                 field: 'colorTextOnInfo',                     type: 'Color' },
  // ── color.icon ──────────────────────────────────────────────────────────────
  { path: 'color.icon.neutral.default',         field: 'colorIconNeutral',                    type: 'Color' },
  { path: 'color.icon.neutral.subtle',          field: 'colorIconNeutralSubtle',              type: 'Color' },
  { path: 'color.icon.neutral.disabled',        field: 'colorIconNeutralDisabled',            type: 'Color' },
  { path: 'color.icon.neutral.inverse',         field: 'colorIconNeutralInverse',             type: 'Color' },
  { path: 'color.icon.on.primary',              field: 'colorIconOnPrimary',                  type: 'Color' },
  { path: 'color.icon.on.danger',               field: 'colorIconOnDanger',                   type: 'Color' },
  // ── color.stroke ────────────────────────────────────────────────────────────
  { path: 'color.stroke.neutral.default',       field: 'colorStrokeNeutral',                  type: 'Color' },
  { path: 'color.stroke.neutral.strong',        field: 'colorStrokeNeutralStrong',            type: 'Color' },
  { path: 'color.stroke.neutral.subtle',        field: 'colorStrokeNeutralSubtle',            type: 'Color' },
  { path: 'color.stroke.primary.default',       field: 'colorStrokePrimary',                  type: 'Color' },
  { path: 'color.stroke.primary.bolder',        field: 'colorStrokePrimaryBolder',            type: 'Color' },
  { path: 'color.stroke.danger.default',        field: 'colorStrokeDanger',                   type: 'Color' },
  // ── radius ──────────────────────────────────────────────────────────────────
  { path: 'radius.interactive',                 field: 'radiusInteractive',                   type: 'double' },
  { path: 'radius.card',                        field: 'radiusCard',                          type: 'double' },
  { path: 'radius.badge',                       field: 'radiusBadge',                         type: 'double' },
  // ── typography ──────────────────────────────────────────────────────────────
  { path: 'typography.fontFamily.sans',         field: 'typographyFontFamilySans',            type: 'String' },
];

export const dartTenantsFormat: Format = {
  name: 'custom/dart-tenants',
  format: ({ dictionary }) => {
    const baseMap: Record<string, string> = {};
    for (const t of dictionary.allTokens) {
      baseMap[t.path.join('.')] = String(t.value ?? t.$value);
    }

    const tenantsDir = `${ROOT}/tokens/tenants`;
    const tenantIds = readdirSync(tenantsDir)
      .filter(d => existsSync(`${tenantsDir}/${d}/overrides.json`))
      .sort((a, b) => (a === 'default' ? -1 : b === 'default' ? 1 : a.localeCompare(b)));

    function getResolved(tenantId: string, tokenPath: string): string {
      const overrides = flattenDTCG(
        JSON.parse(readFileSync(`${tenantsDir}/${tenantId}/overrides.json`, 'utf-8'))
      );
      return resolveRef(overrides[tokenPath] ?? baseMap[tokenPath] ?? '#000000', baseMap);
    }

    function toColor(hex: string): string {
      return `const Color(0xFF${hex.replace('#', '').toUpperCase()})`;
    }
    function toDim(px: string): string {
      return String(parseFloat(String(px).replace('px', '')));
    }
    function toFont(s: string): string {
      return `'${String(s).split(',')[0].trim().replace(/'/g, '')}'`;
    }
    function toVarName(id: string): string {
      return id === 'default'
        ? 'defaultTokens'
        : id.replace(/-([a-z])/g, (_: string, c: string) => c.toUpperCase());
    }
    function formatVal(val: string, type: 'Color' | 'double' | 'String'): string {
      if (type === 'Color')  return toColor(val);
      if (type === 'double') return toDim(val);
      return toFont(val);
    }

    const L: string[] = [
      '// AUTO-GENERATED by @ramaMS06/design-tokens — do not edit manually.',
      '// Run `pnpm generate` to regenerate from tokens/tenants/**.',
      '',
      '// ignore_for_file: lines_longer_than_80_chars',
      '',
      "import 'package:flutter/material.dart';",
      '',
      '/// Resolved semantic token set for a specific tenant.',
      '/// Components read these via context.btechTokens — never use primitives directly.',
      'class BTechTenantTokens {',
    ];

    for (const f of TENANT_FIELD_MAP) L.push(`  final ${f.type} ${f.field};`);
    L.push('');
    L.push('  const BTechTenantTokens({');
    for (const f of TENANT_FIELD_MAP) L.push(`    required this.${f.field},`);
    L.push('  });');
    L.push('');

    for (const tenantId of tenantIds) {
      const varName = toVarName(tenantId);
      const label = tenantId === 'default' ? 'Default tenant.' : `Tenant: ${tenantId}.`;
      L.push(`  /// ${label} Auto-generated from tokens/tenants/${tenantId}/overrides.json`);
      L.push(`  static const BTechTenantTokens ${varName} = BTechTenantTokens(`);
      for (const f of TENANT_FIELD_MAP) {
        L.push(`    ${f.field}: ${formatVal(getResolved(tenantId, f.path), f.type)},`);
      }
      L.push('  );');
      L.push('');
    }

    L.push('  /// Registry — add new tenants here after running `pnpm add-tenant`.');
    L.push('  static const Map<String, BTechTenantTokens> _registry = {');
    for (const id of tenantIds) L.push(`    '${id}': ${toVarName(id)},`);
    L.push('  };');
    L.push('');
    L.push('  /// Resolve tokens for [tenantId]. Falls back to [defaultTokens] if unknown.');
    L.push('  static BTechTenantTokens forTenant(String tenantId) =>');
    L.push('      _registry[tenantId] ?? defaultTokens;');
    L.push('}');

    return L.join('\n') + '\n';
  },
};
