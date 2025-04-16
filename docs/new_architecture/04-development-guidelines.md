# 開發指南

## 模組開發流程

### 1. 定義模組邊界

首先定義模組的對外接口：

```typescript
// modules/user/domain/UserModuleBoundary.ts
export interface UserModuleBoundary {
  commands: {
    registerUser(command: RegisterUserCommand): Promise<Result<void>>;
  };
  queries: {
    getUserProfile(query: GetUserProfileQuery): Promise<Result<UserProfile>>;
  };
  events: {
    onUserRegistered: UserRegisteredEvent;
  };
}
```

### 2. 實現領域模型

```typescript
// modules/user/domain/entities/User.ts
export class User extends AggregateRoot {
  constructor(
    private readonly id: UserId,
    private email: Email,
    private password: Password,
    private profile: UserProfile
  ) {
    super();
  }

  // 領域方法
  updateProfile(profile: UserProfile): void {
    this.profile = profile;
    this.addDomainEvent(new UserProfileUpdatedEvent(this.id, profile));
  }
}
```

### 3. 實現用例

```typescript
// modules/user/application/commands/RegisterUserCommand.ts
@Injectable()
export class RegisterUserCommandHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventPublisher: UserEventPublisher
  ) {}

  async execute(command: RegisterUserCommand): Promise<Result<void>> {
    try {
      // 1. 創建用戶
      const user = User.create({
        email: command.email,
        password: command.password,
        profile: command.profile
      });

      // 2. 保存用戶
      await this.userRepository.save(user);

      // 3. 發布事件
      await this.eventPublisher.publishUserRegistered(user);

      return Result.success();
    } catch (error) {
      return Result.failure(error);
    }
  }
}
```

## 測試策略

### 1. 單元測試

```typescript
// modules/user/tests/unit/RegisterUserCommandHandler.spec.ts
describe('RegisterUserCommandHandler', () => {
  let handler: RegisterUserCommandHandler;
  let userRepository: MockUserRepository;
  let eventPublisher: MockEventPublisher;

  beforeEach(() => {
    userRepository = new MockUserRepository();
    eventPublisher = new MockEventPublisher();
    handler = new RegisterUserCommandHandler(userRepository, eventPublisher);
  });

  it('should register user successfully', async () => {
    // Arrange
    const command = new RegisterUserCommand({
      email: 'test@example.com',
      password: 'password123',
      profile: { name: 'Test User' }
    });

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.isSuccess).toBe(true);
    expect(userRepository.save).toHaveBeenCalled();
    expect(eventPublisher.publishUserRegistered).toHaveBeenCalled();
  });
});
```

### 2. 整合測試

```typescript
// modules/user/tests/integration/UserModule.spec.ts
describe('UserModule Integration', () => {
  let userModule: UserModule;
  let eventBus: EventBus;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [UserModule],
    }).compile();

    userModule = module.get(UserModule);
    eventBus = module.get(EventBus);
  });

  it('should handle user registration flow', async () => {
    // Arrange
    const command = new RegisterUserCommand({/*...*/});
    const eventSpy = jest.spyOn(eventBus, 'publish');

    // Act
    await userModule.commands.registerUser(command);

    // Assert
    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'user.registered'
      })
    );
  });
});
```

## 效能優化

### 1. 事件處理優化

```typescript
@Injectable()
export class OptimizedEventHandler {
  private readonly eventBuffer: EventBuffer;

  constructor() {
    this.eventBuffer = new EventBuffer({
      maxSize: 100,
      flushInterval: 1000,
      onFlush: this.handleBatch.bind(this)
    });
  }

  @EventSubscriber(UserRegisteredEvent)
  async handle(event: UserRegisteredEvent): Promise<void> {
    await this.eventBuffer.add(event);
  }

  private async handleBatch(events: UserRegisteredEvent[]): Promise<void> {
    // 批量處理事件
    await this.userService.initializeUsersInBatch(
      events.map(e => e.userId)
    );
  }
}
```

### 2. 查詢優化

```typescript
@Injectable()
export class CachedUserProfileQuery implements IQueryHandler<GetUserProfileQuery> {
  constructor(
    private readonly cache: ICacheService,
    private readonly userRepository: IUserRepository
  ) {}

  async execute(query: GetUserProfileQuery): Promise<Result<UserProfile>> {
    // 1. 嘗試從快取獲取
    const cached = await this.cache.get(`user:${query.userId}:profile`);
    if (cached) {
      return Result.success(cached);
    }

    // 2. 從資料庫獲取
    const profile = await this.userRepository.getProfile(query.userId);
    
    // 3. 存入快取
    await this.cache.set(
      `user:${query.userId}:profile`,
      profile,
      { ttl: 3600 } // 1小時過期
    );

    return Result.success(profile);
  }
}
```

## 錯誤處理

### 1. 領域錯誤

```typescript
// shared/errors/DomainError.ts
export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

// 使用示例
export class InvalidEmailError extends DomainError {
  constructor(email: string) {
    super(
      `Invalid email format: ${email}`,
      'USER.INVALID_EMAIL',
      { email }
    );
  }
}
```

### 2. 應用錯誤

```typescript
// shared/errors/ApplicationError.ts
export class ApplicationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly httpStatus: number,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

// 使用示例
export class UserNotFoundError extends ApplicationError {
  constructor(userId: string) {
    super(
      `User not found: ${userId}`,
      'USER.NOT_FOUND',
      404,
      { userId }
    );
  }
}
```

## 日誌記錄

```typescript
// core/logging/Logger.ts
@Injectable()
export class Logger implements ILogger {
  constructor(
    private readonly context: string,
    private readonly loggerService: LoggerService
  ) {}

  info(message: string, metadata?: Record<string, any>): void {
    this.loggerService.log({
      level: 'info',
      context: this.context,
      message,
      metadata,
      timestamp: new Date()
    });
  }

  error(message: string, error: Error, metadata?: Record<string, any>): void {
    this.loggerService.log({
      level: 'error',
      context: this.context,
      message,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      metadata,
      timestamp: new Date()
    });
  }
}
``` 