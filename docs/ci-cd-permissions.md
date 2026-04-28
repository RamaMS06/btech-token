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

## Related

- `pipelines/auto-version.yml` — pipeline definition with the fix
- `pipelines/publish.yml` — does NOT push back to the repo; immune to this issue
- `scripts/bump-version.ts` — local + CI version bump logic
- `docs/architecture/versioning.md` — versioning model overview
