// ignore_for_file: lines_longer_than_80_chars

import 'package:btech_tokens/btech_tokens.dart';
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
    final c = context.btechColor;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // ── Title ─────────────────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.fromLTRB(0, 0, 0, 12),
          child: Text(
            'BTTooltip + BTTooltipStep',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              fontFamily: BTechTypography.fontFamily,
              color: c.text.primary,
            ),
          ),
        ),

        // ── Tabs ──────────────────────────────────────────────────────────
        TabBar(
          controller: _tabs,
          isScrollable: true,
          tabAlignment: TabAlignment.start,
          labelColor: c.text.primary,
          unselectedLabelColor: c.text.secondary,
          indicatorColor: c.text.primary,
          labelStyle: TextStyle(
            fontFamily: BTechTypography.fontFamily,
            fontSize: 13,
            fontWeight: FontWeight.w500,
          ),
          unselectedLabelStyle: TextStyle(
            fontFamily: BTechTypography.fontFamily,
            fontSize: 13,
            fontWeight: FontWeight.w400,
          ),
          tabs: const [Tab(text: 'UI'), Tab(text: 'Usage')],
        ),
        const SizedBox(height: 16),

        // ── TabBarView — must NOT use Expanded inside SingleChildScrollView ──
        SizedBox(
          height: 2400,
          child: TabBarView(
            controller: _tabs,
            children: [_UITab(), const _UsageTab()],
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
    final c = context.btechColor;

    Widget triggerBox(String label) => Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFFe2e8f0)),
            borderRadius: BorderRadius.circular(6),
            color: Colors.white,
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              fontFamily: BTechTypography.fontFamily,
              color: c.text.primary,
            ),
          ),
        );

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        // ── Simple tooltip ─────────────────────────────────────────────
        const _SectionTitle('BTTooltip — Positions'),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: BTTooltipPosition.values.map((pos) {
            return BTTooltip(
              position: pos,
              text: 'A message which appears when a cursor is positioned over an element.',
              child: triggerBox('Tap (${pos.name})'),
            );
          }).toList(),
        ),
        const SizedBox(height: 32),

        // ── Arrow positions ────────────────────────────────────────────
        const _SectionTitle('BTTooltip — Arrow Positions (position=bottom)'),
        Wrap(
          spacing: 16,
          runSpacing: 16,
          children: BTTooltipArrowPosition.values.map((ap) {
            return BTTooltip(
              position: BTTooltipPosition.bottom,
              arrowPosition: ap,
              text: 'Arrow: ${ap.name}',
              child: triggerBox(ap.name),
            );
          }).toList(),
        ),
        const SizedBox(height: 32),

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
                  style: const TextStyle(fontSize: 12, color: Color(0xFF64748b)),
                ),
                const SizedBox(height: 8),
                BTTooltipStep(
                  label: 'Fitur Baru',
                  description: 'Klik tombol ini untuk melanjutkan ke langkah berikutnya.',
                  stepLabel: 'Step 1 of 5',
                  stepVariant: variant,
                  hasClose: true,
                  position: BTTooltipPosition.bottom,
                ),
              ],
            ),
          );
        }),
        const SizedBox(height: 8),

        // ── Positions ─────────────────────────────────────────────────
        const _SectionTitle('BTTooltipStep — Positions'),
        ...BTTooltipPosition.values.map((pos) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'position: ${pos.name}',
                  style: const TextStyle(fontSize: 12, color: Color(0xFF64748b)),
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
        const BTTooltipStep(
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

// ── Usage Tab — 9-button positioned coachmark demo ────────────────────────

class _UsageTab extends StatefulWidget {
  const _UsageTab();

  @override
  State<_UsageTab> createState() => _UsageTabState();
}

class _UsageTabState extends State<_UsageTab> {
  final _keys = List.generate(9, (_) => GlobalKey());
  BTTooltipStepVariant _variant = BTTooltipStepVariant.button;
  int _activeIdx = -1;
  bool _dismissable = true;
  BTCoachmarkController? _activeTour;
  static const int _total = 9;

  // ── Config for each of the 9 demo buttons ────────────────────────────────

  static const _labels = [
    'Top Left',    'Top Center',    'Top Right',
    'Center Left', 'Center',        'Center Right',
    'Bottom Left', 'Bottom Center', 'Bottom Right',
  ];

  static const _ttPos = [
    BTTooltipPosition.bottom, BTTooltipPosition.bottom, BTTooltipPosition.bottom,
    BTTooltipPosition.right,  BTTooltipPosition.bottom, BTTooltipPosition.left,
    BTTooltipPosition.top,    BTTooltipPosition.top,    BTTooltipPosition.top,
  ];

  static const _alignments = [
    Alignment.topLeft,    Alignment.topCenter,    Alignment.topRight,
    Alignment.centerLeft, Alignment.center,        Alignment.centerRight,
    Alignment.bottomLeft, Alignment.bottomCenter,  Alignment.bottomRight,
  ];

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  @override
  void dispose() {
    _activeTour?.dispose();
    super.dispose();
  }

  // ── Tour management ───────────────────────────────────────────────────────

  void _showAt(int idx) {
    _activeTour?.dismiss();
    _activeTour?.dispose();
    _activeTour = BTCoachmarkController(
      steps: List.generate(
        _total,
        (i) => BTCoachmarkStep(
          targetKey: _keys[i],
          label: _labels[i],
          description: 'Ini adalah langkah ${i + 1} dari $_total.',
          stepLabel: 'Step ${i + 1} of $_total',
          stepVariant: _variant,
          position: _ttPos[i],
          prevLabel: 'Kembali',
          nextLabel: 'Selanjutnya',
        ),
      ),
      dismissable: _dismissable,
      stepVariant: _variant,
      onFinish: () {
        if (!mounted) return;
        setState(() => _activeIdx = -1);
      },
    );
    _activeTour!.show(context, startAt: idx);
    setState(() => _activeIdx = idx);
  }

  void _close() {
    _activeTour?.dismiss();
    if (mounted) setState(() => _activeIdx = -1);
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    final c = context.btechColor;

    return ListView(
      padding: EdgeInsets.zero,
      children: [
        // ── Header ──────────────────────────────────────────────────────
        Text(
          'Interactive Coachmark Demo',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            fontFamily: BTechTypography.fontFamily,
            color: c.text.primary,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Pilih gaya tombol, lalu ketuk salah satu dari 9 posisi di bawah untuk melihat BTTooltipStep.',
          style: TextStyle(
            fontSize: 13,
            fontFamily: BTechTypography.fontFamily,
            color: c.text.secondary,
          ),
        ),
        const SizedBox(height: 16),

        // ── Variant selector ────────────────────────────────────────────
        Wrap(
          spacing: 8,
          children: BTTooltipStepVariant.values.map((v) {
            final selected = v == _variant;
            return GestureDetector(
              onTap: () {
                _close();
                setState(() => _variant = v);
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: selected ? c.text.primary : Colors.white,
                  border: Border.all(color: selected ? c.text.primary : const Color(0xFFe2e8f0)),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  v.name,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    fontFamily: BTechTypography.fontFamily,
                    color: selected ? Colors.white : c.text.secondary,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 16),

        // ── Dismissable toggle ─────────────────────────────────────────
        Row(
          children: [
            Text(
              'Dismissable:',
              style: TextStyle(
                fontSize: 13,
                fontFamily: BTechTypography.fontFamily,
                color: c.text.secondary,
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: () => setState(() => _dismissable = !_dismissable),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: _dismissable ? c.text.primary : Colors.white,
                  border: Border.all(
                    color: _dismissable ? c.text.primary : const Color(0xFFe2e8f0),
                  ),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  _dismissable ? 'ON' : 'OFF',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    fontFamily: BTechTypography.fontFamily,
                    color: _dismissable ? Colors.white : c.text.secondary,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            Flexible(
              child: Text(
                _dismissable ? '— ketuk luar untuk tutup' : '— ketuk luar tidak tutup',
                style: TextStyle(
                  fontSize: 12,
                  fontFamily: BTechTypography.fontFamily,
                  color: const Color(0xFF9ca3af),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),

        // ── 9-button grid (Stack) ───────────────────────────────────────
        Text(
          'Ketuk tombol di posisi manapun:',
          style: TextStyle(
            fontSize: 12,
            fontFamily: BTechTypography.fontFamily,
            color: c.text.tertiary,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          height: 360,
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFFe2e8f0)),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Stack(
            children: [
              // Hint text in center-background
              Center(
                child: Text(
                  '← tap any button →',
                  style: TextStyle(
                    fontSize: 12,
                    fontFamily: BTechTypography.fontFamily,
                    color: const Color(0xFFe2e8f0),
                  ),
                ),
              ),

              // 9 positioned buttons
              for (var i = 0; i < 9; i++)
                Align(
                  alignment: _alignments[i],
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: KeyedSubtree(
                      key: _keys[i],
                      child: GestureDetector(
                        onTap: () => _showAt(i),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: _activeIdx == i
                                ? c.text.primary
                                : const Color(0xFF4a9d5b),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            _labels[i],
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              fontFamily: BTechTypography.fontFamily,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }
}

// ── Helper widgets ─────────────────────────────────────────────────────────

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title);
  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, top: 4),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          fontFamily: BTechTypography.fontFamily,
          color: const Color(0xFF334155),
        ),
      ),
    );
  }
}

