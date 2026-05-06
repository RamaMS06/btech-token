// BTBadgeShowcase — visual smoke test for BTBadge (atom).
// Sliced from Figma 72:1516.
//
// Demonstrates: all 6 variants × normal + reverse mode,
// optional left icon, optional right icon.
import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/btech_ui.dart';
import 'package:flutter/material.dart';

class BTBadgeShowcase extends StatelessWidget {
  const BTBadgeShowcase({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle(context, 'BTBadge — Figma 72:1516'),
          _subtitle(
            context,
            '6 variants × normal + reverse. Optional left/right icons.',
          ),
          const SizedBox(height: 16),
      
          // Normal mode — all variants
          _row(context, label: 'normal', children: [
            for (final v in BTBadgeVariant.values)
              BTBadge(label: _variantLabel(v), variant: v),
          ]),
      
          // Reverse mode — all variants
          _row(context, label: 'reverse', children: [
            for (final v in BTBadgeVariant.values)
              BTBadge(label: _variantLabel(v), variant: v, reverseColors: true),
          ]),
      
          // With left icon
          _row(context, label: 'left icon', children: [
            const BTBadge(
              label: 'Success',
              variant: BTBadgeVariant.success,
              leftIcon: Icon(Icons.check_circle_outline),
            ),
            const BTBadge(
              label: 'Waiting',
              variant: BTBadgeVariant.waiting,
              leftIcon: Icon(Icons.hourglass_empty),
            ),
            const BTBadge(
              label: 'Reject',
              variant: BTBadgeVariant.reject,
              leftIcon: Icon(Icons.cancel_outlined),
            ),
          ]),
      
          // With right icon
          _row(context, label: 'right icon', children: [
            const BTBadge(
              label: 'Draft',
              variant: BTBadgeVariant.draft,
              rightIcon: Icon(Icons.edit_outlined),
            ),
            const BTBadge(
              label: 'Custom',
              variant: BTBadgeVariant.custom,
              rightIcon: Icon(Icons.arrow_forward),
            ),
          ]),
      
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  String _variantLabel(BTBadgeVariant v) => switch (v) {
        BTBadgeVariant.success => 'Success',
        BTBadgeVariant.waiting => 'Waiting',
        BTBadgeVariant.neutral => 'Neutral',
        BTBadgeVariant.draft => 'Draft',
        BTBadgeVariant.reject => 'Reject',
        BTBadgeVariant.custom => 'Custom',
      };

  Widget _sectionTitle(BuildContext context, String text) => Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Text(
          text,
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w700,
            color: context.btechColor.text.primary,
            fontFamily: BTechTypography.fontFamily,
          ),
        ),
      );

  Widget _subtitle(BuildContext context, String text) => Padding(
        padding: const EdgeInsets.only(bottom: 16),
        child: Text(
          text,
          style: TextStyle(
            fontSize: 13,
            color: context.btechColor.text.secondary,
            fontFamily: BTechTypography.fontFamily,
          ),
        ),
      );

  Widget _row(
    BuildContext context, {
    required String label,
    required List<Widget> children,
  }) =>
      Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(
          children: [
            SizedBox(
              width: 100,
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: context.btechColor.text.secondary,
                  fontFamily: BTechTypography.fontFamily,
                ),
              ),
            ),
            ...children.map(
              (w) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: w,
              ),
            ),
          ],
        ),
      );
}
