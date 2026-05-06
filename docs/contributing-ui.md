# Contributing — UI Component Developer Guide

For developers working on `packages/ui/{flutter,react,vue}/` and the
slicer / converter pipeline under `tools/`. If you're editing tokens
only, see [`contributing.md`](./contributing.md) instead.

---

## 1. Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | 20.x | pnpm + Vite + slicer |
| pnpm | 9.x | Monorepo workspace |
| Flutter | 3.22.x stable | Flutter package + showcase |
| Claude Code | latest | AI-driven slicing + project skills |
| Git | any | Cloning reference repos |

```bash
pnpm install
pnpm setup:auth   # Azure Artifacts PAT (see root README)
```

---

## 2. Clone the reference repos (MANDATORY)

The UI rules in [`CLAUDE.md`](../CLAUDE.md) §3 say "read these for code
patterns." They live OUTSIDE this repo and must be cloned at the exact
paths below — the slicer prompts and convention docs reference them by
absolute path.

```bash
# Flutter pattern reference (buma_design_system)
mkdir -p ~/Documents/FlutterProjects
cd ~/Documents/FlutterProjects
git clone <Shared.Package.Mobile.DesignSystem-repo-url> Shared.Package.Mobile.DesignSystem

# Vue pattern reference (@buma-dev/buma-ui-v2)
mkdir -p ~/Documents/Vue
cd ~/Documents/Vue
git clone <Shared.Package.Frontend.DesignSystem-repo-url> Shared.Package.Frontend.DesignSystem
```

> Ask a teammate for the exact Azure DevOps URLs of these two repos —
> they live in the same Buma org as `btech-ds`.

React has no internal reference repo. Use shadcn/ui (read-only,
GitHub) for React-specific idioms; details in
[`docs/architecture/reference-repos.md`](./architecture/reference-repos.md).

**ZERO runtime dependency** on these repos — btech-ds consumers never
install them. They are READ-ONLY pattern sources for Claude/devs only.

---

## 3. Configure Figma MCP (per-developer setup)

The slicer fetches Figma frames via the official Figma MCP. Each
developer configures their own personal access token — the project
`.mcp.json` only ships `code-review-graph`.

1. Go to [Figma → Settings → Personal access tokens](https://www.figma.com/settings)
   and create a new token with **Read-only file** scope.
2. Add the Figma MCP to your Claude Code config (`~/.claude/mcp.json`
   or via the IDE's MCP UI):

   ```jsonc
   {
     "mcpServers": {
       "figma": {
         "command": "npx",
         "args": ["-y", "@figma/mcp"],
         "env": { "FIGMA_PERSONAL_ACCESS_TOKEN": "figd_xxx..." },
         "type": "stdio"
       }
     }
   }
   ```

3. Restart Claude Code and verify the `mcp__figma__get_design_context`
   tool is available.

> The token never enters the repo. Treat it like an SSH key.

---

## 4. Verify your local setup

```bash
# Tokens generate cleanly
pnpm generate

# Showcases boot
pnpm showcase           # React, http://localhost:5178
pnpm showcase:vue       # Vue,   http://localhost:5179
pnpm showcase:flutter   # Flutter Web in Chrome

# Static analysis is clean
flutter analyze packages/ui/flutter --no-fatal-infos
pnpm --filter @btech/ui-react exec tsc --noEmit
pnpm --filter @btech/ui-vue exec vue-tsc --noEmit
```

If all 3 showcases render and analyzers pass, you're ready.

---

## 5. Slice your first component

See [`architecture/slicing-workflow.md`](./architecture/slicing-workflow.md)
for the step-by-step.

Quick summary:

```bash
pnpm slice <figma-url>          # generates Vue + Flutter
pnpm convert-vue-to-react <vue-file>  # generates React from Vue
```

---

## 6. Project memory & rules — READ THESE FIRST

Claude Code auto-loads these on every session in this repo. As a human
contributor, you should read them once before touching `packages/ui/`:

| File | What it covers |
|---|---|
| [`CLAUDE.md`](../CLAUDE.md) (root) | Token system + UI slicing rules + naming + color rule + reference repos + clean-code requirements |
| [`docs/architecture/figma-visual-rule.md`](./architecture/figma-visual-rule.md) | Figma URL = visual source of truth |
| [`docs/architecture/reference-repos.md`](./architecture/reference-repos.md) | Per-framework pattern sources |
| [`docs/architecture/generation-flow.md`](./architecture/generation-flow.md) | Figma → Vue+Flutter → React-via-agent |
| [`docs/architecture/component-conventions/{flutter,react,vue}.md`](./architecture/component-conventions/) | Per-framework idiomatic patterns |
| [`docs/architecture/slicing-workflow.md`](./architecture/slicing-workflow.md) | Step-by-step slicing recipe |

**Critical rules to internalize (CLAUDE.md):**

- §1 — Visual values come from Figma, never from reference repos.
- §2 — Component-specific colors are HARDCODED, not tokenized.
- §6 — Web CSS uses `var(--token)` with NO hex fallback.
- §7 — Color token mapping: lookup by HEX, never by name. `subtle` /
  `subtler` / `subtlest` are different values, ordering inconsistent
  across families.
- §9 (clean-code rule 9) — Web CSS lives in dedicated `BT{Name}.css`
  shared between React and Vue; no `<style>` block in `.vue`.

---

## 7. Project Claude skills

When working in this repo with Claude Code, these project-level skills
auto-load from `.claude/skills/`:

| Skill | Trigger | Purpose |
|---|---|---|
| `slice-component` | "slice this Figma frame", "generate component" | Drives the Figma → Vue+Flutter → React pipeline |
| `verify-figma-mapping` | "map this color", "verify token mapping" | Enforces §7 color-rule workflow (hex-first lookup) |
| `explore-codebase` | "explore", "understand" | Uses `code-review-graph` MCP first |
| `refactor-safely` | "refactor X" | Graph-aware refactor |
| `review-changes` | "review my changes" | Graph-aware code review |
| `debug-issue` | "debug X" | Systematic debugging |

You don't need to invoke them explicitly — Claude picks them up from
your phrasing. They are committed to the repo so every contributor
gets the same workflow.

---

## 8. Workflow expectations

1. **Always work in a feature branch.** `feat/ui-<component>` for new
   components, `fix/ui-<component>` for bug fixes.
2. **Run `flutter analyze` + `tsc --noEmit` + `vue-tsc --noEmit`** before
   pushing. CI runs them too but local is faster.
3. **Showcase entry is mandatory** — a component without a showcase
   row in all 3 apps is invisible to designers and reviewers.
4. **Commit `component.meta.yaml`** for every component (props,
   variants, `figmaUrl`, `figmaNodeId`).
5. **Never commit Figma tokens or PATs.** They live in personal config
   only.

---

## 9. Where to ask

- Architecture / slicer / pipeline questions → check
  `docs/architecture/` first, then ask in team chat
- Figma frame ambiguities → ask the designer; never invent visual values
- Token mapping uncertainties → follow CLAUDE.md §7 workflow; if a
  Figma color has no matching token, hardcode per §2 and document why
