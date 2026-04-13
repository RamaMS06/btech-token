/// ds_tokens — Multi-tenant design tokens for Flutter.
///
/// Usage:
/// ```dart
/// MaterialApp(
///   theme: DsTheme.forTenant('tenant-a', Brightness.light),
///   home: MyApp(),
/// )
/// ```
library ds_tokens;

export 'src/generated.dart'; // AUTO-GENERATED — run `pnpm generate` to refresh
export 'src/theme.dart';
export 'src/tenant.dart';
