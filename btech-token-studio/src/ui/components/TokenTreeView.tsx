/**
 * TokenTreeView — nested visual preview of tokens in the active set
 * -------------------------------------------------------------------
 * Mirrors the Tokens Studio for Figma layout: each DTCG `$type` is a top
 * section, and inside each section we show the natural path tree
 * (collapsible groups) with compact previews per leaf.
 *
 * Layout per leaf:
 *   - color           → 22 px swatch circle
 *   - dimension       → text pill (key on the pill, value in tooltip)
 *   - number / weight → text pill
 *   - fontFamily etc. → text chip
 *   - composite types → fall back to a one-line row (TokenRow)
 *
 * Hovering any preview shows a dark tooltip with the leaf key + the raw
 * $value string. If $value is a DTCG alias like `{dimension.sm}`, the
 * resolved value is also shown — the lookup spans every loaded set (passed
 * as `allSets`) so brand aliases pointing at primitives in a sibling file
 * resolve correctly.
 *
 * Nothing here mutates state — clicks delegate to the `onEdit(path)` callback
 * which the parent uses to open the editor modal.
 */

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from 'react';
import type { DTCGToken, DTCGType, TokenSet } from '../../shared/types.js';
import { treeToFlatTokens, type FlatToken } from '../../shared/transform.js';
import type { ResolvedToken } from '../../shared/tenant-resolver.js';
import { TokenRow } from './TokenRow.js';

/**
 * Read the tenant id that supplied a leaf's value, if any. The marker is
 * stamped by tenant-resolver during merge; base-only renders return null.
 * Kept as a tiny helper so all three preview components ask the same way.
 */
function overriddenBy(token: DTCGToken): string | null {
  return (token as ResolvedToken).__overriddenBy ?? null;
}

// ── Configuration ────────────────────────────────────────────────────────────

/** Order in which `$type` sections render at the top level. */
const TYPE_ORDER: DTCGType[] = [
  'dimension', 'number',
  'color',
  'fontFamily', 'fontWeight', 'typography',
  'shadow', 'border', 'strokeStyle',
  'gradient', 'transition', 'duration', 'cubicBezier',
];

/** Human-friendly section labels (DTCG `$type` is camelCase / lowercase). */
const TYPE_LABELS: Record<DTCGType, string> = {
  color: 'Color',
  dimension: 'Dimension',
  number: 'Number',
  fontFamily: 'Font Family',
  fontWeight: 'Font Weight',
  typography: 'Typography',
  shadow: 'Shadow',
  border: 'Border',
  strokeStyle: 'Stroke Style',
  gradient: 'Gradient',
  transition: 'Transition',
  duration: 'Duration',
  cubicBezier: 'Cubic Bezier',
};

/**
 * Types that get the compact "row of previews" treatment.
 * Composite types fall back to TokenRow because they cannot be shrunk to
 * a single chip without losing information.
 */
const COMPACT_TYPES = new Set<DTCGType>([
  'color', 'dimension', 'number', 'fontWeight', 'duration', 'fontFamily',
  'strokeStyle', 'cubicBezier',
]);

// ── Tree shape ───────────────────────────────────────────────────────────────

interface LeafEntry {
  /** Last segment of the path, used as the visible label on the chip */
  key: string;
  /** Full dot-separated path to the leaf token */
  path: string;
  token: DTCGToken;
}

interface TreeNode {
  /** Direct leaf children of this node — rendered as a compact row */
  leaves: LeafEntry[];
  /** Sub-groups, keyed by their path segment */
  groups: Record<string, TreeNode>;
}

/**
 * Build a path-shaped tree from a flat list of tokens (already filtered to
 * a single $type so the resulting structure is homogeneous).
 */
function buildTree(flat: FlatToken[]): TreeNode {
  const root: TreeNode = { leaves: [], groups: {} };
  for (const { path, token } of flat) {
    const segments = path.split('.');
    let node = root;
    // Walk into nested groups, creating missing nodes as we go
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      if (!node.groups[seg]) node.groups[seg] = { leaves: [], groups: {} };
      node = node.groups[seg];
    }
    const leafKey = segments[segments.length - 1];
    node.leaves.push({ key: leafKey, path, token });
  }
  return root;
}

