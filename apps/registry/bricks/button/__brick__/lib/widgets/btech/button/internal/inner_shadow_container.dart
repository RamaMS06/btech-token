// BTech UI — BTInnerShadowContainer
// Copied by btech mason brick — do not edit the brick template.
// This file is now owned by your project — customize freely.
//
// A Stack-based widget that draws an inner shadow via CustomPaint.
// Animation is CALLER-DRIVEN: this widget is stateless. The caller
// (BTButton's AnimatedBuilder) lerps backgroundColor and shadowColor
// each frame and rebuilds this widget with the interpolated values.

import 'package:flutter/material.dart';

class BTInnerShadowContainer extends StatelessWidget {
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

  final double? height;
  final double? width;
  final BoxBorder? border;
  final double borderRadius;
  final Color backgroundColor;
  final bool isShadowTopLeft;
  final bool isShadowTopRight;
  final bool isShadowBottomRight;
  final bool isShadowBottomLeft;
  final double blur;
  final Offset offset;
  final Color shadowColor;
  final Widget? child;
  final AlignmentGeometry alignment;
  final Duration animationDuration;
  final Curve animationCurve;

  @override
  Widget build(BuildContext context) {
    final hasShadow = isShadowTopLeft || isShadowTopRight || isShadowBottomRight || isShadowBottomLeft;
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
      ..addRect(Rect.fromLTRB(-size.width, -size.height, size.width * 2, size.height * 2));
    final inner = Path()
      ..addRRect(rrect)
      ..fillType = PathFillType.evenOdd;

    canvas.saveLayer(rect, Paint());

    void drawShadow(double dx, double dy) {
      canvas
        ..save()
        ..translate(dx, dy)
        ..drawPath(Path.combine(PathOperation.difference, outer, inner), paint)
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
