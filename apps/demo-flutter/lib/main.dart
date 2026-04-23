// ignore_for_file: lines_longer_than_80_chars
import 'package:flutter/material.dart';
import 'package:btech_tokens/btech_tokens.dart';

void main() => runApp(const DemoApp());

// ── Data model ─────────────────────────────────────────────────────────────────

enum _Tab { all, color, typography, spacing, stroke, radius, shadow }

class _TokenEntry {
  const _TokenEntry({
    required this.name,
    required this.usage,
    required this.value,
    required this.category,
    required this.tab,
    this.color,
    this.textStyle,
    this.spacing,
    this.stroke,
    this.radius,
    this.shadow,
    this.isInner = false,
  });
  final String name;
  final String usage;
  final String value;
  final String category;
  final _Tab tab;
  final Color? color;
  final TextStyle? textStyle;
  final double? spacing;
  final double? stroke;
  final double? radius;
  final List<BoxShadow>? shadow;
  /// true → renders with InnerShadowDecoration instead of BoxDecoration
  final bool isInner;
}

// ── Token data ─────────────────────────────────────────────────────────────────

String _hex(Color c) {
  // ignore: deprecated_member_use
  final hex = c.value.toRadixString(16).toUpperCase().padLeft(8, '0');
  return '#${hex.substring(2)}';
}

