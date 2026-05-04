/**
 * Avatar — public API types.
 *
 * Sliced from Figma `Avatar` (node 497:979). The Figma component has a
 * cartesian-product variant matrix (size × color × hasImage = 108 cells)
 * which we collapse to a single discriminated-prop API: pass ONE of
 * `src` / `initials` / `count` and we infer the visual variant. Falls back
 * to the empty-placeholder when nothing relevant is provided.
 */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/** Six branded background colors used when rendering initials. NOTE: these
 *  colors are currently hardcoded hex (Figma did not tokenize them). When
 *  we add `color.avatar.*` semantic tokens, this map can be replaced with
 *  CSS var lookups without changing the public API. */
export type AvatarColor = 'green' | 'blue' | 'orange' | 'purple' | 'teal' | 'pink';

export interface AvatarProps {
  /** Size of the avatar circle. Defaults to `md` (40px). */
  size?: AvatarSize;
  /** Image source URL. When provided, overrides `initials`/`count`. */
  src?: string;
  /** Alt text for the image — required for accessibility when `src` is set. */
  alt?: string;
  /** 1–2 character initials shown when no image is set. */
  initials?: string;
  /** Background color for initials variant. Defaults to `green`. */
  color?: AvatarColor;
  /** Render an overflow counter (e.g. `+5`) instead of initials/image. */
  count?: number;
  /** Force the broken-image (error) state. Useful when an `src` failed to load. */
  status?: 'error';
  /** Pass-through className for layout overrides. */
  className?: string;
}
