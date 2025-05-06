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
          // 如果已驗證，獲取用戶資料
          try {
            const userProfile = await identityService.getUserProfile();
            setUser(userProfile);
          } catch (error) {
            console.error('無法獲取用戶資料:', error);
            identityService.removeToken(); // 如果獲取用戶資料失敗，清除token
            setIsAuthenticated(false);
            setUser(null);
            return;
          }
        }
        
        setIsAuthenticated(isUserAuthenticated);
      } catch (error) {
        console.error('認證初始化錯誤:', error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, [identityService]);

  // 登入處理器
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await identityService.login(email, password);
      setIsAuthenticated(true);
      
      // 登入後獲取用戶資料
      try {
        const userProfile = await identityService.getUserProfile();
        setUser(userProfile);
      } catch (userError) {
        console.error('登入後獲取用戶資料錯誤:', userError);
      }
      
      return result;
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