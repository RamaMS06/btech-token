/**
 * useSync — pull and push logic extracted from SyncPanel
 * -------------------------------------------------------
 * SyncPanel renders the UI; this hook owns the async operations. Keeping
 * them separated means SyncPanel stays thin and the logic is testable
 * without rendering a component tree.
 *
 * Pull: replaces ALL sets with fresh content from the repo. Hard replace is
 * intentional — see docs/architecture/figma-plugin.md for rationale.
 *
 * Push:
 *   1. Validate all dirty sets with Ajv (block on failure).
 *   2. Detect scope tag from changed paths.
 *   3. Create branch figma/<timestamp>-<scope> off the active branch.
 *   4. Push a single atomic commit.
 *   5. Open a PR targeting the active branch with the scope label only.
 *      The bump verb (`patch` for main, `rc` for dev) is derived in CI from
 *      the merge target — the plugin no longer attaches a release label.
 *   6. Mark all dirty sets as clean.
 */

import { useCallback, useState } from 'react';
import { AzureDevOpsClient } from '../../shared/azure-devops.js';
import { detectScope } from '../../shared/scope-detector.js';
import { parseJsonToSet, serializeSetToJson } from '../../shared/transform.js';
import { validateTree } from '../../shared/validators.js';
import { useTokenStore } from '../store/tokens.js';
import { useSettingsStore } from '../store/settings.js';
import type { TokenSet } from '../../shared/types.js';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SyncState {
  status: 'idle' | 'pulling' | 'pushing' | 'error' | 'success';
  message: string | null;
  prUrl: string | null;
}

export interface ValidationFailure {
  setId: string;
  setName: string;
  errors: string[];
}

// ── Branch name helper ───────────────────────────────────────────────────────

