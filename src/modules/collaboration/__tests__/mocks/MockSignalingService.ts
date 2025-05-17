import { SignalingService } from '../../domain/interfaces/SignalingService';
import { PeerId } from '../../domain/value-objects/PeerId';
import { RoomId } from '../../domain/value-objects/RoomId';
import { ConnectionState } from '../../domain/value-objects/ConnectionState';
import { injectable } from 'inversify';

@injectable()
export class MockSignalingService implements SignalingService {
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private listeners: { event: string; callback: (data: any) => void }[] = [];
  private currentRoomId: RoomId | null = null;
  private currentPeerId: PeerId | null = null;
  
  async connect(roomId: RoomId, peerId: PeerId): Promise<boolean> {
    const roomIdStr = roomId.toString();
    const peerIdStr = peerId.toString();
    
    console.log(`[MockSignalingService] 嘗試連接到房間 ${roomIdStr} 使用對等ID ${peerIdStr}`);
    
    this.connectionState = ConnectionState.CONNECTED;
    this.currentRoomId = roomId;
    this.currentPeerId = peerId;
    
    // 發送模擬的連接建立消息
    this.emit('connected', { roomId: roomIdStr, peerId: peerIdStr });
    
    // 嘗試多種格式的 JOIN 訊息
    console.log(`[MockSignalingService] 發送 JOIN 訊息到信令服務器，房間ID: ${roomIdStr}, 對等ID: ${peerIdStr}`);
    
    // 格式 1: 規格書標準格式
    const joinMessage1 = {
      type: 'join',
      payload: {
        roomId: roomIdStr,
        peerId: peerIdStr
      }
    };
    
    // 格式 2: 簡化格式
    const joinMessage2 = {
      action: 'join',
      roomId: roomIdStr,
      peerId: peerIdStr
    };
    
    // 格式 3: 直接傳遞字符串
    const joinMessage3 = `join:${roomIdStr}:${peerIdStr}`;
    
    console.log('[MockSignalingService] 嘗試規格書標準格式 JOIN 訊息');
    const joinSuccess1 = this.sendMessage(joinMessage1);
    
    console.log('[MockSignalingService] 嘗試簡化格式 JOIN 訊息');
    const joinSuccess2 = this.sendMessage(joinMessage2);
    
    console.log('[MockSignalingService] 嘗試直接字符串格式 JOIN 訊息');
    // 直接發出模擬的字符串消息
    this.emit('raw-message', joinMessage3);
    
    if (!joinSuccess1 && !joinSuccess2) {
      console.error('[MockSignalingService] 所有 JOIN 訊息格式發送都失敗');
    }
    
    console.log('[MockSignalingService] 已連接到信令服務器');
    
    return true;
  }
  
  async disconnect(): Promise<void> {
    this.connectionState = ConnectionState.DISCONNECTED;
    this.currentRoomId = null;
    this.currentPeerId = null;
    
    // 發送模擬的斷開連接消息
    this.emit('disconnected', {});
    console.log('[MockSignalingService] 已從信令服務器斷開連接');
  }
  
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }
  
  getCurrentRoomId(): RoomId | null {
    return this.currentRoomId;
  }
  
  getCurrentPeerId(): PeerId | null {
    return this.currentPeerId;
  }
  
  on(event: string, callback: (data: any) => void): void {
    this.listeners.push({ event, callback });
  }
  
  off(event: string, callback: (data: any) => void): void {
    const index = this.listeners.findIndex(
      (listener) => listener.event === event && listener.callback === callback
    );
    
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }
  
  private emit(event: string, data: any): void {
    this.listeners
      .filter((listener) => listener.event === event)
      .forEach((listener) => listener.callback(data));
  }
  
  sendMessage(message: any): boolean {
    console.log('[MockSignalingService] 發送消息:', message);
    return true;
  }
  
  sendOffer(to: PeerId, offer: RTCSessionDescriptionInit): boolean {
    console.log(`[MockSignalingService] 發送 Offer 到 ${to.toString()}:`, offer);
    return true;
  }
  
  sendAnswer(to: PeerId, answer: RTCSessionDescriptionInit): boolean {
    console.log(`[MockSignalingService] 發送 Answer 到 ${to.toString()}:`, answer);
    return true;
  }
  
  sendIceCandidate(to: PeerId, candidate: RTCIceCandidate): boolean {
    console.log(`[MockSignalingService] 發送 ICE Candidate 到 ${to.toString()}:`, candidate);
    return true;
  }
  
  sendReconnectRequest(to: PeerId): boolean {
    console.log(`[MockSignalingService] 發送重連請求到 ${to.toString()}`);
    return true;
  }
  
  activateFallback(to: PeerId): boolean {
    console.log(`[MockSignalingService] 啟用備援模式，通知 ${to.toString()}`);
    return true;
  }
  
  relayData(to: PeerId, channel: string, data: any): boolean {
    console.log(`[MockSignalingService] 中繼數據至 ${to.toString()} 通道 ${channel}:`, data);
    return true;
  }
  
  // 模擬發送 ROOM_STATE 訊息
  sendRoomState(roomId: string, players: string[], ownerId: string, rules: any): boolean {
    console.log('[MockSignalingService] 發送房間狀態訊息');
    this.emit('room-state', {
      roomId,
      players,
      ownerId,
      rules
    });
    return true;
  }
  
  // 模擬發送 PLAYER_JOINED 訊息
  sendPlayerJoined(peerId: string, roomId: string, totalPlayers: number, isRoomOwner: boolean): boolean {
    console.log('[MockSignalingService] 發送玩家加入訊息');
    this.emit('player-joined', {
      peerId,
      roomId,
      totalPlayers,
      isRoomOwner
    });
    return true;
  }
  
  // 模擬發送 PLAYER_LEFT 訊息
  sendPlayerLeft(peerId: string, roomId: string): boolean {
    console.log('[MockSignalingService] 發送玩家離開訊息');
    this.emit('player-left', {
      peerId,
      roomId
    });
    return true;
  }
} 
