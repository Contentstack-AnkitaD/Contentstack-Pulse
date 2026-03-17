/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly REACT_APP_API_BASE_URL: string;
  readonly REACT_APP_API_KEY: string;
  readonly REACT_APP_MANAGEMENT_TOKEN: string;
  readonly REACT_APP_GEMINI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
