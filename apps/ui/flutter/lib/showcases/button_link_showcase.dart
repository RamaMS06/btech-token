// BTButtonLinkShowcase — Figma 480:3197
import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/btech_ui.dart';
import 'package:flutter/material.dart';

class BTButtonLinkShowcase extends StatelessWidget {
  const BTButtonLinkShowcase({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minWidth: 400, maxWidth: 800),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const _SectionTitle(
                title: 'BTButtonLink — Figma 480:3197',
                subtitle:
                    '5 variants. Hover → underline + bold. '
                    'Press → neutral dim. Disabled → text.disabled.',
              ),
              const SizedBox(height: 24),

              // Default — all variants (non-const: closures aren't const)
              _Row(
                label: 'default',
                children: [
                  BTButtonLink(label: 'Primary', onPressed: () {}),
                  BTButtonLink.secondary(label: 'Secondary', onPressed: () {}),
                  BTButtonLink.tertiary(label: 'Tertiary', onPressed: () {}),
                  _InvertWrap(
                    child: BTButtonLink.invert(label: 'Invert', onPressed: () {}),
                  ),
                  BTButtonLink.custom(label: 'Custom', onPressed: () {}),
                ],
              ),

              // Disabled
              _Row(
                label: 'disabled',
                children: [
                  const BTButtonLink(label: 'Primary', onPressed: null),
                  const BTButtonLink.secondary(label: 'Secondary', onPressed: null),
                  const BTButtonLink.tertiary(label: 'Tertiary', onPressed: null),
                  _InvertWrap(
                    child: const BTButtonLink.invert(label: 'Invert', onPressed: null),
                  ),
                  const BTButtonLink.custom(label: 'Custom', onPressed: null),
                ],
              ),

              // With icons
              _Row(
                label: 'with icons',
                children: [
                  BTButtonLink(
                    label: 'Primary',
                    leftIcon: const Icon(Icons.arrow_back, size: 16),
                    rightIcon: const Icon(Icons.arrow_forward, size: 16),
                    onPressed: () {},
                  ),
                  BTButtonLink.secondary(
                    label: 'Secondary',
                    leftIcon: const Icon(Icons.close, size: 16),
                    onPressed: () {},
                  ),
                  BTButtonLink.custom(
                    label: 'Custom',
                    rightIcon: const Icon(Icons.open_in_new, size: 16),
                    onPressed: () {},
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Private helpers ───────────────────────────────────────────────────────────

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: TextStyle(
            fontSize: 13,
            color: context.btechColor.text.secondary,
          ),
        ),
      ],
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.children});

  final String label;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            SizedBox(
              width: 100,
              child: Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  fontFamily: 'JetBrainsMono',
                  color: context.btechColor.text.tertiary,
                ),
              ),
            ),
            Wrap(
              spacing: 12,
              runSpacing: 8,
              crossAxisAlignment: WrapCrossAlignment.center,
              direction: Axis.horizontal,
              children: children,
            ),
          ],
        ),
      ),
    );
  }
}

/// Wraps the invert variant in a dark background swatch.
class _InvertWrap extends StatelessWidget {
  const _InvertWrap({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: context.btechColor.text.primary,
        borderRadius: BorderRadius.circular(4),
      ),
      child: child,
    );
  }
}
