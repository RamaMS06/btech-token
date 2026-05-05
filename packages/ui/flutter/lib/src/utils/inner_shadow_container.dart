// BTech UI — InnerShadowContainer
// A Stack-based widget that draws an animated inner shadow via CustomPaint.
//
// Flutter's built-in BoxShadow(blurStyle: BlurStyle.inner) does not animate
// cleanly and cannot lerp with BoxDecoration.  This widget uses the same
// clip-and-translate CustomPainter technique as buma_design_system's
// InnerShadowContainer so the button pressed state is visually identical.
//
// Usage:
// ```dart
// BTInnerShadowContainer(
//   borderRadius: context.btechRadius.sm,
//   backgroundColor: colors.brand.primary,
//   isShadowTopLeft: _pressed,
//   isShadowTopRight: _pressed,
//   shadowColor: const Color(0x40000000),
//   blur: 4,
//   offset: const Offset(0, 4),
//   child: content,
// )
// ```

import 'package:flutter/material.dart';

/// A container that supports animated inner (inset) shadows via [CustomPaint].
///
/// Toggle [isShadowTopLeft] / [isShadowTopRight] / [isShadowBottomLeft] /
/// [isShadowBottomRight] to show the shadow from the corresponding edge.
/// The visibility transition is driven by [animationDuration] +
/// [animationCurve] via [AnimatedOpacity].
class BTInnerShadowContainer extends StatelessWidget {
  /// Creates a [BTInnerShadowContainer].
  const BTInnerShadowContainer({
    super.key,
    this.height,
    this.width,
    this.border,
    this.borderRadius = 8.0,
    this.backgroundColor = Colors.white,
    this.isShadowTopLeft = false,
    this.isShadowTopRight = false,
    this.isShadowBottomRight = false,
    this.isShadowBottomLeft = false,
    this.blur = 4.0,
    this.offset = const Offset(0, 4),
    this.shadowColor = Colors.black26,
    this.child,
    this.alignment = Alignment.center,
    this.animationDuration = const Duration(milliseconds: 120),
    this.animationCurve = Curves.easeOutCubic,
  });

  /// The height of the container.
  final double? height;

  /// The width of the container.
  final double? width;

  /// Optional border drawn beneath the shadow layer.
  final BoxBorder? border;

  /// Corner radius in logical pixels.
  final double borderRadius;

  /// Background fill colour.
  final Color backgroundColor;

  /// Show inner shadow from the top-left corner.
  final bool isShadowTopLeft;

  /// Show inner shadow from the top-right corner.
  final bool isShadowTopRight;

  /// Show inner shadow from the bottom-right corner.
  final bool isShadowBottomRight;

  /// Show inner shadow from the bottom-left corner.
  final bool isShadowBottomLeft;

  /// Gaussian blur radius (matches CSS blur value 1:1).
  final double blur;

  /// Offset of the shadow relative to the container edge.
  final Offset offset;

  /// Colour of the shadow.
  final Color shadowColor;

  /// Widget rendered inside the container.
  final Widget? child;

  /// How the child is aligned inside the container.
  final AlignmentGeometry alignment;

  /// Duration for background colour + shadow visibility transitions.
  final Duration animationDuration;

  /// Animation curve for the transitions.
  final Curve animationCurve;

  @override
  Widget build(BuildContext context) {
    final hasShadow = isShadowTopLeft ||
        isShadowTopRight ||
        isShadowBottomRight ||
        isShadowBottomLeft;

    return Stack(
      children: [
        AnimatedContainer(
          duration: animationDuration,
          curve: animationCurve,
          height: height,
          width: width,
          alignment: alignment,
          decoration: BoxDecoration(
            color: backgroundColor,
            borderRadius: BorderRadius.circular(borderRadius),
            border: border,
          ),
          child: child,
        ),
        Positioned.fill(
          child: AnimatedOpacity(
            duration: animationDuration,
            curve: animationCurve,
            opacity: hasShadow ? 1.0 : 0.0,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(borderRadius),
              child: CustomPaint(
                painter: _BTInnerShadowPainter(
                  shadowColor: shadowColor,
                  blur: blur,
                  offset: offset,
                  borderRadius: borderRadius,
                  isShadowTopLeft: isShadowTopLeft,
                  isShadowTopRight: isShadowTopRight,
                  isShadowBottomRight: isShadowBottomRight,
                  isShadowBottomLeft: isShadowBottomLeft,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

// ── Painter ───────────────────────────────────────────────────────────────

class _BTInnerShadowPainter extends CustomPainter {
  const _BTInnerShadowPainter({
    required this.shadowColor,
    required this.blur,
    required this.offset,
    required this.borderRadius,
    this.isShadowTopLeft = false,
    this.isShadowTopRight = false,
    this.isShadowBottomRight = false,
    this.isShadowBottomLeft = false,
  });

  final Color shadowColor;
  final double blur;
  final Offset offset;
  final double borderRadius;
  final bool isShadowTopLeft;
  final bool isShadowTopRight;
  final bool isShadowBottomRight;
  final bool isShadowBottomLeft;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = shadowColor
      ..maskFilter = MaskFilter.blur(BlurStyle.normal, blur);

    final rect = Offset.zero & size;
    final rrect = RRect.fromRectAndRadius(
      rect,
      Radius.circular(borderRadius),
    );

    // Outer path: large rect that always surrounds the widget.
    final outer = Path()
      ..addRect(
        Rect.fromLTRB(
          -size.width,
          -size.height,
          size.width * 2,
          size.height * 2,
        ),
      );

    // Inner path: the widget's rounded shape (the "hole" in the wall).
    final inner = Path()
      ..addRRect(rrect)
      ..fillType = PathFillType.evenOdd;

    canvas.saveLayer(rect, Paint());

    // Translates the "wall" so its edge bleeds inward from the desired corner.
    void drawShadow(double dx, double dy) {
      canvas
        ..save()
        ..translate(dx, dy)
        ..drawPath(
          Path.combine(PathOperation.difference, outer, inner),
          paint,
        )
        ..restore();
    }

    if (isShadowBottomRight) {
      drawShadow(-offset.dx.abs(), -offset.dy.abs());
    }
    if (isShadowBottomLeft) {
      drawShadow(offset.dx.abs(), -offset.dy.abs());
    }
    if (isShadowTopLeft) {
      drawShadow(offset.dx.abs(), offset.dy.abs());
    }
    if (isShadowTopRight) {
      drawShadow(-offset.dx.abs(), offset.dy.abs());
    }

    canvas.restore();
  }

  @override
  bool shouldRepaint(_BTInnerShadowPainter old) =>
      old.shadowColor != shadowColor ||
      old.blur != blur ||
      old.offset != offset ||
      old.borderRadius != borderRadius ||
      old.isShadowTopLeft != isShadowTopLeft ||
      old.isShadowTopRight != isShadowTopRight ||
      old.isShadowBottomRight != isShadowBottomRight ||
      old.isShadowBottomLeft != isShadowBottomLeft;
}
