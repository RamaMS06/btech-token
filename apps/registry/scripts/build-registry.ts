/**
 * build-registry.ts
 *
 * Reads component.meta.yaml + source files from packages/ui/{vue,react,flutter}/
 * and emits:
 *   apps/registry/public/r/{framework}/{component}.json   ← per-component manifest
 *   apps/registry/public/r/registry.{framework}.json      ← index
 *
 * Run: pnpm --filter @btech/registry build
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import yaml from 'js-yaml';
import { glob } from 'glob';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..', '..');
const OUT_DIR = join(__dirname, '..', 'public', 'r');

// ── Types ──────────────────────────────────────────────────────────────────

interface MetaYaml {
  schemaVersion: number;
  name: string;
  category: 'atoms' | 'molecules' | 'organisms' | 'patterns';
  figmaNodeId?: string;
  figmaUrl?: string;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[];
}

interface RegistryFile {
  path: string;
  target: string;
  type: 'registry:ui';
  content: string;
}

interface RegistryItem {
  $schema: string;
  name: string;
  type: 'registry:ui';
  title: string;
  description: string;
  framework: 'vue' | 'react' | 'flutter';
  category: string;
  figmaUrl?: string;
  figmaNodeId?: string;
  dependencies: string[];
  devDependencies: string[];
  registryDependencies: string[];
  files: RegistryFile[];
}

interface RegistryIndexItem {
  name: string;
  type: 'registry:ui';
  category: string;
  title: string;
  description: string;
  url: string;
}

// ── Framework configurations ────────────────────────────────────────────────

const FRAMEWORKS = [
  {
    id: 'vue' as const,
    srcRoot: join(ROOT, 'packages', 'ui', 'vue', 'src', 'components'),
    fileExts: ['.vue', '.ts', '.css'],
    // Map category/ComponentName → target alias
    targetPrefix: '@ui',
  },
  {
    id: 'react' as const,
    srcRoot: join(ROOT, 'packages', 'ui', 'react', 'src', 'components'),
    fileExts: ['.tsx', '.ts', '.css'],
    targetPrefix: '@ui',
  },
  {
    id: 'flutter' as const,
    srcRoot: join(ROOT, 'packages', 'ui', 'flutter', 'lib', 'src', 'components'),
    fileExts: ['.dart'],
    targetPrefix: '@flutterBase',
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/^BT-?/, '') // strip BT prefix
    .toLowerCase();
}

function readMeta(metaPath: string): MetaYaml | null {
  try {
    const raw = readFileSync(metaPath, 'utf-8');
    return yaml.load(raw) as MetaYaml;
  } catch {
    return null;
  }
}

function collectFiles(
  componentDir: string,
  exts: string[],
  targetPrefix: string,
  componentSlug: string,
  category: string,
): RegistryFile[] {
  const files: RegistryFile[] = [];

  function walk(dir: string): void {
    for (const entry of readdirSync(dir)) {
      if (entry === 'component.meta.yaml') continue;
      if (entry === 'index.ts') continue; // barrel — consumers write their own

      const full = join(dir, entry);
      const stat = statSync(full);

      if (stat.isDirectory()) {
        walk(full);
      } else if (exts.includes(extname(entry))) {
        const relPath = relative(componentDir, full).replace(/\\/g, '/');

        // Build target path: @ui/Button/BTButton.vue  OR  @flutterBase/button/button.widget.dart
        const target = `${targetPrefix}/${
          targetPrefix === '@flutterBase' ? `${componentSlug}/${relPath}` : relPath
        }`;

        files.push({
          path: relPath,
          target,
          type: 'registry:ui',
          content: readFileSync(full, 'utf-8'),
        });
      }
    }
  }

  walk(componentDir);
  return files;
}

// ── Main build ──────────────────────────────────────────────────────────────

async function build(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });

  let total = 0;

  for (const fw of FRAMEWORKS) {
    mkdirSync(join(OUT_DIR, fw.id), { recursive: true });

    const indexItems: RegistryIndexItem[] = [];

    // Find all component.meta.yaml inside this framework's src root
    const metaPaths = await glob('**/component.meta.yaml', {
      cwd: fw.srcRoot,
      absolute: true,
    });

    for (const metaPath of metaPaths) {
      const meta = readMeta(metaPath);
      if (!meta) continue;

      const componentDir = dirname(metaPath);
      const slug = kebabCase(meta.name);

      const files = collectFiles(
        componentDir,
        fw.fileExts,
        fw.targetPrefix,
        slug,
        meta.category,
      );

      if (files.length === 0) {
        console.warn(`  ⚠  No files found for ${meta.name} (${fw.id})`);
        continue;
      }

      const item: RegistryItem = {
        $schema: 'https://ramaMS06.github.io/btech-token/schema/registry-item.json',
        name: slug,
        type: 'registry:ui',
        title: meta.name,
        description: (meta.description ?? '').trim(),
        framework: fw.id,
        category: meta.category,
        figmaUrl: meta.figmaUrl,
        figmaNodeId: meta.figmaNodeId,
        dependencies: meta.dependencies ?? (fw.id !== 'flutter' ? ['@btech/tokens'] : []),
        devDependencies: [],
        registryDependencies: meta.registryDependencies ?? [],
        files,
      };

      const outPath = join(OUT_DIR, fw.id, `${slug}.json`);
      writeFileSync(outPath, JSON.stringify(item, null, 2), 'utf-8');

      indexItems.push({
        name: slug,
        type: 'registry:ui',
        category: meta.category,
        title: meta.name,
        description: item.description,
        url: `/r/${fw.id}/${slug}.json`,
      });

      console.log(`  ✓ ${fw.id}/${slug}`);
      total++;
    }

    // Sort index by category then name
    indexItems.sort((a, b) =>
      a.category !== b.category
        ? a.category.localeCompare(b.category)
        : a.name.localeCompare(b.name),
    );

    const indexPath = join(OUT_DIR, `registry.${fw.id}.json`);
    writeFileSync(
      indexPath,
      JSON.stringify(
        {
          $schema: 'https://ramaMS06.github.io/btech-token/schema/registry.json',
          framework: fw.id,
          version: '0.1.0',
          items: indexItems,
        },
        null,
        2,
      ),
      'utf-8',
    );

    console.log(`\n  → registry.${fw.id}.json (${indexItems.length} components)`);
  }

  console.log(`\n  ✓ Registry built — ${total} component manifests written to ${OUT_DIR}\n`);
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
