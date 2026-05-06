// Public types for [BTTabs].
//
// Sliced from Figma node 1:53 · Base/TabItem 434:5262.
// Cross-framework parity: prop names match Vue/React BTTabsProps exactly.

/// Visual style of the tab strip.
///
///   [segmented] — pill-style tray with gray background.
///                 Active tab has filled primary background + white text.
///   [line]      — flat row, no tray background.
///                 Active tab has primary underline border + primary text.
enum BTTabsVariant { segmented, line }

/// Configuration for the [BTTabs] widget.
///
/// All fields mirror the Vue/React [BTTabsProps] for cross-framework parity.
// ignore: avoid_classes_with_only_static_members — intentionally a data class
// (keeping separate from BTTabItem to match web types structure)

/// Data for a single tab item.
class BTTabItem {
  const BTTabItem({
    required this.label,
    this.disabled = false,
  });

  /// Label text displayed in the tab.
  final String label;

  /// When true, the tab is not interactive. Defaults to false.
  final bool disabled;
}
