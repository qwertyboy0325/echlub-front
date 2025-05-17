import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { CollaborationService } from '../../application/services/CollaborationService';
import { Container } from 'inversify';
import { CollaborationTypes } from '../../di/CollaborationTypes';
import { PeerId } from '../../domain/value-objects/PeerId';
import { RoomId } from '../../domain/value-objects/RoomId';
import { ConnectionState } from '../../domain/value-objects/ConnectionState';
import './CollaborationRoom.css';

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

const CollaborationRoomComponent: React.FC<CollaborationRoomProps> = ({
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

  // 初始化協作服務
  useEffect(() => {
    if (!roomId) {
      navigate('/rooms');
      return;
    }

    const initService = async () => {
      try {
        setIsLoading(true);
        const service = diContainer.get<CollaborationService>(CollaborationTypes.CollaborationService);
        
        // 初始化服務
        if (!service.isConnected()) {
          await service.initialize(localPeerId);
        }
        
        setCollaborationService(service);
        setIsInitialized(true);
        
        // 嘗試加入房間
        try {
          const roomIdObj = RoomId.fromString(roomId);
          await service.joinRoom(roomIdObj);
          
          // 獲取房間資訊
          const roomInfoData = await service.getRoomInfo(roomIdObj);
          setRoomInfo(roomInfoData);
          
          // 檢查當前用戶是否是房間擁有者
          const ownerStatus = await service.isRoomOwner(roomIdObj, localPeerId);
          setIsOwner(ownerStatus);
          
          // 設置連接狀態變化事件監聽
          service.subscribeToData(messageChannel, handleChatMessage);
          service.subscribeToData('state', handleStateUpdate);
          
          // 如果有音頻，設置音頻監聽
          if (useAudio) {
            service.subscribeToData('audio', handleAudioData);
          }
        } catch (roomError) {
          console.error('加入房間失敗:', roomError);
          setError('加入房間失敗: ' + (roomError instanceof Error ? roomError.message : '未知錯誤'));
          setTimeout(() => navigate('/collaboration/rooms'), 3000);
        }
      } catch (err) {
        console.error('初始化協作服務失敗:', err);
        setError('無法初始化協作服務，請重新整理頁面');
      } finally {
        setIsLoading(false);
      }
    };

    initService();
    
    // 組件卸載時清理
    return () => {
      if (collaborationService) {
        collaborationService.unsubscribeFromData(messageChannel, handleChatMessage);
        collaborationService.unsubscribeFromData('state', handleStateUpdate);
        
        if (useAudio) {
          collaborationService.unsubscribeFromData('audio', handleAudioData);
        }
        
        // 離開房間
        collaborationService.leaveRoom().catch(err => {
          console.error('離開房間時發生錯誤:', err);
        });
      }
    };
  }, [diContainer, localPeerId, roomId, navigate, handleChatMessage, handleStateUpdate, handleAudioData, useAudio]);

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
      minute: '2-digit' 
    });
  };

  // 如果正在載入，顯示載入狀態
  if (isLoading) {
    return (
      <div className="collaboration-room loading">
        <div className="loading-spinner"></div>
        <p>正在加載房間...</p>
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
      
      <div className="room-content">
        <div className="collaboration-panel">
          {/* 這裡添加協作內容面板 */}
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

export default CollaborationRoomComponent; 