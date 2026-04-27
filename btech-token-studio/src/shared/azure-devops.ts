/**
 * Azure DevOps Git REST API client
 * ----------------------------------
 * Wraps the Git REST API (api-version=7.1) used for pull and push operations.
 * All network calls go through the Figma plugin sandbox's fetch() — no Node.js
 * http module. The manifest's networkAccess.allowedDomains restricts calls to
 * https://dev.azure.com only.
 *
 * Auth: HTTP Basic with empty username + PAT (":" + pat, base64-encoded).
 * This is the standard Azure DevOps PAT auth scheme.
 *
 * Push strategy (two-step):
 *   1. Create the new branch via POST /refs (pointing to baseSha)
 *   2. Push the commit(s) via POST /pushes onto that new branch
 *
 * We use this split rather than a single-push "create branch + commit"
 * because the Azure DevOps Pushes API uses oldObjectId for optimistic
 * concurrency: on a brand-new branch, that ID is ambiguous. Creating the
 * branch via /refs first and then pushing with the known SHA is cleaner.
 *
 * Reference: https://learn.microsoft.com/en-us/rest/api/azure/devops/git/
 */

import type { Settings } from './types.js';

// ── Internal types ──────────────────────────────────────────────────────────

interface PushChange {
  path: string;
  content: string;
  mode: 'edit' | 'add' | 'delete';
}

interface PushOptions {
  /** Branch we're pushing to (must already exist) */
  sourceBranch: string;
  /** Used only to label the PR — not the push target */
  targetBranch: string;
  /** SHA of the commit at the tip of sourceBranch */
  baseSha: string;
  commitMessage: string;
  changes: PushChange[];
}

interface PushResult {
  commitId: string;
}

interface CreatePROptions {
  sourceBranch: string;
  targetBranch: string;
  title: string;
  description: string;
  labels: string[];
}

interface CreatePRResult {
  id: number;
  url: string;
}

// ── Client ──────────────────────────────────────────────────────────────────

export class AzureDevOpsClient {
  private readonly settings: Settings;

  constructor(settings: Settings) {
    this.settings = settings;
  }

  // ── Auth / URL helpers ────────────────────────────────────────────────────

