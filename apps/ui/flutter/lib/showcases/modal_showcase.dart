import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/btech_ui.dart';
import 'package:flutter/material.dart';

/// Showcase for [BTModal] — mirrors the web Vue/React showcase structure.
///
/// UI tab   → static embedded panels (default, no-close, with-checkbox).
/// Usage tab → interactive playground: toggles + "Open Modal" button.
class BTModalShowcase extends StatefulWidget {
  const BTModalShowcase({super.key});

  @override
  State<BTModalShowcase> createState() => _BTModalShowcaseState();
}

class _BTModalShowcaseState extends State<BTModalShowcase> {
  // ── Tab state ───────────────────────────────────────────────────────────
  int _tab = 0; // 0 = UI, 1 = Usage

  // ── Usage playground state ──────────────────────────────────────────────
  bool _hasClose = true;
  bool _hasFooter = true;
  bool _hasSecondaryButton = true;
  bool _hasCheckbox = false;
  String? _lastResult;

  // ── Open modal from Usage tab ───────────────────────────────────────────
  Future<void> _openModal() async {
    final result = await BTModalSheet.show<String>(
      context,
      title: 'Confirm action',
      subtext: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      hasClose: _hasClose,
      hasFooter: _hasFooter,
      hasSecondaryButton: _hasSecondaryButton,
      hasCheckbox: _hasCheckbox,
      checkboxLabel: "Don't show again",
      primaryLabel: 'Confirm',
      secondaryLabel: 'Cancel',
      onPrimary: () => Navigator.of(context).pop('primary'),
      onSecondary: () => Navigator.of(context).pop('secondary'),
      onClose: () => Navigator.of(context).pop('closed'),
    );
    if (!mounted) return;
    setState(() => _lastResult = result);
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.btechColor;
    final typo = BTechTypography.fontFamily;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Header ──────────────────────────────────────────────────────
        Text(
          'BTModal',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            fontFamily: typo,
            color: colors.text.primary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Figma M-Modal 2124:2190 — 328 dp, stacked footer',
          style: TextStyle(
            fontSize: 13,
            fontFamily: typo,
            color: colors.text.secondary,
          ),
        ),
        const SizedBox(height: 20),

        // ── Tab bar ─────────────────────────────────────────────────────
        _TabBar(
          selected: _tab,
          labels: const ['UI', 'Usage'],
          onTap: (i) => setState(() => _tab = i),
        ),
        const SizedBox(height: 24),

        // ── Tab content ─────────────────────────────────────────────────
        if (_tab == 0) _buildUiTab(colors, typo),
        if (_tab == 1) _buildUsageTab(colors, typo),
      ],
    );
  }

  // ── UI Tab ───────────────────────────────────────────────────────────────

  Widget _buildUiTab(dynamic colors, String typo) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Default variant
        _SectionLabel(label: 'Default', typo: typo, colors: colors),
        const SizedBox(height: 8),
        BTModal(
          open: true,
          title: 'Modal title',
          subtext: 'Supporting subtext describing what this modal does.',
          onPrimary: () {},
          onSecondary: () {},
          onClose: () {},
        ),

        const SizedBox(height: 28),

        // hasClose = false
        _SectionLabel(label: 'hasClose = false', typo: typo, colors: colors),
        const SizedBox(height: 8),
        BTModal(
          open: true,
          title: 'No close button',
          subtext: 'Force users to choose an action.',
          hasClose: false,
          onPrimary: () {},
          onSecondary: () {},
        ),

        const SizedBox(height: 28),

        // hasSecondaryButton = false
        _SectionLabel(label: 'hasSecondaryButton = false', typo: typo, colors: colors),
        const SizedBox(height: 8),
        BTModal(
          open: true,
          title: 'Single button',
          subtext: 'Only the primary action is shown.',
          hasSecondaryButton: false,
          onPrimary: () {},
          onClose: () {},
        ),

        const SizedBox(height: 28),

        // hasCheckbox = true
        _SectionLabel(label: 'hasCheckbox = true', typo: typo, colors: colors),
        const SizedBox(height: 8),
        BTModal(
          open: true,
          title: 'With checkbox',
          subtext: 'Footer left side hosts a checkbox + label.',
          hasCheckbox: true,
          checkboxLabel: "Don't show again",
          onPrimary: () {},
          onSecondary: () {},
          onClose: () {},
        ),

        const SizedBox(height: 28),

        // hasFooter = false
        _SectionLabel(label: 'hasFooter = false', typo: typo, colors: colors),
        const SizedBox(height: 8),
        BTModal(
          open: true,
          title: 'Header only',
          subtext: 'No footer — content-only modal.',
          hasFooter: false,
          onClose: () {},
        ),
      ],
    );
  }

  // ── Usage Tab ─────────────────────────────────────────────────────────────

  Widget _buildUsageTab(dynamic colors, String typo) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Controls grid
        _ToggleRow(
          label: 'Has close button',
          value: _hasClose,
          onChanged: (v) => setState(() => _hasClose = v),
          typo: typo,
          colors: colors,
        ),
        const SizedBox(height: 12),
        _ToggleRow(
          label: 'Has footer',
          value: _hasFooter,
          onChanged: (v) => setState(() => _hasFooter = v),
          typo: typo,
          colors: colors,
        ),
        const SizedBox(height: 12),
        _ToggleRow(
          label: 'Has secondary button',
          value: _hasSecondaryButton,
          onChanged: (v) => setState(() => _hasSecondaryButton = v),
          typo: typo,
          colors: colors,
        ),
        const SizedBox(height: 12),
        _ToggleRow(
          label: 'Has checkbox',
          value: _hasCheckbox,
          onChanged: (v) => setState(() => _hasCheckbox = v),
          typo: typo,
          colors: colors,
        ),
        const SizedBox(height: 24),

        // Open button
        BTButton(
          label: 'Open Modal',
          onPressed: _openModal,
        ),

        // Last result
        if (_lastResult != null) ...[
          const SizedBox(height: 12),
          Text(
            'Last result: $_lastResult',
            style: TextStyle(
              fontSize: 12,
              fontFamily: typo,
              color: colors.text.secondary,
            ),
          ),
        ],
      ],
    );
  }
}

