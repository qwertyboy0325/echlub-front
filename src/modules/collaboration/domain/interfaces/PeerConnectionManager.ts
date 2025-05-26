import { PeerId } from '../value-objects/PeerId';
import { ConnectionState } from '../value-objects/ConnectionState';

/**
 * Peer Connection Manager Interface
 * Responsible for managing WebRTC connections and data channels
 */
export interface PeerConnectionManager {
  /**
   * Initialize connection manager
   * @param localPeerId Local peer ID
   */
  initialize(localPeerId: PeerId): Promise<void>;
  
  /**
   * Connect to remote peer
   * @param remotePeerId Remote peer ID
   * @param initiator Whether this is the initiator
   */
  connect(remotePeerId: PeerId, initiator: boolean): Promise<boolean>;
  
  /**
   * Disconnect from remote peer
   * @param remotePeerId Remote peer ID
   */
  disconnect(remotePeerId: PeerId): Promise<void>;
  
  /**
   * Disconnect from all peers
   */
  disconnectAll(): Promise<void>;
  
  /**
   * Send data to remote peer via specified channel
   * @param remotePeerId Remote peer ID
   * @param channel Channel name
   * @param data Data to send
   */
  sendData(remotePeerId: PeerId, channel: string, data: any): Promise<boolean>;
  
  /**
   * Broadcast data to all connected peers
   * @param channel Channel name
   * @param data Data to send
   */
  broadcastData(channel: string, data: any): void;
  
  /**
   * Get peer connection state
   * @param peerId Peer ID
   */
  getConnectionState(peerId: PeerId): ConnectionState;
  
  /**
   * Set handler for data received from specific channel
   * @param channel Channel name
   * @param handler Handler function
   */
  subscribeToData(channel: string, handler: (peerId: PeerId, data: any) => void): void;
  
  /**
   * Remove data handler for specific channel
   * @param channel Channel name
   * @param handler Handler function
   */
  unsubscribeFromData(channel: string, handler: (peerId: PeerId, data: any) => void): void;
  
  /**
   * Get IDs of all currently connected peers
   */
  getConnectedPeers(): PeerId[];
  
  /**
   * Whether connected to specific peer
   * @param peerId Peer ID
   */
  isConnectedTo(peerId: PeerId): boolean;
  
  /**
   * Handle received ICE candidate
   * @param remotePeerId Remote peer ID
   * @param candidate ICE candidate
   */
  handleIceCandidate(remotePeerId: PeerId, candidate: RTCIceCandidateInit): void;
  
  /**
   * Handle received remote offer
   * @param remotePeerId Remote peer ID
   * @param offer SDP offer
   */
  handleRemoteOffer(remotePeerId: PeerId, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
  
  /**
   * Handle received remote answer
   * @param remotePeerId Remote peer ID
   * @param answer SDP answer
   */
  handleRemoteAnswer(remotePeerId: PeerId, answer: RTCSessionDescriptionInit): Promise<void>;
} 
