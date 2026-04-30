/**
 * CheckboxTree — generic nested checkbox list with cascade selection
 * --------------------------------------------------------------------
 * Built for the ImportStylesModal where the designer picks which Figma
 * Variable collections / modes / Styles to import. The component is
 * intentionally generic — the tree shape is just an array of `Node`
 * descriptors, and the value is a flat `Set<string>` of leaf ids.
 *
 * Behaviour:
 *   - Click a leaf → toggle that single leaf
 *   - Click a parent → toggle every descendant leaf as a group (if any
 *     descendants are unchecked, parent click checks them all; otherwise
 *     parent click unchecks them all)
 *   - Parent visual state has three values: empty, indeterminate (some
 *     descendants checked), or fully checked (all descendants checked)
 *   - "Toggle all" button that flips every leaf in the tree
 *   - Expand button (⤢/⤡) that toggles the scroll area between compact
 *     (240 px) and expanded (fills the modal) — so designers can see a
 *     long list without squinting.
 *
 * Visual style:
 *   Tree-line connectors (vertical guide + horizontal stubs) via CSS on the
 *   child `<ul>` and `<li>` elements — mirrors the token tree view. Depth
 *   indentation is produced entirely by `margin-left` on child lists, so the
 *   border-left aligns naturally with the parent checkbox centre at every
 *   nesting level.
 *
 * Status badges:
 *   Leaf nodes may carry `status: 'new' | 'changed'` which renders a small
 *   pill badge. Same-value tokens are pre-filtered by the caller (they are
 *   never passed as nodes at all).
 */

import React, { useState } from 'react';

export interface TreeNode {
  /** Stable id — used as React key and as entry in the value set. */
  id: string;
  label: string;
  /** Optional secondary count badge, e.g. "(12)" for a mode's variable count. */
  count?: number;
  /** Leaves omit this; non-leaf nodes always provide at least one child. */
  children?: TreeNode[];
  /**
   * Diff status for leaf nodes. When set, a small pill badge is rendered
   * beside the label. Parents do not carry a status — their count badge
   * already signals it.
   */
  status?: 'new' | 'changed';
}

