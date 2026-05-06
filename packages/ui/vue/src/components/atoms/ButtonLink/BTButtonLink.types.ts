// BTButtonLink types — Figma source: node 480:3197.

/** Visual style of BTButtonLink. */
export type BTButtonLinkVariant =
  | 'primary'    // brand.primary — default interactive link
  | 'secondary'  // text.secondary — subdued
  | 'tertiary'   // text.primary — standard text colour
  | 'invert'     // text.inverse — for dark / coloured surfaces
  | 'custom';    // brand.secondary — amber

export interface BTButtonLinkProps {
  /** Text shown in the link. */
  label: string;
  /** Visual style. @default 'primary' */
  variant?: BTButtonLinkVariant;
  /** Disables pointer events and dims colour. @default false */
  disabled?: boolean;
}
