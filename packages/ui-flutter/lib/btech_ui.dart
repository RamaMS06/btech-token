/// btech_ui — Flutter component library for the BTech Design System.
///
/// Components are sliced from Figma frames (see
/// docs/architecture/ui-slicing-pipeline.md) and consume tokens from
/// `package:btech_tokens/btech_tokens.dart`.
///
/// Setup once at app root:
///   MaterialApp(
///     theme:     btechTheme(),
///     darkTheme: btechTheme(brightness: Brightness.dark),
///   )
library btech_ui;

export 'src/avatar/b_avatar.dart';
