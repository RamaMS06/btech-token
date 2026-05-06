// Internal spotlight painter for [BTCoachmarkController].
//
// Paints a semi-transparent dark layer over the full canvas with a
// rounded-rect cutout at [spotlight] (border-radius 5 px) — the
// equivalent of the web `box-shadow: 0 0 0 9999px rgba(0,0,0,0.55)`
// trick used by [BTCoachmarkTour] in Vue / React.

import 'package:flutter/rendering.dart';

class BTSpotlightPainter extends CustomPainter {
  const BTSpotlightPainter({required this.spotlight, required this.color});

  final Rect spotlight;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final path = Path()
      ..fillType = PathFillType.evenOdd
      ..addRect(Rect.fromLTWH(0, 0, size.width, size.height))
      ..addRRect(RRect.fromRectAndRadius(spotlight, const Radius.circular(5)));
    canvas.drawPath(path, Paint()..color = color);
  }

  @override
  bool shouldRepaint(covariant BTSpotlightPainter oldDelegate) =>
      oldDelegate.spotlight != spotlight || oldDelegate.color != color;
}
