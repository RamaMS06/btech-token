// BTButtonShowcase — Figma 114:2645
import 'package:btech_ui/btech_ui.dart';
import 'package:buma_design_system/buma_design_system.dart';
import 'package:flutter/material.dart';

class BTButtonShowcase extends StatelessWidget {
  const BTButtonShowcase({super.key});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionTitle(
          title: 'BTButton — Figma 114:2645',
          subtitle:
              '5 variants × default + small sizes. '
              'Animated pressed state (120 ms easeOut / '
              '200 ms easeIn).',
        ),
        const SizedBox(height: 24),

        // Default size
        _Row(label: 'default', children: [
          for (final v in BTButtonVariant.values)
            BTButton(label: _cap(v.name), variant: v, onPressed: () {}),
        ]),

        // Small size
        _Row(label: 'small', children: [
          for (final v in BTButtonVariant.values)
            BTButton(
              label: _cap(v.name),
              variant: v,
              size: BTButtonSize.sm,
              onPressed: () {},
            ),
        ]),

        // Disabled (onPressed = null)
        _Row(label: 'disabled', children: [
          for (final v in BTButtonVariant.values)
            BTButton(label: _cap(v.name), variant: v, onPressed: null),
        ]),

        // With left icon
        _Row(label: 'left icon', children: [
          BTButton(
            label: 'Upload',
            variant: BTButtonVariant.primary,
            leftIcon: const Icon(Icons.upload_rounded),
            onPressed: () {},
          ),
          BTButton(
            label: 'Save',
            variant: BTButtonVariant.secondary,
            leftIcon: const Icon(Icons.check_rounded),
            onPressed: () {},
          ),
          BTButton(
            label: 'Delete',
            variant: BTButtonVariant.destructive,
            leftIcon: const Icon(Icons.delete_outline_rounded),
            onPressed: () {},
          ),
        ]),

        // Icon only
        _Row(label: 'icon only', children: [
          for (final v in BTButtonVariant.values)
            BTButton.iconOnly(
              icon: const Icon(Icons.add_rounded),
              variant: v,
              onPressed: () {},
            ),
        ]),

        // Icon only small
        _Row(label: 'icon only sm', children: [
          for (final v in BTButtonVariant.values)
            BTButton.iconOnly(
              icon: const Icon(Icons.add_rounded),
              variant: v,
              size: BTButtonSize.sm,
              onPressed: () {},
            ),
        ]),
        _Row(label: 'icon only sm', children: [
          for (final v in UIButtonVariant.values)
            UIButton.iconOnly(
              icon: Icons.abc,
              variant: v,
              size: UIButtonSize.small,
              onPressed: () {},
            ),
        ]),
      ],
    );
  }
}

String _cap(String s) =>
    s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title, required this.subtitle});

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 4),
        Text(
          subtitle,
          style: textTheme.bodySmall?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }
}

// ── Row helper ────────────────────────────────────────────────────────────────
// Label (100 px fixed) + Wrap of buttons.
// On narrow screens the buttons wrap to the next line automatically.

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.children});

  final String label;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 88,
            child: Padding(
              padding: const EdgeInsets.only(top: 10),
              child: Text(
                label,
                style: const TextStyle(
                  fontSize: 11,
                  fontFamily: 'monospace',
                  color: Colors.grey,
                ),
              ),
            ),
          ),
          Expanded(
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: children,
            ),
          ),
        ],
      ),
    );
  }
}
