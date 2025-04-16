# Track 模組實現指南

## 1. 目錄結構

```
src/modules/track/
├── application/
│   ├── commands/
│   │   ├── CreateTrackCommand.ts
│   │   ├── RenameTrackCommand.ts
│   │   ├── AddClipToTrackCommand.ts
│   │   ├── RemoveClipFromTrackCommand.ts
│   │   ├── SetTrackRoutingCommand.ts
│   │   ├── AddPluginToTrackCommand.ts
│   │   └── RemovePluginFromTrackCommand.ts
│   ├── queries/
│   │   ├── GetTrackQuery.ts
│   │   └── ListTracksQuery.ts
│   └── services/
│       └── TrackService.ts
│
├── domain/
│   ├── entities/
│   │   ├── IAggregate.ts
│   │   ├── ITrackAggregate.ts
│   │   ├── IAudioTrackAggregate.ts
│   │   ├── IInstrumentTrackAggregate.ts
│   │   ├── IBusTrackAggregate.ts
│   │   ├── BaseTrack.ts
│   │   ├── AudioTrack.ts
│   │   ├── InstrumentTrack.ts
│   │   └── BusTrack.ts
│   ├── value-objects/
│   │   ├── TrackId.ts
│   │   └── TrackType.ts
│   ├── events/
│   │   ├── TrackCreatedEvent.ts
│   │   ├── TrackRenamedEvent.ts
│   │   ├── ClipAddedToTrackEvent.ts
│   │   ├── ClipRemovedFromTrackEvent.ts
│   │   ├── TrackRoutingChangedEvent.ts
│   │   ├── PluginAddedToTrackEvent.ts
│   │   └── PluginRemovedFromTrackEvent.ts
│   ├── aggregates/
│   │   ├── BaseTrackAggregate.ts
│   │   ├── AudioTrackAggregate.ts
│   │   ├── InstrumentTrackAggregate.ts
│   │   └── BusTrackAggregate.ts
│   └── repositories/
│       └── ITrackRepository.ts
│
├── infrastructure/
│   ├── persistence/
│   │   └── TrackRepositoryImpl.ts
│   ├── services/
│   │   └── TrackStateService.ts
│   └── repositories/
│       └── TrackRepository.ts
│
└── integration/
    ├── handlers/
    │   └── TrackEventHandler.ts
    └── publishers/
        └── TrackEventPublisher.ts
```

## 2. 核心實現

### 2.1 領域層

