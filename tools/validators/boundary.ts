/**
 * Tenant override boundary validator
 * Enforces the matrix from Slide 4 of the pitch deck.
 * Fails CI if a tenant override touches a forbidden token path.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { resolve, join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const TENANTS_DIR = resolve(ROOT, 'tokens/tenants');

// Paths prefixes tenants ARE allowed to override
const ALLOWED_PREFIXES: string[] = [
  'color.primary',
  'color.secondary',
  'color.danger',
  'color.success',
  'color.warning',
  'radius.interactive',
  'radius.card',
  'radius.badge',
  'radius.tooltip',
  'typography.fontFamily',
];

// Paths tenants must NEVER override (takes precedence over allowed list)
const FORBIDDEN_PREFIXES: string[] = [
  'color.blue',
  'color.green',
  'color.orange',
  'color.red',
  'color.neutral',
  'spacing',
  'typography.fontSize',
  'typography.fontWeight',
  'typography.lineHeight',
  'typography.scale',
  'motion',
  'zIndex',
  'shadow',
];

function flattenPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  const paths: string[] = [];
  for (const [key, val] of Object.entries(obj)) {
    if (key.startsWith('$')) continue;
    const current = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === 'object' && !('$value' in val)) {
      paths.push(...flattenPaths(val as Record<string, unknown>, current));
    } else {
      paths.push(current);
    }
  }
  return paths;
}

function isAllowed(path: string): boolean {
  if (FORBIDDEN_PREFIXES.some(p => path === p || path.startsWith(p + '.'))) {
    return false;
  }
  return ALLOWED_PREFIXES.some(p => path === p || path.startsWith(p + '.'));
}

let hasFailures = false;

console.log('\n🔍 Tenant override boundary validation\n');

const tenants = readdirSync(TENANTS_DIR).filter(t => t !== 'default');

for (const tenant of tenants) {
  const overridePath = join(TENANTS_DIR, tenant, 'overrides.json');
  if (!existsSync(overridePath)) continue;

  const overrides = JSON.parse(readFileSync(overridePath, 'utf-8'));
  const paths = flattenPaths(overrides);

  let tenantFailed = false;
  for (const path of paths) {
    if (!isAllowed(path)) {
      console.error(`  ❌ [${tenant}] Forbidden override: "${path}"`);
      tenantFailed = true;
      hasFailures = true;
    }
  }

  if (!tenantFailed) {
    console.log(`  ✅ [${tenant}] All overrides are within allowed boundaries`);
  }
}

console.log('');

if (hasFailures) {
  console.error('❌ Boundary validation failed. See forbidden overrides above.\n');
  process.exit(1);
} else {
  console.log('✅ All tenant overrides pass boundary checks.\n');
}
