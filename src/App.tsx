import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'inversify';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

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
const MainApp: React.FC = () => {
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
                <MainApp />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App; 