```typescript
// domain/entities/IAggregate.ts
export interface IAggregate {
  getTrackId(): TrackId;
  getName(): string;
  getType(): string;
  getVersion(): number;
  incrementVersion(): void;
}

// domain/entities/ITrackAggregate.ts
export interface ITrackAggregate extends IAggregate {
  getRouting(): TrackRouting;
  getPlugins(): PluginInstanceId[];
  addPlugin(pluginId: PluginInstanceId): void;
  removePlugin(pluginId: PluginInstanceId): void;
  updateRouting(routing: TrackRouting): void;
}

// domain/entities/IAudioTrackAggregate.ts
export interface IAudioTrackAggregate extends ITrackAggregate {
  getAudioClips(): AudioClipId[];
  addClip(clipId: ClipId): void;
  removeClip(clipId: ClipId): void;
}

// domain/entities/IInstrumentTrackAggregate.ts
export interface IInstrumentTrackAggregate extends ITrackAggregate {
  getMidiClips(): MidiClipId[];
  getInstrumentPlugin(): PluginInstanceId | undefined;
  setInstrumentPlugin(pluginId: PluginInstanceId): void;
  addClip(clipId: ClipId): void;
  removeClip(clipId: ClipId): void;
}

// domain/entities/IBusTrackAggregate.ts
export interface IBusTrackAggregate extends ITrackAggregate {
  getSendSettings(): SendSetting[];
  getReturnSettings(): ReturnSetting[];
  addSendSetting(setting: SendSetting): void;
  removeSendSetting(settingId: string): void;
  addReturnSetting(setting: ReturnSetting): void;
  removeReturnSetting(settingId: string): void;
}

// domain/entities/BaseTrack.ts
export abstract class BaseTrack implements ITrackAggregate {
  protected version: number = 0;
  protected plugins: PluginInstanceId[] = [];

  constructor(
    protected readonly trackId: TrackId,
    protected readonly name: string,
    protected readonly routing: TrackRouting,
    protected readonly type: string
  ) {}

  getTrackId(): TrackId {
    return this.trackId;
  }

  getName(): string {
    return this.name;
  }

  getType(): string {
    return this.type;
  }

  getVersion(): number {
    return this.version;
  }

  incrementVersion(): void {
    this.version++;
  }

  getRouting(): TrackRouting {
    return this.routing;
  }

  getPlugins(): PluginInstanceId[] {
    return [...this.plugins];
  }

  addPlugin(pluginId: PluginInstanceId): void {
    if (!this.plugins.some(id => id.equals(pluginId))) {
      this.plugins.push(pluginId);
      this.incrementVersion();
    }
  }

  removePlugin(pluginId: PluginInstanceId): void {
    this.plugins = this.plugins.filter(id => !id.equals(pluginId));
    this.incrementVersion();
  }

  updateRouting(routing: TrackRouting): void {
    Object.assign(this.routing, routing);
    this.incrementVersion();
  }
}

// domain/entities/AudioTrack.ts
export class AudioTrack extends BaseTrack implements IAudioTrackAggregate {
  private audioClipIds: AudioClipId[] = [];

  constructor(
    trackId: TrackId,
    name: string,
    routing: TrackRouting,
    type: string,
    plugins: PluginInstanceId[] = []
  ) {
    super(trackId, name, routing, type);
    plugins.forEach(plugin => this.addPlugin(plugin));
  }

  getAudioClips(): AudioClipId[] {
    return [...this.audioClipIds];
  }

  addClip(clipId: ClipId): void {
    if (clipId instanceof AudioClipId) {
      if (!this.audioClipIds.some(id => id.equals(clipId))) {
        this.audioClipIds.push(clipId);
        this.incrementVersion();
      }
    } else {
      throw new Error('Only audio clips can be added to audio tracks');
    }
  }

  removeClip(clipId: ClipId): void {
    if (clipId instanceof AudioClipId) {
      this.audioClipIds = this.audioClipIds.filter(id => !id.equals(clipId));
      this.incrementVersion();
    } else {
      throw new Error('Only audio clips can be removed from audio tracks');
    }
  }
}

// domain/entities/InstrumentTrack.ts
export class InstrumentTrack extends BaseTrack implements IInstrumentTrackAggregate {
  private midiClipIds: MidiClipId[] = [];
  private instrumentPluginId?: PluginInstanceId;

  constructor(
    trackId: TrackId,
    name: string,
    routing: TrackRouting,
    type: string,
    plugins: PluginInstanceId[] = []
  ) {
    super(trackId, name, routing, type);
    plugins.forEach(plugin => this.addPlugin(plugin));
  }

  getMidiClips(): MidiClipId[] {
    return [...this.midiClipIds];
  }

  getInstrumentPlugin(): PluginInstanceId | undefined {
    return this.instrumentPluginId;
  }

  setInstrumentPlugin(pluginId: PluginInstanceId): void {
    this.instrumentPluginId = pluginId;
    this.incrementVersion();
  }

  addClip(clipId: ClipId): void {
    if (clipId instanceof MidiClipId) {
      if (!this.midiClipIds.some(id => id.equals(clipId))) {
        this.midiClipIds.push(clipId);
        this.incrementVersion();
      }
    } else {
      throw new Error('Only MIDI clips can be added to instrument tracks');
    }
  }

  removeClip(clipId: ClipId): void {
    if (clipId instanceof MidiClipId) {
      this.midiClipIds = this.midiClipIds.filter(id => !id.equals(clipId));
      this.incrementVersion();
    } else {
      throw new Error('Only MIDI clips can be removed from instrument tracks');
    }
  }
}

// domain/entities/BusTrack.ts
export class BusTrack extends BaseTrack implements IBusTrackAggregate {
  private sendSettings: SendSetting[] = [];
  private returnSettings: ReturnSetting[] = [];

  constructor(
    trackId: TrackId,
    name: string,
    routing: TrackRouting,
    type: string,
    plugins: PluginInstanceId[] = [],
    sendSettings: SendSetting[] = [],
    returnSettings: ReturnSetting[] = []
  ) {
    super(trackId, name, routing, type);
    plugins.forEach(plugin => this.addPlugin(plugin));
    this.sendSettings = [...sendSettings];
    this.returnSettings = [...returnSettings];
  }

  getSendSettings(): SendSetting[] {
    return [...this.sendSettings];
  }

  getReturnSettings(): ReturnSetting[] {
    return [...this.returnSettings];
  }

  addSendSetting(setting: SendSetting): void {
    if (!this.sendSettings.some(s => s.id === setting.id)) {
      this.sendSettings.push(setting);
      this.incrementVersion();
    }
  }

  removeSendSetting(settingId: string): void {
    this.sendSettings = this.sendSettings.filter(s => s.id !== settingId);
    this.incrementVersion();
  }

  addReturnSetting(setting: ReturnSetting): void {
    if (!this.returnSettings.some(r => r.id === setting.id)) {
      this.returnSettings.push(setting);
      this.incrementVersion();
    }
  }

  removeReturnSetting(settingId: string): void {
    this.returnSettings = this.returnSettings.filter(r => r.id !== settingId);
    this.incrementVersion();
  }

  addClip(clipId: ClipId): void {
    throw new Error('Bus tracks cannot contain clips');
  }

  removeClip(clipId: ClipId): void {
    throw new Error('Bus tracks cannot contain clips');
  }
}

// domain/events/TrackCreatedEvent.ts
export class TrackCreatedEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly name: string,
    public readonly type: 'audio' | 'instrument' | 'bus',
    public readonly timestamp: Date = new Date()
  ) {}
}

// domain/events/ClipAddedToTrackEvent.ts
export class ClipAddedToTrackEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId,
    public readonly type: 'audio' | 'midi',
    public readonly timestamp: Date = new Date()
  ) {}
}

// domain/events/TrackRoutingChangedEvent.ts
export class TrackRoutingChangedEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly routingParams: RoutingParams,
    public readonly timestamp: Date = new Date()
  ) {}
}
```

