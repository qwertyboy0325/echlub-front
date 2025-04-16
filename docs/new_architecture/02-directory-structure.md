# 目錄結構設計

## 整體結構

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

## 模組內部結構說明

### 1. Application Layer（應用層）

```
application/
├── commands/          # 命令處理器
│   ├── CreateUser.ts
│   └── UpdateProfile.ts
├── queries/           # 查詢處理器
│   ├── GetUserProfile.ts
│   └── ValidateCredentials.ts
└── services/          # 應用服務
    └── UserService.ts
```

### 2. Domain Layer（領域層）

```
domain/
├── entities/          # 領域實體
│   └── User.ts
├── value-objects/     # 值物件
│   ├── Email.ts
│   └── Password.ts
├── aggregates/        # 聚合根
│   └── UserAggregate.ts
└── repositories/      # 倉儲介面
    └── IUserRepository.ts
```

### 3. Infrastructure Layer（基礎設施層）

```
infrastructure/
├── persistence/       # 持久化實現
│   └── UserRepository.ts
├── services/          # 外部服務整合
│   └── AuthService.ts
└── repositories/      # 倉儲實現
    └── UserRepositoryImpl.ts
```

### 4. Integration Layer（整合層）

```
integration/
├── events/            # 事件定義
│   ├── UserRegistered.ts
│   └── ProfileUpdated.ts
├── handlers/          # 事件處理器
│   └── UserEventHandlers.ts
└── publishers/        # 事件發布器
    └── UserEventPublisher.ts
```

## 共享模組結構

```
shared/
├── types/            # 共享類型定義
│   ├── Result.ts
│   └── Id.ts
├── utils/            # 工具函數
│   ├── validation.ts
│   └── formatting.ts
└── interfaces/       # 共享介面
    └── IEntity.ts
```

## 核心模組結構

```
core/
├── event-bus/        # 事件總線
│   ├── EventBus.ts
│   └── EventTypes.ts
├── di/               # 依賴注入
│   ├── container.ts
│   └── types.ts
└── logging/          # 日誌系統
    └── Logger.ts
```

## 命名規範

1. **檔案命名**
   - 實體：`EntityName.ts`
   - 值物件：`ValueObjectName.ts`
   - 介面：`IInterfaceName.ts`
   - 實現類：`ClassName.ts`

2. **目錄命名**
   - 使用小寫
   - 使用連字符分隔
   - 清晰表達目的

3. **類型命名**
   - 使用 PascalCase
   - 介面以 I 開頭
   - 抽象類以 Abstract 開頭 