# 模組實現指南：以音軌模組為例

## 模組架構概述

每個模組都應遵循以下架構原則：

1. **領域驅動設計 (DDD)** 
   - 清晰的領域邊界
   - 豐富的領域模型
   - 領域事件驅動

2. **分層架構**
   - 領域層：核心業務邏輯
   - 應用層：用例協調
   - 基礎設施層：技術實現

3. **設計模式應用**
   - 工廠模式：創建複雜對象
   - 倉儲模式：數據持久化
   - 中介者模式：跨層通信

## 標準目錄結構

```
src/modules/{module-name}/
├── domain/                 # 領域層
│   ├── entities/          # 領域實體
│   ├── value-objects/     # 值對象
│   ├── events/            # 領域事件
│   ├── interfaces/        # 領域接口
│   ├── ports/            # 端口定義
│   └── services/         # 領域服務
│
├── application/           # 應用層
│   ├── commands/         # 命令定義
│   ├── handlers/         # 命令處理器
│   ├── mediators/        # 中介者
│   ├── services/         # 應用服務
│   └── validators/       # 驗證器
│
├── infrastructure/        # 基礎設施層
│   ├── persistence/      # 持久化實現
│   ├── adapters/         # 適配器
│   └── services/         # 基礎服務
│
├── di/                    # 依賴注入
│   ├── types.ts          # 類型定義
│   └── module.ts         # 模組配置
│
└── integration/           # 集成
    ├── handlers/         # 事件處理器
    └── publishers/       # 事件發布器
```

## 核心組件實現指南

### 1. 領域層實現

#### 1.1 實體基類
每個模組應定義自己的實體基類：

```typescript
export abstract class BaseEntity implements IAggregate {
  private _version: number = 0;
  
  constructor(
    protected readonly id: EntityId,
    protected name: string
  ) {}
  
  // 版本控制
  protected incrementVersion(): void {
    this._version++;
  }
  
  // 基礎屬性
  getId(): string {
    return this.id.toString();
  }
  
  getName(): string {
    return this.name;
  }
}
```

#### 1.2 值對象
值對象應該是不可變的：

```typescript
export class EntityId {
  private constructor(private readonly value: string) {}
  
  static create(): EntityId {
    return new EntityId(uuidv4());
  }
  
  equals(other: EntityId): boolean {
    return this.value === other.value;
  }
  
  toString(): string {
    return this.value;
  }
}
```

### 2. 應用層實現

#### 2.1 命令處理器基類
統一的命令處理模式：

```typescript
@injectable()
export abstract class BaseCommandHandler<TCommand, TResult = void> {
  constructor(
    protected readonly repository: IRepository,
    protected readonly eventBus: IEventBus
  ) {}
  
  abstract handle(command: TCommand): Promise<TResult>;
  
  protected async publishEvent(event: IDomainEvent): Promise<void> {
    await this.eventBus.publish(event);
  }
}
```

#### 2.2 驗證器
標準的驗證結果結構：

```typescript
export class ValidationResult {
  constructor(private readonly errors: ValidationError[] = []) {}
  
  get isValid(): boolean {
    return this.errors.length === 0;
  }
  
  get errors(): ValidationError[] {
    return [...this.errors];
  }
}
```

### 3. 基礎設施層實現

#### 3.1 倉儲基類
通用的倉儲操作：

```typescript
@injectable()
export abstract class BaseRepository<T extends BaseEntity> {
  protected items: Map<string, T> = new Map();
  
  async create(entity: T): Promise<void> {
    this.items.set(entity.getId(), entity);
  }
  
  async findById(id: string): Promise<T | undefined> {
    return this.items.get(id);
  }
}
```

#### 3.2 事件適配器
標準的事件發布接口：

```typescript
@injectable()
export abstract class BaseEventPublisher {
  constructor(protected eventBus: IEventBus) {}
  
  protected async publish(event: IDomainEvent): Promise<void> {
    await this.eventBus.publish(event);
  }
}
```

## 依賴注入配置模板

```typescript
export class ModuleConfiguration {
  static configure(container: Container): void {
    // 1. 倉儲綁定
    container.bind<IRepository>(TYPES.Repository)
      .to(RepositoryImpl)
      .inSingletonScope();
      
    // 2. 服務綁定
    container.bind<IService>(TYPES.Service)
      .to(ServiceImpl)
      .inSingletonScope();
      
    // 3. 命令處理器綁定
    container.bind<ICommandHandler>(TYPES.CommandHandler)
      .to(CommandHandlerImpl)
      .inSingletonScope();
  }
}
```

## 測試規範

### 1. 單元測試結構
```typescript
describe('實體名稱', () => {
  let entity: Entity;
  let dependencies: MockDependencies;
  
  beforeEach(() => {
    dependencies = createMockDependencies();
    entity = new Entity(dependencies);
  });
  
  describe('行為名稱', () => {
    it('應該達到預期結果', () => {
      // 準備
      const input = createTestInput();
      
      // 執行
      const result = entity.performAction(input);
      
      // 驗證
      expect(result).toBe(expectedOutput);
    });
  });
});
```

### 2. 集成測試模式
```typescript
describe('模組集成', () => {
  let container: Container;
  
  beforeAll(() => {
    container = new Container();
    ModuleConfiguration.configure(container);
  });
  
  it('應該正確處理完整流程', async () => {
    const service = container.get<IService>(TYPES.Service);
    const result = await service.performOperation();
    expect(result).toMatchExpectedOutput();
  });
});
```

## 實現示例：音軌模組

### 1. 領域實體
```typescript
export class AudioTrack extends BaseTrack {
  private clips: AudioClipId[] = [];
  
  addClip(clipId: AudioClipId): void {
    if (!this.clips.some(id => id.equals(clipId))) {
      this.clips.push(clipId);
      this.incrementVersion();
    }
  }
}
```

### 2. 命令處理器
```typescript
@injectable()
export class CreateTrackCommandHandler extends BaseCommandHandler<CreateTrackCommand, TrackId> {
  async handle(command: CreateTrackCommand): Promise<TrackId> {
    const track = this.factory.createTrack(command.type, command.name);
    await this.repository.create(track);
    await this.publishEvent(new TrackCreatedEvent(track));
    return track.getId();
  }
}
```

### 3. 事件發布
```typescript
@injectable()
export class TrackEventPublisher extends BaseEventPublisher {
  async publishTrackCreated(track: BaseTrack): Promise<void> {
    await this.publish(new TrackCreatedEvent(track));
  }
}
```

## 擴展指南

### 1. 新增實體類型
1. 繼承基礎實體類
2. 實現特定行為
3. 添加對應工廠
4. 更新類型定義
5. 註冊依賴注入

### 2. 添加新功能
1. 定義命令/查詢
2. 實現處理器
3. 添加領域事件
4. 更新服務接口
5. 補充單元測試

## 注意事項

1. **命名規範**
   - 實體：`{Name}Entity`
   - 命令：`{Action}Command`
   - 事件：`{Event}Event`
   - 處理器：`{Command}Handler`

2. **版本控制**
   - 所有狀態變更必須增加版本號
   - 事件應包含版本信息
   - 使用樂觀鎖進行並發控制

3. **錯誤處理**
   - 定義領域特定異常
   - 統一錯誤返回格式
   - 適當的錯誤邊界

4. **性能考慮**
   - 合理使用緩存
   - 批量操作優化
   - 避免不必要的對象創建 