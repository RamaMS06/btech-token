import 'package:flutter/material.dart';

/// Icon widget for each [BTAlertVariant] — 16×16 filled Material icon.
///
/// Uses [color] for the icon tint so it inherits the variant's semantic color.
class BTAlertIcon extends StatelessWidget {
  const BTAlertIcon({required this.variant, required this.color, super.key});

  final String variant; // 'info' | 'success' | 'error' | 'warning'
  final Color color;

  @override
  Widget build(BuildContext context) {
    final icon = switch (variant) {
      'success' => Icons.check_circle,
      'error' => Icons.error,
      'warning' => Icons.warning_amber_rounded,
      _ => Icons.info, // info, neutral, neutralDark
    };
    return Icon(icon, size: 16, color: color);
  }
}
