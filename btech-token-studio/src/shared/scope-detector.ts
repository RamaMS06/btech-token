/**
 * Scope detector — path-based PR label inference
 * ------------------------------------------------
 * Reproduces the label-priority logic from pipelines/auto-version.yml
 * (lines 95-106) so that push commits from the plugin get the same
 * scope:* tag as a manually crafted PR would receive.
 *
 * Priority order (highest wins):
 *   scope:all       → changes span base files AND multiple tenants, or mixed
 *   scope:tenants   → changes span multiple tenants (no base)
 *   scope:tenant:<id> → changes in exactly one tenant (no base)
 *   scope:base      → changes only in non-tenant source files
 *
 * "Base files" = anything under packages/tokens/sources/ that is NOT under
 * a tenants/<id>/ subdirectory.
 *
 * This function is pure — no I/O, testable in Node without any Figma shim.
 */

const SOURCES_ROOT = 'packages/tokens/sources/';
const TENANTS_PREFIX = `${SOURCES_ROOT}tenants/`;

/** Result returned to the caller for label attachment and PR description */
export interface ScopeResult {
  /** The scope label to attach, e.g. "scope:tenant:bspace" */
  tag: string;
  /** Detected tenant IDs — empty when scope is base-only */
  tenants: string[];
}

/**
 * Determine the scope tag from the list of changed file paths.
 *
 * @param changedFilePaths - Repo-relative paths of files being pushed
 *   (from the TokenSet.path values of dirty sets)
 */
export function detectScope(changedFilePaths: string[]): ScopeResult {
  // Only files under packages/tokens/sources/ are relevant for scoping.
  // Plugin pushes should only touch these files, but we filter defensively.
  const relevant = changedFilePaths.filter((p) =>
    p.startsWith(SOURCES_ROOT),
  );

  let hasBaseChanges = false;
  const tenantIds = new Set<string>();

  for (const filePath of relevant) {
    if (filePath.startsWith(TENANTS_PREFIX)) {
      // Extract the tenant id — first segment after "tenants/"
      const afterTenants = filePath.slice(TENANTS_PREFIX.length);
      const tenantId = afterTenants.split('/')[0];
      if (tenantId) {
        tenantIds.add(tenantId);
      }
    } else {
      // Non-tenant file under sources/ counts as a base change
      hasBaseChanges = true;
    }
  }

  const tenants = Array.from(tenantIds).sort();

  // Priority rules mirror auto-version.yml:
  // 1. Any combination of base + tenant(s) → all
  // 2. Multiple tenants only → tenants
  // 3. Single tenant only → tenant:<id>
  // 4. Base only → base
  // 5. No relevant changes → base (safe default; shouldn't happen in normal use)
  if (hasBaseChanges && tenants.length > 0) {
    return { tag: 'scope:all', tenants };
  }

  if (!hasBaseChanges && tenants.length > 1) {
    return { tag: 'scope:tenants', tenants };
  }

  if (!hasBaseChanges && tenants.length === 1) {
    return { tag: `scope:tenant:${tenants[0]}`, tenants };
  }

  // hasBaseChanges && tenants.length === 0, or nothing matched
  return { tag: 'scope:base', tenants: [] };
}
