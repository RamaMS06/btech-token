import type { App, Plugin, InjectionKey, Ref } from 'vue';
import { ref, provide, inject } from 'vue';

export type ColorMode = 'light' | 'dark';

export interface TokenPluginOptions {
  tenant: string;
  mode?: ColorMode;
}

interface TokenState {
  tenant: string;
  mode: ColorMode;
}

const TOKEN_INJECTION_KEY: InjectionKey<Ref<TokenState>> = Symbol('ds-tokens');

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

    document.documentElement.setAttribute('data-tenant', tenant);
    document.documentElement.setAttribute('data-mode', mode);

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
  const state = inject(TOKEN_INJECTION_KEY);
  if (!state) {
    throw new Error(
      'useToken requires tokenPlugin to be installed via app.use(tokenPlugin, { ... })'
    );
  }
  return state.value;
}
