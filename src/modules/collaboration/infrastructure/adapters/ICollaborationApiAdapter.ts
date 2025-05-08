import { RoomId } from '../../domain/value-objects/RoomId';
import { PeerId } from '../../domain/value-objects/PeerId';
import { RoomRuleVO } from '../../domain/value-objects/RoomRuleVO';

/**
 * 房間資訊回應介面
 */
export interface RoomResponse {
  id: string;
  ownerId: string;
  active: boolean;
  maxPlayers: number;
  currentPlayers: string[];
  rules: {
    maxPlayers: number;
    allowRelay: boolean;
    latencyTargetMs: number;
    opusBitrate: number;
  };
}

/**
 * 創建房間請求
 */
export interface CreateRoomRequest {
  ownerId: string;
  maxPlayers: number;
  allowRelay: boolean;
  latencyTargetMs: number;
  opusBitrate: number;
}

/**
 * 更新房間規則請求
 */
export interface UpdateRoomRulesRequest {
  ownerId: string;
  maxPlayers: number;
  allowRelay: boolean;
  latencyTargetMs: number;
  opusBitrate: number;
}

/**
 * 關閉房間請求
 */
export interface CloseRoomRequest {
  ownerId: string;
}

/**
 * API 回應結果
 */
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

/**
 * 協作 API 適配器介面
 * 用於與後端協作 API 通信
 */
export interface ICollaborationApiAdapter {
  /**
   * 創建新房間
   * @param request 創建房間請求
   */
  createRoom(request: CreateRoomRequest): Promise<ApiResponse<{ roomId: string }>>;
  
  /**
   * 取得房間狀態
   * @param roomId 房間 ID
   */
  getRoom(roomId: RoomId): Promise<ApiResponse<RoomResponse>>;
  
  /**
   * 更新房間規則
   * @param roomId 房間 ID
   * @param request 更新規則請求
   */
  updateRoomRules(roomId: RoomId, request: UpdateRoomRulesRequest): Promise<ApiResponse<void>>;
  
  /**
   * 關閉房間
   * @param roomId 房間 ID
   * @param request 關閉房間請求
   */
  closeRoom(roomId: RoomId, request: CloseRoomRequest): Promise<ApiResponse<void>>;
} 