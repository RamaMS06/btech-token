/// BTBadge — status label atom.
///
/// Sliced from Figma `Badge` (node 72:1516). Displays a pill-shaped label
/// that communicates an entity's status or category.
///
/// ## Variant precedence:
/// - [variant] drives the color palette.
/// - [reverseColors] inverts background and text: solid bg + white text.
///
/// ## Usage:
/// ```dart
/// // Normal
/// BTBadge(label: 'Approved', variant: BTBadgeVariant.success)
///
/// // With left icon
/// BTBadge(
///   label: 'Waiting',
///   variant: BTBadgeVariant.waiting,
///   leftIcon: const Icon(Icons.hourglass_empty, size: 16),
/// )
///
/// // Reverse (solid bg)
/// BTBadge(
///   label: 'Rejected',
///   variant: BTBadgeVariant.reject,
///   reverseColors: true,
/// )
/// ```
library;

import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/src/components/atoms/badge/badge.types.dart';
import 'package:flutter/material.dart';

/// Status label pill. See file header for usage examples.
class BTBadge extends StatelessWidget {
  const BTBadge({
    required this.label,
    this.variant = BTBadgeVariant.success,
    this.reverseColors = false,
    this.leftIcon,
    this.rightIcon,
    super.key,
  });

  /// Text shown inside the badge.
  final String label;

  /// Color palette — see [BTBadgeVariant].
  final BTBadgeVariant variant;

  /// When `true`, swaps to solid background + white text.
  final bool reverseColors;

  /// Optional widget rendered to the left of [label] (16×16 recommended).
  final Widget? leftIcon;

  /// Optional widget rendered to the right of [label] (16×16 recommended).
  final Widget? rightIcon;

  @override
  Widget build(BuildContext context) {
    // Figma node 72:1516 — all colors map to btech semantic tokens.
    final colors = context.btechColor;
    final (Color bg, Color fg) = switch ((variant, reverseColors)) {
      (BTBadgeVariant.success, false) => (
          colors.ext.successSubtler,
          colors.ext.successBold,
        ),
      (BTBadgeVariant.success, true) => (
          colors.ext.success,
          colors.text.inverse,
        ),
      (BTBadgeVariant.waiting, false) => (
          colors.ext.warningSubtler,
          colors.ext.warningBold,
        ),
      (BTBadgeVariant.waiting, true) => (
          colors.ext.warning,
          colors.text.inverse,
        ),
      (BTBadgeVariant.neutral, false) => (
          colors.bg.secondary,
          colors.text.primary,
        ),
      (BTBadgeVariant.neutral, true) => (
          colors.bg.tertiary,
          colors.text.inverse,
        ),
      (BTBadgeVariant.draft, false) => (
          colors.ext.infoSubtler,
          colors.ext.infoBold,
        ),
      (BTBadgeVariant.draft, true) => (
          colors.ext.info,
          colors.text.inverse,
        ),
      (BTBadgeVariant.reject, false) => (
          colors.ext.errorSubtler,
          colors.ext.errorBold,
        ),
      (BTBadgeVariant.reject, true) => (
          colors.ext.error,
          colors.text.inverse,
        ),
      (BTBadgeVariant.custom, false) => (
          colors.brand.secondarySubtle,
          colors.brand.secondaryBold,
        ),
      (BTBadgeVariant.custom, true) => (
          colors.brand.secondary,
          colors.text.inverse,
        ),
    };

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 2, horizontal: 8),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(9999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (leftIcon != null) ...[
            IconTheme(
              data: IconThemeData(size: 16, color: fg),
              child: leftIcon!,
            ),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              color: fg,
              fontSize: 12,
              fontWeight: FontWeight.w500,
              fontFamily: BTechTypography.fontFamily,
              height: 16 / 12,
              letterSpacing: 0,
            ),
          ),
          if (rightIcon != null) ...[
            const SizedBox(width: 4),
            IconTheme(
              data: IconThemeData(size: 16, color: fg),
              child: rightIcon!,
            ),
          ],
        ],
      ),
    );
  }
}
