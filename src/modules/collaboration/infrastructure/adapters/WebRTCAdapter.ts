import { injectable, inject } from 'inversify';
import { IWebRTCAdapter, SignalData, SignalType } from './IWebRTCAdapter';
import { PeerId } from '../../domain/value-objects/PeerId';
import { ConnectionState } from '../../domain/value-objects/ConnectionState';
import { CollaborationTypes } from '../../di/CollaborationTypes';
import { ISignalHubAdapter } from './ISignalHubAdapter';

/**
 * WebRTC 對等連接選項
 */
interface RTCPeerOptions {
  iceServers: RTCIceServer[];
  iceCandidatePoolSize?: number;
  bundlePolicy?: RTCBundlePolicy;
}

/**
 * WebRTC 連接包裝器
 */
class PeerConnection {
  private connection: RTCPeerConnection;
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  private state: ConnectionState = ConnectionState.DISCONNECTED;
  private listeners: ((state: ConnectionState) => void)[] = [];
  private channelListeners: Map<string, Set<(data: any) => void>> = new Map();
  
  constructor(
    private readonly remotePeerId: PeerId,
    private readonly options: RTCPeerOptions
  ) {
    this.connection = new RTCPeerConnection(options);
    
    // 監聽 ICE 連接狀態變更
    this.connection.oniceconnectionstatechange = () => {
      this.updateState(this.mapIceStateToConnectionState(this.connection.iceConnectionState));
    };
  }
  
  /**
   * 創建新的數據通道
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
   * 設置數據通道處理器
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
   * 監聽數據通道接收
   */
  onDataChannel(event: RTCDataChannelEvent): void {
    const channel = event.channel;
    this.setupDataChannel(channel);
    this.dataChannels.set(channel.label, channel);
  }
  
  /**
   * 創建連接提議
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    const offer = await this.connection.createOffer();
    await this.connection.setLocalDescription(offer);
    return offer;
  }
  
  /**
   * 設置遠程提議並創建應答
   */
  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    await this.connection.setRemoteDescription(offer);
    const answer = await this.connection.createAnswer();
    await this.connection.setLocalDescription(answer);
    return answer;
  }
  
  /**
   * 設置遠程應答
   */
  async setRemoteAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    await this.connection.setRemoteDescription(answer);
  }
  
  /**
   * 添加 ICE 候選者
   */
  async addIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
    await this.connection.addIceCandidate(candidate);
  }
  
  /**
   * 發送數據
   */
  async sendData(channelName: string, data: any): Promise<void> {
    const channel = this.dataChannels.get(channelName);
    if (!channel) {
      const newChannel = this.createDataChannel(channelName);
      
      // 等待通道打開
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
   * 訂閱通道數據
   */
  subscribe(channelName: string, callback: (data: any) => void): void {
    if (!this.channelListeners.has(channelName)) {
      this.channelListeners.set(channelName, new Set());
    }
    
    this.channelListeners.get(channelName)!.add(callback);
  }
  
  /**
   * 取消訂閱通道數據
   */
  unsubscribe(channelName: string, callback: (data: any) => void): void {
    const listeners = this.channelListeners.get(channelName);
    if (listeners) {
      listeners.delete(callback);
    }
  }
  
  /**
   * 關閉連接
   */
  close(): void {
    // 關閉所有數據通道
    this.dataChannels.forEach(channel => {
      channel.close();
    });
    
    // 關閉 RTCPeerConnection
    this.connection.close();
    this.updateState(ConnectionState.DISCONNECTED);
  }
  
  /**
   * 獲取 ICE 連接狀態
   */
  getIceState(): RTCIceConnectionState {
    return this.connection.iceConnectionState;
  }
  
  /**
   * 獲取連接狀態
   */
  getConnectionState(): ConnectionState {
    return this.state;
  }
  
  /**
   * 更新連接狀態
   */
  private updateState(newState: ConnectionState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.listeners.forEach(listener => listener(newState));
    }
  }
  
  /**
   * 映射 WebRTC ICE 狀態到應用連接狀態
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
   * 註冊狀態變更監聽器
   */
  onStateChange(listener: (state: ConnectionState) => void): void {
    this.listeners.push(listener);
  }
  
  /**
   * 獲取 ICE 候選者
   */
  onIceCandidate(callback: (candidate: RTCIceCandidate | null) => void): void {
    this.connection.onicecandidate = (event) => {
      callback(event.candidate);
    };
  }
}

