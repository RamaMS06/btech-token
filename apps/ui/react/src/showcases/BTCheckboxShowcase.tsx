// BTCheckboxShowcase — Figma 504:4181
import { useState } from 'react';
import { BTCheckbox } from '@btech/ui-react';

export function BTCheckboxShowcase() {
  const [interactive, setInteractive] = useState(false);

  return (
    <section className="showcase-section">
      <h2 className="showcase-section__title">BTCheckbox — Figma 504:4181</h2>
      <p className="showcase-section__subtitle">
        7 states · optional label + subtext · indeterminate via prop ·
        error border + subtext colour.
      </p>

      {/* Box only — all 7 states */}
      <div className="showcase-row">
        <span className="showcase-row__label">uncheck</span>
        <div className="showcase-row__items">
          <BTCheckbox checked={false} />
        </div>
      </div>

      <div className="showcase-row">
        <span className="showcase-row__label">check</span>
        <div className="showcase-row__items">
          <BTCheckbox checked={true} />
        </div>
      </div>

      <div className="showcase-row">
        <span className="showcase-row__label">indeterminate</span>
        <div className="showcase-row__items">
          <BTCheckbox checked={false} indeterminate />
        </div>
      </div>

      <div className="showcase-row">
        <span className="showcase-row__label">disable uncheck</span>
        <div className="showcase-row__items">
          <BTCheckbox checked={false} disabled />
        </div>
      </div>

      <div className="showcase-row">
        <span className="showcase-row__label">disable check</span>
        <div className="showcase-row__items">
          <BTCheckbox checked={true} disabled />
        </div>
      </div>

      <div className="showcase-row">
        <span className="showcase-row__label">disable indet.</span>
        <div className="showcase-row__items">
          <BTCheckbox checked={false} indeterminate disabled />
        </div>
      </div>

      <div className="showcase-row">
        <span className="showcase-row__label">error</span>
        <div className="showcase-row__items">
          <BTCheckbox checked={false} error />
        </div>
      </div>

      {/* With label */}
      <div className="showcase-row" style={{ marginTop: 16 }}>
        <span className="showcase-row__label">with label</span>
        <div className="showcase-row__items">
          <BTCheckbox checked={false} label="Accept terms" />
          <BTCheckbox checked={true} label="Checked" />
          <BTCheckbox checked={false} disabled label="Disabled" />
        </div>
      </div>

      {/* With label + subtext */}
      <div className="showcase-row">
        <span className="showcase-row__label">with subtext</span>
        <div className="showcase-row__items">
          <BTCheckbox
            checked={false}
            label="Subscribe"
            subtext="Receive weekly digest"
          />
          <BTCheckbox
            checked={false}
            error
            label="Required"
            subtext="Please accept to continue"
          />
          <BTCheckbox
            checked={true}
            disabled
            label="Locked"
            subtext="Cannot be changed"
          />
        </div>
      </div>

      {/* Interactive */}
      <div className="showcase-row" style={{ marginTop: 16 }}>
        <span className="showcase-row__label">interactive</span>
        <div className="showcase-row__items">
          <BTCheckbox
            checked={interactive}
            onChange={setInteractive}
            label="Toggle me"
            subtext={interactive ? 'Checked ✓' : 'Unchecked'}
          />
        </div>
      </div>
    </section>
  );
}
