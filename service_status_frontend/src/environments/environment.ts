export const environment = {
  // Toggle for production mode. This file is used by default build (production target).
  production: true,

  // PUBLIC_INTERFACE
  /**
   * Base URL for the REST API used by the Service Status Frontend.
   * Provide this via environment-specific configuration or runtime injection.
   */
  apiBaseUrl: '',

  // PUBLIC_INTERFACE
  /**
   * Base URL for real-time updates (e.g., WebSocket/SSE) used by the application.
   * Provide this via environment-specific configuration or runtime injection.
   */
  realtimeUrl: '',
} as const;

/**
 * Note:
 * - Angular replaces environment files based on the build configuration.
 * - This file represents the production configuration by default (see angular.json fileReplacements).
 * - Use environment.development.ts for local development overrides.
 */
