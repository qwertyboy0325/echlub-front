import type { MusicArrangementService } from '../../modules/music-arrangement';
import { AppContainerManager } from '../../core/di/AppContainerManager';

/**
 * 橋接層 - 連接 UI 適配器和 Business Context
 * 提供漸進式遷移，不破壞現有功能
 */
export class MusicArrangementBridge {
  private musicArrangementService: MusicArrangementService | null = null;
  private isConnectedToBC = false;

  constructor() {
    this.initializeConnection();
  }

  /**
   * 初始化與 BC 的連接
   */
  private initializeConnection(): void {
    try {
      const appContainerManager = AppContainerManager.getInstance();
      
      if (appContainerManager.isMusicArrangementAvailable()) {
        this.musicArrangementService = appContainerManager.getMusicArrangementService();
        this.isConnectedToBC = this.musicArrangementService !== null;
        
        if (this.isConnectedToBC) {
          console.log('🔗 MusicArrangementBridge: Successfully connected to BC');
        } else {
          console.warn('⚠️ MusicArrangementBridge: Service not available, using local state');
        }
      } else {
        console.log('🔗 MusicArrangementBridge: BC not loaded yet, using local state');
      }
    } catch (error) {
      console.warn('⚠️ MusicArrangementBridge: Failed to connect to BC, falling back to local state:', error);
      this.isConnectedToBC = false;
    }
  }

  /**
   * 重新嘗試連接（用於延遲載入情況）
   */
  public tryReconnect(): boolean {
    if (!this.isConnectedToBC) {
      this.initializeConnection();
    }
    return this.isConnectedToBC;
  }

  /**
   * 檢查是否已連接到 BC
   */
  public isConnected(): boolean {
    return this.isConnectedToBC;
  }

  /**
   * 創建音軌 - 如果連接到 BC 則使用 BC，否則返回 null (使用本地邏輯)
   */
  public async createTrack(ownerId: string, type: string, name: string): Promise<string | null> {
    if (this.isConnectedToBC && this.musicArrangementService) {
      try {
        const trackId = await this.musicArrangementService.createTrack(ownerId, type, name);
        console.log('🎵 BC Track created:', trackId);
        return trackId;
      } catch (error) {
        console.error('❌ BC createTrack failed:', error);
        return null; // 回退到本地邏輯
      }
    }
    return null; // 使用本地邏輯
  }

  /**
   * 取得音軌資訊
   */
  public async getTrackInfo(trackId: string): Promise<any | null> {
    if (this.isConnectedToBC && this.musicArrangementService) {
      try {
        const trackInfo = await this.musicArrangementService.getTrackInfo(trackId);
        console.log('🎵 BC Track info:', trackInfo);
        return trackInfo;
      } catch (error) {
        console.error('❌ BC getTrackInfo failed:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * 取得系統統計
   */
  public async getSystemStats(): Promise<any | null> {
    if (this.isConnectedToBC && this.musicArrangementService) {
      try {
        const stats = await this.musicArrangementService.getSystemStats();
        console.log('📊 BC System stats:', stats);
        return stats;
      } catch (error) {
        console.error('❌ BC getSystemStats failed:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * 創建 MIDI 片段（暫時禁用，需要確認正確的 API 格式）
   */
  public async createMidiClip(
    trackId: string, 
    startTime: number, 
    endTime: number, 
    name?: string
  ): Promise<string | null> {
    // TODO: 需要確認 BC 服務的正確參數格式
    console.log('🔄 MusicArrangementBridge: createMidiClip not yet implemented, using local logic');
    return null; // 回退到本地邏輯
  }

  /**
   * 新增 MIDI 音符（暫時禁用，需要確認正確的 API 格式）
   */
  public async addMidiNote(
    clipId: string,
    pitch: number,
    velocity: number,
    startTime: number,
    duration: number
  ): Promise<string | null> {
    // TODO: 需要確認 BC 服務的正確參數格式
    console.log('🔄 MusicArrangementBridge: addMidiNote not yet implemented, using local logic');
    return null; // 回退到本地邏輯
  }
} 