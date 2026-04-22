import 'package:flutter/material.dart';
import 'package:btech_tokens/btech_tokens.dart';

void main() => runApp(const DemoApp());

// ── App shell ─────────────────────────────────────────────────────────────────
class DemoApp extends StatefulWidget {
  const DemoApp({super.key});

  @override
  State<DemoApp> createState() => _DemoAppState();
}

class _DemoAppState extends State<DemoApp> {
  ThemeMode _mode = ThemeMode.system;

  void _toggle() {
    setState(() {
      _mode = _mode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BTech Token Showcase — Flutter',
      debugShowCheckedModeBanner: false,
      theme: btechTheme(),
      darkTheme: btechTheme(brightness: Brightness.light),
      themeMode: _mode,
      home: ShowcasePage(onToggleTheme: _toggle, themeMode: _mode),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shadow primitives (not yet in token package — hardcoded until added)
// ─────────────────────────────────────────────────────────────────────────────
abstract class _Shadow {
  static const List<BoxShadow> sm = [
    BoxShadow(
        color: Color(0x0D000000),
        blurRadius: 2,
        offset: Offset(0, 1),
        spreadRadius: 0),
  ];
  static const List<BoxShadow> md = [
    BoxShadow(
        color: Color(0x1A000000),
        blurRadius: 6,
        offset: Offset(0, 4),
        spreadRadius: -1),
    BoxShadow(
        color: Color(0x0F000000),
        blurRadius: 4,
        offset: Offset(0, 2),
        spreadRadius: -1),
  ];
  static const List<BoxShadow> lg = [
    BoxShadow(
        color: Color(0x1A000000),
        blurRadius: 15,
        offset: Offset(0, 10),
        spreadRadius: -3),
    BoxShadow(
        color: Color(0x0D000000),
        blurRadius: 6,
        offset: Offset(0, 4),
        spreadRadius: -2),
  ];
  static const List<BoxShadow> xl = [
    BoxShadow(
        color: Color(0x1A000000),
        blurRadius: 25,
        offset: Offset(0, 20),
        spreadRadius: -5),
    BoxShadow(
        color: Color(0x0A000000),
        blurRadius: 10,
        offset: Offset(0, 10),
        spreadRadius: -5),
  ];
}

// ── Showcase page ─────────────────────────────────────────────────────────────
class ShowcasePage extends StatelessWidget {
  final VoidCallback onToggleTheme;
  final ThemeMode themeMode;
  const ShowcasePage({
    super.key,
    required this.onToggleTheme,
    required this.themeMode,
  });

  @override
  Widget build(BuildContext context) {
    final c =
        context.btechColor; // BTechColorTheme — reactive, tenant + dark mode
    final r = context.btechRadius; // BTechRadiusTheme
    final f = context.btechFont; // BTechFontTheme (.family.sans)

    // Semantic font styles — instantiated after theme is active
    final heading = BTechFontHeading();
    final subheading = BTechFontSubHeading();
    final body = BTechFontBody();

    return Scaffold(
      backgroundColor: c.bg.primary,
      appBar: AppBar(
        backgroundColor: c.bg.primary,
        elevation: 0,
        title: Text(
          'BTech Token Showcase',
          style: TextStyle(color: c.text.primary, fontSize: BTechFontSize.md),
        ),
        actions: [
          IconButton(
            icon: Icon(
              themeMode == ThemeMode.dark ? Icons.light_mode : Icons.dark_mode,
              color: c.text.primary,
            ),
            tooltip: themeMode == ThemeMode.dark
                ? 'Switch to Light'
                : 'Switch to Dark',
            onPressed: onToggleTheme,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(BTechSpacing.xl),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 900),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // ── Header ──────────────────────────────────────────────
                Text(
                  'BTech Design System · Token Showcase · Flutter',
                  textAlign: TextAlign.center,
                  style: heading.h4.copyWith(color: c.text.primary),
                ),
                const SizedBox(height: BTechSpacing.sm),
                Text(
                  'Every style below is driven by btech_tokens_bspace — type-safe, tenant-aware, dark-mode ready',
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: BTechSpacing.sm),
                Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: BTechSpacing.md, vertical: BTechSpacing.xs),
                    decoration: BoxDecoration(
                      color: c.bg.secondary,
                      borderRadius: BorderRadius.circular(r.badge),
                      border: Border.all(color: c.border.primary),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          themeMode == ThemeMode.dark
                              ? Icons.dark_mode
                              : Icons.light_mode,
                          size: 14,
                          color: c.text.secondary,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          themeMode == ThemeMode.dark
                              ? 'Dark mode active'
                              : 'Light mode active',
                          style: TextStyle(
                            fontSize: BTechFontSize.xs,
                            color: c.text.secondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: BTechSpacing.xl),

                // ── Color · Background ───────────────────────────────────
                _Section(
                  title: 'COLOR · BACKGROUND',
                  child: LayoutBuilder(builder: (ctx, box) {
                    final cols = (box.maxWidth / 120).floor().clamp(2, 7);
                    final w =
                        (box.maxWidth - (cols - 1) * BTechSpacing.sm) / cols;
                    return Wrap(
                      spacing: BTechSpacing.sm,
                      runSpacing: BTechSpacing.sm,
                      children: [
                        _ColorSwatch('primary', c.bg.primary,
                            c.text.primary, 'c.bg.primary', w),
                        _ColorSwatch('secondary', c.bg.secondary,
                            c.text.secondary, 'c.bg.secondary', w),
                        _ColorSwatch('danger', c.bg.tertiary, c.text.primary,
                            'c.bg.danger', w),
                        _ColorSwatch('success', c.bg.inverse, c.text.primary,
                            'c.bg.success', w),
                        _ColorSwatch('warning', c.bg.subtle, c.text.primary,
                            'c.bg.warning', w),
                        _ColorSwatch('surface', c.bg.subtler, c.text.primary,
                            'c.bg.secondary', w),
                        _ColorSwatch('raised', c.bg.subtle, c.text.primary,
                            'c.bg.secondary.raised', w),
                      ],
                    );
                  }),
                ),
                const SizedBox(height: BTechSpacing.lg),

                // ── Color · Text ─────────────────────────────────────────
                _Section(
                  title: 'COLOR · TEXT',
                  child: Column(children: [
                    _TokenRow(
                        code: 'c.text.primary',
                        child: Text('The quick brown fox — neutral',
                            style: TextStyle(
                                color: c.text.primary,
                                fontSize: BTechFontSize.md,
                                fontFamily: f.family.sans))),
                    _TokenRow(
                        code: 'c.text.secondary',
                        child: Text('The quick brown fox — secondary',
                            style: TextStyle(
                                color: c.text.secondary,
                                fontSize: BTechFontSize.md,
                                fontFamily: f.family.sans))),
                    _TokenRow(
                        code: 'c.text.disabled',
                        child: Text('The quick brown fox — disabled',
                            style: TextStyle(
                                color: c.text.disabled,
                                fontSize: BTechFontSize.md,
                                fontFamily: f.family.sans))),
                    _TokenRow(
                        code: 'c.text.primary',
                        child: Container(
                            color: c.bg.primary,
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            child: Text(
                                'The quick brown fox — inverse (on neutral bg)',
                                style: TextStyle(
                                    color: c.text.primary,
                                    fontSize: BTechFontSize.md,
                                    fontFamily: f.family.sans)))),
                    _TokenRow(
                        code: 'c.text.danger',
                        child: Text('The quick brown fox — danger',
                            style: TextStyle(
                                color: c.text.error,
                                fontSize: BTechFontSize.md,
                                fontFamily: f.family.sans))),
                    _TokenRow(
                        code: 'c.text.success',
                        child: Text('The quick brown fox — success',
                            style: TextStyle(
                                color: c.text.success,
                                fontSize: BTechFontSize.md,
                                fontFamily: f.family.sans))),
                    _TokenRow(
                        code: 'c.text.warning',
                        child: Text('The quick brown fox — warning',
                            style: TextStyle(
                                color: c.text.warning,
                                fontSize: BTechFontSize.md,
                                fontFamily: f.family.sans))),
                  ]),
                ),
                const SizedBox(height: BTechSpacing.lg),

                // ── Color · Border / Stroke ──────────────────────────────
                _Section(
                  title: 'COLOR · BORDER / STROKE',
                  child: Column(children: [
                    _TokenRow(
                        code: 'c.border.primary',
                        child: _StrokePill(
                            'neutral', c.border.primary, c, f.family.sans)),
                    _TokenRow(
                        code: 'c.border.primary.strong',
                        child: _StrokePill('neutral.strong', c.border.primary,
                            c, f.family.sans)),
                    _TokenRow(
                        code: 'c.border.primary',
                        child: _StrokePill(
                            'primary', c.border.primary, c, f.family.sans)),
                    _TokenRow(
                        code: 'c.border.danger',
                        child: _StrokePill(
                            'danger', c.border.secondary, c, f.family.sans)),
                  ]),
                ),
                const SizedBox(height: BTechSpacing.lg),

                // ── Spacing ──────────────────────────────────────────────
                _Section(
                  title: 'SPACING',
                  child: Column(children: [
                    for (final s in [
                      ('xs', BTechSpacing.xs),
                      ('sm', BTechSpacing.sm),
                      ('md', BTechSpacing.md),
                      ('lg', BTechSpacing.lg),
                      ('xl', BTechSpacing.xl),
                      ('2xl', BTechSpacing.s2xl),
                      ('3xl', BTechSpacing.s3xl),
                    ])
                      _SpacingRow(s.$1, s.$2, c),
                  ]),
                ),
                const SizedBox(height: BTechSpacing.lg),

                // ── Typography · Font Family ─────────────────────────────
                _Section(
                  title: 'TYPOGRAPHY · FONT FAMILY',
                  child: Column(children: [
                    _TokenRow(
                        code: 'btechFont.family.sans → ${f.family.sans}',
                        child: Text(
                            'Sans: The quick brown fox jumps over the lazy dog',
                            style: TextStyle(
                                fontFamily: f.family.sans,
                                fontSize: BTechFontSize.md,
                                color: c.text.primary))),
                    _TokenRow(
                        code: "'JetBrains Mono'",
                        child: Text(
                            "Mono: const c = context.btechColor.bg.primary",
                            style: const TextStyle(
                                fontFamily: 'JetBrains Mono',
                                fontSize: BTechFontSize.md,
                                color: Color(0xFF374151)))),
                  ]),
                ),
                const SizedBox(height: BTechSpacing.lg),

                // ── Typography · Font Size ───────────────────────────────
                _Section(
                  title: 'TYPOGRAPHY · FONT SIZE',
                  child: Column(children: [
                    for (final s in [
                      ('xs', BTechFontSize.xs),
                      ('sm', BTechFontSize.sm),
                      ('base', BTechFontSize.md),
                      ('lg', BTechFontSize.lg),
                      ('xl', BTechFontSize.xl),
                      ('2xl', BTechFontSize.s2xl),
                      ('3xl', BTechFontSize.s3xl),
                    ])
                      _TokenRow(
                          code: 'BTechFontSize.${s.$1}',
                          child: Text('Aa — ${s.$1}',
                              style: TextStyle(
                                  fontSize: s.$2,
                                  color: c.text.primary,
                                  fontFamily: f.family.sans))),
                  ]),
                ),
                const SizedBox(height: BTechSpacing.lg),

                // ── Typography · Font Weight ─────────────────────────────
                _Section(
                  title: 'TYPOGRAPHY · FONT WEIGHT',
                  child: Column(children: [
                    for (final w in [
                      ('regular', BTechFontWeight.regular),
                      ('medium', BTechFontWeight.medium),
                      ('semibold', BTechFontWeight.semibold),
                      ('bold', BTechFontWeight.bold),
                    ])
                      _TokenRow(
                          code: 'BTechFontWeight.${w.$1}',
                          child: Text('The quick brown fox — ${w.$1}',
                              style: TextStyle(
                                  fontWeight: w.$2,
                                  fontSize: BTechFontSize.md,
                                  color: c.text.primary,
                                  fontFamily: f.family.sans))),
                  ]),
                ),
                const SizedBox(height: BTechSpacing.lg),

                // ── Typography · Semantic Styles ─────────────────────────
                _Section(
                  title: 'TYPOGRAPHY · SEMANTIC STYLES',
                  child: Column(children: [
                    _TokenRow(
                        code: 'BTechFontHeading().h1',
                        child:
                            Text('Heading H1 — 35px bold', style: heading.h1)),
                    _TokenRow(
                        code: 'BTechFontHeading().h2',
                        child:
                            Text('Heading H2 — 29px w600', style: heading.h2)),
                    _TokenRow(
                        code: 'BTechFontHeading().h3',
                        child: Text('Heading H3 — 24px bold',
                            style: heading.h3.copyWith(color: c.text.primary))),
                    _TokenRow(
                        code: 'BTechFontHeading().h4',
                        child: Text('Heading H4 — 20px w500',
                            style: heading.h4.copyWith(color: c.text.primary))),
                    _TokenRow(
                        code: 'BTechFontSubHeading().h5',
                        child: Text('Subheading H5 — 16px bold',
                            style: subheading.h5)),
                    _TokenRow(
                        code: 'BTechFontSubHeading().h6',
                        child: Text('Subheading H6 — 14px w600',
                            style: subheading.h6)),
                    _TokenRow(
                        code: 'BTechFontSubHeading().h7',
                        child: Text('Subheading H7 — 12px w600',
                            style: subheading.h7)),
                    _TokenRow(
                        code: 'BTechFontBody().base',
                        child: Text('Body base — 12px w500', style: body.base)),
                    _TokenRow(
                        code: 'BTechFontBody().bold',
                        child: Text('Body bold — 12px bold', style: body.bold)),
                    _TokenRow(
                        code: 'BTechFontBody().medium',
                        child: Text('Body medium — 14px w500',
                            style: body.medium)),
                    _TokenRow(
                        code: 'BTechFontBody().small',
                        child:
                            Text('Body small — 11px w500', style: body.small)),
                    _TokenRow(
                        code: 'BTechFontBody().italic',
                        child: Text('Body italic — 12px italic',
                            style: body.italic)),
                    _TokenRow(
                        code: 'BTechFontBody().underline',
                        child: Text('Body underline — 12px w600',
                            style: body.underline)),
                    _TokenRow(
                        code: 'BTechFontBody().paragraph',
                        child: Text('Body paragraph — relaxed lh',
                            style: body.paragraph)),
                  ]),
                ),
                const SizedBox(height: BTechSpacing.lg),

                // ── Radius ───────────────────────────────────────────────
                _Section(
                  title: 'RADIUS  (✦ = tenant-aware via btechRadius)',
                  child: LayoutBuilder(builder: (ctx, box) {
                    final cols = (box.maxWidth / 110).floor().clamp(2, 8);
                    final w =
                        (box.maxWidth - (cols - 1) * BTechSpacing.sm) / cols;
                    return Wrap(
                      spacing: BTechSpacing.sm,
                      runSpacing: BTechSpacing.sm,
                      children: [
                        for (final rx in [
                          ('none', 0.0, false),
                          ('sm', 2.0, false),
                          ('md', 8.0, false),
                          ('lg', 14.0, false),
                          ('xl', 20.0, false),
                          ('full', 9999.0, false),
                          ('interactive', r.interactive, true),
                          ('card', r.card, true),
                          ('badge', r.badge, true),
                        ])
                          _RadiusBox(rx.$1, rx.$2, c, w, tenant: rx.$3),
                      ],
                    );
                  }),
                ),
                const SizedBox(height: BTechSpacing.lg),

                // ── Shadow ───────────────────────────────────────────────
                _Section(
                  title: 'SHADOW',
                  child: LayoutBuilder(builder: (ctx, box) {
                    final cols = (box.maxWidth / 140).floor().clamp(2, 4);
                    final w =
                        (box.maxWidth - (cols - 1) * BTechSpacing.md) / cols;
                    return Wrap(
                      spacing: BTechSpacing.md,
                      runSpacing: BTechSpacing.md,
                      children: [
                        _ShadowCard('sm', _Shadow.sm, c, w),
                        _ShadowCard('md', _Shadow.md, c, w),
                        _ShadowCard('lg', _Shadow.lg, c, w),
                        _ShadowCard('xl', _Shadow.xl, c, w),
                      ],
                    );
                  }),
                ),
                const SizedBox(height: BTechSpacing.lg),

                // ── Motion · Duration ────────────────────────────────────
                _Section(
                  title: 'MOTION · DURATION — hover or tap the bar',
                  child: Column(children: [
                    _MotionBar(
                        label: 'fast',
                        duration: const Duration(milliseconds: 100),
                        code: '100ms'),
                    _MotionBar(
                        label: 'normal',
                        duration: const Duration(milliseconds: 200),
                        code: '200ms'),
                    _MotionBar(
                        label: 'slow',
                        duration: const Duration(milliseconds: 400),
                        code: '400ms'),
                  ]),
                ),
                const SizedBox(height: BTechSpacing.lg),

                // ── Footer ───────────────────────────────────────────────
                Container(
                  padding: const EdgeInsets.all(BTechSpacing.md),
                  decoration: BoxDecoration(
                    color: c.bg.secondary,
                    borderRadius: BorderRadius.circular(r.card),
                    border: Border.all(color: c.border.primary),
                  ),
                  child: Text(
                    'btech_tokens_bspace · btechTheme() · font: ${f.family.sans}',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        fontSize: BTechFontSize.xs,
                        color: c.text.primary,
                        fontFamily: 'monospace'),
                  ),
                ),
                const SizedBox(height: BTechSpacing.lg),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ── Section card ─────────────────────────────────────────────────────────────
class _Section extends StatelessWidget {
  final String title;
  final Widget child;
  const _Section({required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    final c = context.btechColor;
    final r = context.btechRadius;
    return Container(
      decoration: BoxDecoration(
        color: c.bg.secondary,
        borderRadius: BorderRadius.circular(r.card),
        border: Border.all(color: c.border.primary),
        boxShadow: _Shadow.sm,
      ),
      padding: const EdgeInsets.all(BTechSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: TextStyle(
                fontSize: BTechFontSize.xs,
                fontWeight: BTechFontWeight.semibold,
                letterSpacing: 0.07 * BTechFontSize.xs,
                color: c.text.primary,
              )),
          const SizedBox(height: BTechSpacing.sm),
          Divider(color: c.border.primary, height: 1),
          const SizedBox(height: BTechSpacing.md),
          child,
        ],
      ),
    );
  }
}

// ── Color swatch ─────────────────────────────────────────────────────────────
class _ColorSwatch extends StatelessWidget {
  final String label;
  final Color bg;
  final Color fg;
  final String code;
  final double width;
  const _ColorSwatch(this.label, this.bg, this.fg, this.code, this.width);

  @override
  Widget build(BuildContext context) {
    final r = context.btechRadius;
    return Container(
      width: width,
      height: 72,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(r.card),
        border: Border.all(color: Colors.black.withValues(alpha: 0.08)),
      ),
      padding: const EdgeInsets.all(8),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: TextStyle(
                  fontSize: 11,
                  fontWeight: BTechFontWeight.semibold,
                  color: fg,
                  height: 1.2)),
          Text(code,
              style: TextStyle(
                  fontSize: 8, color: fg.withValues(alpha: 0.75), height: 1.2)),
        ],
      ),
    );
  }
}

// ── Generic token row ─────────────────────────────────────────────────────────
class _TokenRow extends StatelessWidget {
  final Widget child;
  final String code;
  const _TokenRow({required this.child, required this.code});

  @override
  Widget build(BuildContext context) {
    final c = context.btechColor;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: BTechSpacing.xs),
      decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: c.border.primary))),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Flexible(child: child),
          const SizedBox(width: BTechSpacing.md),
          _CodeChip(code, c),
        ],
      ),
    );
  }
}

