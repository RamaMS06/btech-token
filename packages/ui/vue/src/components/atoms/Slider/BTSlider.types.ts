// BTSlider types — Figma source: node 434:7617.

/** Layout and thumb count. */
export type BTSliderType = 'default' | 'range' | 'vertical';

/**
 * Color variant of the active track + thumb.
 * - primary     → brand blue  (#145bc3)
 * - secondary   → neutral     (#64748b)
 * - destructive → error red   (#991515)
 */
export type BTSliderVariant = 'primary' | 'secondary' | 'destructive';

export interface BTSliderProps {
  /**
   * Layout type.
   * - 'default'  → horizontal, single thumb
   * - 'range'    → horizontal, two thumbs (start + end)
   * - 'vertical' → vertical, single thumb
   * @default 'default'
   */
  type?: BTSliderType;
  /**
   * Color variant for active track and thumb.
   * @default 'primary'
   */
  variant?: BTSliderVariant;
  /** Controlled value for default / vertical types. */
  value?: number;
  /** Controlled start value for range type. */
  startValue?: number;
  /** Controlled end value for range type. */
  endValue?: number;
  /** Minimum selectable value. @default 0 */
  min?: number;
  /** Maximum selectable value. @default 100 */
  max?: number;
  /** Increment step. @default 1 */
  step?: number;
  /** Show value tooltip above (or beside for vertical) the thumb. @default true */
  showTooltip?: boolean;
  /** Disables all interaction. @default false */
  disabled?: boolean;
  /** Additional CSS class names. */
  className?: string;
}
