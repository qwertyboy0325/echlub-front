import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CollabRoom from '../../modules/collaboration/presentation/components/CollabRoom';
import { PeerId } from '../../modules/collaboration/domain/value-objects/PeerId';
import { v4 as uuidv4 } from 'uuid';
import { Container } from 'inversify';

// 確保 UUID 生成器設置好
PeerId.setGenerator(() => uuidv4());

interface RoomPageProps {
  diContainer: Container;
}

const RoomPage: React.FC<RoomPageProps> = ({ diContainer }) => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  
  // 使用安全方式創建 PeerId
  const [localPeerId] = useState<PeerId>(() => {
    try {
      console.log('生成新的 PeerId');
      const peerId = PeerId.create();
      console.log(`生成的 PeerId: "${peerId.toString()}"`);
      
      // 驗證生成的 PeerId
      if (!peerId || peerId.toString() === 'null' || peerId.toString() === 'undefined') {
        console.error('生成的 PeerId 無效:', peerId);
        // 嘗試替代方案
        return PeerId.fromString(`user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
      }
      
      return peerId;
    } catch (error) {
      console.error('創建 PeerId 時發生錯誤:', error);
      // 使用備用方法
      return PeerId.fromString(`fallback-${Date.now()}`);
    }
  });

  if (!roomId) {
    return (
      <div className="error-container">
        <p>無效的房間 ID</p>
      </div>
    );
  }

  return (
    <div className="page-container room-page">
      <CollabRoom
        diContainer={diContainer}
        username={user?.username || user?.name || '匿名用戶'}
        localPeerId={localPeerId}
      />
    </div>
  );
};

export default RoomPage; 