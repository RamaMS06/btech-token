/**
 * ImportExportMenu — icon trigger + upward popover with 2 actions
 * -----------------------------------------------------------------
 * Lives next to the Settings cog in the BottomActionBar. The popover
 * opens UPWARD because the trigger sits at the bottom of the plugin —
 * a downward popover would be clipped by the Figma chrome.
 *
 * The menu is intentionally minimal (just two actions, no submenus) —
 * any expansion belongs in the dedicated modal that the action launches,
 * not in this popover.
 */

import React, { useEffect, useRef, useState } from 'react';

interface ImportExportMenuProps {
  onSelect: (mode: 'export' | 'import') => void;
}

export function ImportExportMenu({ onSelect }: ImportExportMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click + Esc. We attach to mousedown rather than
  // click so the popover dismisses *before* the underlying element sees
  // the click — important when the user clicks Settings expecting that
  // panel to open without first eating their click on the popover.
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function handleSelect(mode: 'export' | 'import') {
    setOpen(false);
    onSelect(mode);
  }

  return (
    <div className="import-export-menu" ref={containerRef}>
      <button
        type="button"
        className="bottom-action-bar__icon-btn"
        onClick={() => setOpen((v) => !v)}
        title="Import / Export Figma"
        aria-label="Import / Export Figma"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {/* Two-arrow glyph: up + down — communicates bidirectional sync */}
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
          <path
            d="M4 1.5v6m0 0L2 5.5m2 2L6 5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M10 12.5v-6m0 0L8 8.5m2-2L12 8.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="import-export-menu__popover" role="menu">
          <button
            type="button"
            className="import-export-menu__item"
            role="menuitem"
            onClick={() => handleSelect('export')}
          >
            <span className="import-export-menu__item-icon" aria-hidden>
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path
                  d="M6 1.5v7m0 0L3.5 6m2.5 2.5L8.5 6M2 10.5h8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>Export to Figma</span>
          </button>
          <button
            type="button"
            className="import-export-menu__item"
            role="menuitem"
            onClick={() => handleSelect('import')}
          >
            <span className="import-export-menu__item-icon" aria-hidden>
              <svg width="12" height="12" viewBox="0 0 12 12">
                <path
                  d="M6 10.5v-7m0 0L3.5 6m2.5-2.5L8.5 6M2 1.5h8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>Import Styles</span>
          </button>
        </div>
      )}
    </div>
  );
}
