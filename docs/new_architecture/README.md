# ECHLUB 前端架構設計

## 整體架構

ECHLUB 前端採用模組化的領域驅動設計（DDD）架構，每個 Bounded Context 都是一個完全獨立的模組。

## 核心原則

1. **模組獨立性**
   - 每個模組都是自治的單元
   - 擁有完整的分層架構
   - 可獨立開發、測試和部署

2. **清晰的邊界**
   - 模組間通過明確的契約通訊
   - 使用整合事件進行跨模組通訊
   - 避免直接依賴

3. **分層架構**
   每個模組包含四個主要層：
   - Application Layer（應用層）
   - Domain Layer（領域層）
   - Infrastructure Layer（基礎設施層）
   - Integration Layer（整合層）

## 目錄結構

```
src/
├── modules/              # 業務模組
│   ├── user/            # 用戶模組
│   │   ├── application/ # 應用層
│   │   │   ├── commands/
│   │   │   ├── queries/
│   │   │   └── services/
│   │   │
│   │   ├── domain/     # 領域層
│   │   │   ├── entities/
│   │   │   ├── value-objects/
│   │   │   ├── aggregates/
│   │   │   └── repositories/
│   │   │
│   │   ├── infrastructure/ # 基礎設施層
│   │   │   ├── persistence/
│   │   │   ├── services/
│   │   │   └── repositories/
│   │   │
│   │   └── integration/    # 整合層
│   │       ├── events/
│   │       ├── handlers/
│   │       └── publishers/
│   │
│   ├── room/           # 房間模組
│   ├── session/        # 會話模組
│   ├── clip/           # 音頻片段模組
│   ├── round/          # 回合模組
│   └── render/         # 渲染模組
│
├── shared/             # 共享模組
│   ├── types/         # 共享類型
│   ├── utils/         # 工具函數
│   └── interfaces/    # 共享介面
│
└── core/              # 核心功能
    ├── event-bus/     # 事件總線
    ├── di/            # 依賴注入
    └── logging/       # 日誌系統
```

## 模組通訊

### 1. 整合事件

整合事件是模組間主要的通訊方式：

```typescript
// 事件定義
export class UserRegisteredEvent implements IntegrationEvent {
  constructor(
    public readonly userId: string,
    public readonly username: string,
    public readonly timestamp: Date
  ) {}

  static readonly EVENT_NAME = 'user.registered';
}

// 事件發布
@Injectable()
export class UserEventPublisher {
  constructor(private readonly eventBus: IEventBus) {}

  async publishUserRegistered(user: User): Promise<void> {
    await this.eventBus.publish(new UserRegisteredEvent(
      user.id,
      user.username,
      new Date()
    ));
  }
}

// 事件處理
@Injectable()
export class UserRegisteredHandler implements IntegrationEventHandler<UserRegisteredEvent> {
  constructor(private readonly roomService: RoomService) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    await this.roomService.initializeUserRoomSettings(event.userId);
  }
}
```

### 2. 模組邊界

每個模組都需要明確定義其邊界：

```typescript
export interface UserModuleBoundary {
  // 命令（寫操作）
  commands: {
    registerUser(command: RegisterUserCommand): Promise<Result<void>>;
    updateProfile(command: UpdateProfileCommand): Promise<Result<void>>;
  };
  
  // 查詢（讀操作）
  queries: {
    getUserProfile(query: GetUserProfileQuery): Promise<Result<UserProfile>>;
    validateUserCredentials(query: ValidateCredentialsQuery): Promise<Result<boolean>>;
  };
  
  // 可訂閱的事件
  events: {
    onUserRegistered: UserRegisteredEvent;
    onProfileUpdated: ProfileUpdatedEvent;
  };
}
```

## 開發規範

1. **模組開發流程**
   - 定義模組邊界
   - 實現領域模型
   - 定義整合事件
   - 實現事件處理器

2. **依賴注入**
   ```typescript
   @Module({
     imports: [CoreModule],
     providers: [
       UserService,
       UserEventPublisher,
       UserRepository
     ],
     exports: [UserModuleBoundary]
   })
   export class UserModule {}
   ```

3. **事件處理**
   ```typescript
   @EventSubscriber(UserRegisteredEvent)
   async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
     // 處理邏輯
   }
   ```

## 測試策略

1. **單元測試**
   - 測試模組內部邏輯
   - 模擬外部依賴

2. **整合測試**
   - 測試模組間通訊
   - 驗證事件流程

3. **端到端測試**
   - 測試完整業務流程
   - 驗證多模組協作

## 版本管理

1. **模組版本**
   - 每個模組獨立版本控制
   - 遵循語義化版本規範

2. **事件版本**
   - 事件結構需要版本控制
   - 保持向後兼容性

## 部署策略

1. **獨立部署**
   - 模組可以獨立部署
   - 支持增量更新

2. **依賴管理**
   - 明確的依賴聲明
   - 版本相容性檢查