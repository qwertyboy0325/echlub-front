import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from 'inversify';
import { useAuth } from '../../context/AuthContext';
import { CollaborationTypes } from '../../modules/collaboration/di/CollaborationTypes';
import type { CollaborationService } from '../../modules/collaboration/application/services/CollaborationService';
import { PeerId } from '../../modules/collaboration/domain/value-objects/PeerId';
import { RoomId } from '../../modules/collaboration/domain/value-objects/RoomId';
import { v4 as uuidv4 } from 'uuid';

// 確保 UUID 生成器設置好
PeerId.setGenerator(() => uuidv4());
RoomId.setGenerator(() => uuidv4());

interface TestPageProps {
  diContainer: Container;
}

const TestPage: React.FC<TestPageProps> = ({ diContainer }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [localPeerId] = useState(() => PeerId.create());
  const [collaborationService, setCollaborationService] = useState<CollaborationService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomIdInput, setRoomIdInput] = useState('');
  const [roomNameInput, setRoomNameInput] = useState('測試房間');
  const [testResults, setTestResults] = useState<Array<{test: string; result: string; success: boolean}>>([]);
  const [loading, setLoading] = useState(false);
  
  // 初始化協作服務
  useEffect(() => {
    const initService = async () => {
      try {
        const service = diContainer.get<CollaborationService>(CollaborationTypes.CollaborationService);
        await service.initialize(localPeerId);
        setCollaborationService(service);
        setIsInitialized(true);
        addTestResult('初始化', '協作服務初始化成功', true);
      } catch (err) {
        console.error('初始化協作服務失敗:', err);
        setError('無法初始化協作服務，請重新整理頁面');
        addTestResult('初始化', `失敗: ${err instanceof Error ? err.message : '未知錯誤'}`, false);
      }
    };

    initService();
  }, [diContainer, localPeerId]);

  // 添加測試結果
  const addTestResult = (test: string, result: string, success: boolean) => {
    setTestResults(prev => [...prev, { test, result, success }]);
  };

  // 清除測試結果
  const clearTestResults = () => {
    setTestResults([]);
  };

  // 測試創建房間
  const testCreateRoom = async () => {
    if (!collaborationService || !isInitialized) {
      setError('協作服務尚未初始化');
      return;
    }

    setLoading(true);
    try {
      addTestResult('創建房間', '開始創建房間...', true);
      
      const newRoomId = await collaborationService.createRoom(
        localPeerId,
        user?.username || '測試用戶',
        roomNameInput,
        4, // maxPlayers
        true, // allowRelay
        100, // latencyTargetMs
        32000 // opusBitrate
      );
      
      if (newRoomId) {
        addTestResult('創建房間', `成功創建房間: ${newRoomId.toString()}`, true);
        setRoomIdInput(newRoomId.toString());
      } else {
        addTestResult('創建房間', '創建房間失敗: 返回空值', false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '創建房間時發生未知錯誤';
      addTestResult('創建房間', `錯誤: ${errorMsg}`, false);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 測試獲取房間信息
  const testGetRoomInfo = async () => {
    if (!collaborationService || !isInitialized) {
      setError('協作服務尚未初始化');
      return;
    }
    
    if (!roomIdInput || !RoomId.isValid(roomIdInput)) {
      setError('請輸入有效的房間 ID');
      return;
    }
    
    setLoading(true);
    try {
      addTestResult('獲取房間信息', '正在查詢...', true);
      
      const roomIdObj = RoomId.fromString(roomIdInput);
      const roomInfo = await collaborationService.getRoomInfo(roomIdObj);
      
      addTestResult('獲取房間信息', `成功: ${JSON.stringify(roomInfo)}`, true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '獲取房間信息時發生未知錯誤';
      addTestResult('獲取房間信息', `錯誤: ${errorMsg}`, false);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  
  // 測試加入房間
  const testJoinRoom = async () => {
    if (!collaborationService || !isInitialized) {
      setError('協作服務尚未初始化');
      return;
    }
    
    if (!roomIdInput || !RoomId.isValid(roomIdInput)) {
      setError('請輸入有效的房間 ID');
      return;
    }
    
    setLoading(true);
    try {
      addTestResult('加入房間', '開始加入房間流程...', true);
      
      const roomIdObj = RoomId.fromString(roomIdInput);
      await collaborationService.joinRoom(roomIdObj);
      
      addTestResult('加入房間', '成功連接到房間', true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '加入房間時發生未知錯誤';
      addTestResult('加入房間', `錯誤: ${errorMsg}`, false);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  
  // 測試離開房間
  const testLeaveRoom = async () => {
    if (!collaborationService || !isInitialized) {
      setError('協作服務尚未初始化');
      return;
    }
    
    setLoading(true);
    try {
      addTestResult('離開房間', '正在離開房間...', true);
      
      await collaborationService.leaveRoom();
      
      addTestResult('離開房間', '成功離開房間', true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '離開房間時發生未知錯誤';
      addTestResult('離開房間', `錯誤: ${errorMsg}`, false);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  
  // 測試更新房間規則
  const testUpdateRoomRules = async () => {
    if (!collaborationService || !isInitialized) {
      setError('協作服務尚未初始化');
      return;
    }
    
    if (!roomIdInput || !RoomId.isValid(roomIdInput)) {
      setError('請輸入有效的房間 ID');
      return;
    }
    
    setLoading(true);
    try {
      addTestResult('更新房間規則', '正在更新規則...', true);
      
      const roomIdObj = RoomId.fromString(roomIdInput);
      const success = await collaborationService.updateRoomRules(
        roomIdObj,
        localPeerId,
        6, // 修改最大人數
        true, // allowRelay
        150, // 修改延遲目標
        48000 // 修改音質
      );
      
      if (success) {
        addTestResult('更新房間規則', '成功更新房間規則', true);
      } else {
        addTestResult('更新房間規則', '更新失敗: API 返回失敗', false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '更新房間規則時發生未知錯誤';
      addTestResult('更新房間規則', `錯誤: ${errorMsg}`, false);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  
  // 測試關閉房間
  const testCloseRoom = async () => {
    if (!collaborationService || !isInitialized) {
      setError('協作服務尚未初始化');
      return;
    }
    
    if (!roomIdInput || !RoomId.isValid(roomIdInput)) {
      setError('請輸入有效的房間 ID');
      return;
    }
    
    setLoading(true);
    try {
      addTestResult('關閉房間', '正在關閉房間...', true);
      
      const roomIdObj = RoomId.fromString(roomIdInput);
      const success = await collaborationService.closeRoom(roomIdObj, localPeerId);
      
      if (success) {
        addTestResult('關閉房間', '成功關閉房間', true);
      } else {
        addTestResult('關閉房間', '關閉失敗: API 返回失敗', false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '關閉房間時發生未知錯誤';
      addTestResult('關閉房間', `錯誤: ${errorMsg}`, false);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  
  // 前往房間頁面
  const goToRoom = () => {
    if (!roomIdInput || !RoomId.isValid(roomIdInput)) {
      setError('請輸入有效的房間 ID');
      return;
    }
    
    navigate(`/collaboration/room/${roomIdInput}`);
  };
  
  // 前往房間列表頁面
  const goToRoomsList = () => {
    navigate('/collaboration/rooms');
  };

  return (
    <div className="page-container">
      <div className="page-content">
        <h1>協作模組測試頁面</h1>
        
        {error && <div className="error-alert">{error}</div>}
        
        <div className="test-container" style={styles.testContainer}>
          <div className="test-info-panel" style={styles.testInfoPanel}>
            <h3>測試信息</h3>
            <div>
              <span>您的 PeerId: </span>
              <code>{localPeerId.toString()}</code>
            </div>
            <div>
              <span>用戶名: </span>
              <code>{user?.username || '匿名用戶'}</code>
            </div>
            <div>
              <span>服務狀態: </span>
              <span style={isInitialized ? styles.statusActive : styles.statusInactive}>
                {isInitialized ? '已初始化' : '未初始化'}
              </span>
            </div>
            
            <div style={styles.roomInput}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>房間 ID:</label>
                <input 
                  type="text" 
                  value={roomIdInput}
                  onChange={(e) => setRoomIdInput(e.target.value)}
                  placeholder="輸入要測試的房間 ID"
                  style={styles.input}
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>房間名稱:</label>
                <input 
                  type="text" 
                  value={roomNameInput}
                  onChange={(e) => setRoomNameInput(e.target.value)}
                  placeholder="創建房間時使用的名稱"
                  style={styles.input}
                />
              </div>
            </div>
          </div>
          
          <div className="test-buttons" style={styles.testButtons}>
            <h3>測試操作</h3>
            <button 
              onClick={testCreateRoom} 
              disabled={!isInitialized || loading}
              style={{...styles.testBtn, ...styles.createBtn}}
            >
              創建房間
            </button>
            
            <button 
              onClick={testGetRoomInfo} 
              disabled={!isInitialized || loading || !roomIdInput}
              style={styles.testBtn}
            >
              獲取房間信息
            </button>
            
            <button 
              onClick={testJoinRoom} 
              disabled={!isInitialized || loading || !roomIdInput}
              style={styles.testBtn}
            >
              加入房間
            </button>
            
            <button 
              onClick={testLeaveRoom} 
              disabled={!isInitialized || loading}
              style={styles.testBtn}
            >
              離開房間
            </button>
            
            <button 
              onClick={testUpdateRoomRules} 
              disabled={!isInitialized || loading || !roomIdInput}
              style={styles.testBtn}
            >
              更新房間規則
            </button>
            
            <button 
              onClick={testCloseRoom} 
              disabled={!isInitialized || loading || !roomIdInput}
              style={{...styles.testBtn, ...styles.closeBtn}}
            >
              關閉房間
            </button>
            
            <hr />
            
            <button 
              onClick={goToRoom} 
              disabled={!roomIdInput}
              style={styles.navBtn}
            >
              前往房間頁面
            </button>
            
            <button 
              onClick={goToRoomsList} 
              style={styles.navBtn}
            >
              前往房間列表
            </button>
            
            <button 
              onClick={clearTestResults} 
              style={styles.clearBtn}
            >
              清除測試結果
            </button>
          </div>
          
          <div className="test-results" style={styles.testResults}>
            <h3>測試結果</h3>
            
            {testResults.length === 0 ? (
              <div style={styles.noResults}>尚無測試結果</div>
            ) : (
              <div style={styles.resultsList}>
                {testResults.map((item, index) => (
                  <div 
                    key={index} 
                    style={{
                      ...styles.resultItem,
                      ...(item.success ? styles.resultSuccess : styles.resultFailure)
                    }}
                  >
                    <div style={styles.resultTitle}>{item.test}</div>
                    <div style={styles.resultMessage}>{item.result}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 內聯樣式
const styles = {
  testContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: 'auto 1fr',
    gap: '20px',
    marginTop: '20px'
  },
  
  testInfoPanel: {
    gridColumn: '1 / 2',
    gridRow: '1 / 2',
    padding: '15px',
    background: '#f5f5f5',
    borderRadius: '8px'
  },
  
  testButtons: {
    gridColumn: '2 / 3',
    gridRow: '1 / 2',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    padding: '15px',
    background: '#f5f5f5',
    borderRadius: '8px'
  },
  
  testResults: {
    gridColumn: '1 / 3',
    gridRow: '2 / 3',
    minHeight: '300px',
    maxHeight: '500px',
    overflowY: 'auto' as const,
    padding: '15px',
    background: '#f5f5f5',
    borderRadius: '8px'
  },
  
  roomInput: {
    marginTop: '15px'
  },
  
  inputGroup: {
    marginBottom: '10px'
  },
  
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold'
  },
  
  input: {
    width: '100%',
    padding: '8px',
    borderRadius: '4px',
    border: '1px solid #ccc'
  },
  
  testBtn: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    backgroundColor: '#2196f3',
    color: 'white',
    transition: 'background-color 0.2s'
  },
  
  createBtn: {
    backgroundColor: '#4caf50'
  },
  
  closeBtn: {
    backgroundColor: '#f44336'
  },
  
  navBtn: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    backgroundColor: '#9c27b0',
    color: 'white',
    transition: 'background-color 0.2s'
  },
  
  clearBtn: {
    padding: '8px 12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: 'bold',
    backgroundColor: '#ff9800',
    color: 'white',
    marginTop: '10px',
    transition: 'background-color 0.2s'
  },
  
  errorAlert: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '15px'
  },
  
  statusActive: {
    color: '#4caf50',
    fontWeight: 'bold'
  },
  
  statusInactive: {
    color: '#f44336',
    fontWeight: 'bold'
  },
  
  noResults: {
    textAlign: 'center' as const,
    color: '#757575',
    padding: '20px'
  },
  
  resultsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px'
  },
  
  resultItem: {
    padding: '10px',
    borderRadius: '4px',
    borderLeft: '4px solid'
  },
  
  resultSuccess: {
    backgroundColor: '#e8f5e9',
    borderLeftColor: '#4caf50'
  },
  
  resultFailure: {
    backgroundColor: '#ffebee',
    borderLeftColor: '#f44336'
  },
  
  resultTitle: {
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  
  resultMessage: {
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap' as const,
    wordBreak: 'break-word' as const
  }
};

export default TestPage; 