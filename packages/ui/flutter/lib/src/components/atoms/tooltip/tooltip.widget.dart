// ignore_for_file: lines_longer_than_80_chars

import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/src/components/atoms/tooltip/internal/tooltip.arrow.dart';
import 'package:btech_ui/src/components/atoms/tooltip/internal/tooltip.balloon.dart';
import 'package:btech_ui/src/components/atoms/tooltip/internal/tooltip.layout.dart';
import 'package:btech_ui/src/components/atoms/tooltip/tooltip.types.dart';
import 'package:flutter/material.dart';

/// BTTooltip — hover / tap tooltip wrapping a trigger widget.
///
/// Figma: node 479-2624
/// https://www.figma.com/design/WANr9drWYNYbMPuT2sMeHi/?node-id=479-2624
///
/// Uses two-pass overlay measurement (el_tooltip pattern) — balloon + arrow
/// are independent `Positioned` widgets in a Stack, so the arrow never
/// drifts when the balloon clamps to a screen edge. Auto-falls back to
/// another side when the preferred [position] overflows.
///
/// Mobile: tap to toggle (only one tooltip open at a time, tap-outside
/// dismisses). Desktop / web: hover.
///
/// ```dart
/// BTTooltip(
///   text: 'Klik untuk menyimpan',
///   child: BTButton(label: 'Simpan', onPressed: _save),
/// )
/// ```
class BTTooltip extends StatefulWidget {
  const BTTooltip({
    required this.child,
    this.text,
    this.content,
    this.position = BTTooltipPosition.top,
    this.arrowPosition = BTTooltipArrowPosition.mid,
    this.disabled = false,
    super.key,
  }) : assert(
          text != null || content != null,
          'BTTooltip requires either text or content.',
        );

  /// Widget that acts as the tooltip trigger.
  final Widget child;

  /// Plain-text content. Use [content] for rich widgets.
  final String? text;

  /// Custom widget shown inside the balloon — overrides [text].
  final Widget? content;

  /// Preferred side relative to the trigger. Falls back automatically
  /// when the preferred side overflows the screen.
  final BTTooltipPosition position;

  /// Hint for arrow placement along the balloon's main axis.
  final BTTooltipArrowPosition arrowPosition;

  /// When true the tooltip never shows.
  final bool disabled;

  @override
  State<BTTooltip> createState() => _BTTooltipState();
}

class _BTTooltipState extends State<BTTooltip>
    with SingleTickerProviderStateMixin {
  // Measurement
  Size _balloonSize = const Size(BTTooltipBalloonBody.width, 60);
  final GlobalKey _measureKey = GlobalKey();
  OverlayEntry? _measureEntry;

  // Live overlay
  OverlayEntry? _entry;
  final GlobalKey _triggerKey = GlobalKey();
  final Object _tapGroupId = Object();
  bool _hiding = false;

  // Animation
  late final AnimationController _ctrl;
  late final Animation<double> _fade;
  late final Animation<double> _scale;

  // Singleton — only one tooltip visible at a time.
  static _BTTooltipState? _activeTooltip;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    );
    _fade = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    _scale = Tween<double>(begin: 0.85, end: 1).animate(
      CurvedAnimation(parent: _ctrl, curve: Curves.easeOutBack),
    );
    WidgetsBinding.instance.addPostFrameCallback((_) => _measureBalloon());
  }

  @override
  void didUpdateWidget(BTTooltip oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.text != widget.text || oldWidget.content != widget.content) {
      _measureBalloon();
    }
  }

  @override
  void dispose() {
    _measureEntry?.remove();
    _measureEntry = null;
    _removeOverlay();
    if (_activeTooltip == this) _activeTooltip = null;
    _ctrl.dispose();
    super.dispose();
  }

  // ── Two-pass measurement ────────────────────────────────────────────────
  void _measureBalloon() {
    if (!mounted) return;
    _measureEntry?.remove();
    _measureEntry = OverlayEntry(
      builder: (_) => Positioned(
        left: -10000,
        top: -10000,
        child: Opacity(
          opacity: 0,
          child: BTTooltipBalloonBody(
            key: _measureKey,
            text: widget.text,
            content: widget.content,
          ),
        ),
      ),
    );
    Overlay.of(context, rootOverlay: true).insert(_measureEntry!);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final box = _measureKey.currentContext?.findRenderObject() as RenderBox?;
      if (box != null && mounted) {
        setState(() => _balloonSize = box.size);
      }
      _measureEntry?.remove();
      _measureEntry = null;
    });
  }

  // ── Overlay lifecycle ───────────────────────────────────────────────────
  void _show() {
    if (widget.disabled || _entry != null) return;
    final prev = _activeTooltip;
    if (prev != null && prev != this) {
      prev._ctrl.reset();
      prev._removeOverlay();
    }
    _activeTooltip = this;
    _entry = _buildEntry();
    Overlay.of(context, rootOverlay: true).insert(_entry!);
    _ctrl.forward();
  }

  Future<void> _hide() async {
    if (_entry == null || _hiding) return;
    _hiding = true;
    if (_activeTooltip == this) _activeTooltip = null;
    await _ctrl.reverse();
    _removeOverlay();
    _hiding = false;
  }

  void _removeOverlay() {
    _entry?.remove();
    _entry = null;
  }

  void _toggle() => _entry != null ? _hide() : _show();

  OverlayEntry _buildEntry() {
    return OverlayEntry(
      builder: (ctx) {
        final box =
            _triggerKey.currentContext?.findRenderObject() as RenderBox?;
        if (box == null) return const SizedBox.shrink();

        final manager = BTTooltipPositionManager(
          triggerOffset: box.localToGlobal(Offset.zero),
          triggerSize: box.size,
          balloonSize: _balloonSize,
          screen: MediaQuery.of(ctx).size,
          arrowPosition: widget.arrowPosition,
        );
        final layout = manager.resolve(widget.position);

        final origin = _scaleOrigin(layout.position);
        return FadeTransition(
          opacity: _fade,
          child: TapRegion(
            groupId: _tapGroupId,
            child: Stack(
              children: [
                Positioned(
                  left: layout.arrowLeft,
                  top: layout.arrowTop,
                  child: ScaleTransition(
                    scale: _scale,
                    alignment: origin,
                    child: BTTooltipArrow(
                      direction: layout.position,
                      color: ctx.btechColor.bg.inverse,
                    ),
                  ),
                ),
                Positioned(
                  left: layout.bubbleLeft,
                  top: layout.bubbleTop,
                  child: ScaleTransition(
                    scale: _scale,
                    alignment: origin,
                    child: BTTooltipBalloonBody(
                      text: widget.text,
                      content: widget.content,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  /// Scale-transform origin — tooltip grows toward the trigger.
  static Alignment _scaleOrigin(BTTooltipPosition p) => switch (p) {
        BTTooltipPosition.top => Alignment.bottomCenter,
        BTTooltipPosition.bottom => Alignment.topCenter,
        BTTooltipPosition.left => Alignment.centerRight,
        BTTooltipPosition.right => Alignment.centerLeft,
      };

  @override
  Widget build(BuildContext context) {
    return TapRegion(
      groupId: _tapGroupId,
      onTapOutside: (_) => _hide(),
      child: MouseRegion(
        onEnter: (_) => _show(),
        onExit: (_) => _hide(),
        child: GestureDetector(
          onTap: _toggle,
          onLongPress: _toggle,
          behavior: HitTestBehavior.opaque,
          child: KeyedSubtree(
            key: _triggerKey,
            child: widget.child,
          ),
        ),
      ),
    );
  }
}
