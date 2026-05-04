/**
 * BAvatar — public API types. Mirrors the React Avatar API but exported for
 * consumers who want to type-annotate slot/prop usage. The actual runtime
 * `defineProps<...>` lives inside BAvatar.vue.
 */
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type AvatarColor = 'green' | 'blue' | 'orange' | 'purple' | 'teal' | 'pink';

export interface BAvatarProps {
  size?: AvatarSize;
  src?: string;
  alt?: string;
  initials?: string;
  color?: AvatarColor;
  count?: number;
  status?: 'error';
}
