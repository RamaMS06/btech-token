export type BTButtonVariant =
  | 'primary'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'ghost';

export type BTButtonSize = 'default' | 'small';

export interface BTButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style — default: 'primary'. */
  variant?: BTButtonVariant;
  /** Padding scale — 'default' (12×16 px) or 'small' (8 px all sides). */
  size?: BTButtonSize;
  /** Renders only `children` (icon) without a label — square padding. */
  iconOnly?: boolean;
  /** Text label shown inside the button. */
  label?: string;
  /** Icon rendered before the label. */
  leftIcon?: React.ReactNode;
  /** Icon rendered after the label. */
  rightIcon?: React.ReactNode;
}
