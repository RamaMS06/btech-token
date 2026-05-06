import 'package:btech_tokens/btech_tokens.dart';
import 'package:flutter/material.dart';
import 'showcases/avatar_showcase.dart';
import 'showcases/badge_showcase.dart';
import 'showcases/button_link_showcase.dart';
import 'showcases/button_showcase.dart';
import 'showcases/checkbox_showcase.dart';
import 'showcases/hint_showcase.dart';
import 'showcases/loading_skeleton_showcase.dart';
import 'showcases/radio_button_showcase.dart';

void main() => runApp(const ShowcaseApp());

// ── Sidebar page registry ─────────────────────────────────────────────────────
// Add new entries here as components are sliced.

class _ShowcasePage {
  const _ShowcasePage({
    required this.group,
    required this.label,
    required this.child,
  });

  final String group;
  final String label;
  final Widget child;
}

const _pages = <_ShowcasePage>[
  _ShowcasePage(
    group: 'Atoms',
    label: 'Badge',
    child: BTBadgeShowcase(),
  ),
  _ShowcasePage(
    group: 'Atoms',
    label: 'Button',
    child: BTButtonShowcase(),
  ),
  _ShowcasePage(
    group: 'Atoms',
    label: 'Button Link',
    child: BTButtonLinkShowcase(),
  ),
  _ShowcasePage(
    group: 'Atoms',
    label: 'Checkbox',
    child: BTCheckboxShowcase(),
  ),
  _ShowcasePage(
    group: 'Atoms',
    label: 'Hint',
    child: BTHintShowcase(),
  ),
  _ShowcasePage(
    group: 'Atoms',
    label: 'Radio Button',
    child: BTRadioButtonShowcase(),
  ),
  _ShowcasePage(
    group: 'Molecules',
    label: 'Avatar',
    child: BTAvatarShowcase(),
  ),
  _ShowcasePage(
    group: 'Molecules',
    label: 'Loading',
    child: BTLoadingSkeletonShowcase(),
  ),
];

// ── App ───────────────────────────────────────────────────────────────────────

class ShowcaseApp extends StatefulWidget {
  const ShowcaseApp({super.key});

  @override
  State<ShowcaseApp> createState() => _ShowcaseAppState();
}

class _ShowcaseAppState extends State<ShowcaseApp> {
  Brightness _brightness = Brightness.light;
  int _selectedIndex = 0;

  void _toggleTheme() => setState(() {
        _brightness = _brightness == Brightness.light
            ? Brightness.dark
            : Brightness.light;
      });

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'BTech UI Showcase',
      debugShowCheckedModeBanner: false,
      theme: btechTheme(brightness: Brightness.light),
      darkTheme: btechTheme(brightness: Brightness.dark),
      themeMode: _brightness == Brightness.light
          ? ThemeMode.light
          : ThemeMode.dark,
      home: _ShowcaseShell(
        brightness: _brightness,
        selectedIndex: _selectedIndex,
        onToggleTheme: _toggleTheme,
        onSelect: (i) => setState(() => _selectedIndex = i),
      ),
    );
  }
}

// ── Responsive shell ──────────────────────────────────────────────────────────
// ≥ 600 dp → persistent sidebar (desktop / tablet landscape)
// < 600 dp → Scaffold drawer (phone)

class _ShowcaseShell extends StatelessWidget {
  const _ShowcaseShell({
    required this.brightness,
    required this.selectedIndex,
    required this.onToggleTheme,
    required this.onSelect,
  });

  final Brightness brightness;
  final int selectedIndex;
  final VoidCallback onToggleTheme;
  final ValueChanged<int> onSelect;

  // Breakpoint: anything narrower than 600 dp gets the drawer layout.
  static const double _sidebarBreakpoint = 600;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isMobile = constraints.maxWidth < _sidebarBreakpoint;
        return isMobile
            ? _MobileLayout(
                brightness: brightness,
                selectedIndex: selectedIndex,
                onToggleTheme: onToggleTheme,
                onSelect: onSelect,
              )
            : _DesktopLayout(
                brightness: brightness,
                selectedIndex: selectedIndex,
                onToggleTheme: onToggleTheme,
                onSelect: onSelect,
              );
      },
    );
  }
}