interface CheckboxTreeProps {
  nodes: TreeNode[];
  /** Set of *leaf* ids that are currently checked. */
  value: Set<string>;
  onChange: (next: Set<string>) => void;
  /** Render a "Toggle all" header above the tree. Defaults to true. */
  showToggleAll?: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/** Walk a node and collect every descendant leaf id (the node itself if leaf). */
function collectLeaves(node: TreeNode, out: string[] = []): string[] {
  if (!node.children || node.children.length === 0) {
    out.push(node.id);
    return out;
  }
  for (const c of node.children) collectLeaves(c, out);
  return out;
}

/** All leaf ids across the whole tree — used by Toggle all. */
function allLeafIds(nodes: TreeNode[]): string[] {
  const out: string[] = [];
  for (const n of nodes) collectLeaves(n, out);
  return out;
}

/**
 * Three-state classification for a node:
 *   - 'empty'   — no descendant leaves are checked
 *   - 'partial' — some descendants checked
 *   - 'full'    — every descendant is checked
 */
type NodeState = 'empty' | 'partial' | 'full';
function nodeState(node: TreeNode, value: Set<string>): NodeState {
  const leaves = collectLeaves(node, []);
  if (leaves.length === 0) return 'empty';
  let checked = 0;
  for (const id of leaves) if (value.has(id)) checked++;
  if (checked === 0) return 'empty';
  if (checked === leaves.length) return 'full';
  return 'partial';
}

// ── Component ──────────────────────────────────────────────────────────────

export function CheckboxTree({
  nodes,
  value,
  onChange,
  showToggleAll = true,
}: CheckboxTreeProps) {
  const allIds = allLeafIds(nodes);
  const allChecked = allIds.length > 0 && allIds.every((id) => value.has(id));
  const [expanded, setExpanded] = useState(false);

  function toggleLeaves(ids: string[], force?: boolean) {
    const next = new Set(value);
    const shouldCheck =
      force !== undefined ? force : !ids.every((id) => next.has(id));
    if (shouldCheck) {
      for (const id of ids) next.add(id);
    } else {
      for (const id of ids) next.delete(id);
    }
    onChange(next);
  }

  function handleToggleAll() {
    toggleLeaves(allIds, !allChecked);
  }

  const showHeader = showToggleAll && allIds.length > 0;

  return (
    <div className="checkbox-tree">
      {/* ── Header: Toggle all (left) + Expand icon (right) ── */}
      {showHeader && (
        <div className="checkbox-tree__header">
          <button
            type="button"
            className="checkbox-tree__toggle-all"
            onClick={handleToggleAll}
          >
            {allChecked ? 'Clear all' : 'Toggle all'}
          </button>
          <button
            type="button"
            className="checkbox-tree__expand-btn"
            onClick={() => setExpanded((v) => !v)}
            title={expanded ? 'Collapse list' : 'Expand list'}
            aria-label={expanded ? 'Collapse list' : 'Expand list'}
          >
            {/* Simple expand/collapse glyphs — ↕ for compact, ↔ for expanded */}
            {expanded ? '⊟' : '⊞'}
          </button>
        </div>
      )}

      {/* ── Scrollable tree area ── */}
      <div
        className={
          'checkbox-tree__scroll-area' +
          (expanded ? ' checkbox-tree__scroll-area--expanded' : '')
        }
      >
        {nodes.length === 0 ? (
          <div className="checkbox-tree__empty">No items.</div>
        ) : (
          <ul className="checkbox-tree__list checkbox-tree__list--root">
            {nodes.map((n) => (
              <TreeRow
                key={n.id}
                node={n}
                value={value}
                onToggleLeaves={toggleLeaves}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Internal row component ────────────────────────────────────────────────

interface TreeRowProps {
  node: TreeNode;
  value: Set<string>;
  onToggleLeaves: (ids: string[], force?: boolean) => void;
}

function TreeRow({ node, value, onToggleLeaves }: TreeRowProps) {
  const isLeaf = !node.children || node.children.length === 0;
  const state: NodeState | 'leaf' = isLeaf
    ? value.has(node.id)
      ? 'full'
      : 'empty'
    : nodeState(node, value);

  // Map state → BEM modifier for the checkbox box visual.
  const boxMod =
    state === 'full'
      ? 'checkbox-tree__checkbox--checked'
      : state === 'partial'
        ? 'checkbox-tree__checkbox--indeterminate'
        : '';

  function handleClick() {
    if (isLeaf) {
      onToggleLeaves([node.id]);
    } else {
      const leaves = collectLeaves(node, []);
      const allChecked = leaves.every((id) => value.has(id));
      onToggleLeaves(leaves, !allChecked);
    }
  }

  return (
    <li className="checkbox-tree__item">
      <button
        type="button"
        className="checkbox-tree__row"
        onClick={handleClick}
        aria-checked={state === 'full' ? true : state === 'partial' ? 'mixed' : false}
        role="checkbox"
      >
        <span
          className={`checkbox-tree__checkbox ${boxMod}`}
          aria-hidden
        />
        <span className="checkbox-tree__label">{node.label}</span>
        {/* Status badge — only on leaves, sits adjacent to label */}
        {isLeaf && node.status && (
          <span
            className={`checkbox-tree__status-badge checkbox-tree__status-badge--${node.status}`}
            aria-label={node.status === 'new' ? 'New token' : 'Value changed'}
          >
            {node.status === 'new' ? 'new' : 'changed'}
          </span>
        )}
        {node.count !== undefined && (
          <span className="checkbox-tree__count">({node.count})</span>
        )}
      </button>
      {!isLeaf && (
        <ul className="checkbox-tree__list checkbox-tree__list--children">
          {node.children!.map((c) => (
            <TreeRow
              key={c.id}
              node={c}
              value={value}
              onToggleLeaves={onToggleLeaves}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
