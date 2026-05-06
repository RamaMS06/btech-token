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
/// On mobile: tap the trigger to toggle the balloon. Only one tooltip is
/// visible at a time — opening a new one closes the previous. Tapping
/// anywhere outside the trigger or balloon dismisses it.
///
/// On web / desktop: hover with the mouse to show / hide.
///
/// The arrow always points to the trigger's center regardless of clamping —
/// if the balloon is forced towards the screen edge the arrow shifts
/// automatically (same pixel-accurate approach as [BTTooltipStep]).
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

  /// Initial arrow-caret position hint. Overridden automatically when
  /// the balloon is clamped to the screen edge so the arrow always
  /// points back to the trigger center.
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

  // Each instance gets a unique group ID so TapRegion can detect taps
  // outside THIS tooltip's (trigger + balloon) pair.
  final Object _tapGroupId = Object();

  late final AnimationController _ctrl;
  late final Animation<double> _fade;

  // ── Global singleton — ensures only one tooltip is visible at a time ─────
  static _BTTooltipState? _activeTooltip;

  // Layout constants
  static const double _gap = 6;         // space between trigger edge and balloon
  static const double _balloonW = 280;  // fixed balloon width
  static const double _balloonHEst = 100; // height estimate for top position

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
    if (_activeTooltip == this) _activeTooltip = null;
    _ctrl.dispose();
    super.dispose();
  }

  // ── Overlay management ────────────────────────────────────────────────────

  void _show() {
    if (widget.disabled || _entry != null) return;

    // Dismiss any other open tooltip immediately (no animation).
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
    if (_entry == null) return;
    if (_activeTooltip == this) _activeTooltip = null;
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

        final tOff  = box.localToGlobal(Offset.zero);
        final tSize = box.size;
        final screen = MediaQuery.of(ctx).size;

        final tcx = tOff.dx + tSize.width  / 2; // trigger center X
        final tcy = tOff.dy + tSize.height / 2; // trigger center Y

        // ── Ideal balloon position (arrow at `arrowPosition` relative to
        //    balloon, balloon centred so arrow points at trigger center) ──────
        double top;
        double left;

        switch (widget.position) {
          case BTTooltipPosition.top:
            top  = tOff.dy - _balloonHEst - _arrowH - _gap;
            // Use arrowPosition to shift the balloon horizontally so the
            // declared arrow side aligns with the trigger center.
            left = tcx - _balloonW * _hFraction(widget.arrowPosition);
          case BTTooltipPosition.bottom:
            top  = tOff.dy + tSize.height + _gap;
            left = tcx - _balloonW * _hFraction(widget.arrowPosition);
          case BTTooltipPosition.left:
            top  = tcy - _balloonHEst / 2;
            left = tOff.dx - _balloonW - _arrowH - _gap;
          case BTTooltipPosition.right:
            top  = tcy - _balloonHEst / 2;
            left = tOff.dx + tSize.width + _gap;
        }

        // ── Clamp to screen edges (8 px margin) ───────────────────────────
        final clampedLeft = left.clamp(8.0, screen.width  - _balloonW - 8.0);
        final clampedTop  = top .clamp(8.0, screen.height - _balloonHEst - 8.0);

        // ── Pixel-accurate arrow offset ────────────────────────────────────
        // For top/bottom: horizontal px from balloon left edge to trigger centre.
        // For left/right: vertical   px from balloon top  edge to trigger centre.
        // Clamped so the arrow never escapes the balloon.
        final hArrowPx = (widget.position == BTTooltipPosition.top ||
                widget.position == BTTooltipPosition.bottom)
            ? (tcx - clampedLeft).clamp(8.0, _balloonW - 8.0)
            : null;
        final vArrowPx = (widget.position == BTTooltipPosition.left ||
                widget.position == BTTooltipPosition.right)
            ? (tcy - clampedTop).clamp(8.0, _balloonHEst - 8.0)
            : null;

        return Positioned(
          top:  clampedTop,
          left: clampedLeft,
          child: TapRegion(
            groupId: _tapGroupId,
            child: FadeTransition(
              opacity: _fade,
              child: _BTTooltipBalloon(
                position:     widget.position,
                arrowPosition: widget.arrowPosition,
                hArrowPx:     hArrowPx,
                vArrowPx:     vArrowPx,
                text:         widget.text,
                content:      widget.content,
              ),
            ),
          ),
        );
      },
    );
  }

  // Arrow size (height of the caret SVG — same for both axes).
  static const double _arrowH = 8;

  /// Horizontal fraction: where the arrow CENTER sits within the 280 px balloon.
  ///
  /// Derived from the Align+Padding layout used by [_BTTooltipBalloon]:
  ///   • Padding.horizontal = 16 on a 280 px container.
  ///   • Arrow SVG is 16 px wide  → centre = leftEdge + 8.
  ///   • Align.centerLeft  → leftEdge = 16     → centre =  24   → 24/280
  ///   • Align(-0.5, 0)    → leftEdge = 58     → centre =  82   → 82/280
  ///   • Align.center      → leftEdge = 116    → centre = 140   → 0.5
  ///   • Align(0.5,  0)    → leftEdge = 174    → centre = 198   → 198/280
  ///   • Align.centerRight → leftEdge = 248    → centre = 256   → 256/280
  static double _hFraction(BTTooltipArrowPosition ap) => switch (ap) {
        BTTooltipArrowPosition.left     =>  24 / 280,
        BTTooltipArrowPosition.leftMid  =>  82 / 280,
        BTTooltipArrowPosition.mid      =>       0.5,
        BTTooltipArrowPosition.rightMid => 198 / 280,
        BTTooltipArrowPosition.right    => 256 / 280,
      };

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return TapRegion(
      // When the user taps outside BOTH the trigger AND the open balloon,
      // this callback fires and hides the tooltip.
      groupId: _tapGroupId,
      onTapOutside: (_) => _hide(),
      child: MouseRegion(
        // Desktop / web hover
        onEnter: (_) => _show(),
        onExit:  (_) => _hide(),
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
      ),
    );
  }
}

