# DAW 分層架構文檔

## 1. 目錄結構

    ```
    src/
    ├── presentation/           # 表現層
    │   ├── components/        # UI 組件
    │   │   ├── daw/          # DAW 相關 UI
    │   │   │   ├── track/    # 軌道相關
    │   │   │   ├── timeline/ # 時間軸相關
    │   │   │   └── ui/       # 通用 UI
    │   │   └── common/       # 通用組件
    │   ├── containers/       # 容器組件
    │   └── core/            # 表現層核心
    │       └── PixiManager.ts
    │
    ├── domain/               # 領域層
    │   ├── daw/             # DAW 領域
    │   │   ├── track/       # 軌道領域
    │   │   ├── timeline/    # 時間軸領域
    │   │   └── audio/       # 音頻領域
    │   └── core/            # 領域層核心
    │       └── DAWManager.ts
    │
    ├── data/                 # 數據層
    │   ├── repositories/     # 數據倉庫
    │   ├── models/          # 數據模型
    │   └── store/           # 狀態管理
    │
    ├── core/                 # 核心功能
    │   ├── di/              # 依賴注入
    │   │   ├── types.ts     # 類型定義
    │   │   └── container.ts # 容器配置
    │   └── events/          # 事件系統
    │
    ├── types/                # 類型定義
    ├── config/               # 配置文件
    └── utils/                # 工具函數
    ```

## 2. 依賴注入系統

### 2.1 概述

本專案使用 Inversify 作為依賴注入容器，提供了完整的依賴注入功能，包括：

- 類型安全的依賴注入
- 裝飾器支援
- 生命週期管理
- 作用域管理
- 工廠模式支援
- 循環依賴處理

### 2.2 核心組件

#### 2.2.1 類型定義 (types.ts)

    ```typescript
    // 定義服務標識符
    export const TYPES = {
        AudioContext: Symbol.for("AudioContext"),
        EventBus: Symbol.for("EventBus"),
        AudioEngine: Symbol.for("AudioEngine")
    };

    // 定義介面
    export interface IAudioContext {
        onInit(): void;
        onDestroy(): void;
    }

    // ... 其他介面定義
    ```

#### 2.2.2 容器配置 (container.ts)

    ```typescript
    @injectable()
    export class AudioContext implements IAudioContext {
        constructor() {
            this.onInit();
        }
        // ... 實現
    }

    // 服務註冊
    export function registerServices(): void {
        container.bind<IAudioContext>(TYPES.AudioContext)
            .to(AudioContext)
            .inSingletonScope();
        // ... 其他服務註冊
    }
    ```

### 2.3 使用方式

1. **註冊服務**

    ```typescript
    registerServices();
    ```

2. **獲取服務**

    ```typescript
    const engine = container.get<IAudioEngine>(TYPES.AudioEngine);
    ```

3. **使用服務**

    ```typescript
    engine.onInit();
    ```

### 2.4 最佳實踐

1. **使用介面**
   - 總是為服務定義介面
   - 使用介面而不是具體實現

2. **使用 Symbol 作為 Token**
   - 避免使用字串作為 Token
   - 使用 Symbol 確保唯一性

3. **適當的作用域**
   - 使用單例作用域共享狀態
   - 使用瞬態作用域避免狀態共享

4. **生命週期管理**
   - 實現 `onInit` 和 `onDestroy` 方法
   - 在適當的時機調用這些方法

5. **錯誤處理**
   - 使用 try-catch 處理初始化錯誤
   - 提供適當的錯誤信息

### 2.5 與其他層的整合

1. **表現層**
   - UI 組件通過 DI 獲取服務
   - 使用裝飾器注入依賴

2. **領域層**
   - 領域服務通過 DI 獲取依賴
   - 使用介面定義服務契約

3. **數據層**
   - 數據倉庫通過 DI 獲取配置
   - 使用工廠模式創建實例

## 3. 基礎接口定義

