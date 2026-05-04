/**
 * @btech/ui-react — React component library for the BTech Design System.
 *
 * Components are sliced from Figma frames (see docs/architecture/
 * ui-slicing-pipeline.md) and consume tokens from @btech/tokens. Import
 * the global stylesheet once at the application root:
 *
 *   import '@btech/ui-react/styles.css';
 */
export * from './components/Avatar/index.js';

// Side-effect import so consumers get bundled component CSS automatically
// when bundlers resolve the entry. The published `styles.css` aggregate is
// produced by `tsup` from these per-component imports.
import './components/Avatar/Avatar.css';
