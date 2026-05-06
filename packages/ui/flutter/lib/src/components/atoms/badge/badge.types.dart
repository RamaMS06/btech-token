/// BTBadge variant — maps Figma node 72:1516 variant property.
///
/// Each value carries its own color palette (background + text).
/// See [BTBadge] for the full rendering contract.
enum BTBadgeVariant {
  /// Green — success state (e.g. approved, completed).
  success,

  /// Yellow — waiting/pending state (e.g. in review).
  waiting,

  /// Neutral grey — no particular status significance.
  neutral,

  /// Blue — draft or informational state.
  draft,

  /// Red — rejected or error state.
  reject,

  /// Amber — brand secondary / custom accent.
  custom,
}
