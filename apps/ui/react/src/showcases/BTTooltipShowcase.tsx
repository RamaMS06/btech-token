// ignore-file — showcase only, no lint enforcement
import { useState, useRef, useCallback, useEffect, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { BTTooltip, BTTooltipStep } from '@btech/ui-react';
import type { BTTooltipPosition, BTTooltipArrowPosition, BTTooltipStepVariant } from '@btech/ui-react';

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

const BALLOON_W = 320;
const BALLOON_H = 160;
const ARROW = 8;
const GAP = 2;

export function BTTooltipShowcase() {
  const [activeTab, setActiveTab] = useState<'ui' | 'usage'>('ui');
  const [demoVariant, setDemoVariant] = useState<BTTooltipStepVariant>('button');
  const [activeIdx, setActiveIdx] = useState(-1);
  const [stepPos, setStepPos] = useState({ top: 0, left: 0 });
  const [stepTTPos, setStepTTPos] = useState<BTTooltipPosition>('bottom');
  const [stepArrowOffset, setStepArrowOffset] = useState('50%');
  const [spotlightRect, setSpotlightRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const [dismissable, setDismissable] = useState(true);

  const btnRefs = useRef<(HTMLButtonElement | null)[]>(Array(9).fill(null));

  const showStep = useCallback((idx: number) => {
    const btn = btnRefs.current[idx];
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    // Capture trigger bounds for the spotlight overlay
    setSpotlightRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });

    const pt = demoPoints[idx];
    const tcx = rect.left + rect.width / 2;
    const tcy = rect.top + rect.height / 2;

    let top = 0;
    let left = 0;

    switch (pt.ttPos) {
      case 'top':
        top  = rect.top  - BALLOON_H - ARROW - GAP;
        left = tcx - BALLOON_W / 2;
        break;
      case 'bottom':
        top  = rect.bottom + GAP;          // arrow is inside balloon top — no extra ARROW offset
        left = tcx - BALLOON_W / 2;
        break;
      case 'left':
        top  = tcy - BALLOON_H / 2;
        left = rect.left - BALLOON_W - ARROW - GAP;
        break;
      case 'right':
        top  = tcy - BALLOON_H / 2;
        left = rect.right + GAP;           // arrow is inside balloon left — no extra ARROW offset
        break;
    }

    left = Math.max(8, Math.min(left, window.innerWidth  - BALLOON_W - 8));
    top  = Math.max(8, Math.min(top,  window.innerHeight - BALLOON_H - 8));

    const offset =
      (pt.ttPos === 'left' || pt.ttPos === 'right')
        ? tcy - top
        : tcx - left;

    setStepPos({ top, left });
    setStepTTPos(pt.ttPos);
    setStepArrowOffset(`${offset}px`);
    setActiveIdx(idx);
  }, []);

  const closeStep = useCallback(() => { setActiveIdx(-1); setSpotlightRect(null); }, []);

  const goPrev = useCallback(() => {
    setActiveIdx((cur) => {
      if (cur > 0) { showStep(cur - 1); }
      else { setActiveIdx(-1); }
      return cur;
    });
  }, [showStep]);

  const goNext = useCallback(() => {
    setActiveIdx((cur) => {
      if (cur < demoPoints.length - 1) { showStep(cur + 1); }
      else { setActiveIdx(-1); }
      return cur;
    });
  }, [showStep]);

  // Clean up on unmount / tab change
  useEffect(() => { return () => setActiveIdx(-1); }, []);

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
            {/* Hint text */}
            <div style={gridHintStyle}>← klik tombol manapun →</div>

            {demoPoints.map((pt, i) => (
              <button
                key={pt.label}
                ref={(el) => { btnRefs.current[i] = el; }}
                onClick={() => showStep(i)}
                style={{
                  ...gridBtnStyle,
                  background: activeIdx === i ? '#1e293b' : '#4a9d5b',
                  gridColumn: (i % 3) + 1,
                  gridRow: Math.floor(i / 3) + 1,
                  alignSelf: i < 3 ? 'start' : i < 6 ? 'center' : 'end',
                  justifySelf: i === 4 ? 'center' : 'auto', // center button compact
                }}
              >
                {pt.label}
              </button>
            ))}
          </div>

          {/* Portal: backdrop + animated step */}
          {createPortal(
            <>
              {/* Spotlight: dark overlay with a rounded-rect cutout over the trigger */}
              {activeIdx >= 0 && spotlightRect && (
                <div
                  key="backdrop"
                  style={{
                    position: 'fixed',
                    top:    spotlightRect.top    - 4,
                    left:   spotlightRect.left   - 4,
                    width:  spotlightRect.width  + 8,
                    height: spotlightRect.height + 8,
                    borderRadius: 5,
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.55)',
                    zIndex: 1999,
                    cursor: dismissable ? 'pointer' : 'default',
                  }}
                  onClick={dismissable ? closeStep : undefined}
                />
              )}

              {/* Step balloon */}
              {activeIdx >= 0 && (
                <div
                  key={`step-${activeIdx}`}
                  style={{
                    position: 'fixed',
                    zIndex: 2000,
                    top: stepPos.top,
                    left: stepPos.left,
                    pointerEvents: 'all',
                    animation: 'coachmark-in 0.18s ease forwards',
                  }}
                >
                  <BTTooltipStep
                    label={demoPoints[activeIdx].label}
                    description={`Ini adalah langkah ${activeIdx + 1} dari ${demoPoints.length}.`}
                    stepLabel={`Step ${activeIdx + 1} of ${demoPoints.length}`}
                    stepVariant={demoVariant}
                    hasClose
                    prevLabel="Kembali"
                    nextLabel="Selanjutnya"
                    position={stepTTPos}
                    arrowOffset={stepArrowOffset}
                    onPrev={goPrev}
                    onNext={goNext}
                    onClose={closeStep}
                  />
                </div>
              )}
            </>,
            document.body,
          )}
        </>
      )}

      {/* Inline keyframe animation — injected once */}
      <style>{`
        @keyframes coachmark-in {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
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

