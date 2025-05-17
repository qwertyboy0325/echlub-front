/**
 * Signal Hub Adapter Interface
 * Used for handling WebRTC signaling exchange and room event broadcasting
 */
export interface ISignalHubAdapter {
  /**
   * Connect to the signaling server
   * @param roomId Room ID
   * @param peerId Peer ID
   */
  connect(roomId: string, peerId: string): Promise<void>;
  
  /**
   * Disconnect from the signaling server
   */
  disconnect(): Promise<void>;
  
  /**
   * Send message to signaling hub
   * @param channel Message channel
   * @param data Message data
   */
  send(channel: string, data: any): Promise<void>;
  
  /**
   * Subscribe to messages on a specific channel
   * @param channel Message channel
   * @param callback Callback function for receiving messages
   */
  subscribe(channel: string, callback: (data: any) => void): void;
  
  /**
   * Unsubscribe from a specific channel
   * @param channel Message channel
   * @param callback Callback function to unsubscribe
   */
  unsubscribe(channel: string, callback: (data: any) => void): void;
  
  /**
   * Check connection status
   */
  isConnected(): boolean;

  /**
   * Activate WebRTC fallback mode
   * When P2P connection fails, relay data through the server
   * @param peerId Peer ID to activate fallback mode for
   */
  activateWebRTCFallback(peerId: string): Promise<void>;
  
  /**
   * Relay data through the server
   * Used when WebRTC connection fails
   * @param targetPeerId Target peer ID
   * @param data Data to send
   */
  relayData(targetPeerId: string, data: any): Promise<void>;
  
  /**
   * Subscribe to WebRTC fallback suggestion events
   * @param callback Callback for when the system suggests using fallback mode
   */
  onWebRTCFallbackSuggested(callback: (data: { peerId: string, reason: string }) => void): void;
  
  /**
   * Subscribe to WebRTC fallback requirement events
   * @param callback Callback for when the other party activates fallback mode
   */
  onWebRTCFallbackNeeded(callback: (data: { peerId: string }) => void): void;
  
  /**
   * Subscribe to WebRTC fallback activation events
   * @param callback Callback for when fallback mode is activated successfully
   */
  onWebRTCFallbackActivated(callback: (data: { peerId: string }) => void): void;
  
  /**
   * Subscribe to relay data events
   * @param callback Callback for receiving relay data
   */
  onRelayData(callback: (data: { from: string, payload: any }) => void): void;

  /**
   * Update connection state
   * @param peerId Peer ID
   * @param state Connection state
   */
  updateConnectionState(peerId: string, state: string): Promise<void>;
  
  /**
   * Request reconnection with a peer
   * @param targetPeerId Target peer ID
   */
  requestReconnect(targetPeerId: string): Promise<void>;
  
  /**
   * Send ICE candidate
   * @param targetPeerId Target peer ID
   * @param candidate ICE candidate data
   */
  sendIceCandidate(targetPeerId: string, candidate: RTCIceCandidateInit): Promise<void>;
  
  /**
   * Send WebRTC offer
   * @param targetPeerId Target peer ID
   * @param offer Offer data
   */
  sendOffer(targetPeerId: string, offer: RTCSessionDescriptionInit): Promise<void>;
  
  /**
   * Send WebRTC answer
   * @param targetPeerId Target peer ID
   * @param answer Answer data
   */
  sendAnswer(targetPeerId: string, answer: RTCSessionDescriptionInit): Promise<void>;
  
  /**
   * Subscribe to room state events
   * @param callback Callback for receiving room state
   */
  onRoomState(callback: (data: any) => void): void;
  
  /**
   * Subscribe to player join events
   * @param callback Callback for when a player joins
   */
  onPlayerJoined(callback: (data: { peerId: string, roomId: string, totalPlayers: number, isRoomOwner: boolean }) => void): void;
  
  /**
   * Subscribe to player leave events
   * @param callback Callback for when a player leaves
   */
  onPlayerLeft(callback: (data: { peerId: string, roomId: string }) => void): void;
  
  /**
   * Subscribe to ICE candidate events
   * @param callback Callback for when an ICE candidate is received
   */
  onIceCandidate(callback: (data: { from: string, candidate: RTCIceCandidateInit }) => void): void;
  
  /**
   * Subscribe to offer events
   * @param callback Callback for when an offer is received
   */
  onOffer(callback: (data: { from: string, offer: RTCSessionDescriptionInit }) => void): void;
  
  /**
   * Subscribe to answer events
   * @param callback Callback for when an answer is received
   */
  onAnswer(callback: (data: { from: string, answer: RTCSessionDescriptionInit }) => void): void;
  
  /**
   * Subscribe to reconnect needed events
   * @param callback Callback for when a reconnect is needed
   */
  onReconnectNeeded(callback: (data: { from: string }) => void): void;
  
  /**
   * Subscribe to peer connection state events
   * @param callback Callback for when peer connection state changes
   */
  onPeerConnectionState(callback: (data: { peerId: string, state: string }) => void): void;
} 
