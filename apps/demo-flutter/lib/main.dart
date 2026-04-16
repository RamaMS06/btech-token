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
  String _tenantId = 'default';
  void _switchTenant(String id) => setState(() => _tenantId = id);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BTech Token Showcase — Flutter',
      debugShowCheckedModeBanner: false,
      theme: BTechTheme.forTenant(_tenantId, Brightness.light),
      home: ShowcasePage(tenantId: _tenantId, onTenantSwitch: _switchTenant),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shadow primitives (matching shadow.primitive.json — not yet in Dart package)
// ─────────────────────────────────────────────────────────────────────────────
abstract class _Shadow {
  static const List<BoxShadow> sm = [
    BoxShadow(color: Color(0x0D000000), blurRadius: 2,  offset: Offset(0, 1),  spreadRadius: 0),
  ];
  static const List<BoxShadow> md = [
    BoxShadow(color: Color(0x1A000000), blurRadius: 6,  offset: Offset(0, 4),  spreadRadius: -1),
    BoxShadow(color: Color(0x0F000000), blurRadius: 4,  offset: Offset(0, 2),  spreadRadius: -1),
  ];
  static const List<BoxShadow> lg = [
    BoxShadow(color: Color(0x1A000000), blurRadius: 15, offset: Offset(0, 10), spreadRadius: -3),
    BoxShadow(color: Color(0x0D000000), blurRadius: 6,  offset: Offset(0, 4),  spreadRadius: -2),
  ];
  static const List<BoxShadow> xl = [
    BoxShadow(color: Color(0x1A000000), blurRadius: 25, offset: Offset(0, 20), spreadRadius: -5),
    BoxShadow(color: Color(0x0A000000), blurRadius: 10, offset: Offset(0, 10), spreadRadius: -5),
  ];
}

// ── Showcase page ─────────────────────────────────────────────────────────────
class ShowcasePage extends StatelessWidget {
  final String tenantId;
  final ValueChanged<String> onTenantSwitch;
  const ShowcasePage({
    super.key,
    required this.tenantId,
    required this.onTenantSwitch,
  });

