/// BTTabs — tab strip molecule.
///
/// Sliced from Figma node 1:53 · Base/TabItem 434:5262.
/// Two variants: 'segmented' (pill tray) · 'line' (underline).
///
/// Cross-framework parity with React + Vue: same prop names, same
/// variant precedence, same tab item data class.
///
/// ## Usage:
/// ```dart
/// // Segmented (controlled)
/// BTTabs(
///   variant: BTTabsVariant.segmented,
///   tabs: const [
///     BTTabItem(label: 'Overview'),
///     BTTabItem(label: 'Details'),
///     BTTabItem(label: 'History'),
///   ],
///   activeIndex: _activeIndex,
///   onActiveIndexChange: (i) => setState(() => _activeIndex = i),
/// );
///
/// // Line variant with leading icons
/// BTTabs(
///   variant: BTTabsVariant.line,
///   tabs: const [BTTabItem(label: 'List'), BTTabItem(label: 'Grid')],
///   activeIndex: _activeIndex,
///   onActiveIndexChange: (i) => setState(() => _activeIndex = i),
///   leadingIconBuilder: (i) =>
///       Icon(i == 0 ? Icons.list : Icons.grid_view, size: 16),
/// );
/// ```
library;

import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/src/components/molecules/tabs/tabs.types.dart';
import 'package:flutter/material.dart';

/// BTTabs widget — see file header for usage.
class BTTabs extends StatelessWidget {
  const BTTabs({
    required this.tabs,
    this.variant = BTTabsVariant.segmented,
    this.activeIndex = 0,
    this.onActiveIndexChange,
    this.leadingIconBuilder,
    this.trailingIconBuilder,
    super.key,
  });

  /// Visual style — [BTTabsVariant.segmented] or [BTTabsVariant.line].
  final BTTabsVariant variant;

  /// Ordered list of tab descriptors.
  final List<BTTabItem> tabs;

  /// Zero-based index of the currently active tab.
  final int activeIndex;

  /// Called when the user selects a tab. Receives the new active index.
  final ValueChanged<int>? onActiveIndexChange;

  /// Optional builder for a leading icon in each tab.
  /// Receives the tab index and returns a widget (or null).
  final Widget? Function(int index)? leadingIconBuilder;

  /// Optional builder for a trailing icon in each tab.
  /// Receives the tab index and returns a widget (or null).
  final Widget? Function(int index)? trailingIconBuilder;

  void _select(int index, bool disabled) {
    if (disabled) return;
    onActiveIndexChange?.call(index);
  }

  @override
  Widget build(BuildContext context) {
    return switch (variant) {
      BTTabsVariant.segmented => _buildSegmented(context),
      BTTabsVariant.line => _buildLine(context),
    };
  }

  // ── Segmented ────────────────────────────────────────────────────────────

  Widget _buildSegmented(BuildContext context) {
    return Container(
      height: 40,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: context.btechColor.bg.secondary,
        borderRadius: BorderRadius.circular(context.btechRadius.md),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          for (var i = 0; i < tabs.length; i++)
            _SegmentedTab(
              tab: tabs[i],
              isActive: i == activeIndex,
              radius: context.btechRadius.sm,
              activeColor: context.btechColor.brand.primary,
              inactiveTextColor: context.btechColor.text.secondary,
              activeTextColor: context.btechColor.text.inverse,
              leadingIcon: leadingIconBuilder?.call(i),
              trailingIcon: trailingIconBuilder?.call(i),
              onTap: () => _select(i, tabs[i].disabled),
            ),
        ],
      ),
    );
  }

  // ── Line ─────────────────────────────────────────────────────────────────

  Widget _buildLine(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < tabs.length; i++)
          _LineTab(
            tab: tabs[i],
            isActive: i == activeIndex,
            activeColor: context.btechColor.brand.primary,
            inactiveTextColor: context.btechColor.text.secondary,
            leadingIcon: leadingIconBuilder?.call(i),
            trailingIcon: trailingIconBuilder?.call(i),
            onTap: () => _select(i, tabs[i].disabled),
          ),
      ],
    );
  }
}

// ── Internal widgets ─────────────────────────────────────────────────────────

class _SegmentedTab extends StatelessWidget {
  const _SegmentedTab({
    required this.tab,
    required this.isActive,
    required this.radius,
    required this.activeColor,
    required this.inactiveTextColor,
    required this.activeTextColor,
    required this.onTap,
    this.leadingIcon,
    this.trailingIcon,
  });

  final BTTabItem tab;
  final bool isActive;
  final double radius;
  final Color activeColor;
  final Color inactiveTextColor;
  final Color activeTextColor;
  final VoidCallback onTap;
  final Widget? leadingIcon;
  final Widget? trailingIcon;

  @override
  Widget build(BuildContext context) {
    final textColor = isActive ? activeTextColor : inactiveTextColor;
    return GestureDetector(
      onTap: tab.disabled ? null : onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        height: 32,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? activeColor : Colors.transparent,
          borderRadius: BorderRadius.circular(radius),
        ),
        child: _TabContent(
          label: tab.label,
          textColor: textColor,
          leadingIcon: leadingIcon,
          trailingIcon: trailingIcon,
        ),
      ),
    );
  }
}

class _LineTab extends StatelessWidget {
  const _LineTab({
    required this.tab,
    required this.isActive,
    required this.activeColor,
    required this.inactiveTextColor,
    required this.onTap,
    this.leadingIcon,
    this.trailingIcon,
  });

  final BTTabItem tab;
  final bool isActive;
  final Color activeColor;
  final Color inactiveTextColor;
  final VoidCallback onTap;
  final Widget? leadingIcon;
  final Widget? trailingIcon;

  @override
  Widget build(BuildContext context) {
    final textColor = isActive ? activeColor : inactiveTextColor;
    return GestureDetector(
      onTap: tab.disabled ? null : onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        height: 32,
        padding: const EdgeInsets.fromLTRB(12, 8, 12, 6),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: isActive ? activeColor : Colors.transparent,
              width: 2,
            ),
          ),
        ),
        child: _TabContent(
          label: tab.label,
          textColor: textColor,
          leadingIcon: leadingIcon,
          trailingIcon: trailingIcon,
        ),
      ),
    );
  }
}

class _TabContent extends StatelessWidget {
  const _TabContent({
    required this.label,
    required this.textColor,
    this.leadingIcon,
    this.trailingIcon,
  });

  final String label;
  final Color textColor;
  final Widget? leadingIcon;
  final Widget? trailingIcon;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (leadingIcon != null) ...[
          SizedBox(
            width: 16,
            height: 16,
            child: IconTheme(
              data: IconThemeData(color: textColor, size: 16),
              child: leadingIcon!,
            ),
          ),
          const SizedBox(width: 4),
        ],
        Text(
          label,
          style: TextStyle(
            color: textColor,
            fontSize: 14,
            fontWeight: FontWeight.w500,
            height: 16 / 14,
            letterSpacing: 0,
          ),
        ),
        if (trailingIcon != null) ...[
          const SizedBox(width: 4),
          SizedBox(
            width: 16,
            height: 16,
            child: IconTheme(
              data: IconThemeData(color: textColor, size: 16),
              child: trailingIcon!,
            ),
          ),
        ],
      ],
    );
  }
}
