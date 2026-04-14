import 'package:flutter/material.dart';
import 'tenant.dart';
import 'theme.dart';

// =============================================================================
// Tenant-aware chained accessors — context.btechColor.background.primary
//
// Each leaf class extends Color so the object IS directly usable as a Color.
// Variant fields (hover, subtle, bolder, …) are extra properties on the same object.
//
// Usage:
//   Container(color: context.btechColor.background.primary)         ← IS a Color
//   Container(color: context.btechColor.background.primary.hover)   ← also a Color
//   Text('x', style: TextStyle(color: context.btechColor.text.neutral))
//   Text('x', style: TextStyle(color: context.btechColor.text.neutral.subtle))
// =============================================================================

// ── Background / surface ─────────────────────────────────────────────────────

class _BTechContextColorBackgroundSurface extends Color {
  _BTechContextColorBackgroundSurface(BTechTenantTokens t)
    : subtle = t.colorBackgroundSurfaceSubtle,
      raised = t.colorBackgroundSurfaceRaised,
      // ignore: deprecated_member_use
      super(t.colorBackgroundSurface.value);

  final Color subtle;
  final Color raised;
}

// ── Background / primary ─────────────────────────────────────────────────────

class _BTechContextColorBackgroundPrimary extends Color {
  _BTechContextColorBackgroundPrimary(BTechTenantTokens t)
    : hover = t.colorBackgroundPrimaryHover,
      // ignore: deprecated_member_use
      super(t.colorBackgroundPrimary.value);

  final Color hover;
}

// ── Background / secondary ───────────────────────────────────────────────────

class _BTechContextColorBackgroundSecondary extends Color {
  _BTechContextColorBackgroundSecondary(BTechTenantTokens t)
    : hover = t.colorBackgroundSecondaryHover,
      // ignore: deprecated_member_use
      super(t.colorBackgroundSecondary.value);

  final Color hover;
}

// ── Background / danger ──────────────────────────────────────────────────────

class _BTechContextColorBackgroundDanger extends Color {
  // ignore: deprecated_member_use
  _BTechContextColorBackgroundDanger(BTechTenantTokens t) : super(t.colorBackgroundDanger.value);
}

// ── Background group ─────────────────────────────────────────────────────────

class _BTechContextColorBackground {
  final BTechTenantTokens _t;
  const _BTechContextColorBackground(this._t);

  _BTechContextColorBackgroundSurface   get surface   => _BTechContextColorBackgroundSurface(_t);
  _BTechContextColorBackgroundPrimary   get primary   => _BTechContextColorBackgroundPrimary(_t);
  _BTechContextColorBackgroundSecondary get secondary => _BTechContextColorBackgroundSecondary(_t);
  _BTechContextColorBackgroundDanger    get danger    => _BTechContextColorBackgroundDanger(_t);
}

// ── Text / neutral ───────────────────────────────────────────────────────────

class _BTechContextColorTextNeutral extends Color {
  _BTechContextColorTextNeutral(BTechTenantTokens t)
    : subtle   = t.colorTextNeutralSubtle,
      disabled = t.colorTextNeutralDisabled,
      inverse  = t.colorTextNeutralInverse,
      // ignore: deprecated_member_use
      super(t.colorTextNeutral.value);

  final Color subtle;
  final Color disabled;
  final Color inverse;
}

// ── Text / on ────────────────────────────────────────────────────────────────

class _BTechContextColorTextOn {
  final BTechTenantTokens _t;
  const _BTechContextColorTextOn(this._t);

  Color get primary   => _t.colorTextOnPrimary;
  Color get secondary => _t.colorTextOnSecondary;
  Color get danger    => _t.colorTextOnDanger;
}

// ── Text group ───────────────────────────────────────────────────────────────

class _BTechContextColorText {
  final BTechTenantTokens _t;
  const _BTechContextColorText(this._t);

  _BTechContextColorTextNeutral get neutral => _BTechContextColorTextNeutral(_t);
  _BTechContextColorTextOn      get on      => _BTechContextColorTextOn(_t);
}