  @override
  Widget build(BuildContext context) {
    final t = context.btechTokens;
    final c = context.btechColor;
    final r = context.btechRadius;
    final f = context.btechFont;

    return Scaffold(
      backgroundColor: c.background.surface,
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
                  'BTechTenantTokens · Full Token Showcase · Flutter',
                  textAlign: TextAlign.center,
                  style: f.heading.h4,
                ),
                const SizedBox(height: BTechSpacing.sm),
                Text(
                  'Every style below is driven by BTechTenantTokens — type-safe, tenant-aware',
                  textAlign: TextAlign.center,
                  style: f.body.medium,
                ),
                const SizedBox(height: BTechSpacing.md),
                _TenantSwitcher(current: tenantId, onSwitch: onTenantSwitch),
                const SizedBox(height: BTechSpacing.xl),

                // ── Color · Background ───────────────────────────────────
                _Section(
                  title: 'COLOR · BACKGROUND',
                  child: LayoutBuilder(builder: (ctx, box) {
                    final cols = (box.maxWidth / 120).floor().clamp(2, 7);
                    final w = (box.maxWidth - (cols - 1) * BTechSpacing.sm) / cols;
                    return Wrap(
                      spacing: BTechSpacing.sm,
                      runSpacing: BTechSpacing.sm,
                      children: [
                        _ColorSwatch('primary',   c.background.primary,          c.text.on.primary,       'c.background.primary',         w),
                        _ColorSwatch('secondary', c.background.secondary,        c.text.neutral,          'c.background.secondary',       w),
                        _ColorSwatch('danger',    c.background.danger,           c.text.on.danger,        'c.background.danger',          w),
                        _ColorSwatch('success',   BTechColor.background.success, BTechColor.text.on,      'BTechColor.background.success', w),
                        _ColorSwatch('warning',   BTechColor.background.warning, BTechColor.text.neutral, 'BTechColor.background.warning', w),
                        _ColorSwatch('surface',   c.background.surface,         c.text.neutral,           'c.background.surface',         w),
                        _ColorSwatch('raised',    c.background.surface.raised,  c.text.neutral,           'c.background.surface.raised',  w),
                      ],
                    );
                  }),
                ),
                const SizedBox(height: BTechSpacing.lg),

                // ── Color · Text ─────────────────────────────────────────
                _Section(
                  title: 'COLOR · TEXT',
                  child: Column(children: [
                    _TokenRow(code: 'c.text.neutral',
                      child: Text('The quick brown fox — neutral',  style: TextStyle(color: c.text.neutral,          fontSize: BTechFontSize.base, fontFamily: t.typographyFontFamilySans))),
                    _TokenRow(code: 'c.text.neutral.subtle',
                      child: Text('The quick brown fox — subtle',   style: TextStyle(color: c.text.neutral.subtle,   fontSize: BTechFontSize.base, fontFamily: t.typographyFontFamilySans))),
                    _TokenRow(code: 'c.text.neutral.disabled',
                      child: Text('The quick brown fox — disabled', style: TextStyle(color: c.text.neutral.disabled, fontSize: BTechFontSize.base, fontFamily: t.typographyFontFamilySans))),
                    _TokenRow(code: 'BTechColor.text.danger',
                      child: Text('The quick brown fox — danger',   style: TextStyle(color: BTechColor.text.danger,  fontSize: BTechFontSize.base, fontFamily: t.typographyFontFamilySans))),
                    _TokenRow(code: 'BTechColor.text.success',
                      child: Text('The quick brown fox — success',  style: TextStyle(color: BTechColor.text.success, fontSize: BTechFontSize.base, fontFamily: t.typographyFontFamilySans))),
                    _TokenRow(code: 'BTechColor.text.warning',
                      child: Text('The quick brown fox — warning',  style: TextStyle(color: BTechColor.text.warning, fontSize: BTechFontSize.base, fontFamily: t.typographyFontFamilySans))),
                  ]),
                ),
                const SizedBox(height: BTechSpacing.lg),

                // ── Color · Border / Stroke ──────────────────────────────
                _Section(
                  title: 'COLOR · BORDER / STROKE',
                  child: Column(children: [
                    _TokenRow(code: "token('color.stroke.neutral')",
                      child: _StrokePill('neutral',        c.stroke.neutral,         c, t)),
                    _TokenRow(code: "token('color.stroke.neutral.strong')",
                      child: _StrokePill('neutral.strong', c.stroke.neutral.strong,  c, t)),
                    _TokenRow(code: "token('color.stroke.primary')",
                      child: _StrokePill('primary',        c.stroke.primary,         c, t)),
                    _TokenRow(code: "token('color.stroke.danger')",
                      child: _StrokePill('danger',         BTechColor.stroke.danger, c, t)),
                  ]),
                ),
                const SizedBox(height: BTechSpacing.lg),

                // ── Spacing ──────────────────────────────────────────────
                _Section(
                  title: 'SPACING',
                  child: Column(children: [
                    for (final s in [
                      ('xs',  BTechSpacing.xs),  ('sm',  BTechSpacing.sm),
                      ('md',  BTechSpacing.md),  ('lg',  BTechSpacing.lg),
                      ('xl',  BTechSpacing.xl),  ('xl2', BTechSpacing.xl2),
                      ('xl3', BTechSpacing.xl3),
                    ]) _SpacingRow(s.$1, s.$2, c),
                  ]),
                ),
                const SizedBox(height: BTechSpacing.lg),

                // ── Typography · Font Family ─────────────────────────────
                _Section(
                  title: 'TYPOGRAPHY · FONT FAMILY',
                  child: Column(children: [
                    _TokenRow(
                      code: "t.typographyFontFamilySans",
                      child: Text('Sans: The quick brown fox jumps over the lazy dog',
                          style: TextStyle(fontFamily: t.typographyFontFamilySans, fontSize: BTechFontSize.base, color: c.text.neutral))),
                    _TokenRow(
                      code: "BTechFontFamily.mono",
                      child: Text("Mono: const t = BTechTenantTokens.forTenant('default')",
                          style: TextStyle(fontFamily: BTechFontFamily.mono, fontSize: BTechFontSize.base, color: c.text.neutral))),
                  ]),
                ),
                const SizedBox(height: BTechSpacing.lg),

                // ── Typography · Font Size ───────────────────────────────
                _Section(
                  title: 'TYPOGRAPHY · FONT SIZE',
                  child: Column(children: [
                    for (final s in [
                      ('xs',   BTechFontSize.xs),   ('sm',   BTechFontSize.sm),
                      ('base', BTechFontSize.base),  ('lg',   BTechFontSize.lg),
                      ('xl',   BTechFontSize.xl),   ('2xl',  BTechFontSize.s2xl),
                      ('3xl',  BTechFontSize.s3xl),
                    ])
                      _TokenRow(
                        code: 'BTechFontSize.${s.$1}',
                        child: Text('Aa — ${s.$1}',
                            style: TextStyle(fontSize: s.$2, color: c.text.neutral, fontFamily: t.typographyFontFamilySans))),
                  ]),
                ),
                const SizedBox(height: BTechSpacing.lg),

                // ── Typography · Font Weight ─────────────────────────────
                _Section(
                  title: 'TYPOGRAPHY · FONT WEIGHT',
                  child: Column(children: [
                    for (final w in [
                      ('regular',  BTechFontWeight.regular),  ('medium',   BTechFontWeight.medium),
                      ('semibold', BTechFontWeight.semibold), ('bold',     BTechFontWeight.bold),
                    ])
                      _TokenRow(
                        code: 'BTechFontWeight.${w.$1}',
                        child: Text('The quick brown fox — ${w.$1}',
                            style: TextStyle(fontWeight: w.$2, fontSize: BTechFontSize.base, color: c.text.neutral, fontFamily: t.typographyFontFamilySans))),
                  ]),
                ),
                const SizedBox(height: BTechSpacing.lg),

                // ── Typography · Semantic Styles (context.btechFont) ─────
                _Section(
                  title: 'TYPOGRAPHY · SEMANTIC STYLES — context.btechFont',
                  child: Column(children: [
                    // Heading
                    _TokenRow(code: 'context.btechFont.heading.h1',
                      child: Text('Heading H1 — 35px bold', style: context.btechFont.heading.h1)),
                    _TokenRow(code: 'context.btechFont.heading.h2',
                      child: Text('Heading H2 — 29px w600', style: context.btechFont.heading.h2)),
                    _TokenRow(code: 'context.btechFont.heading.h3',
                      child: Text('Heading H3 — 24px bold', style: context.btechFont.heading.h3)),
                    _TokenRow(code: 'context.btechFont.heading.h4',
                      child: Text('Heading H4 — 20px w500', style: context.btechFont.heading.h4)),
                    // Subheading
                    _TokenRow(code: 'context.btechFont.subheading.h5',
                      child: Text('Subheading H5 — 16px bold', style: context.btechFont.subheading.h5)),
                    _TokenRow(code: 'context.btechFont.subheading.h6',
                      child: Text('Subheading H6 — 14px w600', style: context.btechFont.subheading.h6)),
                    _TokenRow(code: 'context.btechFont.subheading.h7',
                      child: Text('Subheading H7 — 12px w600', style: context.btechFont.subheading.h7)),
                    // Body
                    _TokenRow(code: 'context.btechFont.body.base',
                      child: Text('Body base — 12px w500', style: context.btechFont.body.base)),
                    _TokenRow(code: 'context.btechFont.body.bold',
                      child: Text('Body bold — 12px bold', style: context.btechFont.body.bold)),
                    _TokenRow(code: 'context.btechFont.body.medium',
                      child: Text('Body medium — 14px w500', style: context.btechFont.body.medium)),
                    _TokenRow(code: 'context.btechFont.body.small',
                      child: Text('Body small — 11px w500', style: context.btechFont.body.small)),
                    _TokenRow(code: 'context.btechFont.body.xstraSmall',
                      child: Text('Body xstraSmall — 8px w500', style: context.btechFont.body.xstraSmall)),
                    _TokenRow(code: 'context.btechFont.body.italic',
                      child: Text('Body italic — 12px italic', style: context.btechFont.body.italic)),
                    _TokenRow(code: 'context.btechFont.body.underline',
                      child: Text('Body underline — 12px w600', style: context.btechFont.body.underline)),
                    _TokenRow(code: 'context.btechFont.body.paragraph',
                      child: Text('Body paragraph — relaxed 2.0 line-height', style: context.btechFont.body.paragraph)),
                  ]),
                ),
                const SizedBox(height: BTechSpacing.lg),

                // ── Radius ───────────────────────────────────────────────
                _Section(
                  title: 'RADIUS',
                  child: LayoutBuilder(builder: (ctx, box) {
                    final cols = (box.maxWidth / 110).floor().clamp(2, 8);
                    final w = (box.maxWidth - (cols - 1) * BTechSpacing.sm) / cols;
                    return Wrap(
                      spacing: BTechSpacing.sm,
                      runSpacing: BTechSpacing.sm,
                      children: [
                        for (final rx in [
                          ('none',        BTechRadius.none,  false),
                          ('sm',          BTechRadius.sm,    false),
                          ('md',          BTechRadius.md,    false),
                          ('lg',          BTechRadius.lg,    false),
                          ('xl',          BTechRadius.xl,    false),
                          ('full',        BTechRadius.full,  false),
                          ('interactive', r.interactive,     true),
                          ('card',        r.card,            true),
                          ('badge',       r.badge,           true),
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
                    final w = (box.maxWidth - (cols - 1) * BTechSpacing.md) / cols;
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
                  title: 'MOTION · DURATION — tap the bar',
                  child: Column(children: [
                    _MotionBar(label: 'fast',   duration: const Duration(milliseconds: 100), code: "BTechMotion.fast   → 100ms", c: null),
                    _MotionBar(label: 'normal', duration: const Duration(milliseconds: 200), code: "BTechMotion.normal → 200ms", c: null),
                    _MotionBar(label: 'slow',   duration: const Duration(milliseconds: 400), code: "BTechMotion.slow   → 400ms", c: null),
                  ]),
                ),
                const SizedBox(height: BTechSpacing.lg),

                // ── Footer ───────────────────────────────────────────────
                Container(
                  padding: const EdgeInsets.all(BTechSpacing.md),
                  decoration: BoxDecoration(
                    color: c.background.surface.subtle,
                    borderRadius: BorderRadius.circular(r.card),
                    border: Border.all(color: c.stroke.neutral),
                  ),
                  child: Text(
                    'BTechTheme.forTenant("$tenantId") → ThemeData · font: ${t.typographyFontFamilySans}',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: BTechFontSize.xs, color: c.text.neutral.subtle, fontFamily: 'monospace'),
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

// ── Tenant switcher ───────────────────────────────────────────────────────────
class _TenantSwitcher extends StatelessWidget {
  final String current;
  final ValueChanged<String> onSwitch;
  const _TenantSwitcher({required this.current, required this.onSwitch});

  @override
  Widget build(BuildContext context) {
    final c = context.btechColor;
    final r = context.btechRadius;
    const tenants = [
      ('default',    'Default'),
      ('tenant-a',   'Tenant A'),
      ('tenant-bjb', 'Tenant BJB'),
    ];
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text('Tenant:', style: TextStyle(fontSize: BTechFontSize.sm, color: c.text.neutral.subtle)),
        const SizedBox(width: BTechSpacing.sm),
        ...tenants.map((pair) {
          final isActive = pair.$1 == current;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => onSwitch(pair.$1),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(
                    horizontal: BTechSpacing.md, vertical: BTechSpacing.xs),
                decoration: BoxDecoration(
                  color: isActive ? c.background.primary : c.background.surface.raised,
                  borderRadius: BorderRadius.circular(r.interactive),
                  border: Border.all(
                    color: isActive ? c.stroke.primary : c.stroke.neutral,
                    width: 1.5,
                  ),
                ),
                child: Text(pair.$2, style: TextStyle(
                  fontSize: BTechFontSize.sm,
                  fontWeight: isActive ? BTechFontWeight.semibold : BTechFontWeight.regular,
                  color: isActive ? c.text.on.primary : c.text.neutral,
                )),
              ),
            ),
          );
        }),
      ],
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
        color: c.background.surface.raised,
        borderRadius: BorderRadius.circular(r.card),
        border: Border.all(color: c.stroke.neutral),
        boxShadow: _Shadow.sm,
      ),
      padding: const EdgeInsets.all(BTechSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: TextStyle(
            fontSize: BTechFontSize.xs,
            fontWeight: BTechFontWeight.semibold,
            letterSpacing: 0.07 * BTechFontSize.xs,
            color: c.text.neutral.subtle,
          )),
          const SizedBox(height: BTechSpacing.sm),
          Divider(color: c.stroke.neutral, height: 1),
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
          Text(label, style: TextStyle(fontSize: 11, fontWeight: BTechFontWeight.semibold, color: fg, height: 1.2)),
          Text(code,  style: TextStyle(fontSize: 8,  color: fg.withValues(alpha: 0.75),   height: 1.2)),
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
          border: Border(bottom: BorderSide(color: c.stroke.neutral))),
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
  final BTechContextColor c;
  final BTechTenantTokens t;
  const _StrokePill(this.label, this.strokeColor, this.c, this.t);

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
      child: Text(label, style: TextStyle(
        fontSize: BTechFontSize.sm,
        fontWeight: BTechFontWeight.medium,
        color: c.text.neutral,
        fontFamily: t.typographyFontFamilySans,
      )),
    );
  }
}

// ── Spacing row ───────────────────────────────────────────────────────────────
class _SpacingRow extends StatelessWidget {
  final String lbl;
  final double size;
  final BTechContextColor c;
  const _SpacingRow(this.lbl, this.size, this.c);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: BTechSpacing.xs),
      child: Row(children: [
        Container(
          width: size, height: size,
          decoration: BoxDecoration(
            color: c.background.primary,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: BTechSpacing.md),
        _CodeChip('BTechSpacing.$lbl', c),
        const SizedBox(width: BTechSpacing.sm),
        Text('→ ${size.toInt()}px',
            style: TextStyle(fontSize: BTechFontSize.xs, color: c.text.neutral.subtle)),
      ]),
    );
  }
}

