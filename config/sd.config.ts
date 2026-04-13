import StyleDictionary from 'style-dictionary';
import { resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');

/**
 * Style Dictionary v4 config.
 * Reads the 3-tier token structure and outputs:
 *   - CSS custom properties  → packages/tokens-web/dist/styles.css
 *   - TypeScript objects     → packages/tokens-react/src/generated.ts
 *                           → packages/tokens-vue/src/generated.ts
 */
const sd = new StyleDictionary({
  source: [
    `${ROOT}/tokens/base/**/*.json`,
    `${ROOT}/tokens/semantic/**/*.json`,
    `${ROOT}/tokens/components/**/*.json`,
  ],

  platforms: {
    css: {
      transformGroup: 'css',
      prefix: 'ds',
      buildPath: `${ROOT}/packages/tokens-web/dist/`,
      files: [
        {
          destination: 'styles.css',
          format: 'css/variables',
          options: {
            outputReferences: true,
            selector: ':root',
          },
        },
      ],
    },

    'ts-react': {
      transformGroup: 'js',
      buildPath: `${ROOT}/packages/tokens-react/src/`,
      files: [
        {
          destination: 'generated.ts',
          format: 'javascript/es6',
          options: { outputReferences: false },
        },
      ],
    },

    'ts-vue': {
      transformGroup: 'js',
      buildPath: `${ROOT}/packages/tokens-vue/src/`,
      files: [
        {
          destination: 'generated.ts',
          format: 'javascript/es6',
          options: { outputReferences: false },
        },
      ],
    },
  },
});

await sd.buildAllPlatforms();
console.log('\n✅ Style Dictionary build complete.\n');
