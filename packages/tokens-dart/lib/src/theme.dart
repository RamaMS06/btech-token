import 'package:flutter/material.dart';
import 'tenant.dart';
import 'tokens.dart';

/// ThemeExtension that carries tenant tokens into the widget tree.
/// Access via: Theme.of(context).extension<DsTokenExtension>()!
class DsTokenExtension extends ThemeExtension<DsTokenExtension> {
  final DsTenantTokens tokens;

  const DsTokenExtension({required this.tokens});

  @override
  DsTokenExtension copyWith({DsTenantTokens? tokens}) {
    return DsTokenExtension(tokens: tokens ?? this.tokens);
  }

  @override
  DsTokenExtension lerp(DsTokenExtension? other, double t) {
    // Tokens are discrete values — no interpolation needed.
    return t < 0.5 ? this : (other ?? this);
  }
}

/// Entry point for tenant theming in Flutter.
///
/// Usage:
/// ```dart
/// MaterialApp(
///   theme: DsTheme.forTenant('tenant-a', Brightness.light),
///   home: MyApp(),
/// )
/// ```
abstract class DsTheme {
  /// Returns a [ThemeData] configured for the given tenant and brightness.
  static ThemeData forTenant(String tenantId, Brightness brightness) {
    final t = DsTenantTokens.forTenant(tenantId);

    final colorScheme = ColorScheme(
      brightness: brightness,
      primary:          t.primaryBg,
      onPrimary:        t.primaryFg,
      secondary:        t.secondaryBg,
      onSecondary:      t.secondaryFg,
      error:            t.dangerBg,
      onError:          t.dangerFg,
      surface:          t.surfaceDefault,
      onSurface:        t.textDefault,
    );

    return ThemeData(
      colorScheme: colorScheme,
      useMaterial3: true,
      fontFamily: t.fontFamilySans,
      scaffoldBackgroundColor: t.surfaceDefault,

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: t.primaryBg,
          foregroundColor: t.primaryFg,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(t.radiusInteractive),
          ),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: t.primaryBg,
          side: BorderSide(color: t.primaryBorder),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(t.radiusInteractive),
          ),
        ),
      ),

      cardTheme: CardTheme(
        color: t.surfaceRaised,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(t.radiusCard),
          side: BorderSide(color: t.borderDefault),
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: t.surfaceSubtle,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(t.radiusInteractive),
          borderSide: BorderSide(color: t.borderDefault),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(t.radiusInteractive),
          borderSide: BorderSide(color: t.borderDefault),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(t.radiusInteractive),
          borderSide: BorderSide(color: t.primaryBg, width: 2),
        ),
      ),

      textTheme: TextTheme(
        bodyMedium: TextStyle(
          fontFamily: t.fontFamilySans,
          fontSize: DsPrimitiveTypography.fontSizeBase,
          color: t.textDefault,
        ),
        bodySmall: TextStyle(
          fontFamily: t.fontFamilySans,
          fontSize: DsPrimitiveTypography.fontSizeSm,
          color: t.textSubtle,
        ),
        labelMedium: TextStyle(
          fontFamily: t.fontFamilySans,
          fontSize: DsPrimitiveTypography.fontSizeSm,
          fontWeight: DsPrimitiveTypography.fontWeightMedium,
          color: t.textDefault,
        ),
        titleLarge: TextStyle(
          fontFamily: t.fontFamilySans,
          fontSize: DsPrimitiveTypography.fontSizeXl,
          fontWeight: DsPrimitiveTypography.fontWeightBold,
          color: t.textDefault,
        ),
      ),

      extensions: [
        DsTokenExtension(tokens: t),
      ],
    );
  }
}
