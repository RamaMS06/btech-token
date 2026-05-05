# btech_ui

Flutter component library for the BTech Design System. Components are
sliced from Figma frames and consume design tokens from `btech_tokens`.

## Setup

Path-dependency in your app's `pubspec.yaml` (until published to a pub
registry):

```yaml
dependencies:
  btech_ui:
    path: ../../packages/ui-flutter
  btech_tokens:
    path: ../../packages/tokens/platforms/flutter/token
```

Wire the theme once at app root (mirrors the existing `btech_tokens` setup):

```dart
import 'package:btech_ui/btech_ui.dart';
import 'package:btech_tokens/btech_tokens.dart';
import 'package:flutter/material.dart';

MaterialApp(
  theme:     btechTheme(),
  darkTheme: btechTheme(brightness: Brightness.dark),
  themeMode: ThemeMode.system,
  home: const Scaffold(body: AvatarShowcase()),
)
```

## Usage

```dart
const BAvatar(size: BAvatarSize.md, initials: 'FL', color: BAvatarColor.green)
const BAvatar(size: BAvatarSize.lg, imageUrl: 'https://...')
const BAvatar(size: BAvatarSize.sm, count: 5)
const BAvatar(size: BAvatarSize.md)                                // empty
const BAvatar(size: BAvatarSize.md, status: BAvatarStatus.error)   // broken
```

## Components

| Component | Status | Figma node |
|---|---|---|
| `BAvatar` | ✅ alpha | `497:979` |

The `B` prefix matches the Vue `BAvatar` convention so designers and devs
get one mental model for the component name. React drops the prefix
because JSX namespaces are colocated with imports.
