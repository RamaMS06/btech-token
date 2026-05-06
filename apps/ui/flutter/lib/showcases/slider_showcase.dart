// BTSlider showcase — Figma 434:7617
import 'package:btech_ui/btech_ui.dart';
import 'package:flutter/material.dart';

class BTSliderShowcase extends StatefulWidget {
  const BTSliderShowcase({super.key});

  @override
  State<BTSliderShowcase> createState() => _BTSliderShowcaseState();
}

class _BTSliderShowcaseState extends State<BTSliderShowcase> {
  double _single    = 40;
  double _secondary = 60;
  double _destr     = 75;
  double _vertical  = 55;
  double _rangeFrom = 20;
  double _rangeTo   = 80;

  @override
  Widget build(final BuildContext context) {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Atoms › Slider — Figma 434:7617',
            style: TextStyle(fontSize: 11, color: Color(0xFF9CA3AF)),
          ),
          const SizedBox(height: 16),

          // ── Default horizontal — 3 variants ──────────────────────────
          _Row(label: 'primary', child: BTSlider(
            value: _single,
            onValueChanged: (v) => setState(() => _single = v),
          )),
          _Row(label: 'secondary', child: BTSlider(
            value: _secondary,
            variant: BTSliderVariant.secondary,
            onValueChanged: (v) => setState(() => _secondary = v),
          )),
          _Row(label: 'destructive', child: BTSlider(
            value: _destr,
            variant: BTSliderVariant.destructive,
            onValueChanged: (v) => setState(() => _destr = v),
          )),

          const SizedBox(height: 12),

          // ── No tooltip ───────────────────────────────────────────────
          _Row(label: 'no tooltip', child: BTSlider(
            value: _single,
            showTooltip: false,
            onValueChanged: (v) => setState(() => _single = v),
          )),

          // ── Disabled ─────────────────────────────────────────────────
          const _Row(label: 'disabled', child: BTSlider(
            value: 30,
            disabled: true,
          )),

          const SizedBox(height: 12),

          // ── Range ────────────────────────────────────────────────────
          _Row(label: 'range', child: BTSlider.range(
            startValue: _rangeFrom,
            endValue: _rangeTo,
            onStartChanged: (v) => setState(() => _rangeFrom = v),
            onEndChanged:   (v) => setState(() => _rangeTo   = v),
          )),
          _Row(label: 'range destr.', child: BTSlider.range(
            startValue: _rangeFrom,
            endValue: _rangeTo,
            variant: BTSliderVariant.destructive,
            onStartChanged: (v) => setState(() => _rangeFrom = v),
            onEndChanged:   (v) => setState(() => _rangeTo   = v),
          )),

          const SizedBox(height: 12),

          // ── Vertical ─────────────────────────────────────────────────
          const Text(
            'vertical',
            style: TextStyle(
              fontSize: 11,
              fontFamily: 'monospace',
              color: Color(0xFF9CA3AF),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 220,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                BTSlider.vertical(
                  value: _vertical,
                  onValueChanged: (v) => setState(() => _vertical = v),
                ),
                const SizedBox(width: 32),
                BTSlider.vertical(
                  value: _vertical,
                  variant: BTSliderVariant.secondary,
                  onValueChanged: (v) => setState(() => _vertical = v),
                ),
                const SizedBox(width: 32),
                BTSlider.vertical(
                  value: _vertical,
                  variant: BTSliderVariant.destructive,
                  onValueChanged: (v) => setState(() => _vertical = v),
                ),
                const SizedBox(width: 32),
                const BTSlider.vertical(
                  value: 30,
                  disabled: true,
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // ── Value readout ─────────────────────────────────────────────
          Text(
            'single=${_single.round()} · '
            'range=${_rangeFrom.round()}–${_rangeTo.round()} · '
            'vertical=${_vertical.round()}',
            style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF)),
          ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  const _Row({required this.label, required this.child});

  final String label;
  final Widget child;

  @override
  Widget build(final BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          SizedBox(
            width: 96,
            child: Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                fontFamily: 'monospace',
                color: Color(0xFF9CA3AF),
              ),
            ),
          ),
          Expanded(child: child),
        ],
      ),
    );
  }
}
