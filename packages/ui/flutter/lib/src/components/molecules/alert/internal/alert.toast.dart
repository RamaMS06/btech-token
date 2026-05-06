// ignore_for_file: lines_longer_than_80_chars

import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/src/components/molecules/alert/alert.types.dart';
import 'package:btech_ui/src/components/molecules/alert/alert.widget.dart';
import 'package:flutter/material.dart';

/// Overlay toast used by [BTAlert.show].
/// Renders in the bottom-right corner, auto-dismisses after [duration].
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
  final VoidCallback? onAction;
  final VoidCallback? onLink;
  final VoidCallback onClose;

  @override
  State<BTAlertToast> createState() => _BTAlertToastState();
}

class _BTAlertToastState extends State<BTAlertToast>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  late final Animation<Offset> _slide;
  late final Animation<double> _fade;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
    _slide = Tween<Offset>(
      begin: const Offset(0.1, 0),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOut));
    _fade = Tween<double>(begin: 0, end: 1).animate(_ctrl);

    _ctrl.forward();

    if (widget.duration.inMilliseconds > 0) {
      Future.delayed(widget.duration, _close);
    }
  }

  Future<void> _close() async {
    if (!mounted) return;
    await _ctrl.reverse();
    widget.onClose();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final r = context.btechRadius;

    return Positioned(
      bottom: 24,
      right: 24,
      child: FadeTransition(
        opacity: _fade,
        child: SlideTransition(
          position: _slide,
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
                onDismiss: _close,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
