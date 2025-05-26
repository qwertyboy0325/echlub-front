import React, { useCallback, useState } from 'react';
import { useInjection } from '../../../../core/di/useInjection';
import { JamSessionTypes } from '../../di/JamSessionTypes';
import type { JamSessionPresenter } from '../JamSessionPresenter';
import type { SessionDto } from '../../application/types';

export const JamSessionComponent: React.FC = () => {
  const presenter = useInjection<JamSessionPresenter>(JamSessionTypes.JamSessionPresenter);
  const [currentSession, setCurrentSession] = useState<SessionDto | null>(null);

  // === 查詢處理器 ===
  const handleGetSession = useCallback(async (sessionId: string) => {
    try {
      const session = await presenter.getSessionById(sessionId);
      setCurrentSession(session);
      console.log('Session details:', session);
    } catch (error) {
      console.error('Failed to get session:', error);
    }
  }, [presenter]);

  const handleGetCurrentSessionInRoom = useCallback(async (roomId: string) => {
    try {
      const session = await presenter.getCurrentSessionInRoom(roomId);
      setCurrentSession(session);
      console.log('Current session in room:', session);
    } catch (error) {
      console.error('Failed to get current session:', error);
    }
  }, [presenter]);

  // === 命令處理器 ===
  const handleCreateSession = useCallback(async () => {
    try {
      const roomId = 'room-123'; // 從某處獲取
      const peerId = 'peer-123'; // 從某處獲取
      const sessionId = await presenter.createSession(roomId, peerId);
      console.log('Session created:', sessionId);
      // 創建後立即獲取會話詳情
      await handleGetSession(sessionId);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  }, [presenter, handleGetSession]);

  const handleJoinSession = useCallback(async (sessionId: string) => {
    try {
      const peerId = 'peer-456'; // 從某處獲取
      await presenter.joinSession(sessionId, peerId);
      console.log('Joined session:', sessionId);
      // 加入後更新會話詳情
      await handleGetSession(sessionId);
    } catch (error) {
      console.error('Failed to join session:', error);
    }
  }, [presenter, handleGetSession]);

  const handleSetRole = useCallback(async (sessionId: string) => {
    try {
      const peerId = 'peer-123'; // 從某處獲取
      await presenter.setPlayerRole(
        sessionId,
        peerId,
        'drummer',
        'Drummer',
        '#FF0000'
      );
      console.log('Role set for player:', peerId);
      // 設置角色後更新會話詳情
      await handleGetSession(sessionId);
    } catch (error) {
      console.error('Failed to set role:', error);
    }
  }, [presenter, handleGetSession]);

  const handleToggleReady = useCallback(async (sessionId: string) => {
    try {
      const peerId = 'peer-123'; // 從某處獲取
      await presenter.togglePlayerReady(sessionId, peerId, true);
      console.log('Player ready state toggled');
      // 切換準備狀態後更新會話詳情
      await handleGetSession(sessionId);
    } catch (error) {
      console.error('Failed to toggle ready state:', error);
    }
  }, [presenter, handleGetSession]);

  return (
    <div>
      <h1>Jam Session</h1>
      
      {/* 命令操作 */}
      <div className="command-section">
        <h2>Actions</h2>
        <button onClick={handleCreateSession}>
          Create New Session
        </button>
        <button onClick={() => handleJoinSession('some-session-id')}>
          Join Session
        </button>
        <button onClick={() => handleSetRole('some-session-id')}>
          Set Role
        </button>
        <button onClick={() => handleToggleReady('some-session-id')}>
          Toggle Ready
        </button>
      </div>

      {/* 查詢操作 */}
      <div className="query-section">
        <h2>Session Info</h2>
        <button onClick={() => handleGetSession('some-session-id')}>
          Refresh Session Info
        </button>
        <button onClick={() => handleGetCurrentSessionInRoom('room-123')}>
          Get Current Room Session
        </button>
        
        {/* 顯示會話資訊 */}
        {currentSession && (
          <div className="session-info">
            <h3>Current Session</h3>
            <pre>{JSON.stringify(currentSession, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}; 