# BTech Token Studio

A Figma plugin for the BUMA design system that lets designers pull, edit, and push DTCG design tokens directly from the Figma canvas — no developer handoff required.

## For org users (designers)

If you're a BUMA designer, **you don't need this README**. The plugin is
installed for the whole organization automatically:

1. Open Figma → **Plugins** menu → search "BTech Token Studio"
2. Click **Run** → Settings → paste your Azure DevOps PAT → Save
3. You're done. See [`docs/plugin-onboarding.md`](../docs/plugin-onboarding.md) for the full first-time guide (PAT scope, expiry, troubleshooting).

The rest of this README is **for plugin maintainers / developers** —
you don't need to clone the repo or build anything to use the plugin.

## What it does

- **Pull** all token JSON files from `packages/tokens/sources/**` in the Azure DevOps repository
- **Browse** tokens organized by set (file) and grouped by `$type`
- **Edit** existing tokens (value, description) via a modal
- **Add** new tokens with a type-first selector
- **Push** changes back: single atomic commit on a new branch `figma/<timestamp>-<scope>` + auto-opens a PR with the correct `scope:*` label

Tokens are stored locally per-user in Figma's `clientStorage` (encrypted). Changes are persisted to storage automatically on every edit.

## Building (developer-only)

> Ordinary designers should install the plugin from the Figma Plugins
> menu — they don't need to build anything. The instructions below are
> for plugin maintainers iterating on the plugin code itself.

```bash
# Install dependencies (run from repo root)
pnpm install

# Build both plugin targets
pnpm --filter @btech/token-studio build

# Type-check only (no emit)
pnpm --filter @btech/token-studio tsc

# Watch mode (development)
pnpm --filter @btech/token-studio dev
```

Build outputs:

| File | Purpose |
|---|---|
| `dist/code.js` | Figma main thread (sandbox) |
| `dist/index.html` | Plugin UI (self-contained HTML) |

## Installing in Figma (development)

1. Build the plugin (`pnpm build`)
2. In Figma: **Main menu → Plugins → Development → Import plugin from manifest…**
3. Select `btech-token-studio/manifest.json` from your local clone
4. The plugin appears under **Plugins → Development → BTech Token Studio**

For **org-wide deployment** (BUMA Figma Organization plan), see
[`docs/plugin-publishing.md`](../docs/plugin-publishing.md) — release is
fully automated via Azure DevOps pipelines and the admin uploads a
prepackaged ZIP to the Figma admin UI.

## First-time setup

1. Open the plugin → click **Settings**
2. Enter your **Organization URL** (`https://dev.azure.com/buma`)
3. Enter **Project** and **Repository** name (`btech-ds`)
4. Generate a **Personal Access Token** (PAT):
   - Go to: `https://dev.azure.com/buma/_usersSettings/tokens`
   - Scope: **Code (Read & Write)**
   - Expiry: set a reminder to rotate
5. Paste the PAT → click **Test connection** → should show "Connected"
6. Click **Save**

## Daily flow

1. **Pull** — fetch latest tokens from `main` branch
2. **Browse + Edit/Add** — make your changes in the plugin
3. **Push** — creates branch `figma/<timestamp>-scope:*` and opens a PR
4. **Review PR** in Azure DevOps — CI runs `validate.yml` automatically
5. Merge → `auto-version.yml` bumps the right package version

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| 401 Unauthorized | Bad or expired PAT | Settings → regenerate PAT |
| "Branch not found" | Base branch wrong | Settings → check Base branch field |
| "Schema invalid" | Token value doesn't match DTCG spec | Fix the token value before pushing |
| "Out of sync" prompt on Pull | Local edits exist | Push first or discard local |
| Push succeeds but PR not visible | Azure DevOps delay | Check `figma/*` branches list |

---

Architectural reference: [Tokens Studio for Figma](https://github.com/tokens-studio/figma-plugin) (MIT) — architecture inspiration only; custom UI and Azure DevOps integration.
