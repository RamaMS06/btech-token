/**
 * @btech/ui-react — React component library for the BTech Design System.
 *
 * Components are sliced from Figma frames (see docs/architecture/
 * generation-flow.md) and consume tokens from @btech/tokens. Import
 * the global stylesheet once at the application root:
 *
 *   import '@btech/ui-react/styles.css';
 *
 * Component organization mirrors @btech/ui-vue atomic-design layers
 * (atoms → molecules → organisms → patterns). React components are
 * GENERATED via tools/vue-to-react/ converter from Vue SFCs — see
 * docs/architecture/component-conventions/react.md.
 */
export * from './components/atoms/Badge/index.js';
export * from './components/atoms/Button/index.js';
export * from './components/atoms/ButtonLink/index.js';
export * from './components/atoms/Checkbox/index.js';
export * from './components/atoms/Hint/index.js';
export * from './components/atoms/Separator/index.js';
export * from './components/molecules/Avatar/index.js';
export * from './components/organisms/AvatarGroup/index.js';

// Side-effect imports — bundler aggregates into styles.css
import './components/atoms/Badge/BTBadge.css';
import './components/atoms/Button/BTButton.css';
import './components/atoms/ButtonLink/BTButtonLink.css';
import './components/atoms/Checkbox/BTCheckbox.css';
import './components/atoms/Hint/BTHint.css';
import './components/atoms/Separator/BTSeparator.css';
import './components/molecules/Avatar/BTAvatar.css';
