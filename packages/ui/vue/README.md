# @btech/ui-vue

Vue 3 component library for the BTech Design System. Components are sliced
from Figma frames and consume design tokens from `@btech/tokens`.

## Install

```bash
pnpm add @btech/ui-vue @btech/tokens-bspace
```

## Usage

```vue
<script setup lang="ts">
import { BAvatar } from '@btech/ui-vue';
import '@btech/ui-vue/styles.css';
import '@btech/tokens-bspace/styles.css';
</script>

<template>
  <BAvatar size="md" initials="FL" color="green" />
  <BAvatar size="lg" src="/john.jpg" alt="John" />
  <BAvatar size="sm" :count="5" />
  <BAvatar size="md" />
  <BAvatar size="md" status="error" />
</template>
```

## Components

| Component | Status | Figma node |
|---|---|---|
| `BAvatar` | ✅ alpha | `497:979` |

The `B` prefix is the Vue convention to avoid HTML element name collisions
(`<Avatar>` would conflict with future custom elements). React uses no
prefix because JSX namespaces are colocated with imports.
