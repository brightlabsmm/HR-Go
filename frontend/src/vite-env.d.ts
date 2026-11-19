/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_PORTAL?: "organization" | "platform"
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
