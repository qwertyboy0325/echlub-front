import { PeerId } from '../value-objects/PeerId';
import { RoomId } from '../value-objects/RoomId';
import { ConnectionState } from '../value-objects/ConnectionState';

/**
 * Signaling Service Interface
 * Defines common operations and event handling methods for signaling service
 */
export interface SignalingService {
  /**
   * Connect to signaling server
   * @param roomId Room ID
   * @param peerId Local peer ID
   */
  connect(roomId: RoomId, peerId: PeerId): Promise<boolean>;
  
  /**
   * Send message to signaling server
   * @param message Signaling message
   */
  sendMessage(message: any): boolean;
  
  /**
   * Send connection request (Offer)
   * @param to Target peer ID
   * @param offer SDP offer
   */
  sendOffer(to: PeerId, offer: RTCSessionDescriptionInit): boolean;
  
  /**
   * Send connection answer
   * @param to Target peer ID
   * @param answer SDP answer
   */
  sendAnswer(to: PeerId, answer: RTCSessionDescriptionInit): boolean;
  
  /**
   * Send ICE Candidate
   * @param to Target peer ID
   * @param candidate ICE candidate
   */
  sendIceCandidate(to: PeerId, candidate: RTCIceCandidate): boolean;
  
  /**
   * Send reconnection request
   * @param to Target peer ID
   */
  sendReconnectRequest(to: PeerId): boolean;
  
  /**
   * Activate fallback mode message
   * @param to Target peer ID
   */
  activateFallback(to: PeerId): boolean;
  
  /**
   * Relay data
   * @param to Target peer ID
   * @param channel Channel name
   * @param data Data
   */
  relayData(to: PeerId, channel: string, data: any): boolean;
  
  /**
   * Leave room, disconnect
   */
  disconnect(): Promise<void>;
  
  /**
   * Register signaling message handler
   * @param type Message type
   * @param handler Handler function
   */
  on(type: string, handler: (message: any) => void): void;
  
  /**
   * Remove signaling message handler
   * @param type Message type
   * @param handler Handler function
   */
  off(type: string, handler: (message: any) => void): void;
  
  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState;
} 
