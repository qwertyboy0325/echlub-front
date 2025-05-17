import { injectable, inject } from 'inversify';
import { PeerConnectionManager } from '../domain/interfaces/PeerConnectionManager';
import type { SignalingService } from '../domain/interfaces/SignalingService';
import { PeerId } from '../domain/value-objects/PeerId';
import { ConnectionState } from '../domain/value-objects/ConnectionState';
import { CollaborationTypes } from '../di/CollaborationTypes';

interface PeerConnection {
  connection: RTCPeerConnection;
  dataChannels: Map<string, RTCDataChannel>;
  state: ConnectionState;
  candidates: RTCIceCandidate[];
}

/**
 * WebRTC Peer Connection Implementation
 * Handles WebRTC connections and data channels
 */
@injectable()
export class WebRTCPeerConnectionManager implements PeerConnectionManager {
  private localPeerId: PeerId | null = null;
  private connections: Map<string, PeerConnection> = new Map();
  private dataHandlers: Map<string, Set<(peerId: PeerId, data: any) => void>> = new Map();
  private iceServers: RTCIceServer[] = [];
  private mediaConstraints: MediaStreamConstraints = { audio: true, video: false };
  private localStream: MediaStream | null = null;
  
  // Specified reliability settings (according to protocol)
  private channelConfig: Record<string, RTCDataChannelInit> = {
    control: { ordered: true },
    chat: { ordered: true },
    state: { ordered: true },
    audio: { ordered: false, maxRetransmits: 0 },
    media: { ordered: false, maxRetransmits: 1 }
  };

  constructor(
    @inject(CollaborationTypes.SignalingService) private signalingService: SignalingService
  ) {
    // Initialize ICE server configuration
    this.iceServers = [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
      {
        urls: ['turn:turn.echlub.com:3478'],
        username: 'echlub',
        credential: 'echlubauth'
      }
    ];
    
    // Set up signaling service event listeners
    this.setupSignalingListeners();
  }

  /**
   * Set up signaling service event listeners
   */
  private setupSignalingListeners(): void {
    // Listen for Offer messages
    this.signalingService.on('offer', async (payload) => {
      const { from, offer } = payload;
      const remotePeerId = PeerId.fromString(from);
      
      try {
        const answer = await this.handleRemoteOffer(remotePeerId, offer);
        this.signalingService.sendAnswer(remotePeerId, answer);
      } catch (err) {
        console.error('Failed to process Offer:', err);
      }
    });
    
    // Listen for Answer messages
    this.signalingService.on('answer', async (payload) => {
      const { from, answer } = payload;
      const remotePeerId = PeerId.fromString(from);
      
      try {
        await this.handleRemoteAnswer(remotePeerId, answer);
      } catch (err) {
        console.error('Failed to process Answer:', err);
      }
    });
    
    // Listen for ICE Candidate messages
    this.signalingService.on('ice-candidate', (payload) => {
      const { from, candidate } = payload;
      const remotePeerId = PeerId.fromString(from);
      
      if (candidate) {
        this.handleIceCandidate(remotePeerId, candidate);
      }
    });
    
    // Listen for reconnect requests
    this.signalingService.on('reconnect-request', (payload) => {
      const { from } = payload;
      const remotePeerId = PeerId.fromString(from);
      
      this.reconnect(remotePeerId);
    });
    
    // Listen for fallback mode activation messages
    this.signalingService.on('webrtc-fallback-activate', (payload) => {
      const { from } = payload;
      const remotePeerId = PeerId.fromString(from);
      const peerConn = this.connections.get(remotePeerId.toString());
      
      if (peerConn) {
        peerConn.state = ConnectionState.FALLBACK;
      }
    });
    
    // Listen for relay data
    this.signalingService.on('relay-data', (payload) => {
      const { from, payload: dataPayload } = payload;
      const remotePeerId = PeerId.fromString(from);
      const { channel, data } = dataPayload;
      
      // Pass relay data through data handlers
      this.notifyDataHandlers(channel, remotePeerId, data);
    });
  }

