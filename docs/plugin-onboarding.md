# BTech Token Studio — Designer Onboarding

Audience: **BUMA designers** opening the plugin for the first time.

You don't need to clone any repo, install pnpm, or run a terminal.
The plugin is already installed for everyone in the BUMA Figma
Organization. This guide walks you through first-time setup (about 5
minutes, one time only) and the daily flow.

---

## What this plugin does

It lets you **edit the design system's tokens** (colors, spacing,
typography, etc.) directly in Figma and push your changes as a pull
request to the `btech-ds` repo — without leaving Figma.

```
You edit tokens in Figma → plugin opens a PR → engineer reviews → merge
                                                                    │
                                                                    ▼
                                                  Tokens released to apps
```

---

## First-time setup (5 minutes, one time)

### Step 1 — Open the plugin

1. In Figma, open any file (or the Figma home view)
2. **Main menu → Plugins → BTech Token Studio**

The first time you run it, you'll see a "Settings required" prompt.

### Step 2 — Generate a Personal Access Token (PAT)

The plugin uses **your** PAT to push changes — that way every commit
is attributed to you, and you keep your own access boundaries.

1. Open in browser: <https://dev.azure.com/buma/_usersSettings/tokens>
2. Click **"+ New Token"**
3. **Name**: `Figma Token Studio` (or any name you'll recognize)
4. **Organization**: `buma` (default)
5. **Expiration**: choose **90 days** — you'll need to rotate it then.
   Set a calendar reminder for a week before expiry.
6. **Scopes**: click **"Custom defined"** → expand **Code** → check
   **Read & write**. Nothing else needed.
7. Click **Create**
8. **Copy the token now** — Azure shows it only once. If you lose it,
   you'll generate a new one (no recovery).

### Step 3 — Paste into the plugin

Back in Figma, with the plugin open:

1. Click the **Settings** tab (or the gear icon)
2. Fill in:
   - **Organization URL**: `https://dev.azure.com/buma`
   - **Project**: `BUMA - Bspace Design System`
   - **Repository**: `btech-ds`
   - **Base branch**: `main` (default — leave as is)
   - **Personal Access Token**: paste your PAT
3. Click **Test connection** → should show ✅ "Connected"
4. Click **Save**

Your PAT is encrypted and stored in Figma's `clientStorage` (per-user,
per-machine). It is never sent anywhere except to Azure DevOps.

---

## Daily flow

### Pull latest tokens

Click **Pull**. The plugin fetches the current token JSON from `main`
and shows you the full set, organized by file → group → token.

### Edit a token

1. Find the token (search by name or browse by category)
2. Click the token → modal opens
3. Change the value (or description, or both)
4. Click **Save** — change is staged locally; you can stage as many
   edits as you want before pushing

### Add a new token

1. Click **+ Add token** button
2. Pick a type (color, dimension, fontFamily, etc.)
3. Fill in name, value, description
4. Click **Save**

### Push your changes

1. Click **Push**
2. Pick a **scope** (which token category you changed — e.g.
   `color/semantic`)
3. Optionally pick a **release type** (`rc` for preview, `release`
   for production-bound)
4. Click **Create PR**

Behind the scenes:
- A new branch `figma/<timestamp>-<scope>` is created
- Your edits are committed in a single atomic commit
- A pull request is opened in Azure DevOps with the right labels
- You'll get a link to the PR in Figma

### Review

Open the PR link in your browser. Engineering reviews and merges. CI
takes care of versioning and publishing the new tokens.

---

## Things to know

- **Edits are local until you push**. Closing Figma without pushing
  keeps your edits in `clientStorage`. Re-opening the plugin shows
  them ready.
- **Pull warns about local edits**. If you have unpushed changes and
  someone else updated `main`, the plugin will warn you before
  overwriting. You can either push first or discard local.
- **One PR per push**. Don't try to "amend" — push again and you'll
  get a second PR. Each push is independent.
- **PAT expires every 90 days**. The plugin will give a 401 error
  when it does. Generate a new PAT (Step 2 above) and paste it in
  Settings.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| 401 Unauthorized on Pull | PAT expired or revoked | Settings → generate new PAT (Step 2) → paste → Save |
| 403 Forbidden on Push | PAT scope missing **Code Read & Write** | Generate a new PAT with the right scope |
| "Branch not found" | Base branch field wrong | Settings → Base branch should be `main` |
| "Schema invalid" on Push | Token value doesn't match DTCG spec | Check the value (e.g. color hex must be `#RRGGBB`) |
| "Out of sync" warning on Pull | Someone else merged tokens after your last pull | Either push your edits first, or discard local |
| Push succeeds but no PR visible | Azure DevOps takes a few seconds | Refresh the PR list in Azure DevOps |
| Plugin not in Plugins menu | Not yet rolled out to your account | Ask a Figma org admin to verify your account is in BUMA org |

---

## Privacy + security

- Your PAT is stored encrypted in Figma's `clientStorage` (browser
  local storage, isolated per-plugin, per-Figma-account, per-machine).
- The plugin only talks to `https://dev.azure.com/buma` — no
  third-party servers, no analytics, no telemetry.
- Every commit is attributed to **you** (the PAT identifies you to
  Azure DevOps). Don't share your PAT with teammates — they should
  generate their own.

---

## Help

- Plugin issues / bugs: post in `#btech-design-system` Slack
- Token system questions: see
  [`docs/architecture.md`](./architecture.md)
- Plugin maintainer guide: see
  [`docs/plugin-publishing.md`](./plugin-publishing.md) (admin only)
