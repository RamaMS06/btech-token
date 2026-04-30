# CI/CD Permissions Runbook

How to fix `TF401027: GenericContribute` and similar push-permission errors
on the auto-version pipeline.

---

## Symptom

`pipelines/auto-version.yml` fails at the **"Commit version bump & push tag(s)"**
step (or earlier at the preflight) with:

```
remote: TF401027: You need the Git 'GenericContribute' permission to perform
this action. Details: identity 'Build\<guid>', scope 'repository'.
fatal: unable to access '...btech-ds/': The requested URL returned error: 403
```

Every PR merge to `dev` or `main` re-triggers this until the underlying
permission is granted. The workspace ends up with an orphan local commit
(`chore(release): bump to vX.Y.Z`) that gets discarded when the job ends —
so the version on `origin/dev` stays stuck at the previous rc.

## Root cause

The pipeline's **build service identity** (auto-created by Azure DevOps,
named like `BUMA - Bspace Design System Build Service (buma)`) does not
have `Contribute` + `Create tag` on the `btech-ds` repo. The pipeline can
read the repo (otherwise `checkout: self` would fail), but cannot write.

This is a one-time configuration error — the build service is created with
read-only permissions by default in many Azure DevOps projects.

---

## Fix A — admin grants the missing permissions (preferred)

One-time, three minutes, no secrets to rotate later.

1. **Project Settings → Repositories → btech-ds → Security**
2. In the user list on the left, find:
   - `BUMA - Bspace Design System Build Service (buma)` *(project-scoped, preferred)*
   - or `Project Collection Build Service (buma)` *(collection-scoped, fallback)*

   Whichever identity appears in the error log (`Build\<guid>`) is the one
   that needs the perms. Hover/click to see the GUID.
3. Set the following to **Allow**:

   | Permission | Why it's needed |
   |---|---|
   | `Contribute` | push the `chore(release): bump to vX.Y.Z` commit |
   | `Create tag` | push the `vX.Y.Z` (or `<tenant>-v<version>`) tag |
   | `Bypass policies when pushing` | skip branch policy on auto-bump commits — only matters if `dev`/`main` has required-PR or required-reviewer policies |

4. **Save**.
5. Re-run the failed pipeline (or push an empty commit to `dev` to re-trigger):

   ```bash
   git commit --allow-empty -m "chore: re-trigger auto-version"
   git push origin dev
   ```

6. Verify the preflight step prints:
   ```
   ✓ Push permission OK — build service can write to dev.
   ```

---

## Fix B — PAT fallback (admin can't grant the perms above)

Use this when:
- The repo lives in a different org/project where you don't have admin rights
- Org policy forbids granting Contribute to build services
- You need to ship before the admin gets back

The pipeline auto-detects a PAT in the secrets variable group and switches
push auth from build-service identity → URL-embedded PAT.

### Steps

