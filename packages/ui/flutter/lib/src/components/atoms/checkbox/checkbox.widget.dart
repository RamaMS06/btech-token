// BTCheckbox — Figma 504:4181
import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/src/components/atoms/checkbox/checkbox.types.dart';
import 'package:btech_ui/src/components/atoms/checkbox/internal/checkbox.painters.dart';
import 'package:flutter/material.dart';

/// A checkbox atom that mirrors the 7 Figma states.
///
/// ```dart
/// // Basic usage (parent manages state)
/// BTCheckbox(
///   checked: _checked,
///   onChanged: (v) => setState(() => _checked = v),
///   label: 'I agree to the terms',
/// )
///
/// // Indeterminate
/// BTCheckbox(
///   checked: false,
///   indeterminate: true,
///   onChanged: _onChanged,
///   label: 'Select all',
/// )
///
/// // Error state with subtext
/// BTCheckbox(
///   checked: false,
///   error: true,
///   label: 'Required',
///   subtext: 'Please accept to continue',
/// )
///
/// // Disabled
/// BTCheckbox(
///   checked: true,
///   disabled: true,
///   label: 'Unavailable option',
/// )
/// ```
class BTCheckbox extends StatefulWidget {
  const BTCheckbox({
    required this.checked,
    this.indeterminate = false,
    this.disabled = false,
    this.error = false,
    this.label,
    this.subtext,
    this.onChanged,
    super.key,
  });

  /// Whether the checkbox is checked.
  final bool checked;

  /// Shows a dash — neither fully checked nor unchecked.
  /// When [indeterminate] is true, the visual state takes precedence over
  /// [checked].
  final bool indeterminate;

  /// Disables all user interaction.
  final bool disabled;

  /// Applies the error border to the box and error colour to [subtext].
  final bool error;

  /// Optional text label shown to the right of the box.
  final String? label;

  /// Optional helper or error text shown below [label].
  final String? subtext;

  /// Called when the user taps the checkbox.
  /// Not called when [disabled] is true.
  final ValueChanged<bool>? onChanged;

  @override
  State<BTCheckbox> createState() => _BTCheckboxState();
}

class _BTCheckboxState extends State<BTCheckbox> {
  bool _hovered = false;

  BTCheckboxState get _state {
    if (widget.disabled) {
      if (widget.indeterminate) return BTCheckboxState.disableIndeterminate;
      if (widget.checked) return BTCheckboxState.disableCheck;
      return BTCheckboxState.disableUncheck;
    }
    if (widget.indeterminate) return BTCheckboxState.indeterminate;
    if (widget.checked) return BTCheckboxState.check;
    if (widget.error) return BTCheckboxState.error;
    return BTCheckboxState.uncheck;
  }

  void _handleTap() {
    if (!widget.disabled) {
      widget.onChanged?.call(!widget.checked);
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.btechColor;
    final state = _state;

    return MouseRegion(
      cursor: widget.disabled
          ? SystemMouseCursors.forbidden
          : SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTap: _handleTap,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _BTCheckboxBox(state: state, hovered: _hovered, colors: colors),
            if (widget.label != null || widget.subtext != null) ...[
              const SizedBox(width: 8),
              _BTCheckboxText(
                label: widget.label,
                subtext: widget.subtext,
                state: state,
                colors: colors,
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Box ──────────────────────────────────────────────────────

class _BTCheckboxBox extends StatelessWidget {
  const _BTCheckboxBox({
    required this.state,
    required this.hovered,
    required this.colors,
  });

  final BTCheckboxState state;
  final bool hovered;
  final BTechColorTheme colors;

  @override
  Widget build(BuildContext context) {
    final (Color bg, Color border, Color? iconColor) = _resolveColors();
    final showCheck = state == BTCheckboxState.check ||
        state == BTCheckboxState.disableCheck;
    final showDash = state == BTCheckboxState.indeterminate ||
        state == BTCheckboxState.disableIndeterminate;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 100),
      width: 16,
      height: 16,
      decoration: BoxDecoration(
        color: bg,
        border: Border.all(color: border, width: 1.5),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Center(
        child: showCheck
            ? CustomPaint(
                size: const Size(10, 8),
                painter: CheckmarkPainter(color: iconColor!),
              )
            : showDash
                ? Container(
                    width: 8,
                    height: 2,
                    decoration: BoxDecoration(
                      color: iconColor,
                      borderRadius: BorderRadius.circular(1),
                    ),
                  )
                : const SizedBox.shrink(),
      ),
    );
  }

  (Color, Color, Color?) _resolveColors() {
    switch (state) {
      case BTCheckboxState.uncheck:
        return (colors.bg.primary, colors.border.primary, null);
      case BTCheckboxState.check:
      case BTCheckboxState.indeterminate:
        return (
          colors.brand.primary,
          colors.brand.primary,
          Colors.white,
        );
      case BTCheckboxState.disableUncheck:
        return (colors.bg.secondary, colors.border.primary, null);
      case BTCheckboxState.disableCheck:
      case BTCheckboxState.disableIndeterminate:
        return (
          colors.bg.secondary,
          colors.border.primary,
          colors.text.disabled,
        );
      case BTCheckboxState.error:
        return (colors.bg.primary, colors.ext.error, null);
    }
  }
}

// ── Text ─────────────────────────────────────────────────────

class _BTCheckboxText extends StatelessWidget {
  const _BTCheckboxText({
    required this.label,
    required this.subtext,
    required this.state,
    required this.colors,
  });

  final String? label;
  final String? subtext;
  final BTCheckboxState state;
  final BTechColorTheme colors;

  bool get _disabled =>
      state == BTCheckboxState.disableUncheck ||
      state == BTCheckboxState.disableCheck ||
      state == BTCheckboxState.disableIndeterminate;

  bool get _error => state == BTCheckboxState.error;

  @override
  Widget build(BuildContext context) {
    final labelColor =
        _disabled ? colors.text.disabled : colors.text.primary;
    final subtextColor = _disabled
        ? colors.text.disabled
        : _error
            ? colors.ext.error
            : colors.text.secondary;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null)
          Text(
            label!,
            style: TextStyle(
              fontFamily: BTechTypography.fontFamily,
              fontSize: 14,
              fontWeight: FontWeight.w500,
              height: 16 / 14,
              color: labelColor,
            ),
          ),
        if (subtext != null) ...[
          const SizedBox(height: 2),
          Text(
            subtext!,
            style: TextStyle(
              fontFamily: BTechTypography.fontFamily,
              fontSize: 12,
              fontWeight: FontWeight.w400,
              height: 16 / 12,
              color: subtextColor,
            ),
          ),
        ],
      ],
    );
  }
}
