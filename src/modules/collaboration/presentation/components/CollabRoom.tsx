import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { CollaborationService } from '../../application/services/CollaborationService';
import { Container } from 'inversify';
import { CollaborationTypes } from '../../di/CollaborationTypes';
import { PeerId } from '../../domain/value-objects/PeerId';
import { RoomId } from '../../domain/value-objects/RoomId';
import { ConnectionState } from '../../domain/value-objects/ConnectionState';
import './CollaborationRoom.css';
import { IEventBus } from '../../../../core/event-bus/IEventBus';
import { TYPES } from '../../../../core/di/types';
import { SignalingService } from '../../domain/interfaces/SignalingService';

interface CollaborationRoomProps {
  diContainer: Container;
  username: string;
  localPeerId: PeerId;
}

// 聊天訊息介面
interface ChatMessage {
  id: string;
  sender: string;
  senderName: string;
  content: string;
  timestamp: Date;
}

// 聊天狀態介面
interface CollaborationState {
  peerStates: Record<string, any>;
}

// 伺服器日誌訊息介面
interface ServerLogMessage {
  id: string;
  content: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'error' | 'success' | 'json';
  jsonData?: any; // 添加 JSON 數據字段，用於顯示格式化的 JSON
}

// 連接狀態枚舉
enum JoinStage {
  INITIALIZING = '正在初始化',
  FETCHING_ROOM = '獲取房間信息',
  CONNECTING_WS = '連接信令服務器',
  ESTABLISHING_PEERS = '建立對等連接',
  COMPLETE = '連接完成',
  ERROR = '連接失敗'
}