// ── Alias resolution ─────────────────────────────────────────────────────────

/** True when the value looks like a DTCG alias reference: `{some.path}` */
function isReference(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('{') && value.endsWith('}');
}

/**
 * Resolve a DTCG alias to its underlying value. The `lookup` map is the
 * union of every loaded set's flat tokens (active set wins collisions), so
 * cross-set chains like
 *   color.text.brand → {color.brand.primary.500}
 *                    → {color.green.500}        (in core/color.brand set)
 *                    → "#08a94c"                (in core/color.primitive set)
 * resolve in one walk. Depth-bounded to guard against accidental cycles.
 *
 * Returns the resolved string, or null if the alias cannot be resolved.
 */
function resolveAlias(value: unknown, lookup: Map<string, DTCGToken>, depth = 0): string | null {
  if (depth > 5) return null; // guard against cycles
  if (!isReference(value)) return null;
  const targetPath = value.slice(1, -1);
  const target = lookup.get(targetPath);
  if (!target) return null;
  if (isReference(target.$value)) {
    // Walk one more level — chained aliases are rare but legal
    return resolveAlias(target.$value, lookup, depth + 1) ?? String(target.$value);
  }
  return formatValue(target.$value);
}

/** Render a $value as a short string for tooltip / pill display */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    // Composite values get a placeholder; full inspection happens in the editor
    return JSON.stringify(value);
  }
  return String(value);
}

// ── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipProps {
  /** The bold first line — usually the leaf key (e.g. "600", "sm") */
  title: string;
  /** Raw value string (alias or literal) */
  value: string;
  /** Optional resolved-value string shown when `value` is an alias */
  resolved?: string | null;
  /** Tenant id that supplied this value — adds an "Overridden by …" line */
  override?: string | null;
  /**
   * The element the tooltip should track. We listen to its hover/focus
   * events to toggle visibility, and measure its bounding rect to anchor
   * the tooltip in viewport coordinates.
   */
  anchorRef: RefObject<HTMLElement>;
}

/** Px gap between the trigger and the tooltip body. */
const TT_GAP = 8;
/** Min viewport padding the tooltip will keep on every edge. */
const TT_MARGIN = 8;

/**
 * JS-anchored hover tooltip rendered with `position: fixed`. We can't use the
 * pure-CSS `position: absolute` + `:hover` approach here because the tree
 * panel clips its overflow horizontally — a swatch near the left edge would
 * have its tooltip cut off (visible in the screenshot reported by users).
 *
 * Strategy:
 *   1. Subscribe to mouseenter/leave + focusin/out on the anchor element.
 *   2. On show, measure the anchor + the tooltip and clamp the resulting
 *      coordinates inside the viewport with TT_MARGIN.
 *   3. If there isn't room above the anchor, flip below it (the arrow swaps
 *      direction via the `--below` modifier).
 *   4. The arrow's horizontal offset is exposed as `--tt-arrow-x` so it
 *      keeps pointing at the anchor's center even when the tooltip body
 *      slides sideways to fit on screen.
 */
