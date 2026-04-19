import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'tenant.dart';
import 'theme.dart';
import 'typography/font_registry.dart';

// =============================================================================
// Registry-driven font helper
//
// Uses BTechFontRegistry (generated from tokens/core/font-registry.json) to
// decide the correct loader for each font family:
//
//   google-fonts  → GoogleFonts.getFont()  (downloaded / cached on demand)
//   system/asset  → TextStyle(fontFamily:) (OS or asset pipeline resolves it)
//
// This replaces a try/catch around GoogleFonts.getFont() with a static,
// generated lookup — faster and fully predictable at compile time.
// =============================================================================

TextStyle _safeFont(
  String family, {
  double? fontSize,
  FontWeight? fontWeight,
  double? height,
  Color? color,
  FontStyle? fontStyle,
  TextDecoration? decoration,
}) {
  if (BTechFontRegistry.isGoogleFont(family)) {
    return GoogleFonts.getFont(
      family,
      fontSize: fontSize,
      fontWeight: fontWeight,
      height: height,
      color: color,
      fontStyle: fontStyle,
      decoration: decoration,
    );
  }
  return TextStyle(
    fontFamily: family,
    fontSize: fontSize,
    fontWeight: fontWeight,
    height: height,
    color: color,
    fontStyle: fontStyle,
    decoration: decoration,
  );
}

// =============================================================================
// Tenant-aware chained accessors
//
// Pattern: each top-level accessor (btechColor / btechRadius / btechFont) reads
// BTechTenantTokens from the theme extension and resolves live values.
//
// Usage:
//   context.btechColor.background.primary        // Color — tenant brand
//   context.btechColor.text.neutral.subtle        // Color — tenant neutral
//   context.btechRadius.interactive               // double
//   context.btechFont.heading.h1                  // TextStyle — tenant font family
//   context.btechFont.body.bold                   // TextStyle
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
    : hover    = t.colorBackgroundPrimaryHover,
      pressed  = t.colorBackgroundPrimaryPressed,
      disable  = t.colorBackgroundPrimaryDisable,
      subtle   = t.colorBackgroundPrimarySubtle,
      // ignore: deprecated_member_use
      super(t.colorBackgroundPrimary.value);

  final Color hover;
  final Color pressed;
  final Color disable;
  final Color subtle;
}

// ── Background / secondary ───────────────────────────────────────────────────

class _BTechContextColorBackgroundSecondary extends Color {
  _BTechContextColorBackgroundSecondary(BTechTenantTokens t)
    : hover    = t.colorBackgroundSecondaryHover,
      pressed  = t.colorBackgroundSecondaryPressed,
      disable  = t.colorBackgroundSecondaryDisable,
      subtle   = t.colorBackgroundSecondarySubtle,
      // ignore: deprecated_member_use
      super(t.colorBackgroundSecondary.value);

  final Color hover;
  final Color pressed;
  final Color disable;
  final Color subtle;
}

// ── Background / danger ──────────────────────────────────────────────────────

class _BTechContextColorBackgroundDanger extends Color {
  _BTechContextColorBackgroundDanger(BTechTenantTokens t)
    : hover    = t.colorBackgroundDangerHover,
      pressed  = t.colorBackgroundDangerPressed,
      disable  = t.colorBackgroundDangerDisable,
      subtle   = t.colorBackgroundDangerSubtle,
      // ignore: deprecated_member_use
      super(t.colorBackgroundDanger.value);

  final Color hover;
  final Color pressed;
  final Color disable;
  final Color subtle;
}

// ── Background / success ─────────────────────────────────────────────────────

class _BTechContextColorBackgroundSuccess extends Color {
  _BTechContextColorBackgroundSuccess(BTechTenantTokens t)
    : subtle = t.colorBackgroundSuccessSubtle,
      // ignore: deprecated_member_use
      super(t.colorBackgroundSuccess.value);

  final Color subtle;
}

// ── Background / warning ─────────────────────────────────────────────────────

