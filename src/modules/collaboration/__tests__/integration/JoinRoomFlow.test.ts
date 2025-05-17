import { Container } from 'inversify';
import { CollaborationTypes } from '../../di/CollaborationTypes';
import { PeerId } from '../../domain/value-objects/PeerId';
import { RoomId } from '../../domain/value-objects/RoomId';
import type { CollaborationService } from '../../application/services/CollaborationService';
import { CollaborationServiceImplementation } from '../../application/services/CollaborationServiceImplementation';
import { MockCollaborationApiAdapter } from '../mocks/MockCollaborationApiAdapter';
import { MockSignalingService } from '../mocks/MockSignalingService';
import { MockPeerConnectionManager } from '../mocks/MockPeerConnectionManager';
import { MockEventBus } from '../mocks/MockEventBus';
import { TYPES } from '../../../../core/di/types';
import { v4 as uuidv4 } from 'uuid';

// 確保UUID生成器設置好
PeerId.setGenerator(() => uuidv4());
RoomId.setGenerator(() => uuidv4());

describe('加入房間流程測試', () => {
  let container: Container;
  let collaborationService: CollaborationService;
  let mockApiAdapter: MockCollaborationApiAdapter;
  let mockSignalingService: MockSignalingService;
  let mockEventBus: MockEventBus;
  let localPeerId: PeerId;
  
  beforeEach(() => {
    container = new Container();
    
    // 註冊 mock 服務
    mockApiAdapter = new MockCollaborationApiAdapter();
    mockSignalingService = new MockSignalingService();
    const mockPeerConnectionManager = new MockPeerConnectionManager();
    mockEventBus = new MockEventBus();
    
    container.bind(CollaborationTypes.CollaborationApiAdapter).toConstantValue(mockApiAdapter);
    container.bind(CollaborationTypes.SignalingService).toConstantValue(mockSignalingService);
    container.bind(CollaborationTypes.PeerConnectionManager).toConstantValue(mockPeerConnectionManager);
    container.bind(TYPES.EventBus).toConstantValue(mockEventBus);
    
    container.bind<CollaborationService>(CollaborationTypes.CollaborationService)
      .to(CollaborationServiceImplementation)
      .inSingletonScope();
    
    collaborationService = container.get<CollaborationService>(CollaborationTypes.CollaborationService);
    localPeerId = PeerId.create();
  });
  
  test('加入房間應該按照規格書流程執行', async () => {
    // 1. 初始化服務
    await collaborationService.initialize(localPeerId);
    
    // 2. 創建房間
    const roomId = await collaborationService.createRoom(
      localPeerId,
      '測試用戶',
      '測試房間',
      4,
      true,
      100,
      32000
    );
    
    expect(roomId).not.toBeNull();
    
    // 設置 mock 方法的間諜，以追蹤呼叫順序
    const getRoomSpy = jest.spyOn(mockApiAdapter, 'getRoom');
    const joinRoomSpy = jest.spyOn(mockApiAdapter, 'joinRoom');
    const connectSpy = jest.spyOn(mockSignalingService, 'connect');
    const sendMessageSpy = jest.spyOn(mockSignalingService, 'sendMessage');
    
    // 3. 重新加入房間
    // 確保前面的 joinRoom 測試不會影響這部分
    mockSignalingService.disconnect();
    
    // 執行加入房間操作
    await collaborationService.joinRoom(roomId!);
    
    // 4. 驗證流程
    // 檢查是否呼叫了 joinRoom，它內部應該只調用 getRoom
    expect(joinRoomSpy).toHaveBeenCalledWith(roomId, expect.anything());
    
    // 檢查 joinRoom 是否按照規格書流程執行:
    // a. 呼叫 API 取得房間信息
    // b. 連接 WebSocket
    
    // 驗證連接到 WebSocket
    expect(connectSpy).toHaveBeenCalledWith(roomId, localPeerId);
    
    // 確認 API 适配器的 joinRoom 中沒有出現 POST 請求
    // 應該只是調用了 getRoom
    expect(getRoomSpy).toHaveBeenCalled();

    // 檢查是否發送了符合規格書 5.3.1 定義的 JOIN 訊息
    expect(sendMessageSpy).toHaveBeenCalledWith(expect.objectContaining({
      type: 'join',
      payload: expect.objectContaining({
        roomId: roomId!.toString(),
        peerId: localPeerId.toString()
      })
    }));
  });
  
  test('沒有發送 POST 請求到 joinRoom API 端點', async () => {
    // 測試 MockCollaborationApiAdapter 中的 joinRoom 方法
    // 確保它只調用 getRoom
    const roomId = RoomId.fromString(uuidv4());
    const peerId = PeerId.create();
    
    const getRoom = jest.spyOn(mockApiAdapter, 'getRoom');
    
    await mockApiAdapter.joinRoom(roomId, { peerId: peerId.toString() });
    
    // 確保 joinRoom 調用了 getRoom
    expect(getRoom).toHaveBeenCalledWith(roomId);
  });

  test('應該正確處理所有房間事件訊息', async () => {
    // 1. 初始化服務
    await collaborationService.initialize(localPeerId);
    
    // 2. 創建房間
    const roomId = await collaborationService.createRoom(
      localPeerId,
      '測試用戶',
      '測試房間',
      4,
      true,
      100,
      32000
    );
    
    expect(roomId).not.toBeNull();
    
    // 設置 mock 方法的間諜
    const emitSpy = jest.spyOn(mockEventBus, 'emit');
    
    // 3. 模擬接收房間狀態訊息
    const roomStatePayload = {
      roomId: roomId!.toString(),
      players: [localPeerId.toString(), 'other-peer-1', 'other-peer-2'],
      ownerId: localPeerId.toString(),
      rules: {
        maxPlayers: 4,
        allowRelay: true,
        latencyTargetMs: 100,
        opusBitrate: 32000
      }
    };
    mockSignalingService.emit('room-state', roomStatePayload);
    
    // 驗證房間狀態事件被正確發布
    expect(emitSpy).toHaveBeenCalledWith('collab.room-state-updated', roomStatePayload);
    
    // 4. 模擬接收玩家加入訊息
    const playerJoinedPayload = {
      peerId: 'new-peer',
      roomId: roomId!.toString(),
      totalPlayers: 4,
      isRoomOwner: false
    };
    mockSignalingService.emit('player-joined', playerJoinedPayload);
    
    // 驗證玩家加入事件被正確發布
    expect(emitSpy).toHaveBeenCalledWith('collab.player-joined', playerJoinedPayload);
    
    // 5. 模擬接收玩家離開訊息
    const playerLeftPayload = {
      peerId: 'other-peer-1',
      roomId: roomId!.toString()
    };
    mockSignalingService.emit('player-left', playerLeftPayload);
    
    // 驗證玩家離開事件被正確發布
    expect(emitSpy).toHaveBeenCalledWith('collab.player-left', playerLeftPayload);
  });
}); 
