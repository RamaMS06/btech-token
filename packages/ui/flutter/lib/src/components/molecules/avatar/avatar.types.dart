// Public types for [BTAvatar] v2.
//
// Data-class API mirrors @buma-dev/buma-ui-v2's UIAvatarItem pattern:
// a single `BTAvatarItem` carries the user payload (name, optional
// imageUrl, optional color override). Cross-framework parity with
// React + Vue.

/// Avatar size — matches the six Figma variants (24/32/40/48/64/96 px).
///
/// Naming uses an abstract scale (xs..xxl) rather than absolute pixels
/// so the design team can tweak ramps without breaking consumer code.
enum BTAvatarSize { xs, sm, md, lg, xl, xxl }

/// Component-specific palette (hardcoded per Figma 497:979).
///
/// Per [Figma visual rule](docs/architecture/figma-visual-rule.md) and
/// [component-specific colors policy](CLAUDE.md), these colors are
/// hardcoded in `internal/avatar.constants.dart` rather than tokenized
/// in `btech_tokens` — they're unique to BTAvatar.
enum BTAvatarColor { green, blue, orange, purple, teal, pink }

/// Explicit override variants from Figma 497:979.
///
///   [error] — renders a `hide_image` icon on [bg/subtler] background.
///             Also triggered automatically when [BTAvatarItem.imageUrl]
///             fails to load (errorBuilder).
///   [empty] — alias for passing no [item]; renders a `person` icon on
///             [bg/subtler] background. Use [BTAvatar] with a null [item]
///             instead of setting this directly.
///
/// Cross-framework parity: Vue/React use `status?: 'error'` string literal.
enum BTAvatarStatus { none, error }

/// Avatar payload — required input to [BTAvatar].
///
/// The [name] field is required and used to derive 1–2 character
/// initials when [imageUrl] is absent or fails to load.
class BTAvatarItem {
  const BTAvatarItem({
    required this.name,
    this.imageUrl,
    this.color = BTAvatarColor.green,
  });

  /// Used to derive initials. e.g. "Faisal Lestari" → "FL".
  final String name;

  /// When provided, renders as Image.network. Falls back to initials on error.
  final String? imageUrl;

  /// Background color for initials variant. Defaults to [BTAvatarColor.green].
  final BTAvatarColor color;
}

/// Derive 1-2 character initials from a person's name.
///
///  * "Faisal Lestari" → "FL"
///  * "Rama"           → "R"
///  * "John Foo Bar"   → "JB" (first + last word)
///  * "" or whitespace → "?"
///
/// Mirrors React/Vue `deriveInitials` exactly.
String deriveInitials(String name) {
  final trimmed = name.trim();
  if (trimmed.isEmpty) return '?';
  final words = trimmed.split(RegExp(r'\s+'));
  if (words.length == 1) return words.first[0].toUpperCase();
  final first = words.first[0];
  final last = words.last[0];
  return (first + last).toUpperCase();
}
