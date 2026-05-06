/// BTModalSheet — static helper that wraps [BTModal] in [showDialog].
///
/// Internal-only file (re-exported via `modal.dart`). Designers / app
/// consumers should call [BTModalSheet.show] rather than building the
/// dialog route by hand.
library;

import 'package:btech_ui/src/components/organisms/modal/modal.widget.dart';
import 'package:flutter/material.dart';

/// Static helper for displaying a [BTModal] over a barrier.
///
/// ## Usage:
/// ```dart
/// final result = await BTModalSheet.show<bool>(
///   context,
///   title: 'Delete account',
///   subtext: 'This action cannot be undone.',
///   primaryLabel: 'Delete',
///   onPrimary: () => Navigator.pop(context, true),
///   onSecondary: () => Navigator.pop(context, false),
/// );
/// ```
abstract final class BTModalSheet {
  /// Show a [BTModal] as a modal route.
  ///
  /// Returns whatever the caller passes to `Navigator.pop(context, ...)`
  /// from inside [onPrimary] / [onSecondary] / [onClose].
  static Future<T?> show<T>(
    BuildContext context, {
    required String title,
    String? subtext,
    bool hasClose = true,
    bool hasFooter = true,
    String primaryLabel = 'Confirm',
    bool hasSecondaryButton = true,
    String secondaryLabel = 'Cancel',
    bool hasCheckbox = false,
    String checkboxLabel = "Don't show again",
    bool dismissable = true,
    Widget? content,
    VoidCallback? onPrimary,
    VoidCallback? onSecondary,
    VoidCallback? onClose,
    ValueChanged<bool>? onCheckbox,
  }) {
    return showDialog<T>(
      context: context,
      barrierDismissible: dismissable,
      barrierColor: Colors.black54,
      builder: (ctx) => Center(
        child: BTModal(
          open: true,
          title: title,
          subtext: subtext,
          hasClose: hasClose,
          hasFooter: hasFooter,
          primaryLabel: primaryLabel,
          hasSecondaryButton: hasSecondaryButton,
          secondaryLabel: secondaryLabel,
          hasCheckbox: hasCheckbox,
          checkboxLabel: checkboxLabel,
          dismissable: dismissable,
          content: content,
          onPrimary: onPrimary ?? () => Navigator.of(ctx).pop(),
          onSecondary: onSecondary ?? () => Navigator.of(ctx).pop(),
          onClose: onClose ?? () => Navigator.of(ctx).pop(),
          onCheckbox: onCheckbox,
        ),
      ),
    );
  }
}
