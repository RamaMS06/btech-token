/**
 * BTTabsShowcase — visual smoke test for BTTabs (molecule).
 * Sliced from Figma node 1:53 · Base/TabItem 434:5262.
 *
 * Demonstrates: segmented + line variants, scrollable + centering,
 * disabled tabs, optional leading/trailing icon render props.
 */
import { useState } from 'react';
import { BTTabs } from '@btech/ui-react';

const BASIC_TABS = [
  { label: 'Overview' },
  { label: 'Details' },
  { label: 'History' },
];

const MANY_TABS = [
  { label: 'Dashboard' },
  { label: 'Analytics' },
  { label: 'Reports' },
  { label: 'Transactions' },
  { label: 'Customers' },
  { label: 'Products' },
  { label: 'Settings' },
  { label: 'Billing' },
];

const ICON_TABS = [
  { label: 'List' },
  { label: 'Grid' },
  { label: 'Map' },
];

const DISABLED_TABS = [
  { label: 'Active' },
  { label: 'Disabled', disabled: true },
  { label: 'Other' },
];

const ICONS = [
  <svg key="list" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
  </svg>,
  <svg key="grid" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>,
  <svg key="map" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" />
  </svg>,
];

export function BTTabsShowcase() {
  const [segActive, setSegActive] = useState(0);
  const [lineActive, setLineActive] = useState(0);
  const [scrollSegActive, setScrollSegActive] = useState(0);
  const [scrollLineActive, setScrollLineActive] = useState(0);
  const [iconActive, setIconActive] = useState(0);
  const [disabledActive, setDisabledActive] = useState(0);

  return (
    <section className="showcase-section">
      <h2 className="showcase-section__title">BTTabs — Figma 1:53</h2>
      <p className="showcase-section__subtitle">
        Sliding indicator (not opacity toggle). scrollable auto-centers selected tab.
      </p>

      {/* Segmented */}
      <div className="showcase-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
        <span className="showcase-row__label">segmented</span>
        <BTTabs variant="segmented" tabs={BASIC_TABS} activeIndex={segActive} onActiveIndexChange={setSegActive} />
        <span style={{ fontSize: 12, color: '#9ca3af' }}>active: {BASIC_TABS[segActive].label}</span>
      </div>

      {/* Line */}
      <div className="showcase-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12, marginTop: 24 }}>
        <span className="showcase-row__label">line</span>
        <BTTabs variant="line" tabs={BASIC_TABS} activeIndex={lineActive} onActiveIndexChange={setLineActive} />
        <span style={{ fontSize: 12, color: '#9ca3af' }}>active: {BASIC_TABS[lineActive].label}</span>
      </div>

      {/* Scrollable segmented (many tabs, constrained width) */}
      <div className="showcase-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12, marginTop: 24 }}>
        <span className="showcase-row__label">scrollable segmented</span>
        <div style={{ width: 320 }}>
          <BTTabs
            variant="segmented"
            tabs={MANY_TABS}
            scrollable
            activeIndex={scrollSegActive}
            onActiveIndexChange={setScrollSegActive}
          />
        </div>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>active: {MANY_TABS[scrollSegActive].label}</span>
      </div>

      {/* Scrollable line */}
      <div className="showcase-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12, marginTop: 24 }}>
        <span className="showcase-row__label">scrollable line</span>
        <div style={{ width: 320 }}>
          <BTTabs
            variant="line"
            tabs={MANY_TABS}
            scrollable
            activeIndex={scrollLineActive}
            onActiveIndexChange={setScrollLineActive}
          />
        </div>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>active: {MANY_TABS[scrollLineActive].label}</span>
      </div>

      {/* With leading icons */}
      <div className="showcase-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12, marginTop: 24 }}>
        <span className="showcase-row__label">segmented + leading icons</span>
        <BTTabs
          variant="segmented"
          tabs={ICON_TABS}
          activeIndex={iconActive}
          onActiveIndexChange={setIconActive}
          leadingIcon={(i) => ICONS[i]}
        />
      </div>

      {/* Disabled */}
      <div className="showcase-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 12, marginTop: 24 }}>
        <span className="showcase-row__label">disabled tab</span>
        <BTTabs variant="segmented" tabs={DISABLED_TABS} activeIndex={disabledActive} onActiveIndexChange={setDisabledActive} />
        <BTTabs variant="line" tabs={DISABLED_TABS} activeIndex={disabledActive} onActiveIndexChange={setDisabledActive} />
      </div>
    </section>
  );
}
