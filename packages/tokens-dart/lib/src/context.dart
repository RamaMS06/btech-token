import 'package:flutter/material.dart';
import 'tenant.dart';
import 'theme.dart';

// =============================================================================
// Chained accessor classes — enable context.btechColor.background.primary
// These are thin wrappers that forward to BTechTenantTokens at runtime,
// so the value is always resolved from the active tenant's theme.
// =============================================================================

class _BTechContextColorBackground {
  final BTechTenantTokens _t;
  const _BTechContextColorBackground(this._t);

  /// Brand primary surface (e.g. button fill). Changes per tenant.
  Color get primary => _t.primaryBg;
  Color get primaryHover => _t.primaryBgHover;

  /// Neutral secondary surface.
  Color get secondary => _t.secondaryBg;
  Color get secondaryHover => _t.secondaryBgHover;

  /// Destructive action surface.
  Color get danger => _t.dangerBg;

  /// Page / card surfaces.
  Color get defaultBg => _t.surfaceDefault;
  Color get subtle => _t.surfaceSubtle;
  Color get raised => _t.surfaceRaised;
}

class _BTechContextColorText {
  final BTechTenantTokens _t;
  const _BTechContextColorText(this._t);

  /// Main body text color.
  Color get primary => _t.textDefault;

  /// Muted / secondary text.
  Color get secondary => _t.textSubtle;

  Color get disable => _t.textDisabled;
  Color get inverse => _t.textInverse;

  /// Text placed on a primary-colored surface.
  Color get onPrimary => _t.primaryFg;

  /// Text placed on a secondary-colored surface.
  Color get onSecondary => _t.secondaryFg;

  /// Text placed on a danger-colored surface.
  Color get onDanger => _t.dangerFg;
}

class _BTechContextColorStroke {
  final BTechTenantTokens _t;
  const _BTechContextColorStroke(this._t);

  Color get defaultStroke => _t.borderDefault;
  Color get strong => _t.borderStrong;
  Color get primary => _t.primaryBorder;
  Color get secondary => _t.secondaryBorder;
}

/// Tenant-aware color accessor returned by [context.btechColor].
/// Groups tokens by semantic category:
///   context.btechColor.background.primary
///   context.btechColor.text.primary
///   context.btechColor.stroke.primary
class BTechContextColor {
  final BTechTenantTokens _t;
  const BTechContextColor(this._t);

  _BTechContextColorBackground get background => _BTechContextColorBackground(_t);
  _BTechContextColorText get text => _BTechContextColorText(_t);
  _BTechContextColorStroke get stroke => _BTechContextColorStroke(_t);
}

/// Tenant-aware radius accessor returned by [context.btechRadius].
///   context.btechRadius.interactive
///   context.btechRadius.card
class BTechContextRadius {
  final BTechTenantTokens _t;
  const BTechContextRadius(this._t);

  double get interactive => _t.radiusInteractive;
  double get card => _t.radiusCard;
  double get badge => _t.radiusBadge;
}

// =============================================================================
// BuildContext extension — the public API
// =============================================================================

/// BuildContext extension for ergonomic, tenant-aware token access.
///
/// **Set the tenant ONCE at app root:**
/// ```dart
/// MaterialApp(
///   theme: BTechTheme.forTenant('tenant-bjb', Brightness.light),
///   home: MyApp(),
/// )
/// ```
///
/// **Use anywhere in the tree — no tenantId prop needed:**
/// ```dart
/// Container(color: context.btechColor.background.primary)
/// Text('Hi', style: TextStyle(color: context.btechColor.text.primary))
/// BorderRadius.circular(context.btechRadius.interactive)
/// ```
///
/// Note: [BTechColor.background.primary] is a static const and always returns
/// the default-tenant value. Use [context.btechColor] instead when you need
/// the value to change per tenant at runtime.
extension BTechTokensContext on BuildContext {
  BTechTenantTokens _tokens() {
    final ext = Theme.of(this).extension<BTechTokenExtension>();
    assert(
      ext != null,
      'BTech token context accessed but no BTechTokenExtension found in theme. '
      'Did you set MaterialApp(theme: BTechTheme.forTenant(...))?',
    );
    return ext!.tokens;
  }

  /// Flat access to the full token bag (all fields on [BTechTenantTokens]).
  BTechTenantTokens get btechTokens => _tokens();

  /// Returns null when no BTechTheme is active (graceful fallback).
  BTechTenantTokens? get btechTokensOrNull =>
      Theme.of(this).extension<BTechTokenExtension>()?.tokens;

  /// Chained color accessor.
  /// ```dart
  /// context.btechColor.background.primary   // tenant-aware brand color
  /// context.btechColor.text.secondary       // muted text
  /// context.btechColor.stroke.defaultStroke // border color
  /// ```
  BTechContextColor get btechColor => BTechContextColor(_tokens());

  /// Chained radius accessor.
  /// ```dart
  /// BorderRadius.circular(context.btechRadius.interactive)
  /// ```
  BTechContextRadius get btechRadius => BTechContextRadius(_tokens());

  /// Active tenant's font family (changes per tenant).
  String get btechFontFamily => _tokens().fontFamilySans;
}