List<_TokenEntry> _buildEntries(BTechColorTheme c, BTechRadiusTheme r) {
  final entries = <_TokenEntry>[];

  // ── Background ──
  for (final pair in [
    ('primary',   c.bg.primary),
    ('secondary', c.bg.secondary),
    ('tertiary',  c.bg.tertiary),
    ('inverse',   c.bg.inverse),
    ('subtle',    c.bg.subtle),
    ('subtler',   c.bg.subtler),
    ('subtlest',  c.bg.subtlest),
  ]) {
    entries.add(_TokenEntry(
      name: pair.$1, usage: 'context.btechColor.bg.${pair.$1}',
      value: _hex(pair.$2), category: 'Background', tab: _Tab.color, color: pair.$2,
    ));
  }

  // ── Text ──
  for (final pair in [
    ('primary',   c.text.primary),   ('secondary', c.text.secondary),
    ('tertiary',  c.text.tertiary),  ('inverse',   c.text.inverse),
    ('disabled',  c.text.disabled),  ('link',      c.text.link),
    ('success',   c.text.success),   ('error',     c.text.error),
    ('warning',   c.text.warning),   ('info',      c.text.info),
  ]) {
    entries.add(_TokenEntry(
      name: pair.$1, usage: 'context.btechColor.text.${pair.$1}',
      value: _hex(pair.$2), category: 'Text', tab: _Tab.color, color: pair.$2,
    ));
  }

  // ── Icon ──
  for (final pair in [
    ('primary',   c.icon.primary),   ('secondary', c.icon.secondary),
    ('tertiary',  c.icon.tertiary),  ('inverse',   c.icon.inverse),
    ('disabled',  c.icon.disabled),  ('link',      c.icon.link),
    ('success',   c.icon.success),   ('error',     c.icon.error),
    ('warning',   c.icon.warning),   ('info',      c.icon.info),
  ]) {
    entries.add(_TokenEntry(
      name: pair.$1, usage: 'context.btechColor.icon.${pair.$1}',
      value: _hex(pair.$2), category: 'Icon', tab: _Tab.color, color: pair.$2,
    ));
  }

  // ── Border ──
  for (final pair in [
    ('primary',   c.border.primary),  ('secondary', c.border.secondary),
    ('tertiary',  c.border.tertiary), ('inverse',   c.border.inverse),
    ('disabled',  c.border.disabled),
  ]) {
    entries.add(_TokenEntry(
      name: pair.$1, usage: 'context.btechColor.border.${pair.$1}',
      value: _hex(pair.$2), category: 'Border', tab: _Tab.color, color: pair.$2,
    ));
  }

  // ── Brand ──
  for (final pair in [
    ('primarySubtle',   c.brand.primarySubtle),   ('primary',         c.brand.primary),
    ('primaryBold',     c.brand.primaryBold),      ('secondarySubtle', c.brand.secondarySubtle),
    ('secondary',       c.brand.secondary),        ('secondaryBold',   c.brand.secondaryBold),
  ]) {
    entries.add(_TokenEntry(
      name: pair.$1, usage: 'context.btechColor.brand.${pair.$1}',
      value: _hex(pair.$2), category: 'Brand', tab: _Tab.color, color: pair.$2,
    ));
  }

  // ── Extended ──
  for (final pair in [
    ('successSubtler', c.ext.successSubtler), ('successSubtle', c.ext.successSubtle),
    ('success',        c.ext.success),         ('successBold',   c.ext.successBold),
    ('infoSubtler',    c.ext.infoSubtler),     ('infoSubtle',    c.ext.infoSubtle),
    ('info',           c.ext.info),            ('infoBold',      c.ext.infoBold),
    ('warningSubtler', c.ext.warningSubtler),  ('warningSubtle', c.ext.warningSubtle),
    ('warning',        c.ext.warning),         ('warningBold',   c.ext.warningBold),
    ('errorSubtler',   c.ext.errorSubtler),    ('errorSubtle',   c.ext.errorSubtle),
    ('error',          c.ext.error),           ('errorBold',     c.ext.errorBold),
  ]) {
    entries.add(_TokenEntry(
      name: pair.$1, usage: 'context.btechColor.ext.${pair.$1}',
      value: _hex(pair.$2), category: 'Extended', tab: _Tab.color, color: pair.$2,
    ));
  }

  // ── Heading ──
  for (final t in [
    ('display', BTechTypography.heading.display, '40px / w700'),
    ('h1',      BTechTypography.heading.h1,      '32px / w700'),
    ('h2',      BTechTypography.heading.h2,      '28px / w700'),
    ('h3',      BTechTypography.heading.h3,      '24px / w600'),
    ('h4',      BTechTypography.heading.h4,      '20px / w600'),
  ]) {
    entries.add(_TokenEntry(
      name: t.$1, usage: 'BTechTypography.heading.${t.$1}',
      value: t.$3, category: 'Heading', tab: _Tab.typography, textStyle: t.$2,
    ));
  }

  // ── Subheading ──
  for (final t in [
    ('h5', BTechTypography.subheading.h5, '18px / w600'),
    ('h6', BTechTypography.subheading.h6, '16px / w600'),
    ('h7', BTechTypography.subheading.h7, '14px / w600'),
    ('h8', BTechTypography.subheading.h8, '12px / w600'),
  ]) {
    entries.add(_TokenEntry(
      name: t.$1, usage: 'BTechTypography.subheading.${t.$1}',
      value: t.$3, category: 'Subheading', tab: _Tab.typography, textStyle: t.$2,
    ));
  }

  // ── Body ──
  for (final t in [
    ('large',      BTechTypography.body.large,      '16px / w400'),
    ('regular',    BTechTypography.body.regular,    '14px / w400'),
    ('small',      BTechTypography.body.small,      '12px / w400'),
    ('xtrasmall',  BTechTypography.body.xtrasmall,  '10px / w400'),
    ('micro',      BTechTypography.body.micro,       '8px / w400'),
    ('largeB',     BTechTypography.body.largeB,     '16px / w700'),
    ('regularB',   BTechTypography.body.regularB,   '14px / w700'),
    ('smallB',     BTechTypography.body.smallB,     '12px / w700'),
    ('xtrasmallB', BTechTypography.body.xtrasmallB, '10px / w700'),
    ('microB',     BTechTypography.body.microB,      '8px / w700'),
  ]) {
    entries.add(_TokenEntry(
      name: t.$1, usage: 'BTechTypography.body.${t.$1}',
      value: t.$3, category: 'Body', tab: _Tab.typography, textStyle: t.$2,
    ));
  }

  // ── Spacing ──
  for (final s in [
    ('s2xs', BTechSpacing.s2xs), ('xs',   BTechSpacing.xs),
    ('sm',   BTechSpacing.sm),   ('md',   BTechSpacing.md),
    ('lg',   BTechSpacing.lg),   ('xl',   BTechSpacing.xl),
    ('s2xl', BTechSpacing.s2xl), ('s3xl', BTechSpacing.s3xl),
  ]) {
    entries.add(_TokenEntry(
      name: s.$1, usage: 'BTechSpacing.${s.$1}',
      value: s.$2.toInt().toString(), category: 'Scale', tab: _Tab.spacing, spacing: s.$2,
    ));
  }

  // ── Stroke ──
  for (final s in [
    ('xs', BTechStroke.xs), ('sm', BTechStroke.sm),
    ('md', BTechStroke.md), ('lg', BTechStroke.lg),
    ('xl', BTechStroke.xl),
  ]) {
    entries.add(_TokenEntry(
      name: s.$1, usage: 'BTechStroke.${s.$1}',
      value: '${s.$2.toInt()}px', category: 'Scale', tab: _Tab.stroke, stroke: s.$2,
    ));
  }

  // ── Radius ──
  for (final rx in [
    ('2xs', r.s2xs, 'Semantic'),
    ('xs',        r.xs,        'Semantic'),
    ('sm',       r.sm,       'Semantic'),
    ('md',     r.md,     'Semantic'),
    ('lg',     r.lg,     'Semantic'),
    ('xl',     r.xl,     'Semantic'),
    ('2xl',     r.s2xl,     'Semantic'),
    ('rd',     r.rd,     'Semantic'),
  ]) {
    entries.add(_TokenEntry(
      name: rx.$1, usage: 'context.btechRadius.${rx.$1}',
      value: '${rx.$2 >= 9999 ? '9999' : rx.$2.toInt()}px',
      category: rx.$3, tab: _Tab.radius, radius: rx.$2,
    ));
  }

  // ── Shadow ──
  for (final s in [
    ('button.pressed',   BTechShadow.button.pressed,     'inset 0 4px 4px rgba(0,0,0,.25)', 'Button', true),
    ('table.left',       BTechShadow.table.left,         '4px 0 4px rgba(0,0,0,.15)',        'Table',     false),
    ('table.right',      BTechShadow.table.right,        '-4px 0 4px rgba(0,0,0,.15)',       'Table',     false),
    ('elevation.xs',     BTechShadow.elevation.xs,       '0 1px 2px rgba(0,0,0,.05)',        'Elevation', false),
    ('elevation.sm',     BTechShadow.elevation.sm,       '0 1px 3px rgba(0,0,0,.10)',        'Elevation', false),
    ('elevation.md',     BTechShadow.elevation.md,       '0 4px 6px rgba(0,0,0,.10)',        'Elevation', false),
    ('elevation.lg',     BTechShadow.elevation.lg,       '0 10px 15px rgba(0,0,0,.10)',      'Elevation', false),
    ('elevation.xl',     BTechShadow.elevation.xl,       '0 20px 25px rgba(0,0,0,.10)',      'Elevation', false),
  ]) {
    entries.add(_TokenEntry(
      name: s.$1, usage: 'BTechShadow.${s.$1}',
      value: s.$3, category: s.$4, tab: _Tab.shadow, shadow: s.$2,
      isInner: s.$5,
    ));
  }

  return entries;
}

