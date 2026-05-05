// Internal constants for [BTAvatar] — not exported from `avatar.dart`.
//
// Kept private (via `internal/` directory) so consumers can't depend
// on raw pixel values that may change with the design system. Mirrors
// buma-ui's `internal/` convention for component-private helpers.
//
// Component-specific avatar palette (6 brand colors) is HARDCODED here
// per the [component-specific colors rule](docs/architecture/figma-
// visual-rule.md). NEVER tokenize one-off palettes.

import 'package:btech_ui/src/components/molecules/avatar/avatar.types.dart';
import 'package:flutter/material.dart';

/// Pixel size of each [BTAvatarSize] — must stay in sync with
/// `BTAvatar.css` (web) and `BTAvatar.vue` (web).
const Map<BTAvatarSize, double> avatarPx = {
  BTAvatarSize.xs: 24,
  BTAvatarSize.sm: 32,
  BTAvatarSize.md: 40,
  BTAvatarSize.lg: 48,
  BTAvatarSize.xl: 64,
  BTAvatarSize.xxl: 96,
};

/// Font size per [BTAvatarSize] — matches Figma 497:979 typography ramp.
double fontSizeFor(BTAvatarSize s) => switch (s) {
      BTAvatarSize.xs => 10,
      BTAvatarSize.sm => 14,
      BTAvatarSize.md => 16,
      BTAvatarSize.lg => 20,
      BTAvatarSize.xl => 28,
      BTAvatarSize.xxl => 40,
    };

/// Stacking offset (negative left margin) per [BTAvatarSize] for
/// [BTAvatarGroup] horizontal overlap. Per Figma 504:705.
double stackOffsetFor(BTAvatarSize s) => switch (s) {
      BTAvatarSize.xs => 8,
      BTAvatarSize.sm => 10,
      BTAvatarSize.md => 12,
      BTAvatarSize.lg => 16,
      BTAvatarSize.xl => 20,
      BTAvatarSize.xxl => 32,
    };

/// Icon size for empty/error variant icons, proportional (~56%) to avatar px.
double iconSizeFor(BTAvatarSize s) => switch (s) {
      BTAvatarSize.xs => 14,
      BTAvatarSize.sm => 18,
      BTAvatarSize.md => 22,
      BTAvatarSize.lg => 26,
      BTAvatarSize.xl => 36,
      BTAvatarSize.xxl => 54,
    };

/// Component-specific brand palette — HARDCODED per Figma 497:979.
/// Do NOT tokenize these (component-specific colors policy).
const Map<BTAvatarColor, Color> avatarPalette = {
  BTAvatarColor.green: Color(0xFF89AE68),
  BTAvatarColor.blue: Color(0xFF93C6EF),
  BTAvatarColor.orange: Color(0xFFFC7B1F),
  BTAvatarColor.purple: Color(0xFF8873BD),
  BTAvatarColor.teal: Color(0xFF2FA0A1),
  BTAvatarColor.pink: Color(0xFFF37A98),
};