const CollabRoom: React.FC<CollaborationRoomProps> = ({
  diContainer,
  username,
  localPeerId,
}) => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  
  // 啟用音頻設置
  const useAudio = false;
  
  const [collaborationService, setCollaborationService] = useState<CollaborationService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [peers, setPeers] = useState<{ id: string; state: ConnectionState; name?: string }[]>([]);
  const [roomInfo, setRoomInfo] = useState<any | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [collaborationState, setCollaborationState] = useState<CollaborationState>({
    peerStates: {}
  });
  const [joinStage, setJoinStage] = useState<JoinStage>(JoinStage.INITIALIZING);
  const [serverLogs, setServerLogs] = useState<ServerLogMessage[]>([]);
  const serverLogContainerRef = useRef<HTMLDivElement>(null);
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messageChannel = 'chat';

  // 處理聊天訊息
  const handleChatMessage = useCallback((peerId: PeerId, data: any) => {
    if (data && data.type === 'chat') {
      const newChatMessage: ChatMessage = {
        id: data.id || crypto.randomUUID(),
        sender: peerId.toString(),
        senderName: data.username || 'Unknown',
        content: data.content,
        timestamp: new Date(data.timestamp || Date.now())
      };
      
      setChatMessages(prev => [...prev, newChatMessage]);
    }
  }, []);

  // 添加服務器日誌
  const addServerLog = useCallback((
    content: string, 
    type: 'info' | 'warning' | 'error' | 'success' | 'json' = 'info',
    jsonData?: any
  ) => {
    const newLog: ServerLogMessage = {
      id: crypto.randomUUID(),
      content,
      timestamp: new Date(),
      type,
      jsonData
    };
    
    setServerLogs(prev => [...prev, newLog]);
    
    // 根據類型使用不同樣式在控制台顯示
    switch (type) {
      case 'error':
        console.error('%c[伺服器日誌] %c' + content, 
          'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;', 
          'color: #e74c3c; font-weight: bold;');
        break;
      case 'warning':
        console.warn('%c[伺服器日誌] %c' + content, 
          'background: #f39c12; color: white; padding: 2px 5px; border-radius: 3px;', 
          'color: #f39c12; font-weight: bold;');
        break;
      case 'success':
        console.log('%c[伺服器日誌] %c' + content, 
          'background: #27ae60; color: white; padding: 2px 5px; border-radius: 3px;', 
          'color: #27ae60; font-weight: bold;');
        break;
      case 'json':
        console.log('%c[伺服器日誌] %c' + content, 
          'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;', 
          'color: #3498db; font-weight: bold;');
        if (jsonData) {
          console.log('%c' + JSON.stringify(jsonData, null, 2), 
            'color: #2c3e50; background: #ecf0f1; padding: 5px; border-radius: 3px; border-left: 3px solid #3498db;');
        }
        break;
      default:
        console.log('%c[伺服器日誌] %c' + content, 
          'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;', 
          'color: #2c3e50;');
    }
  }, []);

  // 處理狀態更新
  const handleStateUpdate = useCallback((peerId: PeerId, data: any) => {
    console.log(`接收到狀態更新，來自: ${peerId.toString()}`, data);
    
    // 更新特定對等方的狀態
    setCollaborationState(prev => ({
      ...prev,
      peerStates: {
        ...prev.peerStates,
        [peerId.toString()]: data
      }
    }));
  }, []);

  // 處理音頻數據
  const handleAudioData = useCallback((peerId: PeerId, data: any) => {
    // 音頻處理邏輯 (實際實現時需要添加)
    console.log(`接收到音頻數據，來自: ${peerId.toString()}`);
  }, []);

  // 處理伺服器統計數據
  const handleServerStats = useCallback((data: any) => {
    console.log('%c處理伺服器統計數據', 
      'background: #1abc9c; color: white; padding: 2px 5px; border-radius: 3px;');
    
    // 判斷數據類型
    let dataType = 'unknown';
    let jsonData = data;
    
    // 處理不同格式的數據
    if (data && data.type) {
      dataType = data.type;
      
      // 如果是從 server-stats 事件過來的封裝數據
      if (data.data) {
        jsonData = data.data;
      }
    }
    
    // 顯示伺服器統計數據到日誌中
    addServerLog(`收到伺服器統計數據 - ${dataType}`, 'json', jsonData);
    
    // 如果是房間統計數據，更新相關狀態
    if (dataType === 'room-stats' || dataType === 'room-state') {
      // 根據數據類型更新 UI 狀態
      if (jsonData.players) {
        console.log(`%c房間中有 ${jsonData.players.length} 名玩家`, 
          'background: #27ae60; color: white; padding: 2px 5px; border-radius: 3px;');
      }
    }
  }, [addServerLog]);

  // 初始化協作服務
  useEffect(() => {
    if (!roomId) {
      navigate('/rooms');
      return;
    }

    const initService = async () => {
      try {
        setIsLoading(true);
        setJoinStage(JoinStage.INITIALIZING);
        console.log('正在獲取協作服務...');
        addServerLog('正在獲取協作服務...', 'info');
        const service = diContainer.get<CollaborationService>(CollaborationTypes.CollaborationService);
        
        // 初始化服務
        if (!service.isConnected()) {
          console.log(`初始化協作服務，本地 PeerId: ${localPeerId.toString()}`);
          addServerLog(`初始化協作服務，本地 PeerId: ${localPeerId.toString()}`, 'info');
          await service.initialize(localPeerId);
        }
        
        setCollaborationService(service);
        setIsInitialized(true);
        
        // 訂閱事件總線
        const eventBus = diContainer.get<IEventBus>(TYPES.EventBus);
        
        // 訂閱房間狀態更新事件
        eventBus.on('collab.room-state-updated', (payload: any) => {
          console.log('收到房間狀態更新:', payload);
          addServerLog(`收到房間狀態更新: ${payload.players?.length || 0} 位玩家在線`, 'info');
          
          // 如果有房間信息，更新房間信息
          if (payload.roomId && payload.players && payload.ownerId) {
            setRoomInfo((prev: any) => ({
              ...prev,
              id: payload.roomId,
              ownerId: payload.ownerId,
              currentPlayers: payload.players,
              rules: payload.rules || prev?.rules
            }));
          }
        });
        
        // 訂閱玩家加入事件
        eventBus.on('collab.player-joined', (payload: any) => {
          console.log('玩家加入房間:', payload);
          addServerLog(`玩家 ${payload.peerId} 加入房間，目前 ${payload.totalPlayers} 位玩家在線`, 'success');
        });
        
        // 訂閱玩家離開事件
        eventBus.on('collab.player-left', (payload: any) => {
          console.log('玩家離開房間:', payload);
          addServerLog(`玩家 ${payload.peerId} 離開房間`, 'warning');
        });
        
        // 訂閱連接失敗事件
        eventBus.on('collab.connection-failed', (payload: any) => {
          console.error('連接失敗:', payload);
          addServerLog(`連接失敗: ${payload.error || '未知錯誤'}`, 'error');
          setError(`連接失敗: ${payload.error || '未知錯誤'}`);
        });
        
        // 按照規格書的流程加入房間
        try {
          if (!roomId) {
            const errorMsg = '無效的房間ID';
            console.error('%c無效的房間ID %c- 未提供 roomId', 
              'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;',
              'color: #e74c3c;');
            addServerLog(errorMsg, 'error');
            throw new Error(errorMsg);
          }
          
          console.log(`%c開始加入房間流程 %c房間ID: "${roomId}", 本地對等ID: "${localPeerId.toString()}"`, 
            'background: #2980b9; color: white; padding: 2px 5px; border-radius: 3px;',
            'color: #2c3e50;');
          addServerLog(`開始加入房間流程，房間ID: ${roomId}`, 'info');

          // 添加額外的 roomId 檢查和驗證
          console.log('%c檢查 roomId 有效性: %c' + roomId, 
            'background: #f39c12; color: white; padding: 2px 5px; border-radius: 3px;',
            'color: #2c3e50; font-weight: bold;');
          if (!roomId || roomId === 'null' || roomId === 'undefined') {
            const errorMsg = `無效的房間ID: "${roomId}"`;
            console.error('%c房間ID無效 %c- 值為: %c' + roomId, 
              'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;',
              'color: #e74c3c;',
              'color: #e74c3c; font-weight: bold;');
            addServerLog(errorMsg, 'error');
            throw new Error(errorMsg);
          }

          // 使用安全的方式創建 RoomId 對象
          let roomIdObj: RoomId;
          try {
            roomIdObj = RoomId.fromString(roomId);
            console.log(`%c成功創建房間ID對象: %c"${roomIdObj.toString()}"`, 
              'background: #27ae60; color: white; padding: 2px 5px; border-radius: 3px;',
              'color: #27ae60; font-weight: bold;');
            
            // 再次驗證創建的對象
            if (!roomIdObj || roomIdObj.toString() === 'null' || roomIdObj.toString() === 'undefined' || roomIdObj.toString() === '') {
              console.error('%c創建的 RoomId 對象無效: %c' + roomIdObj?.toString(), 
                'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;',
                'color: #e74c3c; font-weight: bold;');
              throw new Error(`創建的 RoomId 對象無效: "${roomIdObj?.toString()}"`);
            }
          } catch (error) {
            const errorMsg = `無法創建有效的房間ID對象: ${error instanceof Error ? error.message : '未知錯誤'}`;
            console.error('%c無法創建有效的房間ID對象: %c' + (error instanceof Error ? error.message : '未知錯誤'), 
              'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;',
              'color: #e74c3c;');
            addServerLog(errorMsg, 'error');
            throw new Error(errorMsg);
          }

          // 額外檢查 localPeerId
          if (!localPeerId || localPeerId.toString() === 'null' || localPeerId.toString() === 'undefined' || localPeerId.toString() === '') {
            const errorMsg = `無效的本地對等ID: "${localPeerId?.toString()}"`;
            console.error('%c本地對等ID無效: %c' + localPeerId?.toString(), 
              'background: #e74c3c; color: white; padding: 2px 5px; border-radius: 3px;',
              'color: #e74c3c; font-weight: bold;');
            addServerLog(errorMsg, 'error');
            throw new Error(errorMsg);
          }

          // 記錄將要傳遞的參數
          console.log('%c驗證參數 %c- 房間ID: %c"' + roomIdObj.toString() + '"%c, 本地對等ID: %c"' + localPeerId.toString() + '"', 
            'background: #8e44ad; color: white; padding: 2px 5px; border-radius: 3px;',
            'color: #2c3e50;',
            'color: #27ae60; font-weight: bold;',
            'color: #2c3e50;',
            'color: #8e44ad; font-weight: bold;');
          addServerLog(`驗證參數 - 房間ID: "${roomIdObj.toString()}", 本地對等ID: "${localPeerId.toString()}"`, 'info');
          
          // 步驟 7-8: 通過 REST API 查詢房間
          setJoinStage(JoinStage.FETCHING_ROOM);
          console.log('%c步驟 1: %c將通過 API 獲取房間詳情', 
            'background: #3498db; color: white; padding: 2px 5px; border-radius: 3px;',
            'color: #2c3e50;');
          addServerLog('步驟 1: 通過 API 獲取房間詳情', 'info');

          // 按照規格書執行房間加入流程:
          // 1. 通過 REST API 獲取房間信息
          // 2. 連接 WebSocket 信令服務器
          setJoinStage(JoinStage.CONNECTING_WS);
          addServerLog('步驟 2: 正在連接到 WebSocket 信令服務器', 'info');
          console.log(`嘗試加入房間，房間ID: "${roomIdObj.toString()}", 本地對等ID: "${localPeerId.toString()}"`);
          try {
            await service.joinRoom(roomIdObj);
            console.log('加入房間成功!');
          } catch (joinError) {
            console.error('加入房間失敗:', joinError);
            addServerLog(`加入房間失敗: ${joinError instanceof Error ? joinError.message : '未知錯誤'}`, 'error');
            throw joinError;
          }
          
          // 獲取最新的房間資訊
          console.log('正在獲取房間詳細資訊...');
          addServerLog('正在獲取房間詳細資訊...', 'info');
          const roomInfoData = await service.getRoomInfo(roomIdObj);
          console.log('房間資訊:', roomInfoData);
          addServerLog(`獲取到房間信息: ${roomInfoData.name || '未命名房間'}`, 'success');
          setRoomInfo(roomInfoData);
          
          // 檢查當前用戶是否是房間擁有者
          console.log('檢查房間所有權...');
          addServerLog('檢查房間所有權...', 'info');
          const ownerStatus = await service.isRoomOwner(roomIdObj, localPeerId);
          console.log(`當前用戶是否為房主: ${ownerStatus}`);
          addServerLog(`當前用戶${ownerStatus ? '是' : '不是'}房間擁有者`, ownerStatus ? 'success' : 'info');
          setIsOwner(ownerStatus);
          
          // 設置數據通道監聽
          setJoinStage(JoinStage.ESTABLISHING_PEERS);
          console.log('設置數據通道事件監聽...');
          addServerLog('設置數據通道事件監聽...', 'info');
          service.subscribeToData(messageChannel, handleChatMessage);
          service.subscribeToData('state', handleStateUpdate);
          
          // 訂閱伺服器統計數據
          console.log('訂閱伺服器統計數據...');
          const signalingService = diContainer.get<SignalingService>(CollaborationTypes.SignalingService);
          signalingService.on('server-stats', handleServerStats);
          
          // 如果有音頻，設置音頻監聽
          if (useAudio) {
            console.log('設置音頻數據監聽...');
            addServerLog('設置音頻數據監聽...', 'info');
            service.subscribeToData('audio', handleAudioData);
          }
          
          setJoinStage(JoinStage.COMPLETE);
          console.log('房間加入流程完成，準備建立與其他對等節點的連接');
          addServerLog('房間加入流程完成，準備建立與其他對等節點的連接', 'success');
        } catch (roomError) {
          setJoinStage(JoinStage.ERROR);
          console.error('加入房間失敗，詳細錯誤:', roomError);
          const errorMsg = roomError instanceof Error ? roomError.message : '未知錯誤';
          addServerLog(`加入房間失敗: ${errorMsg}`, 'error');
          setError('加入房間失敗: ' + (roomError instanceof Error ? roomError.message : '未知錯誤'));
          setTimeout(() => navigate('/collaboration/rooms'), 3000);
        }
      } catch (err) {
        setJoinStage(JoinStage.ERROR);
        console.error('初始化協作服務失敗，詳細錯誤:', err);
        const errorMsg = err instanceof Error ? err.message : '未知錯誤';
        addServerLog(`初始化協作服務失敗: ${errorMsg}`, 'error');
        setError('無法初始化協作服務，請重新整理頁面');
      } finally {
        setIsLoading(false);
      }
    };

    initService();
    
    // 組件卸載時清理
    return () => {
      if (collaborationService) {
        console.log('組件卸載，清理資源...');
        collaborationService.unsubscribeFromData(messageChannel, handleChatMessage);
        collaborationService.unsubscribeFromData('state', handleStateUpdate);
        
        // 取消訂閱伺服器統計數據 - 直接從容器獲取信令服務
        const signalingService = diContainer.get<SignalingService>(CollaborationTypes.SignalingService);
        signalingService.off('server-stats', handleServerStats);
        
        if (useAudio) {
          collaborationService.unsubscribeFromData('audio', handleAudioData);
        }
        
        // 離開房間
        console.log('正在離開房間...');
        collaborationService.leaveRoom().catch(err => {
          console.error('離開房間時發生錯誤:', err);
        });
      }
    };
  }, [diContainer, localPeerId, roomId, navigate, handleChatMessage, handleStateUpdate, handleAudioData, handleServerStats, useAudio, addServerLog]);

  // 獲取連接的對等節點
  useEffect(() => {
    if (!collaborationService || !isInitialized) return;
    
    const updatePeers = () => {
      const connectedPeers = collaborationService.getConnectedPeers();
      const peerStates = connectedPeers.map(peer => {
        // 這裡可以嘗試從 collaborationState 或 chatMessages 中獲取用戶名
        let peerName = '';
        
        // 嘗試從聊天消息中獲取用戶名
        const lastMessage = chatMessages
          .filter(msg => msg.sender === peer.toString())
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
          
        if (lastMessage) {
          peerName = lastMessage.senderName;
        }
        
        return {
          id: peer.toString(),
          state: collaborationService.getPeerConnectionState(peer),
          name: peerName || undefined
        };
      });
      
      setPeers(peerStates);
    };
    
    // 初始更新
    updatePeers();
    
    // 設置定期更新
    const intervalId = setInterval(updatePeers, 2000);
    
    return () => clearInterval(intervalId);
  }, [collaborationService, isInitialized, chatMessages]);

  // 捲動到聊天框底部
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // 捲動到日誌框底部
  useEffect(() => {
    if (serverLogContainerRef.current) {
      serverLogContainerRef.current.scrollTop = serverLogContainerRef.current.scrollHeight;
    }
  }, [serverLogs]);

  // 發送聊天訊息
  const sendChatMessage = useCallback(() => {
    if (!collaborationService || !newMessage.trim()) return;
    
    const messageData = {
      id: crypto.randomUUID(),
      type: 'chat',
      content: newMessage,
      username: username,
      timestamp: Date.now()
    };
    
    collaborationService.broadcastData(messageChannel, messageData);
    
    // 將自己的訊息添加到聊天框
    const selfMessage: ChatMessage = {
      id: messageData.id,
      sender: localPeerId.toString(),
      senderName: username,
      content: newMessage,
      timestamp: new Date(messageData.timestamp)
    };
    
    setChatMessages(prev => [...prev, selfMessage]);
    setNewMessage('');
  }, [collaborationService, messageChannel, newMessage, username, localPeerId]);

  // 處理按鍵事件 (Enter 發送訊息)
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  }, [sendChatMessage]);

  // 處理訊息輸入
  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
  }, []);

  // 離開房間
  const handleLeaveRoom = useCallback(async () => {
    if (!collaborationService) return;
    
    try {
      await collaborationService.leaveRoom();
      navigate('/collaboration/rooms');
    } catch (err) {
      console.error('離開房間失敗:', err);
      setError('離開房間失敗，請重試');
    }
  }, [collaborationService, navigate]);

  // 格式化時間
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 顯示連接狀態的組件
  const renderConnectionStatus = () => {
    // 只在加載中顯示連接狀態
    if (!isLoading && joinStage === JoinStage.COMPLETE) return null;

    const statusColor = joinStage === JoinStage.ERROR ? '#e53935' : 
                        joinStage === JoinStage.COMPLETE ? '#4caf50' : '#2196f3';
    
    const statusClass = joinStage === JoinStage.ERROR ? 'error' : 
                       joinStage === JoinStage.COMPLETE ? 'complete' : '';
    
    return (
      <div className={`connection-status-container ${statusClass}`}>
        <div className="connection-stage">
          <div className="stage-indicator" style={{ color: statusColor }}>
            {joinStage}
          </div>
          {joinStage !== JoinStage.ERROR && joinStage !== JoinStage.COMPLETE && (
            <div className="connection-loader"></div>
          )}
        </div>
        <div className="connection-details">
          {joinStage === JoinStage.INITIALIZING && '正在初始化協作服務...'}
          {joinStage === JoinStage.FETCHING_ROOM && '正在從服務器獲取房間信息...'}
          {joinStage === JoinStage.CONNECTING_WS && '正在連接到信令服務器...'}
          {joinStage === JoinStage.ESTABLISHING_PEERS && '正在與其他用戶建立連接...'}
          {joinStage === JoinStage.COMPLETE && '所有連接已建立'}
          {joinStage === JoinStage.ERROR && '連接過程中發生錯誤'}
        </div>
      </div>
    );
  };

  // 如果正在載入，顯示載入狀態
  if (isLoading) {
    return (
      <div className="collaboration-room loading">
        <div className="loading-spinner"></div>
        <p>正在加載房間...</p>
        {renderConnectionStatus()}
      </div>
    );
  }

  // 如果有錯誤，顯示錯誤訊息
  if (error) {
    return (
      <div className="collaboration-room error">
        <div className="error-message">
          <h3>發生錯誤</h3>
          <p>{error}</p>
          <button onClick={() => navigate('/collaboration/rooms')}>
            返回房間列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="collaboration-room">
      <div className="room-header">
        <h2>{roomInfo?.name || '協作房間'}</h2>
        <div className="room-id-container">
          <span className="room-id-label">房間 ID:</span>
          <code className="room-id-value">{roomId}</code>
          <button 
            className="copy-btn" 
            onClick={() => {
              navigator.clipboard.writeText(roomId || '');
              alert('已複製房間 ID');
            }}
            title="複製房間 ID"
          >
            複製
          </button>
        </div>
        <div className="room-actions">
          <button 
            className="leave-room-btn" 
            onClick={handleLeaveRoom}
          >
            離開房間
          </button>
        </div>
      </div>
      
      {/* 顯示連接狀態 */}
      {renderConnectionStatus()}
      
      <div className="room-content">
        <div className="collaboration-panel">
          {/* 服務器日誌區域 */}
          <div className="server-logs">
            <div className="logs-header">
              <h3>伺服器日誌</h3>
              <button 
                className="clear-logs-btn"
                onClick={() => setServerLogs([])}
                title="清除日誌"
              >
                清除
              </button>
            </div>
            <div className="logs-container" ref={serverLogContainerRef}>
              {serverLogs.length === 0 ? (
                <div className="empty-logs">
                  <p>尚無日誌訊息</p>
                </div>
              ) : (
                serverLogs.map(log => (
                  <div 
                    key={log.id}
                    className={`log-entry ${log.type}`}
                  >
                    <span className="log-time">{formatTime(log.timestamp)}</span>
                    <span className="log-content">{log.content}</span>
                    {log.type === 'json' && log.jsonData && (
                      <pre className="log-json-data">
                        {JSON.stringify(log.jsonData, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* 協作工作區 */}
          <div className="collaboration-workspace">
            <p>尚未實現協作工作區</p>
          </div>
        </div>
        
        <div className="communication-panel">
          <div className="peers-list">
            <h3>連接的用戶 ({peers.length + 1})</h3>
            <ul>
              <li className="self">
                <div className="peer-status connected"></div>
                <span>{username} (你){isOwner ? ' - 房主' : ''}</span>
              </li>
              {peers.map(peer => (
                <li key={peer.id}>
                  <div className={`peer-status ${peer.state.toLowerCase()}`}></div>
                  <span>
                    {peer.name ? `${peer.name} (${peer.id})` : peer.id}
                    {roomInfo?.ownerId === peer.id ? ' - 房主' : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="chat-container">
            <div className="chat-messages" ref={chatContainerRef}>
              {chatMessages.length === 0 ? (
                <div className="empty-chat">
                  <p>尚無訊息</p>
                </div>
              ) : (
                chatMessages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`chat-message ${msg.sender === localPeerId.toString() ? 'self' : 'peer'}`}
                  >
                    <div className="message-header">
                      <span className="sender-name">{msg.senderName}</span>
                      <span className="message-time">{formatTime(msg.timestamp)}</span>
                    </div>
                    <div className="message-content">{msg.content}</div>
                  </div>
                ))
              )}
            </div>
            
            <div className="chat-input">
              <textarea 
                value={newMessage}
                onChange={handleMessageChange}
                onKeyPress={handleKeyPress}
                placeholder="輸入訊息..."
                rows={2}
              />
              <button 
                className="send-btn"
                onClick={sendChatMessage}
                disabled={!newMessage.trim()}
              >
                發送
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollabRoom; 