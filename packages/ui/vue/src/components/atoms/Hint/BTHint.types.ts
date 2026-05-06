export type BTHintSize = 'lg' | 'md' | 'sm';

export interface BTHintProps {
  /**
   * The count to display. When null or undefined the hint renders as a dot.
   * Values > 99 are displayed as "99+".
   */
  count?: number | null;
  /**
   * Visual size of the hint.
   * @default 'lg'
   */
  size?: BTHintSize;
}
