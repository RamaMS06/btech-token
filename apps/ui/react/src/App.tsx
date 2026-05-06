import { useState, useEffect } from 'react';
import '@btech/tokens/styles.css';
import '@btech/ui-react/styles.css';
import './app.css';
import { BTAlertShowcase } from './showcases/BTAlertShowcase';
import { BTAvatarShowcase } from './showcases/BTAvatarShowcase';
import { BTBadgeShowcase } from './showcases/BTBadgeShowcase';
import { BTButtonShowcase } from './showcases/BTButtonShowcase';
import { BTButtonLinkShowcase } from './showcases/BTButtonLinkShowcase';
import { BTCheckboxShowcase } from './showcases/BTCheckboxShowcase';
import { BTHintShowcase } from './showcases/BTHintShowcase';
import { BTRadioButtonShowcase } from './showcases/BTRadioButtonShowcase';
import { BTSeparatorShowcase } from './showcases/BTSeparatorShowcase';
import { BTSliderShowcase } from './showcases/BTSliderShowcase';
import { BTTabsShowcase } from './showcases/BTTabsShowcase';
import { BTTooltipShowcase } from './showcases/BTTooltipShowcase';

// ── Sidebar registry ──────────────────────────────────────────────────────────
// Add new entries here as components are sliced. Group = atomic-design layer.

interface ShowcasePage {
  id: string;
  group: string;
  label: string;
  component: React.ReactNode;
}

const PAGES: ShowcasePage[] = [
  { id: 'badge',       group: 'Atoms',     label: 'Badge',       component: <BTBadgeShowcase /> },
  { id: 'button',      group: 'Atoms',     label: 'Button',      component: <BTButtonShowcase /> },
  { id: 'button-link', group: 'Atoms',     label: 'Button Link', component: <BTButtonLinkShowcase /> },
  { id: 'checkbox',    group: 'Atoms',     label: 'Checkbox',    component: <BTCheckboxShowcase /> },
  { id: 'hint',        group: 'Atoms',     label: 'Hint',        component: <BTHintShowcase /> },
  { id: 'radio',       group: 'Atoms',     label: 'Radio Button', component: <BTRadioButtonShowcase /> },
  { id: 'separator',   group: 'Atoms',     label: 'Separator',   component: <BTSeparatorShowcase /> },
  { id: 'slider',      group: 'Atoms',     label: 'Slider',      component: <BTSliderShowcase /> },
  { id: 'tooltip',    group: 'Atoms / Molecules', label: 'Tooltip + TooltipStep', component: <BTTooltipShowcase /> },
  { id: 'avatar',      group: 'Molecules', label: 'Avatar',      component: <BTAvatarShowcase /> },
  { id: 'tabs',        group: 'Molecules', label: 'Tabs',        component: <BTTabsShowcase /> },
  { id: 'alert',        group: 'Molecules', label: 'Alert',       component: <BTAlertShowcase /> },
];

// Group pages by their group label, preserving insertion order
function groupPages(pages: ShowcasePage[]) {
  const map = new Map<string, ShowcasePage[]>();
  for (const p of pages) {
    if (!map.has(p.group)) map.set(p.group, []);
    map.get(p.group)!.push(p);
  }
  return map;
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [dark, setDark] = useState(false);
  const [selectedId, setSelectedId] = useState(PAGES[0].id);

  useEffect(() => {
    document.documentElement.setAttribute('data-mode', dark ? 'dark' : 'light');
  }, [dark]);

  const selected = PAGES.find((p) => p.id === selectedId) ?? PAGES[0];
  const groups = groupPages(PAGES);

  return (
    <div className="showcase-shell">
      {/* ── Header ── */}
      <header className="showcase-header">
        <div className="showcase-header__left">
          <span className="showcase-header__title">BTech UI</span>
          <span className="showcase-header__subtitle">— component gallery</span>
        </div>
        <button
          className="dark-mode-toggle"
          onClick={() => setDark((d) => !d)}
          aria-label="Toggle dark mode"
        >
          {dark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>

      <div className="showcase-body">
        {/* ── Sidebar ── */}
        <nav className="showcase-sidebar" aria-label="Components">
          {[...groups.entries()].map(([group, items]) => (
            <div key={group} className="showcase-sidebar__group">
              <div className="showcase-sidebar__group-label">{group}</div>
              {items.map((page) => (
                <button
                  key={page.id}
                  className={
                    'showcase-sidebar__item' +
                    (page.id === selectedId ? ' showcase-sidebar__item--active' : '')
                  }
                  onClick={() => setSelectedId(page.id)}
                >
                  {page.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* ── Main content ── */}
        <main className="showcase-main">
          {selected.component}
        </main>
      </div>
    </div>
  );
}
