/// BAvatar — circular badge with image / initials / count / placeholder.
///
/// Sliced from Figma `Avatar` (node 497:979). Mirrors the React/Vue Avatar
/// API one-to-one — same prop names, same enum values, same defaults — so
/// designers and devs can move between platforms without re-learning
/// component contracts.
///
/// Variant precedence (highest first):
///   1. status == BAvatarStatus.error → broken-image icon, neutral bg
///   2. imageUrl != null               → NetworkImage (with bg color tint)
///   3. count != null                  → "+N" overflow counter
///   4. initials != null               → 1-2 letters, colored bg
///   5. (default)                      → empty placeholder (person icon)
///
/// Tenant theming flows through context.btechColor + btechTheme(); avatar
/// brand-palette colors (green/blue/orange/etc.) are currently hardcoded
/// because Figma did not tokenize them. Once `color.avatar.*` semantic
/// tokens land, swap the `_avatarPalette` map for context lookups.
import 'package:btech_tokens/btech_tokens.dart';
import 'package:flutter/material.dart';

/// Avatar size — matches the six Figma variants (24/32/40/48/64/96 px).
enum BAvatarSize { xs, sm, md, lg, xl, xxl }

/// Branded background colors for initials and image-tint variants.
enum BAvatarColor { green, blue, orange, purple, teal, pink }

/// Optional status override. Currently only `error` is supported (broken
/// image fallback). Extend here when more states arrive (loading, online,
/// offline, etc.).
enum BAvatarStatus { error }

/// Pixel size of each [BAvatarSize] — must match Avatar.css/BAvatar.vue.
const Map<BAvatarSize, double> _avatarPx = {
  BAvatarSize.xs: 24,
  BAvatarSize.sm: 32,
  BAvatarSize.md: 40,
  BAvatarSize.lg: 48,
  BAvatarSize.xl: 64,
  BAvatarSize.xxl: 96,
};

/// Font size per [BAvatarSize] — matches Figma typography ramp.
double _fontSizeFor(BAvatarSize s) {
  switch (s) {
    case BAvatarSize.xs:  return 10; // fontSize.2xs
    case BAvatarSize.sm:  return 14; // fontSize.sm
    case BAvatarSize.md:  return 16; // fontSize.md
    case BAvatarSize.lg:  return 20; // fontSize.xl
    case BAvatarSize.xl:  return 28; // fontSize.3xl
    case BAvatarSize.xxl: return 40; // fontSize.5xl
  }
}

/// Icon edge length per [BAvatarSize] — Figma uses ~67% of avatar width.
double _iconSizeFor(BAvatarSize s) => _avatarPx[s]! * 0.67;

/// Hardcoded brand palette — TODO: tokenize via color.avatar.*.
const Map<BAvatarColor, Color> _avatarPalette = {
  BAvatarColor.green:  Color(0xFF89AE68),
  BAvatarColor.blue:   Color(0xFF93C6EF),
  BAvatarColor.orange: Color(0xFFFC7B1F),
  BAvatarColor.purple: Color(0xFF8873BD),
  BAvatarColor.teal:   Color(0xFF2FA0A1),
  BAvatarColor.pink:   Color(0xFFF37A98),
};

/// BAvatar widget — see file header for variant precedence.
class BAvatar extends StatelessWidget {
  final BAvatarSize size;
  final String? imageUrl;
  final String? initials;
  final BAvatarColor color;
  final int? count;
  final BAvatarStatus? status;

  const BAvatar({
    super.key,
    this.size = BAvatarSize.md,
    this.imageUrl,
    this.initials,
    this.color = BAvatarColor.green,
    this.count,
    this.status,
  });

  bool get _isError    => status == BAvatarStatus.error;
  bool get _isImage    => !_isError && imageUrl != null;
  bool get _isCount    => !_isError && !_isImage && count != null;
  bool get _isInitials => !_isError && !_isImage && !_isCount && initials != null;
  bool get _isEmpty    => !_isError && !_isImage && !_isCount && !_isInitials;

  @override
  Widget build(BuildContext context) {
    final pxSize = _avatarPx[size]!;
    final neutralBg = context.btechColor.bg.subtler;
    final neutralFg = context.btechColor.text.secondary;
    final inverseFg = context.btechColor.text.inverse;

    final Color background = _isError || _isCount || _isEmpty
        ? neutralBg
        : (_avatarPalette[color] ?? _avatarPalette[BAvatarColor.green]!);

    Widget child;
    if (_isImage) {
      child = ClipOval(
        child: Image.network(
          imageUrl!,
          width: pxSize,
          height: pxSize,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _hideImageIcon(neutralFg),
        ),
      );
    } else if (_isError) {
      child = _hideImageIcon(neutralFg);
    } else if (_isCount) {
      child = Text('+$count', style: _textStyle(neutralFg));
    } else if (_isInitials) {
      child = Text(initials!, style: _textStyle(inverseFg));
    } else {
      child = Icon(Icons.person, size: _iconSizeFor(size), color: neutralFg);
    }

    return Container(
      width: pxSize,
      height: pxSize,
      alignment: Alignment.center,
      decoration: BoxDecoration(color: background, shape: BoxShape.circle),
      child: child,
    );
  }

  TextStyle _textStyle(Color color) => TextStyle(
        color: color,
        fontSize: _fontSizeFor(size),
        fontWeight: FontWeight.w500,
        fontFamily: BTechTypography.fontFamily, // tenant-aware font registry
        height: 1.0,
      );

  Widget _hideImageIcon(Color color) =>
      Icon(Icons.hide_image_outlined, size: _iconSizeFor(size), color: color);
}
