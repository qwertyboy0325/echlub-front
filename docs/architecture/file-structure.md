# 📁 ECHLUB DAW 檔案結構詳解

## 專案根目錄結構

```
echlub_front/
├── src/                    # 源代碼目錄
├── public/                 # 靜態資源
├── tests/                  # 測試文件
├── docs/                   # 文檔
├── package.json           # 項目配置
├── tsconfig.json          # TypeScript 配置
└── README.md              # 項目說明
```

## 源代碼結構 (src/)

```
src/
├── domain/                # 領域層
│   ├── shared/           # 共享定義
│   │   ├── types/       # 共享類型定義
│   │   │   ├── Id.ts
│   │   │   └── Result.ts
│   │   └── errors/      # 錯誤定義
│   │       └── DomainError.ts
│   │
│   ├── user/            # User BC
│   │   ├── entities/
│   │   │   ├── User.ts
│   │   │   └── UserProfile.ts
│   │   ├── events/
│   │   │   ├── UserRegistered.ts
│   │   │   └── UserLoggedIn.ts
│   │   ├── repositories/
│   │   │   └── IUserRepository.ts
│   │   └── valueObjects/
│   │       ├── Email.ts
│   │       └── Password.ts
│   │
│   ├── room/            # Room BC
│   │   ├── entities/
│   │   │   ├── Room.ts
│   │   │   └── RoomMember.ts
│   │   ├── events/
│   │   │   ├── RoomCreated.ts
│   │   │   └── UserJoinedRoom.ts
│   │   ├── repositories/
│   │   │   └── IRoomRepository.ts
│   │   └── valueObjects/
│   │       └── RoomSettings.ts
│   │
│   ├── session/         # Session BC
│   │   ├── entities/
│   │   │   ├── Session.ts
│   │   │   └── Participant.ts
│   │   ├── events/
│   │   │   ├── SessionStarted.ts
│   │   │   └── RoleSelected.ts
│   │   └── repositories/
│   │       └── ISessionRepository.ts
│   │
│   ├── clip/            # Clip BC
│   │   ├── entities/
│   │   │   ├── Clip.ts
│   │   │   └── Track.ts
│   │   ├── events/
│   │   │   ├── ClipCreated.ts
│   │   │   └── ClipEdited.ts
│   │   └── repositories/
│   │       └── IClipRepository.ts
│   │
│   ├── round/           # Round BC
│   │   ├── entities/
│   │   │   ├── Round.ts
│   │   │   └── Vote.ts
│   │   ├── events/
│   │   │   ├── RoundStarted.ts
│   │   │   └── RoundEnded.ts
│   │   └── repositories/
│   │       └── IRoundRepository.ts
│   │
│   └── render/          # Render BC
       ├── entities/
       │   └── RenderJob.ts
       ├── events/
       │   └── RenderCompleted.ts
       └── repositories/
           └── IRenderRepository.ts

├── application/         # 應用層
│   ├── shared/
│   │   └── interfaces/
│   │       └── IUseCase.ts
│   │
│   ├── user/
│   │   └── use-cases/
│   │       ├── RegisterUser.ts
│   │       └── LoginUser.ts
│   │
│   ├── room/
│   │   └── use-cases/
│   │       ├── CreateRoom.ts
│   │       └── JoinRoom.ts
│   │
│   └── [其他 BC 的用例...]

├── presentation/       # 表現層
│   ├── shared/
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useWebSocket.ts
│   │   └── components/
│   │       ├── Button.tsx
│   │       └── Modal.tsx
│   │
│   ├── states/        # UI 狀態
│   │   ├── user/
│   │   │   └── UserState.ts
│   │   └── [其他狀態...]
│   │
│   ├── components/    # React 組件
│   │   ├── user/
│   │   │   ├── LoginForm.tsx
│   │   │   └── UserProfile.tsx
│   │   └── [其他組件...]
│   │
│   └── pages/        # 頁面
│       ├── HomePage.tsx
│       ├── RoomPage.tsx
│       └── StudioPage.tsx

└── infrastructure/    # 基礎設施層
    ├── persistence/  # 資料持久化
    │   ├── LocalStorage.ts
    │   └── IndexedDB.ts
    │
    ├── audio/        # 音頻處理
    │   ├── WebAudioAPI.ts
    │   └── AudioProcessor.ts
    │
    ├── websocket/    # 即時通訊
    │   ├── WebSocketClient.ts
    │   └── WebSocketEvents.ts
    │
    ├── di/           # 依賴注入
    │   ├── container.ts
    │   └── types.ts
    │
    └── events/       # 事件總線
        ├── EventBus.ts
        └── EventTypes.ts
```

## 特點說明

1. **領域層 (Domain)**
   - 每個 BC 都有自己的資料夾
   - 實體、事件和倉儲接口清晰分離
   - 共享定義放在 shared 資料夾

2. **應用層 (Application)**
   - 用例按 BC 組織
   - 共享介面定義
   - 依賴注入準備

3. **表現層 (Presentation)**
   - 共享組件和 hooks
   - 按功能模組組織組件
   - 狀態管理分離

4. **基礎設施層 (Infrastructure)**
   - 技術實現分類清晰
   - 外部服務整合
   - 跨層級功能支持

## 命名規範

1. **檔案命名**
   - 實體：`EntityName.ts`
   - 介面：`IInterfaceName.ts`
   - 事件：`EventName.ts`
   - 組件：`ComponentName.tsx`

2. **目錄命名**
   - 使用小寫
   - 使用連字符分隔
   - 清晰表達目的

## 注意事項

1. **依賴方向**
   - 依賴只能從外層指向內層
   - 領域層不依賴其他層
   - 通過介面實現依賴反轉

2. **檔案位置**
   - 相關檔案放在一起
   - 共享程式碼提升到適當層級
   - 避免循環依賴 