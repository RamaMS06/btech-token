# BTech Token Studio — Plugin Assets

This directory holds the **publishing assets** for the Figma org plugin.
They are NOT bundled into `dist/` — Figma stores them directly when an
admin publishes the plugin to the organization. They live here so the
canonical versions are in git, version-controlled alongside the plugin
code that ships with them.

## Required files

| File | Spec | Purpose |
|---|---|---|
| `icon.png` | 128×128 PNG, square, opaque background, no padding | Shown in Figma Plugins menu, search results, and plugin tile |
| `cover.png` | 1920×960 PNG (16:8 aspect), brand visual + plugin name | Shown on the plugin's detail page in Figma org plugin browser |

Optional (future):
- `cover.mp4` — Figma supports video covers (10s, ≤5MB H.264). Drop in
  here if/when designer produces one.

## Source / authoring

- Designed in Figma using the **BTech brand** color palette
  (`color/brand/blue` family) and **Inter** typography (consistent with
  the design system itself — the plugin should look like a member of
  the family it serves).
- Templates: see Figma file
  `Bspace DS / Plugin Assets / BTech Token Studio Cover` (linked in
  internal handoff).
- Export from Figma: select frame → right panel → Export → 1×, PNG,
  Transparent background = OFF for icon (Figma org plugins require
  opaque), ON allowed for cover but flat brand background recommended.

## When are they used?

These files are **manually uploaded by the Figma admin** at first
publish (Figma → Manage plugins for organization → Publish new plugin).
The `plugin-publish.yml` CI pipeline includes them in the published ZIP
artifact so the admin always grabs the canonical pair when downloading
a release.

After the first publish, Figma stores its own copy. Subsequent updates
only need to re-upload these files if the visuals change.

## Don't

- Don't commit working files (.fig, .psd, .sketch) — link to Figma
  source instead.
- Don't update icon/cover without a corresponding plugin version bump
  — the version number in package.json is what tells the admin "this
  release ships new visuals, please re-upload."
- Don't reference these files from `manifest.json` — Figma's manifest
  spec doesn't have icon/cover fields. They are admin-UI inputs only.