class _BTechContextColorBackgroundWarning extends Color {
  _BTechContextColorBackgroundWarning(BTechTenantTokens t)
    : subtle = t.colorBackgroundWarningSubtle,
      // ignore: deprecated_member_use
      super(t.colorBackgroundWarning.value);

  final Color subtle;
}

// ── Background / info ────────────────────────────────────────────────────────

class _BTechContextColorBackgroundInfo extends Color {
  _BTechContextColorBackgroundInfo(BTechTenantTokens t)
    : subtle = t.colorBackgroundInfoSubtle,
      // ignore: deprecated_member_use
      super(t.colorBackgroundInfo.value);

  final Color subtle;
}

// ── Background / neutral ─────────────────────────────────────────────────────

class _BTechContextColorBackgroundNeutral extends Color {
  _BTechContextColorBackgroundNeutral(BTechTenantTokens t)
    : subtle = t.colorBackgroundNeutralSubtle,
      // ignore: deprecated_member_use
      super(t.colorBackgroundNeutral.value);

  final Color subtle;
}

// ── Background group ─────────────────────────────────────────────────────────

class _BTechContextColorBackground {
  final BTechTenantTokens _t;
  const _BTechContextColorBackground(this._t);

  _BTechContextColorBackgroundSurface   get surface   => _BTechContextColorBackgroundSurface(_t);
  _BTechContextColorBackgroundPrimary   get primary   => _BTechContextColorBackgroundPrimary(_t);
  _BTechContextColorBackgroundSecondary get secondary => _BTechContextColorBackgroundSecondary(_t);
  _BTechContextColorBackgroundDanger    get danger    => _BTechContextColorBackgroundDanger(_t);
  _BTechContextColorBackgroundSuccess   get success   => _BTechContextColorBackgroundSuccess(_t);
  _BTechContextColorBackgroundWarning   get warning   => _BTechContextColorBackgroundWarning(_t);
  _BTechContextColorBackgroundInfo      get info      => _BTechContextColorBackgroundInfo(_t);
  _BTechContextColorBackgroundNeutral   get neutral   => _BTechContextColorBackgroundNeutral(_t);
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
  Color get info      => _t.colorTextOnInfo;
}

// ── Text group ───────────────────────────────────────────────────────────────

class _BTechContextColorText {
  final BTechTenantTokens _t;
  const _BTechContextColorText(this._t);

  _BTechContextColorTextNeutral get neutral => _BTechContextColorTextNeutral(_t);
  _BTechContextColorTextOn      get on      => _BTechContextColorTextOn(_t);
}

// ── Icon / neutral ────────────────────────────────────────────────────────────

class _BTechContextColorIconNeutral extends Color {
  _BTechContextColorIconNeutral(BTechTenantTokens t)
    : subtle   = t.colorIconNeutralSubtle,
      disabled = t.colorIconNeutralDisabled,
      inverse  = t.colorIconNeutralInverse,
      // ignore: deprecated_member_use
      super(t.colorIconNeutral.value);

  final Color subtle;
  final Color disabled;
  final Color inverse;
}

// ── Icon / on ────────────────────────────────────────────────────────────────

class _BTechContextColorIconOn {
  final BTechTenantTokens _t;
  const _BTechContextColorIconOn(this._t);

  Color get primary => _t.colorIconOnPrimary;
  Color get danger  => _t.colorIconOnDanger;
}

// ── Icon group ────────────────────────────────────────────────────────────────

/// Tenant-aware icon color accessor returned by [context.btechColor.icon].
///
/// ```dart
/// Icon(Icons.check, color: context.btechColor.icon.neutral)
/// Icon(Icons.error, color: context.btechColor.icon.neutral.subtle)
/// Icon(Icons.close, color: context.btechColor.icon.on.primary)
/// ```
class _BTechContextColorIcon {
  final BTechTenantTokens _t;
  const _BTechContextColorIcon(this._t);

