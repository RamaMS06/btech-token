// BTTooltip — type definitions.
//
// Figma: node 479-2624
// https://www.figma.com/design/WANr9drWYNYbMPuT2sMeHi/?node-id=479-2624

/// Which side of the trigger the tooltip balloon appears on.
enum BTTooltipPosition {
  top,
  bottom,
  left,
  right,
}

/// Where the arrow sits along its axis.
enum BTTooltipArrowPosition {
  /// ~17 px from the left / top edge.
  left,

  /// 25% from the left / top edge.
  leftMid,

  /// 50% — centred (default).
  mid,

  /// 75% from the left / top edge.
  rightMid,

  /// ~17 px from the right / bottom edge.
  right,
}
