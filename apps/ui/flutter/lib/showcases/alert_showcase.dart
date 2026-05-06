import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/btech_ui.dart';
import 'package:flutter/material.dart';

/// Showcase for [BTAlert] — all 6 variants, simple and with description.
class BTAlertShowcase extends StatefulWidget {
  const BTAlertShowcase({super.key});

  @override
  State<BTAlertShowcase> createState() => _BTAlertShowcaseState();
}

class _BTAlertShowcaseState extends State<BTAlertShowcase> {
  // Tracks which alerts have been dismissed in each section
  final Set<int> _dismissedSimple = {};
  final Set<int> _dismissedFull   = {};

  static const _simpleAlerts = [
    (BTAlertVariant.info,        'Info alert'),
    (BTAlertVariant.success,     'Success alert'),
    (BTAlertVariant.error,       'Error alert'),
    (BTAlertVariant.warning,     'Warning alert'),
    (BTAlertVariant.neutral,     'Neutral alert'),
    (BTAlertVariant.neutralDark, 'Neutral dark alert'),
  ];

  static const _fullAlerts = [
    (BTAlertVariant.info,        'Info alert'),
    (BTAlertVariant.success,     'Success alert'),
    (BTAlertVariant.error,       'Error alert'),
    (BTAlertVariant.warning,     'Warning alert'),
    (BTAlertVariant.neutral,     'Neutral alert'),
    (BTAlertVariant.neutralDark, 'Neutral dark alert'),
  ];

  static const _desc =
      'Lorem ipsum dolor sit amet, consectetur adipiscing.';

  @override
  Widget build(BuildContext context) {
    final c = context.btechColor;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Simple ────────────────────────────────────────────────────────────
        Text(
          'Simple (no description)',
          style: TextStyle(
            fontFamily: BTechTypography.fontFamily,
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: c.text.primary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Label only — action renders as text link.',
          style: TextStyle(
            fontFamily: BTechTypography.fontFamily,
            fontSize: 13,
            color: c.text.secondary,
          ),
        ),
        const SizedBox(height: 12),

        // Reset button
        GestureDetector(
          onTap: () => setState(() => _dismissedSimple.clear()),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              border: Border.all(color: c.border.primary),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              'Reset alerts',
              style: TextStyle(
                fontFamily: BTechTypography.fontFamily,
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: c.text.primary,
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Alert list
        for (var i = 0; i < _simpleAlerts.length; i++)
          if (!_dismissedSimple.contains(i)) ...[
            BTAlert(
              variant: _simpleAlerts[i].$1,
              label: _simpleAlerts[i].$2,
              actionLabel: 'Action',
              dismissible: true,
              onAction: () {
                debugPrint('[BTAlert] action: ${_simpleAlerts[i].$1}');
              },
              onDismiss: () => setState(() => _dismissedSimple.add(i)),
            ),
            const SizedBox(height: 8),
          ],

        const SizedBox(height: 24),

        // ── With description ──────────────────────────────────────────────────
        Text(
          'With description',
          style: TextStyle(
            fontFamily: BTechTypography.fontFamily,
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: c.text.primary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Bold label + supporting text — action renders as bordered button.',
          style: TextStyle(
            fontFamily: BTechTypography.fontFamily,
            fontSize: 13,
            color: c.text.secondary,
          ),
        ),
        const SizedBox(height: 12),

        // Reset button
        GestureDetector(
          onTap: () => setState(() => _dismissedFull.clear()),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              border: Border.all(color: c.border.primary),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              'Reset alerts',
              style: TextStyle(
                fontFamily: BTechTypography.fontFamily,
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: c.text.primary,
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Alert list
        for (var i = 0; i < _fullAlerts.length; i++)
          if (!_dismissedFull.contains(i)) ...[
            BTAlert(
              variant: _fullAlerts[i].$1,
              label: _fullAlerts[i].$2,
              description: _desc,
              actionLabel: 'Action',
              dismissible: true,
              onAction: () {
                debugPrint('[BTAlert] action: ${_fullAlerts[i].$1}');
              },
              onDismiss: () => setState(() => _dismissedFull.add(i)),
            ),
            const SizedBox(height: 8),
          ],
      ],
    );
  }
}
