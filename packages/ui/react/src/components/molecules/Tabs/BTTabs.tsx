/**
 * BTTabs — tab molecule (Figma 1:53 / Base/TabItem 434:5262).
 *
 * Two variants: 'segmented' (pill tray) · 'line' (underline).
 * Sliding indicator: absolutely-positioned div that animates left+width
 * instead of toggling classes — smooth slide on every tab change.
 * scrollable: overflow-x auto + centers the active tab on selection.
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
 * // Scrollable line
 * <BTTabs
 *   variant="line"
 *   scrollable
 *   tabs={manyTabs}
 *   activeIndex={active}
 *   onActiveIndexChange={setActive}
 * />
 * ```
 */
import { useCallback, useEffect, useRef, useState } from 'react';
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
  scrollable = false,
  onActiveIndexChange,
  leadingIcon,
  trailingIcon,
  className,
}: BTTabsReactProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Sliding indicator geometry
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  // Enables CSS transition only after the first paint (avoids slide-from-zero on mount)
  const [isReady, setIsReady] = useState(false);

  const updateIndicator = useCallback(
    (ready: boolean) => {
      const btn = buttonRefs.current[activeIndex];
      const container = containerRef.current;
      if (!btn || !container) return;

      setIndicator({ left: btn.offsetLeft, width: btn.offsetWidth });

      if (scrollable) {
        const center = btn.offsetLeft + btn.offsetWidth / 2;
        container.scrollTo({
          left: center - container.offsetWidth / 2,
          behavior: ready ? 'smooth' : 'instant',
        });
      }
    },
    [activeIndex, scrollable],
  );

  // First mount: position indicator without transition, then enable transition
  useEffect(() => {
    // rAF ensures layout is complete before we read offsetLeft
    const id = requestAnimationFrame(() => {
      updateIndicator(false);
      requestAnimationFrame(() => setIsReady(true));
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Active tab changes: slide indicator + center scroll
  useEffect(() => {
    if (!isReady) return;
    updateIndicator(true);
  }, [activeIndex, isReady, updateIndicator]);

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
    scrollable ? 'bt-tabs--scrollable' : '',
    isReady ? 'bt-tabs--ready' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass} role="tablist" ref={containerRef}>
      {/* Sliding indicator — behind tab labels (z-index 0) */}
      <div
        className="bt-tabs__indicator"
        style={{ left: indicator.left, width: indicator.width }}
        aria-hidden
      />

      {tabs.map((tab, i) => (
        <button
          key={i}
          role="tab"
          ref={(el) => { buttonRefs.current[i] = el; }}
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