// ── Radius box ────────────────────────────────────────────────────────────────
class _RadiusBox extends StatelessWidget {
  final String lbl;
  final double radius;
  final BTechContextColor c;
  final double width;
  final bool tenant;
  const _RadiusBox(this.lbl, this.radius, this.c, this.width, {this.tenant = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: width, // square
      decoration: BoxDecoration(
        color: c.background.secondary,
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: c.stroke.primary, width: 1.5),
      ),
      padding: const EdgeInsets.all(6),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Text(lbl,
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 11, fontWeight: BTechFontWeight.semibold, color: c.text.neutral)),
        const SizedBox(height: 2),
        Text('${radius == 9999 ? '9999' : radius.toInt()}${tenant ? ' (tenant)' : ''}',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 8, color: c.text.neutral.subtle)),
      ]),
    );
  }
}

// ── Shadow card ───────────────────────────────────────────────────────────────
class _ShadowCard extends StatelessWidget {
  final String lbl;
  final List<BoxShadow> shadows;
  final BTechContextColor c;
  final double width;
  const _ShadowCard(this.lbl, this.shadows, this.c, this.width);

  @override
  Widget build(BuildContext context) {
    final r = context.btechRadius;
    return Container(
      width: width,
      height: 80,
      decoration: BoxDecoration(
        color: c.background.surface.raised,
        borderRadius: BorderRadius.circular(r.md),
        boxShadow: shadows,
      ),
      padding: const EdgeInsets.all(BTechSpacing.sm),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(lbl,
              style: TextStyle(fontSize: 11, fontWeight: BTechFontWeight.semibold, color: c.text.neutral)),
          Text('shadow.$lbl',
              style: TextStyle(fontSize: 9, color: c.text.neutral.subtle)),
        ],
      ),
    );
  }
}

