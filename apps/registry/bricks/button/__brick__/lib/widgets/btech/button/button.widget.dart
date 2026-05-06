/// BTButton — interactive action atom.
/// Figma source: node 114:2645.
/// Copied by btech mason brick — do not edit the brick template.
/// This file is now owned by your project — customize freely.
///
/// Width is intrinsic — the button never expands to fill its parent.
/// Wrap in [Expanded] or set an explicit width when full-width is needed.
///
/// ## Usage:
/// ```dart
/// BTButton(label: 'Save', onPressed: handleSave)
///
/// BTButton.iconOnly(
///   icon: const Icon(Icons.close, size: 16),
///   variant: BTButtonVariant.ghost,
///   onPressed: handleClose,
/// )
/// ```
library;

import 'package:btech_tokens/btech_tokens.dart';
import 'package:flutter/material.dart';
import 'button.types.dart';
import 'internal/button.colors.dart';
import 'internal/inner_shadow_container.dart';

class BTButton extends StatefulWidget {
  const BTButton({
    required this.onPressed,
    this.label,
    this.variant = BTButtonVariant.primary,
    this.size = BTButtonSize.md,
    this.leftIcon,
    this.rightIcon,
    super.key,
  })  : _iconOnly = false,
        _icon = null;

  const BTButton.iconOnly({
    required Widget icon,
    required this.onPressed,
    this.variant = BTButtonVariant.primary,
    this.size = BTButtonSize.md,
    super.key,
  })  : _iconOnly = true,
        _icon = icon,
        label = null,
        leftIcon = null,
        rightIcon = null;

  final String? label;
  final BTButtonVariant variant;
  final BTButtonSize size;
  final VoidCallback? onPressed;
  final Widget? leftIcon;
  final Widget? rightIcon;
  final bool _iconOnly;
  final Widget? _icon;

  @override
  State<BTButton> createState() => _BTButtonState();
}

class _BTButtonState extends State<BTButton> with SingleTickerProviderStateMixin {
  late final AnimationController _animationController;
  late final Animation<double> _pressAnim;
  bool _isPressed = false;
  final bool _hovered = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 120),
      reverseDuration: const Duration(milliseconds: 180),
      value: 0,
    );
    _pressAnim = CurvedAnimation(
      parent: _animationController,
      curve: Curves.linear,
      reverseCurve: Curves.easeInCubic,
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  bool get _disabled => widget.onPressed == null;

  void _onTapDown(TapDownDetails _) {
    if (!_disabled && !_isPressed) {
      setState(() => _isPressed = true);
      _animationController.forward();
    }
  }

  void _onTapUp(TapUpDetails _) {
    if (!_disabled && _isPressed) {
      setState(() => _isPressed = false);
      _animationController.reverse();
    }
  }

  void _onTapCancel() {
    if (!_disabled && _isPressed) {
      setState(() => _isPressed = false);
      _animationController.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.btechColor;
    final radius = context.btechRadius.sm;
    final isSmall = widget.size == BTButtonSize.sm;
    final isIconOnly = widget._iconOnly;

    final idleState = BTButtonStateExt.of(disabled: _disabled, hovered: _hovered, pressed: false);
    final pressedState = BTButtonStateExt.of(disabled: false, hovered: true, pressed: true);
    final idleCol = buttonColors(variant: widget.variant, state: idleState, colors: colors);
    final pressedCol = buttonColors(variant: widget.variant, state: pressedState, colors: colors);

    final padding = isIconOnly
        ? EdgeInsets.all(isSmall ? 8 : 12)
        : EdgeInsets.symmetric(vertical: isSmall ? 8 : 12, horizontal: isSmall ? 8 : 16);
    final gap = isSmall ? 2.0 : 4.0;

    return MouseRegion(
      cursor: _disabled ? SystemMouseCursors.forbidden : SystemMouseCursors.click,
      child: GestureDetector(
        onTap: _disabled ? null : widget.onPressed,
        onTapDown: _disabled ? null : _onTapDown,
        onTapUp: _disabled ? null : _onTapUp,
        onTapCancel: _disabled ? null : _onTapCancel,
        child: IntrinsicWidth(
          child: AnimatedBuilder(
            animation: _pressAnim,
            builder: (context, _) {
              final t = _pressAnim.value;
              final bg = Color.lerp(idleCol.bg, pressedCol.bg, t) ?? idleCol.bg;
              final fg = Color.lerp(idleCol.fg, pressedCol.fg, t) ?? idleCol.fg;
              final borderColor = Color.lerp(
                idleCol.border ?? Colors.transparent,
                pressedCol.border ?? Colors.transparent,
                t,
              ) ?? Colors.transparent;
              final border = (idleCol.border != null || pressedCol.border != null)
                  ? Border.all(color: borderColor)
                  : null;
              final showShadow = t > 0.01 && !_disabled;

              Widget content;
              if (isIconOnly) {
                content = IconTheme(
                  data: IconThemeData(size: 16, color: fg),
                  child: widget._icon!,
                );
              } else {
                content = Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (widget.leftIcon != null) ...[
                      IconTheme(data: IconThemeData(size: 16, color: fg), child: widget.leftIcon!),
                      SizedBox(width: gap),
                    ],
                    if (widget.label != null)
                      Text(
                        widget.label!,
                        style: TextStyle(
                          color: fg,
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          fontFamily: BTechTypography.fontFamily,
                          height: 16 / 12,
                        ),
                      ),
                    if (widget.rightIcon != null) ...[
                      SizedBox(width: gap),
                      IconTheme(data: IconThemeData(size: 16, color: fg), child: widget.rightIcon!),
                    ],
                  ],
                );
              }

              return BTInnerShadowContainer(
                borderRadius: radius,
                backgroundColor: bg,
                border: border,
                isShadowTopLeft: showShadow,
                isShadowTopRight: showShadow,
                shadowColor: BTechShadow.button.pressed.first.color,
                blur: BTechShadow.button.pressed.first.blurRadius,
                offset: BTechShadow.button.pressed.first.offset,
                alignment: Alignment.center,
                animationDuration: const Duration(milliseconds: 200),
                child: Padding(padding: padding, child: content),
              );
            },
          ),
        ),
      ),
    );
  }
}