// ── Private helper widgets ────────────────────────────────────────────────────

class _TabBar extends StatelessWidget {
  const _TabBar({
    required this.selected,
    required this.labels,
    required this.onTap,
  });

  final int selected;
  final List<String> labels;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.btechColor;
    final typo = BTechTypography.fontFamily;

    return Row(
      children: List.generate(labels.length, (i) {
        final isActive = i == selected;
        return Padding(
          padding: EdgeInsets.only(right: i < labels.length - 1 ? 8 : 0),
          child: GestureDetector(
            onTap: () => onTap(i),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: isActive ? colors.bg.secondary : Colors.transparent,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: colors.border.primary),
              ),
              child: Text(
                labels[i],
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  fontFamily: typo,
                  color: colors.text.primary,
                ),
              ),
            ),
          ),
        );
      }),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({
    required this.label,
    required this.typo,
    required this.colors,
  });

  final String label;
  final String typo;
  final dynamic colors;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        fontFamily: typo,
        color: colors.text.secondary,
      ),
    );
  }
}

class _ToggleRow extends StatelessWidget {
  const _ToggleRow({
    required this.label,
    required this.value,
    required this.onChanged,
    required this.typo,
    required this.colors,
  });

  final String label;
  final bool value;
  final ValueChanged<bool> onChanged;
  final String typo;
  final dynamic colors;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontFamily: typo,
              color: colors.text.primary,
            ),
          ),
        ),
        Switch(
          value: value,
          onChanged: onChanged,
          activeColor: context.btechColor.brand.primary,
        ),
      ],
    );
  }
}
