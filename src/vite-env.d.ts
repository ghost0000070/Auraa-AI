/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_OWNER_EMAIL: string;
  readonly PROD: boolean;
  readonly VITE_OWNER_UID: string;
  readonly VITE_USE_EMULATORS?: string;
  readonly VITE_EMULATOR_HOST?: string;
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_SENTRY_ENVIRONMENT?: string;
  readonly VITE_ENABLE_ANALYTICS?: string;
  readonly VITE_API_RATE_LIMIT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
