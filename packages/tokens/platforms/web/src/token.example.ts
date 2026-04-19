/**
 * BTech Design Token — Usage Examples
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * PREREQUISITES
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * 1. Install the package
 *    pnpm add @btech/tokens
 *
 * 2. Import the CSS (once, at your app entry point — e.g. main.ts / App.tsx)
 *    import '@btech/tokens/styles.css';      ← required: defines --btech-* vars
 *    import '@btech/tokens/utilities.css';   ← optional: bg-*, mt-*, rounded-* classes
 *
 * 3. Activate a tenant (optional — defaults to base theme if skipped)
 *    import { activateTenant } from '@btech/tokens';
 *    activateTenant({ tenant: 'tenant-bjb' });       ← sets data-tenant on <html>
 *
 * 4. Import token() wherever you need it in TypeScript / JS
 *    import { token, cssVar, tokenCalc } from '@btech/tokens';
 *
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * MENTAL MODEL
 *
 *   styles.css    → :root { --btech-color-background-primary: #16a34a; }
 *   token()       → returns "var(--btech-color-background-primary)"   ← identical
 *   .bg-primary   → background: var(--btech-color-background-primary) ← identical
 *
 * All three point to the same CSS custom property.
 * Tenant switching rewrites the :root values — all three update automatically.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { token, cssVar, tokenCalc } from '@btech/tokens';


// =============================================================================
// 1. COLOR — background
// =============================================================================

// Via var() in CSS / SCSS:
//   .card { background: var(--btech-color-background-surface); }
//   .btn  { background: var(--btech-color-background-primary); }
//   .btn:hover { background: var(--btech-color-background-primary-hover); }

// Via token() in TypeScript / CSS-in-JS:
token('color.background.surface');             // → var(--btech-color-background-surface)
token('color.background.surface.subtle');      // → var(--btech-color-background-surface-subtle)
token('color.background.surface.raised');      // → var(--btech-color-background-surface-raised)

token('color.background.primary');             // → var(--btech-color-background-primary)
token('color.background.primary.hover');       // → var(--btech-color-background-primary-hover)
token('color.background.primary.pressed');     // → var(--btech-color-background-primary-pressed)
token('color.background.primary.disable');     // → var(--btech-color-background-primary-disable)
token('color.background.primary.subtle');      // → var(--btech-color-background-primary-subtle)

token('color.background.secondary');           // → var(--btech-color-background-secondary)
token('color.background.secondary.hover');     // → var(--btech-color-background-secondary-hover)
token('color.background.secondary.pressed');   // → var(--btech-color-background-secondary-pressed)
token('color.background.secondary.disable');   // → var(--btech-color-background-secondary-disable)
token('color.background.secondary.subtle');    // → var(--btech-color-background-secondary-subtle)

token('color.background.danger');              // → var(--btech-color-background-danger)
token('color.background.danger.hover');        // → var(--btech-color-background-danger-hover)
token('color.background.danger.pressed');      // → var(--btech-color-background-danger-pressed)
token('color.background.danger.disable');      // → var(--btech-color-background-danger-disable)
token('color.background.danger.subtle');       // → var(--btech-color-background-danger-subtle)

token('color.background.success');             // → var(--btech-color-background-success)
token('color.background.success.subtle');      // → var(--btech-color-background-success-subtle)
token('color.background.warning');             // → var(--btech-color-background-warning)
token('color.background.warning.subtle');      // → var(--btech-color-background-warning-subtle)
token('color.background.info');                // → var(--btech-color-background-info)
token('color.background.info.subtle');         // → var(--btech-color-background-info-subtle)
token('color.background.neutral');             // → var(--btech-color-background-neutral)
token('color.background.neutral.subtle');      // → var(--btech-color-background-neutral-subtle)


// =============================================================================
// 2. COLOR — text
// =============================================================================

// Via var() in CSS:
//   p   { color: var(--btech-color-text-neutral); }
//   .muted { color: var(--btech-color-text-neutral-subtle); }

token('color.text.neutral');                   // → var(--btech-color-text-neutral)
token('color.text.neutral.subtle');            // → var(--btech-color-text-neutral-subtle)
token('color.text.neutral.disabled');          // → var(--btech-color-text-neutral-disabled)
token('color.text.neutral.inverse');           // → var(--btech-color-text-neutral-inverse)
token('color.text.on.primary');                // → var(--btech-color-text-on-primary)
token('color.text.on.secondary');              // → var(--btech-color-text-on-secondary)
token('color.text.on.danger');                 // → var(--btech-color-text-on-danger)
token('color.text.on.info');                   // → var(--btech-color-text-on-info)
token('color.text.danger.base');               // → var(--btech-color-text-danger-base)
token('color.text.danger.bolder');             // → var(--btech-color-text-danger-bolder)
token('color.text.success.base');              // → var(--btech-color-text-success-base)
token('color.text.warning.base');              // → var(--btech-color-text-warning-base)
token('color.text.info.base');                 // → var(--btech-color-text-info-base)
token('color.text.secondary.base');            // → var(--btech-color-text-secondary-base)


// =============================================================================
// 3. COLOR — icon (for SVG currentColor / icon font color)
// =============================================================================

// Via var() in CSS:
//   svg { color: var(--btech-color-icon-neutral); }

token('color.icon.neutral');                   // → var(--btech-color-icon-neutral)
token('color.icon.neutral.subtle');            // → var(--btech-color-icon-neutral-subtle)
token('color.icon.neutral.disabled');          // → var(--btech-color-icon-neutral-disabled)
token('color.icon.neutral.inverse');           // → var(--btech-color-icon-neutral-inverse)
token('color.icon.on.primary');                // → var(--btech-color-icon-on-primary)
token('color.icon.on.danger');                 // → var(--btech-color-icon-on-danger)
token('color.icon.danger.base');               // → var(--btech-color-icon-danger-base)
token('color.icon.success.base');              // → var(--btech-color-icon-success-base)
token('color.icon.warning.base');              // → var(--btech-color-icon-warning-base)
token('color.icon.info.base');                 // → var(--btech-color-icon-info-base)
token('color.icon.secondary.base');            // → var(--btech-color-icon-secondary-base)


// =============================================================================
// 4. COLOR — stroke / border
// =============================================================================

// Via var() in CSS:
//   .input { border: 1px solid var(--btech-color-stroke-neutral); }
//   .input:focus { border-color: var(--btech-color-stroke-primary); }
//   .input.error  { border-color: var(--btech-color-stroke-danger); }

token('color.stroke.neutral');                 // → var(--btech-color-stroke-neutral)
token('color.stroke.neutral.subtle');          // → var(--btech-color-stroke-neutral-subtle)
token('color.stroke.neutral.strong');          // → var(--btech-color-stroke-neutral-strong)
token('color.stroke.primary');                 // → var(--btech-color-stroke-primary)
token('color.stroke.primary.bolder');          // → var(--btech-color-stroke-primary-bolder)
token('color.stroke.danger');                  // → var(--btech-color-stroke-danger)
token('color.stroke.success');                 // → var(--btech-color-stroke-success)
token('color.stroke.warning');                 // → var(--btech-color-stroke-warning)
token('color.stroke.info');                    // → var(--btech-color-stroke-info)
token('color.stroke.secondary');               // → var(--btech-color-stroke-secondary)


// =============================================================================
// 5. SPACING
// =============================================================================

// Via var() in CSS:
//   .card { padding: var(--btech-spacing-md); gap: var(--btech-spacing-sm); }

// Via utility class (no JS needed):
//   <div class="px-md gap-sm">

// Via token() in CSS-in-JS:
token('spacing.xs');                           // → var(--btech-spacing-xs)     (4px)
token('spacing.sm');                           // → var(--btech-spacing-sm)     (8px)
token('spacing.md');                           // → var(--btech-spacing-md)     (16px)
token('spacing.lg');                           // → var(--btech-spacing-lg)     (24px)
token('spacing.xl');                           // → var(--btech-spacing-xl)     (32px)
token('spacing.xl2');                          // → var(--btech-spacing-xl2)    (48px)
token('spacing.xl3');                          // → var(--btech-spacing-xl3)    (64px)
token('spacing.xl4');                          // → var(--btech-spacing-xl4)    (80px)

// Compose with calc():
tokenCalc('spacing.md', '* 2');               // → calc(var(--btech-spacing-md) * 2)
tokenCalc('spacing.sm', '+ 4px');             // → calc(var(--btech-spacing-sm) + 4px)


// =============================================================================
// 6. RADIUS — border-radius
// =============================================================================

// Via var() in CSS:
//   .btn   { border-radius: var(--btech-radius-interactive); }
//   .card  { border-radius: var(--btech-radius-card); }
//   .badge { border-radius: var(--btech-radius-badge); }

// Via utility class:
//   <div class="rounded-interactive">  <div class="rounded-card">

token('radius.none');                          // → var(--btech-radius-none)     (0px)
token('radius.sm');                            // → var(--btech-radius-sm)       (2px)
token('radius.md');                            // → var(--btech-radius-md)       (8px)
token('radius.lg');                            // → var(--btech-radius-lg)       (14px)
token('radius.xl');                            // → var(--btech-radius-xl)
token('radius.full');                          // → var(--btech-radius-full)     (9999px)
token('radius.interactive');                   // → var(--btech-radius-interactive)  semantic alias → radius.md
token('radius.card');                          // → var(--btech-radius-card)         semantic alias → radius.lg
token('radius.badge');                         // → var(--btech-radius-badge)        semantic alias → radius.full
token('radius.tooltip');                       // → var(--btech-radius-tooltip)


// =============================================================================
// 7. TYPOGRAPHY — font family
// =============================================================================

// Via var() in CSS:
//   body { font-family: var(--btech-typography-font-family-sans); }

// Via utility class:
//   <code class="font-mono">

token('typography.fontFamily.sans');           // → var(--btech-typography-font-family-sans)
token('typography.fontFamily.mono');           // → var(--btech-typography-font-family-mono)


// =============================================================================
// 8. TYPOGRAPHY — font size
// =============================================================================

// Via var() in CSS:
//   .label { font-size: var(--btech-typography-font-size-sm); }

// Via utility class:
//   <span class="text-sm">

token('typography.fontSize.xs');               // → var(--btech-typography-font-size-xs)
token('typography.fontSize.sm');               // → var(--btech-typography-font-size-sm)
token('typography.fontSize.base');             // → var(--btech-typography-font-size-base)
token('typography.fontSize.lg');               // → var(--btech-typography-font-size-lg)
token('typography.fontSize.xl');               // → var(--btech-typography-font-size-xl)
token('typography.fontSize.2xl');              // → var(--btech-typography-font-size-2xl)
token('typography.fontSize.3xl');              // → var(--btech-typography-font-size-3xl)
token('typography.fontSize.4xl');              // → var(--btech-typography-font-size-4xl)


// =============================================================================
// 9. TYPOGRAPHY — font weight
// =============================================================================

// Via var() in CSS:
//   .btn { font-weight: var(--btech-typography-font-weight-semibold); }

// Via utility class:
//   <span class="font-weight-semibold">

token('typography.fontWeight.regular');        // → var(--btech-typography-font-weight-regular)   (400)
token('typography.fontWeight.medium');         // → var(--btech-typography-font-weight-medium)    (500)
token('typography.fontWeight.semibold');       // → var(--btech-typography-font-weight-semibold)  (600)
token('typography.fontWeight.bold');           // → var(--btech-typography-font-weight-bold)      (700)


// =============================================================================
// 10. TYPOGRAPHY — line height
// =============================================================================

// Via var() in CSS:
//   p { line-height: var(--btech-typography-line-height-normal); }

// Via utility class:
//   <p class="leading-normal">

token('typography.lineHeight.tight');          // → var(--btech-typography-line-height-tight)
token('typography.lineHeight.normal');         // → var(--btech-typography-line-height-normal)
token('typography.lineHeight.relaxed');        // → var(--btech-typography-line-height-relaxed)


// =============================================================================
// 11. SHADOW
// =============================================================================

// Via var() in CSS:
//   .card { box-shadow: var(--btech-shadow-md); }

token('shadow.none');                          // → var(--btech-shadow-none)
token('shadow.sm');                            // → var(--btech-shadow-sm)
token('shadow.md');                            // → var(--btech-shadow-md)
token('shadow.lg');                            // → var(--btech-shadow-lg)
token('shadow.xl');                            // → var(--btech-shadow-xl)


// =============================================================================
// 12. MOTION — duration + easing
// =============================================================================

// Via var() in CSS:
//   .btn { transition: background var(--btech-motion-duration-fast) var(--btech-motion-easing-ease); }

token('motion.duration.fast');                 // → var(--btech-motion-duration-fast)    (100ms)
token('motion.duration.normal');               // → var(--btech-motion-duration-normal)  (200ms)
token('motion.duration.slow');                 // → var(--btech-motion-duration-slow)    (400ms)
token('motion.easing.linear');                 // → var(--btech-motion-easing-linear)
token('motion.easing.ease');                   // → var(--btech-motion-easing-ease)
token('motion.easing.easeIn');                 // → var(--btech-motion-easing-ease-in)
token('motion.easing.easeOut');                // → var(--btech-motion-easing-ease-out)


// =============================================================================
// 13. Z-INDEX
// =============================================================================

// Via var() in CSS:
//   .modal   { z-index: var(--btech-z-index-modal); }
//   .tooltip { z-index: var(--btech-z-index-tooltip); }

token('zIndex.base');                          // → var(--btech-z-index-base)
token('zIndex.raised');                        // → var(--btech-z-index-raised)
token('zIndex.sticky');                        // → var(--btech-z-index-sticky)
token('zIndex.overlay');                       // → var(--btech-z-index-overlay)
token('zIndex.dropdown');                      // → var(--btech-z-index-dropdown)
token('zIndex.modal');                         // → var(--btech-z-index-modal)
token('zIndex.toast');                         // → var(--btech-z-index-toast)
token('zIndex.tooltip');                       // → var(--btech-z-index-tooltip)


// =============================================================================
// 14. ADVANCED — cssVar() + dynamic styling
// =============================================================================

// Get raw var name (no var() wrapper) — for setProperty, CSS-in-JS, etc.
cssVar('color.background.primary');            // → '--btech-color-background-primary'

// Dynamically override a token for one element (e.g. custom-branded widget):
const el = document.querySelector('.widget') as HTMLElement;
el?.style.setProperty(cssVar('color.background.primary'), '#0057b7');

// Read the current resolved value at runtime:
const resolved = getComputedStyle(document.documentElement)
  .getPropertyValue(cssVar('color.background.primary'))
  .trim();
// → '#16a34a' (or whatever the active tenant resolves to)


// =============================================================================
// 15. REAL-WORLD COMPONENT EXAMPLES
// =============================================================================

// ── Plain HTML + utility classes (no JS import needed) ───────────────────────
//
// <link rel="stylesheet" href="node_modules/@btech/tokens/dist/styles.css">
// <link rel="stylesheet" href="node_modules/@btech/tokens/dist/utilities.css">
//
// <button class="bg-primary text-on-primary font-weight-semibold rounded-interactive px-md py-sm">
//   Pay Now
// </button>
//
// <div data-tenant="tenant-bjb">
//   <button class="bg-primary text-on-primary rounded-interactive px-md py-sm">
//     BJB button — different brand color, same class
//   </button>
// </div>

// ── React + CSS-in-JS (inline styles with token()) ───────────────────────────
//
// const buttonStyle: React.CSSProperties = {
//   background:    token('color.background.primary'),
//   color:         token('color.text.on.primary'),
//   borderRadius:  token('radius.interactive'),
//   padding:       `${token('spacing.sm')} ${token('spacing.md')}`,
//   fontSize:      token('typography.fontSize.sm'),
//   fontWeight:    token('typography.fontWeight.semibold'),
//   transition:    `background ${token('motion.duration.fast')} ${token('motion.easing.ease')}`,
//   boxShadow:     token('shadow.sm'),
// };

// ── React + CSS Modules ───────────────────────────────────────────────────────
//
// /* Button.module.css */
// .btn {
//   background:   var(--btech-color-background-primary);
//   color:        var(--btech-color-text-on-primary);
//   border-radius: var(--btech-radius-interactive);
//   padding:      var(--btech-spacing-sm) var(--btech-spacing-md);
//   transition:   background var(--btech-motion-duration-fast) var(--btech-motion-easing-ease);
// }
// .btn:hover   { background: var(--btech-color-background-primary-hover); }
// .btn:active  { background: var(--btech-color-background-primary-pressed); }
// .btn:disabled{ background: var(--btech-color-background-primary-disable); }
//
// /* Works for any tenant automatically — no JS changes needed */

// ── Vue SFC ───────────────────────────────────────────────────────────────────
//
// <template>
//   <button :style="btnStyle">Pay Now</button>
// </template>
// <script setup lang="ts">
// import { token } from '@btech/tokens';
// const btnStyle = {
//   background:   token('color.background.primary'),
//   color:        token('color.text.on.primary'),
//   borderRadius: token('radius.interactive'),
// };
// </script>

// ── SCSS ──────────────────────────────────────────────────────────────────────
//
// .input {
//   border: 1px solid var(--btech-color-stroke-neutral);
//   border-radius: var(--btech-radius-interactive);
//   padding: var(--btech-spacing-sm) var(--btech-spacing-md);
//   font-size: var(--btech-typography-font-size-sm);
//   font-family: var(--btech-typography-font-family-sans);
//   color: var(--btech-color-text-neutral);
//
//   &:focus  { border-color: var(--btech-color-stroke-primary); }
//   &.error  { border-color: var(--btech-color-stroke-danger); }
//   &::placeholder { color: var(--btech-color-text-neutral-subtle); }
// }
