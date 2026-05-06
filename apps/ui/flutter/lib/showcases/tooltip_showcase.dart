// ignore_for_file: lines_longer_than_80_chars

import 'package:btech_ui/btech_ui.dart';
import 'package:flutter/material.dart';

/// Showcase for [BTTooltip] and [BTTooltipStep].
class BTTooltipShowcase extends StatefulWidget {
  const BTTooltipShowcase({super.key});

  @override
  State<BTTooltipShowcase> createState() => _BTTooltipShowcaseState();
}

class _BTTooltipShowcaseState extends State<BTTooltipShowcase>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Text(
            'BTTooltip + BTTooltipStep',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
          ),
        ),
        TabBar(
          controller: _tabs,
          tabs: const [Tab(text: 'UI'), Tab(text: 'Usage')],
        ),
        Expanded(
          child: TabBarView(
            controller: _tabs,
            children: [_UITab(), _UsageTab()],
          ),
        ),
      ],
    );
  }
}

// ── UI Tab ────────────────────────────────────────────────────────────────

class _UITab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // ── Simple tooltip ─────────────────────────────────────────────
        const _SectionTitle('BTTooltip — Positions'),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: BTTooltipPosition.values.map((pos) {
            return BTTooltip(
              position: pos,
              text:
                  'A message which appears when cursor is positioned over an element.',
              child: ElevatedButton(
                onPressed: () {},
                child: Text(pos.name),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),

        // ── Arrow positions ────────────────────────────────────────────
        const _SectionTitle('BTTooltip — Arrow Positions (bottom)'),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: BTTooltipArrowPosition.values.map((ap) {
            return BTTooltip(
              position: BTTooltipPosition.bottom,
              arrowPosition: ap,
              text: 'Arrow: ${ap.name}',
              child: ElevatedButton(
                onPressed: () {},
                child: Text(ap.name),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 24),

        // ── TooltipStep variants ──────────────────────────────────────
        const _SectionTitle('BTTooltipStep — Step Variants'),
        ...BTTooltipStepVariant.values.map((variant) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  variant.name,
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
                const SizedBox(height: 8),
                BTTooltipStep(
                  label: 'Fitur Baru',
                  description: 'Klik tombol ini untuk melanjutkan.',
                  stepLabel: 'Step 1 of 5',
                  stepVariant: variant,
                  hasClose: true,
                  position: BTTooltipPosition.bottom,
                ),
              ],
            ),
          );
        }),

        // ── Arrow positions on step ──────────────────────────────────
        const _SectionTitle('BTTooltipStep — Positions'),
        ...BTTooltipPosition.values.map((pos) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'position: ${pos.name}',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
                const SizedBox(height: 8),
                BTTooltipStep(
                  description: 'Tooltip balloon dengan arrow di sisi ${pos.name}.',
                  stepLabel: 'Step 1 of 3',
                  position: pos,
                ),
              ],
            ),
          );
        }),

        // ── Description only ─────────────────────────────────────────
        const _SectionTitle('BTTooltipStep — Description Only'),
        BTTooltipStep(
          description:
              'A message which appears when a cursor is positioned over an icon, image, hyperlink, or other element in a graphical user interface.',
          position: BTTooltipPosition.top,
          arrowPosition: BTTooltipArrowPosition.left,
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}

// ── Usage Tab ─────────────────────────────────────────────────────────────

class _UsageTab extends StatefulWidget {
  @override
  State<_UsageTab> createState() => _UsageTabState();
}

class _UsageTabState extends State<_UsageTab> {
  int _step = 1;
  final int _total = 5;
  BTTooltipStepVariant _variant = BTTooltipStepVariant.button;
  bool _showStep = false;

  void _goPrev() => setState(() => _step = (_step - 1).clamp(1, _total));
  void _goNext() {
    if (_step >= _total) {
      setState(() { _showStep = false; _step = 1; });
    } else {
      setState(() => _step++);
    }
  }
  void _endTour() => setState(() { _showStep = false; _step = 1; });
  void _startTour() => setState(() { _showStep = true; _step = 1; });

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'Interactive Coachmark Tour',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        const Text(
          'Pilih style tombol navigasi lalu ketuk "Start Tour".',
          style: TextStyle(fontSize: 13, color: Colors.grey),
        ),
        const SizedBox(height: 16),

        // Variant selector
        Wrap(
          spacing: 8,
          children: BTTooltipStepVariant.values.map((v) {
            final selected = v == _variant;
            return GestureDetector(
              onTap: () => setState(() => _variant = v),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: selected ? const Color(0xFF1e293b) : Colors.white,
                  border: Border.all(color: const Color(0xFFe2e8f0)),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  v.name,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: selected ? Colors.white : const Color(0xFF334155),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 8),

        // Start button
        GestureDetector(
          onTap: _startTour,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFF145bc3),
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Text(
              'Start Tour',
              style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500),
            ),
          ),
        ),
        const SizedBox(height: 24),

        if (_showStep)
          BTTooltipStep(
            label: 'Contoh Coachmark',
            description: 'Ini adalah langkah $_step dari $_total.',
            stepLabel: 'Step $_step of $_total',
            stepVariant: _variant,
            hasClose: true,
            prevLabel: 'Kembali',
            nextLabel: 'Selanjutnya',
            position: BTTooltipPosition.bottom,
            onPrev: _goPrev,
            onNext: _goNext,
            onClose: _endTour,
          )
        else
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFf8fafc),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Text(
              'Tour selesai. Ketuk "Start Tour" untuk mengulang.',
              style: TextStyle(fontSize: 14, color: Colors.grey),
            ),
          ),
      ],
    );
  }
}

// ── Helper ────────────────────────────────────────────────────────────────

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title);
  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, top: 4),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: Color(0xFF334155),
        ),
      ),
    );
  }
}
