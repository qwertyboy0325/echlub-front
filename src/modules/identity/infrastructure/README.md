# Infrastructure Layer

基礎設施層負責實現領域層定義的接口，處理與外部系統的交互。

## Repositories

### UserRepository

```typescript
@injectable()
export class UserRepository implements IUserRepository {
  private readonly API_BASE_URL = '/api/auth';
  private readonly TOKEN_KEY = 'auth_token';

  constructor(
    @inject(IdentityTypes.EventBus)
    private readonly eventBus: IEventBus
  ) {}

  // Token operations
  setToken(token: string): void;
  getToken(): string | null;
  removeToken(): void;
  validateToken(token: string): Promise<boolean>;

  // Authentication
  async login(email: string, password: string): Promise<AuthResponseDTO>;
  async register(userData: RegisterUserDTO): Promise<User>;
  async logout(): Promise<void>;

  // User operations
  async getUserProfile(): Promise<User>;
  async updateUserProfile(userData: UpdateUserDTO): Promise<User>;
  async changePassword(oldPassword: string, newPassword: string): Promise<void>;
  async getCurrentUser(): Promise<User | null>;
}
```

## API Integration

### Authentication Endpoints

- POST `/api/auth/register`: 註冊新用戶
- POST `/api/auth/login`: 用戶登入
- POST `/api/auth/logout`: 用戶登出
- GET `/api/auth/profile`: 獲取用戶資料
- PUT `/api/auth/profile`: 更新用戶資料
- POST `/api/auth/change-password`: 修改密碼
- POST `/api/auth/validate-token`: 驗證 Token

### Request/Response Formats

#### Register Request

```typescript
interface RegisterRequest {
  email: string;
  password: string;
  username: string;
}
```

#### Login Request

```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

#### Auth Response

```typescript
interface AuthResponseDTO {
  token: string;
  user: User;
}
```

#### Profile Update Request

```typescript
interface UpdateUserDTO {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}
```

## Storage

### Token Storage

- 使用 `localStorage` 存儲 JWT token
- Token key: `auth_token`

### Error Handling

- 網絡錯誤處理
- API 響應錯誤處理
- Token 驗證錯誤處理

## Security

1. Token 管理
   - 安全存儲
   - 定期驗證
   - 自動過期處理

2. 請求安全
   - 所有 API 請求都包含 Authorization header
   - 敏感數據加密傳輸

3. 錯誤處理
   - 不暴露敏感信息
   - 適當的錯誤日誌記錄
