import 'package:flutter/material.dart';

/// Draws the checkmark icon inside the checked box.
class CheckmarkPainter extends CustomPainter {
  const CheckmarkPainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round
      ..style = PaintingStyle.stroke;

    // Matches the SVG path: M1 4L3.5 6.5L9 1 on a 10×8 viewBox
    final path = Path()
      ..moveTo(size.width * 0.10, size.height * 0.50)
      ..lineTo(size.width * 0.35, size.height * 0.8125)
      ..lineTo(size.width * 0.90, size.height * 0.125);

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(CheckmarkPainter oldDelegate) =>
      oldDelegate.color != color;
}
