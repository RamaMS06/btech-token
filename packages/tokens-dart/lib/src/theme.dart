import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'typography/font.token.dart';
import 'tenant.dart';

/// ThemeExtension that carries tenant tokens into the widget tree.
/// Access via: Theme.of(context).extension<BTechTokenExtension>()!
class BTechTokenExtension extends ThemeExtension<BTechTokenExtension> {
  final BTechTenantTokens tokens;

  const BTechTokenExtension({required this.tokens});

  @override
  BTechTokenExtension copyWith({BTechTenantTokens? tokens}) {
    return BTechTokenExtension(tokens: tokens ?? this.tokens);
  }

  @override
  BTechTokenExtension lerp(BTechTokenExtension? other, double t) {
    return t < 0.5 ? this : (other ?? this);
  }
}

/// Entry point for tenant theming in Flutter.
///
/// Usage:
/// ```dart
/// MaterialApp(
///   theme: BTechTheme.forTenant('tenant-bjb', Brightness.light),
///   home: MyApp(),
/// )
/// ```
abstract class BTechTheme {
  static ThemeData forTenant(String tenantId, Brightness brightness) {
    final t = BTechTenantTokens.forTenant(tenantId);

    final colorScheme = ColorScheme(
      brightness:  brightness,
      primary:     t.colorBackgroundPrimary,
      onPrimary:   t.colorTextOnPrimary,
      secondary:   t.colorBackgroundSecondary,
      onSecondary: t.colorTextOnSecondary,
      error:       t.colorBackgroundDanger,
      onError:     t.colorTextOnDanger,
      surface:     t.colorBackgroundSurface,
      onSurface:   t.colorTextNeutral,
    );

    return ThemeData(
      colorScheme:             colorScheme,
      useMaterial3:            true,
      fontFamily:              t.typographyFontFamilySans,
      scaffoldBackgroundColor: t.colorBackgroundSurface,

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: t.colorBackgroundPrimary,
          foregroundColor: t.colorTextOnPrimary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(t.radiusInteractive),
          ),
        ),
      ),

      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: t.colorBackgroundPrimary,
          side: BorderSide(color: t.colorStrokePrimary),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(t.radiusInteractive),
          ),
        ),
      ),

      cardTheme: CardTheme(
        color:     t.colorBackgroundSurfaceRaised,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(t.radiusCard),
          side: BorderSide(color: t.colorStrokeNeutral),
        ),
      ),

      inputDecorationTheme: InputDecorationTheme(
        filled:    true,
        fillColor: t.colorBackgroundSurfaceSubtle,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(t.radiusInteractive),
          borderSide: BorderSide(color: t.colorStrokeNeutral),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(t.radiusInteractive),
          borderSide: BorderSide(color: t.colorStrokeNeutral),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(t.radiusInteractive),
          borderSide: BorderSide(color: t.colorBackgroundPrimary, width: 2),
        ),
      ),

      textTheme: TextTheme(
        bodyMedium: GoogleFonts.getFont(t.typographyFontFamilySans,
          fontSize:   BTechFontSize.base,
          fontWeight: FontWeight.w500,
          color:      t.colorTextNeutral,
        ),
        bodySmall: GoogleFonts.getFont(t.typographyFontFamilySans,
          fontSize:   BTechFontSize.sm,
          fontWeight: FontWeight.w500,
          color:      t.colorTextNeutralSubtle,
        ),
        labelMedium: GoogleFonts.getFont(t.typographyFontFamilySans,
          fontSize:   BTechFontSize.sm,
          fontWeight: FontWeight.w500,
          color:      t.colorTextNeutral,
        ),
        titleLarge: GoogleFonts.getFont(t.typographyFontFamilySans,
          fontSize:   BTechFontSize.xl,
          fontWeight: FontWeight.w700,
          color:      t.colorTextNeutral,
        ),
      ),

      extensions: [
        BTechTokenExtension(tokens: t),
      ],
    );
  }
}
