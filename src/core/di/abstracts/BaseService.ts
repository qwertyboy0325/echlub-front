import { injectable } from 'inversify';
import { IService } from '../interfaces/IService';

/**
 * 抽象基礎服務類
 * Abstract base service class that implements IService
 */
@injectable()
export abstract class BaseService implements IService {
    protected initialized: boolean = false;
    protected name: string;
    protected version: string;

    constructor() {
        this.name = this.constructor.name;
        this.version = '1.0.0';
    }

    /**
     * 初始化服務
     * Initialize the service
     */
    public async initialize(): Promise<void> {
        if (this.initialized) {
            throw new Error(`Service ${this.name} is already initialized`);
        }

        try {
            await this.onInitialize();
            this.initialized = true;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to initialize service ${this.name}: ${errorMessage}`);
        }
    }

    /**
     * 銷毀服務
     * Destroy the service and clean up resources
     */
    public async destroy(): Promise<void> {
        if (!this.initialized) {
            throw new Error(`Service ${this.name} is not initialized`);
        }

        try {
            await this.onDestroy();
            this.initialized = false;
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to destroy service ${this.name}: ${errorMessage}`);
        }
    }

    /**
     * 檢查服務是否已初始化
     * Check if the service is initialized
     */
    public isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * 獲取服務名稱
     * Get the service name
     */
    public getName(): string {
        return this.name;
    }

    /**
     * 獲取服務版本
     * Get the service version
     */
    public getVersion(): string {
        return this.version;
    }

    /**
     * 子類需要實現的初始化邏輯
     * Initialization logic that subclasses need to implement
     */
    protected abstract onInitialize(): Promise<void>;

    /**
     * 子類需要實現的銷毀邏輯
     * Destruction logic that subclasses need to implement
     */
    protected abstract onDestroy(): Promise<void>;
} 