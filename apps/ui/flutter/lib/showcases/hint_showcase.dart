// Auto-generated showcase — do not edit manually
import 'package:btech_ui/btech_ui.dart';
import 'package:flutter/material.dart';

class BTHintShowcase extends StatelessWidget {
  const BTHintShowcase({super.key});

  @override
  Widget build(final BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Atoms › Hint — Figma 658:1960',
          style: TextStyle(fontSize: 11, color: Color(0xFF9CA3AF)),
        ),
        const SizedBox(height: 16),
        ...[BTHintSize.lg, BTHintSize.md, BTHintSize.sm].map(
          (final size) => Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Row(
              children: [
                SizedBox(
                  width: 28,
                  child: Text(
                    size.name,
                    style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF)),
                  ),
                ),
                const SizedBox(width: 12),
                // Dot
                BTHint(size: size),
                const SizedBox(width: 16),
                // 1-digit
                BTHint(count: 5, size: size),
                const SizedBox(width: 16),
                // 2-digit
                BTHint(count: 22, size: size),
                const SizedBox(width: 16),
                // 99+
                BTHint(count: 150, size: size),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
