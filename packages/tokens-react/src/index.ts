import React, { createContext, useContext, useEffect } from 'react';

export type ColorMode = 'light' | 'dark';

export interface TokenProviderProps {
  tenant: string;
  mode?: ColorMode;
  children: React.ReactNode;
}

interface TokenContextValue {
  tenant: string;
  mode: ColorMode;
}

const TokenContext = createContext<TokenContextValue>({
  tenant: 'default',
  mode: 'light',
});

/**
 * Wraps your app to activate the correct tenant token set.
 * Sets `data-tenant` and `data-mode` on the root HTML element,
 * which CSS custom properties target via attribute selectors.
 *
 * @example
 * <TokenProvider tenant="tenant-a" mode="light">
 *   <App />
 * </TokenProvider>
 */
export function TokenProvider({ tenant, mode = 'light', children }: TokenProviderProps) {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-tenant', tenant);
    root.setAttribute('data-mode', mode);

    if (process.env.NODE_ENV === 'development' && tenant === 'default') {
      console.warn(
        '[TokenProvider] Using "default" tenant. Pass a specific tenant ID for branded theming.'
      );
    }

    return () => {
      root.removeAttribute('data-tenant');
      root.removeAttribute('data-mode');
    };
  }, [tenant, mode]);

  return (
    React.createElement(TokenContext.Provider, { value: { tenant, mode } }, children)
  );
}

/**
 * Returns the current tenant and color mode.
 * Must be used inside a <TokenProvider>.
 */
export function useToken(): TokenContextValue {
  const ctx = useContext(TokenContext);
  if (!ctx) {
    throw new Error('useToken must be used within a <TokenProvider>');
  }
  return ctx;
}

export type { TokenContextValue };
