/// BTTabs — tab strip molecule.
///
/// Sliced from Figma node 1:53 · Base/TabItem 434:5262.
/// Two variants: 'segmented' (pill tray) · 'line' (underline).
///
/// Animation: sliding pill / underline indicator.
/// The active tab's background (segmented) or underline (line) slides
/// smoothly to the newly-selected position — no opacity toggling.
///
/// `scrollable`: horizontally scrolls and auto-centers the active tab.
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
/// // Scrollable line with icons
/// BTTabs(
///   variant: BTTabsVariant.line,
///   scrollable: true,
///   tabs: manyTabs,
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
class BTTabs extends StatefulWidget {
  const BTTabs({
    required this.tabs,
    this.variant = BTTabsVariant.segmented,
    this.activeIndex = 0,
    this.scrollable = false,
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

  /// When `true`, the strip is horizontally scrollable and auto-centers
  /// the active tab on each selection.
  final bool scrollable;

  /// Called when the user selects a tab. Receives the new active index.
  final ValueChanged<int>? onActiveIndexChange;

  /// Optional builder for a leading icon in each tab.
  final Widget? Function(int index)? leadingIconBuilder;

  /// Optional builder for a trailing icon in each tab.
  final Widget? Function(int index)? trailingIconBuilder;

  @override
  State<BTTabs> createState() => _BTTabsState();
}

class _BTTabsState extends State<BTTabs> {
  // Keys for measuring each tab button's position/size
  late List<GlobalKey> _tabKeys;

  // Key for the inner layout container (Stack), used as coordinate anchor
  final _stackKey = GlobalKey();

  // Sliding indicator geometry (relative to _stackKey)
  double _indicatorLeft = 0;
  double _indicatorWidth = 0;

  // Suppresses AnimatedPositioned on the very first paint
  bool _isReady = false;

  ScrollController? _scrollController;

  @override
  void initState() {
    super.initState();
    _initKeys();
    if (widget.scrollable) {
      _scrollController = ScrollController();
    }
    // Position indicator after first frame
    WidgetsBinding.instance.addPostFrameCallback((_) => _updateIndicator());
  }

  @override
  void didUpdateWidget(BTTabs old) {
    super.didUpdateWidget(old);
    if (old.tabs.length != widget.tabs.length) {
      _initKeys();
    }
    if (old.activeIndex != widget.activeIndex ||
        old.variant != widget.variant) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _updateIndicator());
    }
  }

  @override
  void dispose() {
    _scrollController?.dispose();
    super.dispose();
  }

  void _initKeys() {
    _tabKeys = List.generate(widget.tabs.length, (_) => GlobalKey());
  }

  void _updateIndicator() {
    if (!mounted) return;

    final stackBox =
        _stackKey.currentContext?.findRenderObject() as RenderBox?;
    if (stackBox == null) return;

    final tabKey = _tabKeys[widget.activeIndex];
    final tabBox = tabKey.currentContext?.findRenderObject() as RenderBox?;
    if (tabBox == null) return;

    // Position of the tab relative to the stack (our coordinate anchor)
    final offset = tabBox.localToGlobal(Offset.zero, ancestor: stackBox);

    setState(() {
      _indicatorLeft = offset.dx;
      _indicatorWidth = tabBox.size.width;
      _isReady = true;
    });

    _scrollToCenter(tabBox, stackBox);
  }

  void _scrollToCenter(RenderBox tabBox, RenderBox stackBox) {
    final sc = _scrollController;
    if (!widget.scrollable || sc == null || !sc.hasClients) return;

    final tabOffset = tabBox.localToGlobal(Offset.zero, ancestor: stackBox);
    final tabCenter = tabOffset.dx + tabBox.size.width / 2;
    final viewportCenter = sc.position.viewportDimension / 2;
    final target = (tabCenter - viewportCenter)
        .clamp(0.0, sc.position.maxScrollExtent);

    sc.animateTo(
      target,
      duration: const Duration(milliseconds: 280),
      curve: Curves.easeInOut,
    );
  }