// ── Motion bar (StatefulWidget for animation) ────────────────────────────────
class _MotionBar extends StatefulWidget {
  final String label;
  final Duration duration;
  final String code;
  final BTechContextColor? c; // passed but we use context.btechColor inside
  const _MotionBar({required this.label, required this.duration, required this.code, required this.c});

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
          onExit:  (_) => setState(() => _active = false),
          child: GestureDetector(
            onTapDown: (_) => setState(() => _active = true),
            onTapUp:   (_) => setState(() => _active = false),
            onTapCancel: () => setState(() => _active = false),
            child: AnimatedContainer(
              duration: widget.duration,
              curve: Curves.easeInOut,
              width: _active ? 180 : 80,
              height: 24,
              decoration: BoxDecoration(
                color: c.background.primary,
                borderRadius: BorderRadius.circular(BTechRadius.sm),
              ),
            ),
          ),
        ),
        const SizedBox(width: BTechSpacing.md),
        Expanded(
          child: Row(children: [
            _CodeChip(widget.code, c),
            const SizedBox(width: BTechSpacing.sm),
            Text('— ${widget.label}',
                style: TextStyle(fontSize: BTechFontSize.xs, color: c.text.neutral.subtle)),
          ]),
        ),
      ]),
    );
  }
}

// ── Code chip ─────────────────────────────────────────────────────────────────
class _CodeChip extends StatelessWidget {
  final String text;
  final BTechContextColor c;
  const _CodeChip(this.text, this.c);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: c.background.surface.subtle,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: c.stroke.neutral),
      ),
      child: Text(text,
          style: TextStyle(fontFamily: 'monospace', fontSize: 10, color: c.text.neutral.subtle)),
    );
  }
}

// ── BTechContextRadius extension (for named r.md access) ─────────────────────
extension _RadiusExt on BTechContextRadius {
  double get md => BTechRadius.md;
}
