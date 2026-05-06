// BTSliderShowcase — Figma 434:7617
import { useState } from 'react';
import { BTSlider } from '@btech/ui-react';

export function BTSliderShowcase() {
  const [single,    setSingle]    = useState(40);
  const [secondary, setSecondary] = useState(60);
  const [destr,     setDestr]     = useState(75);
  const [vertical,  setVertical]  = useState(55);
  const [rangeFrom, setRangeFrom] = useState(20);
  const [rangeTo,   setRangeTo]   = useState(80);
  const [disabled]                = useState(30);

  return (
    <section className="showcase-section">
      <h2 className="showcase-section__title">BTSlider — Figma 434:7617</h2>
      <p className="showcase-section__subtitle">
        3 types (default · range · vertical) × 3 variants (primary · secondary · destructive) ·
        tooltip · disabled state.
      </p>

      {/* Default — 3 variants */}
      <div className="showcase-row">
        <span className="showcase-row__label">primary</span>
        <div className="showcase-row__items" style={{ width: 300 }}>
          <BTSlider value={single} onValueChange={setSingle} />
        </div>
      </div>

      <div className="showcase-row">
        <span className="showcase-row__label">secondary</span>
        <div className="showcase-row__items" style={{ width: 300 }}>
          <BTSlider value={secondary} variant="secondary" onValueChange={setSecondary} />
        </div>
      </div>

      <div className="showcase-row">
        <span className="showcase-row__label">destructive</span>
        <div className="showcase-row__items" style={{ width: 300 }}>
          <BTSlider value={destr} variant="destructive" onValueChange={setDestr} />
        </div>
      </div>

      {/* No tooltip */}
      <div className="showcase-row" style={{ marginTop: 16 }}>
        <span className="showcase-row__label">no tooltip</span>
        <div className="showcase-row__items" style={{ width: 300 }}>
          <BTSlider value={single} showTooltip={false} onValueChange={setSingle} />
        </div>
      </div>

      {/* Disabled */}
      <div className="showcase-row">
        <span className="showcase-row__label">disabled</span>
        <div className="showcase-row__items" style={{ width: 300 }}>
          <BTSlider value={disabled} disabled />
        </div>
      </div>

      {/* Range */}
      <div className="showcase-row" style={{ marginTop: 16 }}>
        <span className="showcase-row__label">range</span>
        <div className="showcase-row__items" style={{ width: 300 }}>
          <BTSlider
            type="range"
            startValue={rangeFrom}
            endValue={rangeTo}
            onStartValueChange={setRangeFrom}
            onEndValueChange={setRangeTo}
          />
        </div>
      </div>

      <div className="showcase-row">
        <span className="showcase-row__label">range destr.</span>
        <div className="showcase-row__items" style={{ width: 300 }}>
          <BTSlider
            type="range"
            variant="destructive"
            startValue={rangeFrom}
            endValue={rangeTo}
            onStartValueChange={setRangeFrom}
            onEndValueChange={setRangeTo}
          />
        </div>
      </div>

      {/* Vertical */}
      <div className="showcase-row" style={{ marginTop: 16, alignItems: 'flex-start' }}>
        <span className="showcase-row__label" style={{ paddingTop: 8 }}>vertical</span>
        <div className="showcase-row__items" style={{ gap: 32 }}>
          <BTSlider type="vertical" value={vertical} onValueChange={setVertical} />
          <BTSlider type="vertical" variant="secondary" value={vertical} onValueChange={setVertical} />
          <BTSlider type="vertical" variant="destructive" value={vertical} onValueChange={setVertical} />
          <BTSlider type="vertical" disabled value={disabled} />
        </div>
      </div>

      {/* Value readout */}
      <div className="showcase-row" style={{ marginTop: 16 }}>
        <span className="showcase-row__label">values</span>
        <div className="showcase-row__items" style={{
          fontSize: 11,
          color: 'var(--btech-color-text-tertiary, #9ca3af)',
          fontFamily: 'monospace',
        }}>
          single={single} · range={rangeFrom}–{rangeTo} · vertical={vertical}
        </div>
      </div>
    </section>
  );
}
