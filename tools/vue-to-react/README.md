# @btech/vue-to-react — Vue SFC → React TSX converter

Anthropic Claude Sonnet–powered converter that transforms btech_ui Vue 3
SFCs into idiomatic React 18+ components with strict cross-framework
parity (same prop names, same variant precedence, same CSS classes).

## Why

We have an internal Vue reference repo (`Shared.Package.Frontend.Design
System`) but no internal React reference. The converter eliminates the
"halu / made-up React idioms" risk by deriving React from a trusted Vue
source, with shadcn/ui consulted only for React-specific idioms.

See [`docs/architecture/generation-flow.md`](../../docs/architecture/generation-flow.md)
for the full pipeline.

## Usage

```bash
# Dry-run (no API call — prints prompt sizes)
pnpm convert-vue-to-react packages/ui/vue/src/components/molecules/Avatar/BTAvatar.vue --dry-run

# Live (requires ANTHROPIC_API_KEY)
export ANTHROPIC_API_KEY=sk-ant-...
pnpm convert-vue-to-react packages/ui/vue/src/components/molecules/Avatar/BTAvatar.vue

# Custom output dir
pnpm convert-vue-to-react path/to/Foo.vue --out packages/ui/react/src/components/molecules/Foo
```

## Prompt cache structure

3 ephemeral cache breakpoints (5-min TTL, 90% off on hit):

1. **System prompt** — `src/prompts/system.md`
2. **Conventions doc** — `docs/architecture/component-conventions/react.md`
3. **Few-shot pairs** — `src/few-shot/{avatar,badge,button}.{vue,tsx}`

Dynamic per-call: the source Vue SFC content.

## Cost projection

- First conversion (cold cache): ~$0.20
- Subsequent within 5 min (cache hit): ~$0.04
- 100 components: ~**$5**

## Validation

After conversion, the CLI hints to run `tsc --noEmit` on the output.
A Phase D follow-up will integrate automatic validation.
