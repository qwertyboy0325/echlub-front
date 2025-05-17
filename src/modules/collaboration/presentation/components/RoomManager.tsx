import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PeerId } from '../../domain/value-objects/PeerId';
import { RoomId } from '../../domain/value-objects/RoomId';
import type { CollaborationService } from '../../application/services/CollaborationService';
import { Container } from 'inversify';
import { CollaborationTypes } from '../../di/CollaborationTypes';
import { v4 as uuidv4 } from 'uuid';
import './RoomManager.css';

interface RoomManagerProps {
  diContainer: Container;
  username: string;
}

// 確保 UUID 生成器設置好
PeerId.setGenerator(() => uuidv4());
RoomId.setGenerator(() => uuidv4());

const RoomManager: React.FC<RoomManagerProps> = ({ diContainer, username }) => {
  const navigate = useNavigate();
  const [localPeerId] = useState(() => PeerId.create());
  const [collaborationService, setCollaborationService] = useState<CollaborationService | null>(null);
  const [roomId, setRoomId] = useState('');
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 初始化協作服務
  useEffect(() => {
    const initService = async () => {
      try {
        const service = diContainer.get<CollaborationService>(CollaborationTypes.CollaborationService);
        await service.initialize(localPeerId);
        setCollaborationService(service);
        setIsInitialized(true);
      } catch (err) {
        console.error('初始化協作服務失敗:', err);
        setError('無法初始化協作服務，請重新整理頁面');
      }
    };

    initService();
  }, [diContainer, localPeerId]);

  // 創建房間
  const handleCreateRoom = useCallback(async () => {
    if (!collaborationService || !isInitialized) {
      setError('協作服務尚未初始化');
      return;
    }

    try {
      setIsCreatingRoom(true);
      setError(null);

      const newRoomId = await collaborationService.createRoom(
        localPeerId,
        username,
        roomName,
        maxPlayers,
        true,  // 允許中繼
        100,   // 延遲目標 (毫秒)
        32000  // Opus 位元率
      );

      if (newRoomId) {
        // 導航到房間頁面
        navigate(`/collaboration/room/${newRoomId.toString()}`);
      } else {
        setError('創建房間失敗，請重試');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '創建房間時發生未知錯誤';
      setError(errorMsg);
    } finally {
      setIsCreatingRoom(false);
    }
  }, [collaborationService, isInitialized, localPeerId, username, roomName, maxPlayers, navigate]);

  // 加入房間
  const handleJoinRoom = useCallback(async () => {
    if (!collaborationService || !isInitialized) {
      setError('協作服務尚未初始化');
      return;
    }

    if (!roomId || !RoomId.isValid(roomId)) {
      setError('請輸入有效的房間 ID');
      return;
    }

    try {
      setIsJoiningRoom(true);
      setError(null);

      console.log(`[RoomManager] 開始加入房間 (${roomId})...`);
      
      // 將此房間ID轉換為對象
      const roomIdObj = RoomId.fromString(roomId);
      
      // 加入房間 (這將自動 1. 獲取房間信息 2. 連接WebSocket)
      await collaborationService.joinRoom(roomIdObj);
      
      // 導航到房間頁面
      console.log(`[RoomManager] 成功加入房間，導航至房間頁面`);
      navigate(`/collaboration/room/${roomId}`);
    } catch (err) {
      console.error(`[RoomManager] 加入房間失敗:`, err);
      const errorMsg = err instanceof Error ? err.message : '加入房間時發生未知錯誤';
      setError(errorMsg);
    } finally {
      setIsJoiningRoom(false);
    }
  }, [collaborationService, isInitialized, roomId, navigate]);

  return (
    <div className="room-manager-container">
      <div className="room-manager-header">
        <h2>協作模式</h2>
        <div className="peer-info">
          <span>您的 ID: </span>
          <code>{localPeerId.toString()}</code>
        </div>
      </div>

      {error && (
        <div className="room-manager-error">
          {error}
        </div>
      )}

      <div className="room-manager-content">
        <div className="room-section">
          <h3>創建新房間</h3>
          <div className="form-group">
            <label>房間名稱</label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="輸入房間名稱"
            />
          </div>
          
          <div className="form-group">
            <label>最大人數</label>
            <select 
              value={maxPlayers} 
              onChange={(e) => setMaxPlayers(Number(e.target.value))}
            >
              <option value="2">2</option>
              <option value="4">4</option>
              <option value="6">6</option>
              <option value="8">8</option>
            </select>
          </div>
          
          <button 
            className="create-button"
            onClick={handleCreateRoom}
            disabled={!isInitialized || isCreatingRoom || !roomName}
          >
            {isCreatingRoom ? '創建中...' : '創建房間'}
          </button>
        </div>

        <div className="room-divider"></div>

        <div className="room-section">
          <h3>加入現有房間</h3>
          <div className="form-group">
            <label>房間 ID</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="輸入房間 ID"
            />
          </div>
          
          <button 
            className="join-button"
            onClick={handleJoinRoom}
            disabled={!isInitialized || isJoiningRoom || !roomId}
          >
            {isJoiningRoom ? '加入中...' : '加入房間'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomManager; 