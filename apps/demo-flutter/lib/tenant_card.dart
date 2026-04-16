import 'package:flutter/material.dart';
import 'package:btech_tokens/btech_tokens.dart';

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
    return Theme(
      data: BTechTheme.forTenant(tenantId, Brightness.light),
      child: Builder(
        builder: (ctx) {
          return Container(
            decoration: BoxDecoration(
              color: ctx.btechColor.background.surface.raised,
              border: Border.all(color: ctx.btechColor.stroke.neutral),
              borderRadius: BorderRadius.circular(ctx.btechRadius.card),
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
                      style: ctx.btechFont.subheading.h5,
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: ctx.btechColor.background.surface.subtle,
                        borderRadius: BorderRadius.circular(ctx.btechRadius.badge),
                      ),
                      child: Text(
                        tenantId,
                        style: TextStyle(
                          fontSize: 11,
                          color: ctx.btechColor.text.neutral.subtle,
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
                    color: ctx.btechColor.text.neutral.subtle,
                  ),
                ),
                const SizedBox(height: 4),

                // ── Code hint ────────────────────────────────────────────
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: ctx.btechColor.background.surface.subtle,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'BTechTheme.forTenant("$tenantId")',
                    style: TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 11,
                      color: ctx.btechColor.text.neutral.subtle,
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
                        backgroundColor: ctx.btechColor.background.danger,
                        foregroundColor: ctx.btechColor.text.on.danger,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(ctx.btechRadius.interactive),
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
        },
      ),
    );
  }
}
