/**
 * BTAvatarGroup — public API types.
 *
 * Sliced from Figma `Avatar Group` (node 504:705). Stacks BTAvatar
 * instances horizontally with negative-margin overlap. Renders an
 * overflow counter ("+N") when items.length exceeds `max`.
 *
 * Stacking offsets (negative margin per size) per Figma 504:705:
 *   xs(24)  → -8px
 *   sm(32)  → -10px
 *   md(40)  → -12px
 *   lg(48)  → -16px
 *   xl(64)  → -20px
 *   2xl(96) → -32px
 */
import type { BTAvatarItem, BTAvatarSize } from '../../molecules/Avatar/BTAvatar.types';

export interface BTAvatarGroupProps {
  /** List of avatars to stack. Order = render order (left to right). */
  items: BTAvatarItem[];
  /** Maximum visible avatars before overflow counter appears. Defaults to `3`. */
  max?: number;
  /** Override the overflow number display (e.g. show "+99" instead of computed). */
  customOverflowNumber?: number;
  /** Size applied uniformly to all avatars + overflow. Defaults to `md`. */
  size?: BTAvatarSize;
  /** When true, renders all positions as skeleton placeholders. */
  isLoading?: boolean;
}
