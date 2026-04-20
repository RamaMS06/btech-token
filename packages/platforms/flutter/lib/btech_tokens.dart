/// btech_tokens — Multi-tenant design tokens for Flutter (BTech Design System).
///
/// Usage:
/// ```dart
/// MaterialApp(
///   theme: BTechTheme.forTenant('tenant-a', Brightness.light),
///   home: MyApp(),
/// )
/// ```
library btech_tokens;

export 'src/color/color.dart';
export 'src/spacing/spacing.dart';
export 'src/radius/radius.dart';
export 'src/typography/typography.dart';
export 'src/theme.dart';
export 'src/tenant.dart';
export 'src/context.dart';
