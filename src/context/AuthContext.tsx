import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Container } from 'inversify';
import { IdentityTypes, IdentityService } from '../modules/identity';

interface AuthContextType {
  isAuthenticated: boolean;
  loading: boolean;
  user: any | null;
  login: (email: string, password: string) => Promise<any>;
  register: (email: string, password: string, username: string) => Promise<any>;
  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: React.ReactNode;
  diContainer: Container;
}

// 創建認證上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 認證提供者組件
export const AuthProvider: React.FC<AuthProviderProps> = ({ children, diContainer }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any | null>(null);
  
  // 使用useMemo獲取服務，避免不必要的重新獲取
  const identityService = useMemo(() => 
    diContainer.get<IdentityService>(IdentityTypes.IdentityService), 
    [diContainer]
  );

  // 初始化認證狀態
  useEffect(() => {
    const initAuth = async () => {
      try {
        setLoading(true);
        const isUserAuthenticated = identityService.isAuthenticated();
        
        if (isUserAuthenticated) {
          // 如果登入狀態有效但沒有用戶數據，使用基本用戶對象
          if (!user) {
            // 使用一個簡單的預設用戶對象
            setUser({
              id: '0',
              email: 'user@echlub.com',
              username: '用戶',
            });
          }
        }
        
        setIsAuthenticated(isUserAuthenticated);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [identityService, user]);

  // 登入處理器
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      console.log(`[AuthContext] 開始登入: ${email}`);
      const result = await identityService.login(email, password);
      
      console.log('[AuthContext] 登入結果:', JSON.stringify({
        hasToken: !!result.token,
        tokenLength: result.token ? result.token.length : 0,
        hasUser: !!result.user
      }));
      
      // 檢查 localStorage 中的令牌
      const token = localStorage.getItem('auth_token');
      console.log('[AuthContext] localStorage token:', token);
      
      setIsAuthenticated(true);
      
      // 從登入結果直接提取基本用戶信息
      if (result && result.user) {
        // 如果登入返回包含用戶信息，直接使用
        console.log('[AuthContext] 使用返回的用戶信息');
        setUser(result.user);
      } else {
        // 否則創建一個基本用戶對象
        console.log('[AuthContext] 創建基本用戶對象');
        const emailParts = email.split('@');
        const defaultUsername = emailParts[0] || '用戶';
        setUser({
          id: '0',
          email: email,
          username: defaultUsername,
        });
      }
      
      return result;
    } catch (error) {
      console.error('[AuthContext] 登入錯誤:', error);
      
      // 測試環境特殊處理：即使登入失敗也設置為已登入狀態
      if (process.env.NODE_ENV === 'development') {
        console.warn('[AuthContext] 開發環境：忽略登入錯誤，直接設置為已登入狀態');
        setIsAuthenticated(true);
        const emailParts = email.split('@');
        const defaultUsername = emailParts[0] || '用戶';
        setUser({
          id: '0',
          email: email,
          username: defaultUsername,
        });
        return {
          token: 'test-token-for-development',
          user: {
            id: '0',
            email: email,
            username: defaultUsername,
          }
        };
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  }, [identityService]);

  // 註冊處理器
  const register = useCallback(async (email: string, password: string, username: string) => {
    setLoading(true);
    try {
      const result = await identityService.registerUser(email, password, username);
      
      // 註冊成功後自動登入
      await login(email, password);
      
      return result;
    } finally {
      setLoading(false);
    }
  }, [identityService, login]);

  // 登出處理器
  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await identityService.logout();
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('登出錯誤:', error);
    } finally {
      setLoading(false);
    }
  }, [identityService]);

  // 上下文值
  const contextValue: AuthContextType = {
    isAuthenticated,
    loading,
    user,
    login,
    register,
    logout
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 使用認證上下文的自定義Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth必須在AuthProvider內使用');
  }
  return context;
}; 