# Domain Layer

領域層包含業務邏輯的核心，定義了實體、值對象、領域事件和倉儲接口。

## Entities

### User

```typescript
class User extends Entity implements AggregateRoot {
  private readonly _id: string;
  private readonly _email: string;
  private readonly _username: string;
  private _firstName?: string;
  private _lastName?: string;
  private _avatar?: string;

  // Getters
  get id(): string;
  get email(): string;
  get username(): string;
  get firstName(): string | undefined;
  get lastName(): string | undefined;
  get avatar(): string | undefined;

  // Methods
  updateProfile(data: UpdateUserDTO): void;
  changePassword(oldPassword: string, newPassword: string): void;
  login(): void;
  logout(): void;
  equals(other: User): boolean;
}
```

## Events

### UserRegisteredEvent

```typescript
class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {
    super('UserRegistered');
  }
}
```

### UserLoggedInEvent

```typescript
class UserLoggedInEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string
  ) {
    super('UserLoggedIn');
  }
}
```

### UserLoggedOutEvent

```typescript
class UserLoggedOutEvent extends DomainEvent {
  constructor() {
    super('UserLoggedOut');
  }
}
```

### PasswordChangedEvent

```typescript
class PasswordChangedEvent extends DomainEvent {
  constructor() {
    super('PasswordChanged');
  }
}
```

## Repositories

### IUserRepository

```typescript
interface IUserRepository {
  // Authentication
  login(email: string, password: string): Promise<AuthResponseDTO>;
  register(userData: RegisterUserDTO): Promise<User>;
  
  // User operations
  getUserProfile(): Promise<User>;
  updateUserProfile(userData: UpdateUserDTO): Promise<User>;
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
  getCurrentUser(): Promise<User | null>;

  // Token operations
  setToken(token: string): void;
  getToken(): string | null;
  removeToken(): void;
  validateToken(token: string): Promise<boolean>;

  // Additional operations
  logout(): Promise<void>;
}
```

## Value Objects

### UserProps

```typescript
interface UserProps {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
}
```

## Domain Rules

1. 用戶註冊規則
   - 電子郵件必須唯一
   - 密碼必須符合安全要求
   - 用戶名必須唯一

2. 用戶認證規則
   - 登入時必須提供有效的電子郵件和密碼
   - Token 必須在有效期內

3. 用戶資料更新規則
   - 只能更新自己的資料
   - 某些欄位不能為空

4. 密碼修改規則
   - 必須提供正確的舊密碼
   - 新密碼必須符合安全要求
   - 新密碼不能與舊密碼相同