// ── Stroke pill ───────────────────────────────────────────────────────────────
class _StrokePill extends StatelessWidget {
  final String label;
  final Color strokeColor;
  final BTechColorTheme c;
  final String fontFamily;
  const _StrokePill(this.label, this.strokeColor, this.c, this.fontFamily);

  @override
  Widget build(BuildContext context) {
    final r = context.btechRadius;
    return Container(
      padding: const EdgeInsets.symmetric(
          horizontal: BTechSpacing.md, vertical: BTechSpacing.xs),
      decoration: BoxDecoration(
        border: Border.all(color: strokeColor, width: 1.5),
        borderRadius: BorderRadius.circular(r.interactive),
      ),
      child: Text(label,
          style: TextStyle(
            fontSize: BTechFontSize.sm,
            fontWeight: BTechFontWeight.medium,
            color: c.text.primary,
            fontFamily: fontFamily,
          )),
    );
  }
}

// ── Spacing row ───────────────────────────────────────────────────────────────
class _SpacingRow extends StatelessWidget {
  final String lbl;
  final double size;
  final BTechColorTheme c;
  const _SpacingRow(this.lbl, this.size, this.c);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: BTechSpacing.xs),
      child: Row(children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            color: c.bg.primary,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: BTechSpacing.md),
        _CodeChip('BTechSpacing.$lbl', c),
        const SizedBox(width: BTechSpacing.sm),
        Text('→ ${size.toInt()}px',
            style:
                TextStyle(fontSize: BTechFontSize.xs, color: c.text.primary)),
      ]),
    );
  }
}

