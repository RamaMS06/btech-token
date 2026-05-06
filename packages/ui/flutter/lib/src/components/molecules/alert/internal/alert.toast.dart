// ignore_for_file: lines_longer_than_80_chars

import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/src/components/molecules/alert/alert.types.dart';
import 'package:btech_ui/src/components/molecules/alert/alert.widget.dart';
import 'package:flutter/material.dart';

/// Overlay toast used by [BTAlert.show].
///
/// Renders bottom-right, auto-dismisses after [duration].
/// Swipe down to dismiss early — translates + fades as the user drags,
/// snaps back if the gesture is too short.
class BTAlertToast extends StatefulWidget {
  const BTAlertToast({
    required this.variant,
    required this.label,
    required this.onClose,
    this.description,
    this.linkLabel,
    this.actionLabel,
    this.dismissible = true,
    this.duration = const Duration(seconds: 5),
    this.bottomSpacing = 72,
    this.onAction,
    this.onLink,
    super.key,
  });

  final BTAlertVariant variant;
  final String label;
  final String? description;
  final String? linkLabel;
  final String? actionLabel;
  final bool dismissible;
  final Duration duration;

  /// Gap between the bottom of the screen and the alert widget.
  final double bottomSpacing;

  final VoidCallback? onAction;
  final VoidCallback? onLink;
  final VoidCallback onClose;

  @override
  State<BTAlertToast> createState() => _BTAlertToastState();
}

class _BTAlertToastState extends State<BTAlertToast>
    with TickerProviderStateMixin {
  // ── Enter / exit animation ───────────────────────────────────────────────
  late final AnimationController _enterCtrl;
  late final Animation<Offset> _slide;
  late final Animation<double> _fade;

  // ── Swipe-to-dismiss state ───────────────────────────────────────────────
  // Current downward drag offset in pixels (clamped to ≥ 0).
  double _dragOffset = 0;

  // Snap-back controller — interpolates _dragOffset from its start to 0.
  late final AnimationController _snapCtrl;
  double _snapStartOffset = 0;

  // Thresholds for triggering dismiss
  static const double _dismissOffsetThreshold = 60;
  static const double _dismissVelocityThreshold = 300;

  @override
  void initState() {
    super.initState();

    // Enter / exit
    _enterCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 220),
    );
    _slide = Tween<Offset>(
      begin: const Offset(0, 0.3),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _enterCtrl, curve: Curves.easeOut));
    _fade = Tween<double>(begin: 0, end: 1).animate(_enterCtrl);
    _enterCtrl.forward();

    // Snap-back — listener updates _dragOffset each tick
    _snapCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 180),
    );
    _snapCtrl.addListener(_onSnapTick);

    // Auto-dismiss timer
    if (widget.duration.inMilliseconds > 0) {
      Future.delayed(widget.duration, _dismiss);
    }
  }

  void _onSnapTick() {
    if (mounted) {
      setState(() {
        _dragOffset = _snapStartOffset * (1 - _snapCtrl.value);
      });
    }
  }

  // ── Close with exit animation ────────────────────────────────────────────

  bool _closing = false;

  Future<void> _dismiss() async {
    if (!mounted || _closing) return;
    _closing = true;
    _snapCtrl.stop();
    await _enterCtrl.reverse();
    widget.onClose();
  }

  // ── Swipe gesture handlers ───────────────────────────────────────────────

  void _onDragUpdate(DragUpdateDetails details) {
    if (_closing) return;
    _snapCtrl.stop(); // cancel any in-progress snap-back
    final dy = details.delta.dy;
    // Only track downward movement; don't allow dragging above start position
    if (dy > 0 || _dragOffset > 0) {
      setState(() {
        _dragOffset = (_dragOffset + dy).clamp(0, double.infinity);
      });
    }
  }

  void _onDragEnd(DragEndDetails details) {
    if (_closing) return;
    final velocity = details.velocity.pixelsPerSecond.dy;
    if (_dragOffset >= _dismissOffsetThreshold ||
        velocity >= _dismissVelocityThreshold) {
      _dismiss();
    } else {
      // Snap back to original position
      _snapStartOffset = _dragOffset;
      _snapCtrl
        ..reset()
        ..animateTo(1, curve: Curves.easeOut);
    }
  }

  @override
  void dispose() {
    _enterCtrl.dispose();
    _snapCtrl
      ..removeListener(_onSnapTick)
      ..dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final r = context.btechRadius;

    // Drag-driven opacity: fully visible at 0, transparent at 120px drag
    final dragOpacity = (1 - _dragOffset / 120).clamp(0.0, 1.0);

    return Positioned(
      bottom: widget.bottomSpacing,
      right: 24,
      child: FadeTransition(
        opacity: _fade,
        child: SlideTransition(
          position: _slide,
          child: GestureDetector(
            onVerticalDragUpdate: _onDragUpdate,
            onVerticalDragEnd: _onDragEnd,
            child: Transform.translate(
              offset: Offset(0, _dragOffset),
              child: Opacity(
                opacity: dragOpacity,
                child: Material(
                  color: Colors.transparent,
                  borderRadius: BorderRadius.circular(r.sm),
                  elevation: 4,
                  shadowColor: const Color(0x1F000000),
                  child: SizedBox(
                    width: 360,
                    child: BTAlert(
                      variant: widget.variant,
                      label: widget.label,
                      description: widget.description,
                      linkLabel: widget.linkLabel,
                      actionLabel: widget.actionLabel,
                      dismissible: widget.dismissible,
                      onAction: widget.onAction,
                      onLink: widget.onLink,
                      onDismiss: _dismiss,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