  _BTechContextColorIconNeutral get neutral => _BTechContextColorIconNeutral(_t);
  _BTechContextColorIconOn      get on      => _BTechContextColorIconOn(_t);
}

// ── Stroke / neutral ─────────────────────────────────────────────────────────

class _BTechContextColorStrokeNeutral extends Color {
  _BTechContextColorStrokeNeutral(BTechTenantTokens t)
    : strong = t.colorStrokeNeutralStrong,
      subtle = t.colorStrokeNeutralSubtle,
      // ignore: deprecated_member_use
      super(t.colorStrokeNeutral.value);

  final Color strong;
  final Color subtle;
}

// ── Stroke / primary ─────────────────────────────────────────────────────────

class _BTechContextColorStrokePrimary extends Color {
  _BTechContextColorStrokePrimary(BTechTenantTokens t)
    : bolder = t.colorStrokePrimaryBolder,
      // ignore: deprecated_member_use
      super(t.colorStrokePrimary.value);

  final Color bolder;
}

// ── Stroke / danger ──────────────────────────────────────────────────────────

class _BTechContextColorStrokeDanger extends Color {
  // ignore: deprecated_member_use
  _BTechContextColorStrokeDanger(BTechTenantTokens t) : super(t.colorStrokeDanger.value);
}

// ── Stroke group ─────────────────────────────────────────────────────────────

class _BTechContextColorStroke {
  final BTechTenantTokens _t;
  const _BTechContextColorStroke(this._t);

  _BTechContextColorStrokeNeutral get neutral => _BTechContextColorStrokeNeutral(_t);
  _BTechContextColorStrokePrimary get primary => _BTechContextColorStrokePrimary(_t);
  _BTechContextColorStrokeDanger  get danger  => _BTechContextColorStrokeDanger(_t);
}

// ── Top-level color accessor ─────────────────────────────────────────────────

/// Tenant-aware color accessor returned by [context.btechColor].
///
/// Each property IS a [Color] — usable anywhere a Color is expected.
/// State variants are sub-fields on the returned Color.
///
/// ```dart
/// // Background
/// Container(color: context.btechColor.background.primary)
/// Container(color: context.btechColor.background.primary.hover)
/// Container(color: context.btechColor.background.primary.pressed)
/// Container(color: context.btechColor.background.danger.subtle)
/// Container(color: context.btechColor.background.neutral)
///
/// // Text
/// Text('x', style: TextStyle(color: context.btechColor.text.neutral))
/// Text('x', style: TextStyle(color: context.btechColor.text.neutral.subtle))
/// Text('x', style: TextStyle(color: context.btechColor.text.on.primary))
///
/// // Icon
/// Icon(Icons.check, color: context.btechColor.icon.neutral)
/// Icon(Icons.check, color: context.btechColor.icon.neutral.subtle)
/// Icon(Icons.close, color: context.btechColor.icon.on.danger)
///
/// // Stroke
/// Divider(color: context.btechColor.stroke.neutral)
/// Divider(color: context.btechColor.stroke.neutral.strong)
/// Divider(color: context.btechColor.stroke.primary.bolder)
/// ```
class BTechContextColor {
  final BTechTenantTokens _t;
  const BTechContextColor(this._t);

  _BTechContextColorBackground get background => _BTechContextColorBackground(_t);
  _BTechContextColorText       get text       => _BTechContextColorText(_t);
  _BTechContextColorIcon       get icon       => _BTechContextColorIcon(_t);
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
// Tenant-aware font accessors — context.btechFont.heading.h1
//
// Font family is resolved from BTechTenantTokens.typographyFontFamilySans at
// runtime, so switching tenants automatically switches the font.
//
// GoogleFonts.getFont() is used so the font is downloaded/cached on demand.
//
// Usage:
//   Text('Title',   style: context.btechFont.heading.h1)
//   Text('Section', style: context.btechFont.subheading.h5)
//   Text('Copy',    style: context.btechFont.body.bold)
//   Text('Hint',    style: context.btechFont.body.small)
// =============================================================================

// ── Font / heading ────────────────────────────────────────────────────────────

class _BTechContextFontHeading {
  final BTechTenantTokens _t;
  const _BTechContextFontHeading(this._t);

