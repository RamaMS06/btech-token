import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/src/components/atoms/separator/separator.types.dart';
import 'package:flutter/material.dart';

/// BTSeparator — visual divider atom (Figma 194:756).
///
/// Renders a 1px line using [context.btechColor.border.primary].
/// Place inside a flex container — stretches to fill the cross axis.
///
/// Example:
/// ```dart
/// // Horizontal (default) — inside a Column
/// Column(
///   children: [
///     SomeWidget(),
///     const BTSeparator(),
///     AnotherWidget(),
///   ],
/// )
///
/// // Vertical — inside a Row with bounded height
/// SizedBox(
///   height: 24,
///   child: Row(
///     children: [
///       LabelA(),
///       const BTSeparator(orientation: BTSeparatorOrientation.vertical),
///       LabelB(),
///     ],
///   ),
/// )
/// ```
class BTSeparator extends StatelessWidget {
  const BTSeparator({
    this.orientation = BTSeparatorOrientation.horizontal,
    super.key,
  });

  /// Direction of the divider line.
  final BTSeparatorOrientation orientation;

  @override
  Widget build(BuildContext context) {
    final color = context.btechColor.border.primary;
    final isHorizontal = orientation == BTSeparatorOrientation.horizontal;

    return Container(
      width: isHorizontal ? double.infinity : 1,
      height: isHorizontal ? 1 : double.infinity,
      color: color,
    );
  }
}