### 3.1 基礎服務接口

    ```typescript
    interface BaseService {
        initialize(): void;
        destroy(): void;
        isInitialized(): boolean;
    }

    class BaseServiceImpl implements BaseService {
        private initialized: boolean = false;
        
        initialize(): void {
            if (this.initialized) return;
            this.setup();
            this.initialized = true;
        }
        
        destroy(): void {
            if (!this.initialized) return;
            this.cleanup();
            this.initialized = false;
        }
        
        isInitialized(): boolean {
            return this.initialized;
        }
        
        protected setup(): void {
            // 由子類實現
        }
        
        protected cleanup(): void {
            // 由子類實現
        }
    }
    ```

### 3.2 基礎組件接口

    ```typescript
    interface BaseComponent {
        initialize(): void;
        setup(): void;
        update(): void;
        destroy(): void;
        isInitialized(): boolean;
    }

    abstract class BaseComponentImpl implements BaseComponent {
        private initialized: boolean = false;
        protected eventHandlers: EventHandlerManager;
        
        constructor() {
            this.eventHandlers = new EventHandlerManager();
        }
        
        initialize(): void {
            if (this.initialized) return;
            this.setup();
            this.initialized = true;
        }
        
        abstract setup(): void;
        
        update(): void {
            if (!this.initialized) return;
            // 由子類實現
        }
        
        destroy(): void {
            if (!this.initialized) return;
            this.cleanup();
            this.initialized = false;
        }
        
        isInitialized(): boolean {
            return this.initialized;
        }
        
        protected cleanup(): void {
            this.eventHandlers.clear();
        }
    }
    ```

## 4. 各層職責

### 4.1 表現層（Presentation Layer）

- 負責 UI 渲染和用戶交互
- 處理視覺效果和動畫
- 發送 UI 事件
- 監聽 Domain 事件並更新 UI
- 不包含業務邏輯
- 實現組件生命週期管理
- 處理用戶輸入驗證

### 4.2 領域層（Domain Layer）

- 實現核心業務邏輯
- 處理數據驗證和轉換
- 發送 Domain 事件
- 監聽 UI 事件並轉換為 Domain 事件
- 不依賴於具體的 UI 實現
- 實現服務生命週期管理
- 處理業務規則驗證

### 4.3 數據層（Data Layer）

- 管理數據持久化
- 提供數據訪問接口
- 實現數據模型
- 不包含業務邏輯
- 實現數據驗證
- 處理數據轉換
- 管理數據緩存

## 5. 層間通信

### 5.1 事件驅動通信

    ```typescript
    // 1. 定義事件轉換器
    class EventTranslator {
        constructor(
            private uiEventBus: UIEventBus,
            private domainEventBus: DomainEventBus
        ) {
            this.setupTranslations();
        }

        private setupTranslations(): void {
            // UI -> Domain 事件轉換
            this.setupUIToDomainTranslations();
            
            // Domain -> UI 事件轉換
            this.setupDomainToUITranslations();
        }

        private setupUIToDomainTranslations(): void {
            // 播放控制事件轉換
            this.uiEventBus.on('ui:playback:start', () => {
                this.domainEventBus.emit('domain:audio:playback:started');
            });

            // 軌道事件轉換
            this.uiEventBus.on('ui:track:add', (payload) => {
                const track = this.createTrackFromPayload(payload);
                this.domainEventBus.emit('domain:track:added', { track });
            });

            // 片段事件轉換
            this.uiEventBus.on('ui:clip:move', (payload) => {
                this.domainEventBus.emit('domain:clip:moved', {
                    clipId: payload.clipId,
                    newStartTime: payload.newPosition
                });
            });
        }

        private setupDomainToUITranslations(): void {
            // 音頻事件轉換
            this.domainEventBus.on('domain:audio:playback:started', () => {
                this.uiEventBus.emit('ui:playback:start');
            });

            // 軌道事件轉換
            this.domainEventBus.on('domain:track:added', (payload) => {
                this.uiEventBus.emit('ui:track:created', {
                    trackId: payload.track.id,
                    type: payload.track.type
                });
            });

            // 片段事件轉換
            this.domainEventBus.on('domain:clip:moved', (payload) => {
                this.uiEventBus.emit('ui:clip:updated', {
                    clipId: payload.clipId,
                    position: payload.newStartTime
                });
            });
        }

        private createTrackFromPayload(payload: any): Track {
            // 實現從 UI 事件數據創建領域模型的邏輯
            return new Track({
                id: payload.trackId,
                type: payload.type,
                // ... 其他屬性
            });
        }
    }

    // 2. 在依賴注入容器中註冊
    const container = Container.getInstance();
    container.register('EventTranslator', new EventTranslator(
        container.get('UIEventBus'),
        container.get('DomainEventBus')
    ));
    ```

