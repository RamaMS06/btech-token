/// btech_tokens — Multi-tenant design tokens for Flutter (BTech Design System).
///
/// Setup with btechTheme() from your tenant package:
///   MaterialApp(
///     theme:     btechTheme(),
///     darkTheme: btechTheme(brightness: Brightness.dark),
///     themeMode: ThemeMode.system,
///   )
///
/// Access tokens in widgets via context extensions (Pattern C — reactive):
///   context.btechColor.background.primary   // Color
///   context.btechColor.text.neutral.subtle  // Color
///   context.btechRadius.interactive         // double
///   context.btechFont.family.sans           // String
///
/// Or use static classes when context is unavailable (Pattern A — always light):
///   BTechColor.background.primary           // Color
///   BTechRadius.interactive                 // double
library btech_tokens;

export 'src/color/color.dart';
export 'src/spacing/spacing.dart';
export 'src/shadow/shadow.dart';
export 'src/stroke/stroke.dart';
export 'src/radius/radius.dart' hide BTechRadius;
export 'src/radius/radius.theme.dart';
export 'src/typography/typography.dart';
export 'src/defaults.dart';
export 'src/theme_builder.dart';
export 'src/context.dart';