### 2.2 應用層

```typescript
// application/commands/CreateTrackCommand.ts
export class CreateTrackCommand {
  constructor(
    public readonly name: string,
    public readonly type: 'audio' | 'instrument' | 'bus'
  ) {}
}

// application/commands/AddClipToTrackCommand.ts
export class AddClipToTrackCommand {
  constructor(
    public readonly trackId: TrackId,
    public readonly clipId: ClipId
  ) {}
}

// application/commands/SetTrackRoutingCommand.ts
export class SetTrackRoutingCommand {
  constructor(
    public readonly trackId: TrackId,
    public readonly routingParams: RoutingParams
  ) {}
}

// application/services/TrackService.ts
@injectable()
export class TrackService {
  constructor(
    @inject(TYPES.TrackRepository) private repository: ITrackRepository,
    @inject(TYPES.EventBus) private eventBus: IEventBus,
    @inject(TYPES.StateManager) private stateManager: IStateManager
  ) {}

  async createTrack(command: CreateTrackCommand): Promise<TrackId> {
    const trackId = TrackId.create();
    let aggregate: BaseTrackAggregate;

    switch (command.type) {
      case 'audio':
        aggregate = new AudioTrackAggregate(trackId, command.name, [], command.type);
        break;
      case 'instrument':
        aggregate = new InstrumentTrackAggregate(trackId, command.name, [], command.type);
        break;
      case 'bus':
        aggregate = new BusTrackAggregate(trackId, command.name, [], command.type);
        break;
    }

    await this.repository.save(aggregate);

    const event = new TrackCreatedEvent(trackId, command.name, command.type);
    await this.eventBus.emit('track:created', event);

    return trackId;
  }

  async addClipToTrack(command: AddClipToTrackCommand): Promise<void> {
    const aggregate = await this.repository.findById(command.trackId);
    if (!aggregate) throw new Error('Track not found');

    aggregate.addClip(command.clipId);
    await this.repository.save(aggregate);

    const event = new ClipAddedToTrackEvent(
      command.trackId,
      command.clipId,
      aggregate instanceof AudioTrackAggregate ? 'audio' : 'midi'
    );
    await this.eventBus.emit('clip:added', event);
  }

  async setTrackRouting(command: SetTrackRoutingCommand): Promise<void> {
    const aggregate = await this.repository.findById(command.trackId);
    if (!aggregate) throw new Error('Track not found');

    aggregate.updateRouting(command.routingParams);
    await this.repository.save(aggregate);

    const event = new TrackRoutingChangedEvent(
      command.trackId,
      command.routingParams
    );
    await this.eventBus.emit('track:routing:changed', event);
  }
}
```

