/**
 * useTokens — re-export of the token Zustand store hook
 * -------------------------------------------------------
 * Kept as a separate file so components import from a stable hook path
 * rather than reaching into the store directory. If the store implementation
 * changes (e.g., adding a selector middleware), only this file needs updating.
 */

export { useTokenStore as useTokens } from '../store/tokens.js';
