import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/src/components/atoms/radio_button/internal/radio_button.constants.dart';
import 'package:flutter/material.dart';

/// BTRadioButton — radio selection atom (Figma 555:3529).
///
/// Use multiple BTRadioButton<T> with the same [groupValue] and [onChanged]
/// to form a radio group — mirrors Flutter's native [Radio] pattern.
///
/// Five derived states:
///   default       → unchecked, enabled
///   active        → checked, enabled
///   disable       → unchecked, disabled
///   disable-active → checked, disabled
///   error         → unchecked, error border (+ error subtext colour)
///
/// Example:
/// ```dart
/// String _selected = 'a';
///
/// BTRadioButton<String>(
///   groupValue: _selected,
///   value: 'a',
///   label: 'Option A',
///   onChanged: (v) => setState(() => _selected = v),
/// )
/// BTRadioButton<String>(
///   groupValue: _selected,
///   value: 'b',
///   label: 'Option B',
///   subtext: 'Helper text',
///   onChanged: (v) => setState(() => _selected = v),
/// )
/// BTRadioButton<String>(
///   groupValue: _selected,
///   value: 'c',
///   label: 'Disabled',
///   disabled: true,
///   onChanged: (v) => setState(() => _selected = v),
/// )
/// ```
class BTRadioButton<T> extends StatelessWidget {
  const BTRadioButton({
    required this.groupValue,
    required this.value,
    required this.onChanged,
    this.label,
    this.subtext,
    this.disabled = false,
    this.error = false,
    super.key,
  });

  /// The group's currently selected value. Active when [groupValue] == [value].
  final T groupValue;

  /// This radio button's unique value in the group.
  final T value;

  /// Called with [value] when the user taps this button (unless [disabled]).
  final ValueChanged<T> onChanged;

  /// Optional label text.
  final String? label;

  /// Optional helper / error text below the label.
  final String? subtext;

  /// Disables tapping.
  final bool disabled;

  /// Shows error border; subtext renders in error colour.
  final bool error;

  bool get _isActive => groupValue == value;

  @override
  Widget build(BuildContext context) {
    final colors = context.btechColor;

    // ── Circle border colour ──────────────────────────────────────────────
    final Color borderColor;
    if (error && !disabled) {
      borderColor = colors.ext.error;
    } else if (disabled && _isActive) {
      borderColor = colors.border.disabled;
    } else if (_isActive) {
      borderColor = colors.brand.primary;
    } else {
      borderColor = colors.border.primary;
    }

    // ── Circle fill colour ────────────────────────────────────────────────
    final circleFill =
        disabled ? colors.bg.secondary : colors.bg.primary;

    // ── Dot colour (shown when active) ────────────────────────────────────
    final dotColor = disabled
        ? colors.text.disabled
        : (error && _isActive)
            ? colors.ext.error
            : colors.brand.primary;

    // ── Text colours ──────────────────────────────────────────────────────
    final labelColor =
        disabled ? colors.text.disabled : colors.text.primary;
    final subtextColor = disabled
        ? colors.text.disabled
        : error
            ? colors.text.error
            : colors.text.secondary;

    return GestureDetector(
      onTap: disabled ? null : () => onChanged(value),
      child: Padding(
        padding: const EdgeInsets.all(kBTRadioPadding),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            // ── Visual circle ─────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.only(top: 1),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                width: kBTRadioCircleSize,
                height: kBTRadioCircleSize,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: circleFill,
                  border: Border.all(
                    color: borderColor,
                    width: kBTRadioBorderWidth,
                  ),
                ),
                child: _isActive
                    ? Center(
                        child: Container(
                          width: kBTRadioDotSize,
                          height: kBTRadioDotSize,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: dotColor,
                          ),
                        ),
                      )
                    : null,
              ),
            ),

            // ── Label + subtext ───────────────────────────────────────────
            if (label != null || subtext != null) ...[
              const SizedBox(width: kBTRadioGap),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
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
                    const SizedBox(height: 4),
                    Text(
                      subtext!,
                      style: TextStyle(
                        fontFamily: BTechTypography.fontFamily,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        height: 16 / 14,
                        color: subtextColor,
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
