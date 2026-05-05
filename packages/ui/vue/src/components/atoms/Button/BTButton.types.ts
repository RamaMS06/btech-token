export type BTButtonVariant =
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'ghost';

export type BTButtonSize = 'default' | 'small';

export interface BTButtonProps {
  /** Visual style — default: 'primary'. */
  variant?: BTButtonVariant;
  /** Padding scale — 'default' (12×16 px) or 'small' (8 px all sides). */
  size?: BTButtonSize;
  /** Disables interaction and applies disabled styling. */
  disabled?: boolean;
  /** Renders only the default slot (icon) without a label — square padding. */
  iconOnly?: boolean;
  /** Text label shown inside the button. */
  label?: string;
}
