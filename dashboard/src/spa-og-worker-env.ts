/**
 * Worker bindings for `spa-og-worker.ts`.
 * Kept in a small module so the worker avoids `/// <reference path="..." />` (ESLint).
 * Regenerate from `wrangler types` if bindings change.
 */
export type SpaOgWorkerEnv = {
  ASSETS: { fetch(input: Request | URL | string, init?: RequestInit): Promise<Response> }
  VITE_API_URL: string
  SITE_CONFIG_URL?: string
  VITE_SITE_NAME_FALLBACK?: string
}
