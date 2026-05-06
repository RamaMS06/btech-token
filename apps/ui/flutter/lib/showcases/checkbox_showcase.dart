// BTCheckboxShowcase — Figma 504:4181
import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/btech_ui.dart';
import 'package:flutter/material.dart';

class BTCheckboxShowcase extends StatefulWidget {
  const BTCheckboxShowcase({super.key});

  @override
  State<BTCheckboxShowcase> createState() => _BTCheckboxShowcaseState();
}

class _BTCheckboxShowcaseState extends State<BTCheckboxShowcase> {
  bool _interactive = false;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: ConstrainedBox(
        constraints: const BoxConstraints(minWidth: 400, maxWidth: 900),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const _SectionTitle(
                title: 'BTCheckbox — Figma 504:4181',
                subtitle: '7 states · optional label + subtext · '
                    'indeterminate via prop · error border + subtext colour.',
              ),
              const SizedBox(height: 24),

              // Box only
              _Row(
                label: 'uncheck',
                children: [BTCheckbox(checked: false, onChanged: (_) {})],
              ),
              _Row(
                label: 'check',
                children: [BTCheckbox(checked: true, onChanged: (_) {})],
              ),
              _Row(
                label: 'indeterminate',
                children: [
                  BTCheckbox(
                    checked: false,
                    indeterminate: true,
                    onChanged: (_) {},
                  ),
                ],
              ),
              _Row(
                label: 'disable uncheck',
                children: [
                  const BTCheckbox(checked: false, disabled: true),
                ],
              ),
              _Row(
                label: 'disable check',
                children: [
                  const BTCheckbox(checked: true, disabled: true),
                ],
              ),
              _Row(
                label: 'disable indet.',
                children: [
                  const BTCheckbox(
                    checked: false,
                    indeterminate: true,
                    disabled: true,
                  ),
                ],
              ),
              _Row(
                label: 'error',
                children: [
                  BTCheckbox(checked: false, error: true, onChanged: (_) {}),
                ],
              ),

              const SizedBox(height: 16),

              // With label
              _Row(
                label: 'with label',
                children: [
                  BTCheckbox(
                    checked: false,
                    label: 'Accept terms',
                    onChanged: (_) {},
                  ),
                  BTCheckbox(
                    checked: true,
                    label: 'Checked',
                    onChanged: (_) {},
                  ),
                  const BTCheckbox(
                    checked: false,
                    label: 'Disabled',
                    disabled: true,
                  ),
                ],
              ),

              // With label + subtext
              _Row(
                label: 'with subtext',
                children: [
                  BTCheckbox(
                    checked: false,
                    label: 'Subscribe',
                    subtext: 'Receive weekly digest',
                    onChanged: (_) {},
                  ),
                  BTCheckbox(
                    checked: false,
                    error: true,
                    label: 'Required',
                    subtext: 'Please accept to continue',
                    onChanged: (_) {},
                  ),
                  const BTCheckbox(
                    checked: true,
                    disabled: true,
                    label: 'Locked',
                    subtext: 'Cannot be changed',
                  ),
                ],
              ),

              const SizedBox(height: 16),

              // Interactive demo
              _Row(
                label: 'interactive',
                children: [
                  BTCheckbox(
                    checked: _interactive,
                    label: 'Toggle me',
                    subtext: _interactive ? 'Checked ✓' : 'Unchecked',
                    onChanged: (v) => setState(() => _interactive = v),
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
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              width: 120,
              child: Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 11,
                    fontFamily: 'JetBrainsMono',
                    color: context.btechColor.text.tertiary,
                  ),
                ),
              ),
            ),
            Wrap(
              spacing: 16,
              runSpacing: 12,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: children,
            ),
          ],
        ),
      ),
    );
  }
}
