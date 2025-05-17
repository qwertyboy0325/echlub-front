import React from 'react';
import { useAuth } from '../../context/AuthContext';
import RoomManager from '../../modules/collaboration/presentation/components/RoomManager';
import { Container } from 'inversify';

interface RoomsPageProps {
  diContainer: Container;
}

const RoomsPage: React.FC<RoomsPageProps> = ({ diContainer }) => {
  const { user } = useAuth();

  return (
    <div className="page-container">
      <div className="page-content">
        <h1>協作房間</h1>
        <p className="page-description">
          在這裡您可以創建新的協作房間或加入已存在的房間，與其他用戶一起合作。
        </p>
        
        <RoomManager 
          diContainer={diContainer} 
          username={user?.username || user?.name || '匿名用戶'}
        />
      </div>
    </div>
  );
};

export default RoomsPage; 