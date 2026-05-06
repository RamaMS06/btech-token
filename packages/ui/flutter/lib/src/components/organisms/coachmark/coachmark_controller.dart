// ignore_for_file: lines_longer_than_80_chars

import 'package:btech_ui/src/components/molecules/tooltip_step/tooltip_step.types.dart';
import 'package:btech_ui/src/components/molecules/tooltip_step/tooltip_step.widget.dart';
import 'package:btech_ui/src/components/organisms/coachmark/coachmark_step.dart';
import 'package:btech_ui/src/components/organisms/coachmark/internal/spotlight_painter.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';

/// Manages a multi-step coachmark tour using Flutter's [Overlay].
///
/// Provide a list of [BTCoachmarkStep]s. Call [show] to start the tour;
/// [dismiss] to end it early; always call [dispose] when the host widget
/// is removed.
///
/// ```dart
/// final _tour = BTCoachmarkController(
///   steps: [
///     BTCoachmarkStep(
///       targetKey: _myKey,
///       description: 'Tap here to continue.',
///       stepLabel: 'Step 1 of 3',
///       position: BTTooltipPosition.bottom,
///     ),
///   ],
///   dismissable: true,
///   onFinish: () => print('done'),
/// );
///
/// // In dispose():
/// _tour.dispose();
///
/// // Show starting at step 0:
/// _tour.show(context);
///
/// // Or jump to a specific step (e.g. when user clicks button i):
/// _tour.show(context, startAt: i);
/// ```
class BTCoachmarkController {
  BTCoachmarkController({
    required this.steps,
    this.dismissable = true,
    this.stepVariant = BTTooltipStepVariant.button,
    this.prevLabel = 'Prev',
    this.nextLabel = 'Next',
    this.onFinish,
  }) {
    _animCtrl = AnimationController(
      vsync: _SimpleTickerProvider(),
      duration: const Duration(milliseconds: 200),
    );
  }

  final List<BTCoachmarkStep> steps;
  final bool dismissable;
  final BTTooltipStepVariant stepVariant;
  final String prevLabel;
  final String nextLabel;
  final VoidCallback? onFinish;

  late final AnimationController _animCtrl;
  OverlayEntry? _backdropEntry;
  OverlayEntry? _stepEntry;
  int _activeIdx = -1;
  bool _navigating = false;

  static const double _balloonW = 320;
  static const double _balloonH = 160;
  static const double _gap = 2;
  static const double _arrowSz = 8;
  static const double _spotlightPad = 4;

  // ── Public API ────────────────────────────────────────────────────────────

  /// Show the coachmark tour, starting at [startAt] (default 0).
  void show(BuildContext context, {int startAt = 0}) {
    assert(
      startAt >= 0 && startAt < steps.length,
      'startAt must be a valid step index.',
    );
    _removeEntries();
    _animCtrl.reset();
    _insertEntries(context, startAt);
    _animCtrl.forward();
  }

  /// Dismiss the active coachmark (if any) with fade-out.
  void dismiss() => _close();

  /// Currently visible step index, or -1 if no tour is active.
  int get activeIndex => _activeIdx;

