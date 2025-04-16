# 用戶模組實現指南

## 1. 服務設計

### 1.1 UserService 介面

```typescript
// 用戶狀態介面
interface UserState {
  id?: string;
  username?: string;
  email?: string;
  isAuthenticated: boolean;
  profile?: {
    name?: string;
    avatar?: string;
    bio?: string;
  };
}

// API 響應介面
interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

// 用戶服務介面
interface IUserService {
  // 狀態管理
  subscribe(listener: (state: UserState) => void): () => void;
  getCurrentUser(): UserState;

  // 用戶操作
  register(username: string, email: string, password: string): Promise<void>;
  login(email: string, password: string): Promise<void>;
  logout(): void;
  updateProfile(userId: string, profile: Partial<UserState['profile']>): Promise<void>;
  getUserProfile(userId: string): Promise<UserState['profile']>;
}
```

### 1.2 依賴注入配置

```typescript
// 在 types.ts 中定義
export const TYPES = {
  UserService: Symbol.for("UserService"),
  EventBus: Symbol.for("EventBus"),
  StateManager: Symbol.for("StateManager")
};

// 在 container.ts 中註冊
container.bind<IUserService>(TYPES.UserService)
  .to(UserService)
  .inSingletonScope();
```

## 2. 實現細節

### 2.1 核心功能

1. **狀態管理**
   - 使用本地狀態存儲當前用戶信息
   - 提供訂閱機制監聽狀態變化
   - 與全局狀態管理器同步

2. **事件發布**
   - 用戶註冊：`user:registered`
   - 用戶登入：`user:loggedIn`
   - 用戶登出：`user:loggedOut`
   - 資料更新：`user:profile:updated`

3. **API 通信**
   - 使用 fetch API 進行 HTTP 請求
   - 統一的錯誤處理機制
   - 響應數據類型安全

### 2.2 錯誤處理

```typescript
try {
  const response = await this.request('POST', '/register', {
    username,
    email,
    password
  });
  // 處理成功響應
} catch (error) {
  console.error('註冊失敗:', error);
  throw error;
}
```

### 2.3 狀態同步

```typescript
// 更新本地狀態
this.currentUser = {
  id: response.data.id,
  username: response.data.username,
  email: response.data.email,
  isAuthenticated: true
};

// 發布事件
this.eventBus.emit('user:registered', this.currentUser);

// 更新全局狀態
await this.stateManager.updateState({
  user: this.currentUser
});

// 通知監聽器
this.notifyListeners();
```

## 3. 使用示例

### 3.1 在組件中使用

```typescript
@injectable()
class UserComponent {
  constructor(
    @inject(TYPES.UserService) private userService: IUserService
  ) {}

  async handleLogin(email: string, password: string) {
    try {
      await this.userService.login(email, password);
      // 登入成功後的處理
    } catch (error) {
      // 錯誤處理
    }
  }
}
```

### 3.2 訂閱狀態變化

```typescript
// 在組件初始化時
const unsubscribe = this.userService.subscribe(state => {
  console.log('用戶狀態更新:', state);
  // 更新 UI
});

// 在組件銷毀時
unsubscribe();
```

## 4. 最佳實踐

1. **依賴注入**
   - 使用 Inversify 進行依賴注入
   - 通過介面定義服務契約
   - 使用 Symbol 作為 Token

2. **狀態管理**
   - 保持本地狀態和全局狀態同步
   - 使用訂閱模式通知狀態變化
   - 適當處理狀態更新錯誤

3. **錯誤處理**
   - 統一處理 API 錯誤
   - 提供有意義的錯誤信息
   - 記錄錯誤日誌

4. **事件處理**
   - 定義清晰的事件類型
   - 在關鍵操作後發布事件
   - 處理事件發布錯誤

## 5. 測試指南

### 5.1 單元測試

```typescript
describe('UserService', () => {
  let userService: UserService;
  let eventBus: IEventBus;
  let stateManager: IStateManager;

  beforeEach(() => {
    eventBus = mock<IEventBus>();
    stateManager = mock<IStateManager>();
    userService = new UserService(eventBus, stateManager);
  });

  it('should register user successfully', async () => {
    // 測試註冊功能
  });

  it('should handle registration error', async () => {
    // 測試錯誤處理
  });
});
```

### 5.2 集成測試

```typescript
describe('UserModule Integration', () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
    // 配置容器
  });

  it('should handle user flow', async () => {
    // 測試完整用戶流程
  });
});
``` 