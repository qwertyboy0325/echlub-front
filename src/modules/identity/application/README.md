# Application Layer

應用層負責處理用戶請求，協調領域對象，並管理事務。

## Commands

### RegisterUserCommand
```typescript
class RegisterUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly username: string
  ) {}
}
```

### LoginUserCommand
```typescript
class LoginUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string
  ) {}
}
```

### UpdateUserProfileCommand
```typescript
class UpdateUserProfileCommand {
  constructor(
    public readonly userData: UpdateUserDTO
  ) {}
}
```

### ChangePasswordCommand
```typescript
class ChangePasswordCommand {
  constructor(
    public readonly oldPassword: string,
    public readonly newPassword: string
  ) {}
}
```

## Queries

### GetUserProfileQuery
```typescript
class GetUserProfileQuery {
  constructor() {}
}
```

### ValidateTokenQuery
```typescript
class ValidateTokenQuery {
  constructor(
    public readonly token: string
  ) {}
}
```

## Handlers

每個命令和查詢都有對應的處理器：

1. `RegisterUserCommandHandler`: 處理用戶註冊
2. `LoginUserCommandHandler`: 處理用戶登入
3. `LogoutCommandHandler`: 處理用戶登出
4. `UpdateUserProfileCommandHandler`: 處理用戶資料更新
5. `ChangePasswordCommandHandler`: 處理密碼修改
6. `GetUserProfileQueryHandler`: 處理獲取用戶資料
7. `ValidateTokenQueryHandler`: 處理 Token 驗證

## IdentityService

`IdentityService` 是主要的應用服務，提供以下功能：

1. 用戶認證
   - `registerUser`: 註冊新用戶
   - `login`: 用戶登入
   - `logout`: 用戶登出

2. 用戶資料管理
   - `getUserProfile`: 獲取用戶資料
   - `updateUserProfile`: 更新用戶資料
   - `changePassword`: 修改密碼

3. Token 管理
   - `setToken`: 設置 Token
   - `getToken`: 獲取 Token
   - `removeToken`: 移除 Token
   - `isAuthenticated`: 檢查是否已認證

## IdentityMediator

`IdentityMediator` 負責協調命令和查詢的執行：

1. 命令處理
   - `registerUser`: 處理註冊命令
   - `login`: 處理登入命令
   - `logout`: 處理登出命令
   - `updateUserProfile`: 處理更新資料命令
   - `changePassword`: 處理修改密碼命令

2. 查詢處理
   - `getUserProfile`: 處理獲取用戶資料查詢 