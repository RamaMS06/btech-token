import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'btech.font.size.dart';

/// BTech subheading text styles (h5–h7).
class BTechSubHeading extends TextStyle {
  BTechSubHeading()
      : super(
          fontSize: BTechFontSize.h5,
          fontWeight: FontWeight.bold,
          height: BTechFontSize.h5Lh,
          fontFamily: _family,
        );

  static final String? _family =
      GoogleFonts.poppins(fontWeight: FontWeight.bold).fontFamily;

  /// Subheading 5 — prominent labels, tab titles. 16px, bold.
  final TextStyle h5 = GoogleFonts.poppins(
    fontSize: BTechFontSize.h5,
    fontWeight: FontWeight.bold,
    height: BTechFontSize.h5Lh,
  );

  /// Subheading 6 — supporting labels. 14px, w600.
  final TextStyle h6 = GoogleFonts.poppins(
    fontSize: BTechFontSize.h6,
    fontWeight: FontWeight.w600,
    height: BTechFontSize.h6Lh,
  );

  /// Subheading 7 — chip / badge labels. 12px, w600.
  final TextStyle h7 = GoogleFonts.poppins(
    fontSize: BTechFontSize.h7,
    fontWeight: FontWeight.w600,
    height: BTechFontSize.h7Lh,
  );
}
