# Flutter component conventions (btech_ui)

**Status:** MANDATORY  •  **Reference:** [Shared.Package.Mobile.DesignSystem](../reference-repos.md#flutter--buma_design_system)

## Folder structure

```
packages/ui/flutter/lib/src/components/
├── atoms/              # button, badge, checkbox, divider, switch, ...
├── molecules/          # avatar, dropdown-trigger, menu-item, ...
├── organisms/          # avatar-group, form-input, modal, card, ...
└── patterns/           # empty-state, chat, ...

components.dart         # top-level barrel (NOT in subfolders)
{layer}/{layer}.dart    # per-layer barrel (e.g. atoms/atoms.dart)
{layer}/{name}/{name}.dart  # per-component barrel
```

## Per-component anatomy

```
{layer}/{name}/
├── {name}.dart                    # public barrel — exports types + widget
├── {name}.widget.dart             # main BT{Name} widget + named ctors
├── {name}.types.dart              # public enums + data classes
├── component.meta.yaml            # props/variants/figmaUrl schema
├── internal/                      # PRIVATE — never re-exported
│   └── {name}.constants.dart      # _palette, _sizePx, helper funcs
└── models/                        # OPTIONAL — only when widget takes
    └── {name}.item.dart           #   richer data classes (avatar item)
```

## Naming

| Kind | Pattern | Example |
|---|---|---|
| Folder | `lower_snake_case` (no dot, no dash) | `avatar`, `avatar_group` |
| File | `lower_snake_case.dart` with **dot separator** for role | `avatar.widget.dart`, `avatar.types.dart` |
| Public widget class | `BT` + PascalCase | `BTAvatar`, `BTAvatarGroup` |
| Public enum | `BT` + PascalCase + suffix | `BTAvatarSize`, `BTBadgeTone` |
| Public data class | `BT` + PascalCase + (no suffix) | `BTAvatarItem` |
| Private helper widget | `_BT` prefix | `_BTAvatarShimmer` |
| Private constants | leading `_` (file-private) | `_palette`, `_sizePx` |
| Theme tokens | `BTech` + PascalCase (LONG, foundational, in `btech_tokens`) | `BTechColor`, `BTechRadius` |

The `BT` vs `BTech` split is intentional: theme tokens are typed less
often, can afford the longer name. Component classes are typed at every
usage site, so we shorten them.

## Variant API — BOTH styles required

### (a) Discriminated default constructor (cross-framework parity)

```dart
const BTAvatar({
  super.key,
  required this.item,
  this.size = BTAvatarSize.md,
  this.isLoading = false,
});
```

### (b) Named constructors (Dart-idiomatic, syntactic sugar)

For multi-axis variants (Avatar single vs group, Button primary vs
secondary), each named constructor expresses intent at the call site:

```dart
const BTAvatar.group({
  super.key,
  required this.items,
  this.size = BTAvatarSize.md,
  this.isLoading = false,
}) : item = null;

// Each named ctor uses `: field = null` initializers to enforce
// mutual exclusivity with the default constructor's fields.
```

Both produce identical widgets — named constructors just delegate to
the same underlying state.

## Doc comments

Use **`///` triple-slash** on every public class, constructor, field,
enum, and method. Class-level doc includes a `dart` code-block usage
example:

```dart
/// BTAvatar — circular badge with image / initials / count.
///
/// Mirrors the React/Vue API one-to-one (same prop names, same
/// variant precedence). Sliced from Figma node `497:979`.
///
/// ## Single avatar:
/// ```dart
/// const BTAvatar(
///   item: BTAvatarItem(name: 'Faisal Lestari'),
///   size: BTAvatarSize.md,
/// )
/// ```
///
/// ## Group:
/// ```dart
/// const BTAvatar.group(
///   items: [
///     BTAvatarItem(name: 'Person 1'),
///     BTAvatarItem(name: 'Person 2'),
///   ],
///   size: BTAvatarSize.sm,
/// )
/// ```
class BTAvatar extends StatelessWidget { /* ... */ }
```

**File-level prose comments** use `//` (not `///`) to avoid the
`dangling_library_doc_comments` lint. If a file genuinely is a
library entry point, declare `library;` after the doc comment.

## Imports

Use `package:btech_ui/...` imports (never relative `../../`) within
the package. Required by `very_good_analysis` lint rule
`always_use_package_imports`. Sort alphabetically:

```dart
import 'package:btech_tokens/btech_tokens.dart';
import 'package:btech_ui/src/components/molecules/avatar/avatar.types.dart';
import 'package:btech_ui/src/components/molecules/avatar/internal/avatar.constants.dart';
import 'package:flutter/material.dart';
```

## Switch expressions for variant logic

Modern Dart `switch` expressions, not statements:

```dart
double _fontSizeFor(BTAvatarSize s) => switch (s) {
  BTAvatarSize.xs => 10,
  BTAvatarSize.sm => 14,
  BTAvatarSize.md => 16,
  BTAvatarSize.lg => 20,
  BTAvatarSize.xl => 28,
  BTAvatarSize.xxl => 40,
};
```

## Theme integration

ALWAYS access tokens via `BuildContext` extension (reactive light/dark):

```dart
final neutralBg = context.btechColor.bg.subtler;
final inverseFg = context.btechColor.text.inverse;
```

NEVER hardcode `Color(0xFF...)` for tokens already in btech_tokens.
For component-specific palettes (avatar's 6 colors) — hardcode in
`internal/<name>.constants.dart` per the
[component-specific colors rule](../figma-visual-rule.md).

## Linter

`packages/ui/flutter/analysis_options.yaml`:
```yaml
include: package:very_good_analysis/analysis_options.yaml
analyzer:
  errors:
    comment_references: ignore
    deprecated_member_use: ignore
    prefer_asserts_with_message: ignore
    public_member_api_docs: ignore
```

Generated code MUST pass `flutter analyze` with **zero issues** (info,
warning, error all count).

## Test convention

- Unit tests for utility functions (extension methods, helpers):
  `test/{path}_test.dart`
- Widget tests: skip for now (Phase 2)
- Golden tests: skip for now (Phase 2)
- Smoke test = component renders in `apps/ui-showcase-flutter/` without
  errors

## Common questions answered

- **Where does the doc-comment live?** On the class declaration via
  `///`, with `dart` code-block usage example.
- **What's the example block format?** Triple-backtick `dart` block
  inside the `///` comment, showing 1-3 realistic call sites.
- **Where do internal helpers go?** `internal/{name}.constants.dart`
  for constants, `internal/{name}.{role}.widget.dart` for
  private widgets used by the public widget.
- **Where do public types live?** `{name}.types.dart` for enums and
  small data classes; `models/` subfolder for richer data classes
  (`BTAvatarItem` if it grows beyond 3-4 fields).
