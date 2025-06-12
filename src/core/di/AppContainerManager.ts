import { Container } from 'inversify';
import { MusicArrangementContainer } from '../../modules/music-arrangement';
import type { MusicArrangementService } from '../../modules/music-arrangement';
import { MusicArrangementTypes } from '../../modules/music-arrangement/di/MusicArrangementTypes';

/**
 * 統一的應用程式容器管理器
 * 管理所有 Bounded Context 的依賴注入容器
 */
export class AppContainerManager {
  private static instance: AppContainerManager;
  private mainContainer: Container;
  private musicArrangementContainer: MusicArrangementContainer | null = null;
  private isInitialized = false;

  private constructor(mainContainer: Container) {
    this.mainContainer = mainContainer;
  }

  /**
   * 初始化應用程式容器管理器
   */
  public static initialize(mainContainer: Container): AppContainerManager {
    if (!AppContainerManager.instance) {
      AppContainerManager.instance = new AppContainerManager(mainContainer);
    }
    return AppContainerManager.instance;
  }

  /**
   * 獲取單例實例
   */
  public static getInstance(): AppContainerManager {
    if (!AppContainerManager.instance) {
      throw new Error('AppContainerManager not initialized. Call initialize() first.');
    }
    return AppContainerManager.instance;
  }

  /**
   * 載入並初始化所有模組
   */
  public async loadModules(): Promise<void> {
    if (this.isInitialized) {
      console.log('📦 AppContainerManager: Modules already loaded');
      return;
    }

    try {
      console.log('📦 AppContainerManager: Loading modules...');

      // 載入 Music Arrangement BC
      await this.loadMusicArrangementModule();

      // 在這裡可以載入其他模組
      // await this.loadCollaborationModule();
      // await this.loadJamSessionModule();
      // await this.loadIdentityModule();

      this.isInitialized = true;
      console.log('✅ AppContainerManager: All modules loaded successfully');
    } catch (error) {
      console.error('❌ AppContainerManager: Failed to load modules:', error);
      throw error;
    }
  }

  /**
   * 載入 Music Arrangement 模組
   */
  private async loadMusicArrangementModule(): Promise<void> {
    try {
      this.musicArrangementContainer = new MusicArrangementContainer();
      
      // 將容器註冊到主容器中
      this.mainContainer.bind('MusicArrangementContainer')
        .toConstantValue(this.musicArrangementContainer);

      // 初始化模組
      await this.musicArrangementContainer.initialize();
      
      console.log('🎵 AppContainerManager: Music Arrangement module loaded');
    } catch (error) {
      console.error('❌ AppContainerManager: Failed to load Music Arrangement module:', error);
      throw error;
    }
  }

  /**
   * 獲取 Music Arrangement 服務
   */
  public getMusicArrangementService(): MusicArrangementService | null {
    if (!this.musicArrangementContainer) {
      console.warn('⚠️ AppContainerManager: Music Arrangement container not loaded');
      return null;
    }

    try {
      return this.musicArrangementContainer.get<MusicArrangementService>(
        MusicArrangementTypes.MusicArrangementService
      );
    } catch (error) {
      console.error('❌ AppContainerManager: Failed to get Music Arrangement service:', error);
      return null;
    }
  }

  /**
   * 檢查模組是否可用
   */
  public isMusicArrangementAvailable(): boolean {
    return this.musicArrangementContainer !== null;
  }

  /**
   * 獲取模組容器（給進階使用者）
   */
  public getMusicArrangementContainer(): MusicArrangementContainer | null {
    return this.musicArrangementContainer;
  }

  /**
   * 清理資源
   */
  public dispose(): void {
    try {
      if (this.musicArrangementContainer) {
        this.musicArrangementContainer.dispose();
        this.musicArrangementContainer = null;
      }
      
      this.isInitialized = false;
      console.log('🧹 AppContainerManager: Resources disposed');
    } catch (error) {
      console.error('❌ AppContainerManager: Error during disposal:', error);
    }
  }
} 