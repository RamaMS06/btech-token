import { useState, useEffect } from 'react';
import '@btech/tokens-bspace/styles.css';
import '@btech/ui-react/styles.css';
import './app.css';
import { BTAvatarShowcase } from './showcases/BTAvatarShowcase';

export default function App() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <>
      <header className="showcase-header">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
          <span className="showcase-header__title">BTech UI Showcase</span>
          <span className="showcase-header__subtitle">— component visual gallery</span>
        </div>
        <button
          className="dark-mode-toggle"
          onClick={() => setDark((d) => !d)}
          aria-label="Toggle dark mode"
        >
          {dark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </header>

      <main className="showcase-main">
        <BTAvatarShowcase />
        {/* Add more <ComponentShowcase /> sections here as components are sliced */}
      </main>
    </>
  );
}
