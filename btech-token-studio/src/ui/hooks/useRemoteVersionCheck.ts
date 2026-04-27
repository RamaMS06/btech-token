/**
 * useRemoteVersionCheck — silent background poll for the canonical platform
 * version on the currently active branch (`main` or `dev`).
 * --------------------------------------------------------------------------
 * Designers usually open the plugin without pulling first — they want to
 * keep editing where they left off. That's fine until the active branch's
 * root version moves underneath them (a teammate merged a release while
 * they were away). Editing on a stale baseline doesn't break anything, but
 * the version label reflects an out-of-date number and the next push goes
 * out against the old base.
 *
 * This hook fetches `package.json` from the active branch on plugin mount,
 * again after each successful push, and again whenever the designer
 * switches branches (the effect dep on `settings.activeBranch` re-fires
 * the check). The result lives in `tokenStore.remoteVersion` for the
 * `VersionLabel` badge to consume.
 *
 * Failure modes (PAT missing, offline, branch missing) are silent — the
 * badge simply doesn't appear. We never surface this as an error toast
 * because the check is opportunistic; the designer can still pull
 * manually if they want to confirm they're up to date.
 */

import { useCallback, useEffect } from 'react';
import { AzureDevOpsClient } from '../../shared/azure-devops.js';
import { useSettingsStore } from '../store/settings.js';
import { useTokenStore } from '../store/tokens.js';

export function useRemoteVersionCheck() {
  const settings = useSettingsStore((s) => s.settings);
  const settingsLoaded = useSettingsStore((s) => s.isLoaded);
  const setRemoteVersion = useTokenStore((s) => s.setRemoteVersion);

  /**
   * Perform a single check. Exposed as a callback so callers (e.g. SyncPanel
   * after a successful push) can re-run the check on demand without waiting
   * for an effect.
   */
  const check = useCallback(async (): Promise<void> => {
    // Need a PAT to read from Azure DevOps; if Settings hasn't been opened
    // yet, fail silently rather than nag the designer.
    if (!settings.pat) return;

    try {
      const client = new AzureDevOpsClient(settings);
      const pkgJson = await client.getFileContent('package.json', settings.activeBranch);
      const parsed = JSON.parse(pkgJson) as { version?: string };
      if (parsed.version) {
        setRemoteVersion(parsed.version);
      } else {
        setRemoteVersion(null);
      }
    } catch (err) {
      // Network blip, branch renamed, PAT expired — none of these warrant
      // an error UI. Clear the badge state and move on.
      console.debug('[BTech Token Studio] remote version check failed:', err);
      setRemoteVersion(null);
    }
  }, [settings, setRemoteVersion]);

  // Run after settings hydrate, and again whenever the designer switches
  // branches. The dep on `settingsLoaded` keeps us from firing while
  // settings.pat is still the default-empty string. The dep on
  // `settings.activeBranch` ensures the badge tracks the new branch's
  // remote version after a switch — without it the badge would keep
  // showing the previous branch's diff.
  useEffect(() => {
    if (!settingsLoaded) return;
    void check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoaded, settings.activeBranch]);

  return { check };
}
