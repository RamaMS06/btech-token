# Architecture Decision Record — BTech Token Studio Figma Plugin

## Context

Designers were manually communicating token changes to developers, who then edited JSON files and opened PRs. This process introduced drift between Figma files and the token repo, created bottlenecks, and made new tenant onboarding dev-dependent.

## Why a custom plugin (not Tokens Studio Pro or REST API)

**Tokens Studio Pro** is the industry standard but does not natively support DTCG format with multi-tenant Azure DevOps sync. Its GitHub/GitLab sync requires per-file mapping and doesn't match our path structure. A Pro subscription per designer also has cost implications.

**REST API approach (webhook + Figma Variables API)** was considered. The problem: the Figma Variables REST API does not support composite token types (shadow, typography, border) and requires a backend server to bridge the webhook. Adding a backend introduces infra overhead and a new failure point.

**Custom plugin** gives us:
- Full control over the UX (designer-friendly, no dev concepts exposed)
- Native support for the full DTCG type set including composites
- Zero backend — the plugin calls Azure DevOps directly from the Figma sandbox
- Dogfooding the BTech design system (the plugin UI uses `@btech/tokens` CSS vars)

The custom plugin architecture is inspired by [Tokens Studio for Figma](https://github.com/tokens-studio/figma-plugin) (MIT), specifically the Token Set → file mapping model and the postMessage protocol between UI iframe and main thread.

## Storage model

Two storage layers are used intentionally:

| Layer | API | Scope | Purpose |
|---|---|---|---|
| Primary | `figma.clientStorage` | Per-user, per-plugin | Token data + PAT + settings. Encrypted by Figma. Survives file close. |
| Mirror snapshot | `figma.root.setPluginData` | Per-file | Read-only token mirror for other tooling (e.g., Phase 3 "Apply to Variables"). 100KB limit. |

The snapshot is a best-effort write — if the token state exceeds 100KB, the main thread logs a warning and skips it. `clientStorage` remains the authoritative copy.

The PAT never leaves the plugin: it is stored in `clientStorage` (encrypted), used only in fetch() calls to `dev.azure.com`, and never written to `setPluginData` or logged to the console.

## Push flow: branch-per-push + PR rationale

Every push creates a new branch (`figma/<timestamp>-<scope>`) and a PR rather than pushing directly to a working branch. Rationale:

1. **CI gate**: Every merge to `main` passes `validate.yml` — this is non-negotiable. A direct push would bypass it.
2. **Auditability**: Each Figma edit session is isolated in its own branch and PR, making it easy to roll back a specific designer's change without affecting others.
3. **Scope tag propagation**: `auto-version.yml` reads PR labels (`scope:tenant:bspace`, etc.) to determine which packages to bump. The plugin detects the scope from changed file paths and attaches the right label.
4. **Concurrency safety**: If two designers push simultaneously, they get separate branches and PRs. Only one can merge first; the second gets a merge conflict in the PR, which is the correct behavior (not silent data loss).

## Hard-replace pull rationale

Pulling replaces all local token state with the repo content. No 3-way merge.

This is intentional:
- DTCG tokens are not free-form text — merging them token-by-token requires semantic understanding (e.g., renaming a token is an add + delete, not a field edit).
- The push-first / discard warning gives designers a clear escape hatch.
- A 3-way merge would require storing the base snapshot at pull time and computing diffs on push — possible in Phase 4 but adds significant complexity for unclear benefit at this stage.

## Phase 1 scope boundaries

The following are explicitly deferred:

- **Apply to Figma Variables** (Phase 3): The Variables REST API is write-only and doesn't support all DTCG types. Planned as a separate sync layer.
- **Tenant wizard** (Phase 2): Adding a new tenant requires creating a directory + `overrides.json` + updating the generator. The `pnpm add-tenant` CLI remains the escape hatch.
- **3-way merge on pull** (Phase 4): Push-first-or-discard is sufficient for a small design team.
- **$ref resolution** (Phase 3): The UI shows references as strings; resolved values are a viewer concern, not an editor concern.
- **Concurrent push detection** (Phase 4): Pre-push SHA comparison to detect repo drift since last pull.

## Tech stack rationale

| Choice | Rationale |
|---|---|
| Vite | Fast builds; well-supported Figma plugin templates; dual-target config (IIFE + SPA) works cleanly |
| React 18 | Matches Tokens Studio reference codebase; familiar to team |
| Zustand | Lightweight enough for this scope; no Redux boilerplate |
| Ajv | Re-uses the project's existing `token.schema.json`; runs in-browser without Node.js fs |
| Native fetch | Azure DevOps PAT + JSON REST API is simple enough; no SDKs needed |
| `vite-plugin-singlefile` | Figma requires the UI as a single HTML file; singlefile inlines all assets |

## Attribution

Architectural patterns (Token Set → file mapping, postMessage protocol, sidebar + main panel layout) were studied from:

> [Tokens Studio for Figma](https://github.com/tokens-studio/figma-plugin) — MIT License  
> Copyright (c) Tokens Studio
