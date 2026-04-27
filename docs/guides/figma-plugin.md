# BTech Token Studio — Designer Guide

**BTech Token Studio** is a Figma plugin that connects directly to the `btech-ds` repository on Azure DevOps. Designers can browse all design tokens, edit values, add new tokens, and push changes back to the repo — without writing a single line of code or messaging a developer.

## What it does

Pull the full token library from Azure DevOps, edit tokens in a familiar UI, then push. The plugin creates a branch (`figma/<timestamp>-<scope>`) and opens a PR automatically. CI validates the changes and the team reviews the PR before merging.

## Installing the plugin

**Phase 1 — development install (local clone required):**

1. Ask your tech lead to clone the `btech-ds` repository locally
2. In Figma: **Main menu → Plugins → Development → Import plugin from manifest…**
3. Select `btech-token-studio/manifest.json` from the clone
4. Build the plugin first: `cd btech-token-studio && pnpm build` (requires Node 20 + pnpm)

**Future — Figma Org private plugin:**
Once promoted by the Figma admin, the plugin will appear under **Plugins → BUMA** in all org Figma files. No local install needed.

## First-time setup

1. Open the plugin (Plugins → Development → BTech Token Studio)
2. Click **⚙ Settings**
3. Fill in:
   - **Organization URL**: `https://dev.azure.com/buma`
   - **Project**: `BUMA - Bspace Design System`
   - **Repository**: `btech-ds`
   - **Base branch**: `main`
   - **Personal Access Token (PAT)**: Generate at [Azure DevOps PAT page](https://dev.azure.com/buma/_usersSettings/tokens)
     - Scope: **Code (Read & Write)** only
     - Recommended expiry: 90 days (set a calendar reminder to rotate)
4. Click **Test connection** — you should see "Connected"
5. Click **Save**

## Daily flow

### 1. Pull

Click **⤓ Pull** → **Pull from main**.

The plugin downloads all files from `packages/tokens/sources/**` and stores them locally in your Figma account. If you have unsaved local edits, the plugin will ask you to either push first or discard local changes before pulling.

### 2. Browse and edit

- **Left sidebar**: token sets grouped by `core/`, `semantic/`, `components/`, `tenants/<id>/`
- Click a set to see its tokens in the main panel, grouped by type (COLOR, DIMENSION, etc.)
- Click any row to edit it in the editor modal
- Click **+ Add Token** to create a new token (choose type first)
- Sets with local changes show a filled **●** dot in the sidebar

### 3. Push

Click **⤒ Push** → **Push & create PR**.

The plugin:
1. Validates all changed tokens against the DTCG schema (blocks if invalid)
2. Detects the correct scope label (`scope:base`, `scope:tenant:bspace`, etc.)
3. Creates a branch: `figma/20260427-143022-scope-tenant-bspace`
4. Commits all changes in one atomic commit
5. Opens a PR with the scope label + `release:rc`

A link to the PR appears in the push panel. Share it with your tech lead for review.

## Troubleshooting

| Problem | Likely cause | Fix |
|---|---|---|
| "401 Unauthorized" during pull/push | PAT expired or wrong scope | Settings → generate a new PAT with Code (Read & Write) |
| "Branch not found" | Base branch setting wrong | Settings → set Base branch to `main` |
| "Schema invalid" error on push | Token value doesn't match DTCG format | Fix the value in the editor; check format in the error message |
| "You have unsaved edits" on Pull | Local changes not yet pushed | Choose "Push first" to save your work, or "Discard local" to get the latest |
| Plugin shows blank / no tokens | Never pulled, or storage cleared | Click Pull to fetch from Azure DevOps |
| PR not visible in Azure DevOps | Network delay | Wait ~30s and refresh; check `figma/*` branch list |
| "Test connection" fails | Wrong org URL or PAT | Double-check URL format (`https://dev.azure.com/buma`) and PAT validity |
