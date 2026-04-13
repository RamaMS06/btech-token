export type ColorMode = 'light' | 'dark';

export interface ActivateOptions {
  tenant: string;
  mode?: ColorMode;
  root?: HTMLElement;
}

/**
 * Activates a tenant's token set by setting data attributes on the root element.
 * CSS custom properties defined in styles.css target these attributes.
 *
 * @example
 * import { activateTenant } from '@btech/tokens-web';
 * import '@btech/tokens-web/styles.css';
 *
 * activateTenant({ tenant: 'tenant-a', mode: 'light' });
 */
export function activateTenant({
  tenant,
  mode = 'light',
  root = document.documentElement,
}: ActivateOptions): () => void {
  root.setAttribute('data-tenant', tenant);
  root.setAttribute('data-mode', mode);

  if (
    typeof process !== 'undefined' &&
    process.env?.NODE_ENV === 'development' &&
    tenant === 'default'
  ) {
    console.warn(
      '[tokens-web] Using "default" tenant. Pass a specific tenant ID for branded theming.'
    );
  }

  // Return a cleanup function
  return () => {
    root.removeAttribute('data-tenant');
    root.removeAttribute('data-mode');
  };
}

/**
 * Returns the currently active tenant and mode from DOM attributes.
 */
export function getActiveTenant(root = document.documentElement): {
  tenant: string;
  mode: ColorMode;
} {
  return {
    tenant: root.getAttribute('data-tenant') ?? 'default',
    mode: (root.getAttribute('data-mode') as ColorMode) ?? 'light',
  };
}