1. **Create a PAT** (any user with push rights to `btech-ds` works; service
   account preferred so it doesn't expire when the human leaves):
   - User Settings (top right) → **Personal access tokens** → **+ New Token**
   - **Name:** `btech-ds-auto-version-push`
   - **Organization:** `buma`
   - **Expiration:** longest allowed (1 year)
   - **Scope:** `Code → Read & Write`
   - Copy the token (you can't see it again)

2. **Add to variable group:**
   - **Pipelines → Library → btech-ds-secrets** (existing group used by `PR_TAGS`)
   - Click **+ Add** under Variables:
     - Name: `GIT_PUSH_PAT`
     - Value: *(paste the PAT)*
     - **Click the lock icon** to mark it as a secret
   - **Save**.

3. Re-run the pipeline. The preflight step prints:
   ```
   GIT_PUSH_PAT detected — preflight will skip
     (PAT auth always works if scope is correct).
   ```
   And the push step prints:
   ```
   Auth: GIT_PUSH_PAT (PAT-based)
   ```

### Rotation

PATs expire. Set a calendar reminder for `expiry - 7 days`. Generate a new
PAT, edit the variable group value, save. No code change needed.

### Removal

Once Fix A is applied, delete `GIT_PUSH_PAT` from the variable group. The
pipeline auto-falls-back to build-service auth on the next run.

---

## Why we have two paths

| | Fix A (build service) | Fix B (PAT) |
|---|---|---|
| Setup | One time, admin-only | One time, admin-only |
| Maintenance | None | Rotate PAT yearly |
| Audit trail | Pipeline runs as a system identity (clear) | Pipeline runs as a real user (less clear) |
| Cross-org | Doesn't work for cross-org repos | Works |
| Offline-able | If perms are revoked, pipeline breaks silently | Token revocation is explicit |

**Default to Fix A.** Fix B exists because Azure DevOps occasionally has
edge cases (cross-collection forks, restricted-org service accounts) where
build-service permissions can't be granted.

---

## How the preflight + fallback work in code

```
auto-version.yml
├── Step "Preflight: verify git push permission"
│   ├── if GIT_PUSH_PAT set       → skip probe, exit 0 (PAT will be used later)
│   └── else                       → git push --dry-run origin HEAD:<branch>
│                                   ├── ok      → exit 0
│                                   └── fail    → print Fix A + Fix B, exit 1
│
└── Step "Commit version bump & push tag(s)"
    ├── if GIT_PUSH_PAT set       → embed PAT in remote URL, drop extraHeader
    └── else                       → push to origin (build-service)
        on push failure            → print branch-policy hint + exit 1
```

The preflight runs BEFORE `pnpm install` and BEFORE the bump itself, so a
permission failure costs ~30 seconds instead of ~3 minutes plus an orphan
local commit.

---

## Concurrent push handling

A second class of pipeline failure looks superficially like a permission
error but is actually a race condition:

```
 ! [rejected]        HEAD -> dev (fetch first)
error: failed to push some refs to 'https://dev.azure.com/.../btech-ds'
hint: Updates were rejected because the remote contains work that you do
hint: not have locally.
```

This happens when the pipeline started against an earlier commit on
`$BRANCH`, generated/bumped against that base, and by the time it
tries to push, someone else (a manual `git push`, the other pipeline,
or a later PR merge) has already advanced `origin/$BRANCH`. Git
correctly refuses the push because it would either lose history or
require a force-push.

Both `pipelines/auto-version.yml` and `pipelines/generate.yml` handle
this with a **rebase + retry** loop instead of a single push:

```
for attempt in 1..MAX_RETRIES (= 5):
  git fetch origin $BRANCH
  git reset --mixed origin/$BRANCH      # move HEAD, keep worktree
  re-stage the files we care about
  if no diff → exit 0                   # someone else's push covered ours
  commit
  if push succeeds → push tags + exit 0
  else → backoff (2s × 2^attempt) and retry
```

### Why `--mixed` and not `--hard`

The bumped/generated files live in the working tree and we want to
keep them. `--mixed` moves `HEAD` to `origin/$BRANCH` and unstages
everything, but does not touch the working tree. We then re-`git add`
exactly the files we own and either commit them on top of fresh
origin or skip if origin already covered the change.

### Idempotency: auto-version

If `origin/$BRANCH:package.json` already reports a version `>=` our
target (a manual push raced ahead with the same or newer bump), the
push step exits successfully without committing. This prevents an
accidental "downgrade" commit when the same release is processed
twice (e.g. pipeline rerun after a partial failure).

If the version on origin matches our target but the corresponding tag
(`v<version>`) is missing, the step still creates and pushes the tag
so `publish.yml` fires once.

### Idempotency: generate

If after fetching origin there's no diff against the staged files,
the step exits 0. This is the common case when two pipelines run in
parallel against the same source change — whichever lands first
completes the work and the other no-ops.

### Nested branch names: generate

`Build.SourceBranchName` returns **only the last path segment** of
the source ref, not the full branch name. For a ref like
`refs/heads/figma/20260429-063149-scope-tenant-bspace` it returns just
`20260429-063149-scope-tenant-bspace`, silently dropping the
`figma/` namespace. Fetching that truncated name then fails:

```
fatal: couldn't find remote ref 20260429-063149-scope-tenant-bspace
```

This is what the Figma plugin trips into — it always pushes to
`figma/<timestamp>-<scope>` branches.

`generate.yml` reads the full ref via `Build.SourceBranch` (mapped
to env `BUILD_SOURCEBRANCH`) and strips `refs/heads/` itself:

```bash
BRANCH="${BUILD_SOURCEBRANCH#refs/heads/}"
```

This preserves nested branch names. Don't use
`$(Build.SourceBranchName)` in this script — it will silently
break for any branch that contains a slash.

### Deleted-branch handling: generate

The Figma plugin pushes its tenant edits to a feature branch
(e.g. `figma/20260429-062110-scope-tenant-bspace`) and immediately
opens a PR with auto-complete + delete-source-branch enabled. By the
time `generate.yml` finishes install + generate + flutter analyze
(~3-5 minutes later), the PR is often already merged and the source
branch is gone from origin. A naive `git fetch origin "$BRANCH"`
then errors:

```
fatal: couldn't find remote ref figma/20260429-062110-scope-tenant-bspace
```

`generate.yml` defends against this by calling
`git ls-remote --exit-code --heads origin "$BRANCH"` at the top of
each retry iteration AND after a failed push. If the branch is gone,
the step exits 0 — there's nothing to push back to, and the merge
that deleted the branch already brought the source change onto the
target branch (where its own `generate.yml` run will produce outputs).

### Tag conflicts

After a successful commit push, the loop iterates the new tags. For
each tag:

- **No remote tag** → create and push it (normal case).
- **Remote tag at the same SHA** (or an ancestor of our HEAD) → skip;
  same release already in flight on origin.
- **Remote tag at a different SHA** → fail loudly with
  `##[error]Real conflict.` This indicates two pipelines that
  bumped to the same version from different bases — operator must
  inspect and pick a winner manually.

### When the retry loop gives up

If all `MAX_RETRIES` attempts fail, the pipeline exits 1 with:

```
##[error]Failed to push bump after 5 attempts.
##[error]Likely cause: continuous concurrent pushes to <branch>.
##[error]Manual recovery: re-run this pipeline once <branch> activity settles.
```

This usually means humans are still pushing to `dev`/`main` while CI
runs. Wait for the branch to quiesce, then re-run.

### When NOT to use this pattern

`publish.yml` does **not** push back to the repo (it only publishes
to feeds), so it doesn't need a retry loop. Only pipelines that
write commits or tags to `btech-ds` need this handling.

---

## Related

- `pipelines/auto-version.yml` — preflight + PAT fallback + rebase/retry on push
- `pipelines/generate.yml` — rebase/retry on regenerate-and-commit
- `pipelines/publish.yml` — does NOT push back to the repo; immune to both issues
- `scripts/bump-version.ts` — local + CI version bump logic
- `docs/architecture/versioning.md` — versioning model overview
