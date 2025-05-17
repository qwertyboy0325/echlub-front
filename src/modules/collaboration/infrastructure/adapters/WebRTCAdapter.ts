import { injectable, inject } from 'inversify';
import { IWebRTCAdapter, SignalData, SignalType } from './IWebRTCAdapter';
import { PeerId } from '../../domain/value-objects/PeerId';
import { ConnectionState } from '../../domain/value-objects/ConnectionState';
import { CollaborationTypes } from '../../di/CollaborationTypes';
import type { ISignalHubAdapter } from './ISignalHubAdapter';

/**
 * WebRTC Peer Connection Options
 */
interface RTCPeerOptions {
  iceServers: RTCIceServer[];
  iceCandidatePoolSize?: number;
  bundlePolicy?: RTCBundlePolicy;
}

/**
 * WebRTC Connection Wrapper
 */
class PeerConnection {
  private connection: RTCPeerConnection;
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private listeners: ((state: ConnectionState) => void)[] = [];
  private channelListeners: Map<string, Set<(data: any) => void>> = new Map();
  
  constructor(
    private readonly remotePeerId: PeerId,
    options: RTCPeerOptions
  ) {
    this.connection = new RTCPeerConnection(options);
    
    // Listen for ICE connection state changes
    this.connection.oniceconnectionstatechange = () => {
      this.updateState(this.mapIceStateToConnectionState(this.connection.iceConnectionState));
    };
  }
  
  /**
   * Create a new data channel
   */
  createDataChannel(channelName: string): RTCDataChannel {
    const channel = this.connection.createDataChannel(channelName, {
      ordered: true,
    });
    
    this.setupDataChannel(channel);
    this.dataChannels.set(channelName, channel);
    return channel;
  }
  
  /**
   * Set up data channel handlers
   */
  private setupDataChannel(channel: RTCDataChannel): void {
    channel.onopen = () => {
      console.log(`Data channel ${channel.label} opened with peer ${this.remotePeerId.toString()}`);
    };
    
    channel.onclose = () => {
      console.log(`Data channel ${channel.label} closed with peer ${this.remotePeerId.toString()}`);
    };
    
    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const listeners = this.channelListeners.get(channel.label);
        if (listeners) {
          listeners.forEach(listener => listener(data));
        }
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    };
    
    channel.onerror = (error) => {
      console.error(`Data channel ${channel.label} error:`, error);
      this.updateState(ConnectionState.ERROR);
    };
  }
  
  /**
   * Handle data channel reception
   */
  onDataChannel(event: RTCDataChannelEvent): void {
    const channel = event.channel;
    this.setupDataChannel(channel);
    this.dataChannels.set(channel.label, channel);
  }
  
  /**
   * Create connection offer
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.connection.createOffer();
    await this.connection.setLocalDescription(offer);
    return offer;
  }
  
  /**
   * Set remote offer and create answer
   */
  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.connection.setRemoteDescription(offer);
    const answer = await this.connection.createAnswer();
    await this.connection.setLocalDescription(answer);
    return answer;
  }
  
  /**
   * Set remote answer
   */
  async setRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    await this.connection.setRemoteDescription(answer);
  }
  
  /**
   * Add ICE candidate
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    await this.connection.addIceCandidate(candidate);
  }
  
  /**
   * Send data
   */
  async sendData(channelName: string, data: any): Promise<void> {
    const channel = this.dataChannels.get(channelName);
    if (!channel) {
      const newChannel = this.createDataChannel(channelName);
      
      // Wait for channel to open
      if (newChannel.readyState !== 'open') {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error(`Timeout waiting for channel ${channelName} to open`));
          }, 5000);
          
          newChannel.onopen = () => {
            clearTimeout(timeout);
            resolve();
          };
          
          newChannel.onerror = (err) => {
            clearTimeout(timeout);
            reject(err);
          };
        });
      }
      
      newChannel.send(JSON.stringify(data));
      return;
    }
    
    if (channel.readyState === 'open') {
      channel.send(JSON.stringify(data));
    } else {
      throw new Error(`Channel ${channelName} is not open. Current state: ${channel.readyState}`);
    }
  }
  
  /**
   * Subscribe to channel data
   */
  subscribe(channelName: string, callback: (data: any) => void): void {
    if (!this.channelListeners.has(channelName)) {
      this.channelListeners.set(channelName, new Set());
    }
    
    this.channelListeners.get(channelName)!.add(callback);
  }
  
  /**
   * Unsubscribe from channel data
   */
  unsubscribe(channelName: string, callback: (data: any) => void): void {
    const listeners = this.channelListeners.get(channelName);
    if (listeners) {
      listeners.delete(callback);
    }
  }
  
  /**
   * Close connection
   */
  close(): void {
    // Close all data channels
    this.dataChannels.forEach(channel => {
      channel.close();
    });
    
    // Close RTCPeerConnection
    this.connection.close();
    this.updateState(ConnectionState.DISCONNECTED);
  }
  
  /**
   * Get ICE connection state
   */
  getIceState(): RTCIceConnectionState {
    return this.connection.iceConnectionState;
  }
  
  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return this.state;
  }
  
  /**
   * Update connection state
   */
  private updateState(newState: ConnectionState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.listeners.forEach(listener => listener(newState));
    }
  }
  
  /**
   * Map WebRTC ICE state to application connection state
   */
  private mapIceStateToConnectionState(iceState: RTCIceConnectionState): ConnectionState {
    switch (iceState) {
      case 'new':
      case 'checking':
        return ConnectionState.CONNECTING;
      case 'connected':
      case 'completed':
        return ConnectionState.CONNECTED;
      case 'disconnected':
        return ConnectionState.DISCONNECTED;
      case 'failed':
        return ConnectionState.ERROR;
      case 'closed':
        return ConnectionState.DISCONNECTED;
      default:
        return ConnectionState.DISCONNECTED;
    }
  }
  
  /**
   * Register state change listener
   */
  onStateChange(listener: (state: ConnectionState) => void): void {
    this.listeners.push(listener);
  }
  
  /**
   * Get ICE candidates
   */
  onIceCandidate(callback: (candidate: RTCIceCandidate | null) => void): void {
    this.connection.onicecandidate = (event) => {
      callback(event.candidate);
    };
  }
}