### 5.2 服務調用通信

    ```typescript
    // 1. 定義服務接口
    interface ITrackPresenter {
        addTrack(name: string): void;
        removeTrack(id: string): void;
        playTrack(id: string): void;
        stopTrack(id: string): void;
    }

    interface IAudioPresenter {
        play(): void;
        stop(): void;
        pause(): void;
    }

    // 2. 實現 Presenter
    class TrackPresenter implements ITrackPresenter {
        constructor(
            private trackService: TrackService,
            private uiEventBus: UIEventBus,
            private domainEventBus: DomainEventBus
        ) {
            this.setupEventHandlers();
        }

        private setupEventHandlers(): void {
            // 處理 Domain 事件
            this.domainEventBus.on('domain:track:added', (payload) => {
                this.uiEventBus.emit('ui:track:created', {
                    trackId: payload.track.id
                });
            });
        }

        addTrack(name: string): void {
            this.trackService.addTrack(name);
        }

        removeTrack(id: string): void {
            this.trackService.removeTrack(id);
        }

        playTrack(id: string): void {
            this.trackService.playTrack(id);
        }

        stopTrack(id: string): void {
            this.trackService.stopTrack(id);
        }
    }

    // 3. 在組件中使用
    class TrackComponent extends BaseComponent {
        constructor(
            private trackPresenter: ITrackPresenter,
            private audioPresenter: IAudioPresenter
        ) {
            super();
        }

        private handleAddTrack(): void {
            this.trackPresenter.addTrack('New Track');
        }

        private handlePlayTrack(id: string): void {
            this.trackPresenter.playTrack(id);
            this.audioPresenter.play();
        }
    }

    // 4. 依賴注入配置
    class PresentationModule {
        static configure(container: Container): void {
            // 註冊 Presenters
            container.register('TrackPresenter', new TrackPresenter(
                container.get('TrackService'),
                container.get('UIEventBus'),
                container.get('DomainEventBus')
            ));

            container.register('AudioPresenter', new AudioPresenter(
                container.get('AudioService'),
                container.get('UIEventBus'),
                container.get('DomainEventBus')
            ));

            // 註冊組件
            container.register('TrackComponent', new TrackComponent(
                container.get('TrackPresenter'),
                container.get('AudioPresenter')
            ));
        }
    }
    ```

### 5.3 跨層通信最佳實踐

1. **事件驅動通信**
   - 使用事件轉換器處理層間事件轉換
   - 保持事件命名的一致性
   - 避免在事件處理器中執行耗時操作
   - 及時清理事件監聽器

2. **服務調用通信**
   - 使用 Presenter 模式處理層間服務調用
   - 定義清晰的服務接口
   - 避免直接依賴具體實現
   - 使用依賴注入管理服務實例

3. **數據轉換**
   - 在適當的層處理數據轉換
   - 使用 DTO 對象傳遞數據
   - 保持數據模型的一致性
   - 處理數據驗證和錯誤

4. **錯誤處理**
   - 在適當的層處理錯誤
   - 使用統一的錯誤類型
   - 提供清晰的錯誤信息
   - 實現錯誤恢復機制

5. **性能考慮**
   - 避免不必要的層間通信
   - 使用事件批處理
   - 實現數據緩存
   - 監控通信性能

## 6. 錯誤處理

