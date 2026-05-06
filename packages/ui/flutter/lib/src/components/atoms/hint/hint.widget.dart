import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/src/components/atoms/hint/hint.types.dart';
import 'package:btech_ui/src/components/atoms/hint/internal/hint.constants.dart';
import 'package:flutter/material.dart';

/// BTHint — notification indicator atom (Figma 658:1960).
///
/// Renders as a solid red dot when [count] is null, or as a red badge
/// containing the count value. Values above 99 display as "99+".
///
/// Example:
/// ```dart
/// // Dot indicator
/// const BTHint()
/// const BTHint(size: BTHintSize.sm)
///
/// // Count badge
/// const BTHint(count: 5)
/// const BTHint(count: 22, size: BTHintSize.md)
/// BTHint(count: 150)  // displays "99+"
/// ```
class BTHint extends StatelessWidget {
  const BTHint({
    this.count,
    this.size = BTHintSize.lg,
    super.key,
  });

  /// Count to display. Null renders a dot. Values > 99 show "99+".
  final int? count;

  /// Visual size of the hint.
  final BTHintSize size;

  String get _sizeKey => size.name;

  String? get _displayText {
    if (count == null) return null;
    return count! > 99 ? '99+' : '$count';
  }

  bool get _isDot => _displayText == null;
  bool get _isOverflow => _displayText == '99+';
  bool get _isSingle =>
      _displayText != null && _displayText!.length == 1;

  EdgeInsets get _padding {
    if (_isOverflow) {
      return kBTHintOverflowPadding[_sizeKey] ?? EdgeInsets.zero;
    }
    if (_isSingle) {
      return kBTHintSinglePadding[_sizeKey] ?? EdgeInsets.zero;
    }
    return kBTHintMultiPadding[_sizeKey] ?? EdgeInsets.zero;
  }

  @override
  Widget build(BuildContext context) {
    final color = context.btechColor.ext.error;

    if (_isDot) {
      final dotSize = kBTHintDotSize[_sizeKey] ?? 16;
      return Container(
        width: dotSize,
        height: dotSize,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
        ),
      );
    }

    final height = kBTHintBadgeHeight[_sizeKey] ?? 24;
    final minWidth = kBTHintBadgeMinWidth[_sizeKey] ?? 24;
    final fontSize = kBTHintFontSize[_sizeKey] ?? 14;

    return ConstrainedBox(
      constraints: BoxConstraints(
        minWidth: minWidth,
        minHeight: height,
        maxHeight: height,
      ),
      child: Container(
        padding: _padding,
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(9999),
        ),
        alignment: Alignment.center,
        child: Text(
          _displayText!,
          style: TextStyle(
            fontFamily: BTechTypography.fontFamily,
            fontSize: fontSize,
            fontWeight: FontWeight.w500,
            color: Colors.white,
            height: 16 / fontSize, // line-height-xs = 16px
            leadingDistribution: TextLeadingDistribution.even,
          ),
        ),
      ),
    );
  }
}
