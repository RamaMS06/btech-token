// BTTabs types — Figma source: node 1:53 · Base/TabItem 434:5262

/** Visual style of the tab strip. */
export type BTTabsVariant = 'segmented' | 'line';

/** Data for a single tab. */
export interface BTTabItem {
  /** Label text displayed in the tab. */
  label: string;
  /** Whether this tab is not interactive. @default false */
  disabled?: boolean;
}

export interface BTTabsProps {
  /**
   * Visual variant.
   * - `'segmented'` — pill-style tray, active tab has filled primary background.
   * - `'line'`      — flat row, active tab has primary underline border.
   * @default 'segmented'
   */
  variant?: BTTabsVariant;
  /** Ordered list of tab descriptors. */
  tabs: BTTabItem[];
  /**
   * Zero-based index of the currently active tab.
   * Controlled via `v-model:activeIndex`.
   */
  activeIndex?: number;
  /**
   * When `true`, the tab strip becomes horizontally scrollable and
   * auto-scrolls to center the active tab on each selection.
   * Useful when there are many tabs and the container is narrow.
   * @default false
   */
  scrollable?: boolean;
  /** Additional CSS class names on the root element. */
  className?: string;
}