  void _select(int index) {
    if (widget.tabs[index].disabled) return;
    widget.onActiveIndexChange?.call(index);
  }

  @override
  Widget build(BuildContext context) {
    return switch (widget.variant) {
      BTTabsVariant.segmented => _buildSegmented(context),
      BTTabsVariant.line => _buildLine(context),
    };
  }

  // ── Segmented ─────────────────────────────────────────────────────────────

  Widget _buildSegmented(BuildContext context) {
    final content = Container(
      height: 40,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: context.btechColor.bg.secondary,
        borderRadius: BorderRadius.circular(context.btechRadius.md),
      ),
      child: Stack(
        key: _stackKey,
        clipBehavior: Clip.none,
        children: [
          // Sliding pill indicator (behind tab labels)
          if (_isReady)
            AnimatedPositioned(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeInOut,
              left: _indicatorLeft,
              top: 0,
              width: _indicatorWidth,
              height: 32,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  color: context.btechColor.brand.primary,
                  borderRadius:
                      BorderRadius.circular(context.btechRadius.sm),
                ),
              ),
            ),
          // Tab buttons (on top of indicator via Stack ordering)
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              for (var i = 0; i < widget.tabs.length; i++)
                _buildTabButton(context, i),
            ],
          ),
        ],
      ),
    );

    return widget.scrollable
        ? SingleChildScrollView(
            controller: _scrollController,
            scrollDirection: Axis.horizontal,
            child: content,
          )
        : content;
  }

  // ── Line ──────────────────────────────────────────────────────────────────

  Widget _buildLine(BuildContext context) {
    final row = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < widget.tabs.length; i++)
          _buildTabButton(context, i),
      ],
    );

    final content = Stack(
      key: _stackKey,
      alignment: Alignment.bottomLeft,
      children: [
        row,
        // Sliding underline indicator (2px, at the very bottom)
        if (_isReady)
          AnimatedPositioned(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeInOut,
            left: _indicatorLeft,
            bottom: 0,
            width: _indicatorWidth,
            height: 2,
            child: ColoredBox(color: context.btechColor.brand.primary),
          ),
      ],
    );

    return widget.scrollable
        ? SingleChildScrollView(
            controller: _scrollController,
            scrollDirection: Axis.horizontal,
            child: content,
          )
        : content;
  }

  // ── Shared tab button ─────────────────────────────────────────────────────

  Widget _buildTabButton(BuildContext context, int i) {
    final tab = widget.tabs[i];
    final isActive = i == widget.activeIndex;
    final isSegmented = widget.variant == BTTabsVariant.segmented;
    final activeColor = context.btechColor.brand.primary;
    final inactiveColor = context.btechColor.text.secondary;

    final textColor = switch ((isSegmented, isActive)) {
      (true, true)   => context.btechColor.text.inverse,
      (false, true)  => activeColor,
      _              => inactiveColor,
    };

    return GestureDetector(
      key: _tabKeys[i],
      onTap: tab.disabled ? null : () => _select(i),
      child: Opacity(
        opacity: tab.disabled ? 0.4 : 1.0,
        child: Container(
          height: 32,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: _TabContent(
            label: tab.label,
            textColor: textColor,
            leadingIcon: widget.leadingIconBuilder?.call(i),
            trailingIcon: widget.trailingIconBuilder?.call(i),
          ),
        ),
      ),
    );
  }
}

// ── Private content widget ───────────────────────────────────────────────────

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
        AnimatedDefaultTextStyle(
          duration: const Duration(milliseconds: 220),
          curve: Curves.easeInOut,
          style: TextStyle(
            color: textColor,
            fontSize: 14,
            fontWeight: FontWeight.w500,
            height: 16 / 14,
            letterSpacing: 0,
          ),
          child: Text(label),
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
