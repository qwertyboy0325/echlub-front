# 依賴注入系統使用指南

## 概述

本專案使用 Inversify 作為依賴注入容器，實現了一個模塊化的依賴注入系統。主要功能包括：

- 類型安全的依賴注入
- 模塊化的服務註冊
- 生命週期管理
- 事件系統整合
- 狀態管理整合

## 系統架構

### 核心模塊

1. **事件模塊 (`eventModule`)**
   ```typescript
   // 獲取事件總線
   const uiEventBus = container.get<UIEventBus>(TYPES.UIEventBus);
   const domainEventBus = container.get<DomainEventBus>(TYPES.DomainEventBus);

   // 使用示例
   uiEventBus.on('ui:playback:start', () => {
     // 處理播放開始事件
   });

   domainEventBus.emit('domain:clip:added', { 
     clip: newClip 
   });
   ```

2. **音頻模塊 (`audioModule`)**
   ```typescript
   // 獲取音頻服務
   const audioEngine = container.get<IAudioEngine>(TYPES.AudioEngine);
   const audioContext = container.get<IAudioContext>(TYPES.AudioContext);

   // 使用示例
   await audioEngine.loadAudio(file);
   audioEngine.play();
   ```

3. **DAW 模塊 (`dawModule`)**
   ```typescript
   // 獲取 DAW 服務
   const dawPresenter = container.get<DAWPresenter>(TYPES.DAWPresenter);
   const clipRepository = container.get<ClipRepository>(TYPES.ClipRepository);

   // 使用示例
   await dawPresenter.createNewTrack();
   const clips = await clipRepository.findByTrackId(trackId);
   ```

4. **存儲模塊 (`storageModule`)**
   ```typescript
   // 獲取存儲服務
   const storage = container.get<Storage>(TYPES.Storage);
   const stateManager = container.get<StateManager>(TYPES.StateManager);

   // 使用示例
   await storage.set('key', value);
   const state = await stateManager.getState();
   ```

## 在不同場景中使用

### 1. React 組件中使用

```typescript
// 使用自定義 Hook
const useAudioSystem = () => {
  const audioEngine = container.get<IAudioEngine>(TYPES.AudioEngine);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlayback = () => {
    if (isPlaying) {
      audioEngine.pause();
    } else {
      audioEngine.play();
    }
    setIsPlaying(!isPlaying);
  };

  return { isPlaying, togglePlayback };
};

// 在組件中使用
const AudioControls: React.FC = () => {
  const { isPlaying, togglePlayback } = useAudioSystem();
  
  return (
    <button onClick={togglePlayback}>
      {isPlaying ? '暫停' : '播放'}
    </button>
  );
};
```

### 2. 服務類中使用

```typescript
@injectable()
class TrackService {
  constructor(
    @inject(TYPES.TrackRepository) private trackRepo: TrackRepository,
    @inject(TYPES.AudioEngine) private audioEngine: AudioEngine,
    @inject(TYPES.UIEventBus) private uiEventBus: UIEventBus
  ) {}

  async createTrackWithAudio(file: File) {
    const audioId = await this.audioEngine.loadAudio(file);
    const track = await this.trackRepo.add({
      id: crypto.randomUUID(),
      name: file.name,
      clips: []
    });
    
    this.uiEventBus.emit('ui:track:created', { trackId: track.id });
    return track;
  }
}
```

### 3. 事件處理中使用

```typescript
@injectable()
class AudioEventHandler {
  constructor(
    @inject(TYPES.DomainEventBus) private domainEventBus: DomainEventBus,
    @inject(TYPES.AudioEngine) private audioEngine: AudioEngine
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.domainEventBus.on('domain:bpm:changed', this.handleBPMChange);
    this.domainEventBus.on('domain:playback:started', this.handlePlaybackStart);
  }

  private handleBPMChange = ({ bpm }: { bpm: number }) => {
    this.audioEngine.setBPM(bpm);
  };

  private handlePlaybackStart = () => {
    this.audioEngine.play();
  };
}
```

## 最佳實踐

### 1. 類型安全

```typescript
// 定義明確的類型
interface TrackData {
  id: string;
  name: string;
  clips: ClipViewModel[];
}

// 使用泛型約束
class Repository<T extends { id: string }> {
  async get(id: string): Promise<T | undefined> {
    // 實現細節
  }
}
```

### 2. 錯誤處理

```typescript
try {
  const service = container.get<MyService>(TYPES.MyService);
  await service.doSomething();
} catch (error) {
  if (error instanceof NotFoundError) {
    // 處理特定錯誤
  } else {
    // 處理一般錯誤
  }
}
```

### 3. 生命週期管理

```typescript
class MyComponent extends React.Component {
  private service: MyService;

  componentDidMount() {
    this.service = container.get<MyService>(TYPES.MyService);
    this.service.onInit();
  }

  componentWillUnmount() {
    this.service.onDestroy();
  }
}
```

### 4. 測試

```typescript
describe('TrackService', () => {
  let container: Container;
  let trackService: TrackService;
  let mockTrackRepo: jest.Mocked<TrackRepository>;

  beforeEach(() => {
    container = new Container();
    mockTrackRepo = {
      add: jest.fn(),
      get: jest.fn(),
      // ... 其他方法
    };

    container.bind(TYPES.TrackRepository).toConstantValue(mockTrackRepo);
    container.bind(TYPES.TrackService).to(TrackService);
    
    trackService = container.get(TYPES.TrackService);
  });

  it('should create track with audio', async () => {
    const file = new File([], 'test.mp3');
    await trackService.createTrackWithAudio(file);
    
    expect(mockTrackRepo.add).toHaveBeenCalled();
  });
});
```

## 常見問題解決

### 1. 循環依賴

```typescript
// 使用 @lazyInject 解決循環依賴
@injectable()
class ServiceA {
  @lazyInject(TYPES.ServiceB)
  private serviceB!: ServiceB;
}
```

### 2. 作用域問題

```typescript
// 使用工廠模式處理複雜的作用域需求
container.bind<IAudioContext>(TYPES.AudioContext).toFactory((context) => {
  return () => {
    const ctx = new AudioContext();
    // 自定義初始化邏輯
    return ctx;
  };
});
```

### 3. 狀態管理

```typescript
@injectable()
class StateManager {
  private state: AppState;

  @postConstruct()
  init() {
    // 初始化狀態
  }

  getState(): AppState {
    return this.state;
  }

  setState(newState: Partial<AppState>) {
    this.state = { ...this.state, ...newState };
  }
}
```

## 擴展指南

### 1. 添加新服務

1. 定義介面
2. 實現服務類
3. 在適當的模塊中註冊
4. 更新 TYPES 定義

### 2. 添加新模塊

1. 創建新的模塊文件
2. 定義模塊的綁定
3. 在容器中加載模塊

### 3. 自定義作用域

1. 定義作用域介面
2. 實現作用域邏輯
3. 在綁定時使用自定義作用域

## 參考資料

- [Inversify 文檔](https://inversify.io/)
- [TypeScript 裝飾器](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [依賴注入模式](https://en.wikipedia.org/wiki/Dependency_injection)
