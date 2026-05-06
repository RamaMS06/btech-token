# BTTabs

> Tab strip molecule with two visual variants: segmented pill tray and line underline.

Figma: [node 1:53 · Base/TabItem 434:5262](https://www.figma.com/design/WANr9drWYNYbMPuT2sMeHi/BTech-Design-System?node-id=1-53) · Category: Molecules

---

## Overview

`BTTabs` renders a horizontal tab strip from a list of `BTTabItem` descriptors. The active
tab is externally controlled via `activeIndex` (and `v-model:activeIndex` in Vue).

Two variants are available:
- **segmented** — gray pill tray background (`--bg-secondary`), active tab has filled `--color-brand-primary` background with white text.
- **line** — no tray, active tab has a 2px `--color-brand-primary` underline border.

Tabs can include optional leading and trailing icons. Individual tabs can be disabled.

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'segmented' \| 'line'` | `'segmented'` | Visual style of the tab strip. |
| `tabs` | `BTTabItem[]` | — | Ordered list of tab descriptors. **Required.** |
| `activeIndex` | `number` | `0` | Zero-based index of the currently active tab. |
| `className` | `string` | — | Additional CSS class on the root element (Vue/React). |

### BTTabItem

| Field | Type | Default | Description |
|---|---|---|---|
| `label` | `string` | — | Label text displayed in the tab. **Required.** |
| `disabled` | `boolean` | `false` | When true, the tab is not interactive. |

## Variants / States

- **segmented** — 40px tall gray tray, 4px inner padding, `--radius-md` corners. Active tab: filled primary pill.
- **line** — flat row, 4px gap between items, no background. Active tab: 2px primary bottom border.
- **disabled** — tab button is not interactive, opacity conveys the disabled state.
- **with icons** — optional leading/trailing icon per tab index (16×16px).

## Usage

### Vue

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { BTTabs } from '@btech/ui-vue';

const active = ref(0);
const tabs = [{ label: 'Overview' }, { label: 'Details' }, { label: 'History' }];
</script>

<template>
  <!-- Segmented -->
  <BTTabs variant="segmented" :tabs="tabs" v-model:activeIndex="active" />

  <!-- Line -->
  <BTTabs variant="line" :tabs="tabs" v-model:activeIndex="active" />

  <!-- With leading icon slot for tab at index 0 -->
  <BTTabs variant="segmented" :tabs="tabs" v-model:activeIndex="active">
    <template #leading-icon-0>
      <svg .../>
    </template>
  </BTTabs>
</template>
```

### React

```tsx
import { useState } from 'react';
import { BTTabs } from '@btech/ui-react';

const tabs = [{ label: 'Overview' }, { label: 'Details' }, { label: 'History' }];

export function Example() {
  const [active, setActive] = useState(0);
  return (
    <>
      {/* Segmented */}
      <BTTabs
        variant="segmented"
        tabs={tabs}
        activeIndex={active}
        onActiveIndexChange={setActive}
      />

      {/* Line */}
      <BTTabs
        variant="line"
        tabs={tabs}
        activeIndex={active}
        onActiveIndexChange={setActive}
      />

      {/* With leading icon render prop */}
      <BTTabs
        variant="segmented"
        tabs={tabs}
        activeIndex={active}
        onActiveIndexChange={setActive}
        leadingIcon={(i) => <MyIcon index={i} />}
      />
    </>
  );
}
```

### Flutter

```dart
import 'package:btech_ui/btech_ui.dart';

// In a StatefulWidget:
int _active = 0;

BTTabs(
  variant: BTTabsVariant.segmented,
  tabs: const [
    BTTabItem(label: 'Overview'),
    BTTabItem(label: 'Details'),
    BTTabItem(label: 'History'),
  ],
  activeIndex: _active,
  onActiveIndexChange: (i) => setState(() => _active = i),
);

// Line variant with leading icons
BTTabs(
  variant: BTTabsVariant.line,
  tabs: const [BTTabItem(label: 'List'), BTTabItem(label: 'Grid')],
  activeIndex: _active,
  onActiveIndexChange: (i) => setState(() => _active = i),
  leadingIconBuilder: (i) => Icon(i == 0 ? Icons.list : Icons.grid_view, size: 16),
);
```

---

## Notes

**Token usage:**
- Container bg (segmented): `--bg-secondary` / `context.btechColor.bg.secondary`
- Container radius (segmented): `--radius-md` / `context.btechRadius.md` (12px)
- Item radius: `--radius-sm` / `context.btechRadius.sm` (8px)
- Active fill / border: `--color-brand-primary` / `context.btechColor.brand.primary`
- Inactive text: `--text-secondary` / `context.btechColor.text.secondary`
- Active text (segmented): `--text-inverse` / `context.btechColor.text.inverse`

**Accessibility:**
- Root element has `role="tablist"`.
- Each button has `role="tab"`, `aria-selected`, `aria-disabled`, and correct `tabIndex` (0 for active, -1 for others).

**Dark mode (Flutter):**
All colors use `context.btechColor.*` accessors which are reactive to light/dark mode automatically.
