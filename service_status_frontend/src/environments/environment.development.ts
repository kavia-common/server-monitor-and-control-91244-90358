export const environment = {
  // Development mode
  production: false,

  // PUBLIC_INTERFACE
  /**
   * Base URL for the REST API in development.
   * Example: 'http://localhost:8000/api'
   */
  apiBaseUrl: '',

  // PUBLIC_INTERFACE
  /**
   * Base URL for real-time updates (e.g., WebSocket/SSE) in development.
   * Example: 'ws://localhost:8000/realtime' or 'http://localhost:8000/sse'
   */
  realtimeUrl: '',
} as const;

/**
 * Note:
 * - Angular will use this file when running in development mode (ng serve / development build).
 * - You can set concrete values via environment.ts files or a runtime configuration layer.
 */
