/**
 * Enum representing connection states
 */
export enum ConnectionState {
  DISCONNECTED = 'disconnected',  // Disconnected
  CONNECTING = 'connecting',      // Connecting
  CONNECTED = 'connected',        // Connected
  RELAYING = 'relaying',          // Relaying mode
  ERROR = 'error'                 // Error state
} 