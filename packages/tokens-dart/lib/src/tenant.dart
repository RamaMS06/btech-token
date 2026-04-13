import 'package:flutter/material.dart';
import 'generated.dart';

/// Semantic token set for a specific tenant.
/// Components consume these — never primitive tokens directly.
class BTechTenantTokens {
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

  const BTechTenantTokens({
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
  static const BTechTenantTokens defaultTokens = BTechTenantTokens(
    primaryBg:        Color(0xFF15803D),  // BTechColor.background.primary
    primaryBgHover:   Color(0xFF166534),  // BTechColor.background.primaryHover
    primaryFg:        Color(0xFFFFFFFF),  // BTechColor.text.onPrimary
    primaryBorder:    Color(0xFF166534),  // BTechColor.stroke.primary
    secondaryBg:      Color(0xFFF3F4F6),  // BTechColor.background.secondary
    secondaryBgHover: Color(0xFFE5E7EB),  // BTechColor.background.secondaryHover
    secondaryFg:      Color(0xFF1F2937),  // BTechColor.text.onSecondary
    secondaryBorder:  Color(0xFFD1D5DB),  // BTechColor.stroke.secondary
    dangerBg:         Color(0xFFB91C1C),  // BTechColor.background.danger
    dangerFg:         Color(0xFFFFFFFF),  // BTechColor.text.onDanger
    surfaceDefault:   Color(0xFFFFFFFF),  // BTechColor.background.defaultBg
    surfaceSubtle:    Color(0xFFF9FAFB),  // BTechColor.background.subtle
    surfaceRaised:    Color(0xFFF3F4F6),  // BTechColor.background.raised
    textDefault:      Color(0xFF111827),  // BTechColor.text.primary
    textSubtle:       Color(0xFF6B7280),  // BTechColor.text.secondary
    textDisabled:     Color(0xFF9CA3AF),  // BTechColor.text.disable
    textInverse:      Color(0xFFFFFFFF),  // BTechColor.text.inverse
    borderDefault:    Color(0xFFE5E7EB),  // BTechColor.stroke.defaultStroke
    borderStrong:     Color(0xFF9CA3AF),  // BTechColor.stroke.strong
    radiusInteractive: BTechSemanticRadius.interactive,
    radiusCard:        BTechSemanticRadius.card,
    radiusBadge:       BTechSemanticRadius.badge,
    fontFamilySans:    BTechFontFamily.sans,
  );

  /// Tenant A — blue primary, tighter radius.
  static const BTechTenantTokens tenantA = BTechTenantTokens(
    primaryBg:        Color(0xFF3B82F6),  // BTechPrimitiveColor.blue.s500
    primaryBgHover:   Color(0xFF2563EB),  // BTechPrimitiveColor.blue.s600
    primaryFg:        Color(0xFFFFFFFF),  // BTechPrimitiveColor.neutral.s0
    primaryBorder:    Color(0xFF1D4ED8),  // BTechPrimitiveColor.blue.s700
    secondaryBg:      Color(0xFFF3F4F6),  // BTechPrimitiveColor.neutral.s100
    secondaryBgHover: Color(0xFFE5E7EB),  // BTechPrimitiveColor.neutral.s200
    secondaryFg:      Color(0xFF1F2937),  // BTechPrimitiveColor.neutral.s800
    secondaryBorder:  Color(0xFFD1D5DB),  // BTechPrimitiveColor.neutral.s300
    dangerBg:         Color(0xFFB91C1C),  // BTechPrimitiveColor.red.s700
    dangerFg:         Color(0xFFFFFFFF),  // BTechPrimitiveColor.neutral.s0
    surfaceDefault:   Color(0xFFFFFFFF),  // BTechPrimitiveColor.neutral.s0
    surfaceSubtle:    Color(0xFFF9FAFB),  // BTechPrimitiveColor.neutral.s50
    surfaceRaised:    Color(0xFFF3F4F6),  // BTechPrimitiveColor.neutral.s100
    textDefault:      Color(0xFF111827),  // BTechPrimitiveColor.neutral.s900
    textSubtle:       Color(0xFF6B7280),  // BTechPrimitiveColor.neutral.s500
    textDisabled:     Color(0xFF9CA3AF),  // BTechPrimitiveColor.neutral.s400
    textInverse:      Color(0xFFFFFFFF),  // BTechPrimitiveColor.neutral.s0
    borderDefault:    Color(0xFFE5E7EB),  // BTechPrimitiveColor.neutral.s200
    borderStrong:     Color(0xFF9CA3AF),  // BTechPrimitiveColor.neutral.s400
    radiusInteractive: 4,
    radiusCard:        6,
    radiusBadge:       BTechRadius.full,
    fontFamilySans:    BTechFontFamily.sans,
  );

  /// Tenant BJB — deep blue primary, BJB Sans font, tight radius.
  static const BTechTenantTokens tenantBjb = BTechTenantTokens(
    primaryBg:        Color(0xFF2563EB),  // BTechPrimitiveColor.blue.s600
    primaryBgHover:   Color(0xFF1D4ED8),  // BTechPrimitiveColor.blue.s700
    primaryFg:        Color(0xFFFFFFFF),  // BTechPrimitiveColor.neutral.s0
    primaryBorder:    Color(0xFF1E40AF),  // BTechPrimitiveColor.blue.s800
    secondaryBg:      Color(0xFFF3F4F6),  // BTechPrimitiveColor.neutral.s100
    secondaryBgHover: Color(0xFFE5E7EB),  // BTechPrimitiveColor.neutral.s200
    secondaryFg:      Color(0xFF1F2937),  // BTechPrimitiveColor.neutral.s800
    secondaryBorder:  Color(0xFFD1D5DB),  // BTechPrimitiveColor.neutral.s300
    dangerBg:         Color(0xFFB91C1C),  // BTechPrimitiveColor.red.s700
    dangerFg:         Color(0xFFFFFFFF),  // BTechPrimitiveColor.neutral.s0
    surfaceDefault:   Color(0xFFFFFFFF),  // BTechPrimitiveColor.neutral.s0
    surfaceSubtle:    Color(0xFFF9FAFB),  // BTechPrimitiveColor.neutral.s50
    surfaceRaised:    Color(0xFFF3F4F6),  // BTechPrimitiveColor.neutral.s100
    textDefault:      Color(0xFF111827),  // BTechPrimitiveColor.neutral.s900
    textSubtle:       Color(0xFF6B7280),  // BTechPrimitiveColor.neutral.s500
    textDisabled:     Color(0xFF9CA3AF),  // BTechPrimitiveColor.neutral.s400
    textInverse:      Color(0xFFFFFFFF),  // BTechPrimitiveColor.neutral.s0
    borderDefault:    Color(0xFFE5E7EB),  // BTechPrimitiveColor.neutral.s200
    borderStrong:     Color(0xFF9CA3AF),  // BTechPrimitiveColor.neutral.s400
    radiusInteractive: 4,
    radiusCard:        4,
    radiusBadge:       BTechRadius.full,
    fontFamilySans:    'BJB Sans',
  );

  /// Registry of all known tenants. Add new tenants here after running add-tenant.
  static const Map<String, BTechTenantTokens> _registry = {
    'default':    defaultTokens,
    'tenant-a':   tenantA,
    'tenant-bjb': tenantBjb,
  };

  /// Look up tokens by tenant ID. Falls back to [defaultTokens] if unknown.
  static BTechTenantTokens forTenant(String tenantId) {
    return _registry[tenantId] ?? defaultTokens;
  }
}
