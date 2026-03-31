/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_API_KEY?: string
  readonly VITE_AUTH_API_BASE_URL?: string
  readonly VITE_APP_URL?: string
  readonly VITE_APP_ENV?: string
  readonly VITE_COOKIE_DOMAIN?: string
  readonly VITE_WS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
