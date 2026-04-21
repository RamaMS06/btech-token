import 'package:flutter/material.dart';
import 'package:btech_tokens_bspace/btech_tokens_bspace.dart';

class TenantCard extends StatelessWidget {
  final String tenantId;
  final String label;
  final String subtitle;

  const TenantCard({
    super.key,
    required this.tenantId,
    required this.label,
    required this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    final c = context.btechColor;
    final r = context.btechRadius;
    final heading = BTechFontHeading();

    return Container(
      decoration: BoxDecoration(
        color: c.background.primary,
        border: Border.all(color: c.stroke.primary.bolder),
        borderRadius: BorderRadius.circular(r.card),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Card header ───────────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                label,
                style: heading.h4.copyWith(color: c.text.neutral.inverse),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: c.background.surface.subtle,
                  borderRadius: BorderRadius.circular(r.badge),
                ),
                child: Text(
                  tenantId,
                  style: TextStyle(
                    fontSize: 11,
                    color: c.text.neutral.subtle,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),

          // ── Subtitle ─────────────────────────────────────────────
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 13,
              color: c.text.neutral.inverse,
            ),
          ),
          const SizedBox(height: 4),

          // ── Code hint ────────────────────────────────────────────
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: c.background.surface.subtle,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              'btech_tokens_$tenantId · btechTheme()',
              style: TextStyle(
                fontFamily: 'monospace',
                fontSize: 11,
                color: c.text.neutral.subtle,
              ),
            ),
          ),
          const SizedBox(height: 16),

          // ── Buttons ──────────────────────────────────────────────
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              ElevatedButton(
                onPressed: () {},
                child: const Text('Primary Action'),
              ),
              OutlinedButton(
                onPressed: () {},
                child: const Text('Secondary'),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: c.background.danger,
                  foregroundColor: c.text.neutral.inverse,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(r.interactive),
                  ),
                ),
                onPressed: () {},
                child: const Text('Delete'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
