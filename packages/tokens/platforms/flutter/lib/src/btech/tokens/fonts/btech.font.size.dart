/// Raw numeric typography tokens for BTech (logical pixels).
///
/// `*Lh` constants are line-height multipliers for [TextStyle.height].
abstract class BTechFontSize {
  BTechFontSize._();

  // heading
  static const double h1 = 35; static const double h1Lh = 40 / 35;
  static const double h2 = 29; static const double h2Lh = 32 / 29;
  static const double h3 = 24; static const double h3Lh = 28 / 24;
  static const double h4 = 20; static const double h4Lh = 24 / 20;

  // subheading
  static const double h5 = 16; static const double h5Lh = 20 / 16;
  static const double h6 = 14; static const double h6Lh = 16 / 14;
  static const double h7 = 12; static const double h7Lh = 16 / 12;

  // body
  static const double body       = 12; static const double bodyLh       = 16 / 12;
  static const double bodySmall  = 11; static const double bodySmallLh  = 16 / 11;
  static const double bodyMedium = 14; static const double bodyMediumLh = 18 / 14;
  static const double bodyXSmall = 8;  static const double bodyXSmallLh = 12 / 8;
  static const double bodyParagraphLh = 24 / 12;

  // generic scale (for use in arbitrary TextStyles, mirrors old generated constants)
  static const double xs   = 12;
  static const double sm   = 14;
  static const double base = 16;
  static const double lg   = 18;
  static const double xl   = 20;
  static const double s2xl = 24;
  static const double s3xl = 30;
  static const double s4xl = 36;
}
