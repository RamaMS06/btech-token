import { useState } from 'react';
import { BTTooltip, BTTooltipStep } from '@btech/ui-react';
import type { BTTooltipPosition, BTTooltipArrowPosition, BTTooltipStepVariant } from '@btech/ui-react';

const positions: BTTooltipPosition[] = ['top', 'bottom', 'left', 'right'];
const arrowPositions: BTTooltipArrowPosition[] = ['left', 'left-mid', 'mid', 'right-mid', 'right'];
const stepVariants: BTTooltipStepVariant[] = ['button', 'link', 'centered'];

export function BTTooltipShowcase() {
  const [activeTab, setActiveTab] = useState<'ui' | 'usage'>('ui');
  const [demoStep, setDemoStep] = useState(1);
  const [demoVariant, setDemoVariant] = useState<BTTooltipStepVariant>('button');
  const [showStep, setShowStep] = useState(false);
  const totalSteps = 5;

  function goPrev() {
    setDemoStep((s) => Math.max(1, s - 1));
  }
  function goNext() {
    setDemoStep((s) => {
      if (s >= totalSteps) { setShowStep(false); return 1; }
      return s + 1;
    });
  }
  function endTour() { setShowStep(false); setDemoStep(1); }
  function startTour() { setShowStep(true); setDemoStep(1); }

  return (
    <section style={{ padding: 24 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 16px' }}>
        BTTooltip + BTTooltipStep
      </h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
        {(['ui', 'usage'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            style={{
              padding: '6px 16px', borderRadius: 6, border: '1px solid #e2e8f0',
              background: activeTab === t ? '#1e293b' : 'white',
              color: activeTab === t ? 'white' : '#334155',
              cursor: 'pointer', fontSize: 14, fontWeight: 500,
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* ── UI Tab ── */}
      {activeTab === 'ui' && (
        <>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#334155', margin: '24px 0 8px' }}>
            BTTooltip — Positions
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48, padding: '32px 0' }}>
            {positions.map((pos) => (
              <BTTooltip
                key={pos}
                position={pos}
                text="A message which appears when a cursor is positioned over an element."
              >
                <button style={triggerStyle}>Hover ({pos})</button>
              </BTTooltip>
            ))}
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#334155', margin: '24px 0 8px' }}>
            BTTooltip — Arrow Positions (position=bottom)
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48, padding: '32px 0' }}>
            {arrowPositions.map((ap) => (
              <BTTooltip
                key={ap}
                position="bottom"
                arrowPosition={ap}
                text={`Arrow: ${ap}`}
              >
                <button style={triggerStyle}>{ap}</button>
              </BTTooltip>
            ))}
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#334155', margin: '24px 0 8px' }}>
            BTTooltip — Rich Content
          </h3>
          <div style={{ padding: '32px 0' }}>
            <BTTooltip
              position="bottom"
              arrowPosition="left"
              content={
                <>
                  <p style={{ margin: '0 0 4px', color: 'white', fontWeight: 700, fontSize: 14 }}>
                    Status Breakdown
                  </p>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: 13 }}>
                    Active: 12 · Closed: 38
                  </p>
                </>
              }
            >
              <button style={triggerStyle}>Hover for rich content</button>
            </BTTooltip>
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#334155', margin: '24px 0 8px' }}>
            BTTooltipStep — Step Variants
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, padding: '16px 0' }}>
            {stepVariants.map((variant) => (
              <div key={variant}>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px', textTransform: 'capitalize' }}>
                  {variant}
                </p>
                <BTTooltipStep
                  label="Fitur Baru"
                  description="Klik tombol ini untuk melanjutkan ke langkah berikutnya."
                  stepLabel="Step 1 of 5"
                  stepVariant={variant}
                  hasClose
                  position="bottom"
                />
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#334155', margin: '24px 0 8px' }}>
            BTTooltipStep — Arrow Positions
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, padding: '16px 0' }}>
            {positions.map((pos) => (
              <div key={pos}>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px', textTransform: 'capitalize' }}>
                  position={pos}
                </p>
                <BTTooltipStep
                  description={`Balloon dengan arrow di sisi ${pos}.`}
                  stepLabel="Step 1 of 3"
                  position={pos}
                />
              </div>
            ))}
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#334155', margin: '24px 0 8px' }}>
            BTTooltipStep — Description Only
          </h3>
          <div style={{ padding: '16px 0' }}>
            <BTTooltipStep
              description="A message which appears when a cursor is positioned over an icon, image, hyperlink, or other element in a graphical user interface."
              position="top"
              arrowPosition="left"
            />
          </div>
        </>
      )}

      {/* ── Usage Tab ── */}
      {activeTab === 'usage' && (
        <>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#334155', margin: '0 0 8px' }}>
            Interactive Coachmark Tour
          </h3>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 16px' }}>
            Pilih style tombol navigasi lalu klik "Start Tour".
          </p>

          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
            {stepVariants.map((v) => (
              <button
                key={v}
                onClick={() => setDemoVariant(v)}
                style={{
                  padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0',
                  background: demoVariant === v ? '#1e293b' : 'white',
                  color: demoVariant === v ? 'white' : '#334155',
                  cursor: 'pointer', fontSize: 13, fontWeight: 500,
                }}
              >
                {v}
              </button>
            ))}
            <button
              onClick={startTour}
              style={{
                padding: '6px 12px', borderRadius: 6, border: '1px solid #145bc3',
                background: '#145bc3', color: 'white', cursor: 'pointer',
                fontSize: 13, fontWeight: 500, marginLeft: 'auto',
              }}
            >
              Start Tour
            </button>
          </div>

          {showStep ? (
            <div style={{ maxWidth: 360 }}>
              <BTTooltipStep
                label="Contoh Coachmark"
                description={`Ini adalah langkah ${demoStep} dari ${totalSteps}.`}
                stepLabel={`Step ${demoStep} of ${totalSteps}`}
                stepVariant={demoVariant}
                hasClose
                prevLabel="Kembali"
                nextLabel="Selanjutnya"
                position="bottom"
                onPrev={goPrev}
                onNext={goNext}
                onClose={endTour}
              />
            </div>
          ) : (
            <div style={{
              padding: 16, background: '#f8fafc', borderRadius: 8,
              color: '#64748b', fontSize: 14,
            }}>
              Tour selesai. Klik "Start Tour" untuk mengulang.
            </div>
          )}
        </>
      )}
    </section>
  );
}

const triggerStyle: React.CSSProperties = {
  padding: '8px 16px', borderRadius: 6, border: '1px solid #e2e8f0',
  background: 'white', color: '#334155', cursor: 'pointer',
  fontSize: 14, fontWeight: 500,
};