  /// h1 — 35px · bold · lineHeight 40/35 = 1.143
  TextStyle get h1 => _safeFont(_t.typographyFontFamilySans,
      fontSize: 35, fontWeight: FontWeight.w700, height: 40 / 35);

  /// h2 — 29px · w600 · lineHeight 32/29 = 1.103
  TextStyle get h2 => _safeFont(_t.typographyFontFamilySans,
      fontSize: 29, fontWeight: FontWeight.w600, height: 32 / 29);

  /// h3 — 24px · bold · color: text.neutral · lineHeight 28/24 = 1.167
  TextStyle get h3 => _safeFont(_t.typographyFontFamilySans,
      fontSize: 24, fontWeight: FontWeight.w700, height: 28 / 24,
      color: _t.colorTextNeutral);

  /// h4 — 20px · w500 · color: text.neutral · lineHeight 24/20 = 1.200
  TextStyle get h4 => _safeFont(_t.typographyFontFamilySans,
      fontSize: 20, fontWeight: FontWeight.w500, height: 24 / 20,
      color: _t.colorTextNeutral);
}

// ── Font / subheading ─────────────────────────────────────────────────────────

class _BTechContextFontSubHeading {
  final BTechTenantTokens _t;
  const _BTechContextFontSubHeading(this._t);

  /// h5 — 16px · bold · color: text.neutral · lineHeight 20/16 = 1.250
  TextStyle get h5 => _safeFont(_t.typographyFontFamilySans,
      fontSize: 16, fontWeight: FontWeight.w700, height: 20 / 16,
      color: _t.colorTextNeutral);

  /// h6 — 14px · w600 · color: text.neutral · lineHeight 16/14 = 1.143
  TextStyle get h6 => _safeFont(_t.typographyFontFamilySans,
      fontSize: 14, fontWeight: FontWeight.w600, height: 16 / 14,
      color: _t.colorTextNeutral);

  /// h7 — 12px · w600 · color: text.neutral · lineHeight 16/12 = 1.333
  TextStyle get h7 => _safeFont(_t.typographyFontFamilySans,
      fontSize: 12, fontWeight: FontWeight.w600, height: 16 / 12,
      color: _t.colorTextNeutral);
}

// ── Font / body ───────────────────────────────────────────────────────────────

class _BTechContextFontBody {
  final BTechTenantTokens _t;
  const _BTechContextFontBody(this._t);

  /// Default body — 12px · w500 · lineHeight 16/12 = 1.333
  TextStyle get base => _safeFont(_t.typographyFontFamilySans,
      fontSize: 12, fontWeight: FontWeight.w500, height: 16 / 12,
      color: _t.colorTextNeutral);

  /// Bold body — 12px · bold · lineHeight 16/12 = 1.333
  TextStyle get bold => _safeFont(_t.typographyFontFamilySans,
      fontSize: 12, fontWeight: FontWeight.w700, height: 16 / 12,
      color: _t.colorTextNeutral);

  /// Small body — 11px · w500 · lineHeight 16/11 = 1.455
  TextStyle get small => _safeFont(_t.typographyFontFamilySans,
      fontSize: 11, fontWeight: FontWeight.w500, height: 16 / 11,
      color: _t.colorTextNeutral);

  /// Medium body — 14px · w500 · lineHeight 18/14 = 1.286
  TextStyle get medium => _safeFont(_t.typographyFontFamilySans,
      fontSize: 14, fontWeight: FontWeight.w500, height: 18 / 14,
      color: _t.colorTextNeutral);

  /// Extra small body — 8px · w500 · lineHeight 12/8 = 1.500
  TextStyle get xstraSmall => _safeFont(_t.typographyFontFamilySans,
      fontSize: 8, fontWeight: FontWeight.w500, height: 12 / 8,
      color: _t.colorTextNeutral);