/**
 * WebRTC 適配器實現
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
   * 獲取 ICE 服務器配置
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
   * 初始化 WebRTC 適配器
   */
  async initialize(localPeerId: PeerId): Promise<void> {
    this.localPeerId = localPeerId;
    
    // 訂閱信號服務器的信令消息
    this.signalHub.subscribe('webrtc-signal', this.handleIncomingSignal.bind(this));
    
    console.log(`WebRTC adapter initialized with local peer ID: ${localPeerId.toString()}`);
  }
  
  /**
   * 創建新的對等連接
   */
  async createConnection(remotePeerId: PeerId, initiator: boolean): Promise<void> {
    if (!this.localPeerId) {
      throw new Error('WebRTC adapter not initialized');
    }
    
    const peerIdStr = remotePeerId.toString();
    
    // 檢查是否已存在連接
    if (this.connections.has(peerIdStr)) {
      console.log(`Connection with ${peerIdStr} already exists`);
      return;
    }
    
    console.log(`Creating new connection with ${peerIdStr}, initiator: ${initiator}`);
    
    // 創建新連接
    const peerConnection = new PeerConnection(remotePeerId, {
      iceServers: this.getIceServers(),
      iceCandidatePoolSize: 10
    });
    
    // 監聽連接狀態變更
    peerConnection.onStateChange((state) => {
      this.notifyConnectionStateChange(remotePeerId, state);
    });
    
    // 監聽 ICE 候選者
    peerConnection.onIceCandidate((candidate) => {
      if (candidate) {
        this.sendSignal(
          remotePeerId,
          SignalType.ICE_CANDIDATE,
          { candidate: candidate.toJSON() }
        );
      }
    });
    
    // 儲存連接
    this.connections.set(peerIdStr, peerConnection);
    
    // 如果是發起方，創建並發送提議
    if (initiator) {
      try {
        const offer = await peerConnection.createOffer();
        await this.sendSignal(remotePeerId, SignalType.OFFER, { sdp: offer });
      } catch (error) {
        console.error('Error creating offer:', error);
        this.closeConnection(remotePeerId);
      }
    }
  }
  
  /**
   * 關閉與特定對等方的連接
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
   * 關閉所有連接
   */
  async closeAllConnections(): Promise<void> {
    for (const [peerIdStr, connection] of this.connections.entries()) {
      connection.close();
      this.notifyConnectionStateChange(PeerId.fromString(peerIdStr), ConnectionState.DISCONNECTED);
    }
    
    this.connections.clear();
  }
  
  /**
   * 處理接收到的信令數據
   */
  async processSignal(signal: SignalData): Promise<void> {
    if (!this.localPeerId) {
      throw new Error('WebRTC adapter not initialized');
    }
    
    const { type, sender, payload } = signal;
    const remotePeerId = PeerId.fromString(sender);
    
    console.log(`Processing signal of type ${type} from ${sender}`);
    
    let connection = this.connections.get(sender);
    
    // 如果收到提議但連接不存在，創建一個新連接
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
        case SignalType.OFFER:
          const answer = await connection.createAnswer(payload.sdp);
          await this.sendSignal(remotePeerId, SignalType.ANSWER, { sdp: answer });
          break;
          
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
   * 發送信令數據
   */
  async sendSignal(recipientId: PeerId, signalType: SignalType, payload: any): Promise<void> {
    if (!this.localPeerId) {
      throw new Error('WebRTC adapter not initialized');
    }
    
    const signal: SignalData = {
      type: signalType,
      sender: this.localPeerId.toString(),
      recipient: recipientId.toString(),
      payload
    };
    
    await this.signalHub.send('webrtc-signal', signal);
  }
  
  /**
   * 獲取與對等方的連接狀態
   */
  getConnectionState(peerId: PeerId): ConnectionState {
    const connection = this.connections.get(peerId.toString());
    return connection ? connection.getConnectionState() : ConnectionState.DISCONNECTED;
  }
  
  /**
   * 發送數據至特定對等方
   */
  async sendData(peerId: PeerId, channel: string, data: any): Promise<void> {
    const connection = this.connections.get(peerId.toString());
    if (!connection) {
      throw new Error(`No connection found for peer ${peerId.toString()}`);
    }
    
    await connection.sendData(channel, data);
  }
  
  /**
   * 廣播數據至所有已連接的對等方
   */
  async broadcastData(channel: string, data: any): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const [peerIdStr, connection] of this.connections.entries()) {
      if (connection.getConnectionState() === ConnectionState.CONNECTED) {
        promises.push(connection.sendData(channel, data));
      }
    }
    
    await Promise.all(promises);
  }
  
  /**
   * 訂閱特定通道的數據
   */
  subscribe(channel: string, callback: (peerId: PeerId, data: any) => void): void {
    if (!this.channelSubscriptions.has(channel)) {
      this.channelSubscriptions.set(channel, new Set());
      
      // 為每個現有連接設置訂閱
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
   * 取消訂閱特定通道
   */
  unsubscribe(channel: string, callback: (peerId: PeerId, data: any) => void): void {
    const subscriptions = this.channelSubscriptions.get(channel);
    if (subscriptions) {
      subscriptions.delete(callback);
    }
  }
  
  /**
   * 監聽連接狀態變化
   */
  onConnectionStateChange(listener: (peerId: PeerId, state: ConnectionState) => void): void {
    this.stateChangeListeners.push(listener);
  }
  
  /**
   * 通知連接狀態變化
   */
  private notifyConnectionStateChange(peerId: PeerId, state: ConnectionState): void {
    this.stateChangeListeners.forEach(listener => {
      listener(peerId, state);
    });
  }
  
  /**
   * 獲取所有已連接的對等方
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
  
  /**
   * 處理接收到的信令
   */
  private async handleIncomingSignal(signal: SignalData): Promise<void> {
    if (!this.localPeerId) {
      return;
    }
    
    // 確認信令是發送給本地對等方的
    if (signal.recipient === this.localPeerId.toString()) {
      await this.processSignal(signal);
    }
  }
} 