import 'btech.body.dart';
import 'btech.heading.dart';
import 'btech.subheading.dart';

/// ***BTech typography tokens*** for the BUMA Apps.
///
/// Semantic text-style groups built on Poppins. Use these in place of
/// inline [TextStyle] to keep typography consistent.
///
/// ```dart
/// Text('Hello', style: BTechFont.heading.h1);
/// Text('Caption', style: BTechFont.body.small);
/// ```
abstract class BTechFont {
  /// Heading styles (h1–h4).
  static final BTechHeading heading = BTechHeading();

  /// Subheading styles (h5–h7).
  static final BTechSubHeading subheading = BTechSubHeading();

  /// Body styles (default, bold, small, medium, xSmall, italic, underline, paragraph).
  static final BTechBody body = BTechBody();
}
