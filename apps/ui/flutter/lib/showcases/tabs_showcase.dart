// BTTabsShowcase — visual smoke test for BTTabs (molecule).
// Sliced from Figma node 1:53 · Base/TabItem 434:5262.
//
// Demonstrates: segmented + line variants, disabled tabs,
// optional leading/trailing icon builders.
import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/btech_ui.dart';
import 'package:flutter/material.dart';

class BTTabsShowcase extends StatefulWidget {
  const BTTabsShowcase({super.key});

  @override
  State<BTTabsShowcase> createState() => _BTTabsShowcaseState();
}

class _BTTabsShowcaseState extends State<BTTabsShowcase> {
  int _segActive = 0;
  int _lineActive = 0;
  int _iconActive = 0;
  int _disabledActive = 0;

  static const _basicTabs = [
    BTTabItem(label: 'Overview'),
    BTTabItem(label: 'Details'),
    BTTabItem(label: 'History'),
  ];

  static const _iconTabs = [
    BTTabItem(label: 'List'),
    BTTabItem(label: 'Grid'),
    BTTabItem(label: 'Map'),
  ];

  static const _disabledTabs = [
    BTTabItem(label: 'Active'),
    BTTabItem(label: 'Disabled', disabled: true),
    BTTabItem(label: 'Other'),
  ];

  static const _iconData = [Icons.list, Icons.grid_view, Icons.map_outlined];

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle(context, 'BTTabs — Figma 1:53'),
          _subtitle(
            context,
            'Tab strip · segmented (pill tray) + line (underline). '
            'Controlled widget.',
          ),
          const SizedBox(height: 24),

          // Segmented
          _label(context, 'segmented'),
          const SizedBox(height: 8),
          BTTabs(
            variant: BTTabsVariant.segmented,
            tabs: _basicTabs,
            activeIndex: _segActive,
            onActiveIndexChange: (i) => setState(() => _segActive = i),
          ),
          const SizedBox(height: 4),
          _caption(context, 'active: ${_basicTabs[_segActive].label}'),
          const SizedBox(height: 24),

          // Line
          _label(context, 'line'),
          const SizedBox(height: 8),
          BTTabs(
            variant: BTTabsVariant.line,
            tabs: _basicTabs,
            activeIndex: _lineActive,
            onActiveIndexChange: (i) => setState(() => _lineActive = i),
          ),
          const SizedBox(height: 4),
          _caption(context, 'active: ${_basicTabs[_lineActive].label}'),
          const SizedBox(height: 24),

          // Segmented + leading icons
          _label(context, 'segmented + leading icons'),
          const SizedBox(height: 8),
          BTTabs(
            variant: BTTabsVariant.segmented,
            tabs: _iconTabs,
            activeIndex: _iconActive,
            onActiveIndexChange: (i) => setState(() => _iconActive = i),
            leadingIconBuilder: (i) => Icon(_iconData[i], size: 16),
          ),
          const SizedBox(height: 24),

          // Disabled tab
          _label(context, 'disabled tab'),
          const SizedBox(height: 8),
          BTTabs(
            variant: BTTabsVariant.segmented,
            tabs: _disabledTabs,
            activeIndex: _disabledActive,
            onActiveIndexChange: (i) => setState(() => _disabledActive = i),
          ),
          const SizedBox(height: 12),
          BTTabs(
            variant: BTTabsVariant.line,
            tabs: _disabledTabs,
            activeIndex: _disabledActive,
            onActiveIndexChange: (i) => setState(() => _disabledActive = i),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

Widget _sectionTitle(BuildContext context, String text) {
  return Text(
    text,
    style: TextStyle(
      fontSize: 18,
      fontWeight: FontWeight.w600,
      color: context.btechColor.text.primary,
    ),
  );
}

Widget _subtitle(BuildContext context, String text) {
  return Padding(
    padding: const EdgeInsets.only(top: 4),
    child: Text(
      text,
      style: TextStyle(fontSize: 13, color: context.btechColor.text.secondary),
    ),
  );
}

Widget _label(BuildContext context, String text) {
  return Text(
    text,
    style: TextStyle(
      fontSize: 11,
      fontFamily: 'monospace',
      color: context.btechColor.text.secondary,
    ),
  );
}

Widget _caption(BuildContext context, String text) {
  return Text(
    text,
    style: TextStyle(fontSize: 12, color: context.btechColor.text.secondary),
  );
}
