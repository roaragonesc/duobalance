/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DATA_MODE: 'mock' | 'api'
  readonly VITE_API_PROXY_TARGET?: string
  readonly VITE_MOCK_SHARED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
