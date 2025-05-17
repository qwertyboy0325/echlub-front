import { PeerConnectionManager } from '../../domain/interfaces/PeerConnectionManager';
import { PeerId } from '../../domain/value-objects/PeerId';
import { ConnectionState } from '../../domain/value-objects/ConnectionState';
import { injectable } from 'inversify';

@injectable()
export class MockPeerConnectionManager implements PeerConnectionManager {
  private localPeerId: PeerId | null = null;
  private connections: Map<string, ConnectionState> = new Map();
  private dataHandlers: Map<string, ((peerId: PeerId, data: any) => void)[]> = new Map();
  
  async initialize(localPeerId: PeerId): Promise<void> {
    this.localPeerId = localPeerId;
    console.log(`[MockPeerConnectionManager] 初始化，本地 PeerId: ${localPeerId.toString()}`);
  }
  
  async connect(remotePeerId: PeerId, initiator: boolean): Promise<boolean> {
    this.connections.set(remotePeerId.toString(), ConnectionState.CONNECTED);
    console.log(`[MockPeerConnectionManager] 連接到 ${remotePeerId.toString()}, 發起者: ${initiator}`);
    return true;
  }
  
  async disconnect(remotePeerId: PeerId): Promise<void> {
    this.connections.delete(remotePeerId.toString());
    console.log(`[MockPeerConnectionManager] 斷開與 ${remotePeerId.toString()} 的連接`);
  }
  
  async disconnectAll(): Promise<void> {
    this.connections.clear();
    console.log('[MockPeerConnectionManager] 斷開所有連接');
  }
  
  sendData(remotePeerId: PeerId, channel: string, data: any): boolean {
    if (!this.connections.has(remotePeerId.toString())) {
      console.log(`[MockPeerConnectionManager] 無法發送數據到 ${remotePeerId.toString()}: 未連接`);
      return false;
    }
    
    console.log(`[MockPeerConnectionManager] 發送數據到 ${remotePeerId.toString()}, 通道: ${channel}`, data);
    return true;
  }
  
  broadcastData(channel: string, data: any): void {
    const connectedPeers = Array.from(this.connections.keys());
    console.log(`[MockPeerConnectionManager] 廣播數據到 ${connectedPeers.length} 個對等節點, 通道: ${channel}`, data);
    
    // 模擬數據回送
    if (this.dataHandlers.has(channel)) {
      const handlers = this.dataHandlers.get(channel) || [];
      connectedPeers.forEach(peerId => {
        const peerIdObj = PeerId.fromString(peerId);
        handlers.forEach(handler => {
          // 模擬發送後的接收回應
          handler(peerIdObj, { ...data, _mockResponse: true });
        });
      });
    }
  }
  
  getConnectionState(peerId: PeerId): ConnectionState {
    return this.connections.get(peerId.toString()) || ConnectionState.DISCONNECTED;
  }
  
  subscribeToData(channel: string, handler: (peerId: PeerId, data: any) => void): void {
    if (!this.dataHandlers.has(channel)) {
      this.dataHandlers.set(channel, []);
    }
    
    const handlers = this.dataHandlers.get(channel) || [];
    handlers.push(handler);
    
    console.log(`[MockPeerConnectionManager] 訂閱通道: ${channel}`);
  }
  
  unsubscribeFromData(channel: string, handler: (peerId: PeerId, data: any) => void): void {
    if (!this.dataHandlers.has(channel)) {
      return;
    }
    
    const handlers = this.dataHandlers.get(channel) || [];
    const index = handlers.indexOf(handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
      console.log(`[MockPeerConnectionManager] 取消訂閱通道: ${channel}`);
    }
  }
  
  getConnectedPeers(): PeerId[] {
    return Array.from(this.connections.keys()).map(PeerId.fromString);
  }
  
  isConnectedTo(peerId: PeerId): boolean {
    return this.connections.has(peerId.toString());
  }
  
  handleIceCandidate(remotePeerId: PeerId, candidate: RTCIceCandidateInit): void {
    console.log(`[MockPeerConnectionManager] 處理來自 ${remotePeerId.toString()} 的 ICE 候選項`, candidate);
  }
  
  async handleRemoteOffer(remotePeerId: PeerId, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    console.log(`[MockPeerConnectionManager] 處理來自 ${remotePeerId.toString()} 的 Offer`, offer);
    
    // 模擬生成 Answer
    const answer = { type: 'answer', sdp: 'mock_sdp_answer' } as RTCSessionDescriptionInit;
    
    // 連接到對方
    this.connections.set(remotePeerId.toString(), ConnectionState.CONNECTED);
    
    return answer;
  }
  
  async handleRemoteAnswer(remotePeerId: PeerId, answer: RTCSessionDescriptionInit): Promise<void> {
    console.log(`[MockPeerConnectionManager] 處理來自 ${remotePeerId.toString()} 的 Answer`, answer);
    
    // 確保連接狀態為已連接
    this.connections.set(remotePeerId.toString(), ConnectionState.CONNECTED);
  }
} 
