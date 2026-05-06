// ignore_for_file: lines_longer_than_80_chars

import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/src/components/atoms/tooltip/internal/tooltip.arrow.dart';
import 'package:btech_ui/src/components/atoms/tooltip/tooltip.types.dart';
import 'package:flutter/material.dart';

/// BTTooltip — hover / tap tooltip wrapping a trigger widget.
///
/// Figma: node 479-2624
/// https://www.figma.com/design/WANr9drWYNYbMPuT2sMeHi/?node-id=479-2624
///
/// On mobile: tap the trigger to toggle the balloon.
/// On web / desktop: hover with the mouse to show / hide.
///
/// ```dart
/// // Simple text
/// BTTooltip(
///   text: 'Klik untuk menyimpan',
///   child: BTButton(label: 'Simpan', onPressed: _save),
/// )
///
/// // Custom content widget
/// BTTooltip(
///   position: BTTooltipPosition.bottom,
///   content: const Text('Rich content', style: TextStyle(color: Colors.white)),
///   child: const Icon(Icons.info_outline),
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

  /// Plain-text content shown in the balloon. Use [content] for rich widgets.
  final String? text;

  /// Custom widget shown inside the balloon — overrides [text].
  final Widget? content;

  /// Which side the balloon appears on relative to the trigger.
  final BTTooltipPosition position;

  /// Where the arrow caret sits along its axis.
  final BTTooltipArrowPosition arrowPosition;

  /// When true the tooltip never shows.
  final bool disabled;

  @override
  State<BTTooltip> createState() => _BTTooltipState();
}

class _BTTooltipState extends State<BTTooltip>
    with SingleTickerProviderStateMixin {
  OverlayEntry? _entry;
  final _triggerKey = GlobalKey();

  late final AnimationController _ctrl;
  late final Animation<double> _fade;

  static const double _gap = 4;
  static const double _balloonWidth = 280;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 150),
    );
    _fade = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
  }

  @override
  void dispose() {
    _removeOverlay();
    _ctrl.dispose();
    super.dispose();
  }

  // ── Overlay management ────────────────────────────────────────────────────

  void _show() {
    if (widget.disabled || _entry != null) return;
    _entry = _buildEntry();
    Overlay.of(context, rootOverlay: true).insert(_entry!);
    _ctrl.forward();
  }

  Future<void> _hide() async {
    if (_entry == null) return;
    await _ctrl.reverse();
    _removeOverlay();
  }

  void _removeOverlay() {
    _entry?.remove();
    _entry = null;
  }

  void _toggle() {
    if (_entry != null) {
      _hide();
    } else {
      _show();
    }
  }

  OverlayEntry _buildEntry() {
    return OverlayEntry(
      builder: (ctx) {
        final box = _triggerKey.currentContext?.findRenderObject() as RenderBox?;
        if (box == null) return const SizedBox.shrink();

        final triggerOffset = box.localToGlobal(Offset.zero);
        final triggerSize = box.size;
        final screenSize = MediaQuery.of(ctx).size;

        // Arrow fraction along axis
        final af = _arrowFraction(widget.arrowPosition);
        double top = 0;
        double left = 0;

        switch (widget.position) {
          case BTTooltipPosition.top:
            // Estimate balloon height (content dependent); use placeholder 60
            top = triggerOffset.dy - 60 - _gap - 8; // 8 = arrow height
            left = triggerOffset.dx + triggerSize.width / 2 - _balloonWidth * af;
          case BTTooltipPosition.bottom:
            top = triggerOffset.dy + triggerSize.height + _gap;
            left = triggerOffset.dx + triggerSize.width / 2 - _balloonWidth * af;
          case BTTooltipPosition.left:
            top = triggerOffset.dy + triggerSize.height / 2 - 30;
            left = triggerOffset.dx - _balloonWidth - _gap - 8;
          case BTTooltipPosition.right:
            top = triggerOffset.dy + triggerSize.height / 2 - 30;
            left = triggerOffset.dx + triggerSize.width + _gap;
        }

        // Clamp to screen
        left = left.clamp(8, screenSize.width - _balloonWidth - 8);
        top = top.clamp(8, screenSize.height - 80);

        return Positioned(
          top: top,
          left: left,
          child: FadeTransition(
            opacity: _fade,
            child: _BTTooltipBalloon(
              position: widget.position,
              arrowPosition: widget.arrowPosition,
              text: widget.text,
              content: widget.content,
            ),
          ),
        );
      },
    );
  }

  static double _arrowFraction(BTTooltipArrowPosition ap) {
    return switch (ap) {
      BTTooltipArrowPosition.left => 17 / 280,
      BTTooltipArrowPosition.leftMid => 0.25,
      BTTooltipArrowPosition.mid => 0.5,
      BTTooltipArrowPosition.rightMid => 0.75,
      BTTooltipArrowPosition.right => (280 - 17) / 280,
    };
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      // Desktop / web hover
      onEnter: (_) => _show(),
      onExit: (_) => _hide(),
      child: GestureDetector(
        // Mobile tap — also bind long-press because an interactive child
        // (e.g. ElevatedButton) wins the tap gesture in the arena, but
        // long-press is unclaimed so it always reaches us.
        onTap: _toggle,
        onLongPress: _toggle,
        behavior: HitTestBehavior.opaque,
        child: KeyedSubtree(
          key: _triggerKey,
          child: widget.child,
        ),
      ),
    );
  }
}

