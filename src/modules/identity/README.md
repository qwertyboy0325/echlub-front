# Identity Module

Identity 模組負責處理用戶身份認證和授權相關的功能。該模組採用 CQRS 架構和領域驅動設計原則。

## 目錄結構

```
identity/
├── application/          # 應用層
│   ├── commands/        # 命令
│   ├── handlers/        # 命令和查詢處理器
│   ├── mediators/       # 中介者
│   ├── queries/         # 查詢
│   ├── services/        # 應用服務
│   └── validators/      # 驗證器
├── domain/              # 領域層
│   ├── entities/        # 領域實體
│   ├── events/          # 領域事件
│   ├── repositories/    # 倉儲接口
│   └── validators/      # 領域驗證器
├── infrastructure/      # 基礎設施層
│   └── repositories/    # 倉儲實現
└── di/                 # 依賴注入配置
```

## 核心功能

### 1. 用戶認證

- 註冊新用戶
- 用戶登入
- 用戶登出
- Token 管理

### 2. 用戶資料管理

- 獲取用戶資料
- 更新用戶資料
- 修改密碼

### 3. 領域事件

- 用戶註冊事件
- 用戶登入事件
- 用戶登出事件
- 密碼修改事件

## 使用方式

### 註冊用戶

```typescript
const command = new RegisterUserCommand(email, password, username);
const user = await identityService.registerUser(command);
```

### 用戶登入

```typescript
const command = new LoginUserCommand(email, password);
const authResponse = await identityService.login(command);
```

### 獲取用戶資料

```typescript
const user = await identityService.getUserProfile();
```

### 更新用戶資料

```typescript
const command = new UpdateUserProfileCommand(userData);
const updatedUser = await identityService.updateUserProfile(command);
```

### 修改密碼

```typescript
const command = new ChangePasswordCommand(oldPassword, newPassword);
await identityService.changePassword(command);
```

## 依賴注入配置

模組使用 InversifyJS 進行依賴注入，主要綁定包括：

- `UserRepository`: 用戶資料倉儲
- `IdentityMediator`: 命令和查詢中介者
- `IdentityService`: 應用服務
- 各種命令和查詢處理器

## 領域模型

### User 實體

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

## 錯誤處理

模組定義了以下錯誤類型：

- `UserValidationError`: 用戶資料驗證錯誤
- `UserOperationError`: 用戶操作錯誤

## 安全考慮

1. 密碼存儲：使用安全的密碼哈希算法
2. Token 管理：使用 JWT 進行身份驗證
3. 輸入驗證：所有用戶輸入都經過驗證
4. 錯誤處理：避免暴露敏感信息

## 擴展性

模組設計考慮了以下擴展點：

1. 添加新的認證方式（如社交媒體登入）
2. 實現雙因素認證
3. 添加用戶權限管理
4. 整合第三方身份提供者

## 最佳實踐

1. 使用命令和查詢分離（CQRS）
2. 遵循領域驅動設計原則
3. 使用依賴注入進行解耦
4. 實現適當的錯誤處理
5. 保持代碼的可測試性
