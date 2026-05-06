/**
 * BTAvatarGroup — public API types.
 *
 * Sliced from Figma `Avatar Group` (node 504:705). Stacks BTAvatar
 * instances horizontally with negative-margin overlap. Renders an
 * overflow counter ("+N") when items.length exceeds `max`.
 */
import type {
  BTAvatarItem,
  BTAvatarSize,
} from '../../molecules/Avatar/BTAvatar.types.js';

export interface BTAvatarGroupProps {
  /** List of avatars to stack. Order = render order (left to right). */
  items: BTAvatarItem[];
  /** Maximum visible avatars before overflow counter appears. Defaults to `3`. */
  max?: number;
  /** Override the overflow number display (e.g. show "+99"). */
  customOverflowNumber?: number;
  /** Size applied uniformly to all avatars + overflow. Defaults to `md`. */
  size?: BTAvatarSize;
  /** When true, all positions render as skeleton placeholders. */
  isLoading?: boolean;
  /** Pass-through className for layout overrides. */
  className?: string;
}
