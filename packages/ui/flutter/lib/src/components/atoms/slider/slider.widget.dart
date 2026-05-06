// BTSlider — interactive range slider atom (Figma 434:7617).
//
// Three layout types: defaults (horizontal · 1 thumb), range
// (horizontal · 2 thumbs), vertical (1 thumb rotated).
// Three color variants: primary · secondary · destructive.
//
// Example:
// ```dart
// // Default horizontal slider
// BTSlider(value: 50, onValueChanged: (v) => setState(() => _val = v))
//
// // Range slider
// BTSlider.range(
//   startValue: 20, endValue: 80,
//   onStartChanged: (v) => setState(() => _start = v),
//   onEndChanged:   (v) => setState(() => _end   = v),
// )
//
// // Vertical destructive slider
// BTSlider.vertical(
//   variant: BTSliderVariant.destructive,
//   value: 60,
//   onValueChanged: (v) => setState(() => _level = v),
// )
// ```

import 'package:btech_ui/src/components/atoms/slider/slider.types.dart';
import 'package:flutter/material.dart';

// Component-specific palette — hardcoded by design (not in btech_tokens).
const _kPrimaryActive   = Color(0xFF145BC3); // brand.primary blue
const _kSecondaryActive = Color(0xFF64748B); // icon.secondary
const _kDestrActive     = Color(0xFF991515); // icon.error red

class BTSlider extends StatefulWidget {
  /// Horizontal slider with a single thumb.
  const BTSlider({
    this.value,
    this.min = 0,
    this.max = 100,
    this.divisions,
    this.showTooltip = true,
    this.disabled = false,
    this.variant = BTSliderVariant.primary,
    this.onValueChanged,
    super.key,
  })  : type = BTSliderType.defaults,
        startValue = null,
        endValue = null,
        onStartChanged = null,
        onEndChanged = null;

  /// Horizontal slider with two thumbs (start + end).
  const BTSlider.range({
    this.startValue,
    this.endValue,
    this.min = 0,
    this.max = 100,
    this.divisions,
    this.showTooltip = true,
    this.disabled = false,
    this.variant = BTSliderVariant.primary,
    this.onStartChanged,
    this.onEndChanged,
    super.key,
  })  : type = BTSliderType.range,
        value = null,
        onValueChanged = null;

  /// Vertical slider with a single thumb.
  const BTSlider.vertical({
    this.value,
    this.min = 0,
    this.max = 100,
    this.divisions,
    this.showTooltip = true,
    this.disabled = false,
    this.variant = BTSliderVariant.primary,
    this.onValueChanged,
    super.key,
  })  : type = BTSliderType.vertical,
        startValue = null,
        endValue = null,
        onStartChanged = null,
        onEndChanged = null;

  final BTSliderType type;
  final BTSliderVariant variant;

  final double? value;
  final double? startValue;
  final double? endValue;

  final double min;
  final double max;
  final int? divisions;
  final bool showTooltip;
  final bool disabled;

  final ValueChanged<double>? onValueChanged;
  final ValueChanged<double>? onStartChanged;
  final ValueChanged<double>? onEndChanged;

  @override
  State<BTSlider> createState() => _BTSliderState();
}

class _BTSliderState extends State<BTSlider> {
  late double _value;
  late double _start;
  late double _end;

  @override
  void initState() {
    super.initState();
    _value = widget.value ?? (widget.min + widget.max) / 2;
    _start =
        widget.startValue ??
        widget.min + (widget.max - widget.min) * 0.2;
    _end =
        widget.endValue ??
        widget.max - (widget.max - widget.min) * 0.2;
  }

  @override
  void didUpdateWidget(covariant BTSlider old) {
    super.didUpdateWidget(old);
    if (widget.value != null) _value = widget.value!;
    if (widget.startValue != null) _start = widget.startValue!;
    if (widget.endValue != null) _end = widget.endValue!;
  }

  double get _currentValue => widget.value ?? _value;
  double get _currentStart => widget.startValue ?? _start;
  double get _currentEnd => widget.endValue ?? _end;

  // ignore: unused_element
  Color _activeColor() => switch (widget.variant) {
    BTSliderVariant.primary     => _kPrimaryActive,
    BTSliderVariant.secondary   => _kSecondaryActive,
    BTSliderVariant.destructive => _kDestrActive,
  };

  SliderThemeData _theme(BuildContext context, Color active) {
    final inactive = active.withValues(alpha: 0.25);
    return SliderTheme.of(context).copyWith(
      activeTrackColor:   active,
      inactiveTrackColor: inactive,
      thumbColor:         active,
      overlayColor:       active.withValues(alpha: 0.12),
      valueIndicatorColor: const Color(0xFF292F37),
      valueIndicatorTextStyle: const TextStyle(
        color: Colors.white,
        fontSize: 14,
        fontWeight: FontWeight.w500,
      ),
      showValueIndicator: ShowValueIndicator.always,
      trackHeight: 4,
      thumbShape: const RoundSliderThumbShape(
        enabledThumbRadius: 12,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final active   = _activeColor();
    final sliderTh = _theme(context, active);

    if (widget.type == BTSliderType.range) {
      return SliderTheme(
        data: sliderTh.copyWith(
          rangeThumbShape:
              const RoundRangeSliderThumbShape(enabledThumbRadius: 12),
          rangeValueIndicatorShape:
              const PaddleRangeSliderValueIndicatorShape(),
        ),
        child: RangeSlider(
          values: RangeValues(_currentStart, _currentEnd),
          min: widget.min,
          max: widget.max,
          divisions: widget.divisions,
          labels: widget.showTooltip
              ? RangeLabels(
                  _currentStart.toStringAsFixed(0),
                  _currentEnd.toStringAsFixed(0),
                )
              : null,
          onChanged: widget.disabled
              ? null
              : (RangeValues v) {
                  setState(() {
                    _start = v.start;
                    _end   = v.end;
                  });
                  widget.onStartChanged?.call(v.start);
                  widget.onEndChanged?.call(v.end);
                },
        ),
      );
    }

    final slider = SliderTheme(
      data: sliderTh,
      child: Slider(
        value: _currentValue,
        min: widget.min,
        max: widget.max,
        divisions: widget.divisions,
        label: widget.showTooltip
            ? _currentValue.toStringAsFixed(0)
            : null,
        onChanged: widget.disabled
            ? null
            : (double v) {
                setState(() => _value = v);
                widget.onValueChanged?.call(v);
              },
      ),
    );

    if (widget.type == BTSliderType.vertical) {
      return RotatedBox(
        quarterTurns: -1, // 90° counter-clockwise → bottom=0, top=max
        child: slider,
      );
    }

    return slider;
  }
}
