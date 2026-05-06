/// BTAvatarGroup — stacked group of avatars with overflow counter.
///
/// Sliced from Figma `Avatar Group` (node 504:705). Stacks BTAvatar
/// instances horizontally with negative-margin overlap. Renders an
/// overflow counter ("+N") when items.length exceeds [max].
///
/// Stacking offsets per Figma 504:705 (negative left margin per size):
///   xs(24)  → -8 px       lg(48)  → -16 px
///   sm(32)  → -10 px      xl(64)  → -20 px
///   md(40)  → -12 px      xxl(96) → -32 px
///
/// ## Cross-framework parity:
///   - Vue:    <BTAvatarGroup :items="[...]" :max="3" size="md" />
///   - React:  <BTAvatarGroup items={[...]} max={3} size="md" />
///   - Flutter: BTAvatarGroup(items: [...], max: 3, size: BTAvatarSize.md)
///
/// ## Usage:
/// ```dart
/// const BTAvatarGroup(
///   items: [
///     BTAvatarItem(name: 'Person 1', imageUrl: 'https://...'),
///     BTAvatarItem(name: 'JD'),
///     BTAvatarItem(name: 'AB', color: BTAvatarColor.pink),
///     BTAvatarItem(name: 'XY'),
///     BTAvatarItem(name: 'ZZ'),
///   ],
///   max: 3,
///   size: BTAvatarSize.md,
/// );
/// // Renders 3 avatars + "+2" overflow counter
/// ```
library;

import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/src/components/molecules/avatar/avatar.dart';
import 'package:btech_ui/src/components/molecules/avatar/internal/avatar.constants.dart';
import 'package:flutter/material.dart';

class BTAvatarGroup extends StatelessWidget {
  const BTAvatarGroup({
    required this.items,
    this.max = 3,
    this.customOverflowNumber,
    this.size = BTAvatarSize.md,
    this.isLoading = false,
    super.key,
  });

  /// List of avatars to stack. Order = render order (left to right).
  final List<BTAvatarItem> items;

  /// Maximum visible avatars before overflow counter appears.
  final int max;

  /// Override the overflow number display (e.g. force "+99" instead).
  final int? customOverflowNumber;

  /// Size applied uniformly to all avatars + overflow counter.
  final BTAvatarSize size;

  /// When true, all positions render as skeleton placeholders.
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    final visible = items.length > max ? items.sublist(0, max) : items;
    final overflowCount =
        customOverflowNumber ?? (items.length > max ? items.length - max : 0);
    final showOverflow = overflowCount > 0;

    final pxSize = avatarPx[size]!;
    final offset = stackOffsetFor(size);
    // Step = how far each new item shifts right. Total width =
    // step * (totalCount - 1) + pxSize.
    final step = pxSize - offset;
    final totalCount = visible.length + (showOverflow ? 1 : 0);
    final stackWidth = totalCount > 0 ? step * (totalCount - 1) + pxSize : 0.0;

    // Stack with positive `Padding(left: i * step)` per buma-ui pattern.
    // Stack overlaps children naturally — Flutter's Padding can't take
    // negative values, but positive padding inside a Stack achieves the
    // same visual offset.
    return SizedBox(
      width: stackWidth,
      height: pxSize,
      child: Stack(
        children: [
          for (var i = 0; i < visible.length; i++)
            Padding(
              padding: EdgeInsets.only(left: i * step),
              child: BTAvatar(
                item: visible[i],
                size: size,
                isLoading: isLoading,
              ),
            ),
          if (showOverflow)
            Padding(
              padding: EdgeInsets.only(left: visible.length * step),
              child: _OverflowCounter(count: overflowCount, size: size),
            ),
        ],
      ),
    );
  }
}

/// Internal "+N" counter — neutral subtler bg per Figma "Number" color variant.
class _OverflowCounter extends StatelessWidget {
  const _OverflowCounter({
    required this.count,
    required this.size,
  });

  final int count;
  final BTAvatarSize size;

  @override
  Widget build(BuildContext context) {
    final pxSize = avatarPx[size]!;
    return Container(
      width: pxSize,
      height: pxSize,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: context.btechColor.bg.subtler,
        shape: BoxShape.circle,
      ),
      child: Text(
        '+$count',
        style: TextStyle(
          color: context.btechColor.text.secondary,
          fontSize: fontSizeFor(size),
          fontWeight: FontWeight.w500,
          fontFamily: BTechTypography.fontFamily,
          height: 1,
        ),
      ),
    );
  }
}
