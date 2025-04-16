# 模組化架構設計

## 模組結構

每個 Bounded Context 都是一個完全獨立的模組，具有自己的四層架構：

```
src/
├── modules/
│   ├── user/                 # User Module (BC)
│   │   ├── application/     # 應用層
│   │   │   ├── commands/   # 命令處理器
│   │   │   ├── queries/    # 查詢處理器
│   │   │   └── services/   # 應用服務
│   │   │
│   │   ├── domain/         # 領域層
│   │   │   ├── entities/   # 領域實體
│   │   │   ├── value-objects/ # 值物件
│   │   │   ├── aggregates/ # 聚合根
│   │   │   └── repositories/ # 倉儲介面
│   │   │
│   │   ├── infrastructure/ # 基礎設施層
│   │   │   ├── persistence/ # 持久化實現
│   │   │   ├── services/    # 外部服務整合
│   │   │   └── repositories/ # 倉儲實現
│   │   │
│   │   └── integration/    # 整合事件層
│   │       ├── events/     # 整合事件定義
│   │       ├── handlers/   # 事件處理器
│   │       └── publishers/ # 事件發布器
│   │
│   ├── room/                # Room Module (BC)
│   │   ├── application/
│   │   ├── domain/
│   │   ├── infrastructure/
│   │   └── integration/
│   │
│   ├── session/             # Session Module (BC)
│   │   ├── application/
│   │   ├── domain/
│   │   ├── infrastructure/
│   │   └── integration/
│   │
│   └── [其他模組...]
│
├── shared/                  # 共享模組
│   ├── types/              # 共享類型定義
│   ├── utils/              # 通用工具
│   └── interfaces/         # 共享介面
│
└── core/                   # 核心模組
    ├── event-bus/         # 事件總線
    ├── di/                # 依賴注入
    └── logging/           # 日誌

```

## 模組間通訊

### 1. 整合事件 (Integration Events)

```typescript
// modules/user/integration/events/UserRegisteredEvent.ts
export class UserRegisteredEvent implements IntegrationEvent {
  constructor(
    public readonly userId: string,
    public readonly username: string,
    public readonly timestamp: Date
  ) {}

  static readonly EVENT_NAME = 'user.registered';
}

// modules/user/integration/publishers/UserEventPublisher.ts
@Injectable()
export class UserEventPublisher {
  constructor(private readonly eventBus: IEventBus) {}

  async publishUserRegistered(user: User): Promise<void> {
    const event = new UserRegisteredEvent(
      user.id,
      user.username,
      new Date()
    );
    await this.eventBus.publish(event);
  }
}

// modules/room/integration/handlers/UserRegisteredHandler.ts
@Injectable()
export class UserRegisteredHandler implements IntegrationEventHandler<UserRegisteredEvent> {
  constructor(private readonly roomService: RoomService) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    await this.roomService.initializeUserRoomSettings(event.userId);
  }
}
```

### 2. 模組邊界定義

```typescript
// modules/user/domain/UserModuleBoundary.ts
export interface UserModuleBoundary {
  // 對外公開的命令
  commands: {
    registerUser(command: RegisterUserCommand): Promise<Result<void>>;
    updateProfile(command: UpdateProfileCommand): Promise<Result<void>>;
  };
  
  // 對外公開的查詢
  queries: {
    getUserProfile(query: GetUserProfileQuery): Promise<Result<UserProfile>>;
    validateUserCredentials(query: ValidateCredentialsQuery): Promise<Result<boolean>>;
  };
  
  // 對外公開的事件
  events: {
    onUserRegistered: UserRegisteredEvent;
    onProfileUpdated: ProfileUpdatedEvent;
  };
}
```

## 模組設計原則

1. **高內聚，低耦合**
   - 每個模組內部高度內聚
   - 模組間只通過整合事件或明確定義的邊界進行通訊
   - 避免模組間的直接依賴

2. **模組自治**
   - 每個模組擁有自己的資料庫架構
   - 獨立的領域模型和業務規則
   - 可以獨立部署和擴展

3. **通訊規範**
   - 模組間通過整合事件進行異步通訊
   - 使用明確定義的契約進行同步調用
   - 避免共享資料庫

4. **版本管理**
   - 每個模組獨立版本控制
   - 整合事件需要版本控制
   - 向後兼容的事件演進

## 實施指南

1. **模組開發流程**
   ```typescript
   // 1. 定義模組邊界
   export interface ModuleBoundary {
     // 公開的介面定義
   }
   
   // 2. 實現領域模型
   export class SomeAggregate extends AggregateRoot {
     // 領域邏輯
   }
   
   // 3. 定義整合事件
   export class SomeIntegrationEvent implements IntegrationEvent {
     // 事件定義
   }
   
   // 4. 實現事件處理器
   @Injectable()
   export class SomeEventHandler implements IntegrationEventHandler {
     // 事件處理邏輯
   }
   ```

2. **依賴注入配置**
   ```typescript
   // modules/user/UserModule.ts
   @Module({
     imports: [CoreModule],
     providers: [
       UserService,
       UserEventPublisher,
       UserRepository,
       // ... 其他依賴
     ],
     exports: [UserModuleBoundary]
   })
   export class UserModule {}
   ```

3. **事件發布訂閱**
   ```typescript
   // 發布事件
   await this.eventPublisher.publish(new SomeIntegrationEvent());
   
   // 訂閱事件
   @EventSubscriber(SomeIntegrationEvent)
   async handleEvent(event: SomeIntegrationEvent): Promise<void> {
     // 處理邏輯
   }
   ```

## 測試策略

1. **單元測試**
   - 測試模組內部的業務邏輯
   - 模擬外部依賴和事件

2. **整合測試**
   - 測試模組間的事件流
   - 驗證契約遵守情況

3. **端到端測試**
   - 測試完整的業務場景
   - 驗證多個模組的協同工作 