### 6.1 錯誤類型定義

    ```typescript
    class DAWError extends Error {
        constructor(
            message: string,
            public code: string,
            public component: string
        ) {
            super(message);
            this.name = 'DAWError';
        }
    }

    class ValidationError extends DAWError {
        constructor(message: string, component: string) {
            super(message, 'VALIDATION_ERROR', component);
        }
    }

    class BusinessError extends DAWError {
        constructor(message: string, component: string) {
            super(message, 'BUSINESS_ERROR', component);
        }
    }
    ```

### 6.2 錯誤處理服務

    ```typescript
    class ErrorHandlingService {
        private static instance: ErrorHandlingService;
        
        static getInstance(): ErrorHandlingService {
            if (!ErrorHandlingService.instance) {
                ErrorHandlingService.instance = new ErrorHandlingService();
            }
            return ErrorHandlingService.instance;
        }
        
        handleError(error: DAWError): void {
            console.error(`[${error.component}] ${error.code}: ${error.message}`);
            // 可以添加錯誤報告邏輯
        }
    }
    ```

## 7. 系統整合

### 7.1 事件系統與狀態管理整合

    ```typescript
    // 狀態變更事件
    interface StateChangeEvent<T> extends Event {
        type: 'domain:state:changed';
        payload: {
            stateKey: string;
            oldValue: T;
            newValue: T;
            timestamp: number;
        };
    }

    // 狀態管理器與事件系統整合
    class StateManager {
        constructor(
            private eventBus: EventBus,
            private stateStore: StateStore
        ) {
            this.setupEventHandlers();
        }
        
        private setupEventHandlers(): void {
            // 監聽狀態變更事件
            this.eventBus.on('domain:state:changed', (event: StateChangeEvent<any>) => {
                this.handleStateChange(event.payload);
            });
        }
        
        private handleStateChange<T>(payload: {
            stateKey: string;
            oldValue: T;
            newValue: T;
            timestamp: number;
        }): void {
            // 更新狀態
            this.stateStore.update(payload.stateKey, payload.newValue);
            
            // 觸發 UI 更新事件
            this.eventBus.emit('ui:state:updated', {
                stateKey: payload.stateKey,
                value: payload.newValue
            });
        }
    }
    ```

### 7.2 依賴注入與分層整合

    ```typescript
    // 分層模組配置
    class PresentationModule {
        static configure(container: Container): void {
            // 註冊 UI 組件
            container.register('TrackComponent', {
                implementation: TrackComponent,
                scope: 'transient',
                dependencies: ['TrackService', 'EventBus']
            });
            
            // 註冊容器組件
            container.register('TrackContainer', {
                implementation: TrackContainer,
                scope: 'singleton',
                dependencies: ['TrackComponent', 'StateManager']
            });
        }
    }

    class DomainModule {
        static configure(container: Container): void {
            // 註冊領域服務
            container.register('TrackService', {
                implementation: TrackService,
                scope: 'singleton',
                dependencies: ['TrackRepository', 'AudioService']
            });
            
            // 註冊事件處理器
            container.register('TrackEventHandler', {
                implementation: TrackEventHandler,
                scope: 'singleton',
                dependencies: ['EventBus', 'StateManager']
            });
        }
    }

    class DataModule {
        static configure(container: Container): void {
            // 註冊數據倉庫
            container.register('TrackRepository', {
                implementation: TrackRepository,
                scope: 'singleton',
                dependencies: ['DatabaseService']
            });
            
            // 註冊狀態存儲
            container.register('StateStore', {
                implementation: StateStore,
                scope: 'singleton',
                dependencies: ['PersistenceService']
            });
        }
    }

    class InfrastructureModule {
        static configure(container: Container): void {
            // 註冊基礎設施服務
            container.register('DatabaseService', {
                implementation: DatabaseService,
                scope: 'singleton',
                dependencies: ['ConfigService']
            });
            
            container.register('PersistenceService', {
                implementation: PersistenceService,
                scope: 'singleton',
                dependencies: ['DatabaseService']
            });
            
            container.register('EventBus', {
                implementation: EventBus,
                scope: 'singleton'
            });
        }
    }
    ```

