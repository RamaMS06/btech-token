import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/btech_ui.dart';
import 'package:flutter/material.dart';

/// Showcase for [BTModal] — embedded panel + programmatic [BTModalSheet.show].
class BTModalShowcase extends StatefulWidget {
  const BTModalShowcase({super.key});

  @override
  State<BTModalShowcase> createState() => _BTModalShowcaseState();
}

class _BTModalShowcaseState extends State<BTModalShowcase> {
  String? _result;

  Future<void> _openSheet() async {
    final result = await BTModalSheet.show<String>(
      context,
      title: 'Confirm action',
      subtext: 'Are you sure you want to continue with this operation?',
      primaryLabel: 'Confirm',
      secondaryLabel: 'Cancel',
      onPrimary: () => Navigator.of(context).pop('primary'),
      onSecondary: () => Navigator.of(context).pop('secondary'),
      onClose: () => Navigator.of(context).pop('closed'),
    );
    if (!mounted) return;
    setState(() => _result = result);
  }

  Future<void> _openWithCheckbox() async {
    final result = await BTModalSheet.show<String>(
      context,
      title: 'Delete account',
      subtext: 'This action is permanent and cannot be undone.',
      primaryLabel: 'Delete',
      hasCheckbox: true,
      checkboxLabel: 'I understand',
      onPrimary: () => Navigator.of(context).pop('deleted'),
      onSecondary: () => Navigator.of(context).pop('cancelled'),
    );
    if (!mounted) return;
    setState(() => _result = result);
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.btechColor;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'BTModal',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            fontFamily: BTechTypography.fontFamily,
            color: colors.text.primary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Figma M-Modal 2124:2190 — fixed 328 dp width, stacked vertical footer',
          style: TextStyle(
            fontSize: 13,
            fontFamily: BTechTypography.fontFamily,
            color: colors.text.secondary,
          ),
        ),
        const SizedBox(height: 24),

        // ── Programmatic open ─────────────────────────────────────────────
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            BTButton(label: 'Open Modal', onPressed: _openSheet),
            BTButton(
              label: 'Open With Checkbox',
              variant: BTButtonVariant.secondary,
              onPressed: _openWithCheckbox,
            ),
          ],
        ),
        if (_result != null) ...[
          const SizedBox(height: 12),
          Text(
            'Last result: $_result',
            style: TextStyle(
              fontSize: 12,
              fontFamily: BTechTypography.fontFamily,
              color: colors.text.secondary,
            ),
          ),
        ],

        const SizedBox(height: 32),
        Text(
          'Embedded panel (no backdrop)',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            fontFamily: BTechTypography.fontFamily,
            color: colors.text.primary,
          ),
        ),
        const SizedBox(height: 12),

        // ── Static embedded panel ─────────────────────────────────────────
        BTModal(
          open: true,
          title: 'Static panel preview',
          subtext: 'Renders inline without a backdrop — useful for visual review.',
          onPrimary: () {},
          onSecondary: () {},
          onClose: () {},
        ),
        const SizedBox(height: 24),

        // ── Variant: hasCheckbox ─────────────────────────────────────────
        BTModal(
          open: true,
          title: 'With checkbox',
          subtext: 'Footer adds an extra row above the buttons.',
          hasCheckbox: true,
          onPrimary: () {},
          onSecondary: () {},
          onClose: () {},
        ),
      ],
    );
  }
}
