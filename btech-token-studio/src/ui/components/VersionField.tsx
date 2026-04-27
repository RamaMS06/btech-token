/**
 * VersionField — editable next-version input in the header
 * ---------------------------------------------------------
 * Replaces the "BTech Token Studio" title with a designer-controllable
 * version number. The value committed in this field is sent on push as a
 * `version:<x>` PR label, which `auto-version.yml` honours by writing that
 * exact version into the affected `package.json`s instead of semver-bumping.
 *
 * State sources:
 *   - `baseVersion` (read-only) — populated on pull from
 *     packages/tokens/platforms/web/token/package.json
 *   - `nextVersion` (editable) — defaults to `baseVersion`; cleared back to
 *     `baseVersion` by `discardAll()` and the Clear changes flow.
 *
 * Validation:
 *   We accept any non-empty string that loosely resembles semver
 *   (digits, dots, dashes, alphanum). A wrong value is recoverable —
 *   `bump-version.ts set <v>` enforces strict semver server-side, and the
 *   field reverts to baseVersion on blur if left empty.
 *
 * Why an inline borderless input?
 *   Designers shouldn't think of this as "filling out a form" — it's the
 *   product version, sitting where the title used to. The styling is meant
 *   to feel like a label that turns into an input on hover/focus.
 */

import React, { useEffect, useState } from 'react';
import { useTokens } from '../hooks/useTokens.js';

// Loose semver-ish guard: digits + dots + optional pre-release/build metadata
const SEMVER_LIKE = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

export function VersionField() {
  const { baseVersion, nextVersion, setNextVersion } = useTokens();

  // Local draft state so the user can type freely without each keystroke
  // dispatching to the store (and triggering a postMessage debounce).
  const [draft, setDraft] = useState<string>(nextVersion ?? baseVersion ?? '');

  // Re-sync the draft when baseVersion/nextVersion change externally
  // (e.g. after a pull or a Clear changes confirm).
  useEffect(() => {
    setDraft(nextVersion ?? baseVersion ?? '');
  }, [nextVersion, baseVersion]);

  function commit() {
    const trimmed = draft.trim();
    // Empty or invalid → revert to baseVersion (never persists garbage)
    if (!trimmed || !SEMVER_LIKE.test(trimmed)) {
      const fallback = baseVersion ?? '';
      setDraft(fallback);
      setNextVersion(baseVersion);
      return;
    }
    setNextVersion(trimmed);
  }

  const isCustom = baseVersion && nextVersion && nextVersion !== baseVersion;
  const placeholder = baseVersion ?? '1.0.0';

  // No base version yet (designer hasn't pulled) → show static label so the
  // header still reads as a product surface rather than an empty input.
  if (!baseVersion) {
    return (
      <div className="version-field version-field--placeholder" title="Pull from Azure DevOps to load the current published version.">
        <span className="version-field__label-static">BTech Token Studio</span>
      </div>
    );
  }

  return (
    <div className="version-field" title="Sets the version that will be tagged when this push is merged. Defaults to the current published version.">
      <span className="version-field__prefix" aria-hidden>v</span>
      <input
        className="version-field__input"
        type="text"
        value={draft}
        placeholder={placeholder}
        spellCheck={false}
        aria-label="Next version"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.currentTarget.blur();
          } else if (e.key === 'Escape') {
            setDraft(nextVersion ?? baseVersion ?? '');
            e.currentTarget.blur();
          }
        }}
      />
      {/* Diff cue — only shown when the designer proposed a version that
          differs from the currently published root. We deliberately render
          nothing in the steady state: the input itself IS the label, and
          showing the package name here is misleading after the move to
          root-canonical versioning (it's @btech/design-system now, but
          calling that out adds noise the designer doesn't need). */}
      {isCustom && (
        <span className="version-field__current">was {baseVersion}</span>
      )}
    </div>
  );
}
