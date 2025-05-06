# 共享領域組件

本目錄包含所有模塊共享的領域概念和基礎類。

## 目錄結構

```
src/shared/domain/
├── entities/            # 實體相關
│   ├── Entity.ts        # 所有實體的基類
│   └── AggregateRoot.ts # 聚合根接口
├── events/              # 領域事件相關
│   └── DomainEvent.ts   # 領域事件基類
├── value-objects/       # 值對象相關
│   ├── ValueObject.ts   # 值對象基類
│   ├── ID.ts            # ID 值對象基類
│   └── UUID.ts          # UUID 值對象實現
└── index.ts             # 導出所有共享組件
```

## 使用方法

### 導入共享組件

```typescript
import { Entity, AggregateRoot, DomainEvent, ValueObject, ID, UUID } from '../../../shared/domain';
```

### 創建實體

```typescript
export class MyEntity extends Entity {
  private readonly _id: string;
  
  constructor(id: string, createdAt: Date, updatedAt: Date) {
    super(createdAt, updatedAt);
    this._id = id;
  }
  
  get id(): string {
    return this._id;
  }
}
```

### 創建聚合根

```typescript
export class MyAggregateRoot extends Entity implements AggregateRoot {
  private _version: number = 0;
  
  // 必須實現 AggregateRoot 接口的方法
  getVersion(): number {
    return this._version;
  }
  
  incrementVersion(): void {
    this._version++;
  }
  
  toJSON(): object {
    return {
      // 實現序列化邏輯
    };
  }
}
```

### 創建領域事件

```typescript
export class MyEvent extends DomainEvent {
  constructor(
    public readonly entityId: string,
    public readonly data: any
  ) {
    super('MyEventName', entityId);
  }
}
```

### 創建值對象

```typescript
// 1. 定義值對象屬性接口
interface MyValueProps {
  value: string;
  description: string;
}

// 2. 繼承 ValueObject 基類
export class MyValue extends ValueObject<MyValueProps> {
  // 3. 實現構造函數
  constructor(props: MyValueProps) {
    super(props);
  }
  
  // 4. 實現相等性比較
  protected equalsCore(other: MyValue): boolean {
    return this.props.value === other.props.value;
  }
  
  // 5. 提供便利的訪問器
  get value(): string {
    return this.props.value;
  }
  
  get description(): string {
    return this.props.description;
  }
  
  // 6. 可以添加領域方法
  isValid(): boolean {
    return this.props.value.length > 0;
  }
}
```

### 使用 ID 值對象

```typescript
// 1. 繼承 ID 基類創建特定的 ID 類型
export class ProductId extends ID {
  // 可以添加特定於 ProductId 的邏輯
}

// 2. 創建 ID 實例
const productId = new ProductId('123');

// 3. 使用 UUID 生成全局唯一 ID
const uuid = UUID.generate();
```

## 最佳實踐

1. 所有領域實體應繼承 `Entity` 基類
2. 所有聚合根應實現 `AggregateRoot` 接口
3. 所有領域事件應繼承 `DomainEvent` 基類
4. 所有值對象應繼承 `ValueObject` 基類
5. 使用 `ID` 基類為實體創建特定類型的 ID
6. 使用實體的 `addDomainEvent` 方法添加領域事件
7. 使用 `getDomainEvents` 和 `clearDomainEvents` 管理領域事件
8. 在修改聚合根狀態時，應使用 `incrementVersion` 增加版本號
9. 值對象設計原則:
   - 不可變性 - 創建後不能修改
   - 相等性由屬性值決定，而非引用
   - 無副作用
   - 自包含 