  /**
   * Initialize connection manager
   * @param localPeerId Local peer ID
   */
  async initialize(localPeerId: PeerId): Promise<void> {
    // Skip if already initialized with the same PeerId
    if (this.localPeerId && this.localPeerId.equals(localPeerId)) {
      console.log(`PeerConnectionManager already initialized, PeerId: ${localPeerId.toString()}`);
      return;
    }
    
    this.localPeerId = localPeerId;
    
    // Try to get media devices (if audio is needed)
    try {
      // If there's already a local stream, release resources
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
      }
      
      this.localStream = await navigator.mediaDevices.getUserMedia(this.mediaConstraints);
    } catch (err) {
      console.warn('Unable to get media devices, will continue but without audio functionality:', err);
      this.localStream = null;
    }
  }

  /**
   * Connect to remote peer
   * @param remotePeerId Remote peer ID
   * @param initiator Whether this is the initiator
   */
  async connect(remotePeerId: PeerId, initiator: boolean): Promise<boolean> {
    if (!this.localPeerId) {
      throw new Error('PeerConnectionManager not initialized');
    }
    
    const remoteId = remotePeerId.toString();
    
    // If already connected, no need to reconnect
    if (this.isConnectedTo(remotePeerId)) {
      return true;
    }
    
    // If connection exists but state is not CONNECTED, disconnect and reconnect
    if (this.connections.has(remoteId)) {
      await this.disconnect(remotePeerId);
    }
    
    // Create new RTCPeerConnection
    const peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers,
      iceCandidatePoolSize: 10
    });
    
    // Create data channel storage
    const dataChannels = new Map<string, RTCDataChannel>();
    
    // Store connection info
    this.connections.set(remoteId, {
      connection: peerConnection,
      dataChannels,
      state: ConnectionState.CONNECTING,
      candidates: []
    });
    
    // Set up ICE candidate handling
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.signalingService.sendIceCandidate(remotePeerId, event.candidate);
      }
    };
    
    // Set up ICE connection state change handling
    peerConnection.oniceconnectionstatechange = () => {
      const conn = this.connections.get(remoteId);
      if (!conn) return;
      
      console.log(`ICE state change (${remoteId}):`, peerConnection.iceConnectionState);
      
      switch (peerConnection.iceConnectionState) {
        case 'connected':
        case 'completed':
          conn.state = ConnectionState.CONNECTED;
          break;
          
        case 'disconnected':
          conn.state = ConnectionState.DISCONNECTED;
          break;
          
        case 'failed':
          // Try to activate fallback mode
          this.activateFallback(remotePeerId);
          break;
          
        case 'closed':
          conn.state = ConnectionState.DISCONNECTED;
          break;
      }
    };
    
    // Set up connection state change handling
    peerConnection.onconnectionstatechange = () => {
      console.log(`Connection state change (${remoteId}):`, peerConnection.connectionState);
    };
    
    // If there's a local media stream, add it to the connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, this.localStream!);
      });
    }
    
    // If this is the initiator, create and configure data channels
    if (initiator) {
      // Create data channels for each channel type
      for (const [channelName, config] of Object.entries(this.channelConfig)) {
        const dataChannel = peerConnection.createDataChannel(channelName, config);
        this.setupDataChannel(dataChannel, remotePeerId, channelName);
        dataChannels.set(channelName, dataChannel);
      }
      
      // Create and send Offer
      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        this.signalingService.sendOffer(remotePeerId, offer);
      } catch (err) {
        console.error('Failed to create Offer:', err);
        await this.disconnect(remotePeerId);
        return false;
      }
    } else {
      // If not the initiator, set up data channel reception
      peerConnection.ondatachannel = (event) => {
        const dataChannel = event.channel;
        this.setupDataChannel(dataChannel, remotePeerId, dataChannel.label);
        dataChannels.set(dataChannel.label, dataChannel);
      };
    }
    
    return true;
  }

  /**
   * Reconnect to remote peer
   * @param remotePeerId Remote peer ID
   */
  private async reconnect(remotePeerId: PeerId): Promise<boolean> {
    await this.disconnect(remotePeerId);
    return this.connect(remotePeerId, true);
  }

  /**
   * Activate fallback mode
   * @param remotePeerId Remote peer ID
   */
  private activateFallback(remotePeerId: PeerId): void {
    const conn = this.connections.get(remotePeerId.toString());
    if (!conn) return;
    
    conn.state = ConnectionState.FALLBACK;
    this.signalingService.activateFallback(remotePeerId);
    
    console.log(`Activating fallback mode for ${remotePeerId.toString()}`);
  }

  /**
   * Configure data channel
   * @param dataChannel Data channel
   * @param remotePeerId Remote peer ID
   * @param channelName Channel name
   */
  private setupDataChannel(dataChannel: RTCDataChannel, remotePeerId: PeerId, channelName: string): void {
    // Set up channel open handling
    dataChannel.onopen = () => {
      console.log(`Data channel opened: ${channelName} with ${remotePeerId.toString()}`);
      const conn = this.connections.get(remotePeerId.toString());
      if (conn) {
        conn.state = ConnectionState.CONNECTED;
      }
      
      // If it's a control channel, send ready message
      if (channelName === 'control') {
        this.sendData(remotePeerId, 'control', {
          type: 'ready',
          peerId: this.localPeerId?.toString()
        });
      }
    };
    
    // Set up channel close handling
    dataChannel.onclose = () => {
      console.log(`Data channel closed: ${channelName} with ${remotePeerId.toString()}`);
    };
    
    // Set up channel error handling
    dataChannel.onerror = (error) => {
      console.error(`Data channel error: ${channelName} with ${remotePeerId.toString()}`, error);
    };
    
    // Set up channel message handling
    dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.notifyDataHandlers(channelName, remotePeerId, data);
        
        // Special handling for control channel messages
        if (channelName === 'control') {
          this.handleControlMessage(remotePeerId, data);
        }
      } catch (err) {
        console.error(`Failed to process data channel message: ${channelName}`, err);
      }
    };
  }

  /**
   * Handle control channel message
   * @param remotePeerId Remote peer ID
   * @param data Message data
   */
  private handleControlMessage(remotePeerId: PeerId, data: any): void {
    switch (data.type) {
      case 'ping':
        // Handle ping message, send pong response
        this.sendData(remotePeerId, 'control', {
          type: 'pong',
          timestamp: data.timestamp,
          latency: Date.now() - data.timestamp
        });
        break;
        
      case 'pong':
        // Can record round-trip latency
        console.log(`Latency with ${remotePeerId.toString()}: ${data.latency}ms`);
        break;
        
      case 'ready':
        // Peer is ready
        console.log(`Peer ready: ${remotePeerId.toString()}`);
        break;
    }
  }

  /**
   * Notify data handlers
   * @param channel Channel name
   * @param remotePeerId Remote peer ID
   * @param data Data
   */
  private notifyDataHandlers(channel: string, remotePeerId: PeerId, data: any): void {
    const handlers = this.dataHandlers.get(channel);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(remotePeerId, data);
        } catch (err) {
          console.error(`Data handler error (${channel}):`, err);
        }
      }
    }
  }

  /**
   * Disconnect from remote peer
   * @param remotePeerId Remote peer ID
   */
  async disconnect(remotePeerId: PeerId): Promise<void> {
    const remoteId = remotePeerId.toString();
    const conn = this.connections.get(remoteId);
    
    if (!conn) return;
    
    // Close all data channels
    for (const channel of conn.dataChannels.values()) {
      try {
        channel.close();
      } catch (err) {
        console.error(`Failed to close data channel:`, err);
      }
    }
    
    // Close RTCPeerConnection
    try {
      conn.connection.close();
    } catch (err) {
      console.error(`Failed to close peer connection:`, err);
    }
    
    // Remove from map
    this.connections.delete(remoteId);
  }

  /**
   * Disconnect all connections
   */
  async disconnectAll(): Promise<void> {
    const peers = this.getConnectedPeers();
    
    for (const peer of peers) {
      await this.disconnect(peer);
    }
    
    // Release media stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
  }

  /**
   * Send data through specified channel to remote peer
   * @param remotePeerId Remote peer ID
   * @param channel Channel name
   * @param data Data to send
   */
  sendData(remotePeerId: PeerId, channel: string, data: any): boolean {
    const remoteId = remotePeerId.toString();
    const conn = this.connections.get(remoteId);
    
    // If no connection, try using fallback mode
    if (!conn) {
      return this.sendViaFallback(remotePeerId, channel, data);
    }
    
    const dataChannel = conn.dataChannels.get(channel);
    
    // If channel is ready, send directly
    if (dataChannel && dataChannel.readyState === 'open') {
      try {
        dataChannel.send(JSON.stringify(data));
        return true;
      } catch (err) {
        console.error(`Failed to send data through data channel:`, err);
        return this.sendViaFallback(remotePeerId, channel, data);
      }
    } else {
      // If channel is not ready, use fallback mode
      return this.sendViaFallback(remotePeerId, channel, data);
    }
  }

  /**
   * Send data through fallback mechanism
   * @param remotePeerId Remote peer ID
   * @param channel Channel name
   * @param data Data to send
   */
  private sendViaFallback(remotePeerId: PeerId, channel: string, data: any): boolean {
    // Try using relay to send
    return this.signalingService.relayData(remotePeerId, channel, data);
  }

  /**
   * Broadcast data to all connected peers
   * @param channel Channel name
   * @param data Data to send
   */
  broadcastData(channel: string, data: any): void {
    for (const peerId of this.getConnectedPeers()) {
      this.sendData(peerId, channel, data);
    }
  }

  /**
   * Get peer connection state
   * @param peerId Peer ID
   */
  getConnectionState(peerId: PeerId): ConnectionState {
    const conn = this.connections.get(peerId.toString());
    return conn?.state || ConnectionState.DISCONNECTED;
  }

  /**
   * Set up handler to process data from specific channel
   * @param channel Channel name
   * @param handler Handler function
   */
  subscribeToData(channel: string, handler: (peerId: PeerId, data: any) => void): void {
    if (!this.dataHandlers.has(channel)) {
      this.dataHandlers.set(channel, new Set());
    }
    
    this.dataHandlers.get(channel)!.add(handler);
  }

  /**
   * Remove data handler from specific channel
   * @param channel Channel name
   * @param handler Handler function
   */
  unsubscribeFromData(channel: string, handler: (peerId: PeerId, data: any) => void): void {
    const handlers = this.dataHandlers.get(channel);
    
    if (handlers) {
      handlers.delete(handler);
      
      if (handlers.size === 0) {
        this.dataHandlers.delete(channel);
      }
    }
  }

  /**
   * Get all connected peer IDs
   */
  getConnectedPeers(): PeerId[] {
    const peers: PeerId[] = [];
    
    for (const [peerId, conn] of this.connections.entries()) {
      if (conn.state === ConnectionState.CONNECTED || 
          conn.state === ConnectionState.FALLBACK || 
          conn.state === ConnectionState.RELAYING) {
        peers.push(PeerId.fromString(peerId));
      }
    }
    
    return peers;
  }

  /**
   * Check if connected to specific peer
   * @param peerId Peer ID
   */
  isConnectedTo(peerId: PeerId): boolean {
    const conn = this.connections.get(peerId.toString());
    
    if (!conn) return false;
    
    return conn.state === ConnectionState.CONNECTED || 
           conn.state === ConnectionState.FALLBACK || 
           conn.state === ConnectionState.RELAYING;
  }

  /**
   * Handle received ICE candidate
   * @param remotePeerId Remote peer ID
   * @param candidate ICE candidate
   */
  handleIceCandidate(remotePeerId: PeerId, candidate: RTCIceCandidateInit): void {
    const remoteId = remotePeerId.toString();
    const conn = this.connections.get(remoteId);
    
    if (!conn) {
      console.warn(`Received candidate but no corresponding connection: ${remoteId}`);
      return;
    }
    
    const iceCandidate = new RTCIceCandidate(candidate);
    
    if (conn.connection.remoteDescription) {
      // If remote description is set, add candidate directly
      conn.connection.addIceCandidate(iceCandidate)
        .catch(err => console.error('Failed to add ICE candidate:', err));
    } else {
      // Otherwise, store candidate for later addition after remote description is set
      conn.candidates.push(iceCandidate);
    }
  }

  /**
   * Handle received remote Offer
   * @param remotePeerId Remote peer ID
   * @param offer SDP offer
   */
  async handleRemoteOffer(remotePeerId: PeerId, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    // Ensure connection with remote peer
    await this.connect(remotePeerId, false);
    
    const remoteId = remotePeerId.toString();
    const conn = this.connections.get(remoteId);
    
    if (!conn) {
      throw new Error(`No connection found for ${remoteId}`);
    }
    
    // Set remote description
    await conn.connection.setRemoteDescription(new RTCSessionDescription(offer));
    
    // Add previously stored candidates
    for (const candidate of conn.candidates) {
      await conn.connection.addIceCandidate(candidate)
        .catch(err => console.error('Failed to add stored ICE candidate:', err));
    }
    
    // Clear stored candidates
    conn.candidates = [];
    
    // Create Answer
    const answer = await conn.connection.createAnswer();
    await conn.connection.setLocalDescription(answer);
    
    return answer;
  }

  /**
   * Handle received remote Answer
   * @param remotePeerId Remote peer ID
   * @param answer SDP answer
   */
  async handleRemoteAnswer(remotePeerId: PeerId, answer: RTCSessionDescriptionInit): Promise<void> {
    const remoteId = remotePeerId.toString();
    const conn = this.connections.get(remoteId);
    
    if (!conn) {
      throw new Error(`No connection found for ${remoteId}`);
    }
    
    // Set remote description
    await conn.connection.setRemoteDescription(new RTCSessionDescription(answer));
    
    // Add previously stored candidates
    for (const candidate of conn.candidates) {
      await conn.connection.addIceCandidate(candidate)
        .catch(err => console.error('Failed to add stored ICE candidate:', err));
    }
    
    // Clear stored candidates
    conn.candidates = [];
  }
} 