### 2.3 基礎設施層

```typescript
// infrastructure/services/TrackStateService.ts
@injectable()
export class TrackStateService {
  constructor(
    @inject(TYPES.EventBus) private eventBus: IEventBus,
    @inject(TYPES.StateManager) private stateManager: IStateManager
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventBus.on('track:created', this.handleTrackCreated);
    this.eventBus.on('clip:added', this.handleClipAdded);
    this.eventBus.on('track:routing:changed', this.handleRoutingChanged);
  }

  private handleTrackCreated = async (event: TrackCreatedEvent): Promise<void> => {
    await this.stateManager.updateState('tracks', {
      [event.trackId.toString()]: {
        trackId: event.trackId,
        name: event.name,
        type: event.type,
        plugins: [],
        routing: {}
      }
    });
  };

  private handleClipAdded = async (event: ClipAddedToTrackEvent): Promise<void> => {
    const state = this.stateManager.getState<Record<string, any>>('tracks');
    const track = state[event.trackId.toString()];
    
    if (track) {
      const clips = track.clips || [];
      clips.push(event.clipId);
      
      await this.stateManager.updateState('tracks', {
        [event.trackId.toString()]: {
          ...track,
          clips
        }
      });
    }
  };

  private handleRoutingChanged = async (event: TrackRoutingChangedEvent): Promise<void> => {
    const state = this.stateManager.getState<Record<string, any>>('tracks');
    const track = state[event.trackId.toString()];
    
    if (track) {
      await this.stateManager.updateState('tracks', {
        [event.trackId.toString()]: {
          ...track,
          routing: event.routingParams
        }
      });
    }
  };
}
```

## 3. 事件驅動流程示例

### 3.1 創建音軌流程
```typescript
// 1. 接收命令
CreateTrack(type='audio', name='New Track')

// 2. TrackService 處理
- 創建 TrackId
- 根據類型創建對應的 Aggregate
- 保存到倉儲

// 3. 產生事件
TrackCreated(trackId='uuid-123', type='audio', name='New Track')

// 4. TrackStateService 處理
- 更新狀態
- 通知其他 Context
```

### 3.2 添加片段流程
```typescript
// 1. 接收命令
AddClipToTrack(trackId='uuid-123', clipId='clip-456')

// 2. TrackService 處理
- 獲取對應的 Aggregate
- 添加片段
- 保存到倉儲

// 3. 產生事件
ClipAddedToTrack(trackId='uuid-123', clipId='clip-456', type='audio')

// 4. TrackStateService 處理
- 更新狀態
- 通知其他 Context
```

### 3.3 設置路由流程
```typescript
// 1. 接收命令
SetTrackRouting(trackId='uuid-123', routingParams={...})

// 2. TrackService 處理
- 獲取對應的 Aggregate
- 更新路由設置
- 保存到倉儲

// 3. 產生事件
TrackRoutingChanged(trackId='uuid-123', routingParams={...})

// 4. TrackStateService 處理
- 更新狀態
- 通知其他 Context
```

## 4. 最佳實踐

1. **聚合根設計**
   - 使用抽象基類定義通用行為
   - 子類實現特定類型的功能
   - 確保業務規則的一致性

2. **事件驅動架構**
   - 所有狀態變更都通過事件通知
   - 事件應該包含足夠的上下文信息
   - 確保事件處理的冪等性

3. **狀態管理**
   - 使用 TrackStateService 管理本地狀態
   - 通過事件系統同步狀態變化
   - 保持狀態的不可變性

4. **錯誤處理**
   - 在聚合根中實現業務規則驗證
   - 提供清晰的錯誤信息
   - 確保系統狀態的一致性

5. **測試**
   - 為每個聚合根編寫單元測試
   - 測試業務規則
   - 測試事件處理
   - 測試狀態變化 