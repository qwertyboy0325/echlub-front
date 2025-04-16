# 前後端整合設計

## 整合架構

### 1. 目錄結構

```
src/
├── modules/
│   └── user/
│       ├── application/    # 應用層
│       │   ├── commands/   # 命令處理器
│       │   │   └── RegisterUserCommand.ts
│       │   ├── queries/    # 查詢處理器
│       │   │   └── GetUserProfileQuery.ts
│       │   └── services/   # 應用服務
│       │       └── UserService.ts
│       │
│       ├── domain/         # 領域層
│       │   ├── entities/   # 領域實體
│       │   │   └── User.ts
│       │   └── repositories/ # 倉儲介面
│       │       └── IUserRepository.ts
│       │
│       └── infrastructure/ # 基礎設施層
│           ├── api/        # API 客戶端
│           │   └── UserApiClient.ts
│           └── repositories/ # 倉儲實現
│               └── UserRepository.ts
```

### 2. API 客戶端實現

```typescript
// modules/user/infrastructure/api/UserApiClient.ts
@Injectable()
export class UserApiClient {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly config: ApiConfig
  ) {}

  async registerUser(command: RegisterUserCommand): Promise<Result<void>> {
    try {
      const response = await this.httpClient.post(
        `${this.config.baseUrl}/users/register`,
        command
      );
      return Result.success();
    } catch (error) {
      return Result.failure(new ApiError(error));
    }
  }

  async getUserProfile(userId: string): Promise<Result<UserProfile>> {
    try {
      const response = await this.httpClient.get(
        `${this.config.baseUrl}/users/${userId}/profile`
      );
      return Result.success(response.data);
    } catch (error) {
      return Result.failure(new ApiError(error));
    }
  }
}
```

### 3. 倉儲實現

```typescript
// modules/user/infrastructure/repositories/UserRepository.ts
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    private readonly apiClient: UserApiClient,
    private readonly cache: ICacheService
  ) {}

  async save(user: User): Promise<Result<void>> {
    try {
      const command = new RegisterUserCommand({
        userId: user.id,
        username: user.username,
        email: user.email
      });
      
      const result = await this.apiClient.registerUser(command);
      
      if (result.isSuccess) {
        // 更新快取
        await this.cache.set(
          `user:${user.id}`,
          user,
          { ttl: 300 } // 5分鐘過期
        );
      }
      
      return result;
    } catch (error) {
      return Result.failure(error);
    }
  }

  async findById(userId: string): Promise<Result<User>> {
    try {
      // 1. 檢查快取
      const cached = await this.cache.get(`user:${userId}`);
      if (cached) {
        return Result.success(cached);
      }

      // 2. 從 API 獲取
      const result = await this.apiClient.getUserProfile(userId);
      
      if (result.isSuccess) {
        const user = User.create(result.value);
        // 3. 更新快取
        await this.cache.set(
          `user:${userId}`,
          user,
          { ttl: 300 }
        );
        return Result.success(user);
      }
      
      return result;
    } catch (error) {
      return Result.failure(error);
    }
  }
}
```

### 4. 命令處理器

```typescript
// modules/user/application/commands/RegisterUserCommand.ts
@Injectable()
export class RegisterUserCommandHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(command: RegisterUserCommand): Promise<Result<void>> {
    try {
      // 1. 創建用戶實體
      const user = User.create({
        id: command.userId,
        username: command.username,
        email: command.email
      });

      // 2. 保存用戶
      const result = await this.userRepository.save(user);
      
      if (result.isSuccess) {
        // 3. 發布事件
        await this.eventBus.publish(new UserRegisteredEvent(
          user.id,
          user.username,
          new Date()
        ));
      }
      
      return result;
    } catch (error) {
      return Result.failure(error);
    }
  }
}
```

### 5. 查詢處理器

```typescript
// modules/user/application/queries/GetUserProfileQuery.ts
@Injectable()
export class GetUserProfileQueryHandler implements IQueryHandler<GetUserProfileQuery> {
  constructor(
    private readonly userRepository: IUserRepository
  ) {}

  async execute(query: GetUserProfileQuery): Promise<Result<UserProfile>> {
    try {
      const result = await this.userRepository.findById(query.userId);
      
      if (result.isSuccess) {
        return Result.success(result.value.toProfile());
      }
      
      return result;
    } catch (error) {
      return Result.failure(error);
    }
  }
}
```

## 整合策略

### 1. 錯誤處理

```typescript
// shared/errors/ApiError.ts
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// 錯誤處理裝飾器
export function HandleApiError() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await originalMethod.apply(this, args);
      } catch (error) {
        if (error instanceof ApiError) {
          // 處理 API 錯誤
          switch (error.status) {
            case 401:
              // 處理未授權
              break;
            case 403:
              // 處理權限不足
              break;
            case 404:
              // 處理資源不存在
              break;
            default:
              // 處理其他錯誤
              break;
          }
        }
        throw error;
      }
    };

    return descriptor;
  };
}
```

### 2. 重試機制

```typescript
// shared/utils/RetryPolicy.ts
export class RetryPolicy {
  constructor(
    private readonly maxAttempts: number,
    private readonly delay: number
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (attempt < this.maxAttempts) {
          await this.delayExecution(attempt);
        }
      }
    }
    
    throw lastError;
  }

  private async delayExecution(attempt: number): Promise<void> {
    const delay = this.delay * Math.pow(2, attempt - 1);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}
```

## 最佳實踐

1. **快取策略**
   - 在倉儲層實現快取
   - 使用記憶體快取存儲頻繁訪問的數據
   - 實現快取失效機制

2. **錯誤處理**
   - 統一錯誤處理機制
   - 實現錯誤重試策略
   - 提供友好的錯誤提示

3. **狀態管理**
   - 使用 Redux 或類似的狀態管理工具
   - 實現狀態持久化
   - 處理離線狀態

4. **效能優化**
   - 實現請求合併
   - 使用防抖和節流
   - 優化資源加載 