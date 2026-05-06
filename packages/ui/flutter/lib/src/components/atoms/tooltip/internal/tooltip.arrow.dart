// ignore_for_file: lines_longer_than_80_chars

import 'package:btech_ui/src/components/atoms/tooltip/tooltip.types.dart';
import 'package:flutter/material.dart';

/// Paints a slightly-rounded triangular arrow caret in the given [direction].
///
/// The arrow "points toward" the trigger element:
///   - [BTTooltipPosition.top]    → arrow at bottom of balloon, pointing down.
///   - [BTTooltipPosition.bottom] → arrow at top of balloon, pointing up.
///   - [BTTooltipPosition.left]   → arrow at right of balloon, pointing right.
///   - [BTTooltipPosition.right]  → arrow at left of balloon, pointing left.
class BTTooltipArrowPainter extends CustomPainter {
  const BTTooltipArrowPainter({
    required this.color,
    required this.direction,
  });

  final Color color;
  final BTTooltipPosition direction;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;

    final w = size.width;
    final h = size.height;
    final path = Path();

    // Slightly rounded tip via quadratic bezier (matching web SVG path logic).
    switch (direction) {
      case BTTooltipPosition.bottom:
        // Arrow at TOP of balloon, pointing UP toward trigger below.
        // Canvas: 16w × 8h
        path
          ..moveTo(0, h)
          ..lineTo(w * 0.4375, h * 0.125) // ≈ (7, 1) on 16×8
          ..quadraticBezierTo(w * 0.5, 0, w * 0.5625, h * 0.125)
          ..lineTo(w, h);
      case BTTooltipPosition.top:
        // Arrow at BOTTOM of balloon, pointing DOWN toward trigger above.
        // Canvas: 16w × 8h
        path
          ..moveTo(0, 0)
          ..lineTo(w * 0.4375, h * 0.875)
          ..quadraticBezierTo(w * 0.5, h, w * 0.5625, h * 0.875)
          ..lineTo(w, 0);
      case BTTooltipPosition.left:
        // Arrow at RIGHT of balloon, pointing RIGHT toward trigger on left.
        // Canvas: 8w × 16h
        path
          ..moveTo(0, 0)
          ..lineTo(w * 0.875, h * 0.4375)
          ..quadraticBezierTo(w, h * 0.5, w * 0.875, h * 0.5625)
          ..lineTo(0, h);
      case BTTooltipPosition.right:
        // Arrow at LEFT of balloon, pointing LEFT toward trigger on right.
        // Canvas: 8w × 16h
        path
          ..moveTo(w, 0)
          ..lineTo(w * 0.125, h * 0.4375)
          ..quadraticBezierTo(0, h * 0.5, w * 0.125, h * 0.5625)
          ..lineTo(w, h);
    }

    path.close();
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(BTTooltipArrowPainter oldDelegate) =>
      oldDelegate.color != color || oldDelegate.direction != direction;
}

/// Renders the arrow caret widget with the correct dimensions for [direction].
class BTTooltipArrow extends StatelessWidget {
  const BTTooltipArrow({
    required this.direction,
    required this.color,
    super.key,
  });

  final BTTooltipPosition direction;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final isVertical = direction == BTTooltipPosition.top ||
        direction == BTTooltipPosition.bottom;
    return CustomPaint(
      size: isVertical ? const Size(16, 8) : const Size(8, 16),
      painter: BTTooltipArrowPainter(color: color, direction: direction),
    );
  }
}
