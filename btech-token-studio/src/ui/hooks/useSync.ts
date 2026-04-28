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
import type {
  TokenSet,
  ActiveBranch,
  BranchSnapshot,
} from '../../shared/types.js';

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

/**
 * Which branches to refresh on `pull`.
 *  - `'active'` → just the currently selected branch (legacy default).
 *  - `'main'` / `'dev'` → fetch one specific branch even if it isn't active
 *    (warms the cache for future swaps).
 *  - `'all'`    → fetch BOTH branches in parallel; afterwards the designer
 *    can flip between them with no further network calls.
 */
export type PullTarget = 'active' | 'all' | 'main' | 'dev';

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

  /**
   * Fetch one branch's full state (sets + baseVersion + HEAD sha) into a
   * `BranchSnapshot`. Pure function relative to the store — the caller
   * decides whether to commit the snapshot or discard it (e.g. on error).
   */
  async function pullBranchSnapshot(
    client: AzureDevOpsClient,
    branch: ActiveBranch,
  ): Promise<{ snapshot: BranchSnapshot; fileCount: number }> {
    const files = await client.listFiles(branch, 'packages/tokens/sources');
    const jsonFiles = files.filter((f) => f.path.endsWith('.json'));

    const contents = await Promise.all(
      jsonFiles.map(async (f) => {
        const content = await client.getFileContent(f.path, branch);
        return { path: f.path, content };
      }),
    );

    const sets: Record<string, TokenSet> = {};
    for (const { path, content } of contents) {
      const normPath = path.startsWith('/') ? path.slice(1) : path;
      const tokenSet = parseJsonToSet(normPath, content);
      sets[tokenSet.id] = tokenSet;
    }

    const sha = await client.getBranchHead(branch);

    let baseVersion: string | null = null;
    try {
      const pkgJson = await client.getFileContent('package.json', branch);
      const parsed = JSON.parse(pkgJson) as { version?: string };
      if (parsed.version) baseVersion = parsed.version;
    } catch (err) {
      console.warn(
        `[BTech Token Studio] Could not read root version on ${branch}:`,
        err,
      );
    }

    return {
      snapshot: { sets, baseVersion, lastPullSha: sha, lastPullAt: Date.now() },
      fileCount: jsonFiles.length,
    };
  }

  const pull = useCallback(
    async (target: PullTarget = 'active'): Promise<void> => {
      const { settings } = settingsStore;
      if (!settings.pat) {
        setSyncState({
          status: 'error',
          message: 'No PAT configured. Open Settings first.',
          prUrl: null,
        });
        return;
      }

      // Resolve which branches to fetch. `'active'` is the legacy single-
      // branch behaviour; `'all'` warms both caches in one click; named
      // values let the designer pre-warm the inactive branch without
      // switching to it first.
      const branches: ActiveBranch[] =
        target === 'all'
          ? ['main', 'dev']
          : target === 'active'
            ? [settings.activeBranch]
            : [target];

      const label =
        branches.length === 1
          ? `branch ${branches[0]}`
          : `branches ${branches.join(', ')}`;
      setSyncState({
        status: 'pulling',
        message: `Fetching ${label} from Azure DevOps…`,
        prUrl: null,
      });

      try {
        const client = new AzureDevOpsClient(settings);

        // Fan out across the requested branches. Each branch fetch is
        // independent so they can run in parallel — typically < 20 files
        // each, well within Azure DevOps rate limits.
        const results = await Promise.all(
          branches.map(async (branch) => ({
            branch,
            ...(await pullBranchSnapshot(client, branch)),
          })),
        );

        // Commit each snapshot. `commitBranchPull` mirrors the active
        // branch's snapshot into the top-level fields automatically; the
        // inactive branch only updates the cache.
        for (const { branch, snapshot } of results) {
          tokenStore.commitBranchPull(branch, snapshot, settings.activeBranch);
        }

        const totalFiles = results.reduce((sum, r) => sum + r.fileCount, 0);
        setSyncState({
          status: 'success',
          message:
            branches.length === 1
              ? `Pulled ${totalFiles} file(s) from ${branches[0]}.`
              : `Pulled ${totalFiles} file(s) across ${branches.join(' + ')}.`,
          prUrl: null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setSyncState({ status: 'error', message, prUrl: null });
      }
    },
    [settingsStore, tokenStore],
  );

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
