import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/btech_ui.dart';
import 'package:flutter/material.dart';

/// Showcase for [BTAlert] — UI tab (variant grid) + Usage tab (programmatic).
class BTAlertShowcase extends StatefulWidget {
  const BTAlertShowcase({super.key});

  @override
  State<BTAlertShowcase> createState() => _BTAlertShowcaseState();
}

class _BTAlertShowcaseState extends State<BTAlertShowcase>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  // Tracks which alerts have been dismissed in each section
  final Set<int> _dismissedSimple = {};
  final Set<int> _dismissedFull = {};

  static const _simpleAlerts = [
    (BTAlertVariant.info, 'Info alert'),
    (BTAlertVariant.success, 'Success alert'),
    (BTAlertVariant.error, 'Error alert'),
    (BTAlertVariant.warning, 'Warning alert'),
    (BTAlertVariant.neutral, 'Neutral alert'),
    (BTAlertVariant.neutralDark, 'Neutral dark alert'),
  ];

  static const _fullAlerts = [
    (BTAlertVariant.info, 'Info alert'),
    (BTAlertVariant.success, 'Success alert'),
    (BTAlertVariant.error, 'Error alert'),
    (BTAlertVariant.warning, 'Warning alert'),
    (BTAlertVariant.neutral, 'Neutral alert'),
    (BTAlertVariant.neutralDark, 'Neutral dark alert'),
  ];

  static const _showConfigs = [
    (BTAlertVariant.info, 'Info — simple', null),
    (BTAlertVariant.success, 'Success — simple', null),
    (BTAlertVariant.error, 'Error — simple', null),
    (BTAlertVariant.warning, 'Warning — simple', null),
    (BTAlertVariant.neutral, 'Neutral — simple', null),
    (BTAlertVariant.neutralDark, 'Neutral dark — simple', null),
    (
      BTAlertVariant.info,
      'Info — with description',
      'Something needs your attention right now.',
    ),
    (
      BTAlertVariant.success,
      'Success — with description',
      'Your changes have been saved successfully.',
    ),
    (
      BTAlertVariant.error,
      'Error — with description',
      'Could not complete the request. Try again.',
    ),
    (
      BTAlertVariant.warning,
      'Warning — with description',
      'This action may have unintended side effects.',
    ),
  ];

  static const _desc = 'Lorem ipsum dolor sit amet, consectetur adipiscing.';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final c = context.btechColor;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // ── Tabs ──
        TabBar(
          controller: _tabController,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          labelColor: c.text.primary,
          unselectedLabelColor: c.text.secondary,
          indicatorColor: c.text.primary,
          labelStyle: TextStyle(
            fontFamily: BTechTypography.fontFamily,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
          unselectedLabelStyle: TextStyle(
            fontFamily: BTechTypography.fontFamily,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
          tabs: const [
            Tab(text: 'UI'),
            Tab(text: 'Usage'),
          ],
        ),
        const SizedBox(height: 24),

        SizedBox(
          height: 1200,
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildUITab(c),
              _buildUsageTab(c),
            ],
          ),
        ),
      ],
    );
  }

  // ── UI Tab ──────────────────────────────────────────────────────────────────

  Widget _buildUITab(BTechColorTheme c) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Simple
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
          _buildResetButton(
            c,
            onTap: () => setState(() => _dismissedSimple.clear()),
          ),
          const SizedBox(height: 12),
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

          // With description + link
          Text(
            'With description + link',
            style: TextStyle(
              fontFamily: BTechTypography.fontFamily,
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: c.text.primary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Bold label + text + inline link — action renders as bordered button.',
            style: TextStyle(
              fontFamily: BTechTypography.fontFamily,
              fontSize: 13,
              color: c.text.secondary,
            ),
          ),
          const SizedBox(height: 12),
          _buildResetButton(
            c,
            onTap: () => setState(() => _dismissedFull.clear()),
          ),
          const SizedBox(height: 12),
          for (var i = 0; i < _fullAlerts.length; i++)
            if (!_dismissedFull.contains(i)) ...[
              BTAlert(
                variant: _fullAlerts[i].$1,
                label: _fullAlerts[i].$2,
                description: _desc,
                linkLabel: 'Learn more',
                actionLabel: 'Action',
                dismissible: true,
                onAction: () {
                  debugPrint('[BTAlert] action: ${_fullAlerts[i].$1}');
                },
                onLink: () {
                  debugPrint('[BTAlert] link: ${_fullAlerts[i].$1}');
                },
                onDismiss: () => setState(() => _dismissedFull.add(i)),
              ),
              const SizedBox(height: 8),
            ],
        ],
      ),
    );
  }

  // ── Usage Tab ───────────────────────────────────────────────────────────────

  Widget _buildUsageTab(BTechColorTheme c) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'BTAlert.show — programmatic trigger',
            style: TextStyle(
              fontFamily: BTechTypography.fontFamily,
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: c.text.primary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Each button calls BTAlert.show(). Alerts appear bottom-right, auto-dismiss after 5s.',
            style: TextStyle(
              fontFamily: BTechTypography.fontFamily,
              fontSize: 13,
              color: c.text.secondary,
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final cfg in _showConfigs)
                _buildTriggerButton(
                  c,
                  label: cfg.$2,
                  onTap: () {
                    BTAlert.show(
                      context,
                      variant: cfg.$1,
                      label: cfg.$2,
                      description: cfg.$3,
                      linkLabel: cfg.$3 != null ? 'Learn more' : null,
                      actionLabel: 'Action',
                      dismissible: true,
                      onAction: () {
                        debugPrint('[BTAlert.show] action: ${cfg.$1}');
                      },
                      onLink: () {
                        debugPrint('[BTAlert.show] link: ${cfg.$1}');
                      },
                    );
                  },
                ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  Widget _buildResetButton(BTechColorTheme c, {required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
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
    );
  }

  Widget _buildTriggerButton(
    BTechColorTheme c, {
    required String label,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          border: Border.all(color: c.border.primary),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontFamily: BTechTypography.fontFamily,
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: c.text.primary,
          ),
        ),
      ),
    );
  }
}
