/// BTModal — centred dialog panel with header, optional content, footer.
///
/// Figma source: M-Modal node 2124:2190 (mobile).
///
/// The widget itself is the dialog *panel* — a fixed-width 328 dp card
/// with a white header and grey footer. It does NOT include a backdrop
/// or routing. Use [BTModalSheet.show] to display it as a modal route
/// with a barrier.
///
/// On mobile the footer stacks vertically: primary button is rendered
/// on top (full width), secondary below it (full width).
///
/// ## Usage:
/// ```dart
/// // Embedded panel (no backdrop):
/// BTModal(
///   open: true,
///   title: 'Confirm',
///   subtext: 'Are you sure?',
///   onPrimary: () { /* ... */ },
///   onSecondary: () { /* ... */ },
/// )
///
/// // Show as a modal route:
/// BTModalSheet.show(
///   context,
///   title: 'Confirm action',
///   subtext: 'This cannot be undone.',
///   onPrimary: () => Navigator.pop(context, true),
///   onSecondary: () => Navigator.pop(context, false),
/// );
/// ```
library;

import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/src/components/atoms/button/button.types.dart';
import 'package:btech_ui/src/components/atoms/button/button.widget.dart';
import 'package:btech_ui/src/components/atoms/checkbox/checkbox.widget.dart';
import 'package:flutter/material.dart';

class BTModal extends StatefulWidget {
  const BTModal({
    required this.open,
    required this.title,
    this.subtext,
    this.hasClose = true,
    this.hasFooter = true,
    this.primaryLabel = 'Confirm',
    this.hasSecondaryButton = true,
    this.secondaryLabel = 'Cancel',
    this.hasCheckbox = false,
    this.checkboxLabel = "Don't show again",
    this.dismissable = true,
    this.content,
    this.onPrimary,
    this.onSecondary,
    this.onClose,
    this.onCheckbox,
    super.key,
  });

  /// Whether the modal panel is visible. When false, an empty box renders.
  final bool open;

  /// Bold title shown at the top of the header.
  final String title;

  /// Optional supporting text shown below the title.
  final String? subtext;

  /// Show the X button in the top-right of the header.
  final bool hasClose;

  /// Show the footer section.
  final bool hasFooter;

  /// Label for the primary action button.
  final String primaryLabel;

  /// Show the secondary (cancel) button.
  final bool hasSecondaryButton;

  /// Label for the secondary action button.
  final String secondaryLabel;

  /// Show a checkbox in the footer.
  final bool hasCheckbox;

  /// Label rendered next to the footer checkbox.
  final String checkboxLabel;

  /// Click on backdrop closes the modal — used by [BTModalSheet.show]
  /// to set `barrierDismissible`. Has no effect on the panel itself.
  final bool dismissable;

  /// Optional widget rendered inside the white header section, below
  /// the title row.
  final Widget? content;

  /// Called when the primary action button is pressed.
  final VoidCallback? onPrimary;

  /// Called when the secondary action button is pressed.
  final VoidCallback? onSecondary;

  /// Called when the X close button is pressed.
  final VoidCallback? onClose;

  /// Called when the footer checkbox is toggled.
  final ValueChanged<bool>? onCheckbox;

  @override
  State<BTModal> createState() => _BTModalState();
}

class _BTModalState extends State<BTModal> {
  bool _checked = false;

  @override
  Widget build(BuildContext context) {
    if (!widget.open) return const SizedBox.shrink();

    final colors = context.btechColor;
    final radius = context.btechRadius;

    return Material(
      color: Colors.transparent,
      child: Container(
        width: 328,
        constraints: const BoxConstraints(maxHeight: 600),
        decoration: BoxDecoration(
          color: colors.bg.primary,
          borderRadius: BorderRadius.circular(radius.md),
          boxShadow: const [
            BoxShadow(
              color: Color(0x29000000),
              blurRadius: 32,
              offset: Offset(0, 16),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _buildHeader(context),
            if (widget.content != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                child: widget.content,
              ),
            if (widget.hasFooter) _buildFooter(context),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    final colors = context.btechColor;
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.only(right: 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  widget.title,
                  style: TextStyle(
                    fontFamily: BTechTypography.fontFamily,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    height: 1.4,
                    color: colors.text.primary,
                  ),
                ),
                if (widget.subtext != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    widget.subtext!,
                    style: TextStyle(
                      fontFamily: BTechTypography.fontFamily,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      height: 1.4,
                      color: colors.text.secondary,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (widget.hasClose)
            Positioned(
              top: 0,
              right: 0,
              child: GestureDetector(
                onTap: widget.onClose,
                behavior: HitTestBehavior.opaque,
                child: SizedBox(
                  width: 24,
                  height: 24,
                  child: Icon(
                    Icons.close,
                    size: 16,
                    color: colors.text.secondary,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildFooter(BuildContext context) {
    final colors = context.btechColor;
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: colors.bg.subtle,
        border: Border(
          top: BorderSide(color: colors.border.primary),
        ),
      ),
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        mainAxisSize: MainAxisSize.min,
        children: [
          if (widget.hasCheckbox)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: BTCheckbox(
                checked: _checked,
                label: widget.checkboxLabel,
                onChanged: (v) {
                  setState(() => _checked = v);
                  widget.onCheckbox?.call(v);
                },
              ),
            ),
          // Mobile stacks: primary on top (full width), secondary below.
          SizedBox(
            width: double.infinity,
            child: BTButton(
              label: widget.primaryLabel,
              onPressed: widget.onPrimary,
            ),
          ),
          if (widget.hasSecondaryButton) ...[
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: BTButton(
                label: widget.secondaryLabel,
                variant: BTButtonVariant.secondary,
                onPressed: widget.onSecondary,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