// ── Balloon ────────────────────────────────────────────────────────────────

class _BTTooltipBalloon extends StatelessWidget {
  const _BTTooltipBalloon({
    required this.position,
    required this.arrowPosition,
    this.text,
    this.content,
  });

  final BTTooltipPosition position;
  final BTTooltipArrowPosition arrowPosition;
  final String? text;
  final Widget? content;

  @override
  Widget build(BuildContext context) {
    final c = context.btechColor;
    final r = context.btechRadius;
    final bg = c.bg.inverse;

    final isVertical = position == BTTooltipPosition.top ||
        position == BTTooltipPosition.bottom;

    final arrow = BTTooltipArrow(direction: position, color: bg);
    final body = Container(
      width: 280,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(r.sm),
      ),
      padding: const EdgeInsets.all(16),
      child: content ??
          Text(
            text ?? '',
            style: TextStyle(
              fontFamily: BTechTypography.fontFamily,
              fontSize: 14,
              fontWeight: FontWeight.w500,
              height: 16 / 14,
              color: c.text.inverse,
            ),
          ),
    );

    if (isVertical) {
      // Arrow alignment along horizontal axis
      final aligned = Align(
        alignment: _horizontalAlignment(arrowPosition),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: arrow,
        ),
      );

      return Material(
        type: MaterialType.transparency,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: position == BTTooltipPosition.bottom
              ? [aligned, body]   // bottom: arrow on top → trigger is below
              : [body, aligned],  // top: body on top → arrow at bottom
        ),
      );
    } else {
      // Arrow alignment along vertical axis
      final aligned = Align(
        alignment: _verticalAlignment(arrowPosition),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: arrow,
        ),
      );

      return Material(
        type: MaterialType.transparency,
        child: IntrinsicHeight(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: position == BTTooltipPosition.left
                ? [body, aligned]   // left: body on left → arrow on right
                : [aligned, body],  // right: arrow on left → body on right
          ),
        ),
      );
    }
  }

  Alignment _horizontalAlignment(BTTooltipArrowPosition ap) {
    return switch (ap) {
      BTTooltipArrowPosition.left => Alignment.centerLeft,
      BTTooltipArrowPosition.leftMid => const Alignment(-0.5, 0),
      BTTooltipArrowPosition.mid => Alignment.center,
      BTTooltipArrowPosition.rightMid => const Alignment(0.5, 0),
      BTTooltipArrowPosition.right => Alignment.centerRight,
    };
  }

  Alignment _verticalAlignment(BTTooltipArrowPosition ap) {
    return switch (ap) {
      BTTooltipArrowPosition.left => Alignment.topCenter,
      BTTooltipArrowPosition.leftMid => const Alignment(0, -0.5),
      BTTooltipArrowPosition.mid => Alignment.center,
      BTTooltipArrowPosition.rightMid => const Alignment(0, 0.5),
      BTTooltipArrowPosition.right => Alignment.bottomCenter,
    };
  }
}
