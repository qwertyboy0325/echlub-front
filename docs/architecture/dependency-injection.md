# 依賴注入系統

## 概述

本專案使用 Inversify 作為依賴注入容器。Inversify 是一個強大的 TypeScript 依賴注入容器，提供了完整的依賴注入功能，包括：

- 類型安全的依賴注入
- 裝飾器支援
- 生命週期管理
- 作用域管理
- 工廠模式支援
- 循環依賴處理

## 安裝

```bash
npm install inversify reflect-metadata
```

## 配置

在 `tsconfig.json` 中啟用裝飾器支援：

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## 基本用法

### 1. 定義介面

```typescript
interface IAudioContext {
    onInit(): void;
    onDestroy(): void;
}
```

### 2. 定義 Token

```typescript
const TYPES = {
    AudioContext: Symbol.for("AudioContext")
};
```

### 3. 實現類別

```typescript
@injectable()
class AudioContext implements IAudioContext {
    constructor() {
        console.log("AudioContext constructed");
    }

    onInit(): void {
        console.log("AudioContext initialized");
    }

    onDestroy(): void {
        console.log("AudioContext destroyed");
    }
}
```

### 4. 註冊服務

```typescript
const container = new Container();
container.bind<IAudioContext>(TYPES.AudioContext).to(AudioContext).inSingletonScope();
```

### 5. 使用服務

```typescript
const context = container.get<IAudioContext>(TYPES.AudioContext);
```

## 進階用法

### 1. 依賴注入

```typescript
@injectable()
class AudioEngine {
    constructor(
        @inject(TYPES.AudioContext) private context: IAudioContext,
        @inject(TYPES.EventBus) private eventBus: IEventBus
    ) {}
}
```

### 2. 作用域管理

```typescript
// 單例作用域
container.bind<IAudioContext>(TYPES.AudioContext).to(AudioContext).inSingletonScope();

// 瞬態作用域
container.bind<IAudioContext>(TYPES.AudioContext).to(AudioContext).inTransientScope();

// 請求作用域
container.bind<IAudioContext>(TYPES.AudioContext).to(AudioContext).inRequestScope();
```

### 3. 工廠模式

```typescript
container.bind<IAudioContext>(TYPES.AudioContext).toFactory((context) => {
    return () => new AudioContext();
});
```

### 4. 生命週期管理

```typescript
@injectable()
class AudioContext implements IAudioContext {
    onInit(): void {
        // 初始化邏輯
    }

    onDestroy(): void {
        // 清理邏輯
    }
}
```

## 最佳實踐

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

## 示例

完整的示例可以參考 `src/docs/examples/di-example.ts`。

## 測試

測試示例可以參考 `src/__tests__/examples/di-example.test.ts`。
