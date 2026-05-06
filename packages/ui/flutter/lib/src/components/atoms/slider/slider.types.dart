// BTSlider types — Figma source: node 434:7617.

/// Layout and thumb count for [BTSlider].
enum BTSliderType {
  /// Horizontal slider with a single thumb.
  defaults,

  /// Horizontal slider with two thumbs (start + end).
  range,

  /// Vertical slider with a single thumb.
  vertical,
}

/// Color variant for the active track and thumb.
enum BTSliderVariant {
  /// Brand blue — component-specific active color (#145bc3).
  primary,

  /// Neutral gray — component-specific (#64748b).
  secondary,

  /// Error red — component-specific (#991515).
  destructive,
}
