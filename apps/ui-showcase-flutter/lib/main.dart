import 'package:btech_tokens/btech_tokens.dart';
import 'package:flutter/material.dart';
import 'showcases/avatar_showcase.dart';
import 'showcases/loading_skeleton_showcase.dart';

void main() => runApp(const ShowcaseApp());

class ShowcaseApp extends StatefulWidget {
  const ShowcaseApp({super.key});

  @override
  State<ShowcaseApp> createState() => _ShowcaseAppState();
}

class _ShowcaseAppState extends State<ShowcaseApp> {
  Brightness _brightness = Brightness.light;

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
      home: ShowcaseHome(onToggleTheme: _toggleTheme, brightness: _brightness),
    );
  }
}

class ShowcaseHome extends StatelessWidget {
  final VoidCallback onToggleTheme;
  final Brightness brightness;

  const ShowcaseHome({
    super.key,
    required this.onToggleTheme,
    required this.brightness,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: context.btechColor.bg.primary,
      appBar: AppBar(
        backgroundColor: context.btechColor.bg.primary,
        elevation: 0,
        title: Text(
          'BTech UI Showcase',
          style: TextStyle(
            color: context.btechColor.text.primary,
            fontSize: 18,
            fontWeight: FontWeight.w700,
            fontFamily: BTechTypography.fontFamily,
          ),
        ),
        actions: [
          IconButton(
            onPressed: onToggleTheme,
            icon: Icon(
              brightness == Brightness.light
                  ? Icons.dark_mode_outlined
                  : Icons.light_mode_outlined,
              color: context.btechColor.text.secondary,
            ),
            tooltip: 'Toggle dark mode',
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: const SingleChildScrollView(
        padding: EdgeInsets.symmetric(horizontal: 24, vertical: 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            BTAvatarShowcase(),
            BTLoadingSkeletonShowcase(),
            // Add more <NameShowcase /> widgets here as components are sliced
          ],
        ),
      ),
    );
  }
}
