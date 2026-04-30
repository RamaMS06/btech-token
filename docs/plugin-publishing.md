# Publishing the BTech Token Studio Plugin

Audience: **plugin maintainers** + **Figma org admins**.

This is the end-to-end runbook for shipping a new release of the
`btech-token-studio` Figma plugin to the BUMA Figma Organization.

---

## Mental model

```
Plugin code ──► CI builds ──► ZIP in Azure Artifacts ──► Admin downloads
                                                              │
                                                              ▼
                                         Figma Admin UI ──► Org plugin live
```

Steps 1–3 are automated. Step 4 (upload to Figma) is **manual** —
Figma has no public publish API for organization plugins. Plan
release windows accordingly.

---

## Release flow (per release)

### 1. Bump version

Decide the bump kind (`patch` / `minor` / `major`) based on what
changed:

| Change | Bump |
|---|---|
| Bug fix, no UX change | patch |
| New feature, no breaking change to user flow | minor |
| Breaking flow change, settings reset, schema change | major |

```bash
pnpm --filter @btech/token-studio version <patch|minor|major>
```

This updates `btech-token-studio/package.json` `version` field and
creates a local commit.

### 2. Sanity-check build locally

```bash
# Clean build
pnpm --filter @btech/token-studio build

# Manual smoke: re-import the plugin in Figma
#   Figma → Plugins → Development → Import plugin from manifest
#   → select btech-token-studio/manifest.json
# Open the plugin → Settings → enter PAT → Test connection → "Connected"
# Pull tokens → edit one → Push → verify PR opens in Azure DevOps
```

Don't tag if any step above fails.

### 3. Push the release tag

```bash
# Suppose package.json is now at 1.0.1
git push origin main
git tag plugin-v1.0.1 -m "plugin: 1.0.1 (bug fix in pull diff calc)"
git push origin plugin-v1.0.1
```

The tag namespace `plugin-v*` is reserved for plugin releases — it
will not collide with `v*` (token releases) or `<tenant>-v*` (tenant
releases).

### 4. Wait for `plugin-publish.yml` to complete

Track the build at:
**Azure DevOps → Pipelines → Publish BTech Token Studio Plugin**

Successful run produces:
- ZIP in Azure Artifacts feed `btech` (Universal packages tab) under
  `btech-token-studio@<version>`
- Build artifact `btech-token-studio-<version>` pinned to the build
  summary (one-click download)

If the run fails on **"Verify package.json matches tag"**: the tag
version doesn't match `package.json`. Either re-tag or bump
`package.json` and re-tag.

### 5. Admin uploads to Figma org

> Admin role required: **Figma Organization admin** (not just
> workspace admin).

Desktop Figma is recommended — the org plugin upload flow is more
reliable on desktop than browser.

**First publish (one-time per plugin):**

1. Download ZIP:
   - Azure DevOps → Artifacts → btech feed → Universal → `btech-token-studio` → click latest version → Download
   - OR from the build summary (faster): build run page → Artifacts → `btech-token-studio-<version>` → Download
2. Extract the ZIP locally. You should see:
   ```
   btech-token-studio/
     manifest.json
     dist/code.js
     dist/index.html
     assets/icon.png
     assets/cover.png
     assets/README.md
     README.md
   ```
3. Figma desktop → top-left avatar → **"Manage plugins for organization"**
4. Click **"+ Publish new plugin"**
5. **Manifest**: select `manifest.json` from the extracted folder
6. **Icon**: when prompted, upload `assets/icon.png` (128×128 PNG)
7. **Cover**: upload `assets/cover.png` (1920×960 PNG)
8. **Plugin name**: pre-filled from manifest (`BTech Token Studio`)
9. **Tagline** (1 line): `Pull, edit, push BTech design tokens — no code.`
10. **Description**: short paragraph. Suggested:
    > Edit BUMA design tokens directly in Figma. Pull the latest
    > tokens from the design-system repo, edit values inline, and push
    > a pull request — no clones, no terminal.
11. **Categories**: `Design systems`, `Productivity`
12. **Submit for org publish**

Figma processing: usually a few minutes. The plugin appears under
**Plugins** in every BUMA Figma user's menu once processed.

**Subsequent updates:**

1. Same download step as above (latest ZIP)
2. Figma desktop → "Manage plugins for organization"
3. Find `BTech Token Studio` → click **"Update plugin"**
4. Re-upload `manifest.json` from the new extracted folder
5. Update icon/cover only if assets changed (skip otherwise)
6. Update description / tagline only if changed
7. Submit

Designer machines auto-update on next plugin open — no action required
from end users.

### 6. Announce

Post in `#btech-design-system` Slack:
> 🚀 BTech Token Studio v<version> shipped. Highlights: <changelog>.
> See [`docs/plugin-onboarding.md`](./plugin-onboarding.md) if you've
> never set it up.

---

## Hotfix / emergency release

Same flow as normal release — there's no separate hotfix branch.
Plugin commits land on `main` and ship via tag like everything else.
If the bug is severe enough that designers can't use the current
release, the admin can **unpublish** the broken version in the Figma
admin UI (ZIP stays in Azure Artifacts as an audit record).

---

## Rollback

To roll back to a previous version:

1. Find the previous version's ZIP in Azure Artifacts (Universal feed
   → `btech-token-studio` → all versions)
2. Download → extract
3. Figma admin UI → Update plugin → upload the old `manifest.json`
4. Submit

Universal Packages versions are immutable, so a rollback target is
always available.

---

## Pre-publish checklist (first release only)

Run through this before pushing `plugin-v1.0.0`:

- [ ] Designer has dropped `btech-token-studio/assets/icon.png` (128×128 PNG)
- [ ] Designer has dropped `btech-token-studio/assets/cover.png` (1920×960 PNG)
- [ ] `btech-token-studio/package.json` `version` bumped to `1.0.0`
- [ ] Local smoke test passed: import manifest → settings → connect → pull → edit → push → PR opens
- [ ] Tag `plugin-v1.0.0` pushed
- [ ] `plugin-publish.yml` ran green
- [ ] Admin downloaded ZIP from Azure Artifacts
- [ ] Admin uploaded to Figma org via "+ Publish new plugin"
- [ ] Plugin appears in **Plugins** menu for a non-admin designer test account
- [ ] Test designer can complete pull → edit → push end-to-end
- [ ] Onboarding doc shared in `#btech-design-system`

---

## FAQ

**Why isn't this auto-published to Figma?**
Figma's organization plugin publish flow is admin-UI-only. There's no
public API. We've automated everything up to that step.

**Why a separate tag namespace `plugin-v*`?**
Plugin and token releases have very different cadences. Mixing them
in one tag namespace would force coordinated releases or noisy
matching regexes in pipelines. Separation keeps each pipeline trigger
unambiguous and lets each ship on its own schedule.

**Why ZIP in a Universal feed instead of npm?**
The plugin isn't an installable npm package — designers consume it
inside Figma, not via `pnpm add`. A binary artifact in Azure
Artifacts Universal feed gives us versioned, immutable, auditable
storage with a clean download UI for the admin. Publishing to npm
would imply consumption flow that doesn't exist.

**What if multiple Figma orgs need the plugin?**
Each org admin uploads from the same ZIP. Figma org plugins are
scoped per-org by design.
