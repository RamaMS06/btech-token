import 'package:flutter/material.dart';
import 'tenant.dart';
import 'theme.dart';

/// BuildContext extension — ergonomic token access without tenantId in every widget.
///
/// Set the tenant ONCE at MaterialApp level:
/// ```dart
/// MaterialApp(
///   theme: BTechTheme.forTenant('tenant-a', Brightness.light),
///   home: MyApp(),
/// )
/// ```
///
/// Then anywhere in the tree:
/// ```dart
/// Container(color: context.btechTokens.primaryBg)
/// Text('Hello', style: TextStyle(color: context.btechTokens.textDefault))
/// ```
extension BTechTokensContext on BuildContext {
  /// Returns the [BTechTenantTokens] bound to the nearest [BTechTheme].
  /// Throws if [BTechTheme.forTenant] was not set in the widget tree.
  BTechTenantTokens get btechTokens {
    final ext = Theme.of(this).extension<BTechTokenExtension>();
    assert(
      ext != null,
      'btechTokens called but no BTechTokenExtension found in the theme. '
      'Did you forget to set MaterialApp(theme: BTechTheme.forTenant(...))?',
    );
    return ext!.tokens;
  }

  /// Returns null instead of throwing when no BTechTheme is set.
  /// Useful for components that have a graceful fallback.
  BTechTenantTokens? get btechTokensOrNull =>
      Theme.of(this).extension<BTechTokenExtension>()?.tokens;
}
