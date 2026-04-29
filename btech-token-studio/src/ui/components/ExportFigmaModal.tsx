/**
 * ExportFigmaModal — push current tokens into Figma Variables
 * -------------------------------------------------------------
 * Designer-facing controls are kept to a minimum: 4 toggles, one per
 * Figma resolved Variable type. Anything that DTCG type-maps to one of
 * those 4 is exportable — composite types (`shadow`, `gradient`, ...)
 * are silently skipped by the main-thread executor with a warning.
 *
 * Why 4 toggles instead of, say, 13 DTCG types:
 *   The designer's mental model on the Figma side is exactly 4 — that's
 *   what they see in the Variables panel. Mapping back to DTCG specifics
 *   (dimension vs. number vs. duration) would force them to learn an
 *   abstraction that doesn't help the export decision at all.
 */

import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '../store/settings.js';
import { ToggleSwitch } from './ToggleSwitch.js';
import type {
  FigmaExportType,
  FigmaExportPayload,
} from '../../shared/figma-types.js';
import type { MainToUIMessage } from '../../shared/types.js';

interface ExportFigmaModalProps {
  onClose: () => void;
}

const TYPE_META: Array<{
  key: FigmaExportType;
  label: string;
  description: string;
}> = [
  {
    key: 'color',
    label: 'Color',
    description: 'DTCG color tokens → Figma Color variables.',
  },
  {
    key: 'string',
    label: 'String',
    description: 'fontFamily, strokeStyle, named fontWeight → String variables.',
  },
  {
    key: 'number',
    label: 'Number',
    description: 'dimension, number, duration → Float variables.',
  },
  {
    key: 'boolean',
    label: 'Boolean',
    description: 'Reserved for boolean tokens (e.g. visibility flags).',
  },
];

const DEFAULT_TYPES: Record<FigmaExportType, boolean> = {
  color: true,
  string: true,
  number: true,
  boolean: true,
};

export function ExportFigmaModal({ onClose }: ExportFigmaModalProps) {
  const { settings, patchSettings } = useSettingsStore();
  // Persisted toggles. Defaults handle pre-migration snapshots that
  // never hit `migrateSettings` (theoretically impossible, but cheap
  // defensive fallback).
  const enabled = settings.exportTypes ?? DEFAULT_TYPES;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{
    created: number;
    updated: number;
    warnings: string[];
  } | null>(null);

  // Listen for main-thread response. We attach the listener in an effect
  // and rely on the modal staying mounted across the round-trip — closing
  // the modal mid-flight detaches the listener and the response is dropped
  // (the main thread also calls figma.notify, so the designer still sees
  // *something*).
  useEffect(() => {
    function handle(event: MessageEvent) {
      const msg = (event.data?.pluginMessage ?? event.data) as
        | MainToUIMessage
        | undefined;
      if (!msg || typeof msg.type !== 'string') return;
      if (msg.type === 'figma-export-done') {
        setBusy(false);
        setDone({
          created: msg.created,
          updated: msg.updated,
          warnings: msg.warnings,
        });
      } else if (msg.type === 'figma-export-error') {
        setBusy(false);
        setError(msg.message);
      }
    }
    window.addEventListener('message', handle);
    return () => window.removeEventListener('message', handle);
  }, []);

  function setEnabled(key: FigmaExportType, value: boolean) {
    patchSettings({
      exportTypes: { ...enabled, [key]: value },
    });
  }

  function handleExport() {
    setError(null);
    setDone(null);
    setBusy(true);
    const payload: FigmaExportPayload = { enabledTypes: enabled };
    parent.postMessage(
      { pluginMessage: { type: 'figma-export', payload } },
      '*',
    );
  }

  // Disable Export when nothing is selected — running the export with all
  // toggles off would just produce a flurry of warnings and zero variables.
  const anyEnabled = Object.values(enabled).some(Boolean);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" role="dialog" aria-modal aria-label="Export to Figma">
        <div className="modal__header">
          <h2 className="modal__title">Export to Figma</h2>
          <button className="modal__close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal__body">
          <p className="modal__blurb">
            Write tokens into the active Figma file as Variables. Choose which
            Variable types to include — composite tokens like shadows and
            gradients are skipped automatically.
          </p>

          {TYPE_META.map(({ key, label, description }) => (
            <ToggleSwitch
              key={key}
              checked={enabled[key]}
              onChange={(next) => setEnabled(key, next)}
              label={label}
              description={description}
              disabled={busy}
            />
          ))}

          {error && (
            <div className="modal__error" role="alert">
              {error}
            </div>
          )}

          {done && (
            <div className="modal__success" role="status">
              Exported — created {done.created}, updated {done.updated} variable
              {done.created + done.updated === 1 ? '' : 's'}.
              {done.warnings.length > 0 && (
                <details className="modal__warnings">
                  <summary>{done.warnings.length} warning{done.warnings.length === 1 ? '' : 's'}</summary>
                  <ul>
                    {done.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </div>

        <div className="modal__footer">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            {done ? 'Close' : 'Cancel'}
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleExport}
            disabled={busy || !anyEnabled}
          >
            {busy ? 'Exporting…' : done ? 'Export again' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
