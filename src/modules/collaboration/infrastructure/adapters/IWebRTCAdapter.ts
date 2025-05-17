import { PeerId } from '../../domain/value-objects/PeerId';
import { ConnectionState } from '../../domain/value-objects/ConnectionState';

/**
 * Signal types
 */
export enum SignalType {
  OFFER = 'offer',
  ANSWER = 'answer',
  ICE_CANDIDATE = 'ice-candidate',
  RECONNECT = 'reconnect'
}

/**
 * Signal data interface
 */
export interface SignalData {
  type: SignalType;
  sender: string;
  recipient: string;
  payload: any;
}

/**
 * WebRTC Adapter Interface
 * Manages WebRTC peer connections and data channels
 */
export interface IWebRTCAdapter {
  /**
   * Initialize WebRTC adapter
   * @param localPeerId Local peer ID
   */
  initialize(localPeerId: PeerId): Promise<void>;
  
  /**
   * Process incoming signal data
   * @param signal Signal data
   */
  processSignal(signal: SignalData): Promise<void>;
  
  /**
   * Create connection with remote peer
   * @param remotePeerId Remote peer ID
   * @param initiator Whether this peer is the initiator
   */
  createConnection(remotePeerId: PeerId, initiator: boolean): Promise<void>;
  
  /**
   * Close connection with remote peer
   * @param remotePeerId Remote peer ID
   */
  closeConnection(remotePeerId: PeerId): Promise<void>;
  
  /**
   * Close all connections
   */
  closeAllConnections(): Promise<void>;
  
  /**
   * Send data to remote peer
   * @param peerId Remote peer ID
   * @param channel Channel name
   * @param data Data to send
   */
  sendData(peerId: PeerId, channel: string, data: any): Promise<void>;
  
  /**
   * Broadcast data to all connected peers
   * @param channel Channel name
   * @param data Data to send
   */
  broadcastData(channel: string, data: any): Promise<void>;
  
  /**
   * Subscribe to data from specific channel
   * @param channel Channel name
   * @param callback Callback function for receiving data
   */
  subscribe(channel: string, callback: (peerId: PeerId, data: any) => void): void;
  
  /**
   * Unsubscribe from specific channel
   * @param channel Channel name
   * @param callback Callback function to unsubscribe
   */
  unsubscribe(channel: string, callback: (peerId: PeerId, data: any) => void): void;
  
  /**
   * Get connection state with peer
   * @param peerId Peer ID
   */
  getConnectionState(peerId: PeerId): ConnectionState;
  
  /**
   * Get all connected peers
   */
  getConnectedPeers(): PeerId[];
  
  /**
   * Register connection state change listener
   * @param listener State change listener
   */
  onConnectionStateChange(listener: (peerId: PeerId, state: ConnectionState) => void): void;
  
  /**
   * Activate fallback mode for peer
   * @param peerId Peer ID
   */
  activateFallback(peerId: PeerId): Promise<void>;
  
  /**
   * Send data through fallback mechanism
   * @param peerId Peer ID
   * @param channel Channel name
   * @param data Data to send
   */
  sendFallbackData(peerId: PeerId, channel: string, data: any): Promise<void>;
  
  /**
   * Request reconnection with peer
   * @param peerId Peer ID
   */
  requestReconnect(peerId: PeerId): Promise<void>;
} 
