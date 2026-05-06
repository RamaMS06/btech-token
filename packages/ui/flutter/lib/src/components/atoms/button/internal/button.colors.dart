// Button color logic — Figma node 114:2645.
// All colors resolved from btech semantic tokens via BuildContext.
// Do NOT hardcode Color(0xFF...) here.

import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/src/components/atoms/button/button.types.dart';
import 'package:flutter/material.dart';

/// Resolves background, foreground and border colors for the given
/// [variant] and interaction [state].
({Color bg, Color fg, Color? border}) buttonColors({
  required BTButtonVariant variant,
  required BTButtonState state,
  required BTechColorTheme colors,
}) {
  return switch ((variant, state)) {
    // ── Primary ──────────────────────────────────────────────────────────────
    (BTButtonVariant.primary, BTButtonState.disabled) => (
        bg: colors.bg.subtlest,
        fg: colors.text.inverse,
        border: null,
      ),
    (BTButtonVariant.primary, BTButtonState.hoverOrPressed) => (
        bg: colors.brand.primaryBold,
        fg: colors.text.inverse,
        border: null,
      ),
    (BTButtonVariant.primary, _) => (
        bg: colors.brand.primary,
        fg: colors.text.inverse,
        border: null,
      ),

    // ── Secondary ────────────────────────────────────────────────────────────
    (BTButtonVariant.secondary, BTButtonState.disabled) => (
        bg: colors.bg.subtle,
        fg: colors.bg.subtlest,
        border: null,
      ),
    (BTButtonVariant.secondary, BTButtonState.hoverOrPressed) => (
        bg: colors.bg.subtler,
        fg: colors.text.primary,
        border: null,
      ),
    (BTButtonVariant.secondary, _) => (
        bg: colors.bg.secondary,
        fg: colors.text.primary,
        border: null,
      ),

    // ── Destructive ──────────────────────────────────────────────────────────
    (BTButtonVariant.destructive, BTButtonState.disabled) => (
        bg: colors.bg.subtlest,
        fg: colors.text.inverse,
        border: null,
      ),
    (BTButtonVariant.destructive, BTButtonState.hoverOrPressed) => (
        bg: colors.ext.errorBold,
        fg: colors.text.inverse,
        border: null,
      ),
    (BTButtonVariant.destructive, _) => (
        bg: colors.ext.error,
        fg: colors.text.inverse,
        border: null,
      ),

    // ── Outline ──────────────────────────────────────────────────────────────
    (BTButtonVariant.outline, BTButtonState.disabled) => (
        bg: Colors.transparent,
        fg: colors.bg.subtlest,
        border: colors.bg.subtlest,
      ),
    (BTButtonVariant.outline, BTButtonState.hoverOrPressed) => (
        bg: colors.bg.subtler,
        fg: colors.text.primary,
        border: colors.border.primary,
      ),
    (BTButtonVariant.outline, _) => (
        bg: Colors.transparent,
        fg: colors.text.primary,
        border: colors.border.primary,
      ),

    // ── Ghost ────────────────────────────────────────────────────────────────
    (BTButtonVariant.ghost, BTButtonState.disabled) => (
        bg: Colors.transparent,
        fg: colors.bg.subtlest,
        border: null,
      ),
    (BTButtonVariant.ghost, BTButtonState.hoverOrPressed) => (
        bg: colors.bg.subtler,
        fg: colors.text.primary,
        border: null,
      ),
    (BTButtonVariant.ghost, _) => (
        bg: Colors.transparent,
        fg: colors.text.primary,
        border: null,
      ),
  };
}

/// Interaction state used for color resolution.
enum BTButtonState { idle, hoverOrPressed, disabled }

extension BTButtonStateExt on BTButtonState {
  static BTButtonState of({
    required bool disabled,
    required bool hovered,
    required bool pressed,
  }) {
    if (disabled) return BTButtonState.disabled;
    if (hovered || pressed) return BTButtonState.hoverOrPressed;
    return BTButtonState.idle;
  }
}