// ── App ────────────────────────────────────────────────────────────────────────

class DemoApp extends StatefulWidget {
  const DemoApp({super.key});
  @override
  State<DemoApp> createState() => _DemoAppState();
}

class _DemoAppState extends State<DemoApp> {
  Brightness _brightness = Brightness.light;

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BTech Token Showcase',
      debugShowCheckedModeBanner: false,
      theme:     btechTheme(),
      darkTheme: btechTheme(brightness: Brightness.dark),
      themeMode: _brightness == Brightness.light ? ThemeMode.light : ThemeMode.dark,
      home: ShowcasePage(
        onToggleBrightness: () => setState(() {
          _brightness = _brightness == Brightness.light ? Brightness.dark : Brightness.light;
        }),
        brightness: _brightness,
      ),
    );
  }
}

// ── Showcase page ──────────────────────────────────────────────────────────────

class ShowcasePage extends StatefulWidget {
  const ShowcasePage({super.key, required this.onToggleBrightness, required this.brightness});
  final VoidCallback onToggleBrightness;
  final Brightness brightness;
  @override
  State<ShowcasePage> createState() => _ShowcasePageState();
}

class _ShowcasePageState extends State<ShowcasePage> with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  final TextEditingController _search = TextEditingController();
  String _query = '';

  static const _tabs = [
    ('All',        _Tab.all),
    ('Color',      _Tab.color),
    ('Typography', _Tab.typography),
    ('Spacing',    _Tab.spacing),
    ('Stroke',     _Tab.stroke),
    ('Radius',     _Tab.radius),
    ('Shadow',     _Tab.shadow),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _search.addListener(() => setState(() => _query = _search.text.toLowerCase().trim()));
  }

  @override
  void dispose() {
    _tabController.dispose();
    _search.dispose();
    super.dispose();
  }

  List<_TokenEntry> _filter(List<_TokenEntry> all, _Tab tab) => all.where((e) {
    final tabOk = tab == _Tab.all || e.tab == tab;
    final queryOk = _query.isEmpty ||
        e.name.toLowerCase().contains(_query) ||
        e.usage.toLowerCase().contains(_query) ||
        e.value.toLowerCase().contains(_query) ||
        e.category.toLowerCase().contains(_query);
    return tabOk && queryOk;
  }).toList();

  @override
  Widget build(BuildContext context) {
    final c = context.btechColor;
    final r = context.btechRadius;
    final entries = _buildEntries(c, r);
    final isDark = widget.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: c.bg.subtle,
      appBar: AppBar(
        backgroundColor: c.bg.primary,
        elevation: 0,
        title: Text('BTech Token Showcase',
            style: BTechTypography.heading.h3.copyWith(color: c.text.primary)),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(96),
          child: Column(children: [
            TabBar(
              controller: _tabController,
              isScrollable: true,
              labelColor: c.brand.primary,
              unselectedLabelColor: c.text.secondary,
              indicatorColor: c.brand.primary,
              indicatorWeight: 2.5,
              tabs: _tabs.map((t) => Tab(text: t.$1)).toList(),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: TextField(
                controller: _search,
                style: BTechTypography.body.regular.copyWith(color: c.text.primary),
                decoration: InputDecoration(
                  hintText: '🔍  Search token…',
                  hintStyle: BTechTypography.body.regular.copyWith(color: c.text.tertiary),
                  isDense: true,
                  filled: true,
                  fillColor: c.bg.subtle,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(r.s2xs),
                    borderSide: BorderSide(color: c.border.primary),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(r.s2xs),
                    borderSide: BorderSide(color: c.border.primary),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(r.s2xs),
                    borderSide: BorderSide(color: c.brand.primary, width: 1.5),
                  ),
                ),
              ),
            ),
          ]),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: _tabs.map((t) {
          final filtered = _filter(entries, t.$2);
          return filtered.isEmpty
              ? Center(child: Text('No tokens found',
                    style: BTechTypography.body.regular.copyWith(color: c.text.tertiary)))
              : _TokenTable(entries: filtered);
        }).toList(),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: widget.onToggleBrightness,
        backgroundColor: c.brand.primary,
        foregroundColor: c.text.inverse,
        tooltip: isDark ? 'Switch to light' : 'Switch to dark',
        child: Icon(isDark ? Icons.light_mode : Icons.dark_mode),
      ),
    );
  }
}