### 7.3 音頻處理與性能優化整合

    ```typescript
    // 音頻處理優化器
    class AudioProcessingOptimizer {
        constructor(
            private audioEngine: AudioEngine,
            private performanceMonitor: PerformanceMonitor
        ) {
            this.setupOptimization();
        }
        
        private setupOptimization(): void {
            // 監控音頻處理性能
            this.performanceMonitor.track('audio:processing', () => {
                return this.audioEngine.getProcessingTime();
            });
            
            // 動態調整緩衝區大小
            this.performanceMonitor.onThreshold('audio:processing', 16, () => {
                this.audioEngine.increaseBufferSize();
            });
            
            // 優化音頻路由
            this.audioEngine.on('route:created', (route) => {
                this.optimizeAudioRoute(route);
            });
        }
        
        private optimizeAudioRoute(route: AudioRoute): void {
            // 實現音頻路由優化邏輯
            route.setBufferSize(this.calculateOptimalBufferSize());
            route.setProcessingPriority(this.calculateProcessingPriority());
        }
        
        private calculateOptimalBufferSize(): number {
            // 根據系統性能動態計算緩衝區大小
            const processingTime = this.performanceMonitor.getMetric('audio:processing');
            return Math.max(256, Math.min(2048, processingTime * 1000));
        }
        
        private calculateProcessingPriority(): number {
            // 根據音頻重要性計算處理優先級
            return this.audioEngine.getActiveTracks().length > 8 ? 1 : 0;
        }
    }
    ```

### 7.4 系統啟動流程

    ```typescript
    class SystemBootstrap {
        constructor(private container: Container) {}
        
        async initialize(): Promise<void> {
            // 1. 初始化基礎設施
            await this.initializeInfrastructure();
            
            // 2. 初始化數據層
            await this.initializeDataLayer();
            
            // 3. 初始化領域層
            await this.initializeDomainLayer();
            
            // 4. 初始化表現層
            await this.initializePresentationLayer();
            
            // 5. 啟動性能監控
            this.startPerformanceMonitoring();
        }
        
        private async initializeInfrastructure(): Promise<void> {
            const infrastructureModule = new InfrastructureModule();
            infrastructureModule.configure(this.container);
            
            // 初始化基礎服務
            await this.container.get('DatabaseService').initialize();
            await this.container.get('EventBus').initialize();
        }
        
        private async initializeDataLayer(): Promise<void> {
            const dataModule = new DataModule();
            dataModule.configure(this.container);
            
            // 初始化數據服務
            await this.container.get('StateStore').initialize();
        }
        
        private async initializeDomainLayer(): Promise<void> {
            const domainModule = new DomainModule();
            domainModule.configure(this.container);
            
            // 初始化領域服務
            await this.container.get('TrackService').initialize();
        }
        
        private async initializePresentationLayer(): Promise<void> {
            const presentationModule = new PresentationModule();
            presentationModule.configure(this.container);
            
            // 初始化 UI 組件
            await this.container.get('TrackContainer').initialize();
        }
        
        private startPerformanceMonitoring(): void {
            const monitor = this.container.get('PerformanceMonitor');
            monitor.start();
        }
    }
    ```

## 8. 開發規範

### 8.1 命名規範

- 表現層組件：`XXXComponent`
- 領域層服務：`XXXService`
- 數據層倉庫：`XXXRepository`
- UI 事件：`ui:xxx`
- Domain 事件：`domain:xxx`
- 錯誤類型：`XXXError`

### 8.2 代碼組織

- 每個組件一個文件
- 相關功能放在同一目錄
- 使用 index.ts 導出公共接口
- 遵循單一職責原則
- 保持高內聚低耦合

### 8.3 錯誤處理

- 使用自定義錯誤類型
- 統一錯誤處理流程
- 提供詳細錯誤信息
- 實現錯誤恢復機制
- 記錄錯誤日誌

### 8.4 性能考慮

- 實現懶加載
- 使用緩存機制
- 優化事件處理
- 控制重繪頻率
- 監控性能指標
