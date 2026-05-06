// ignore_for_file: lines_longer_than_80_chars

import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/src/components/atoms/tooltip/internal/tooltip.arrow.dart';
import 'package:btech_ui/src/components/molecules/tooltip_step/tooltip_step.types.dart';
import 'package:flutter/material.dart';

/// BTTooltipStep — coachmark / pagination-step balloon.
///
/// Figma: node 2157-1726 (Playground — full coachmark instance).
/// https://www.figma.com/design/WANr9drWYNYbMPuT2sMeHi/?node-id=478-2463
///
/// A standalone tooltip card used for onboarding coach marks. Positioning
/// relative to the target element is the responsibility of the parent —
/// wrap this in a [Positioned] inside a [Stack].
///
/// ```dart
/// // Base button variant
/// BTTooltipStep(
///   label: 'Fitur Baru',
///   description: 'Klik tombol ini untuk memulai.',
///   stepLabel: 'Step 1 of 3',
///   stepVariant: BTTooltipStepVariant.button,
///   hasClose: true,
///   prevLabel: 'Kembali',
///   nextLabel: 'Selanjutnya',
///   position: BTTooltipPosition.bottom,
///   onPrev: _goPrev,
///   onNext: _goNext,
///   onClose: _endTour,
/// )
///
/// // Centered icon-button variant
/// BTTooltipStep(
///   description: 'Geser untuk navigasi.',
///   stepLabel: 'Step 2 of 5',
///   stepVariant: BTTooltipStepVariant.centered,
///   position: BTTooltipPosition.top,
///   onPrev: _goPrev,
///   onNext: _goNext,
/// )
/// ```
class BTTooltipStep extends StatelessWidget {
  const BTTooltipStep({
    required this.description,
    this.label,
    this.stepLabel,
    this.stepVariant = BTTooltipStepVariant.button,
    this.hasClose = false,
    this.prevLabel = 'Prev',
    this.nextLabel = 'Next',
    this.position = BTTooltipPosition.top,
    this.arrowPosition = BTTooltipArrowPosition.mid,
    this.arrowOffset,
    this.child,
    this.onPrev,
    this.onNext,
    this.onClose,
    super.key,
  });

  /// Bold title shown at the top of the card. Hidden when null.
  final String? label;

  /// Main description text. Required.
  final String description;

  /// Step indicator, e.g. "Step 1 of 5". Hidden when null.
  final String? stepLabel;

  /// Navigation button style. @default [BTTooltipStepVariant.button].
  final BTTooltipStepVariant stepVariant;

  /// Show a × close button in the top-right corner.
  final bool hasClose;

  /// Prev button label. @default 'Prev'.
  final String prevLabel;

  /// Next button label. @default 'Next'.
  final String nextLabel;

  /// Which side the arrow caret renders on. @default [BTTooltipPosition.top].
  final BTTooltipPosition position;

  /// Arrow offset along the axis (enum-based, 5 positions).
  final BTTooltipArrowPosition arrowPosition;

  /// Optional pixel-accurate arrow offset from the balloon's near edge to the
  /// trigger centre. When provided, overrides [arrowPosition] for top/bottom
  /// arrows (horizontal axis). Units: logical pixels.
  ///
  /// • top/bottom balloons → px from balloon **left** edge to trigger centre X.
  /// • left/right balloons → not used (falls back to [arrowPosition]).
  final double? arrowOffset;

  /// Optional rich content rendered between description and footer.
  final Widget? child;

  final VoidCallback? onPrev;
  final VoidCallback? onNext;
  final VoidCallback? onClose;

  // ── Colors (component-specific hardcoded — no btech_tokens equivalent) ───
  // bg.secondary and brand.primary are foundation tokens accessed via context;
  // button text.primary is also a foundation token.
  // Per CLAUDE.md §2: use context.btechColor.* for foundation tokens.

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final c = context.btechColor;
    final r = context.btechRadius;
    final bg = c.bg.inverse;

    final isVertical = position == BTTooltipPosition.top ||
        position == BTTooltipPosition.bottom;

    final arrow = BTTooltipArrow(direction: position, color: bg);
    final body = _buildBody(context, c, r, bg);

