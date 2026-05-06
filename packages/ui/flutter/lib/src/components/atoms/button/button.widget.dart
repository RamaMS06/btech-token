/// BTButton — interactive action atom.
/// Figma source: node 114:2645.
///
/// Width is intrinsic — the button never expands to fill its parent.
/// Wrap in [Expanded] or set an explicit width when full-width is needed.
///
/// Hover and pressed states are animated via [AnimationController].
/// Pass [onPressed] as `null` to disable.
///
/// ## Usage:
/// ```dart
/// // Primary (default)
/// BTButton(label: 'Save', onPressed: handleSave)
///
/// // With left icon
/// BTButton(
///   label: 'Upload',
///   variant: BTButtonVariant.secondary,
///   leftIcon: const Icon(Icons.upload, size: 16),
///   onPressed: handleUpload,
/// )
///
/// // Icon only
/// BTButton.iconOnly(
///   icon: const Icon(Icons.close, size: 16),
///   variant: BTButtonVariant.ghost,
///   onPressed: handleClose,
/// )
///
/// // Disabled (onPressed = null)
/// BTButton(label: 'Submit', onPressed: null)
/// ```
library;

import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/src/components/atoms/button/button.types.dart';
import 'package:btech_ui/src/components/atoms/button/internal/button.colors.dart';
import 'package:btech_ui/src/utils/inner_shadow_container.dart';
import 'package:flutter/material.dart';

/// Action button atom. See file header for usage examples.
class BTButton extends StatefulWidget {
  /// Standard button with an optional text [label] and optional icons.
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

  /// Square button that shows a single [icon] — no label.
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

  /// Text shown inside the button (ignored in icon-only mode).
  final String? label;

  /// Visual style.
  final BTButtonVariant variant;

  /// Padding scale. [BTButtonSize.md] = 12×16 px, [BTButtonSize.sm] = 8 px.
  final BTButtonSize size;

  /// Callback invoked on tap. `null` disables the button.
  final VoidCallback? onPressed;

  /// Widget rendered to the left of [label] (16×16 recommended).
  final Widget? leftIcon;

  /// Widget rendered to the right of [label] (16×16 recommended).
  final Widget? rightIcon;

  final bool _iconOnly;
  final Widget? _icon;

  @override
  State<BTButton> createState() => _BTButtonState();
}

class _BTButtonState extends State<BTButton>
    with SingleTickerProviderStateMixin {
  // ── Animation ──────────────────────────────────────────────────────────────
  // 120 ms forward (easeOut) / 200 ms reverse (easeIn) mirrors buma-ui timing.

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

  /// Handles when user starts pressing the button
  void _onTapDown(TapDownDetails details) {
    if (widget.onPressed != null && !_isPressed) {
      setState(() {
        _isPressed = true;
      });
      _animationController.forward();
    }
  }

  /// Handles when user releases the button (successful tap)
  void _onTapUp(TapUpDetails details) {
    if (widget.onPressed != null && _isPressed) {
      setState(() {
        _isPressed = false;
      });
      _animationController.reverse();
    }
  }

  /// Handles when the tap gesture is canceled
  void _onTapCancel() {
    if (widget.onPressed != null && _isPressed) {
      setState(() {
        _isPressed = false;
      });
      _animationController.reverse();
    }
  }

  /// Handles the actual tap callback
  void _onTap() {
    if (widget.onPressed != null) {
      widget.onPressed?.call();
    }
  }



  @override
  Widget build(BuildContext context) {
    final colors = context.btechColor;
    final radius = context.btechRadius.sm;
    final isSmall = widget.size == BTButtonSize.sm;
    final isIconOnly = widget._iconOnly;

    // Resolve the two colour anchors — idle (or hover) and fully pressed.
    // AnimatedBuilder lerps between them on every frame.
    final idleState = BTButtonStateExt.of(
      disabled: _disabled,
      hovered: _hovered,
      pressed: false,
    );
    final pressedState = BTButtonStateExt.of(
      disabled: false,
      hovered: true,
      pressed: true,
    );
    final idleCol = buttonColors(
      variant: widget.variant,
      state: idleState,
      colors: colors,
    );
    final pressedCol = buttonColors(
      variant: widget.variant,
      state: pressedState,
      colors: colors,
    );

    final padding = isIconOnly
        ? EdgeInsets.all(isSmall ? 8 : 12)
        : EdgeInsets.symmetric(
            vertical: isSmall ? 8 : 12,
            horizontal: isSmall ? 8 : 16,
          );
    final gap = isSmall ? 2.0 : 4.0;

    return MouseRegion(
      cursor:
          _disabled ? SystemMouseCursors.forbidden : SystemMouseCursors.click,
      child: GestureDetector(
        onTap: _disabled ? null : _onTap,
        onTapDown: _disabled ? null : _onTapDown,
        onTapUp: _disabled ? null : _onTapUp,
        onTapCancel: _disabled ? null : _onTapCancel,
        // IntrinsicWidth: button only as wide as its content.
        // Consumers wrap in Expanded/SizedBox when full-width is needed.
        child: IntrinsicWidth(
          child: AnimatedBuilder(
            animation: _pressAnim,
            builder: (context, _) {
              final t = _pressAnim.value;

              // Smoothly lerp background, foreground and border colours.
              final bg = Color.lerp(idleCol.bg, pressedCol.bg, t) ?? idleCol.bg;
              final fg = Color.lerp(idleCol.fg, pressedCol.fg, t) ?? idleCol.fg;

              final idleBorder = idleCol.border ?? Colors.transparent;
              final pressBorder = pressedCol.border ?? Colors.transparent;
              final borderColor =
                  Color.lerp(idleBorder, pressBorder, t) ?? idleBorder;
              final border =
                  (idleCol.border != null || pressedCol.border != null)
                      ? Border.all(color: borderColor)
                      : null;

              // Shadow fades from transparent → rgba(0,0,0,0.25).
              final showShadow = t > 0.01 && !_disabled;

              // Build content with current foreground colour.
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
                      IconTheme(
                        data: IconThemeData(size: 16, color: fg),
                        child: widget.leftIcon!,
                      ),
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
                          letterSpacing: 0,
                        ),
                      ),
                    if (widget.rightIcon != null) ...[
                      SizedBox(width: gap),
                      IconTheme(
                        data: IconThemeData(size: 16, color: fg),
                        child: widget.rightIcon!,
                      ),
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
                animationCurve: Curves.linear,
                animationDuration: const Duration(milliseconds: 200),
                child: Padding(
                  padding: padding,
                  child: content,
                ),
              );
            },
          ),
        ),
      ),
    );
  }
}
