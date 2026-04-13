import type { App, Plugin } from 'vue';
import { ref, provide, inject, watchEffect, onUnmounted } from 'vue';

export type ColorMode = 'light' | 'dark';

export interface TokenPluginOptions {
  tenant: string;
  mode?: ColorMode;
}

const TOKEN_INJECTION_KEY = Symbol('ds-tokens');

interface TokenState {
  tenant: string;
  mode: ColorMode;
}

/**
 * Vue 3 plugin that activates tenant theming.
 * Sets `data-tenant` and `data-mode` on <html>.
 *
 * @example
 * app.use(tokenPlugin, { tenant: 'tenant-a', mode: 'light' })
 */
export const tokenPlugin: Plugin = {
  install(app: App, options: TokenPluginOptions) {
    const { tenant, mode = 'light' } = options;

    const state = ref<TokenState>({ tenant, mode });

    // Apply to DOM
    const apply = (s: TokenState) => {
      document.documentElement.setAttribute('data-tenant', s.tenant);
      document.documentElement.setAttribute('data-mode', s.mode);
    };

    apply(state.value);

    app.provide(TOKEN_INJECTION_KEY, state);

    if (process.env.NODE_ENV === 'development' && tenant === 'default') {
      console.warn(
        '[tokenPlugin] Using "default" tenant. Pass a specific tenant ID for branded theming.'
      );
    }
  },
};

/**
 * Composable to access the current tenant + mode.
 * Must be used inside a component tree where tokenPlugin is installed.
 */
export function useToken(): TokenState {
  const state = inject<ReturnType<typeof ref<TokenState>>>(TOKEN_INJECTION_KEY);
  if (!state) {
    throw new Error('useToken requires tokenPlugin to be installed via app.use(tokenPlugin, { ... })');
  }
  return state.value;
}