// ── Stroke / neutral ─────────────────────────────────────────────────────────

class _BTechContextColorStrokeNeutral extends Color {
  _BTechContextColorStrokeNeutral(BTechTenantTokens t)
    : strong = t.colorStrokeNeutralStrong,
      // ignore: deprecated_member_use
      super(t.colorStrokeNeutral.value);

  final Color strong;
}

// ── Stroke / primary ─────────────────────────────────────────────────────────

class _BTechContextColorStrokePrimary extends Color {
  // ignore: deprecated_member_use
  _BTechContextColorStrokePrimary(BTechTenantTokens t) : super(t.colorStrokePrimary.value);
}

// ── Stroke group ─────────────────────────────────────────────────────────────

class _BTechContextColorStroke {
  final BTechTenantTokens _t;
  const _BTechContextColorStroke(this._t);

  _BTechContextColorStrokeNeutral get neutral => _BTechContextColorStrokeNeutral(_t);
  _BTechContextColorStrokePrimary get primary => _BTechContextColorStrokePrimary(_t);
}

// ── Top-level color accessor ─────────────────────────────────────────────────

/// Tenant-aware color accessor returned by [context.btechColor].
///
/// Each property IS a [Color] — usable anywhere a Color is expected.
/// Variant states are accessible as sub-properties on the same object.
///
/// ```dart
/// Container(color: context.btechColor.background.primary)
/// Container(color: context.btechColor.background.primary.hover)
/// Text('x', style: TextStyle(color: context.btechColor.text.neutral))
/// Text('x', style: TextStyle(color: context.btechColor.text.neutral.subtle))
/// Divider(color: context.btechColor.stroke.neutral)
/// Divider(color: context.btechColor.stroke.neutral.strong)
/// ```
class BTechContextColor {
  final BTechTenantTokens _t;
  const BTechContextColor(this._t);

  _BTechContextColorBackground get background => _BTechContextColorBackground(_t);
  _BTechContextColorText       get text       => _BTechContextColorText(_t);
  _BTechContextColorStroke     get stroke     => _BTechContextColorStroke(_t);
}

// ── Radius accessor ───────────────────────────────────────────────────────────

/// Tenant-aware radius accessor returned by [context.btechRadius].
///
/// ```dart
/// BorderRadius.circular(context.btechRadius.interactive)
/// BorderRadius.circular(context.btechRadius.card)
/// ```
class BTechContextRadius {
  final BTechTenantTokens _t;
  const BTechContextRadius(this._t);

  double get interactive => _t.radiusInteractive;
  double get card        => _t.radiusCard;
  double get badge       => _t.radiusBadge;
}

// =============================================================================
// BuildContext extension — public API
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
/// Container(color: context.btechColor.background.primary.hover)
/// Text('Hi', style: TextStyle(color: context.btechColor.text.neutral))
/// BorderRadius.circular(context.btechRadius.interactive)
/// ```
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

  /// Full resolved tenant token bag.
  BTechTenantTokens get btechTokens => _tokens();

  /// Returns null when no BTechTheme is active (graceful fallback).
  BTechTenantTokens? get btechTokensOrNull =>
      Theme.of(this).extension<BTechTokenExtension>()?.tokens;

  /// Chained color accessor. Each leaf IS a [Color]; variants are sub-fields.
  /// ```dart
  /// context.btechColor.background.primary        // Color (tenant brand)
  /// context.btechColor.background.primary.hover  // Color (hover state)
  /// context.btechColor.text.neutral              // Color
  /// context.btechColor.text.neutral.subtle       // Color
  /// ```
  BTechContextColor get btechColor => BTechContextColor(_tokens());

  /// Chained radius accessor.
  /// ```dart
  /// BorderRadius.circular(context.btechRadius.interactive)
  /// ```
  BTechContextRadius get btechRadius => BTechContextRadius(_tokens());

  /// Active tenant's font family string.
  String get btechFontFamily => _tokens().typographyFontFamilySans;
}
