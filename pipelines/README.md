# CI Pipelines

Four Azure Pipelines that take token JSON from designers and ship `@btech/tokens` to the registry. Each pipeline has one job.

```
edit tokens → generate → validate → merge → auto-version → publish
```

## Pipelines

### `validate.yml` — Gate
**Runs on:** PR to `main`, push to `main`
**Job:** Block bad code from merging.

Checks:
- Token JSON schema, contrast, boundary rules
- Generated files match source (no stale outputs)
- `@btech/tokens` builds
- Flutter analyzer passes
- Workspace deps are consistent

> Required to pass before any PR can merge into `main`.

### `generate.yml` — Auto-generator
**Runs on:** push to any branch except `main`, when `sources/**` or `generators/**` changes
**Job:** Regenerate platform outputs (CSS, TS, Dart) and commit them back to the branch.

Designers only edit JSON via the Figma plugin — they don't need Node, pnpm, or Flutter installed. The pipeline runs `pnpm generate` and commits results with `***NO_CI***` to avoid trigger loops.

### `auto-version.yml` — Versioner
**Runs on:** push to `main` (i.e. PR merged) that touches token sources or version manifests
**Job:** Bump semver, commit, tag.

Bump type comes from PR labels (passed via `PR_TAGS` variable):

| Label | Effect |
|---|---|
| `release:major` | `1.0.0` → `2.0.0` |
| `release:minor` | `1.0.0` → `1.1.0` |
| `release:patch` | `1.0.0` → `1.0.1` (default) |
| `release:rc` | `1.0.0` → `1.0.0-rc.1` |
| `version:1.5.0` | Set exact version |
| `no-release` | Skip release |

Scope labels: `scope:all`, `scope:base`, `scope:tenants`, `scope:tenant:<id>`.

Pushes a `v*` tag, which triggers `publish.yml`.

### `publish.yml` — Publisher
**Runs on:** push of tag `v*` or `<tenant>-v*`
**Job:** Build and publish to Azure Artifacts feed `btech`.

Publishes:
- `@btech/tokens` → npm
- `btech-tokens` → PyPI
- Tenant packages (if changed)

dist-tag is `rc` for `1.0.0-rc.*`, `latest` otherwise. Re-running is safe — `--skip-existing` skips already-published versions.

## End-to-end Flow

```
Designer commits to branch
       ↓
  generate.yml  ──► auto-commit generated outputs
       ↓
  Open PR to main
       ↓
  validate.yml  ──► blocks merge if anything is wrong
       ↓ (merged)
  auto-version.yml ──► bump + tag (e.g. v1.0.1)
       ↓
  publish.yml   ──► @btech/tokens@1.0.1 live on the feed
```

## Auth

All pipelines authenticate to Azure Artifacts via `npmAuthenticate@0` + `System.AccessToken`. **No personal PAT is required.** See root `.npmrc` for local-dev auth instructions.

## Variable Group

`btech-ds-secrets` (Project Settings → Library) holds:
- `PR_TAGS` — comma-separated PR labels, used by `auto-version.yml`

## Manual / Emergency Release

To re-publish a specific version without going through a PR:

```bash
git tag v1.2.3 -m "hotfix"
git push origin v1.2.3
```

This fires `publish.yml` directly.