// ── Desktop layout (persistent sidebar) ──────────────────────────────────────

class _DesktopLayout extends StatelessWidget {
  const _DesktopLayout({
    required this.brightness,
    required this.selectedIndex,
    required this.onToggleTheme,
    required this.onSelect,
  });

  final Brightness brightness;
  final int selectedIndex;
  final VoidCallback onToggleTheme;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    final colors = context.btechColor;

    return Scaffold(
      backgroundColor: colors.bg.primary,
      body: Column(
        children: [
          _ShowcaseHeader(
            brightness: brightness,
            onToggleTheme: onToggleTheme,
          ),
          Expanded(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _ShowcaseSidebar(
                  selectedIndex: selectedIndex,
                  onSelect: onSelect,
                ),
                VerticalDivider(
                  width: 1,
                  thickness: 1,
                  color: colors.border.primary,
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 40,
                      vertical: 32,
                    ),
                    child: _pages[selectedIndex].child,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Mobile layout (drawer) ────────────────────────────────────────────────────

class _MobileLayout extends StatelessWidget {
  const _MobileLayout({
    required this.brightness,
    required this.selectedIndex,
    required this.onToggleTheme,
    required this.onSelect,
  });

  final Brightness brightness;
  final int selectedIndex;
  final VoidCallback onToggleTheme;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    final colors = context.btechColor;

    return Scaffold(
      backgroundColor: colors.bg.primary,
      appBar: AppBar(
        backgroundColor: colors.bg.primary,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Divider(
            height: 1,
            thickness: 1,
            color: colors.border.primary,
          ),
        ),
        title: Row(
          children: [
            Text(
              'BTech UI',
              style: TextStyle(
                color: colors.text.primary,
                fontSize: 15,
                fontWeight: FontWeight.w700,
                fontFamily: BTechTypography.fontFamily,
                letterSpacing: -0.01,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              '— showcase',
              style: TextStyle(
                color: colors.text.secondary,
                fontSize: 12,
                fontFamily: BTechTypography.fontFamily,
              ),
            ),
          ],
        ),
        // Hamburger icon uses token colour, not the default Material style.
        iconTheme: IconThemeData(color: colors.text.secondary),
        actions: [
          _ThemeToggleButton(
            brightness: brightness,
            onTap: onToggleTheme,
          ),
          const SizedBox(width: 8),
        ],
      ),
      drawer: Drawer(
        backgroundColor: colors.bg.subtle,
        child: SafeArea(
          child: _ShowcaseSidebar(
            selectedIndex: selectedIndex,
            onSelect: (i) {
              // Close drawer then update selection.
              Navigator.of(context).pop();
              onSelect(i);
            },
          ),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(
            horizontal: 20,
            vertical: 24,
          ),
          child: _pages[selectedIndex].child,
        ),
      ),
      // Bottom bar shows the current component name — handy on small screens.
      bottomNavigationBar: Container(
        height: 44,
        decoration: BoxDecoration(
          color: colors.bg.subtle,
          border: Border(
            top: BorderSide(color: colors.border.primary),
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Row(
          children: [
            Icon(
              Icons.layers_outlined,
              size: 14,
              color: colors.text.tertiary,
            ),
            const SizedBox(width: 6),
            Text(
              '${_pages[selectedIndex].group}  ›  '
              '${_pages[selectedIndex].label}',
              style: TextStyle(
                fontSize: 11,
                fontFamily: BTechTypography.fontFamily,
                color: colors.text.tertiary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Header (desktop only) ─────────────────────────────────────────────────────

class _ShowcaseHeader extends StatelessWidget {
  const _ShowcaseHeader({
    required this.brightness,
    required this.onToggleTheme,
  });

  final Brightness brightness;
  final VoidCallback onToggleTheme;

  @override
  Widget build(BuildContext context) {
    final colors = context.btechColor;

    return Container(
      height: 48,
      decoration: BoxDecoration(
        color: colors.bg.primary,
        border: Border(
          bottom: BorderSide(color: colors.border.primary),
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          Text(
            'BTech UI',
            style: TextStyle(
              color: colors.text.primary,
              fontSize: 15,
              fontWeight: FontWeight.w700,
              fontFamily: BTechTypography.fontFamily,
              letterSpacing: -0.01,
            ),
          ),
          const SizedBox(width: 8),
          Text(
            '— component gallery (Flutter)',
            style: TextStyle(
              color: colors.text.secondary,
              fontSize: 12,
              fontFamily: BTechTypography.fontFamily,
            ),
          ),
          const Spacer(),
          _ThemeToggleButton(
            brightness: brightness,
            onTap: onToggleTheme,
          ),
        ],
      ),
    );
  }
}

// ── Theme toggle button ───────────────────────────────────────────────────────

class _ThemeToggleButton extends StatelessWidget {
  const _ThemeToggleButton({
    required this.brightness,
    required this.onTap,
  });

  final Brightness brightness;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = context.btechColor;
    final isLight = brightness == Brightness.light;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
        decoration: BoxDecoration(
          border: Border.all(color: colors.border.primary),
          borderRadius: BorderRadius.circular(999),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              isLight
                  ? Icons.dark_mode_outlined
                  : Icons.light_mode_outlined,
              size: 14,
              color: colors.text.secondary,
            ),
            const SizedBox(width: 6),
            Text(
              isLight ? 'Dark' : 'Light',
              style: TextStyle(
                color: colors.text.secondary,
                fontSize: 12,
                fontWeight: FontWeight.w500,
                fontFamily: BTechTypography.fontFamily,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Sidebar (shared between desktop + drawer) ─────────────────────────────────

class _ShowcaseSidebar extends StatelessWidget {
  const _ShowcaseSidebar({
    required this.selectedIndex,
    required this.onSelect,
  });

  final int selectedIndex;
  final ValueChanged<int> onSelect;

  @override
  Widget build(BuildContext context) {
    final colors = context.btechColor;

    // Group pages by group label, preserving order.
    final groups = <String, List<({int index, _ShowcasePage page})>>{};
    for (var i = 0; i < _pages.length; i++) {
      final p = _pages[i];
      groups.putIfAbsent(p.group, () => []).add((index: i, page: p));
    }

    return SizedBox(
      width: 220,
      child: ColoredBox(
        color: colors.bg.subtle,
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 16),
          children: [
            for (final entry in groups.entries) ...[
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
                child: Text(
                  entry.key.toUpperCase(),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.08,
                    color: colors.text.tertiary,
                    fontFamily: BTechTypography.fontFamily,
                  ),
                ),
              ),
              for (final item in entry.value)
                _SidebarItem(
                  label: item.page.label,
                  isActive: item.index == selectedIndex,
                  onTap: () => onSelect(item.index),
                ),
              const SizedBox(height: 8),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Sidebar item ──────────────────────────────────────────────────────────────

class _SidebarItem extends StatefulWidget {
  const _SidebarItem({
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  final String label;
  final bool isActive;
  final VoidCallback onTap;

  @override
  State<_SidebarItem> createState() => _SidebarItemState();
}

class _SidebarItemState extends State<_SidebarItem> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    final colors = context.btechColor;
    final isActive = widget.isActive;

    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: Container(
          decoration: BoxDecoration(
            color: isActive || _hovered
                ? colors.bg.primary
                : Colors.transparent,
            border: Border(
              left: BorderSide(
                color: isActive
                    ? colors.text.primary
                    : Colors.transparent,
                width: 2,
              ),
            ),
          ),
          padding: EdgeInsets.fromLTRB(
            isActive ? 14 : 16,
            10,
            16,
            10,
          ),
          child: Text(
            widget.label,
            style: TextStyle(
              fontSize: 13,
              fontWeight:
                  isActive ? FontWeight.w600 : FontWeight.w400,
              color: isActive
                  ? colors.text.primary
                  : colors.text.secondary,
              fontFamily: BTechTypography.fontFamily,
            ),
          ),
        ),
      ),
    );
  }
}