// ── Token table ────────────────────────────────────────────────────────────────

class _TokenTable extends StatelessWidget {
  const _TokenTable({required this.entries});
  final List<_TokenEntry> entries;

  @override
  Widget build(BuildContext context) {
    final c = context.btechColor;
    return Column(children: [
      // Header
      Container(
        color: c.bg.subtler,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Row(children: [
          const SizedBox(width: 68),
          const SizedBox(width: 12),
          Expanded(child: Text('Usage', style: BTechTypography.body.smallB.copyWith(color: c.text.secondary))),
          SizedBox(width: 140, child: Text('Value', style: BTechTypography.body.smallB.copyWith(color: c.text.secondary))),
        ]),
      ),
      Divider(height: 1, color: c.border.primary),
      // Rows
      Expanded(
        child: ListView.builder(
          itemCount: entries.length,
          itemBuilder: (_, i) => _TokenRow(entry: entries[i], isEven: i.isEven),
        ),
      ),
    ]);
  }
}

// ── Token row ──────────────────────────────────────────────────────────────────

class _TokenRow extends StatelessWidget {
  const _TokenRow({required this.entry, required this.isEven});
  final _TokenEntry entry;
  final bool isEven;

  @override
  Widget build(BuildContext context) {
    final c = context.btechColor;
    return Container(
      color: isEven ? c.bg.primary : c.bg.subtle,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
        // Slot 1 — preview
        SizedBox(width: 68, child: _Preview(entry: entry)),
        const SizedBox(width: 12),
        // Slot 2 — usage + badge
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(
              entry.usage,
              style: BTechTypography.body.small.copyWith(color: c.text.primary, fontFamily: 'monospace'),
            ),
            const SizedBox(height: 4),
            _Badge(category: entry.category),
          ]),
        ),
        // Slot 3 — value
        SizedBox(
          width: 140,
          child: Text(
            entry.value,
            style: BTechTypography.body.small.copyWith(color: c.text.secondary, fontFamily: 'monospace'),
          ),
        ),
      ]),
    );
  }
}

