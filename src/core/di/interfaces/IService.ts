/**
 * 基礎服務接口
 * Base service interface that all services should implement
 */
export interface IService {
    /**
     * 初始化服務
     * Initialize the service
     */
    initialize(): Promise<void>;

    /**
     * 銷毀服務
     * Destroy the service and clean up resources
     */
    destroy(): Promise<void>;

    /**
     * 檢查服務是否已初始化
     * Check if the service is initialized
     */
    isInitialized(): boolean;

    /**
     * 獲取服務名稱
     * Get the service name
     */
    getName(): string;

    /**
     * 獲取服務版本
     * Get the service version
     */
    getVersion(): string;
} 