function LeafTooltip({ title, value, resolved, override, anchorRef }: TooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    arrowX: number;
    below: boolean;
  } | null>(null);

  // Hover/focus → visibility, attached to the anchor (not the tooltip itself,
  // which is `pointer-events: none`).
  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const show = () => setVisible(true);
    const hide = () => setVisible(false);
    el.addEventListener('mouseenter', show);
    el.addEventListener('mouseleave', hide);
    el.addEventListener('focusin', show);
    el.addEventListener('focusout', hide);
    return () => {
      el.removeEventListener('mouseenter', show);
      el.removeEventListener('mouseleave', hide);
      el.removeEventListener('focusin', show);
      el.removeEventListener('focusout', hide);
    };
  }, [anchorRef]);

  // Compute clamped viewport position whenever the tooltip becomes visible
  // or its content changes (so the measured tooltip width is up to date).
  useLayoutEffect(() => {
    if (!visible) return;
    const anchor = anchorRef.current;
    const tip = tooltipRef.current;
    if (!anchor || !tip) return;
    const a = anchor.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const center = a.left + a.width / 2;

    let left = Math.round(center - t.width / 2);
    left = Math.max(TT_MARGIN, Math.min(left, vw - t.width - TT_MARGIN));

    let top = Math.round(a.top - t.height - TT_GAP);
    let below = false;
    if (top < TT_MARGIN) {
      top = Math.round(a.bottom + TT_GAP);
      below = true;
    }
    if (top + t.height > vh - TT_MARGIN) {
      top = Math.max(TT_MARGIN, vh - t.height - TT_MARGIN);
    }

    // Arrow x is in tooltip-local coordinates (so it can travel from the
    // tooltip's left edge to its right edge as the body shifts to fit).
    const arrowX = Math.max(8, Math.min(t.width - 8, Math.round(center - left)));
    setPos({ top, left, arrowX, below });
  }, [visible, title, value, resolved, override, anchorRef]);

  const style: CSSProperties = {
    position: 'fixed',
    top: pos ? `${pos.top}px` : 0,
    left: pos ? `${pos.left}px` : 0,
    opacity: visible && pos ? 1 : 0,
    pointerEvents: 'none',
    // Custom property for the arrow's horizontal offset.
    ['--tt-arrow-x' as unknown as keyof CSSProperties]: pos ? `${pos.arrowX}px` : '50%',
  } as CSSProperties;

  return (
    <div
      ref={tooltipRef}
      className={`leaf-tooltip${pos?.below ? ' leaf-tooltip--below' : ''}`}
      role="tooltip"
      style={style}
    >
      <div className="leaf-tooltip__title">{title}</div>
      <div className="leaf-tooltip__row">
        <span className="leaf-tooltip__value">{value}</span>
        {resolved && resolved !== value && (
          <span className="leaf-tooltip__resolved">{resolved}</span>
        )}
      </div>
      {override && (
        <div className="leaf-tooltip__override">Overridden by {override}</div>
      )}
    </div>
  );
}

// ── Caret icon ───────────────────────────────────────────────────────────────

/**
 * Filled triangle caret used by both section headers and nested branch
 * headers. Rotates 90° clockwise when `open` is true so the same SVG path
 * works for both expanded (▾) and collapsed (▸) states. Sized small to
 * match the Tokens Studio reference — text-character carets felt bulky
 * once they were stacked across multiple nesting levels.
 */
function Caret({ open, size = 8 }: { open: boolean; size?: number }) {
  return (
    <svg
      className={`caret${open ? ' caret--open' : ''}`}
      width={size}
      height={size}
      viewBox="0 0 8 8"
      aria-hidden
    >
      <path d="M2 1.5 L6 4 L2 6.5 Z" fill="currentColor" />
    </svg>
  );
}

// ── Leaf preview components ──────────────────────────────────────────────────

interface LeafPreviewProps {
  leaf: LeafEntry;
  resolved: string | null;
  onEdit: (path: string) => void;
}

/**
 * A single circular color swatch. If $value is an alias, we use the resolved
 * color for the swatch background; if resolution fails, we render a neutral
 * placeholder with a small "↗" hint.
 */
function ColorSwatch({ leaf, resolved, onEdit }: LeafPreviewProps) {
  const raw = formatValue(leaf.token.$value);
  const swatchColor = isReference(leaf.token.$value) ? (resolved ?? '#888') : raw;
  const isUnresolved = isReference(leaf.token.$value) && resolved === null;
  const override = overriddenBy(leaf.token);
  // The wrap is the tooltip anchor — its rect drives the tooltip's pinned
  // viewport coordinates so the tooltip stays on-screen even when the swatch
  // sits flush against the left/right edge of the panel.
  const wrapRef = useRef<HTMLSpanElement>(null);

  return (
    <span className="leaf-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`swatch${override ? ' swatch--overridden' : ''}`}
        onClick={() => onEdit(leaf.path)}
        aria-label={`${leaf.key} — ${raw}${override ? ` (overridden by ${override})` : ''}`}
      >
        <span
          className="swatch__fill"
          style={{ backgroundColor: swatchColor }}
        />
        {isUnresolved && <span className="swatch__alias-marker">↗</span>}
        {/* Tenant override marker — small dot in the corner. The ring on the
            swatch already signals "different from base"; the dot is the second
            cue for accessibility / colour-blind designers. */}
        {override && <span className="swatch__override-dot" aria-hidden />}
      </button>
      <LeafTooltip
        title={leaf.key}
        value={raw}
        resolved={resolved}
        override={override}
        anchorRef={wrapRef}
      />
    </span>
  );
}

