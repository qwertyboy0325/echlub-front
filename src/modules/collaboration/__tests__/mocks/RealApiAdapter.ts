import { injectable, inject } from 'inversify';
import { TYPES } from '../../../../core/di/types';
import type { 
  ICollaborationApiAdapter, 
  ApiResponse,
  RoomResponse,
  CreateRoomRequest, 
  UpdateRoomRulesRequest, 
  CloseRoomRequest 
} from '../../infrastructure/adapters/ICollaborationApiAdapter';
import { RoomId } from '../../domain/value-objects/RoomId';
// 在 Node.js 測試環境中使用 node-fetch 模擬瀏覽器環境
import fetch from 'node-fetch';

/**
 * 真實連接的 API 適配器測試版本
 * 模擬 Web 連線到後端的行為
 */
@injectable()
export class TestApiAdapter implements ICollaborationApiAdapter {
  private apiBaseUrl: string;
  
  constructor(
    @inject(TYPES.ENV_CONFIG) private readonly config: { BASE_URL: string }
  ) {
    // 確保 API URL 有正確的協議前綴
    let baseUrl = config.BASE_URL;
    if (!baseUrl) {
      baseUrl = 'localhost:3000';
    }
    
    // 將基礎 URL 轉換為 API URL
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      this.apiBaseUrl = `http://${baseUrl}/api`;
    } else {
      this.apiBaseUrl = `${baseUrl}/api`;
    }
    
    // 顯示 WebSocket URL（加上協議前綴）
    let wsUrl = baseUrl;
    if (!wsUrl.startsWith('ws://') && !wsUrl.startsWith('wss://')) {
      wsUrl = `ws://${wsUrl}`;
    }
    
    console.log(`TestApiAdapter initialized with base URL: ${baseUrl}`);
    console.log(`API調用將使用: ${this.apiBaseUrl}`);
    console.log(`WebSocket將連接到: ${wsUrl}/collaboration`);
  }
  
  /**
   * 創建房間
   */
  async createRoom(request: CreateRoomRequest): Promise<ApiResponse<{ roomId: string }>> {
    try {
      console.log(`嘗試創建房間，API URL: ${this.apiBaseUrl}/rooms`);
      console.log(`請求資料: ${JSON.stringify(request)}`);
      
      const response = await fetch(`${this.apiBaseUrl}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`房間創建成功，回應: ${JSON.stringify(data)}`);
      
      return {
        data: { roomId: data.roomId || data.data?.roomId || data.id || data },
        message: 'Room created successfully'
      };
    } catch (error) {
      console.error('Error creating room:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to create room'
      };
    }
  }
  
  /**
   * 獲取房間狀態
   */
  async getRoom(roomId: RoomId): Promise<ApiResponse<RoomResponse>> {
    try {
      console.log(`嘗試獲取房間，API URL: ${this.apiBaseUrl}/rooms/${roomId.toString()}`);
      
      const response = await fetch(`${this.apiBaseUrl}/rooms/${roomId.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      console.log(`房間獲取成功，回應: ${JSON.stringify(responseData)}`);
      
      // 確保回應數據符合 RoomResponse 結構
      const data = responseData.data || responseData;
      
      // 格式化數據以符合接口
      const roomData: RoomResponse = {
        id: data.id || data.roomId || roomId.toString(),
        ownerId: data.ownerId || (data.players && data.players.find((p: any) => p.isOwner)?.id) || '',
        active: data.active !== undefined ? data.active : true,
        maxPlayers: data.maxPlayers || data.rules?.maxPlayers || 4,
        currentPlayers: data.currentPlayers || (data.players ? data.players.map((p: any) => p.id) : []),
        rules: {
          maxPlayers: data.rules?.maxPlayers || data.maxPlayers || 4,
          allowRelay: data.rules?.allowRelay !== undefined ? data.rules.allowRelay : true,
          latencyTargetMs: data.rules?.latencyTargetMs || 100,
          opusBitrate: data.rules?.opusBitrate || 32000
        }
      };
      
      return { data: roomData };
    } catch (error) {
      console.error('Error getting room:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get room'
      };
    }
  }
  
  /**
   * 更新房間規則
   */
  async updateRoomRules(roomId: RoomId, request: UpdateRoomRulesRequest): Promise<ApiResponse<void>> {
    try {
      console.log(`嘗試更新房間規則，API URL: ${this.apiBaseUrl}/rooms/${roomId.toString()}/rules`);
      console.log(`請求資料: ${JSON.stringify(request)}`);
      
      const response = await fetch(`${this.apiBaseUrl}/rooms/${roomId.toString()}/rules`, {
        method: 'PATCH', // 根據規格書應該使用 PATCH
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`房間規則更新成功，回應: ${JSON.stringify(data)}`);
      
      return {
        message: 'Room rules updated successfully'
      };
    } catch (error) {
      console.error('Error updating room rules:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to update room rules'
      };
    }
  }
  
  /**
   * 關閉房間
   */
  async closeRoom(roomId: RoomId, request: CloseRoomRequest): Promise<ApiResponse<void>> {
    try {
      console.log(`嘗試關閉房間，API URL: ${this.apiBaseUrl}/rooms/${roomId.toString()}`);
      console.log(`請求資料: ${JSON.stringify(request)}`);
      
      // 根據規格書，關閉房間應該使用 DELETE 方法
      const url = `${this.apiBaseUrl}/rooms/${roomId.toString()}?ownerId=${request.ownerId}`;
      console.log(`完整請求URL: ${url}`);
      
      const response = await fetch(url, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`房間關閉成功，回應: ${JSON.stringify(data)}`);
      
      return {
        message: 'Room closed successfully'
      };
    } catch (error) {
      console.error('Error closing room:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to close room'
      };
    }
  }
} 
