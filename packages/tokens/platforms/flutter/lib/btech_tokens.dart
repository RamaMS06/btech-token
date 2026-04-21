/// btech_tokens — Multi-tenant design tokens for Flutter (BTech Design System).
///
/// Each tenant gets its own isolated package that extends [BtechToken].
/// Register [BTechTokenExtension] once in MaterialApp; then access tokens
/// anywhere via [BuildContext.btechColor], [BuildContext.btechRadius], and
/// [BuildContext.btechFont] — no repeated imports or instance references.
///
/// ```yaml
/// # pubspec.yaml of consuming app (git dependency)
/// dependencies:
///   btech_tokens_bspace:
///     git:
///       url: https://dev.azure.com/buma/.../_git/btech-ds
///       path: packages/tokens/platforms/flutter/tenants/bspace
///       ref: main
/// ```
///
/// ```dart
/// // main.dart — setup once
/// import 'package:btech_tokens_bspace/btech_tokens_bspace.dart';
/// import 'package:btech_tokens/btech_tokens.dart';
///
/// MaterialApp(
///   theme: ThemeData(
///     extensions: [BTechTokenExtension(token: BtechToken.instance)],
///   ),
/// )
///
/// // In any widget — no import of tenant package needed
/// context.btechColor.background.primary   // Color(0xFF0066CC)
/// context.btechColor.text.primary         // Color(0xFFFFFFFF)
/// context.btechRadius.interactive         // 6.0
/// context.btechFont.sans                  // 'Inter'
/// ```
library btech_tokens;

export 'src/color/color.dart';
export 'src/spacing/spacing.dart';
export 'src/radius/radius.dart';
export 'src/typography/typography.dart';
export 'src/btech_token.dart';
export 'src/tenant.dart';
export 'src/theme.dart';
export 'src/context.dart';
