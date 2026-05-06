/**
 * EXEMPLAR — paired with avatar.vue. Demonstrates the conversion shape
 * the converter MUST produce: same prop names, same variant order,
 * same CSS class strings, JSDoc header, displayName, data-slot.
 */
import * as React from 'react';
import type { BTAvatarProps } from './BTAvatar.types.js';
import { deriveInitials } from './BTAvatar.types.js';
import './BTAvatar.css';

const cn = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

export const BTAvatar: React.FC<BTAvatarProps> = ({
  item,
  size = 'md',
  isLoading = false,
  className,
}) => {
  const [imageErrored, setImageErrored] = React.useState(false);
  React.useEffect(() => { setImageErrored(false); }, [item.imageUrl]);

  const variant: 'loading' | 'image' | 'initials' = isLoading
    ? 'loading'
    : item.imageUrl && !imageErrored
      ? 'image'
      : 'initials';

  const classes = cn(
    'btech-avatar',
    `btech-avatar--${size}`,
    `btech-avatar--${variant}`,
    className,
  );

  return (
    <div data-slot="avatar" data-size={size} data-variant={variant} className={classes} role="img" aria-label={item.name}>
      {variant === 'loading' && <div className="btech-avatar__skeleton" />}
      {variant === 'image' && item.imageUrl && (
        <img src={item.imageUrl} alt={item.name} onError={() => setImageErrored(true)} />
      )}
      {variant === 'initials' && <span>{deriveInitials(item.name)}</span>}
    </div>
  );
};

BTAvatar.displayName = 'BTAvatar';