    if (isVertical) {
      // Use pixel-accurate Stack positioning when arrowOffset is supplied,
      // otherwise fall back to the enum-based Align approach.
      final alignedArrow = arrowOffset != null
          ? _buildHorizontalArrowStack(arrow, arrowOffset!)
          : Align(
              alignment: _horizontalArrowAlignment(arrowPosition),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: arrow,
              ),
            );
      return Material(
        type: MaterialType.transparency,
        child: SizedBox(
          width: 320,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: position == BTTooltipPosition.bottom
                ? [alignedArrow, body]
                : [body, alignedArrow],
          ),
        ),
      );
    } else {
      final alignedArrow = Align(
        alignment: _verticalArrowAlignment(arrowPosition),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: arrow,
        ),
      );
      return Material(
        type: MaterialType.transparency,
        child: IntrinsicHeight(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: position == BTTooltipPosition.left
                ? [body, alignedArrow]
                : [alignedArrow, body],
          ),
        ),
      );
    }
  }

  Widget _buildBody(
    BuildContext context,
    BTechColorTheme c,
    BTechRadiusTheme r,
    Color bg,
  ) {
    final hasHeader = label != null || hasClose;
    final hasFooter = stepLabel != null;

    return Container(
      width: 320,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(r.sm),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Header ──────────────────────────────────────────────────────
          if (hasHeader) ...[
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                if (label != null)
                  Expanded(
                    child: Text(
                      label!,
                      style: TextStyle(
                        fontFamily: BTechTypography.fontFamily,
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        height: 20 / 16,
                        color: c.text.inverse,
                      ),
                    ),
                  )
                else
                  const Spacer(),
                if (hasClose)
                  GestureDetector(
                    onTap: onClose,
                    child: Icon(Icons.close, color: c.text.inverse, size: 24),
                  ),
              ],
            ),
            const SizedBox(height: 8),
          ],

          // ── Description ──────────────────────────────────────────────────
          Text(
            description,
            style: TextStyle(
              fontFamily: BTechTypography.fontFamily,
              fontSize: 14,
              fontWeight: FontWeight.w500,
              height: 16 / 14,
              color: c.text.inverse,
            ),
          ),

          // ── Rich content slot ────────────────────────────────────────────
          if (child != null) ...[
            const SizedBox(height: 8),
            child!,
          ],

          // ── Footer ───────────────────────────────────────────────────────
          if (hasFooter) ...[
            const SizedBox(height: 8),
            _buildFooter(context, c, r),
          ],
        ],
      ),
    );
  }

  Widget _buildFooter(
    BuildContext context,
    BTechColorTheme c,
    BTechRadiusTheme r,
  ) {
    switch (stepVariant) {
      // ── Button variant ─────────────────────────────────────────────────
      case BTTooltipStepVariant.button:
        return Row(
          children: [
            if (stepLabel != null)
              Expanded(
                child: Text(
                  stepLabel!,
                  style: TextStyle(
                    fontFamily: BTechTypography.fontFamily,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    height: 16 / 14,
                    color: c.text.inverse,
                  ),
                ),
              ),
            _StepButton(
              label: prevLabel,
              bgColor: c.bg.secondary,
              textColor: c.text.primary,
              borderRadius: r.sm,
              fontFamily: BTechTypography.fontFamily,
              onTap: onPrev,
            ),
            const SizedBox(width: 8),
            _StepButton(
              label: nextLabel,
              bgColor: c.bg.secondary,
              textColor: c.text.primary,
              borderRadius: r.sm,
              fontFamily: BTechTypography.fontFamily,
              onTap: onNext,
            ),
          ],
        );

      // ── Link variant ───────────────────────────────────────────────────
      case BTTooltipStepVariant.link:
        return Row(
          children: [
            if (stepLabel != null)
              Expanded(
                child: Text(
                  stepLabel!,
                  style: TextStyle(
                    fontFamily: BTechTypography.fontFamily,
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    height: 16 / 14,
                    color: c.text.inverse,
                  ),
                ),
              ),
            GestureDetector(
              onTap: onPrev,
              child: Text(
                prevLabel,
                style: TextStyle(
                  fontFamily: BTechTypography.fontFamily,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  height: 16 / 14,
                  color: c.text.secondary,
                ),
              ),
            ),
            const SizedBox(width: 12),
            GestureDetector(
              onTap: onNext,
              child: Text(
                nextLabel,
                style: TextStyle(
                  fontFamily: BTechTypography.fontFamily,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  height: 16 / 14,
                  color: c.brand.primary,
                ),
              ),
            ),
          ],
        );

      // ── Centered icon-button variant ───────────────────────────────────
      case BTTooltipStepVariant.centered:
        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _IconStepButton(
              icon: Icons.chevron_left,
              bgColor: c.brand.primary,
              borderRadius: r.sm,
              onTap: onPrev,
              semanticsLabel: 'Sebelumnya',
            ),
            if (stepLabel != null) ...[
              const SizedBox(width: 12),
              Text(
                stepLabel!,
                style: TextStyle(
                  fontFamily: BTechTypography.fontFamily,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  height: 16 / 14,
                  color: c.text.inverse,
                ),
              ),
              const SizedBox(width: 12),
            ],
            _IconStepButton(
              icon: Icons.chevron_right,
              bgColor: c.brand.primary,
              borderRadius: r.sm,
              onTap: onNext,
              semanticsLabel: 'Selanjutnya',
            ),
          ],
        );
    }
  }

  /// Position the arrow SVG (16 × 8 px) using a Stack so its centre lands
  /// at exactly [offset] logical pixels from the balloon's left edge.
  Widget _buildHorizontalArrowStack(Widget arrow, double offset) {
    // Arrow SVG is 16 px wide — subtract 8 to get the left edge position.
    // Clamp so the arrow never escapes the 320 px balloon.
    final left = (offset - 8.0).clamp(0.0, 304.0); // 320 - 16 = 304
    return SizedBox(
      width: 320,
      height: 8,
      child: Stack(
        clipBehavior: Clip.none,
        children: [Positioned(left: left, top: 0, child: arrow)],
      ),
    );
  }

  Alignment _horizontalArrowAlignment(BTTooltipArrowPosition ap) {
    return switch (ap) {
      BTTooltipArrowPosition.left => Alignment.centerLeft,
      BTTooltipArrowPosition.leftMid => const Alignment(-0.5, 0),
      BTTooltipArrowPosition.mid => Alignment.center,
      BTTooltipArrowPosition.rightMid => const Alignment(0.5, 0),
      BTTooltipArrowPosition.right => Alignment.centerRight,
    };
  }

  Alignment _verticalArrowAlignment(BTTooltipArrowPosition ap) {
    return switch (ap) {
      BTTooltipArrowPosition.left => Alignment.topCenter,
      BTTooltipArrowPosition.leftMid => const Alignment(0, -0.5),
      BTTooltipArrowPosition.mid => Alignment.center,
      BTTooltipArrowPosition.rightMid => const Alignment(0, 0.5),
      BTTooltipArrowPosition.right => Alignment.bottomCenter,
    };
  }
}

// ── Private helpers ────────────────────────────────────────────────────────

class _StepButton extends StatelessWidget {
  const _StepButton({
    required this.label,
    required this.bgColor,
    required this.textColor,
    required this.borderRadius,
    required this.fontFamily,
    this.onTap,
  });

  final String label;
  final Color bgColor;
  final Color textColor;
  final double borderRadius;
  final String fontFamily;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontFamily: fontFamily,
            fontSize: 14,
            fontWeight: FontWeight.w500,
            height: 20 / 14,
            color: textColor,
          ),
        ),
      ),
    );
  }
}

class _IconStepButton extends StatelessWidget {
  const _IconStepButton({
    required this.icon,
    required this.bgColor,
    required this.borderRadius,
    required this.semanticsLabel,
    this.onTap,
  });

  final IconData icon;
  final Color bgColor;
  final double borderRadius;
  final String semanticsLabel;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: semanticsLabel,
      button: true,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(borderRadius),
          ),
          child: Icon(icon, color: Colors.white, size: 16),
        ),
      ),
    );
  }
}
