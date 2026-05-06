// ignore_for_file: lines_longer_than_80_chars

import 'package:btech_ui/src/components/atoms/tooltip/tooltip.types.dart';
import 'package:flutter/widgets.dart';

/// Computed screen coordinates for one tooltip layout (balloon + arrow).
class BTTooltipLayout {
  const BTTooltipLayout({
    required this.bubbleLeft,
    required this.bubbleTop,
    required this.arrowLeft,
    required this.arrowTop,
    required this.position,
  });

  final double bubbleLeft;
  final double bubbleTop;
  final double arrowLeft;
  final double arrowTop;
  final BTTooltipPosition position;
}

/// Pure positioning math borrowed from el_tooltip's PositionManager.
///
/// Computes the balloon + arrow screen coordinates for the preferred
/// [position]. If the result overflows the screen, falls back to the
/// other 3 positions in order [bottom, top, right, left] (skipping the
/// already-tried preferred one) and returns the first one that fits.
///
/// If nothing fits, returns the preferred-position layout as best-effort.
class BTTooltipPositionManager {
  const BTTooltipPositionManager({
    required this.triggerOffset,
    required this.triggerSize,
    required this.balloonSize,
    required this.screen,
    required this.arrowPosition,
  });

  final Offset triggerOffset;
  final Size triggerSize;
  final Size balloonSize;
  final Size screen;
  final BTTooltipArrowPosition arrowPosition;

  static const double _gap = 6;
  static const double _margin = 8;

  /// Arrow horizontal canvas: 16w × 8h.
  /// Arrow vertical   canvas:  8w × 16h.
  static const double _arrowShort = 8;
  static const double _arrowLong = 16;

  BTTooltipLayout resolve(BTTooltipPosition preferred) {
    final preferredLayout = _compute(preferred);
    if (_fits(preferredLayout)) return preferredLayout;

    const fallbackOrder = [
      BTTooltipPosition.bottom,
      BTTooltipPosition.top,
      BTTooltipPosition.right,
      BTTooltipPosition.left,
    ];
    for (final p in fallbackOrder) {
      if (p == preferred) continue;
      final l = _compute(p);
      if (_fits(l)) return l;
    }
    return preferredLayout;
  }

  bool _fits(BTTooltipLayout l) {
    final bw = balloonSize.width;
    final bh = balloonSize.height;
    return l.bubbleLeft >= _margin &&
        l.bubbleTop >= _margin &&
        l.bubbleLeft + bw <= screen.width - _margin &&
        l.bubbleTop + bh <= screen.height - _margin;
  }

  BTTooltipLayout _compute(BTTooltipPosition p) {
    final tLeft = triggerOffset.dx;
    final tTop = triggerOffset.dy;
    final tRight = tLeft + triggerSize.width;
    final tBottom = tTop + triggerSize.height;
    final tcx = tLeft + triggerSize.width / 2;
    final tcy = tTop + triggerSize.height / 2;

    final bw = balloonSize.width;
    final bh = balloonSize.height;
    final hFrac = _hFrac(arrowPosition);
    final vFrac = _vFrac(arrowPosition);

    switch (p) {
      case BTTooltipPosition.bottom:
        final arrowY = tBottom + _gap;
        final bubbleY = arrowY + _arrowShort;
        final bubbleX = (tcx - bw * hFrac)
            .clamp(_margin, screen.width - bw - _margin);
        final arrowX = (tcx - _arrowLong / 2)
            .clamp(bubbleX + 4, bubbleX + bw - _arrowLong - 4);
        return BTTooltipLayout(
          bubbleLeft: bubbleX,
          bubbleTop: bubbleY,
          arrowLeft: arrowX,
          arrowTop: arrowY,
          position: p,
        );
      case BTTooltipPosition.top:
        final arrowY = tTop - _gap - _arrowShort;
        final bubbleY = arrowY - bh;
        final bubbleX = (tcx - bw * hFrac)
            .clamp(_margin, screen.width - bw - _margin);
        final arrowX = (tcx - _arrowLong / 2)
            .clamp(bubbleX + 4, bubbleX + bw - _arrowLong - 4);
        return BTTooltipLayout(
          bubbleLeft: bubbleX,
          bubbleTop: bubbleY,
          arrowLeft: arrowX,
          arrowTop: arrowY,
          position: p,
        );
      case BTTooltipPosition.right:
        final arrowX = tRight + _gap;
        final bubbleX = arrowX + _arrowShort;
        final bubbleY = (tcy - bh * vFrac)
            .clamp(_margin, screen.height - bh - _margin);
        final arrowY = (tcy - _arrowLong / 2)
            .clamp(bubbleY + 4, bubbleY + bh - _arrowLong - 4);
        return BTTooltipLayout(
          bubbleLeft: bubbleX,
          bubbleTop: bubbleY,
          arrowLeft: arrowX,
          arrowTop: arrowY,
          position: p,
        );
      case BTTooltipPosition.left:
        final arrowX = tLeft - _gap - _arrowShort;
        final bubbleX = arrowX - bw;
        final bubbleY = (tcy - bh * vFrac)
            .clamp(_margin, screen.height - bh - _margin);
        final arrowY = (tcy - _arrowLong / 2)
            .clamp(bubbleY + 4, bubbleY + bh - _arrowLong - 4);
        return BTTooltipLayout(
          bubbleLeft: bubbleX,
          bubbleTop: bubbleY,
          arrowLeft: arrowX,
          arrowTop: arrowY,
          position: p,
        );
    }
  }

  /// Horizontal fraction (used for top/bottom): where the arrow CENTER
  /// should sit within the 280 px balloon, expressed as a fraction.
  static double _hFrac(BTTooltipArrowPosition ap) => switch (ap) {
        BTTooltipArrowPosition.left => 24 / 280,
        BTTooltipArrowPosition.leftMid => 82 / 280,
        BTTooltipArrowPosition.mid => 0.5,
        BTTooltipArrowPosition.rightMid => 198 / 280,
        BTTooltipArrowPosition.right => 256 / 280,
      };

  /// Vertical fraction (used for left/right): where the arrow CENTER
  /// should sit along the balloon's height, expressed as a fraction.
  static double _vFrac(BTTooltipArrowPosition ap) => switch (ap) {
        BTTooltipArrowPosition.left => 0.15,
        BTTooltipArrowPosition.leftMid => 0.30,
        BTTooltipArrowPosition.mid => 0.50,
        BTTooltipArrowPosition.rightMid => 0.70,
        BTTooltipArrowPosition.right => 0.85,
      };
}