/**
 * WebRTC Adapter Implementation
 */
@injectable()
export class WebRTCAdapter implements IWebRTCAdapter {
  private connections: Map<string, PeerConnection> = new Map();
  private localPeerId?: PeerId;
  private stateChangeListeners: ((peerId: PeerId, state: ConnectionState) => void)[] = [];
  private channelSubscriptions: Map<string, Set<(peerId: PeerId, data: any) => void>> = new Map();
  
  constructor(
    @inject(CollaborationTypes.SignalHubAdapter)
    private readonly signalHub: ISignalHubAdapter
  ) {}
  
  /**
   * Get ICE server configuration
   */
  private getIceServers(): RTCIceServer[] {
    return [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302'
        ]
      },
      {
        urls: 'turn:numb.viagenie.ca',
        username: 'webrtc@live.com',
        credential: 'muazkh'
      }
    ];
  }
  
  /**
   * Initialize WebRTC adapter
   */
  async initialize(localPeerId: PeerId): Promise<void> {
    this.localPeerId = localPeerId;
    
    // Use new subscription method
    this.signalHub.onIceCandidate(this.handleIceCandidate.bind(this));
    this.signalHub.onOffer(this.handleOffer.bind(this));
    this.signalHub.onAnswer(this.handleAnswer.bind(this));
    this.signalHub.onReconnectNeeded(this.handleReconnectNeeded.bind(this));
    this.signalHub.onPeerConnectionState(this.handlePeerConnectionState.bind(this));
    this.signalHub.onWebRTCFallbackNeeded(this.handleFallbackNeeded.bind(this));
    
    console.log(`WebRTC adapter initialized with local peer ID: ${localPeerId.toString()}`);
  }
  
  /**
   * Handle received ICE candidate
   */
  private async handleIceCandidate(data: { from: string, candidate: RTCIceCandidateInit }): Promise<void> {
    const { from, candidate } = data;
    const signal: SignalData = {
      type: SignalType.ICE_CANDIDATE,
      sender: from,
      recipient: this.localPeerId!.toString(),
      payload: { candidate }
    };
    await this.processSignal(signal);
  }
  
  /**
   * Handle received offer
   */
  private async handleOffer(data: { from: string, offer: RTCSessionDescriptionInit }): Promise<void> {
    const { from, offer } = data;
    const signal: SignalData = {
      type: SignalType.OFFER,
      sender: from,
      recipient: this.localPeerId!.toString(),
      payload: { sdp: offer }
    };
    await this.processSignal(signal);
  }
  
  /**
   * Handle received answer
   */
  private async handleAnswer(data: { from: string, answer: RTCSessionDescriptionInit }): Promise<void> {
    const { from, answer } = data;
    const signal: SignalData = {
      type: SignalType.ANSWER,
      sender: from,
      recipient: this.localPeerId!.toString(),
      payload: { sdp: answer }
    };
    await this.processSignal(signal);
  }
  
  /**
   * Handle reconnection request
   */
  private async handleReconnectNeeded(data: { from: string }): Promise<void> {
    const { from } = data;
    const remotePeerId = PeerId.fromString(from);
    
    console.log(`Reconnection needed with peer: ${from}`);
    
    // Close existing connection and create new one
    await this.closeConnection(remotePeerId);
    await this.createConnection(remotePeerId, true);
  }
  
  /**
   * Handle peer connection state change
   */
  private async handlePeerConnectionState(data: { peerId: string, state: string }): Promise<void> {
    const { peerId, state } = data;
    console.log(`Peer ${peerId} connection state changed to ${state}`);
    
    // Additional handling logic can be added here
  }
  
  /**
   * Handle fallback mode activation request
   */
  private async handleFallbackNeeded(data: { peerId: string }): Promise<void> {
    const { peerId } = data;
    const remotePeerId = PeerId.fromString(peerId);
    
    console.log(`WebRTC fallback needed for peer: ${peerId}`);
    
    // Notify application that WebRTC needs to use fallback mode
    this.notifyConnectionStateChange(remotePeerId, ConnectionState.FALLBACK);
  }
  
  /**
   * Create new peer connection
   */
  async createConnection(remotePeerId: PeerId, initiator: boolean): Promise<void> {
    if (!this.localPeerId) {
      throw new Error('WebRTC adapter not initialized');
    }
    
    const peerIdStr = remotePeerId.toString();
    
    // Check if connection already exists
    if (this.connections.has(peerIdStr)) {
      console.log(`Connection with ${peerIdStr} already exists`);
      return;
    }
    
    console.log(`Creating new connection with ${peerIdStr}, initiator: ${initiator}`);
    
    // Create new connection
    const peerConnection = new PeerConnection(remotePeerId, {
      iceServers: this.getIceServers(),
      iceCandidatePoolSize: 10
    });
    
    // Listen for connection state changes
    peerConnection.onStateChange((state) => {
      this.notifyConnectionStateChange(remotePeerId, state);
      
      // Notify server about connection state change
      this.signalHub.updateConnectionState(remotePeerId.toString(), state.toString())
        .catch(error => console.error('Error updating connection state:', error));
    });
    
    // Listen for ICE candidates
    peerConnection.onIceCandidate((candidate) => {
      if (candidate) {
        this.signalHub.sendIceCandidate(remotePeerId.toString(), candidate.toJSON())
          .catch(error => console.error('Error sending ICE candidate:', error));
      }
    });
    
    // Store connection
    this.connections.set(peerIdStr, peerConnection);
    
    // If initiator, create and send offer
    if (initiator) {
      try {
        const offer = await peerConnection.createOffer();
        await this.signalHub.sendOffer(remotePeerId.toString(), offer);
      } catch (error) {
        console.error('Error creating offer:', error);
        this.closeConnection(remotePeerId);
      }
    }
  }
  
  /**
   * Close connection with specific peer
   */
  async closeConnection(remotePeerId: PeerId): Promise<void> {
    const peerIdStr = remotePeerId.toString();
    const connection = this.connections.get(peerIdStr);
    
    if (connection) {
      connection.close();
      this.connections.delete(peerIdStr);
      this.notifyConnectionStateChange(remotePeerId, ConnectionState.DISCONNECTED);
    }
  }
  
  /**
   * Close all connections
   */
  async closeAllConnections(): Promise<void> {
    for (const [peerIdStr, connection] of this.connections.entries()) {
      connection.close();
      this.notifyConnectionStateChange(PeerId.fromString(peerIdStr), ConnectionState.DISCONNECTED);
    }
    
    this.connections.clear();
  }
  
  /**
   * Process received signal data
   */
  async processSignal(signal: SignalData): Promise<void> {
    if (!this.localPeerId) {
      throw new Error('WebRTC adapter not initialized');
    }
    
    const { type, sender, payload } = signal;
    const remotePeerId = PeerId.fromString(sender);
    
    console.log(`Processing signal of type ${type} from ${sender}`);
    
    let connection = this.connections.get(sender);
    
    // If received offer but connection doesn't exist, create a new connection
    if (type === SignalType.OFFER && !connection) {
      await this.createConnection(remotePeerId, false);
      connection = this.connections.get(sender);
    }
    
    if (!connection) {
      console.error(`No connection found for peer ${sender}`);
      return;
    }
    
    try {
      switch (type) {
        case SignalType.OFFER: {
          const answer = await connection.createAnswer(payload.sdp);
          await this.signalHub.sendAnswer(remotePeerId.toString(), answer);
          break;
        }
          
        case SignalType.ANSWER:
          await connection.setRemoteAnswer(payload.sdp);
          break;
          
        case SignalType.ICE_CANDIDATE:
          if (payload.candidate) {
            await connection.addIceCandidate(payload.candidate);
          }
          break;
          
        default:
          console.warn(`Unknown signal type: ${type}`);
      }
    } catch (error) {
      console.error(`Error processing signal of type ${type}:`, error);
    }
  }
  
  /**
   * Send signal data
   */
  async sendSignal(recipientId: PeerId, signalType: SignalType, payload: any): Promise<void> {
    if (!this.localPeerId) {
      throw new Error('WebRTC adapter not initialized');
    }
    
    switch (signalType) {
      case SignalType.OFFER:
        await this.signalHub.sendOffer(recipientId.toString(), payload.sdp);
        break;
      case SignalType.ANSWER:
        await this.signalHub.sendAnswer(recipientId.toString(), payload.sdp);
        break;
      case SignalType.ICE_CANDIDATE:
        await this.signalHub.sendIceCandidate(recipientId.toString(), payload.candidate);
        break;
      default:
        console.warn(`Unknown signal type: ${signalType}`);
    }
  }
  
  /**
   * Activate fallback mode with peer
   */
  async activateFallback(peerId: PeerId): Promise<void> {
    await this.signalHub.activateWebRTCFallback(peerId.toString());
    this.notifyConnectionStateChange(peerId, ConnectionState.FALLBACK);
  }
  
  /**
   * Send data through fallback mechanism
   */
  async sendFallbackData(peerId: PeerId, channel: string, data: any): Promise<void> {
    await this.signalHub.relayData(peerId.toString(), {
      channel,
      data
    });
  }
  
  /**
   * Request reconnection with peer
   */
  async requestReconnect(peerId: PeerId): Promise<void> {
    await this.signalHub.requestReconnect(peerId.toString());
  }
  
  /**
   * Get connection state with peer
   */
  getConnectionState(peerId: PeerId): ConnectionState {
    const connection = this.connections.get(peerId.toString());
    return connection ? connection.getConnectionState() : ConnectionState.DISCONNECTED;
  }
  
  /**
   * Send data to specific peer
   */
  async sendData(peerId: PeerId, channel: string, data: any): Promise<void> {
    const connection = this.connections.get(peerId.toString());
    if (!connection) {
      // Check if using fallback mode
      if (this.getConnectionState(peerId) === ConnectionState.FALLBACK) {
        await this.sendFallbackData(peerId, channel, data);
        return;
      }
      
      throw new Error(`No connection found for peer ${peerId.toString()}`);
    }
    
    try {
      await connection.sendData(channel, data);
    } catch (error) {
      console.error(`Error sending data to peer ${peerId.toString()}:`, error);
      
      // If sending fails, try using fallback mode
      console.log(`Trying fallback mode for peer ${peerId.toString()}`);
      await this.activateFallback(peerId);
      await this.sendFallbackData(peerId, channel, data);
    }
  }
  
  /**
   * Broadcast data to all connected peers
   */
  async broadcastData(channel: string, data: any): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const [_peerIdStr, connection] of this.connections.entries()) {
      if (connection.getConnectionState() === ConnectionState.CONNECTED) {
        promises.push(connection.sendData(channel, data));
      }
    }
    
    await Promise.all(promises);
  }
  
  /**
   * Subscribe to data from specific channel
   */
  subscribe(channel: string, callback: (peerId: PeerId, data: any) => void): void {
    if (!this.channelSubscriptions.has(channel)) {
      this.channelSubscriptions.set(channel, new Set());
      
      // Set up subscription for each existing connection
      for (const [peerIdStr, connection] of this.connections.entries()) {
        const peerId = PeerId.fromString(peerIdStr);
        connection.subscribe(channel, (data) => {
          callback(peerId, data);
        });
      }
    }
    
    this.channelSubscriptions.get(channel)!.add(callback);
  }
  
  /**
   * Unsubscribe from specific channel
   */
  unsubscribe(channel: string, callback: (peerId: PeerId, data: any) => void): void {
    const subscriptions = this.channelSubscriptions.get(channel);
    if (subscriptions) {
      subscriptions.delete(callback);
    }
  }
  
  /**
   * Register connection state change listener
   */
  onConnectionStateChange(listener: (peerId: PeerId, state: ConnectionState) => void): void {
    this.stateChangeListeners.push(listener);
  }
  
  /**
   * Notify connection state change
   */
  private notifyConnectionStateChange(peerId: PeerId, state: ConnectionState): void {
    this.stateChangeListeners.forEach(listener => {
      listener(peerId, state);
    });
  }
  
  /**
   * Get all connected peers
   */
  getConnectedPeers(): PeerId[] {
    const connectedPeers: PeerId[] = [];
    
    for (const [peerIdStr, connection] of this.connections.entries()) {
      if (connection.getConnectionState() === ConnectionState.CONNECTED) {
        connectedPeers.push(PeerId.fromString(peerIdStr));
      }
    }
    
    return connectedPeers;
  }
} 