/**
 * A text pill — used for dimension, number, fontWeight, duration, fontFamily,
 * strokeStyle, cubicBezier. The pill shows the leaf KEY (xs, sm, …); the
 * actual value lives in the tooltip.
 */
function TextPill({ leaf, resolved, onEdit }: LeafPreviewProps) {
  const raw = formatValue(leaf.token.$value);
  const override = overriddenBy(leaf.token);
  // See ColorSwatch — the wrap anchors the tooltip in viewport space.
  const wrapRef = useRef<HTMLSpanElement>(null);
  return (
    <span className="leaf-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`pill${override ? ' pill--overridden' : ''}`}
        onClick={() => onEdit(leaf.path)}
      >
        {leaf.key}
      </button>
      <LeafTooltip
        title={leaf.key}
        value={raw}
        resolved={resolved}
        override={override}
        anchorRef={wrapRef}
      />
    </span>
  );
}

// ── Recursive tree rendering ─────────────────────────────────────────────────

interface TreeBranchProps {
  node: TreeNode;
  /** Visible label for this branch (null at the synthetic root). */
  label: string | null;
  type: DTCGType;
  lookup: Map<string, DTCGToken>;
  onEdit: (path: string) => void;
  /** Nesting depth — used for indentation styling */
  level: number;
}

