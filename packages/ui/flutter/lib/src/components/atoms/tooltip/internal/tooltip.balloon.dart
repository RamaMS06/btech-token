// ignore_for_file: lines_longer_than_80_chars

import 'package:btech_tokens/btech_tokens.dart';
import 'package:flutter/material.dart';

/// Dark rounded balloon body — JUST the container. The arrow is rendered
/// as a separate `Positioned` widget alongside this one (el_tooltip pattern).
///
/// Width is fixed at 280 px. Height is determined by the text/content and
/// measured at runtime via a hidden first-pass overlay (see
/// `_BTTooltipState._measureBalloon`).
class BTTooltipBalloonBody extends StatelessWidget {
  const BTTooltipBalloonBody({
    this.text,
    this.content,
    super.key,
  });

  final String? text;
  final Widget? content;

  static const double width = 280;

  @override
  Widget build(BuildContext context) {
    final c = context.btechColor;
    final r = context.btechRadius;
    final bg = c.bg.inverse;

    return Material(
      type: MaterialType.transparency,
      child: Container(
        width: width,
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(r.sm),
        ),
        padding: const EdgeInsets.all(16),
        child: content ??
            Text(
              text ?? '',
              style: TextStyle(
                fontFamily: BTechTypography.fontFamily,
                fontSize: 14,
                fontWeight: FontWeight.w500,
                height: 16 / 14,
                color: c.text.inverse,
              ),
            ),
      ),
    );
  }
}
