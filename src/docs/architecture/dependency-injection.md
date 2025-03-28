# DAW 依賴注入系統設計文檔

## 1. 系統概述

DAW 的依賴注入系統主要負責：
1. 服務註冊和管理
2. 依賴解析和注入
3. 生命週期管理
4. 工廠模式支持

## 2. 核心組件

### 2.1 容器接口

```typescript
export interface Container {
    register<T>(token: string, provider: Provider<T>): void;
    registerSingleton<T>(token: string, provider: Provider<T>): void;
    registerFactory<T>(token: string, factory: Factory<T>): void;
    resolve<T>(token: string): T;
    has(token: string): boolean;
    clear(): void;
}
```

### 2.2 依賴注入裝飾器

```typescript
// 服務註冊裝飾器
export function Injectable(options: InjectableOptions = {}): ClassDecorator {
    return (target: any) => {
        Reflect.defineMetadata('injectable', true, target);
        Reflect.defineMetadata('singleton', options.singleton || false, target);
        Reflect.defineMetadata('dependencies', options.dependencies || [], target);
    };
}

// 依賴注入裝飾器
export function Inject(token: string): PropertyDecorator {
    return (target: any, propertyKey: string | symbol) => {
        const dependencies = Reflect.getMetadata('dependencies', target.constructor) || [];
        dependencies.push({ token, propertyKey });
        Reflect.defineMetadata('dependencies', dependencies, target.constructor);
    };
}

// 工廠註冊裝飾器
export function InjectableFactory(): MethodDecorator {
    return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
        Reflect.defineMetadata('factory', true, descriptor.value);
        return descriptor;
    };
}
```

### 2.3 容器實現

```typescript
export class ContainerImpl implements Container {
    private providers: Map<string, Provider<any>>;
    private instances: Map<string, any>;
    private factories: Map<string, Factory<any>>;
    
    constructor() {
        this.providers = new Map();
        this.instances = new Map();
        this.factories = new Map();
    }
    
    // 註冊服務
    register<T>(token: string, provider: Provider<T>): void {
        this.providers.set(token, provider);
    }
    
    // 註冊單例服務
    registerSingleton<T>(token: string, provider: Provider<T>): void {
        this.providers.set(token, {
            ...provider,
            singleton: true
        });
    }
    
    // 註冊工廠
    registerFactory<T>(token: string, factory: Factory<T>): void {
        this.factories.set(token, factory);
    }
    
    // 解析依賴
    resolve<T>(token: string): T {
        // 檢查工廠
        if (this.factories.has(token)) {
            return this.factories.get(token)!(this);
        }
        
        // 檢查單例
        if (this.instances.has(token)) {
            return this.instances.get(token);
        }
        
        // 檢查提供者
        const provider = this.providers.get(token);
        if (!provider) {
            throw new Error(`No provider found for token: ${token}`);
        }
        
        // 創建實例
        const instance = this.createInstance(provider);
        
        // 如果是單例，保存實例
        if (provider.singleton) {
            this.instances.set(token, instance);
        }
        
        return instance;
    }
    
    // 創建實例
    private createInstance<T>(provider: Provider<T>): T {
        const dependencies = provider.dependencies || [];
        const resolvedDependencies = dependencies.map(dep => this.resolve(dep));
        
        return new provider.useClass(...resolvedDependencies);
    }
    
    // 檢查服務是否存在
    has(token: string): boolean {
        return this.providers.has(token) || this.factories.has(token);
    }
    
    // 清理容器
    clear(): void {
        this.providers.clear();
        this.instances.clear();
        this.factories.clear();
    }
}
```

## 3. 服務註冊

### 3.1 基礎服務註冊

```typescript
// 註冊基礎服務
container.register('AudioEngine', {
    useClass: AudioEngine,
    dependencies: ['AudioContext', 'EventBus']
});

container.register('EventBus', {
    useClass: EventBus,
    dependencies: []
});

// 註冊單例服務
container.registerSingleton('AudioContext', {
    useClass: AudioContext,
    dependencies: []
});

// 註冊工廠服務
container.registerFactory('AudioBuffer', (container) => {
    return new AudioBuffer(container.resolve('AudioContext'));
});
```

### 3.2 使用裝飾器註冊

```typescript
@Injectable({ singleton: true })
class AudioEngine {
    constructor(
        @Inject('AudioContext') private context: AudioContext,
        @Inject('EventBus') private eventBus: EventBus
    ) {}
}

@Injectable()
class EventBus {
    constructor() {}
}

@Injectable()
class AudioContext {
    constructor() {}
}
```

## 4. 生命週期管理

### 4.1 生命週期鉤子

```typescript
export interface LifecycleHooks {
    onInit?(): void;
    onDestroy?(): void;
}

export class BaseComponent implements LifecycleHooks {
    onInit(): void {
        // 初始化邏輯
    }
    
    onDestroy(): void {
        // 清理邏輯
    }
}
```

### 4.2 生命週期管理器

```typescript
export class LifecycleManager {
    private static instance: LifecycleManager;
    private components: Set<LifecycleHooks>;
    
    private constructor() {
        this.components = new Set();
    }
    
    static getInstance(): LifecycleManager {
        if (!LifecycleManager.instance) {
            LifecycleManager.instance = new LifecycleManager();
        }
        return LifecycleManager.instance;
    }
    
    // 註冊組件
    registerComponent(component: LifecycleHooks): void {
        this.components.add(component);
        if (component.onInit) {
            component.onInit();
        }
    }
    
    // 註銷組件
    unregisterComponent(component: LifecycleHooks): void {
        if (component.onDestroy) {
            component.onDestroy();
        }
        this.components.delete(component);
    }
    
    // 清理所有組件
    destroyAll(): void {
        this.components.forEach(component => {
            if (component.onDestroy) {
                component.onDestroy();
            }
        });
        this.components.clear();
    }
}
```

## 5. 依賴注入最佳實踐

1. **服務註冊原則**
   - 使用接口定義服務
   - 遵循單一職責原則
   - 避免循環依賴
   - 合理使用單例模式

2. **依賴注入方式**
   - 優先使用構造函數注入
   - 避免使用屬性注入
   - 使用工廠模式創建複雜對象
   - 使用裝飾器簡化註冊

3. **生命週期管理**
   - 實現生命週期鉤子
   - 及時清理資源
   - 避免內存洩漏
   - 處理異步初始化

4. **錯誤處理**
   - 處理依賴解析錯誤
   - 提供錯誤恢復機制
   - 記錄錯誤日誌
   - 實現優雅降級

5. **性能優化**
   - 使用依賴緩存
   - 延遲加載服務
   - 優化依賴圖
   - 避免不必要的實例化

6. **測試策略**
   - 使用依賴注入進行單元測試
   - 模擬依賴服務
   - 測試生命週期鉤子
   - 驗證依賴關係

7. **調試支持**
   - 提供依賴圖可視化
   - 支持依賴追蹤
   - 記錄服務生命週期
   - 提供診斷工具 