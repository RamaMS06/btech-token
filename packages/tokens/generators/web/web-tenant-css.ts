import { readFileSync, readdirSync, existsSync, appendFileSync } from 'fs';
import { ROOT, flattenDTCG, resolveRef, pathToCssVarStem } from '../utils.js';

/** Append [data-tenant="*"] CSS override blocks to dist/styles.css. */
export function appendTenantCSS(baseMap: Record<string, string>): void {
  const tenantsDir = `${ROOT}/sources/tenants`;
  const tenantIds = readdirSync(tenantsDir)
    .filter(d => d !== 'default' && existsSync(`${tenantsDir}/${d}/overrides.json`))
    .sort();

  const cssOutPath = `${ROOT}/platforms/web/dist/styles.css`;
  const blocks: string[] = [
    '',
    '/* Tenant overrides — auto-generated from sources/tenants/{id}/overrides.json */',
  ];

  for (const tenantId of tenantIds) {
    const overrides = flattenDTCG(
      JSON.parse(readFileSync(`${tenantsDir}/${tenantId}/overrides.json`, 'utf-8'))
    );
    if (Object.keys(overrides).length === 0) continue;

    blocks.push('');
    blocks.push(`[data-tenant="${tenantId}"] {`);
    for (const [tokenPath, rawVal] of Object.entries(overrides)) {
      const resolved = resolveRef(rawVal, baseMap);
      const cleanPath = tokenPath.replace(/\.default$/, '');
      const stem = pathToCssVarStem(cleanPath.split('.')).replace(/([A-Z])/g, m => `-${m.toLowerCase()}`);
      const cssVar = `--${stem}`;
      blocks.push(`  ${cssVar}: ${resolved};`);
    }
    blocks.push('}');
  }

  appendFileSync(cssOutPath, blocks.join('\n') + '\n');
  console.log(`  Appended ${tenantIds.length} tenant CSS override blocks to styles.css`);
}
