import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/btech_ui.dart';
import 'package:flutter/material.dart';

class BTSeparatorShowcase extends StatelessWidget {
  const BTSeparatorShowcase({super.key});

  @override
  Widget build(BuildContext context) {
    final colors = context.btechColor;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Separator',
          style: TextStyle(
            fontFamily: BTechTypography.fontFamily,
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: colors.text.primary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          '1px divider line — horizontal (default) or vertical. Figma node 194:756.',
          style: TextStyle(
            fontFamily: BTechTypography.fontFamily,
            fontSize: 13,
            color: colors.text.secondary,
          ),
        ),
        const SizedBox(height: 24),

        // ── Horizontal ──────────────────────────────────────────────────────
        Text(
          'horizontal',
          style: TextStyle(
            fontFamily: BTechTypography.fontFamily,
            fontSize: 11,
            color: colors.text.tertiary,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: colors.bg.subtle,
            borderRadius: BorderRadius.circular(4),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Section A', style: TextStyle(fontSize: 13, color: colors.text.primary, fontFamily: BTechTypography.fontFamily)),
              const SizedBox(height: 12),
              const BTSeparator(),
              const SizedBox(height: 12),
              Text('Section B', style: TextStyle(fontSize: 13, color: colors.text.primary, fontFamily: BTechTypography.fontFamily)),
              const SizedBox(height: 12),
              const BTSeparator(),
              const SizedBox(height: 12),
              Text('Section C', style: TextStyle(fontSize: 13, color: colors.text.primary, fontFamily: BTechTypography.fontFamily)),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // ── Vertical ────────────────────────────────────────────────────────
        Text(
          'vertical',
          style: TextStyle(
            fontFamily: BTechTypography.fontFamily,
            fontSize: 11,
            color: colors.text.tertiary,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          height: 32,
          decoration: BoxDecoration(
            color: colors.bg.subtle,
            borderRadius: BorderRadius.circular(4),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Item A', style: TextStyle(fontSize: 13, color: colors.text.primary, fontFamily: BTechTypography.fontFamily)),
              const SizedBox(width: 12),
              const BTSeparator(orientation: BTSeparatorOrientation.vertical),
              const SizedBox(width: 12),
              Text('Item B', style: TextStyle(fontSize: 13, color: colors.text.primary, fontFamily: BTechTypography.fontFamily)),
              const SizedBox(width: 12),
              const BTSeparator(orientation: BTSeparatorOrientation.vertical),
              const SizedBox(width: 12),
              Text('Item C', style: TextStyle(fontSize: 13, color: colors.text.primary, fontFamily: BTechTypography.fontFamily)),
            ],
          ),
        ),
      ],
    );
  }
}
