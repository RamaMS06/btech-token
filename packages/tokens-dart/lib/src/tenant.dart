import 'package:flutter/material.dart';
import 'generated.dart';

/// Semantic token set for a specific tenant.
/// Components consume these — never primitive tokens directly.
class DsTenantTokens {
  final Color primaryBg;
  final Color primaryBgHover;
  final Color primaryFg;
  final Color primaryBorder;

  final Color secondaryBg;
  final Color secondaryBgHover;
  final Color secondaryFg;
  final Color secondaryBorder;

  final Color dangerBg;
  final Color dangerFg;

  final Color surfaceDefault;
  final Color surfaceSubtle;
  final Color surfaceRaised;

  final Color textDefault;
  final Color textSubtle;
  final Color textDisabled;
  final Color textInverse;

  final Color borderDefault;
  final Color borderStrong;

  final double radiusInteractive;
  final double radiusCard;
  final double radiusBadge;

  final String fontFamilySans;

  const DsTenantTokens({
    required this.primaryBg,
    required this.primaryBgHover,
    required this.primaryFg,
    required this.primaryBorder,
    required this.secondaryBg,
    required this.secondaryBgHover,
    required this.secondaryFg,
    required this.secondaryBorder,
    required this.dangerBg,
    required this.dangerFg,
    required this.surfaceDefault,
    required this.surfaceSubtle,
    required this.surfaceRaised,
    required this.textDefault,
    required this.textSubtle,
    required this.textDisabled,
    required this.textInverse,
    required this.borderDefault,
    required this.borderStrong,
    required this.radiusInteractive,
    required this.radiusCard,
    required this.radiusBadge,
    required this.fontFamilySans,
  });

  /// Default tenant — values come directly from generated semantic tokens.
  static const DsTenantTokens defaultTokens = DsTenantTokens(
    primaryBg:        DsSemanticColors.colorPrimaryBg,
    primaryBgHover:   DsSemanticColors.colorPrimaryBg_hover,
    primaryFg:        DsSemanticColors.colorPrimaryFg,
    primaryBorder:    DsSemanticColors.colorPrimaryBorder,
    secondaryBg:      DsSemanticColors.colorSecondaryBg,
    secondaryBgHover: DsSemanticColors.colorSecondaryBg_hover,
    secondaryFg:      DsSemanticColors.colorSecondaryFg,
    secondaryBorder:  DsSemanticColors.colorSecondaryBorder,
    dangerBg:         DsSemanticColors.colorDangerBg,
    dangerFg:         DsSemanticColors.colorDangerFg,
    surfaceDefault:   DsSemanticColors.colorSurfaceDefault,
    surfaceSubtle:    DsSemanticColors.colorSurfaceSubtle,
    surfaceRaised:    DsSemanticColors.colorSurfaceRaised,
    textDefault:      DsSemanticColors.colorTextDefault,
    textSubtle:       DsSemanticColors.colorTextSubtle,
    textDisabled:     DsSemanticColors.colorTextDisabled,
    textInverse:      DsSemanticColors.colorTextInverse,
    borderDefault:    DsSemanticColors.colorBorderDefault,
    borderStrong:     DsSemanticColors.colorBorderStrong,
    radiusInteractive: DsSemanticRadius.radiusInteractive,
    radiusCard:        DsSemanticRadius.radiusCard,
    radiusBadge:       DsSemanticRadius.radiusBadge,
    fontFamilySans:    DsPrimitiveFontFamilies.typographyFontFamilySans,
  );

  /// Tenant A — blue primary, tighter radius.
  static const DsTenantTokens tenantA = DsTenantTokens(
    primaryBg:        DsPrimitiveColors.colorBlue500,
    primaryBgHover:   DsPrimitiveColors.colorBlue600,
    primaryFg:        DsPrimitiveColors.colorNeutral0,
    primaryBorder:    DsPrimitiveColors.colorBlue700,
    secondaryBg:      DsPrimitiveColors.colorNeutral100,
    secondaryBgHover: DsPrimitiveColors.colorNeutral200,
    secondaryFg:      DsPrimitiveColors.colorNeutral800,
    secondaryBorder:  DsPrimitiveColors.colorNeutral300,
    dangerBg:         DsPrimitiveColors.colorRed700,
    dangerFg:         DsPrimitiveColors.colorNeutral0,
    surfaceDefault:   DsPrimitiveColors.colorNeutral0,
    surfaceSubtle:    DsPrimitiveColors.colorNeutral50,
    surfaceRaised:    DsPrimitiveColors.colorNeutral100,
    textDefault:      DsPrimitiveColors.colorNeutral900,
    textSubtle:       DsPrimitiveColors.colorNeutral500,
    textDisabled:     DsPrimitiveColors.colorNeutral400,
    textInverse:      DsPrimitiveColors.colorNeutral0,
    borderDefault:    DsPrimitiveColors.colorNeutral200,
    borderStrong:     DsPrimitiveColors.colorNeutral400,
    radiusInteractive: 4,
    radiusCard:        6,
    radiusBadge:       DsPrimitiveDimensions.radiusFull,
    fontFamilySans:    DsPrimitiveFontFamilies.typographyFontFamilySans,
  );

  /// Tenant BJB — deep blue primary, BJB Sans font, tight radius.
  static const DsTenantTokens tenantBjb = DsTenantTokens(
    primaryBg:        DsPrimitiveColors.colorBlue600,
    primaryBgHover:   DsPrimitiveColors.colorBlue700,
    primaryFg:        DsPrimitiveColors.colorNeutral0,
    primaryBorder:    DsPrimitiveColors.colorBlue800,
    secondaryBg:      DsPrimitiveColors.colorNeutral100,
    secondaryBgHover: DsPrimitiveColors.colorNeutral200,
    secondaryFg:      DsPrimitiveColors.colorNeutral800,
    secondaryBorder:  DsPrimitiveColors.colorNeutral300,
    dangerBg:         DsPrimitiveColors.colorRed700,
    dangerFg:         DsPrimitiveColors.colorNeutral0,
    surfaceDefault:   DsPrimitiveColors.colorNeutral0,
    surfaceSubtle:    DsPrimitiveColors.colorNeutral50,
    surfaceRaised:    DsPrimitiveColors.colorNeutral100,
    textDefault:      DsPrimitiveColors.colorNeutral900,
    textSubtle:       DsPrimitiveColors.colorNeutral500,
    textDisabled:     DsPrimitiveColors.colorNeutral400,
    textInverse:      DsPrimitiveColors.colorNeutral0,
    borderDefault:    DsPrimitiveColors.colorNeutral200,
    borderStrong:     DsPrimitiveColors.colorNeutral400,
    radiusInteractive: 4,
    radiusCard:        4,
    radiusBadge:       DsPrimitiveDimensions.radiusFull,
    fontFamilySans:    'BJB Sans',
  );

  /// Registry of all known tenants. Add new tenants here after running add-tenant.
  static const Map<String, DsTenantTokens> _registry = {
    'default':    defaultTokens,
    'tenant-a':   tenantA,
    'tenant-bjb': tenantBjb,
  };

  /// Look up tokens by tenant ID. Falls back to [defaultTokens] if unknown.
  static DsTenantTokens forTenant(String tenantId) {
    return _registry[tenantId] ?? defaultTokens;
  }
}
