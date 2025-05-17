/**
 * Connection State Enum
 * Represents different states of a connection
 */
export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  FALLBACK = 'fallback',
  RELAYING = 'relaying'
} 
