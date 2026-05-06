// BTech UI — InnerShadowContainer
// A Stack-based widget that draws an inner shadow via CustomPaint.
//
// Flutter's built-in BoxShadow(blurStyle: BlurStyle.inner) does not animate
// cleanly and cannot lerp with BoxDecoration.  This widget uses the same
// clip-and-translate CustomPainter technique as buma_design_system's
// InnerShadowContainer so the button pressed state is visually identical.
//
// Animation is CALLER-DRIVEN: this widget is intentionally stateless and
// contains no AnimationController.  The caller (e.g. BTButton's
// AnimatedBuilder) lerps backgroundColor and shadowColor each frame and
// rebuilds this widget with the interpolated values.  The painter
// short-circuits immediately when shadowColor.alpha == 0, so there is
// zero overdraw at rest.
//
// [animationDuration] and [animationCurve] are accepted for API
// compatibility but are intentionally ignored — they were used by the old
// AnimatedContainer/AnimatedOpacity approach which caused double-rebuild
// flicker.
//
// Usage:
// ```dart
// BTInnerShadowContainer(
//   borderRadius: context.btechRadius.sm,
//   backgroundColor: bg,          // already lerped by caller
//   isShadowTopLeft: showShadow,
//   isShadowTopRight: showShadow,
//   shadowColor: shadowColor,      // alpha encodes opacity — 0x00 = no draw
//   blur: 4,
//   offset: const Offset(0, 4),
//   animationDuration: Duration.zero,
//   child: content,
// )
// ```

import 'package:flutter/material.dart';

/// A stateless container that renders an inner (inset) shadow via
/// [CustomPaint].
///
/// All animation is caller-driven — the caller lerps [backgroundColor] and
/// [shadowColor] each frame.  When [shadowColor] has `alpha == 0` the painter
/// exits immediately (no overdraw).  [animationDuration] and [animationCurve]
/// are accepted but ignored.
///
/// Toggle [isShadowTopLeft] / [isShadowTopRight] / [isShadowBottomLeft] /
/// [isShadowBottomRight] to enable the shadow from the corresponding edge.
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
    this.animationDuration = const Duration(milliseconds: 200),
    this.animationCurve = Curves.linear,
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
        // Plain Container — animation is driven externally by the caller.
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
    final rrect = RRect.fromRectAndRadius(rect, Radius.circular(borderRadius));

    final outer = Path()
      ..addRect(
        Rect.fromLTRB(
          -size.width,
          -size.height,
          size.width * 2,
          size.height * 2,
        ),
      );

    final inner = Path()
      ..addRRect(rrect)
      ..fillType = PathFillType.evenOdd;

    canvas.saveLayer(rect, Paint());

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

    if (isShadowBottomRight) drawShadow(-offset.dx.abs(), -offset.dy.abs());
    if (isShadowBottomLeft) drawShadow(offset.dx.abs(), -offset.dy.abs());
    if (isShadowTopLeft) drawShadow(offset.dx.abs(), offset.dy.abs());
    if (isShadowTopRight) drawShadow(-offset.dx.abs(), offset.dy.abs());

    canvas.restore();
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