// ── Balloon ────────────────────────────────────────────────────────────────

class _BTTooltipBalloon extends StatelessWidget {
  const _BTTooltipBalloon({
    required this.position,
    required this.arrowPosition,
    this.hArrowPx,
    this.vArrowPx,
    this.text,
    this.content,
  });

  final BTTooltipPosition position;
  final BTTooltipArrowPosition arrowPosition;

  /// Pixel-accurate horizontal arrow offset (top/bottom positions).
  /// When set, overrides [arrowPosition] for arrow placement.
  final double? hArrowPx;

  /// Pixel-accurate vertical arrow offset (left/right positions).
  final double? vArrowPx;

  final String? text;
  final Widget? content;

  static const double _w = 280;

  @override
  Widget build(BuildContext context) {
    final c  = context.btechColor;
    final r  = context.btechRadius;
    final bg = c.bg.inverse;

    final isVertical = position == BTTooltipPosition.top ||
        position == BTTooltipPosition.bottom;

    final arrow = BTTooltipArrow(direction: position, color: bg);
    final body  = Container(
      width: _w,
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
              fontSize:   14,
              fontWeight: FontWeight.w500,
              height:     16 / 14,
              color:      c.text.inverse,
            ),
          ),
    );

    if (isVertical) {
      final alignedArrow = _buildHArrow(arrow);
      return Material(
        type: MaterialType.transparency,
        child: SizedBox(
          width: _w,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: position == BTTooltipPosition.bottom
                ? [alignedArrow, body]   // bottom: arrow on top
                : [body, alignedArrow],  // top:    arrow at bottom
          ),
        ),
      );
    } else {
      final alignedArrow = _buildVArrow(arrow);
      return Material(
        type: MaterialType.transparency,
        child: IntrinsicHeight(
          child: Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: position == BTTooltipPosition.left
                ? [body, alignedArrow]   // left: arrow on right side
                : [alignedArrow, body],  // right: arrow on left side
          ),
        ),
      );
    }
  }

  /// Horizontal arrow row for top / bottom balloons.
  /// Uses pixel-accurate Stack+Positioned when [hArrowPx] is set;
  /// falls back to Align for static enum placement.
  Widget _buildHArrow(Widget arrow) {
    if (hArrowPx != null) {
      // Arrow SVG is 16 px wide — subtract 8 to get its left edge.
      final left = (hArrowPx! - 8.0).clamp(0.0, _w - 16.0);
      return SizedBox(
        width: _w,
        height: 8,
        child: Stack(
          clipBehavior: Clip.none,
          children: [Positioned(left: left, top: 0, child: arrow)],
        ),
      );
    }
    // Fallback: enum-based Align+Padding.
    return Align(
      alignment: _hAlignment(arrowPosition),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: arrow,
      ),
    );
  }

  /// Vertical arrow column for left / right balloons.
  Widget _buildVArrow(Widget arrow) {
    if (vArrowPx != null) {
      final top = (vArrowPx! - 8.0).clamp(0.0, double.infinity);
      return SizedBox(
        width: 8,
        child: Stack(
          clipBehavior: Clip.none,
          children: [Positioned(top: top, left: 0, child: arrow)],
        ),
      );
    }
    return Align(
      alignment: _vAlignment(arrowPosition),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: arrow,
      ),
    );
  }

  Alignment _hAlignment(BTTooltipArrowPosition ap) => switch (ap) {
        BTTooltipArrowPosition.left     => Alignment.centerLeft,
        BTTooltipArrowPosition.leftMid  => const Alignment(-0.5, 0),
        BTTooltipArrowPosition.mid      => Alignment.center,
        BTTooltipArrowPosition.rightMid => const Alignment(0.5, 0),
        BTTooltipArrowPosition.right    => Alignment.centerRight,
      };

  Alignment _vAlignment(BTTooltipArrowPosition ap) => switch (ap) {
        BTTooltipArrowPosition.left     => Alignment.topCenter,
        BTTooltipArrowPosition.leftMid  => const Alignment(0, -0.5),
        BTTooltipArrowPosition.mid      => Alignment.center,
        BTTooltipArrowPosition.rightMid => const Alignment(0, 0.5),
        BTTooltipArrowPosition.right    => Alignment.bottomCenter,
      };
}
