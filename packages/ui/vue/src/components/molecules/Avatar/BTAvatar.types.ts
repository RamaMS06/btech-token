/**
 * BTAvatar v2 — public API types.
 *
 * Sliced from Figma `Avatar` (node 497:979). Data-class API mirrors
 * @buma-dev/buma-ui-v2's UIAvatarItem pattern: a single `item` prop
 * carries name (used to derive initials), optional imageUrl, optional
 * color override. Cross-framework parity with React + Flutter.
 *
 * Variant precedence (highest first):
 *   1. isLoading=true              → skeleton placeholder
 *   2. status='error' | imageError → hide_image icon on bg/subtler
 *   3. item == undefined           → person icon on bg/subtler (empty)
 *   4. item.imageUrl               → <img>; onError → error state
 *   5. (default)                   → initials on colored background
 */

export type BTAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Component-specific palette (hardcoded per Figma 497:979). NOT tokenized. */
export type BTAvatarColor =
  | 'green'
  | 'blue'
  | 'orange'
  | 'purple'
  | 'teal'
  | 'pink';

/**
 * Explicit override variants from Figma 497:979.
 * `'error'` renders a hide_image icon on bg/subtler background.
 * Also triggered automatically when `item.imageUrl` fails to load.
 */
export type BTAvatarStatus = 'error';

/**
 * Avatar payload. The `name` field is required and used to auto-derive
 * 1–2 character initials when `imageUrl` is absent (or fails to load).
 */
export interface BTAvatarItem {
  /** Used to derive initials. e.g. "Faisal Lestari" → "FL". */
  name: string;
  /** When provided, renders as <img>. Falls back to error icon on load failure. */
  imageUrl?: string;
  /** Background color for initials variant. Defaults to `green`. */
  color?: BTAvatarColor;
}

export interface BTAvatarProps {
  /**
   * The avatar payload. When `undefined`, renders the empty (person icon)
   * variant — Figma's explicit "no user" state.
   */
  item?: BTAvatarItem;
  /** Size of the avatar circle. Defaults to `md` (40px). */
  size?: BTAvatarSize;
  /** When `true`, renders a skeleton placeholder instead of avatar content. */
  isLoading?: boolean;
  /**
   * Explicit override to the error variant (hide_image icon).
   * Useful when the caller already knows the asset is unavailable.
   */
  status?: BTAvatarStatus;
}

/** Derive 1-2 character initials from a person's name.
 *
 *  - "Faisal Lestari" → "FL"
 *  - "Rama"           → "R"
 *  - "John Foo Bar"   → "JB" (first + last word)
 *  - "" or null       → "?"
 *
 *  Exported for cross-framework parity (React mirrors this exact logic).
 */
export function deriveInitials(name: string): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '?';
  const words = trimmed.split(/\s+/);
  if (words.length === 1) return words[0]!.charAt(0).toUpperCase();
  const first = words[0]!.charAt(0);
  const last = words[words.length - 1]!.charAt(0);
  return (first + last).toUpperCase();
}