// ── Radius box ────────────────────────────────────────────────────────────────
class _RadiusBox extends StatelessWidget {
  final String lbl;
  final double radius;
  final BTechColorTheme c;
  final double width;
  final bool tenant;
  const _RadiusBox(this.lbl, this.radius, this.c, this.width,
      {this.tenant = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: width,
      decoration: BoxDecoration(
        color: c.bg.secondary,
        borderRadius: BorderRadius.circular(radius.clamp(0, width / 2)),
        border: Border.all(color: c.border.primary, width: 1.5),
      ),
      padding: const EdgeInsets.all(6),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Text(lbl,
            textAlign: TextAlign.center,
            style: TextStyle(
                fontSize: 11,
                fontWeight: BTechFontWeight.semibold,
                color: c.text.primary)),
        const SizedBox(height: 2),
        Text('${radius >= 9999 ? '∞' : radius.toInt()}${tenant ? ' ✦' : ''}',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 8, color: c.text.primary)),
      ]),
    );
  }
}

// ── Shadow card ───────────────────────────────────────────────────────────────
class _ShadowCard extends StatelessWidget {
  final String lbl;
  final List<BoxShadow> shadows;
  final BTechColorTheme c;
  final double width;
  const _ShadowCard(this.lbl, this.shadows, this.c, this.width);