// ── Preview widget ─────────────────────────────────────────────────────────────

class _Preview extends StatelessWidget {
  const _Preview({required this.entry});
  final _TokenEntry entry;

  @override
  Widget build(BuildContext context) {
    final c = context.btechColor;

    if (entry.color != null) {
      return Container(
        width: 56, height: 40,
        decoration: BoxDecoration(
          color: entry.color,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: c.border.primary, width: 0.5),
        ),
      );
    }

    if (entry.textStyle != null) {
      return SizedBox(
        width: 56, height: 40,
        child: Center(child: Text('Aa', style: entry.textStyle!.copyWith(color: c.text.primary))),
      );
    }

    if (entry.spacing != null) {
      final sp = entry.spacing!.clamp(2.0, 52.0);
      return SizedBox(
        width: 56, height: 40,
        child: Center(
          child: Container(
            height: 8, width: sp,
            decoration: BoxDecoration(color: c.brand.primary, borderRadius: BorderRadius.circular(2)),
          ),
        ),
      );
    }

    if (entry.stroke != null) {
      final sw = entry.stroke!.clamp(1.0, 5.0);
      return SizedBox(
        width: 56, height: 40,
        child: Center(
          child: Container(
            width: 48, height: sw,
            decoration: BoxDecoration(color: c.brand.primary, borderRadius: BorderRadius.circular(1)),
          ),
        ),
      );
    }

    if (entry.radius != null) {
      final rv = entry.radius!.clamp(0.0, 28.0);
      return Container(
        width: 56, height: 40,
        decoration: BoxDecoration(
          border: Border.all(color: c.brand.primary, width: 2),
          borderRadius: BorderRadius.circular(rv),
        ),
      );
    }

    if (entry.shadow != null) {
      if (entry.isInner) {
        // Inner shadow — interactive: tap to toggle pressed state
        return _InnerShadowPreview(shadow: entry.shadow!);
      }
      return Container(
        width: 44, height: 34,
        decoration: BoxDecoration(
          color: c.bg.primary,
          borderRadius: BorderRadius.circular(6),
          boxShadow: entry.shadow,
        ),
      );
    }