function TreeBranch({ node, label, type, lookup, onEdit, level }: TreeBranchProps) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.leaves.length > 0 || Object.keys(node.groups).length > 0;
  const compact = COMPACT_TYPES.has(type);
  // The synthetic root (level 0, no label) skips the indented body wrapper —
  // its children render flush so the first nesting level doesn't add an
  // unnecessary tree-line + indent step before any real group is shown.
  const isRoot = label === null;

  return (
    <div className="tree-branch" data-level={level}>
      {label !== null && (
        <button
          type="button"
          className="tree-branch__heading"
          onClick={() => setOpen((v) => !v)}
        >
          <Caret open={open} size={8} />
          <span className="tree-branch__label">{label}</span>
        </button>
      )}

      {open && hasChildren && (
        <div className={`tree-branch__body${isRoot ? ' tree-branch__body--root' : ''}`}>
          {node.leaves.length > 0 && (
            compact ? (
              // Compact row — swatches or pills laid out horizontally
              <div className="leaf-row">
                {node.leaves.map((leaf) => {
                  const resolved = resolveAlias(leaf.token.$value, lookup);
                  if (type === 'color') {
                    return <ColorSwatch key={leaf.path} leaf={leaf} resolved={resolved} onEdit={onEdit} />;
                  }
                  return <TextPill key={leaf.path} leaf={leaf} resolved={resolved} onEdit={onEdit} />;
                })}
              </div>
            ) : (
              // Composite types — keep the existing TokenRow layout
              <ul className="composite-list">
                {node.leaves.map((leaf) => (
                  <TokenRow key={leaf.path} path={leaf.path} token={leaf.token} onEdit={onEdit} />
                ))}
              </ul>
            )
          )}

          {Object.entries(node.groups).map(([key, child]) => (
            <TreeBranch
              key={key}
              node={child}
              label={key}
              type={type}
              lookup={lookup}
              onEdit={onEdit}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Top-level $type section ──────────────────────────────────────────────────

interface TreeSectionProps {
  type: DTCGType;
  tree: TreeNode;
  lookup: Map<string, DTCGToken>;
  onEdit: (path: string) => void;
  onAddOfType: (type: DTCGType) => void;
}

/**
 * One $type bucket — bold header with caret, `+` button, and the tree of
 * groups underneath. Holds its own open/closed state so collapsing one
 * section doesn't disturb others.
 */
function TreeSection({ type, tree, lookup, onEdit, onAddOfType }: TreeSectionProps) {
  const [open, setOpen] = useState(true);
  const label = TYPE_LABELS[type] ?? type;

  return (
    <section className="tree-section">
      <header className="tree-section__header">
        <button
          type="button"
          className="tree-section__toggle"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={`${open ? 'Collapse' : 'Expand'} ${label}`}
        >
          <Caret open={open} size={9} />
          <h3 className="tree-section__title">{label}</h3>
        </button>
        <button
          type="button"
          className="tree-section__add"
          onClick={() => onAddOfType(type)}
          aria-label={`Add ${label} token`}
          title={`Add ${label} token`}
        >
          +
        </button>
      </header>
      {open && (
        <TreeBranch
          node={tree}
          label={null}
          type={type}
          lookup={lookup}
          onEdit={onEdit}
          level={0}
        />
      )}
    </section>
  );
}

// ── Top-level component ──────────────────────────────────────────────────────

interface TokenTreeViewProps {
  activeSet: TokenSet;
  /**
   * Optional map of every loaded set, used ONLY to extend the alias-resolution
   * lookup so references like `{color.green.500}` can resolve when the target
   * lives in a different set than the active one (e.g. a brand alias in
   * `core/color.brand` pointing at a primitive in `core/color.primitive`).
   *
   * Active-set tokens win on path collision, so what's displayed remains
   * exactly the active set's contents — only the resolved values shown in
   * tooltips and tenant-override badges change.
   */
  allSets?: Record<string, TokenSet>;
  onEdit: (path: string) => void;
  onAddOfType: (type: DTCGType) => void;
}

export function TokenTreeView({ activeSet, allSets, onEdit, onAddOfType }: TokenTreeViewProps) {
  // Flatten once so we can both group-by-type AND build a same-set lookup
  // for alias resolution. Both consumers iterate on different shapes of the
  // same data, so memoising the flat list saves rebuilding it per-section.
  const { byType, lookup } = useMemo(() => {
    const flat = treeToFlatTokens(activeSet.tree);
    const byTypeMap = new Map<DTCGType, FlatToken[]>();
    const lookupMap = new Map<string, DTCGToken>();
    for (const item of flat) {
      lookupMap.set(item.path, item.token);
      const t = item.token.$type;
      if (!byTypeMap.has(t)) byTypeMap.set(t, []);
      byTypeMap.get(t)!.push(item);
    }

    // Cross-set lookup extension. We iterate every other loaded set and
    // graft its leaves into the lookup map ONLY when the path isn't already
    // claimed by the active set. This is what makes aliases like
    //   color.brand.primary.500  →  {color.green.500}
    // resolve to a real hex when `color.green.500` lives in a sibling set.
    // The active set still owns rendering — `byTypeMap` is built solely from
    // its flat list above — so this can't introduce extra rows.
    if (allSets) {
      for (const setId of Object.keys(allSets)) {
        const s = allSets[setId];
        if (!s || s === activeSet) continue;
        for (const item of treeToFlatTokens(s.tree)) {
          if (!lookupMap.has(item.path)) {
            lookupMap.set(item.path, item.token);
          }
        }
      }
    }

    // Stable alpha-with-numeric order inside each type bucket. The
    // `numeric: true` option makes "50" sort before "100" instead of after
    // "400" — without it, color ramp keys would land in lexicographic order
    // (100, 200, 300, 400, 50, 500, …) and the lightest shade ends up in the
    // middle of the row instead of at the start.
    for (const items of byTypeMap.values()) {
      items.sort((a, b) =>
        a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: 'base' }),
      );
    }
    return { byType: byTypeMap, lookup: lookupMap };
  }, [activeSet, allSets]);

  // Render TYPE_ORDER first, then any types not in the order list (forward-compat)
  const knownTypes = TYPE_ORDER.filter((t) => byType.has(t));
  const extraTypes = Array.from(byType.keys()).filter((t) => !TYPE_ORDER.includes(t));
  const orderedTypes = [...knownTypes, ...extraTypes];

  if (orderedTypes.length === 0) {
    return (
      <div className="tree-view tree-view--empty">
        <p className="tree-view__empty-hint">This set has no tokens yet.</p>
      </div>
    );
  }

  return (
    <div className="tree-view">
      {orderedTypes.map((type) => {
        const tree = buildTree(byType.get(type)!);
        return (
          <TreeSection
            key={type}
            type={type}
            tree={tree}
            lookup={lookup}
            onEdit={onEdit}
            onAddOfType={onAddOfType}
          />
        );
      })}
    </div>
  );
}
