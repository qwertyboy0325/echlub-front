# 模組間通訊設計

## 通訊方式

### 1. 整合事件（Integration Events）

整合事件是模組間主要的通訊方式，用於處理異步、鬆耦合的跨模組通訊。

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

### 2. 模組邊界（Module Boundaries）

每個模組需要明確定義其對外接口：

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

## 事件流程

### 1. 事件發布流程

1. 領域事件觸發
2. 轉換為整合事件
3. 通過事件總線發布
4. 記錄事件日誌

```typescript
@Injectable()
export class UserService {
  constructor(
    private readonly eventPublisher: UserEventPublisher,
    private readonly logger: Logger
  ) {}

  async registerUser(command: RegisterUserCommand): Promise<Result<void>> {
    try {
      // 業務邏輯處理
      const user = await this.createUser(command);
      
      // 發布整合事件
      await this.eventPublisher.publishUserRegistered(user);
      
      // 記錄日誌
      this.logger.info('User registered successfully', { userId: user.id });
      
      return Result.success();
    } catch (error) {
      this.logger.error('Failed to register user', { error });
      return Result.failure(error);
    }
  }
}
```

### 2. 事件訂閱流程

1. 註冊事件處理器
2. 接收事件
3. 處理業務邏輯
4. 錯誤處理和重試

```typescript
@Injectable()
export class RoomEventHandlers {
  constructor(
    private readonly roomService: RoomService,
    private readonly logger: Logger
  ) {}

  @EventSubscriber(UserRegisteredEvent)
  async handleUserRegistered(event: UserRegisteredEvent): Promise<void> {
    try {
      await this.roomService.initializeUserRoomSettings(event.userId);
      this.logger.info('Room settings initialized for user', { userId: event.userId });
    } catch (error) {
      this.logger.error('Failed to initialize room settings', { error, userId: event.userId });
      // 實現重試邏輯
      await this.retryHandler.retry(() => 
        this.roomService.initializeUserRoomSettings(event.userId)
      );
    }
  }
}
```

## 錯誤處理

### 1. 事件發布錯誤

```typescript
export class EventPublishError extends Error {
  constructor(
    public readonly eventName: string,
    public readonly originalError: Error
  ) {
    super(`Failed to publish event ${eventName}: ${originalError.message}`);
  }
}

@Injectable()
export class EventPublisher {
  async publish<T>(event: IntegrationEvent<T>): Promise<void> {
    try {
      await this.eventBus.publish(event);
    } catch (error) {
      throw new EventPublishError(event.constructor.name, error);
    }
  }
}
```

### 2. 事件處理錯誤

```typescript
@Injectable()
export class EventHandlerErrorDecorator implements IEventHandler {
  constructor(
    private readonly handler: IEventHandler,
    private readonly logger: Logger,
    private readonly retryPolicy: RetryPolicy
  ) {}

  async handle<T>(event: IntegrationEvent<T>): Promise<void> {
    try {
      await this.retryPolicy.execute(() => this.handler.handle(event));
    } catch (error) {
      this.logger.error('Event handler failed', {
        event: event.constructor.name,
        error
      });
      // 根據錯誤類型決定是否重新排隊
      await this.handleFailedEvent(event, error);
    }
  }
}
```

## 版本控制

### 1. 事件版本管理

```typescript
export interface VersionedEvent {
  version: string;
  upgradeToLatest(): VersionedEvent;
}

export class UserRegisteredEventV2 implements IntegrationEvent, VersionedEvent {
  version = '2.0.0';
  
  constructor(
    public readonly userId: string,
    public readonly username: string,
    public readonly email: string,  // 新增欄位
    public readonly timestamp: Date
  ) {}

  static fromV1(v1Event: UserRegisteredEvent): UserRegisteredEventV2 {
    return new UserRegisteredEventV2(
      v1Event.userId,
      v1Event.username,
      'unknown@example.com', // 提供默認值
      v1Event.timestamp
    );
  }
}
```

### 2. 向後兼容

```typescript
@Injectable()
export class VersionedEventHandler {
  @EventSubscriber(UserRegisteredEvent)
  async handle(event: UserRegisteredEvent | UserRegisteredEventV2): Promise<void> {
    // 處理不同版本的事件
    if (this.isV2Event(event)) {
      await this.handleV2Event(event);
    } else {
      await this.handleV1Event(event);
    }
  }

  private isV2Event(event: any): event is UserRegisteredEventV2 {
    return 'email' in event;
  }
}
``` 