    return const SizedBox(width: 56, height: 40);
  }
}

// ── Inner shadow preview ───────────────────────────────────────────────────────
// Tap to toggle between normal and pressed state, showing the inner shadow live.

class _InnerShadowPreview extends StatefulWidget {
  const _InnerShadowPreview({required this.shadow});
  final List<BoxShadow> shadow;

  @override
  State<_InnerShadowPreview> createState() => _InnerShadowPreviewState();
}

class _InnerShadowPreviewState extends State<_InnerShadowPreview> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    final c = context.btechColor;
    final r = context.btechRadius;
    const w = 44.0;
    const h = 34.0;
    final radius = BorderRadius.circular(r.sm);

    // Use a Stack so the two decoration types never need to lerp each other.
    // Bottom layer: always-present BoxDecoration (elevation when idle, flat when pressed).
    // Top layer: InnerShadowDecoration fades in on press.
    return GestureDetector(
      onTapDown:   (_) => setState(() => _pressed = true),
      onTapUp:     (_) => setState(() => _pressed = false),
      onTapCancel: () => setState(() => _pressed = false),
      child: SizedBox(
        width: w, height: h,
        child: Stack(
          fit: StackFit.expand,
          children: [
            // ── Base (elevation idle / flat pressed) ──────────────────────
            AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              decoration: BoxDecoration(
                color: _pressed ? c.bg.subtle : c.bg.primary,
                borderRadius: radius,
                border: Border.all(color: c.border.primary, width: 0.5),
                boxShadow: _pressed ? [] : BTechShadow.elevation.sm,
              ),
            ),
            // ── Inner shadow layer — always InnerShadowDecoration ─────────
            AnimatedOpacity(
              duration: const Duration(milliseconds: 150),
              opacity: _pressed ? 1.0 : 0.0,
              child: Container(
                decoration: InnerShadowDecoration(
                  borderRadius: radius,
                  boxShadow: widget.shadow,
                ),
              ),
            ),
            // ── Label ─────────────────────────────────────────────────────
            Center(
              child: Text(
                _pressed ? '↓' : '↑',
                style: TextStyle(fontSize: 12, color: c.text.secondary),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Category badge ─────────────────────────────────────────────────────────────

class _Badge extends StatelessWidget {
  const _Badge({required this.category});
  final String category;

  static (Color, Color) _pair(BTechColorTheme c, String cat) => switch (cat) {
    'Background' => (c.ext.infoSubtler,    c.text.info),
    'Text'       => (c.ext.successSubtler, c.text.success),
    'Icon'       => (c.ext.successSubtler, c.text.success),
    'Border'     => (c.ext.warningSubtler, c.text.warning),
    'Brand'      => (c.ext.successSubtle,  c.text.success),
    'Extended'   => (c.ext.infoSubtle,     c.text.info),
    'Heading'    => (c.ext.successSubtler, c.text.success),
    'Subheading' => (c.ext.infoSubtler,    c.text.info),
    'Body'       => (c.ext.warningSubtler, c.text.warning),
    'Scale'      => (c.ext.warningSubtler, c.text.warning),
    'Semantic'   => (c.ext.infoSubtler,    c.text.info),
    'Stroke'     => (c.ext.warningSubtler, c.text.warning),
    'Shadow'     => (c.ext.errorSubtler,   c.text.error),
    'Elevation'  => (c.ext.errorSubtler,   c.text.error),
    'Button'     => (c.ext.errorSubtler,   c.text.error),
    'Table'      => (c.ext.errorSubtler,   c.text.error),
    _            => (c.bg.subtler,         c.text.secondary),
  };

  @override
  Widget build(BuildContext context) {
    final c = context.btechColor;
    final (bg, fg) = _pair(c, category);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(9999)),
      child: Text(category, style: BTechTypography.body.xtrasmallB.copyWith(color: fg)),
    );
  }
}
