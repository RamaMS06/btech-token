/**
 * VersionLabel — read-only platform version in the header
 * --------------------------------------------------------
 * Replaces the editable `<VersionField>` input. Versions are now driven
 * entirely by the active branch (chosen in `<BranchSwitcher>`):
 *   - branch `main` → CI auto-bumps PATCH on merge (`v1.5.4`)
 *   - branch `dev`  → CI auto-bumps prerelease (`v1.5.4-rc.N`)
 *
 * Designers no longer type a target version. The header just displays
 * what was pulled, plus a clickable "↓ new" badge when the silent
 * background poll spots a newer version on the active branch.
 *
 * Why the rename?
 *   The previous component was a borderless `<input>`, which read like
 *   a label even though it was editable. Designers couldn't tell whether
 *   they were supposed to interact with it. Killing the input removes
 *   the ambiguity entirely.
 *
 * The file name is kept (`VersionField.tsx`) so the rest of the bundle's
 * import paths are stable; only the exported component is renamed.
 */

import React from 'react';
import { useTokens } from '../hooks/useTokens.js';

interface VersionLabelProps {
  /**
   * Click handler for the "new version available" badge. Wired by App
   * to open the pull modal — the badge is the user's invitation to pull,
   * so clicking it should land them in the same place as ⚙ Pull.
   */
  onPullRequest?: () => void;
}

export function VersionLabel({ onPullRequest }: VersionLabelProps = {}) {
  const { baseVersion, remoteVersion } = useTokens();

  // No base version yet (designer hasn't pulled) → show static label so
  // the header still reads as a product surface rather than an empty
  // space. Same fallback as the old VersionField.
  if (!baseVersion) {
    return (
      <div
        className="version-field version-field--placeholder"
        title="Pull from Azure DevOps to load the current published version."
      >
        <span className="version-field__label-static">BTech Token Studio</span>
      </div>
    );
  }

  // "New version available" — fires when the silent poll finds a value
  // on the active branch's root package.json different from what we
  // pulled. The badge clears itself when designer pulls (baseVersion
  // catches up) or when the hook fails (remoteVersion goes back to null).
  const hasUpdate = Boolean(remoteVersion && remoteVersion !== baseVersion);

  return (
    <div
      className="version-field"
      title="Platform version pulled from the active branch. CI bumps it automatically when this work merges."
    >
      <span className="version-field__prefix" aria-hidden>v</span>
      <span className="version-field__static">{baseVersion}</span>

      {hasUpdate && (
        <button
          type="button"
          className="version-field__update-badge"
          onClick={onPullRequest}
          title={`Active branch is at v${remoteVersion}. Click to pull.`}
        >
          <span aria-hidden>↓</span>
          <span>v{remoteVersion}</span>
          <span className="version-field__update-badge__label">new</span>
        </button>
      )}
    </div>
  );
}
