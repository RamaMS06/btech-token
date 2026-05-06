/**
 * BTAvatarGroup — stacked group of avatars with overflow counter.
 * Sliced from Figma `Avatar Group` (node 504:705). Mirrors
 * @btech/ui-vue + btech_ui (Flutter) one-to-one.
 *
 * Stacking offsets per Figma 504:705 (negative left margin per size):
 *   xs(24)→-8, sm(32)→-10, md(40)→-12, lg(48)→-16, xl(64)→-20, 2xl(96)→-32
 *
 * ## Usage:
 * ```tsx
 * <BTAvatarGroup
 *   items={[
 *     { name: 'Person 1', imageUrl: '...' },
 *     { name: 'JD' },
 *     { name: 'AB', color: 'pink' },
 *     { name: 'XY' },
 *     { name: 'ZZ' },
 *   ]}
 *   max={3}
 *   size="md"
 * />
 * // Renders 3 avatars + "+2" overflow counter
 * ```
 */
import * as React from 'react';
import { BTAvatar } from '../../molecules/Avatar/BTAvatar.js';
import type { BTAvatarGroupProps } from './BTAvatarGroup.types.js';
// Import shared CSS via Avatar's stylesheet (BTAvatarGroup classes co-located)
import '../../molecules/Avatar/BTAvatar.css';

const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

export const BTAvatarGroup: React.FC<BTAvatarGroupProps> = ({
  items,
  max = 3,
  customOverflowNumber,
  size = 'md',
  isLoading = false,
  className,
}) => {
  const visible = items.slice(0, max);
  const overflowCount =
    customOverflowNumber !== undefined
      ? customOverflowNumber
      : Math.max(0, items.length - max);
  const showOverflow = overflowCount > 0;

  const groupClasses = cn(
    'btech-avatar-group',
    `btech-avatar-group--${size}`,
    className,
  );

  return (
    <div data-slot="avatar-group" className={groupClasses} role="group" aria-label="Avatar group">
      {visible.map((item, idx) => (
        <BTAvatar
          key={idx}
          item={item}
          size={size}
          isLoading={isLoading}
          className="btech-avatar-group__item"
        />
      ))}

      {showOverflow && (
        <div
          data-slot="avatar-group-count"
          className={cn('btech-avatar-group__overflow', 'btech-avatar', `btech-avatar--${size}`)}
          role="img"
          aria-label={`${overflowCount} more avatars`}
        >
          <span className="btech-avatar__count">+{overflowCount}</span>
        </div>
      )}
    </div>
  );
};

BTAvatarGroup.displayName = 'BTAvatarGroup';
