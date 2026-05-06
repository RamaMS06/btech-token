// BTButtonLink types — Figma source: node 480:3197.

/// Visual style of [BTButtonLink].
///
/// Each variant maps to a specific foreground colour from btech semantic
/// tokens. Hover shows the bold variant + underline; pressed (active)
/// dims to a neutral text colour.
enum BTButtonLinkVariant {
  /// Default interactive link colour — brand.primary.
  primary,

  /// Subdued link — text.secondary by default.
  secondary,

  /// Standard text colour — text.primary by default.
  tertiary,

  /// For use on dark / coloured surfaces — text.inverse by default.
  invert,

  /// Amber brand link — brand.secondary.
  custom,
}
