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
 *   - Optional "Toggle all" button that flips every leaf in the tree
 *
 * Indeterminate state is computed during render (not stored) so the
 * caller never needs to track it — the source of truth is purely the
 * checked-leaf-ids set.
 */

import React from 'react';

export interface TreeNode {
  /** Stable id — used as React key and as entry in the value set. */
  id: string;
  label: string;
  /** Optional secondary count badge, e.g. "(12)" for a mode's variable count. */
  count?: number;
  /** Leaves omit this; non-leaf nodes always provide at least one child. */
  children?: TreeNode[];
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
 *   - 'empty'         — no descendant leaves are checked
 *   - 'partial'       — some descendants checked
 *   - 'full'          — every descendant is checked
 *
 * Returns 'empty' on a leaf-with-no-descendants only when it isn't in
 * value; the leaf renderer doesn't actually look at this — it reads the
 * Set directly. This function is only used for non-leaf rows.
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

  return (
    <div className="checkbox-tree">
      {showToggleAll && allIds.length > 0 && (
        <button
          type="button"
          className="checkbox-tree__toggle-all"
          onClick={handleToggleAll}
        >
          {allChecked ? 'Clear all' : 'Toggle all'}
        </button>
      )}
      {nodes.length === 0 ? (
        <div className="checkbox-tree__empty">No items.</div>
      ) : (
        <ul className="checkbox-tree__list">
          {nodes.map((n) => (
            <TreeRow
              key={n.id}
              node={n}
              depth={0}
              value={value}
              onToggleLeaves={toggleLeaves}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Internal row component ────────────────────────────────────────────────

interface TreeRowProps {
  node: TreeNode;
  depth: number;
  value: Set<string>;
  onToggleLeaves: (ids: string[], force?: boolean) => void;
}

function TreeRow({ node, depth, value, onToggleLeaves }: TreeRowProps) {
  const isLeaf = !node.children || node.children.length === 0;
  const state: NodeState | 'leaf' = isLeaf
    ? value.has(node.id)
      ? 'full'
      : 'empty'
    : nodeState(node, value);

  // Map state → BEM modifier for the box visual.
  const boxMod =
    state === 'full'
      ? 'checkbox-tree__checkbox--checked'
      : state === 'partial'
        ? 'checkbox-tree__checkbox--indeterminate'
        : '';

  // Indent classes — capped at 2 levels because the import tree never
  // goes deeper than `root → collection → mode`.
  const rowMod =
    depth === 0
      ? ''
      : depth === 1
        ? 'checkbox-tree__row--child'
        : 'checkbox-tree__row--grandchild';

  function handleClick() {
    if (isLeaf) {
      onToggleLeaves([node.id]);
    } else {
      const leaves = collectLeaves(node, []);
      // Cascade: if any descendant is unchecked, force-check the lot;
      // otherwise force-uncheck. Mirrors typical OS file-tree behaviour.
      const allChecked = leaves.every((id) => value.has(id));
      onToggleLeaves(leaves, !allChecked);
    }
  }

  return (
    <li>
      <button
        type="button"
        className={`checkbox-tree__row ${rowMod}`}
        onClick={handleClick}
        aria-checked={state === 'full' ? true : state === 'partial' ? 'mixed' : false}
        role="checkbox"
      >
        <span
          className={`checkbox-tree__checkbox ${boxMod}`}
          aria-hidden
        />
        <span className="checkbox-tree__label">{node.label}</span>
        {node.count !== undefined && (
          <span className="checkbox-tree__count">({node.count})</span>
        )}
      </button>
      {!isLeaf && (
        <ul className="checkbox-tree__list">
          {node.children!.map((c) => (
            <TreeRow
              key={c.id}
              node={c}
              depth={depth + 1}
              value={value}
              onToggleLeaves={onToggleLeaves}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