  void dispose() {
    _removeEntries();
    _animCtrl.dispose();
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  void _removeEntries() {
    _stepEntry?.remove();
    _backdropEntry?.remove();
    _stepEntry = null;
    _backdropEntry = null;
  }

  void _insertEntries(BuildContext context, int idx) {
    if (idx < 0 || idx >= steps.length) return;
    _activeIdx = idx;

    final step = steps[idx];
    final box = step.targetKey.currentContext?.findRenderObject() as RenderBox?;
    if (box == null) return;

    final triggerOffset = box.localToGlobal(Offset.zero);
    final triggerSize = box.size;
    final screenSize = MediaQuery.of(context).size;

    final tcx = triggerOffset.dx + triggerSize.width / 2;
    final tcy = triggerOffset.dy + triggerSize.height / 2;

    final position = step.position ??
        _autoPosition(triggerOffset, triggerSize, screenSize);

    double top;
    double left;
    switch (position) {
      case BTTooltipPosition.top:
        top = triggerOffset.dy - _balloonH - _arrowSz - _gap;
        left = tcx - _balloonW / 2;
      case BTTooltipPosition.bottom:
        top = triggerOffset.dy + triggerSize.height + _gap;
        left = tcx - _balloonW / 2;
      case BTTooltipPosition.left:
        top = tcy - _balloonH / 2;
        left = triggerOffset.dx - _balloonW - _arrowSz - _gap;
      case BTTooltipPosition.right:
        top = tcy - _balloonH / 2;
        left = triggerOffset.dx + triggerSize.width + _gap;
    }

    left = left.clamp(8.0, screenSize.width - _balloonW - 8.0);
    top = top.clamp(8.0, screenSize.height - _balloonH - 8.0);

    final arrowOffset =
        (position == BTTooltipPosition.left || position == BTTooltipPosition.right)
            ? tcy - top
            : tcx - left;

    final spotlight = Rect.fromLTWH(
      triggerOffset.dx - _spotlightPad,
      triggerOffset.dy - _spotlightPad,
      triggerSize.width + _spotlightPad * 2,
      triggerSize.height + _spotlightPad * 2,
    );

    final curvedAnim = CurvedAnimation(
      parent: _animCtrl,
      curve: Curves.easeInOut,
    );

    _backdropEntry = OverlayEntry(
      builder: (_) => Positioned.fill(
        child: FadeTransition(
          opacity: _animCtrl,
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: dismissable ? _close : null,
            child: CustomPaint(
              painter: BTSpotlightPainter(
                spotlight: spotlight,
                color: Colors.black.withValues(alpha: 0.55),
              ),
              child: const SizedBox.expand(),
            ),
          ),
        ),
      ),
    );

    final prevLabelFinal = step.prevLabel ?? prevLabel;
    final nextLabelFinal = step.nextLabel ?? nextLabel;
    final variantFinal = step.stepVariant;

    _stepEntry = OverlayEntry(
      builder: (_) => Positioned(
        top: top,
        left: left,
        child: FadeTransition(
          opacity: curvedAnim,
          child: ScaleTransition(
            scale: Tween<double>(begin: 0.92, end: 1).animate(curvedAnim),
            child: Material(
              color: Colors.transparent,
              child: BTTooltipStep(
                label: step.label,
                description: step.description,
                stepLabel: step.stepLabel,
                stepVariant: variantFinal,
                hasClose: true,
                prevLabel: prevLabelFinal,
                nextLabel: nextLabelFinal,
                position: position,
                arrowOffset: arrowOffset,
                onPrev: idx > 0 ? () => _navigate(context, idx - 1) : _close,
                onNext: idx < steps.length - 1
                    ? () => _navigate(context, idx + 1)
                    : _finish,
                onClose: _close,
              ),
            ),
          ),
        ),
      ),
    );

    Overlay.of(context, rootOverlay: true)
      ..insert(_backdropEntry!)
      ..insert(_stepEntry!);
  }

  BTTooltipPosition _autoPosition(Offset offset, Size size, Size screen) {
    final cy = offset.dy + size.height / 2;
    return cy > screen.height * 0.6
        ? BTTooltipPosition.top
        : BTTooltipPosition.bottom;
  }

  void _navigate(BuildContext context, int idx) {
    if (_navigating) return;
    _navigating = true;
    _animCtrl.reverse().then((_) {
      _removeEntries();
      _animCtrl.reset();
      _insertEntries(context, idx);
      _animCtrl.forward().then((_) {
        _navigating = false;
      });
    });
  }

  void _close() {
    if (_navigating) return;
    _animCtrl.reverse().then((_) {
      _removeEntries();
      _activeIdx = -1;
    });
  }

  void _finish() {
    _close();
    onFinish?.call();
  }
}

// ── Internal TickerProvider that doesn't require a State ─────────────────────

class _SimpleTickerProvider implements TickerProvider {
  @override
  Ticker createTicker(TickerCallback onTick) => Ticker(onTick);
}