  /// Italic body — 12px · w500 · italic · lineHeight 16/12 = 1.333
  TextStyle get italic => _safeFont(_t.typographyFontFamilySans,
      fontSize: 12, fontWeight: FontWeight.w500, height: 16 / 12,
      fontStyle: FontStyle.italic, color: _t.colorTextNeutral);

  /// Underline body — 12px · w600 · underline · lineHeight 16/12 = 1.333
  TextStyle get underline => _safeFont(_t.typographyFontFamilySans,
      fontSize: 12, fontWeight: FontWeight.w600, height: 16 / 12,
      decoration: TextDecoration.underline, color: _t.colorTextNeutral);

  /// Paragraph body — 12px · w500 · lineHeight 24/12 = 2.000 (relaxed)
  TextStyle get paragraph => _safeFont(_t.typographyFontFamilySans,
      fontSize: 12, fontWeight: FontWeight.w500, height: 24 / 12,
      color: _t.colorTextNeutral);
}

// ── Top-level font accessor ───────────────────────────────────────────────────

/// Tenant-aware font accessor returned by [context.btechFont].
///
/// Font family is resolved from the active tenant at runtime.
/// Switching tenants (e.g. Default → Tenant BJB) automatically switches
/// every TextStyle from Inter → Poppins without any code change.
///
/// ```dart
/// Text('Hero',    style: context.btechFont.heading.h1)
/// Text('Title',   style: context.btechFont.heading.h3)
/// Text('Section', style: context.btechFont.subheading.h5)
/// Text('Label',   style: context.btechFont.subheading.h6)
/// Text('Body',    style: context.btechFont.body.base)
/// Text('Bold',    style: context.btechFont.body.bold)
/// Text('Hint',    style: context.btechFont.body.small)
/// Text('Note',    style: context.btechFont.body.paragraph)
/// ```
class BTechContextFont {
  final BTechTenantTokens _t;
  const BTechContextFont(this._t);

  _BTechContextFontHeading    get heading    => _BTechContextFontHeading(_t);
  _BTechContextFontSubHeading get subheading => _BTechContextFontSubHeading(_t);
  _BTechContextFontBody       get body       => _BTechContextFontBody(_t);
}

// =============================================================================
// BuildContext extension — public API
// =============================================================================

/// BuildContext extension for ergonomic, tenant-aware token access.
///
/// Set the tenant **once** at the app root:
/// ```dart
/// MaterialApp(
///   theme: BTechTheme.forTenant('tenant-bjb', Brightness.light),
///   home: MyApp(),
/// )
/// ```
///
/// Then read tokens anywhere in the widget tree — no tenantId prop needed:
/// ```dart
/// // Colors
/// Container(color: context.btechColor.background.primary)
/// Container(color: context.btechColor.background.primary.hover)
/// Text('x', style: TextStyle(color: context.btechColor.text.neutral.subtle))
///
/// // Radius
/// BorderRadius.circular(context.btechRadius.interactive)
///
/// // Typography — tenant font family applied automatically
/// Text('Hero',  style: context.btechFont.heading.h1)
/// Text('Body',  style: context.btechFont.body.bold)
/// Text('Small', style: context.btechFont.body.small)
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
  BTechContextColor get btechColor => BTechContextColor(_tokens());

  /// Chained radius accessor.
  BTechContextRadius get btechRadius => BTechContextRadius(_tokens());

  /// Tenant-aware font accessor.
  ///
  /// Font family switches automatically with the active tenant.
  /// ```dart
  /// Text('Title', style: context.btechFont.heading.h1)
  /// Text('Body',  style: context.btechFont.body.bold)
  /// ```
  BTechContextFont get btechFont => BTechContextFont(_tokens());

  /// Active tenant's raw font family string.
  String get btechFontFamily => _tokens().typographyFontFamilySans;
}
