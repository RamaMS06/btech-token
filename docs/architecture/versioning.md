# Versioning Strategy — Hybrid Auto-Scope

> Status: Active (adopted alongside PR #72538)
> Supersedes: Lockstep-only versioning (pre-PR #72538)

## TL;DR

Every package tracks its own version. `pnpm bump` supports four scopes:

| Scope | Bumps | Use when |
|---|---|---|
| `all` (default) | base + all tenants | Breaking / semantic change touches core tokens |
| `base`          | `@btech/tokens` + `btech_tokens` | Base-only refactor, no tenant impact |
| `tenants`       | all tenant web packages | Bulk tenant refresh, base untouched |
| `tenant:<id>`   | single tenant only | Hotfix / iteration on one tenant |

`--auto` infers the scope from `git diff origin/main...HEAD`. Backward-compatible: `pnpm bump patch` with no flags = lockstep, same as before.

---

## Why hybrid

Pre-PR #72538 we used pure **lockstep**: every release bumped base + every tenant to the same version. Problem: a change that only touched one tenant's overrides still forced a new version for every other tenant package, dragging unrelated consumers through upgrades with no semantic change.

The opposite extreme — **fully independent** via Changesets — works but requires per-PR changeset files, per-package git tags, and a heavier release workflow. Overkill for a 4-package workspace.

Hybrid is the pragmatic middle: packages *can* advance independently when the change is scoped, but when core semantics shift, everything bumps together to guarantee cross-tenant consistency.

---

## The decision matrix (auto-scope)

`scripts/bump-version.ts --auto` reads `git diff --name-only origin/main...HEAD` (plus working tree) and picks a scope:

| Files changed | Detected scope |
|---|---|
| `packages/tokens/sources/{core,semantic,components}/**` | `all` |
| Only `packages/tokens/sources/tenants/<id>/**` (single tenant) | `tenant:<id>` |
| `packages/tokens/sources/tenants/*/**` across multiple tenants, no core | `tenants` |
| No token source change | no-op (exit 0) |

CI (`auto-version.yml`) defaults to `--auto` unless a `scope:*` PR label is present.

### PR labels

| Label | Effect |
|---|---|
| `release:major\|minor\|patch\|rc` | Semver bump type (default `patch`) |
| `scope:all` | Force all-package bump |
| `scope:base` | Bump only base packages |
| `scope:tenants` | Bump only tenant packages |
| `scope:tenant:<id>` | Bump a single tenant |
| `no-release` | Skip release entirely |
| *(no scope label)* | Use `--auto` |

---

## Tagging & publish flow

Single git tag, format: `v<base-version>` (e.g. `v1.0.0-rc.2`).

- **Base bumped** (any scope that includes base) → tag pushed → `publish.yml` runs
- **Tenant-only bump** → commit to main, **no tag** → `publish.yml` triggered manually (Azure DevOps → Pipelines → publish → Run)

`publish.yml` delegates to `scripts/publish-changed.ts`, which queries the registry (`npm view`) per package and **skips already-published versions**. This makes the publish pipeline idempotent and safe to re-run or trigger manually.

---

## Peer dependencies

Tenant `package.json` is regenerated with:
```json
"peerDependencies": { "@btech/tokens": ">=1.0.0-rc.1 <2.0.0" }
```

Range is auto-derived from the current base major at generation time. This gives consumers a clear compat signal — tenant CSS is tied to a base major range, not pinned to an exact version.

---

## Generator preservation rule

`packages/tokens/generators/web/web-tenant-format.ts` used to overwrite `tenant/package.json.version` with the base version on every `pnpm generate`. Now it **preserves** the existing tenant version across regenerations, only defaulting to the base version when a tenant directory is being scaffolded for the first time. This is what enables tenant versions to drift independently from base.

---

## When to escalate to Changesets (Option C)

Adopt [@changesets/cli](https://github.com/changesets/changesets) if:

- Tenant count grows past ~5–6 and independent release cadence becomes the norm
- Consumers ask for per-tenant changelogs published per release
- Base + 2 tenants diverge version-wise (e.g. base on 2.x, bspace on 3.x) and the `>=base <major+1` peer range gets awkward

Until then, hybrid auto-scope is sufficient and has zero per-PR overhead.

---

## Non-goals

- Per-tenant git tags — adds ceremony without clear benefit at current scale
- Flutter tenant versioning — no Flutter tenant packages exist yet
- Auto-publish on tenant-only bumps — manual trigger keeps releases intentional
