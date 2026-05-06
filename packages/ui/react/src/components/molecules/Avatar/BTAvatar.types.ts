/**
 * BTAvatar v2 — public API types.
 *
 * Sliced from Figma `Avatar` (node 497:979). Data-class API mirrors
 * @btech/ui-vue + btech_ui Flutter one-to-one. Cross-framework parity
 * is mandatory: prop names, variant precedence, and render priority
 * MUST match across all 3 frameworks.
 *
 * Variant precedence (highest first):
 *   1. isLoading=true              → skeleton placeholder
 *   2. status='error' | imageError → hide_image icon on bg/subtler
 *   3. item == null/undefined      → person icon on bg/subtler (empty)
 *   4. item.imageUrl               → <img>; onError → triggers error state
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
 *  Also triggered automatically when `item.imageUrl` fails to load.
 */
export type BTAvatarStatus = 'error';

/** Avatar payload. `name` is required and used to auto-derive initials. */
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
  /** When `true`, renders a skeleton placeholder. */
  isLoading?: boolean;
  /**
   * Explicit override to the error variant (hide_image icon).
   * Useful when the caller already knows the asset is unavailable.
   */
  status?: BTAvatarStatus;
  /** Pass-through className for layout overrides. */
  className?: string;
}

/** Derive 1-2 character initials from a person's name. Mirrors Vue + Flutter. */
export function deriveInitials(name: string): string {
  const trimmed = (name ?? '').trim();
  if (!trimmed) return '?';
  const words = trimmed.split(/\s+/);
  if (words.length === 1) return words[0]!.charAt(0).toUpperCase();
  const first = words[0]!.charAt(0);
  const last = words[words.length - 1]!.charAt(0);
  return (first + last).toUpperCase();
}
