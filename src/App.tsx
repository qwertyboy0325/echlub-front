import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'inversify';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import CollaborationPage from './pages/Collaboration/CollaborationPage';
import MusicArrangementDemo from './pages/Collaboration/MusicArrangementDemo';
import DAWPage from './pages/DAWPage';
import DAWInterface from './ui/components/DAWInterface';
import { BPMTestPage } from './ui/components/BPMTestPage';

interface AppProps {
  diContainer: Container;
}

// 受保護路由組件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>載入中...</div>; // 可以替換為更好的載入指示器
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// 認證路由組件
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>載入中...</div>; // 可以替換為更好的載入指示器
  }
  
  return isAuthenticated ? <Navigate to="/" /> : <>{children}</>;
};

// 主應用組件（登入後顯示）
const MainApp: React.FC<{diContainer: Container}> = ({diContainer}) => {
  const { logout, user } = useAuth();

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' 
    }}>
      <h1 style={{ color: '#333', marginBottom: '10px' }}>歡迎使用我們的應用！</h1>
      {user && (
        <p style={{ color: '#555', marginBottom: '20px' }}>
          您好，{user.username || user.email}
        </p>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <a 
          href="/demo"
          style={{ 
            padding: '12px 24px', 
            backgroundColor: '#667eea', 
            color: 'white', 
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          🎵 架構演示
        </a>
        <a 
          href="/daw"
          style={{ 
            padding: '12px 24px', 
            backgroundColor: '#e53e3e', 
            color: 'white', 
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          🎚️ DAW界面
        </a>
        <a 
          href="/collaboration"
          style={{ 
            padding: '12px 24px', 
            backgroundColor: '#2e7d32', 
            color: 'white', 
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          協作房間
        </a>
        <a 
          href="/bpm-test"
          style={{ 
            padding: '12px 24px', 
            backgroundColor: '#8b5cf6', 
            color: 'white', 
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          🧪 BPM測試
        </a>
      </div>
      
      <button 
        onClick={logout}
        style={{ 
          padding: '12px 24px', 
          backgroundColor: '#4a90e2', 
          color: 'white', 
          border: 'none', 
          borderRadius: '8px', 
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s ease'
        }}
      >
        登出
      </button>
    </div>
  );
};

/**
 * 應用程序根組件
 */
const App: React.FC<AppProps> = ({ diContainer }) => {
  return (
    <AuthProvider diContainer={diContainer}>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={
              <AuthRoute>
                <Login />
              </AuthRoute>
            } 
          />
          <Route 
            path="/register" 
            element={
              <AuthRoute>
                <Register />
              </AuthRoute>
            } 
          />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <MainApp diContainer={diContainer} />
              </ProtectedRoute>
            } 
          />
          
          {/* 協作模組路由 - 使用嵌套路由 */}
          <Route
            path="/collaboration/*"
            element={
              <ProtectedRoute>
                <CollaborationPage diContainer={diContainer} />
              </ProtectedRoute>
            }
          />
          
          {/* 🎵 直接演示路由 - 繞過驗證，用於學校作業展示 */}
          <Route 
            path="/demo" 
            element={<MusicArrangementDemo diContainer={diContainer} />} 
          />
          
          {/* 🎚️ DAW界面路由 - 繞過驗證，用於直接展示 */}
          <Route 
            path="/daw" 
            element={<DAWPage />} 
          />
          
          {/* 🧪 BPM测试页面 - 用于调试BPM功能 */}
          <Route 
            path="/bpm-test" 
            element={<BPMTestPage />} 
          />
          
          {/* 兼容舊版路由，重定向到新路徑 */}
          <Route path="/rooms" element={<Navigate to="/collaboration/rooms" replace />} />
          <Route path="/room/:roomId" element={<Navigate to="/collaboration/room/:roomId" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App; 