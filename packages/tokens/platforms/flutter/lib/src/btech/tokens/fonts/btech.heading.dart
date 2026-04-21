import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'btech.font.size.dart';

/// BTech heading text styles (h1–h4). Extends [TextStyle] so the instance
/// itself is a usable default; named fields expose each level.
class BTechHeading extends TextStyle {
  BTechHeading()
      : super(
          fontSize: BTechFontSize.h1,
          fontWeight: FontWeight.bold,
          height: BTechFontSize.h1Lh,
          fontFamily: _family,
        );

  static final String? _family =
      GoogleFonts.poppins(fontWeight: FontWeight.bold).fontFamily;

  /// Heading 1 — hero / primary screen header. 35px, bold.
  final TextStyle h1 = GoogleFonts.poppins(
    fontSize: BTechFontSize.h1,
    fontWeight: FontWeight.bold,
    height: BTechFontSize.h1Lh,
  );

  /// Heading 2 — section title. 29px, w600.
  final TextStyle h2 = GoogleFonts.poppins(
    fontSize: BTechFontSize.h2,
    fontWeight: FontWeight.w600,
    height: BTechFontSize.h2Lh,
  );

  /// Heading 3 — card / dialog title. 24px, bold.
  final TextStyle h3 = GoogleFonts.poppins(
    fontSize: BTechFontSize.h3,
    fontWeight: FontWeight.bold,
    height: BTechFontSize.h3Lh,
  );

  /// Heading 4 — list section header. 20px, w500.
  final TextStyle h4 = GoogleFonts.poppins(
    fontSize: BTechFontSize.h4,
    fontWeight: FontWeight.w500,
    height: BTechFontSize.h4Lh,
  );
}
