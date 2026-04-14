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
    // Override theme locally per card — same as data-tenant scoping in web demo.
    // In production, BTechTheme.forTenant() is called once at MaterialApp level.

    return Theme(
      data: BTechTheme.forTenant(tenantId, Brightness.light),
      child: Builder(
        builder: (ctx) {
          final tokens = Theme.of(ctx).extension<BTechTokenExtension>()!.tokens;
          return Container(
            decoration: BoxDecoration(
              color: BTechColor.background.danger,
              border: Border.all(color: const Color(0xFFE5E7EB)),
              borderRadius: BorderRadius.circular(12),
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
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF111827),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF3F4F6),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        tenantId,
                        style: const TextStyle(
                          fontSize: 11,
                          color: Color(0xFF6B7280),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),

                // ── Subtitle ─────────────────────────────────────────────
                Text(
                  subtitle,
                  style:
                      const TextStyle(fontSize: 13, color: Color(0xFF6B7280)),
                ),
                const SizedBox(height: 4),

                // ── Code hint ───────────────────────────────────────────
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3F4F6),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    'BTechTheme.forTenant("$tenantId")',
                    style: const TextStyle(
                      fontFamily: 'monospace',
                      fontSize: 11,
                      color: Color(0xFF6B7280),
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
                        backgroundColor: tokens.dangerBg,
                        foregroundColor: tokens.dangerFg,
                        shape: RoundedRectangleBorder(
                          borderRadius:
                              BorderRadius.circular(tokens.radiusInteractive),
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
