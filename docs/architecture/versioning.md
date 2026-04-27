# Versioning Strategy — Root-Canonical, Coordinated Major/Minor

> Status: Active (adopted 2026-04)
> Supersedes: Hybrid auto-scope (pre-2026-04, base-canonical)
> Original supersession: Lockstep-only (pre-PR #72538)

## TL;DR

The repo-root `package.json` (`@btech/design-system`, `private: true`) holds the **canonical platform version**. Every other version-bearing file (web base + tenants, flutter base + tenants, python base + tenants) derives from it under two distinct rules:

1. **Reset rule** — a major/minor/prerelease-channel change forces every downstream package to the new root version. `--scope` is ignored (warning logged).
2. **Patch rule** — a pure patch bump respects `--scope`. Base packages (web/flutter/python token) follow root; tenant packages advance their own independent patch counter.

Override JSON values (`sources/tenants/<id>/overrides.json`) are **never touched** by the bump script. Reset operates only on `package.json` / `pubspec.yaml` / `pyproject.toml`.

```
┌──────────────────────────────────────────┐
│ /package.json   (canonical, private)     │  ← single source of truth
│ "@btech/design-system": "1.5.3"          │
└──────────────────────────────────────────┘
            │
            ├─ web base       @btech/tokens             1.5.3
            ├─ flutter base   btech_tokens              1.5.3
            ├─ python base    btech-tokens              1.5.3
            ├─ web tenant     @btech/tokens-bspace      1.5.7  (independent patch)
            └─ python tenant  btech-tokens-bspace       1.5.7  (mirrors web tenant)
```

---

## Why root-canonical

The previous model treated `@btech/tokens` (web base) as the canonical version. That conceptually tied the platform release number to a single platform — even though Flutter and Python publish at the same version.

Designers asked for a single number that represents *the design system* without reference to any one platform. The repo-root `package.json` already exists, is `private: true` (so it never publishes), and is readable by every tool we already use (`node -p`, Token Studio's Azure DevOps git-content fetch, CI bash). Promoting it to canonical needed no new files, formats, or tooling.

---

## The two rules

### Reset rule

Fires when `shouldResetAll(prev, next)` returns true. Conditions:

- `prev.major !== next.major` (major bump)
- `prev.minor !== next.minor` (minor bump)
- `Boolean(prev.prerelease) !== Boolean(next.prerelease)` (rc → stable graduation, or stable → rc fall-back)

When fired, `bump-version.ts`:

1. Writes `next` to root `package.json`.
2. Writes `next` verbatim to **every** downstream package, regardless of `--scope`.
3. Logs a warning if `--scope` was anything other than `all`.

The reasoning: major/minor changes are platform-wide by definition (DTCG schema or core tokens shifted). Channel boundary crossings (rc graduation) are also platform-wide because the prerelease tag carries release-channel meaning that affects every consumer.

### Patch rule

Fires for any `next` that differs from `prev` only in the patch component (or differs only in the rc counter, e.g. `rc.3 → rc.4`). Behavior:

- **Base packages** (`web/token`, `flutter/token`, `python/token`) follow root. Root advances when `--scope` includes base.
- **Tenant packages** advance from their **own** current version, staying within whatever release channel they're already on. Tenant on `1.0.0-rc.3` patches to `1.0.0-rc.4`; tenant on `1.5.7` patches to `1.5.8`.
- `--scope=tenant:bspace`: only `bspace`'s tenant packages advance. Root stays put. Other tenants untouched.

The tenant counter being independent is what lets one tenant ship a hotfix without dragging every other tenant through a no-op version bump.

---

## Reset rule truth table

| Bump invocation                     | Old root      | New root      | Web base | Web tenant `bspace` | Flutter base | Python base |
|-------------------------------------|---------------|---------------|----------|---------------------|--------------|-------------|
| `bump major --scope=all`            | `1.5.3`       | `2.0.0`       | `2.0.0`  | `2.0.0` (reset)     | `2.0.0`      | `2.0.0`     |
| `bump minor --scope=all`            | `1.5.3`       | `1.6.0`       | `1.6.0`  | `1.6.0` (reset)     | `1.6.0`      | `1.6.0`     |
| `bump patch --scope=base`           | `1.5.3`       | `1.5.4`       | `1.5.4`  | `1.5.7` (untouched) | `1.5.4`      | `1.5.4`     |
| `bump patch --scope=tenant:bspace`  | `1.5.3`       | `1.5.3` (=)   | `1.5.3`  | `1.5.7 → 1.5.8`     | `1.5.3` (=)  | `1.5.3` (=) |
| `bump set 1.0.0` (rc graduate)      | `1.0.0-rc.3`  | `1.0.0`       | `1.0.0`  | `1.0.0` (reset)     | `1.0.0`      | `1.0.0`     |
| `bump rc --scope=base`              | `1.0.0-rc.3`  | `1.0.0-rc.4`  | `1.0.0-rc.4` | unchanged       | `1.0.0-rc.4` | `1.0.0-rc.4` |
| `bump rc --scope=tenant:bspace`     | `1.0.0-rc.3`  | `1.0.0-rc.3` (=) | unchanged | `1.0.0-rc.3 → 1.0.0-rc.4` | unchanged | unchanged |

---

## Branches: `main` vs `dev`

Two long-lived branches drive the release channel. The Figma plugin's
header `<BranchSwitcher>` is the only UI surface that picks between them —
designers no longer type a version anywhere.

| Filter value | Branch git | Default bump verb (CI) | Tag form                        | Dist-tag |
|--------------|------------|------------------------|---------------------------------|----------|
| `main`       | `main`     | `patch`                | `v<x>` / `<tenant>-v<x>`        | `latest` |
| `dev`        | `dev`      | `rc`                   | `v<x>-rc.<n>` / `<tenant>-v<x>-rc.<n>` | `rc`     |

Implications:

- **Pull target.** `useSync.pull()` reads `packages/tokens/sources/**` and
  `package.json` from `settings.activeBranch`. Switching the filter
  retargets the pull; switching with dirty work prompts to discard
  (same rule as the tenant filter).
- **Push target.** PRs are opened against `settings.activeBranch`. The
  plugin attaches only the scope label — the bump verb is derived in CI.
- **CI bump verb.** `auto-version.yml` resolves the default from
  `BUILD_SOURCEBRANCH`: `refs/heads/dev` → `rc`, anything else → `patch`.
  A `release:*` PR label still overrides when present.
- **Tenant-only on `dev`.** A tenant patch merged on `dev` becomes a
  tenant rc (`bspace-v1.5.8-rc.N`) — the rc suffix applies platform-wide
  to whatever channel the branch represents.

Promotion `dev → main` (graduate an rc to a stable release) is currently a
manual cherry-pick / merge of `dev` into `main`. The next `auto-version.yml`
run on `main` will produce a stable tag. A dedicated `bump rc:graduate`
verb is on the roadmap — see Non-goals.

---

## CLI surface

```sh
pnpm bump                               # patch, scope=all (back-compat)
pnpm bump minor                         # minor, scope=all → resetAll
pnpm bump major --scope=tenant:bspace   # major → resetAll fires, scope ignored (warned)
pnpm bump rc                            # rc patch (rc.N → rc.N+1)
pnpm bump set 1.0.0                     # graduate rc → 1.0.0 → resetAll fires
pnpm bump set 1.5.4 --scope=base        # patch-level set, base only
pnpm bump patch --scope=tenant:bspace   # tenant patch, root untouched
pnpm bump patch --auto                  # detect scope from git diff
pnpm bump patch --dry-run               # print plan, no writes
```

`--auto` reads `git diff origin/main...HEAD` (plus working tree) and picks a scope:

| Files changed                                                          | Detected scope    |
|------------------------------------------------------------------------|-------------------|
| `packages/tokens/sources/{core,semantic,components}/**`                | `all`             |
| Only `packages/tokens/sources/tenants/<id>/**` (single tenant)         | `tenant:<id>`     |
| `packages/tokens/sources/tenants/*/**` across multiple tenants, no core | `tenants`         |
| No token source change                                                 | no-op (exit 0)    |

---

## Designer flow (Token Studio Figma plugin)

```
┌─ Designer pulls ──────────────────────────────────────────────────┐
│  Header BranchSwitcher = "main" (or "dev")                         │
│  useSync.ts fetches /package.json from <activeBranch>              │
│  VersionLabel renders the pulled version (read-only)               │
└────────────────────────────────────────────────────────────────────┘
            │
            ▼  (designer edits tokens + clicks Push)
┌─ Plugin push ─────────────────────────────────────────────────────┐
│  Source branch:  figma/<ts>-<scope>                                │
│  Target branch:  <activeBranch>                                    │
│  PR labels:      <scope-tag>   (no version, no release verb)       │
└────────────────────────────────────────────────────────────────────┘
            │
            ▼  (PR merged to <activeBranch>)
┌─ auto-version.yml ────────────────────────────────────────────────┐
│  Default bump verb = patch (main) | rc (dev)                       │
│  release:* / version:* PR labels still override when present       │
│  Bumps + commits + tags + pushes back to <activeBranch>            │
└────────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─ publish.yml (triggered by `v*` tag) ─────────────────────────────┐
│  v1.1.0           → dist-tag `latest` (stable)                     │
│  v1.1.0-rc.1      → dist-tag `rc` (prerelease)                     │
│  bspace-v1.5.8-rc.1 → tenant-only prerelease                       │
└────────────────────────────────────────────────────────────────────┘
```

For tenant-only patches the flow is the same up to merge, then `auto-version.yml` writes only the tenant package, tags `<tenant>-v<v>` (or `<tenant>-v<v>-rc.<n>` on `dev`), and `publish.yml`'s tenant-only path publishes only that tenant's npm + python packages.

---

## Tag scheme & publish triggers

`publish.yml` accepts two tag forms:

| Tag form              | Triggers                                                        |
|-----------------------|-----------------------------------------------------------------|
| `v<root-version>`     | Full release: web base + every tenant + flutter + python (base + tenants) |
| `<tenant>-v<version>` | Tenant-only: only that tenant's npm + python package           |

`auto-version.yml` decides which form to push based on whether root advanced:

```bash
if [ "$NEW_ROOT_VERSION" != "$PREV_ROOT_VERSION" ]; then
  git tag v$NEW_ROOT_VERSION    # root moved → full release
else
  for changed_tenant in ...; do
    git tag ${tenant}-v${tenant_version}    # tenant-only patches
  done
fi
```

`scripts/publish-changed.ts` queries the registry per package and skips already-published versions, so re-running `publish.yml` is safe.

---

## PR labels (auto-version.yml input)

| Label                       | Effect                                                                   |
|-----------------------------|--------------------------------------------------------------------------|
| `release:major\|minor\|patch\|rc` | Semver bump type (overrides branch-derived default)                |
| `scope:all`                 | Force `--scope=all`                                                      |
| `scope:base`                | `--scope=base`                                                           |
| `scope:tenants`             | `--scope=tenants`                                                        |
| `scope:tenant:<id>`         | `--scope=tenant:<id>`                                                    |
| `version:<x.y.z>`           | Invokes `bump set <x.y.z>` — overrides `release:*` bump type             |
| `no-release`                | Skip release entirely                                                    |
| *(no scope label)*          | Use `--auto`                                                             |
| *(no release label)*        | Bump verb derived from branch: `main` → `patch`, `dev` → `rc`            |

The Token Studio plugin no longer attaches `version:*` or `release:*` labels — branch is the single source of truth for the bump verb. Both labels are still honoured when added manually (e.g. on a hand-merged PR), so power users can pin a specific version or override the default.

---

## Peer dependencies

Tenant `package.json` is regenerated with:

```json
"peerDependencies": { "@btech/tokens": ">=1.0.0-rc.1 <2.0.0" }
```

The range is auto-derived from the current root major at scaffold time and **preserved** across regenerations. It only moves when intentionally widened/tightened (e.g. via `add-tenant.ts` or hand-edit when the tenant starts relying on a token added in a newer base).

---

## Override preservation

`scripts/bump-version.ts` reads/writes only `package.json`, `pubspec.yaml`, and `pyproject.toml`. It never touches `packages/tokens/sources/tenants/<id>/overrides.json`. Reset rule firing → tenant version moves to the new root, but tenant override values remain exactly as the designer last set them.

---

## Validators

`tools/validators/version-consistency.ts` runs as part of `pnpm validate` and asserts:

- Every downstream package's `<major>.<minor>` matches root.
- Every downstream package's release channel (prerelease vs stable) matches root.
- Patch component is intentionally NOT compared — tenants advance independently.

A non-zero exit here means `bump-version.ts` was bypassed (hand-edit) or has a bug. Catch the drift before publish.

---

## Generator preservation rule

`packages/tokens/generators/web/web-tenant-format.ts` and the python tenant generator preserve the existing tenant version across regenerations. They only seed from root when scaffolding a tenant directory for the first time. This is what enables tenant patch counters to drift independently between coordinated releases.

---

## Non-goals

- Per-tenant prerelease channels (e.g. `bspace` on rc while base is stable) — channel is platform-wide.
- Auto-publish without a tag — the tag is the explicit "release this" signal.
- Pre-push HEAD-conflict check in the Figma plugin — accepted limitation; deferred until concurrency becomes a real problem.
- CHANGELOG generation — future enhancement, not currently in scope.
- Automated `dev → main` graduation — currently a manual merge or cherry-pick. A `bump rc:graduate` verb (already partially supported in `bump-version.ts`) would let the next `auto-version.yml` run on `main` strip the `-rc.N` suffix cleanly; full automation is deferred until promotion frequency justifies it.
- Branch protection rules for `dev` — set manually in the Azure DevOps web UI alongside the existing `main` protections; not codified by this pipeline.
