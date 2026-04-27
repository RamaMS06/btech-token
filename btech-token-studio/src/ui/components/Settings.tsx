/**
 * Settings modal — PAT + repo connection configuration
 * ------------------------------------------------------
 * Inputs: Organization URL, Project, Repo, PAT.
 *
 * The active branch (`main` vs `dev`) is intentionally NOT a Settings
 * field — it's a per-session filter exposed via `<BranchSwitcher>` in the
 * header so designers can swap stable / rc baselines without opening this
 * modal. Settings is reserved for connection config that rarely changes.
 *
 * "Test connection" calls the Azure DevOps connectionData endpoint to
 * verify the PAT is valid before the designer tries a real pull/push.
 *
 * PAT is rendered as type="password" — never logged anywhere in the plugin.
 */

import React, { useState } from 'react';
import { AzureDevOpsClient } from '../../shared/azure-devops.js';
import { useSettingsStore } from '../store/settings.js';
import type { Settings } from '../../shared/types.js';

// ── Props ────────────────────────────────────────────────────────────────────

interface SettingsProps {
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SettingsPanel({ onClose }: SettingsProps) {
  const { settings, setSettings } = useSettingsStore();

  // Local draft — don't commit to store until Save is clicked
  const [draft, setDraft] = useState<Settings>({ ...settings });
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');

  function patch(key: keyof Settings, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  async function handleTestConnection() {
    if (!draft.pat) {
      setTestStatus('fail');
      return;
    }
    setTestStatus('testing');
    try {
      const client = new AzureDevOpsClient(draft);
      const ok = await client.testConnection();
      setTestStatus(ok ? 'ok' : 'fail');
    } catch {
      setTestStatus('fail');
    }
  }

  function handleSave() {
    setSettings(draft);
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal aria-label="Settings">
        <div className="modal__header">
          <h2 className="modal__title">Settings</h2>
          <button className="modal__close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal__body">
          <label className="form-field">
            <span className="form-field__label">Organization URL</span>
            <input
              className="form-field__input"
              type="url"
              placeholder="https://dev.azure.com/your-org"
              value={draft.orgUrl}
              onChange={(e) => patch('orgUrl', e.target.value)}
            />
          </label>

          <label className="form-field">
            <span className="form-field__label">Project</span>
            <input
              className="form-field__input"
              type="text"
              placeholder="BUMA - Bspace Design System"
              value={draft.project}
              onChange={(e) => patch('project', e.target.value)}
            />
          </label>

          <label className="form-field">
            <span className="form-field__label">Repository</span>
            <input
              className="form-field__input"
              type="text"
              placeholder="btech-ds"
              value={draft.repo}
              onChange={(e) => patch('repo', e.target.value)}
            />
          </label>

          <label className="form-field">
            <span className="form-field__label">
              Personal Access Token
              <a
                href="https://dev.azure.com/buma/_usersSettings/tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="form-field__help-link"
                title="Generate PAT — scope: Code (Read & Write)"
              >
                Generate PAT
              </a>
            </span>
            <input
              className="form-field__input"
              type="password"
              placeholder="Personal access token (Code: Read & Write)"
              value={draft.pat}
              onChange={(e) => patch('pat', e.target.value)}
              autoComplete="off"
            />
          </label>

          <div className="form-field form-field--row">
            <button
              className="btn btn--secondary"
              onClick={handleTestConnection}
              disabled={testStatus === 'testing'}
            >
              {testStatus === 'testing' ? 'Testing…' : 'Test connection'}
            </button>
            {testStatus === 'ok' && (
              <span className="connection-status connection-status--ok">Connected</span>
            )}
            {testStatus === 'fail' && (
              <span className="connection-status connection-status--fail">
                Failed — check PAT + URL
              </span>
            )}
          </div>
        </div>

        <div className="modal__footer">
          <button className="btn btn--secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
