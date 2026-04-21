import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'btech.font.size.dart';

/// BTech body text styles.
class BTechBody extends TextStyle {
  BTechBody()
      : super(
          fontSize: BTechFontSize.body,
          fontWeight: FontWeight.w500,
          height: BTechFontSize.bodyLh,
          fontFamily: _family,
        );

  static final String? _family =
      GoogleFonts.poppins(fontWeight: FontWeight.w500).fontFamily;

  /// Bold body. 12px, bold.
  final TextStyle bold = GoogleFonts.poppins(
    fontSize: BTechFontSize.body,
    fontWeight: FontWeight.bold,
    height: BTechFontSize.bodyLh,
  );

  /// Small — captions, helper text. 11px, w500.
  final TextStyle small = GoogleFonts.poppins(
    fontSize: BTechFontSize.bodySmall,
    fontWeight: FontWeight.w500,
    height: BTechFontSize.bodySmallLh,
  );

  /// Medium. 14px, w500.
  final TextStyle medium = GoogleFonts.poppins(
    fontSize: BTechFontSize.bodyMedium,
    fontWeight: FontWeight.w500,
    height: BTechFontSize.bodyMediumLh,
  );

  /// Extra-small — micro-labels, badges. 8px, w500.
  final TextStyle xSmall = GoogleFonts.poppins(
    fontSize: BTechFontSize.bodyXSmall,
    fontWeight: FontWeight.w500,
    height: BTechFontSize.bodyXSmallLh,
  );

  /// Italic. 12px, w500, italic.
  final TextStyle italic = GoogleFonts.poppins(
    fontSize: BTechFontSize.body,
    fontWeight: FontWeight.w500,
    fontStyle: FontStyle.italic,
    height: BTechFontSize.bodyLh,
  );

  /// Underlined — inline links. 12px, w600, underline.
  final TextStyle underline = GoogleFonts.poppins(
    fontSize: BTechFontSize.body,
    fontWeight: FontWeight.w600,
    decoration: TextDecoration.underline,
    height: BTechFontSize.bodyLh,
  );

  /// Paragraph — generous line-height for readability. 12px, w500, lh 24.
  final TextStyle paragraph = GoogleFonts.poppins(
    fontSize: BTechFontSize.body,
    fontWeight: FontWeight.w500,
    height: BTechFontSize.bodyParagraphLh,
  );
}
