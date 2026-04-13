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

export 'src/generated.dart'; // AUTO-GENERATED — run `pnpm generate` to refresh
export 'src/theme.dart';
export 'src/tenant.dart';
