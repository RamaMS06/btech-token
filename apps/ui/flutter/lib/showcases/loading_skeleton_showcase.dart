// BTLoadingSkeleton showcase — visual smoke test.
//
// Demonstrates the two constructors:
//   BTLoadingSkeleton(enabled, child)       — full subtree shimmer
//   BTLoadingSkeleton.leaf(enabled, child)  — single-node shimmer leaf
import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/btech_ui.dart';
import 'package:flutter/material.dart';

class BTLoadingSkeletonShowcase extends StatefulWidget {
  const BTLoadingSkeletonShowcase({super.key});

  @override
  State<BTLoadingSkeletonShowcase> createState() =>
      _BTLoadingSkeletonShowcaseState();
}

class _BTLoadingSkeletonShowcaseState
    extends State<BTLoadingSkeletonShowcase> {
  bool _enabled = true;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _sectionTitle(context, 'BTLoadingSkeleton — skeletonizer 1.4.3'),
        _subtitle(
          context,
          'Shimmer placeholder using btech tokens (bg.subtler → bg.primary). '
          'Toggle to reveal real content.',
        ),
        const SizedBox(height: 12),

        // Toggle button
        Row(
          children: [
            Switch(
              value: _enabled,
              onChanged: (v) => setState(() => _enabled = v),
            ),
            const SizedBox(width: 8),
            Text(
              _enabled ? 'isLoading = true' : 'isLoading = false',
              style: TextStyle(
                fontSize: 13,
                color: context.btechColor.text.secondary,
                fontFamily: BTechTypography.fontFamily,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Default constructor — wraps entire card subtree
        _label(context, 'BTLoadingSkeleton() — full subtree'),
        const SizedBox(height: 8),
        BTLoadingSkeleton(
          enabled: _enabled,
          child: _FakeCard(context: context),
        ),
        const SizedBox(height: 20),

        // ignoreContainers=true — only text/icons shimmer
        _label(context, 'ignoreContainers: true — text/icons only'),
        const SizedBox(height: 8),
        BTLoadingSkeleton(
          enabled: _enabled,
          ignoreContainers: true,
          child: _FakeCard(context: context),
        ),
        const SizedBox(height: 20),

        // leaf constructor — single node inside a manual Skeletonizer
        _label(context, 'BTLoadingSkeleton.leaf() — single node'),
        const SizedBox(height: 8),
        Row(
          children: [
            BTLoadingSkeleton.leaf(
              enabled: _enabled,
              child: const BTAvatar(
                item: BTAvatarItem(name: 'Faisal Lestari'),
                size: BTAvatarSize.md,
              ),
            ),
            const SizedBox(width: 12),
            Text(
              'Avatar is the only leaf',
              style: TextStyle(
                fontSize: 13,
                color: context.btechColor.text.primary,
                fontFamily: BTechTypography.fontFamily,
              ),
            ),
          ],
        ),
        const SizedBox(height: 32),
      ],
    );
  }
}

// ── Internal fake card ────────────────────────────────────────────────────────

class _FakeCard extends StatelessWidget {
  const _FakeCard({required this.context});
  final BuildContext context;

  @override
  Widget build(BuildContext buildContext) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: buildContext.btechColor.bg.secondary,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const BTAvatar(
            item: BTAvatarItem(name: 'Rama Sugiyanto'),
            size: BTAvatarSize.lg,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 14,
                  width: 140,
                  decoration: BoxDecoration(
                    color: buildContext.btechColor.bg.subtler,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  height: 12,
                  width: 100,
                  decoration: BoxDecoration(
                    color: buildContext.btechColor.bg.subtler,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

Widget _sectionTitle(BuildContext ctx, String text) => Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: ctx.btechColor.text.primary,
          fontFamily: BTechTypography.fontFamily,
        ),
      ),
    );

Widget _subtitle(BuildContext ctx, String text) => Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: TextStyle(
          fontSize: 13,
          color: ctx.btechColor.text.secondary,
          fontFamily: BTechTypography.fontFamily,
        ),
      ),
    );

Widget _label(BuildContext ctx, String text) => Text(
      text,
      style: TextStyle(
        fontSize: 12,
        color: ctx.btechColor.text.secondary,
        fontFamily: BTechTypography.fontFamily,
      ),
    );