function buildBranchName(scopeTag: string): string {
  const now = new Date();
  const pad = (n: number, l = 2) => String(n).padStart(l, '0');
  const ts =
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  // Replace colons in scope tag so the branch name is a valid git ref
  const safeScope = scopeTag.replace(/:/g, '-');
  return `figma/${ts}-${safeScope}`;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useSync() {
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    message: null,
    prUrl: null,
  });

  const tokenStore = useTokenStore();
  const settingsStore = useSettingsStore();

  // ── Pull ───────────────────────────────────────────────────────────────────

  const pull = useCallback(async (): Promise<void> => {
    const { settings } = settingsStore;
    if (!settings.pat) {
      setSyncState({ status: 'error', message: 'No PAT configured. Open Settings first.', prUrl: null });
      return;
    }

    setSyncState({ status: 'pulling', message: 'Fetching files from Azure DevOps…', prUrl: null });

    try {
      const client = new AzureDevOpsClient(settings);

      // Discover all JSON files under sources/ on the active branch
      const files = await client.listFiles(settings.activeBranch, 'packages/tokens/sources');
      const jsonFiles = files.filter((f) => f.path.endsWith('.json'));

      // Fetch all file contents in parallel — typically < 20 files, safe to fan out
      const contents = await Promise.all(
        jsonFiles.map(async (f) => {
          const content = await client.getFileContent(f.path, settings.activeBranch);
          return { path: f.path, content };
        }),
      );

      // Parse each file into a TokenSet
      const sets: Record<string, TokenSet> = {};
      for (const { path, content } of contents) {
        // Normalise leading slash (Azure DevOps returns "/packages/...")
        const normPath = path.startsWith('/') ? path.slice(1) : path;
        const tokenSet = parseJsonToSet(normPath, content);
        sets[tokenSet.id] = tokenSet;
      }

      // Get the HEAD SHA so we can store it for future change detection
      const sha = await client.getBranchHead(settings.activeBranch);

      // Fetch the canonical platform version from the repo-root package.json
      // so the header VersionField pre-fills with the right number. Reading
      // from the root rather than the web base package keeps the displayed
      // version platform-agnostic — Flutter and Python publish at the same
      // version; the displayed number is the platform release, not the web
      // package's number specifically.
      // Failure here is non-fatal — we still complete the pull, just without
      // a baseline.
      let baseVersion: string | null = null;
      try {
        const pkgJson = await client.getFileContent(
          'package.json',
          settings.activeBranch,
        );
        const parsed = JSON.parse(pkgJson) as { version?: string };
        if (parsed.version) baseVersion = parsed.version;
      } catch (err) {
        // Don't block the pull on a missing version file — designer can
        // still edit and push; auto-version.yml will then bump as usual.
        console.warn('[BTech Token Studio] Could not read root version:', err);
      }

      tokenStore.setSets(sets);
      tokenStore.setLastPull(sha, Date.now());
      // Record the version that's currently published on the active branch.
      // The header VersionLabel reads this; bumps are derived by CI from the
      // branch the PR merges into, so the plugin no longer carries a
      // designer-editable next-version field.
      tokenStore.setBaseVersion(baseVersion);

      setSyncState({
        status: 'success',
        message: `Pulled ${jsonFiles.length} file(s) from ${settings.activeBranch}.`,
        prUrl: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setSyncState({ status: 'error', message, prUrl: null });
    }
  }, [settingsStore, tokenStore]);

  // ── Push ───────────────────────────────────────────────────────────────────

  const push = useCallback(async (): Promise<ValidationFailure[]> => {
    const { settings } = settingsStore;
    if (!settings.pat) {
      setSyncState({ status: 'error', message: 'No PAT configured. Open Settings first.', prUrl: null });
      return [];
    }

    const dirty = tokenStore.dirtySets();
    if (dirty.length === 0) {
      setSyncState({ status: 'error', message: 'No changes to push.', prUrl: null });
      return [];
    }

    // Pre-push validation — block on any schema failure
    const failures: ValidationFailure[] = [];
    for (const s of dirty) {
      const result = validateTree(s.tree);
      if (!result.valid) {
        failures.push({ setId: s.id, setName: s.name, errors: result.errors });
      }
    }
    if (failures.length > 0) {
      return failures; // Caller shows errors; we don't proceed
    }

    setSyncState({ status: 'pushing', message: 'Preparing push…', prUrl: null });

    try {
      const client = new AzureDevOpsClient(settings);

      // Detect scope from changed file paths
      const changedPaths = dirty.map((s) => s.path);
      const { tag: scopeTag, tenants } = detectScope(changedPaths);
      const branchName = buildBranchName(scopeTag);

      setSyncState({ status: 'pushing', message: `Resolving ${settings.activeBranch} HEAD…`, prUrl: null });
      const baseSha = await client.getBranchHead(settings.activeBranch);

      setSyncState({ status: 'pushing', message: `Creating branch ${branchName}…`, prUrl: null });
      await client.createBranch(branchName, baseSha);

      const changes = dirty.map((s) => ({
        path: s.path,
        content: serializeSetToJson(s),
        mode: 'edit' as const,
      }));

      const tenantList = tenants.length > 0 ? tenants.join(', ') : 'none';
      // No "Target version" line in the commit/PR — version bumps are now
      // derived in CI from the merge target (`main` → patch, `dev` → rc),
      // so the plugin never proposes a number. `auto-version.yml` still
      // honours a manually-added `version:<x>` label for power users who
      // need to override on a specific PR.
      const commitMessage =
        `feat(tokens): update from Figma\n\nScope: ${scopeTag}\nBranch: ${settings.activeBranch}\nTenants: ${tenantList}`;

      setSyncState({ status: 'pushing', message: 'Committing changes…', prUrl: null });
      await client.pushChanges({
        sourceBranch: branchName,
        targetBranch: settings.activeBranch,
        baseSha,
        commitMessage,
        changes,
      });

      const pathList = changedPaths.map((p) => `- ${p}`).join('\n');
      const prDescription =
        `Token changes from Figma plugin.\n\n**Scope:** ${scopeTag}\n` +
        `**Target branch:** \`${settings.activeBranch}\`\n` +
        `**Tenants:** ${tenantList}\n\n**Changed files:**\n${pathList}`;

      // Only the scope label is attached. CI derives the bump verb from the
      // PR's target branch; release:rc is no longer hardcoded because main
      // PRs would otherwise get incorrectly tagged as prereleases.
      const labels = [scopeTag];

      setSyncState({ status: 'pushing', message: 'Opening pull request…', prUrl: null });
      const pr = await client.createPullRequest({
        sourceBranch: branchName,
        targetBranch: settings.activeBranch,
        title: `[Figma] Update tokens — ${scopeTag}`,
        description: prDescription,
        labels,
      });

      // PR created — refresh `originalTree` from the just-pushed `tree`
      // so the next "Clear changes" reverts to what's in flight to the
      // repo, not to whatever was last pulled. Also clears the dirty flag.
      tokenStore.snapshotAfterPush();

      setSyncState({
        status: 'success',
        message: `PR #${pr.id} opened. Branch: ${branchName}`,
        prUrl: pr.url,
      });

      return [];
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setSyncState({ status: 'error', message, prUrl: null });
      return [];
    }
  }, [settingsStore, tokenStore]);

  return { syncState, pull, push };
}
