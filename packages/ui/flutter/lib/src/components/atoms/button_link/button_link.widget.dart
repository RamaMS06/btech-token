// BTButtonLink — inline hyperlink-style action atom.
// Figma source: node 480:3197.
//
// Renders a text label (with optional leading/trailing icons) that
// behaves like a hyperlink. Hover shows underline + bold weight.
// Press dims to a neutral colour to signal activation.
//
// ```dart
// BTButtonLink(
//   label: 'View details',
//   onPressed: () => Navigator.pushNamed(context, '/details'),
// )
//
// BTButtonLink.secondary(
//   label: 'Cancel',
//   leftIcon: Icons.close,
//   onPressed: handleCancel,
// )
//
// BTButtonLink.invert(
//   label: 'Learn more',
//   onPressed: openUrl,
// )
// ```

import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/src/components/atoms/button_link/button_link.types.dart';
import 'package:flutter/material.dart';

/// An inline hyperlink-style action widget.
///
/// All states (hover, pressed, disabled) are reflected in the foreground
/// colour and text decoration. No background or border is rendered.
///
/// Pass [onPressed] as `null` to disable — the label dims to
/// `text.disabled` and pointer events are ignored.
class BTButtonLink extends StatefulWidget {
  /// Primary link — uses [BTButtonLinkVariant.primary].
  const BTButtonLink({
    required this.label,
    required this.onPressed,
    this.leftIcon,
    this.rightIcon,
    super.key,
  }) : variant = BTButtonLinkVariant.primary;

  /// Secondary link — subdued grey by default.
  const BTButtonLink.secondary({
    required this.label,
    required this.onPressed,
    this.leftIcon,
    this.rightIcon,
    super.key,
  }) : variant = BTButtonLinkVariant.secondary;

  /// Tertiary link — standard text colour by default.
  const BTButtonLink.tertiary({
    required this.label,
    required this.onPressed,
    this.leftIcon,
    this.rightIcon,
    super.key,
  }) : variant = BTButtonLinkVariant.tertiary;

  /// Invert link — for dark or coloured surfaces.
  const BTButtonLink.invert({
    required this.label,
    required this.onPressed,
    this.leftIcon,
    this.rightIcon,
    super.key,
  }) : variant = BTButtonLinkVariant.invert;

  /// Custom link — amber brand colour.
  const BTButtonLink.custom({
    required this.label,
    required this.onPressed,
    this.leftIcon,
    this.rightIcon,
    super.key,
  }) : variant = BTButtonLinkVariant.custom;

  /// Text shown in the link.
  final String label;

  /// Callback invoked on tap. `null` disables the button.
  final VoidCallback? onPressed;

  /// Widget rendered to the left of [label] (16×16 recommended).
  final Widget? leftIcon;

  /// Widget rendered to the right of [label] (16×16 recommended).
  final Widget? rightIcon;

  /// Visual style.
  final BTButtonLinkVariant variant;

  @override
  State<BTButtonLink> createState() => _BTButtonLinkState();
}

class _BTButtonLinkState extends State<BTButtonLink> {
  bool _hovered = false;
  bool _pressed = false;

  bool get _disabled => widget.onPressed == null;

  void _onEnter(_) {
    if (!_disabled) setState(() => _hovered = true);
  }

  void _onExit(_) => setState(() => _hovered = false);

  void _onTapDown(_) {
    if (!_disabled) setState(() => _pressed = true);
  }

  void _onTapUp(_) => setState(() => _pressed = false);
  void _onTapCancel() => setState(() => _pressed = false);

  /// Foreground colour for the current interaction state.
  ///
  /// Priority: disabled > pressed > hover > default.
  Color _resolveColor(BTechColorTheme colors) {
    if (_disabled) return colors.text.disabled;

    if (_pressed) {
      return switch (widget.variant) {
        BTButtonLinkVariant.primary => colors.text.secondary,
        BTButtonLinkVariant.secondary => colors.text.primary,
        BTButtonLinkVariant.tertiary => colors.text.secondary,
        BTButtonLinkVariant.invert => colors.text.tertiary,
        BTButtonLinkVariant.custom => colors.text.secondary,
      };
    }

    if (_hovered) {
      return switch (widget.variant) {
        BTButtonLinkVariant.primary => colors.brand.primaryBold,
        BTButtonLinkVariant.secondary => colors.text.secondary,
        BTButtonLinkVariant.tertiary => colors.text.primary,
        BTButtonLinkVariant.invert => colors.text.inverse,
        BTButtonLinkVariant.custom => colors.brand.secondaryBold,
      };
    }

    return switch (widget.variant) {
      BTButtonLinkVariant.primary => colors.brand.primary,
      BTButtonLinkVariant.secondary => colors.text.secondary,
      BTButtonLinkVariant.tertiary => colors.text.primary,
      BTButtonLinkVariant.invert => colors.text.inverse,
      BTButtonLinkVariant.custom => colors.brand.secondary,
    };
  }

  /// Whether the label should be underlined (hover state, non-disabled).
  bool get _underline => _hovered && !_disabled && !_pressed;

  /// Font weight — bold on hover, medium otherwise.
  FontWeight get _fontWeight =>
      _underline ? FontWeight.w700 : FontWeight.w500;

  @override
  Widget build(BuildContext context) {
    final colors = context.btechColor;
    final color = _resolveColor(colors);

    return MouseRegion(
      cursor: _disabled
          ? SystemMouseCursors.forbidden
          : SystemMouseCursors.click,
      onEnter: _onEnter,
      onExit: _onExit,
      child: GestureDetector(
        onTap: widget.onPressed,
        onTapDown: _disabled ? null : _onTapDown,
        onTapUp: _disabled ? null : _onTapUp,
        onTapCancel: _disabled ? null : _onTapCancel,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (widget.leftIcon != null) ...[
              IconTheme(
                data: IconThemeData(size: 16, color: color),
                child: widget.leftIcon!,
              ),
              const SizedBox(width: 4),
            ],
            Text(
              widget.label,
              style: TextStyle(
                color: color,
                fontSize: 14,
                fontWeight: _fontWeight,
                fontFamily: BTechTypography.fontFamily,
                height: 16 / 14,
                letterSpacing: 0,
                decoration: _underline
                    ? TextDecoration.underline
                    : TextDecoration.none,
                decorationColor: color,
              ),
            ),
            if (widget.rightIcon != null) ...[
              const SizedBox(width: 4),
              IconTheme(
                data: IconThemeData(size: 16, color: color),
                child: widget.rightIcon!,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
