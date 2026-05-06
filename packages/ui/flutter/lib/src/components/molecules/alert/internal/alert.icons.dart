import 'package:flutter/material.dart';

/// Icon widget for each [BTAlertVariant] — 16×16 Material icon.
///
/// Uses [color] for the icon tint so it inherits the variant's semantic color.
class BTAlertIcon extends StatelessWidget {
  const BTAlertIcon({required this.variant, required this.color, super.key});

  final String variant; // 'info' | 'success' | 'error' | 'warning' | 'neutral'
  final Color color;

  @override
  Widget build(BuildContext context) {
    final icon = switch (variant) {
      'success' => Icons.check_circle_outline,
      'error' => Icons.error_outline,
      'warning' => Icons.warning_amber_outlined,
      _ => Icons.info_outline, // info, neutral, neutralDark
    };
    return Icon(icon, size: 16, color: color);
  }
}
