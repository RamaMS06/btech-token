# CI / CD & Release

The exact contract for what triggers what. Know it before you push.

---

## 1. Workflow trigger matrix

```
+---------------+--------------------------------------+----------------------------+
| Workflow      | Trigger                              | Scope (edits that fire it) |
+---------------+--------------------------------------+----------------------------+
| generate.yml  | push on ANY branch except `main`,    | tokens/**                  |
|               | path-filtered                        | config/sd.config.ts        |
+---------------+--------------------------------------+----------------------------+
| validate.yml  | push to `main`                       | (no path filter -          |
|               | pull_request targeting `main`        |  every change runs it)     |
+---------------+--------------------------------------+----------------------------+
| publish.yml   | push of a tag matching `v*`          | tag creation only          |
+---------------+--------------------------------------+----------------------------+
```

Source: `.github/workflows/{generate,validate,publish}.yml`.

---

## 2. Edit → workflow decision table

```
+---------------------------------------+--------------+--------------+---------+
| What you edited                       | generate.yml | validate.yml | publish |
+---------------------------------------+--------------+--------------+---------+
| tokens/core/**                        |     yes      | yes (on PR)  |   no    |
| tokens/semantic/**                    |     yes      | yes (on PR)  |   no    |
| tokens/components/**                  |     yes      | yes (on PR)  |   no    |
| tokens/tenants/<id>/overrides.json    |     yes      | yes (on PR)  |   no    |
| config/sd.config.ts                   |     yes      | yes (on PR)  |   no    |
| packages/**/src/**  (generated only)  |     no       | yes (on PR)* |   no    |
| apps/**                               |     no       | yes (on PR)  |   no    |
| scripts/**, tools/**                  |     no       | yes (on PR)  |   no    |
| .github/workflows/**                  |     no       | yes (on PR)  |   no    |
| push tag `vX.Y.Z`                     |     no       | no           |   yes   |
+---------------------------------------+--------------+--------------+---------+
  * Editing generated files by hand is not supported: the sync check will
    regenerate from tokens/ and revert your diff at review time.
```

---

## 3. What each workflow does (short version)

**generate.yml** — regenerates outputs and `git-auto-commit`s them back to the
feature branch. Auto-commit scope covers `packages/tokens-dart/lib/src/**`,
`packages/tokens-dart/lib/btech_tokens.dart`, and `packages/tokens-web/src/**`.

**validate.yml** — re-runs `pnpm generate`, fails if any generated file drifts
from `tokens/`, then runs `contrast.ts`, `boundary.ts`, and `flutter analyze`.
This is the final gate before merge to `main`.

**publish.yml** — runs validators, `pnpm build`, then
`changeset publish` → GitHub Packages for `@btech/tokens`. Dart
publication follows the synced version via `flutter pub publish` from the
release runbook.

Read the YAML files directly if you need the step-by-step — they are short.

---

## 4. Versioning & release

Managed by **Changesets**, with a mirror step that locks the Dart package's
`pubspec.yaml` to the JS package's `package.json`.

```
  1. pnpm changeset                 # record intent (patch/minor/major + summary)
  2. commit + push + merge PR       # changeset file lands on main
  3. pnpm version                   # local, by a maintainer:
       - changeset version          #   bumps packages/tokens-web/package.json
       - pnpm sync-dart-version     #   writes same version into pubspec.yaml
  4. git commit && git tag vX.Y.Z && git push --tags
       - publish.yml fires on the tag
```

Both packages share the same version at all times, enforced by
`scripts/sync-dart-version.ts`. Do not bump them out of step.