  private headers(): Record<string, string> {
    // PAT auth: empty username, PAT as password. base64(":pat")
    const encoded = btoa(':' + this.settings.pat);
    return {
      Authorization: `Basic ${encoded}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  private apiBase(): string {
    const { orgUrl, project, repo } = this.settings;
    // Strip trailing slash — common user paste mistake produces URLs like
    // `https://dev.azure.com/buma//PROJECT/...` which Azure DevOps rejects.
    const org = orgUrl.replace(/\/+$/, '');
    return `${org}/${encodeURIComponent(project)}/_apis/git/repositories/${encodeURIComponent(repo)}`;
  }

  // ── Error helper ──────────────────────────────────────────────────────────

  private async assertOk(res: Response, context: string): Promise<void> {
    if (res.ok) return;
    let body = '';
    try {
      body = await res.text();
    } catch {
      // ignore — we'll report status only
    }
    throw new Error(
      `Azure DevOps ${context} failed: HTTP ${res.status} ${res.statusText}. Body: ${body.slice(0, 300)}`,
    );
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Quick connectivity check — returns true on 200, false otherwise.
   * Does NOT throw so the Settings UI can display a friendly status.
   *
   * Uses the project-scoped repository endpoint (not /_apis/connectionData,
   * which returns HTTP 400 on dev.azure.com regardless of auth state). This
   * single GET validates all four settings fields at once: orgUrl + project +
   * repo + PAT must all resolve correctly for it to return 200.
   */
  async testConnection(): Promise<boolean> {
    try {
      const res = await fetch(
        `${this.apiBase()}?api-version=7.1`,
        { headers: this.headers() },
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Resolve the HEAD commit SHA for a branch.
   * Uses the refs API filtered to the exact branch name.
   */
  async getBranchHead(branch: string): Promise<string> {
    const url =
      `${this.apiBase()}/refs?filter=heads/${encodeURIComponent(branch)}&api-version=7.1`;
    const res = await fetch(url, { headers: this.headers() });
    await this.assertOk(res, `GET refs/${branch}`);

    const data = (await res.json()) as { value: Array<{ name: string; objectId: string }> };
    const ref = data.value.find((r) => r.name === `refs/heads/${branch}`);
    if (!ref) {
      throw new Error(`Branch "${branch}" not found in repository.`);
    }
    return ref.objectId;
  }

  /**
   * List all files (not folders) under a given scopePath on a branch.
   * Returns repo-relative paths and their git object IDs.
   */
  async listFiles(
    branch: string,
    scopePath: string,
  ): Promise<Array<{ path: string; objectId: string }>> {
    const url = new URL(`${this.apiBase()}/items`);
    url.searchParams.set('recursionLevel', 'full');
    url.searchParams.set('scopePath', scopePath);
    url.searchParams.set('versionDescriptor.version', branch);
    url.searchParams.set('api-version', '7.1');

    const res = await fetch(url.toString(), { headers: this.headers() });
    await this.assertOk(res, `GET items (${scopePath})`);

    const data = (await res.json()) as {
      value: Array<{ path: string; objectId: string; isFolder?: boolean }>;
    };

    // Filter out folder entries — we only want leaf files
    return data.value
      .filter((item) => !item.isFolder)
      .map(({ path, objectId }) => ({ path, objectId }));
  }

  /**
   * Fetch the raw text content of a single file from a branch.
   * The response shape wraps content under a `content` key (json format).
   */
  async getFileContent(filePath: string, branch: string): Promise<string> {
    const url = new URL(`${this.apiBase()}/items`);
    url.searchParams.set('path', filePath);
    url.searchParams.set('includeContent', 'true');
    url.searchParams.set('$format', 'json');
    url.searchParams.set('versionDescriptor.version', branch);
    url.searchParams.set('api-version', '7.1');

    const res = await fetch(url.toString(), { headers: this.headers() });
    await this.assertOk(res, `GET item content (${filePath})`);

    const data = (await res.json()) as { content?: string };
    if (data.content === undefined) {
      throw new Error(`File content missing in response for ${filePath}`);
    }
    return data.content;
  }

  /**
   * Step A: Create a new branch pointing at baseSha via the refs API.
   * If the branch already exists this will fail — callers should use a
   * timestamp-based name to guarantee uniqueness.
   */
  async createBranch(branchName: string, baseSha: string): Promise<void> {
    const ZERO_SHA = '0000000000000000000000000000000000000000';
    const url = `${this.apiBase()}/refs?api-version=7.1`;
    const body = [
      {
        name: `refs/heads/${branchName}`,
        oldObjectId: ZERO_SHA,
        newObjectId: baseSha,
      },
    ];

    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    await this.assertOk(res, `POST refs (create branch ${branchName})`);
  }

  /**
   * Step B: Push a commit onto an existing branch.
   * The branch must already exist (created via createBranch).
   * All file content is base64-encoded per the Azure DevOps Pushes API spec.
   */
  async pushChanges(opts: PushOptions): Promise<PushResult> {
    const url = `${this.apiBase()}/pushes?api-version=7.1`;

    const apiChanges = opts.changes.map((ch) => {
      const changeItem: Record<string, unknown> = {
        changeType: ch.mode,
        item: { path: ch.path.startsWith('/') ? ch.path : `/${ch.path}` },
      };

      if (ch.mode !== 'delete') {
        // Azure DevOps requires content to be base64-encoded
        changeItem.newContent = {
          content: btoa(unescape(encodeURIComponent(ch.content))),
          contentType: 'base64encoded',
        };
      }

      return changeItem;
    });

    const body = {
      refUpdates: [
        {
          name: `refs/heads/${opts.sourceBranch}`,
          oldObjectId: opts.baseSha,
        },
      ],
      commits: [
        {
          comment: opts.commitMessage,
          changes: apiChanges,
        },
      ],
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
    });
    await this.assertOk(res, `POST pushes (branch ${opts.sourceBranch})`);

    const data = (await res.json()) as { commits: Array<{ commitId: string }> };
    const commitId = data.commits?.[0]?.commitId;
    if (!commitId) {
      throw new Error('Push succeeded but response contained no commitId.');
    }
    return { commitId };
  }

  /**
   * Create a pull request, then attach the given labels one-by-one.
   * Azure DevOps requires separate API calls per label — no batch endpoint.
   */
  async createPullRequest(opts: CreatePROptions): Promise<CreatePRResult> {
    const url = `${this.apiBase()}/pullrequests?api-version=7.1`;

    const prBody = {
      title: opts.title,
      description: opts.description,
      sourceRefName: `refs/heads/${opts.sourceBranch}`,
      targetRefName: `refs/heads/${opts.targetBranch}`,
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(prBody),
    });
    await this.assertOk(res, 'POST pullrequests');

    const data = (await res.json()) as { pullRequestId: number; url: string };
    const prId = data.pullRequestId;
    const prUrl = data.url;

    // Attach each label — one request per label (Azure DevOps limitation)
    for (const label of opts.labels) {
      const labelUrl = `${this.apiBase()}/pullRequests/${prId}/labels?api-version=7.1`;
      const labelRes = await fetch(labelUrl, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ name: label }),
      });
      // Non-fatal if a label fails — PR is still created. Log and continue.
      if (!labelRes.ok) {
        console.warn(`[BTech Token Studio] Failed to attach label "${label}" to PR #${prId}`);
      }
    }

    return { id: prId, url: prUrl };
  }
}
