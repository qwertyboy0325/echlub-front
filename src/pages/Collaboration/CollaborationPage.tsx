import React, { useEffect } from 'react';
import { Container } from 'inversify';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import RoomsPage from './RoomsPage';
import RoomPage from './RoomPage';
import TestPage from './TestPage';
import { initializeCollaborationModule } from '../../modules/collaboration';
import { PeerId } from '../../modules/collaboration/domain/value-objects/PeerId';
import { v4 as uuidv4 } from 'uuid';
import './CollaborationPage.css';

// 確保UUID生成器設置好
PeerId.setGenerator(() => uuidv4());

interface CollaborationPageProps {
  diContainer: Container;
}

/**
 * 協作頁面主入口
 * 提供協作模組的路由和共用UI元素
 */
const CollaborationPage: React.FC<CollaborationPageProps> = ({ diContainer }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  // 初始化協作模組
  useEffect(() => {
    // 初始化協作模組
    initializeCollaborationModule(diContainer);
    console.log('協作模組已初始化');
  }, [diContainer]);

  // 檢查用戶是否已登入
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return (
    <div className="collaboration-page-container">
      <header className="collaboration-header">
        <h1>Echlub 協作</h1>
        <nav className="collaboration-nav">
          <a className="nav-link" href="/">首頁</a>
          <a className="nav-link" href="/collaboration/rooms">房間列表</a>
          <a className="nav-link" href="/collaboration/test">測試頁面</a>
        </nav>
      </header>
      
      <main className="collaboration-content">
        <Routes>
          <Route path="/" element={<Navigate to="rooms" replace />} />
          <Route path="rooms" element={<RoomsPage diContainer={diContainer} />} />
          <Route path="room/:roomId" element={<RoomPage diContainer={diContainer} />} />
          <Route path="test" element={<TestPage diContainer={diContainer} />} />
        </Routes>
      </main>
      
      <footer className="collaboration-footer">
        <p>© {new Date().getFullYear()} Echlub 協作系統</p>
      </footer>
    </div>
  );
};

export default CollaborationPage; 