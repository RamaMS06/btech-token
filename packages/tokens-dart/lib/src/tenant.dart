import 'package:flutter/material.dart';
import 'tokens.dart';

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

  /// Default tenant tokens (green primary, radius.md = 8).
  static const DsTenantTokens defaultTokens = DsTenantTokens(
    primaryBg:       DsPrimitiveColors.green700,
    primaryBgHover:  DsPrimitiveColors.green800,
    primaryFg:       DsPrimitiveColors.neutral0,
    primaryBorder:   DsPrimitiveColors.green800,
    secondaryBg:     DsPrimitiveColors.neutral100,
    secondaryBgHover:DsPrimitiveColors.neutral200,
    secondaryFg:     DsPrimitiveColors.neutral800,
    secondaryBorder: DsPrimitiveColors.neutral300,
    dangerBg:        DsPrimitiveColors.red700,
    dangerFg:        DsPrimitiveColors.neutral0,
    surfaceDefault:  DsPrimitiveColors.neutral0,
    surfaceSubtle:   DsPrimitiveColors.neutral50,
    surfaceRaised:   DsPrimitiveColors.neutral100,
    textDefault:     DsPrimitiveColors.neutral900,
    textSubtle:      DsPrimitiveColors.neutral500,
    textDisabled:    DsPrimitiveColors.neutral400,
    textInverse:     DsPrimitiveColors.neutral0,
    borderDefault:   DsPrimitiveColors.neutral200,
    borderStrong:    DsPrimitiveColors.neutral400,
    radiusInteractive: DsPrimitiveRadius.md,
    radiusCard:        DsPrimitiveRadius.lg,
    radiusBadge:       DsPrimitiveRadius.full,
    fontFamilySans:    DsPrimitiveTypography.fontFamilySans,
  );

  /// Tenant A — blue primary, tighter radius.
  static const DsTenantTokens tenantA = DsTenantTokens(
    primaryBg:       DsPrimitiveColors.blue500,
    primaryBgHover:  DsPrimitiveColors.blue600,
    primaryFg:       DsPrimitiveColors.neutral0,
    primaryBorder:   DsPrimitiveColors.blue700,
    secondaryBg:     DsPrimitiveColors.neutral100,
    secondaryBgHover:DsPrimitiveColors.neutral200,
    secondaryFg:     DsPrimitiveColors.neutral800,
    secondaryBorder: DsPrimitiveColors.neutral300,
    dangerBg:        DsPrimitiveColors.red700,
    dangerFg:        DsPrimitiveColors.neutral0,
    surfaceDefault:  DsPrimitiveColors.neutral0,
    surfaceSubtle:   DsPrimitiveColors.neutral50,
    surfaceRaised:   DsPrimitiveColors.neutral100,
    textDefault:     DsPrimitiveColors.neutral900,
    textSubtle:      DsPrimitiveColors.neutral500,
    textDisabled:    DsPrimitiveColors.neutral400,
    textInverse:     DsPrimitiveColors.neutral0,
    borderDefault:   DsPrimitiveColors.neutral200,
    borderStrong:    DsPrimitiveColors.neutral400,
    radiusInteractive: 4,
    radiusCard:        6,
    radiusBadge:       DsPrimitiveRadius.full,
    fontFamilySans:    DsPrimitiveTypography.fontFamilySans,
  );

  /// Tenant BJB — deep blue primary, BJB Sans font, tight radius.
  static const DsTenantTokens tenantBjb = DsTenantTokens(
    primaryBg:       DsPrimitiveColors.blue600,
    primaryBgHover:  DsPrimitiveColors.blue700,
    primaryFg:       DsPrimitiveColors.neutral0,
    primaryBorder:   DsPrimitiveColors.blue800,
    secondaryBg:     DsPrimitiveColors.neutral100,
    secondaryBgHover:DsPrimitiveColors.neutral200,
    secondaryFg:     DsPrimitiveColors.neutral800,
    secondaryBorder: DsPrimitiveColors.neutral300,
    dangerBg:        DsPrimitiveColors.red700,
    dangerFg:        DsPrimitiveColors.neutral0,
    surfaceDefault:  DsPrimitiveColors.neutral0,
    surfaceSubtle:   DsPrimitiveColors.neutral50,
    surfaceRaised:   DsPrimitiveColors.neutral100,
    textDefault:     DsPrimitiveColors.neutral900,
    textSubtle:      DsPrimitiveColors.neutral500,
    textDisabled:    DsPrimitiveColors.neutral400,
    textInverse:     DsPrimitiveColors.neutral0,
    borderDefault:   DsPrimitiveColors.neutral200,
    borderStrong:    DsPrimitiveColors.neutral400,
    radiusInteractive: 4,
    radiusCard:        4,
    radiusBadge:       DsPrimitiveRadius.full,
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
