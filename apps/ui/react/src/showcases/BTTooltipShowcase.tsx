// ignore-file — showcase only, no lint enforcement
import { useState, useRef, useMemo, useEffect, type CSSProperties, type MutableRefObject } from 'react';
import { BTTooltip, BTTooltipStep, BTCoachmarkTour } from '@btech/ui-react';
import type {
  BTTooltipPosition,
  BTTooltipArrowPosition,
  BTTooltipStepVariant,
  BTCoachmarkStep,
} from '@btech/ui-react';

const positions: BTTooltipPosition[] = ['top', 'bottom', 'left', 'right'];
const arrowPositions: BTTooltipArrowPosition[] = ['left', 'left-mid', 'mid', 'right-mid', 'right'];
const stepVariants: BTTooltipStepVariant[] = ['button', 'link', 'centered'];

interface DemoPoint {
  label: string;
  ttPos: BTTooltipPosition;
}

const demoPoints: DemoPoint[] = [
  { label: 'Top Left',      ttPos: 'bottom' },
  { label: 'Top Center',    ttPos: 'bottom' },
  { label: 'Top Right',     ttPos: 'bottom' },
  { label: 'Center Left',   ttPos: 'right'  },
  { label: 'Center',        ttPos: 'bottom' },
  { label: 'Center Right',  ttPos: 'left'   },
  { label: 'Bottom Left',   ttPos: 'top'    },
  { label: 'Bottom Center', ttPos: 'top'    },
  { label: 'Bottom Right',  ttPos: 'top'    },
];

export function BTTooltipShowcase() {
  const [activeTab, setActiveTab] = useState<'ui' | 'usage'>('ui');
  const [demoVariant, setDemoVariant] = useState<BTTooltipStepVariant>('button');
  const [tourStep, setTourStep] = useState(-1);
  const [dismissable, setDismissable] = useState(true);

  // One persistent ref object per button (typed as HTMLElement for org component).
  const btnRefs = useRef<MutableRefObject<HTMLElement | null>[]>(
    demoPoints.map(() => ({ current: null })),
  );

  const steps = useMemo<BTCoachmarkStep[]>(
    () =>
      demoPoints.map((pt, i) => ({
        targetRef: btnRefs.current[i]!,
        label: pt.label,
        description: `Ini adalah langkah ${i + 1} dari ${demoPoints.length}.`,
        stepLabel: `Step ${i + 1} of ${demoPoints.length}`,
        stepVariant: demoVariant,
        position: pt.ttPos,
        prevLabel: 'Kembali',
        nextLabel: 'Selanjutnya',
      })),
    [demoVariant],
  );

  const closeStep = (): void => setTourStep(-1);

  // Clean up on unmount / tab change
  useEffect(() => () => setTourStep(-1), []);

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
            onClick={() => { setActiveTab(t); closeStep(); }}
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
          <h3 style={subtitleStyle}>BTTooltip — Positions</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48, padding: '32px 0' }}>
            {positions.map((pos) => (
              <BTTooltip key={pos} position={pos}
                text="A message which appears when a cursor is positioned over an element."
              >
                <button style={triggerStyle}>Hover ({pos})</button>
              </BTTooltip>
            ))}
          </div>

          <h3 style={subtitleStyle}>BTTooltip — Arrow Positions (position=bottom)</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48, padding: '32px 0' }}>
            {arrowPositions.map((ap) => (
              <BTTooltip key={ap} position="bottom" arrowPosition={ap} text={`Arrow: ${ap}`}>
                <button style={triggerStyle}>{ap}</button>
              </BTTooltip>
            ))}
          </div>

          <h3 style={subtitleStyle}>BTTooltip — Rich Content</h3>
          <div style={{ padding: '32px 0' }}>
            <BTTooltip position="bottom" arrowPosition="left"
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

          <h3 style={subtitleStyle}>BTTooltipStep — Step Variants</h3>
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

          <h3 style={subtitleStyle}>BTTooltipStep — Arrow Positions</h3>
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

          <h3 style={subtitleStyle}>BTTooltipStep — Description Only</h3>
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
          <h3 style={subtitleStyle}>Interactive Coachmark Demo</h3>
          <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 16px' }}>
            Pilih gaya tombol, lalu klik salah satu dari 9 posisi untuk melihat BTTooltipStep.
          </p>

          {/* Variant selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {stepVariants.map((v) => (
              <button
                key={v}
                onClick={() => { setDemoVariant(v); closeStep(); }}
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
          </div>

          {/* Dismissable toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>Dismissable:</span>
            <button
              onClick={() => setDismissable((d) => !d)}
              style={{
                padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0',
                background: dismissable ? '#1e293b' : 'white',
                color: dismissable ? 'white' : '#334155',
                cursor: 'pointer', fontSize: 13, fontWeight: 500,
              }}
            >
              {dismissable ? 'ON' : 'OFF'}
            </button>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>
              {dismissable ? '— klik luar untuk tutup' : '— klik luar tidak tutup'}
            </span>
          </div>

          {/* 9-button CSS grid */}
          <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 8px' }}>
            Klik tombol di posisi manapun:
          </p>
          <div style={gridContainerStyle}>
            <div style={gridHintStyle}>← klik tombol manapun →</div>

            {demoPoints.map((pt, i) => (
              <button
                key={pt.label}
                ref={(el) => { btnRefs.current[i]!.current = el; }}
                onClick={() => setTourStep(i)}
                style={{
                  ...gridBtnStyle,
                  background: tourStep === i ? '#1e293b' : '#4a9d5b',
                  gridColumn: (i % 3) + 1,
                  gridRow: Math.floor(i / 3) + 1,
                  alignSelf: i < 3 ? 'start' : i < 6 ? 'center' : 'end',
                  justifySelf: i === 4 ? 'center' : 'auto',
                }}
              >
                {pt.label}
              </button>
            ))}
          </div>

          <BTCoachmarkTour
            steps={steps}
            step={tourStep}
            dismissable={dismissable}
            stepVariant={demoVariant}
            onStepChange={setTourStep}
            onFinish={closeStep}
          />
        </>
      )}
    </section>
  );
}

// ── Style constants ────────────────────────────────────────────────────────

const subtitleStyle: CSSProperties = {
  fontSize: 14, fontWeight: 600, color: '#334155', margin: '24px 0 8px',
};

const triggerStyle: CSSProperties = {
  padding: '8px 16px', borderRadius: 6, border: '1px solid #e2e8f0',
  background: 'white', color: '#334155', cursor: 'pointer',
  fontSize: 14, fontWeight: 500,
};

const gridContainerStyle: CSSProperties = {
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: 'auto 1fr auto',
  gridTemplateRows: 'auto 1fr auto',
  minHeight: 360,
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  overflow: 'hidden',
  marginBottom: 24,
};

const gridHintStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 13,
  color: '#e2e8f0',
  pointerEvents: 'none',
  userSelect: 'none',
};

const gridBtnStyle: CSSProperties = {
  padding: '8px 12px',
  border: 'none',
  borderRadius: 6,
  margin: 12,
  color: 'white',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};
