/**
 * BTTabs — tab molecule (Figma 1:53 / Base/TabItem 434:5262).
 *
 * Two variants: 'segmented' (pill tray) · 'line' (underline).
 *
 * @example
 * ```tsx
 * const [active, setActive] = useState(0);
 *
 * // Segmented
 * <BTTabs
 *   variant="segmented"
 *   tabs={[{ label: 'Overview' }, { label: 'Details' }, { label: 'History' }]}
 *   activeIndex={active}
 *   onActiveIndexChange={setActive}
 * />
 *
 * // Line
 * <BTTabs
 *   variant="line"
 *   tabs={[{ label: 'Overview' }, { label: 'Details' }]}
 *   activeIndex={active}
 *   onActiveIndexChange={setActive}
 * />
 * ```
 */
import { useCallback } from 'react';
import './BTTabs.css';
import type { BTTabsProps } from './BTTabs.types';

export interface BTTabsReactProps extends BTTabsProps {
  /** Called when the user selects a tab. Receives the new active index. */
  onActiveIndexChange?: (index: number) => void;
  /** Leading icon per tab index (render prop). */
  leadingIcon?: (index: number) => React.ReactNode;
  /** Trailing icon per tab index (render prop). */
  trailingIcon?: (index: number) => React.ReactNode;
}

export function BTTabs({
  variant = 'segmented',
  tabs,
  activeIndex = 0,
  onActiveIndexChange,
  leadingIcon,
  trailingIcon,
  className,
}: BTTabsReactProps) {
  const handleClick = useCallback(
    (index: number, disabled?: boolean) => {
      if (disabled) return;
      onActiveIndexChange?.(index);
    },
    [onActiveIndexChange],
  );

  const rootClass = [
    'bt-tabs',
    `bt-tabs--${variant}`,
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} role="tablist">
      {tabs.map((tab, i) => (
        <button
          key={i}
          role="tab"
          className={[
            'bt-tabs__item',
            i === activeIndex ? 'bt-tabs__item--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-selected={i === activeIndex}
          aria-disabled={tab.disabled || undefined}
          disabled={tab.disabled}
          tabIndex={i === activeIndex ? 0 : -1}
          onClick={() => handleClick(i, tab.disabled)}
        >
          {leadingIcon && (
            <span className="bt-tabs__icon">{leadingIcon(i)}</span>
          )}
          {tab.label}
          {trailingIcon && (
            <span className="bt-tabs__icon">{trailingIcon(i)}</span>
          )}
        </button>
      ))}
    </div>
  );
}

BTTabs.displayName = 'BTTabs';