  @override
  Widget build(BuildContext context) {
    final r = context.btechRadius;
    return Container(
      width: width,
      height: 80,
      decoration: BoxDecoration(
        color: c.bg.secondary,
        borderRadius: BorderRadius.circular(r.card),
        boxShadow: shadows,
      ),
      padding: const EdgeInsets.all(BTechSpacing.sm),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(lbl,
              style: TextStyle(
                  fontSize: 11,
                  fontWeight: BTechFontWeight.semibold,
                  color: c.text.primary)),
          Text('shadow.$lbl',
              style: TextStyle(fontSize: 9, color: c.text.primary)),
        ],
      ),
    );
  }
}

// ── Motion bar ────────────────────────────────────────────────────────────────
class _MotionBar extends StatefulWidget {
  final String label;
  final Duration duration;
  final String code;
  const _MotionBar(
      {required this.label, required this.duration, required this.code});

  @override
  State<_MotionBar> createState() => _MotionBarState();
}

class _MotionBarState extends State<_MotionBar> {
  bool _active = false;

  @override
  Widget build(BuildContext context) {
    final c = context.btechColor;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: BTechSpacing.sm),
      child: Row(children: [
        MouseRegion(
          onEnter: (_) => setState(() => _active = true),
          onExit: (_) => setState(() => _active = false),
          child: GestureDetector(
            onTapDown: (_) => setState(() => _active = true),
            onTapUp: (_) => setState(() => _active = false),
            onTapCancel: () => setState(() => _active = false),
            child: AnimatedContainer(
              duration: widget.duration,
              curve: Curves.easeInOut,
              width: _active ? 180 : 80,
              height: 24,
              decoration: BoxDecoration(
                color: c.bg.primary,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
        ),
        const SizedBox(width: BTechSpacing.md),
        Expanded(
          child: _CodeChip('${widget.label} · ${widget.code}', c),
        ),
      ]),
    );
  }
}

// ── Code chip ─────────────────────────────────────────────────────────────────
class _CodeChip extends StatelessWidget {
  final String text;
  final BTechColorTheme c;
  const _CodeChip(this.text, this.c);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: c.bg.secondary,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: c.border.primary),
      ),
      child: Text(text,
          style: TextStyle(
              fontFamily: 'monospace', fontSize: 10, color: c.text.primary)),
    );
  }
}
