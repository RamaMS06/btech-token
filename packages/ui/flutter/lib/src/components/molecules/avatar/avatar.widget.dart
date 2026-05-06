/// BTAvatar v2 — circular badge with image, initials, empty, or error state.
///
/// Sliced from Figma `Avatar` (node 497:979). Data-class API mirrors
/// the React/Vue equivalents one-to-one — same prop names, same
/// variant precedence — so designers and devs move between platforms
/// without re-learning component contracts.
///
/// ## Variant precedence (highest first):
///   1. `isLoading == true`              → [BTLoadingSkeleton] shimmer circle
///   2. `status == BTAvatarStatus.error`
///      OR `item.imageUrl` fails to load → `hide_image` icon on [bg/subtler]
///   3. `item == null`                   → `person` icon on [bg/subtler] (empty)
///   4. `item.imageUrl != null`          → Image.network (errorBuilder → error)
///   5. (default)                        → initials on colored background
///
/// ## Usage:
/// ```dart
/// // Initials (default)
/// BTAvatar(item: BTAvatarItem(name: 'Faisal Lestari'), size: BTAvatarSize.md);
///
/// // Image — auto-fallback to error icon on load failure
/// BTAvatar(item: BTAvatarItem(name: 'JD', imageUrl: 'https://...'));
///
/// // Explicit error state (backend signals broken asset)
/// BTAvatar(item: BTAvatarItem(name: 'AB'), status: BTAvatarStatus.error);
///
/// // Empty — no user associated
/// BTAvatar(size: BTAvatarSize.md);
///
/// // Loading skeleton
/// BTAvatar(isLoading: true);
/// ```
library;

import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/src/components/atoms/loading_skeleton/loading_skeleton.widget.dart';
import 'package:btech_ui/src/components/molecules/avatar/avatar.types.dart';
import 'package:btech_ui/src/components/molecules/avatar/internal/avatar.constants.dart';
import 'package:flutter/material.dart';

/// BTAvatar widget — see file header for variant precedence.
class BTAvatar extends StatelessWidget {
  const BTAvatar({
    this.item,
    this.size = BTAvatarSize.md,
    this.isLoading = false,
    this.status = BTAvatarStatus.none,
    super.key,
  });

  /// Avatar payload. When `null`, renders the empty (person icon) variant.
  final BTAvatarItem? item;

  /// Size ramp — see [BTAvatarSize].
  final BTAvatarSize size;

  /// When `true`, renders a [BTLoadingSkeleton] shimmer placeholder.
  final bool isLoading;

  /// Explicit override to the error variant. Useful when the caller already
  /// knows the asset is unavailable.
  final BTAvatarStatus status;

  @override
  Widget build(BuildContext context) {
    final pxSize = avatarPx[size]!;
    final neutralBg = context.btechColor.bg.subtler;
    final neutralFg = context.btechColor.text.secondary;
    final inverseFg = context.btechColor.text.inverse;

    // 1 — Loading: BTLoadingSkeleton wraps a circle placeholder so Skeletonizer
    //     picks up the shape and animates the shimmer using btech token colors.
    if (isLoading) {
      return BTLoadingSkeleton(
        child: Icon(
          Icons.person,
          size: pxSize,
          color: neutralFg,
        ),
      );
    }

    // 2 — Explicit error override
    if (status == BTAvatarStatus.error) {
      return _iconCircle(
        pxSize: pxSize,
        bg: neutralBg,
        icon: Icons.hide_image_outlined,
        iconColor: neutralFg,
      );
    }

    // 3 — Empty (no item)
    if (item == null) {
      return _iconCircle(
        pxSize: pxSize,
        bg: neutralBg,
        icon: Icons.person,
        iconColor: neutralFg,
      );
    }

    // 4 — Image variant (errorBuilder → error icon)
    if (item!.imageUrl != null && item!.imageUrl!.isNotEmpty) {
      return _circle(
        pxSize,
        avatarPalette[item!.color]!,
        ClipOval(
          child: Image.network(
            item!.imageUrl!,
            width: pxSize,
            height: pxSize,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _iconCircle(
              pxSize: pxSize,
              bg: neutralBg,
              icon: Icons.hide_image_outlined,
              iconColor: neutralFg,
            ),
          ),
        ),
      );
    }

    // 5 — Initials (default)
    return _circle(
      pxSize,
      avatarPalette[item!.color]!,
      Text(
        deriveInitials(item!.name),
        style: TextStyle(
          color: inverseFg,
          fontSize: fontSizeFor(size),
          fontWeight: FontWeight.w500,
          fontFamily: BTechTypography.fontFamily,
          height: 1,
        ),
      ),
    );
  }

  /// Circle container — colored background + centered child.
  Widget _circle(double pxSize, Color bg, Widget child) => Container(
        width: pxSize,
        height: pxSize,
        alignment: Alignment.center,
        decoration: BoxDecoration(color: bg, shape: BoxShape.circle),
        child: child,
      );

  /// Icon variant — uses ClipOval so the icon is guaranteed to paint inside
  /// the circular clipping boundary (avoids glyph paint-order artefacts).
  Widget _iconCircle({
    required double pxSize,
    required Color bg,
    required IconData icon,
    required Color iconColor,
  }) =>
      ClipOval(
        child: Container(
          width: pxSize,
          height: pxSize,
          color: bg,
          alignment: Alignment.center,
          child: Icon(
            icon,
            size: iconSizeFor(size),
            color: iconColor,
          ),
        ),
      );
}
