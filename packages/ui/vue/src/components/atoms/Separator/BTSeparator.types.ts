// BTSeparator types — Figma source: node 194:756.

/** Orientation of the separator line. */
export type BTSeparatorOrientation = 'horizontal' | 'vertical';

export interface BTSeparatorProps {
  /**
   * Direction of the divider line.
   * @default 'horizontal'
   */
  orientation?: BTSeparatorOrientation;
  /** Additional CSS class names. */
  className?: string;
}
