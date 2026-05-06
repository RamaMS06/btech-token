// ignore_for_file: lines_longer_than_80_chars

import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/src/components/molecules/alert/alert.types.dart';
import 'package:btech_ui/src/components/molecules/alert/internal/alert.icons.dart';
import 'package:flutter/material.dart';

/// BTAlert — contextual feedback banner.
///
/// Figma: node 681:11285
/// https://www.figma.com/design/WANr9drWYNYbMPuT2sMeHi/?node-id=681-11285
///
/// Without description: `[icon] [label] [action-link?] [dismiss?]`
/// With description:    `[icon] [label + description] [action-btn?] [dismiss?]`
///
/// ```dart
/// // Simple
/// BTAlert(variant: BTAlertVariant.success, label: 'Saved!')
///
/// // With description + action + dismiss
/// BTAlert(
///   variant: BTAlertVariant.error,
///   label: 'Something went wrong',
///   description: 'Please try again later.',
///   actionLabel: 'Retry',
///   dismissible: true,
///   onAction: _retry,
///   onDismiss: _hideAlert,
/// )
/// ```
class BTAlert extends StatelessWidget {
  const BTAlert({
    required this.label,
    this.variant = BTAlertVariant.info,
    this.description,
    this.actionLabel,
    this.dismissible = false,
    this.onAction,
    this.onDismiss,
    super.key,
  });

  /// Visual style. Defaults to [BTAlertVariant.info].
  final BTAlertVariant variant;

  /// Primary alert message. Bold when [description] is non-null.
  final String label;

  /// Optional supporting text shown below [label].
  final String? description;

  /// Label for the optional action. Renders as a text link when no
  /// [description] is present, or a bordered button when [description] exists.
  final String? actionLabel;

  /// Whether to show a dismiss (×) button on the trailing edge.
  final bool dismissible;

  /// Called when [actionLabel] button / link is tapped.
  final VoidCallback? onAction;

  /// Called when the dismiss button is tapped.
  final VoidCallback? onDismiss;

  // ── Token helpers ───────────────────────────────────────────────────────────

  Color _bgColor(BTechColorTheme c) => switch (variant) {
        BTAlertVariant.info => c.ext.infoSubtler,
        BTAlertVariant.success => c.ext.successSubtler,
        BTAlertVariant.error => c.ext.errorSubtler,
        BTAlertVariant.warning => c.ext.warningSubtler,
        BTAlertVariant.neutral => c.bg.secondary,
        BTAlertVariant.neutralDark => c.bg.inverse,
      };

  Color? _borderColor(BTechColorTheme c) => switch (variant) {
        BTAlertVariant.info => c.ext.infoBold,
        BTAlertVariant.success => c.ext.successBold,
        BTAlertVariant.error => c.ext.errorBold,
        BTAlertVariant.warning => c.ext.warningBold,
        BTAlertVariant.neutral => c.border.primary,
        BTAlertVariant.neutralDark => null, // no border
      };

  Color _iconColor(BTechColorTheme c) => switch (variant) {
        BTAlertVariant.info => c.text.info,
        BTAlertVariant.success => c.text.success,
        BTAlertVariant.error => c.text.error,
        BTAlertVariant.warning => c.text.warning,
        BTAlertVariant.neutral => c.text.primary,
        BTAlertVariant.neutralDark => c.text.inverse,
      };

  Color _labelColor(BTechColorTheme c) => _iconColor(c);

  Color _descriptionColor(BTechColorTheme c) =>
      variant == BTAlertVariant.neutralDark ? c.text.inverse : c.text.primary;

  Color _actionLinkColor(BTechColorTheme c) => _iconColor(c);

  String get _iconVariantKey => switch (variant) {
        BTAlertVariant.success => 'success',
        BTAlertVariant.error => 'error',
        BTAlertVariant.warning => 'warning',
        _ => 'info',
      };

  @override
  Widget build(BuildContext context) {
    final c = context.btechColor;
    final r = context.btechRadius;
    final hasDescription = description != null;
    final borderColor = _borderColor(c);

    return Container(
      decoration: BoxDecoration(
        color: _bgColor(c),
        borderRadius: BorderRadius.circular(r.sm),
        border: borderColor != null
            ? Border.all(color: borderColor)
            : null,
      ),
      padding: EdgeInsets.symmetric(
        horizontal: hasDescription ? 8 : 12,
        vertical: 8,
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Icon ──────────────────────────────────────────────────────────
          BTAlertIcon(variant: _iconVariantKey, color: _iconColor(c)),
          const SizedBox(width: 8),

          // ── Body ──────────────────────────────────────────────────────────
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontFamily: BTechTypography.fontFamily,
                    fontSize: 14,
                    height: 16 / 14,
                    fontWeight:
                        hasDescription ? FontWeight.w700 : FontWeight.w500,
                    color: _labelColor(c),
                  ),
                ),
                if (hasDescription) ...[
                  const SizedBox(height: 4),
                  Text(
                    description!,
                    style: TextStyle(
                      fontFamily: BTechTypography.fontFamily,
                      fontSize: 12,
                      height: 16 / 12,
                      fontWeight: FontWeight.w500,
                      color: _descriptionColor(c),
                    ),
                  ),
                ],
              ],
            ),
          ),

          // ── Action ────────────────────────────────────────────────────────
          if (actionLabel != null) ...[
            const SizedBox(width: 8),
            if (!hasDescription)
              // Text link (no description)
              GestureDetector(
                onTap: onAction,
                child: Text(
                  actionLabel!,
                  style: TextStyle(
                    fontFamily: BTechTypography.fontFamily,
                    fontSize: 14,
                    height: 16 / 14,
                    fontWeight: FontWeight.w500,
                    color: _actionLinkColor(c),
                  ),
                ),
              )
            else
              // Bordered button (with description)
              GestureDetector(
                onTap: onAction,
                child: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: variant == BTAlertVariant.neutralDark
                        ? c.bg.secondary
                        : Colors.transparent,
                    border: variant == BTAlertVariant.neutralDark
                        ? null
                        : Border.all(color: c.border.primary),
                    borderRadius: BorderRadius.circular(r.sm),
                  ),
                  child: Text(
                    actionLabel!,
                    style: TextStyle(
                      fontFamily: BTechTypography.fontFamily,
                      fontSize: 12,
                      height: 16 / 12,
                      fontWeight: FontWeight.w500,
                      color: c.text.primary,
                    ),
                  ),
                ),
              ),
          ],

          // ── Dismiss ───────────────────────────────────────────────────────
          if (dismissible) ...[
            const SizedBox(width: 8),
            GestureDetector(
              onTap: onDismiss,
              child: Icon(
                Icons.close,
                size: 16,
                color: _iconColor(c),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
