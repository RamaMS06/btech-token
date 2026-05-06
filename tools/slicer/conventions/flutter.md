# btech_ui — Flutter conventions

Generated components MUST follow these rules. They mirror `buma-ui`'s
proven patterns (45+ components in production) adapted to btech branding.

## 1. Folder structure (atomic design)

```
packages/ui/flutter/lib/src/components/
├── atoms/         # button, badge, checkbox, switch, divider, hint, label, ...
├── molecules/     # avatar, dropdown trigger, menu item, ...
├── organisms/     # form input, modal, card, table, ...
└── patterns/      # empty state, chat, dashboard layouts, ...
```

Pick the layer based on composition depth: a button is an atom, an avatar
(circle + image OR letters OR icon) is a molecule, a form input (label +
field + hint + validation) is an organism.

## 2. Per-component anatomy

```
components/{layer}/{name}/
├── {name}.dart                    # public barrel — exports types + widget
├── {name}.widget.dart             # main BT{Name} widget + named constructors
├── {name}.types.dart              # public enums (BT{Name}Size, ...Color, ...Status)
├── internal/                      # PRIVATE helpers — never re-exported
│   └── {name}.constants.dart      # _palette, _sizePx, _fontSizeFor()
└── models/                        # OPTIONAL — only when widget takes data classes
    └── {name}.item.dart
```

## 3. Class naming

| Kind | Pattern | Example |
|---|---|---|
| Widget class | `BT` + PascalCase | `BTAvatar`, `BTButton` |
| Public enum | `BT` + PascalCase + suffix | `BTAvatarSize`, `BTButtonVariant` |
| Theme tokens | `BTech` (LONG, foundational) | `BTechColor`, `BTechRadius` |
| Private helper widget | `_BT` prefix | `_BTAvatarShimmer` |
| Private constant | leading `_` | `_palette`, `_sizePx` |

Files are `lower_snake_case.dart` with **dot separators** for role:
`avatar.widget.dart`, `avatar.types.dart`, `avatar.constants.dart`.

## 4. Variant API — BOTH styles required

**(a) Discriminated default constructor** (cross-framework parity with React/Vue):

```dart
const BTAvatar({
  super.key,
  this.size = BTAvatarSize.md,
  this.src,
  this.initials,
  this.color = BTAvatarColor.green,
  this.count,
  this.status,
});
```

**(b) Named constructors** for each variant — Dart-idiomatic syntactic sugar:

```dart
const BTAvatar.image({required String this.src, ...}) :
  initials = null, count = null, status = null;

const BTAvatar.initials(String this.initials, {...}) :
  src = null, count = null, status = null;
```

Both must produce identical widgets. Named constructors just delegate.

## 5. Doc comments

Use `///` triple-slash on every public class, constructor, field, enum, and
method. Class-level doc comment includes a `dart` code-block usage example:

```dart
/// BTAvatar — circular badge with image / initials / count / placeholder.
///
/// ## Discriminated props:
/// ```dart
/// const BTAvatar(initials: 'FL', size: BTAvatarSize.md);
/// ```
class BTAvatar extends StatelessWidget { ... }
```

File-level prose comments use `//` (not `///`) to avoid the
`dangling_library_doc_comments` lint.

## 6. Theme integration

ALWAYS access tokens via `BuildContext` extension (reactive light/dark):

```dart
final neutralBg = context.btechColor.bg.subtler;
final neutralFg = context.btechColor.text.secondary;
```

NEVER hardcode `Color(0xFF...)` for tokens already in btech_tokens.
Brand-palette colors not yet tokenized (e.g. avatar green/blue/etc.) live
in `internal/<name>.constants.dart` with a `// TODO: tokenize` comment.

## 7. Switch expressions for variant logic

Use modern Dart `switch` expressions, not statements:

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

## 8. Imports

Always use `package:btech_ui/...` imports (never relative `../`) within
the package. Required by `very_good_analysis` lint rule
`always_use_package_imports`. Sort alphabetically.

## 9. Linter

`packages/ui/flutter/analysis_options.yaml` includes
`very_good_analysis`. Generated code MUST pass `flutter analyze` with
zero issues.
