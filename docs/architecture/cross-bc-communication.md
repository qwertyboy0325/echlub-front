# 跨 Bounded Context 通訊設計

## 通訊模式概述

我們的跨 BC 通訊採用以下三種主要模式：

1. **事件驅動通訊 (Event-Driven Communication)**
   - 異步、鬆耦合的通訊方式
   - 通過事件總線傳遞領域事件
   - 適用於狀態變更通知和後續處理

2. **同步查詢 (Synchronous Query)**
   - 直接通過介面調用
   - 用於即時數據獲取
   - 適用於強一致性要求的場景

3. **共享內核 (Shared Kernel)**
   - 限定範圍內的共享模型
   - 用於多個 BC 都需要的基礎定義
   - 嚴格控制變更和版本管理

## 實現方式

### 1. 事件驅動通訊

```typescript
// infrastructure/events/EventTypes.ts
export enum CrossBCEventTypes {
  // User BC -> Room BC
  USER_REGISTERED = 'user.registered',
  USER_UPDATED = 'user.updated',
  
  // Room BC -> Session BC
  ROOM_CREATED = 'room.created',
  ROOM_CLOSED = 'room.closed',
  
  // Session BC -> Clip BC
  SESSION_STARTED = 'session.started',
  ROLE_CHANGED = 'session.role_changed',
  
  // Clip BC -> Render BC
  CLIP_READY_FOR_RENDER = 'clip.ready_for_render'
}

// infrastructure/events/CrossBCEvent.ts
interface CrossBCEvent<T = any> {
  type: CrossBCEventTypes;
  payload: T;
  metadata: {
    timestamp: number;
    sourceBC: string;
    correlationId: string;
  };
}

// 使用示例 (在 User BC 中)
class UserService {
  private eventBus: IEventBus;
  
  async register(user: User): Promise<void> {
    // 業務邏輯...
    await this.eventBus.emit<UserRegisteredEvent>({
      type: CrossBCEventTypes.USER_REGISTERED,
      payload: {
        userId: user.id,
        username: user.username
      },
      metadata: {
        timestamp: Date.now(),
        sourceBC: 'UserBC',
        correlationId: generateId()
      }
    });
  }
}
```

### 2. 同步查詢

```typescript
// domain/shared/interfaces/ICrossBCQuery.ts
interface ICrossBCQuery<T> {
  execute(): Promise<T>;
}

// application/room/queries/GetUserProfileQuery.ts
class GetUserProfileQuery implements ICrossBCQuery<UserProfile> {
  constructor(
    private readonly userId: string,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(): Promise<UserProfile> {
    return await this.userRepository.getProfile(this.userId);
  }
}
```

### 3. 共享內核

```typescript
// domain/shared/types/Id.ts
export class Id {
  private readonly value: string;
  
  constructor(value: string) {
    this.validateId(value);
    this.value = value;
  }
  
  private validateId(value: string): void {
    // 通用 ID 驗證邏輯
  }
  
  toString(): string {
    return this.value;
  }
}

// domain/shared/types/Result.ts
export class Result<T> {
  private readonly value?: T;
  private readonly error?: Error;
  
  private constructor(value?: T, error?: Error) {
    this.value = value;
    this.error = error;
  }
  
  static success<T>(value: T): Result<T> {
    return new Result(value);
  }
  
  static failure<T>(error: Error): Result<T> {
    return new Result(undefined, error);
  }
}
```

## 通訊原則

1. **事件優先**
   - 優先考慮使用事件驅動通訊
   - 降低 BC 間的直接依賴
   - 提高系統的可擴展性

2. **查詢限制**
   - 同步查詢僅用於必要場景
   - 通過介面抽象隔離實現細節
   - 考慮使用快取優化性能

3. **共享內核管理**
   - 嚴格控制共享內核的範圍
   - 變更需要所有相關 BC 團隊同意
   - 版本管理確保兼容性

## 實施建議

1. **事件設計**
   - 事件應該是過去時態
   - 包含足夠的上下文信息
   - 考慮版本控制和向後兼容

2. **錯誤處理**
   - 實現可靠的事件重試機制
   - 提供事件處理的回退策略
   - 完善的錯誤日誌和監控

3. **性能優化**
   - 實現事件的異步處理
   - 合理使用快取機制
   - 考慮批量處理優化

4. **測試策略**
   - 單元測試確保各 BC 內部邏輯
   - 整合測試驗證跨 BC 通訊
   - 端到端測試確保整體功能 