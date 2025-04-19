# 前端模組實現指南

## React 組件架構

### 1. 組件分層
```typescript
src/modules/{module-name}/
├── components/           # 展示型組件
│   ├── atoms/           # 原子組件
│   ├── molecules/       # 分子組件
│   └── organisms/       # 有機體組件
├── containers/          # 容器組件
├── hooks/              # 自定義 Hooks
└── contexts/           # React Context
```

### 2. 組件設計原則
- 使用函數式組件和 Hooks
- 實現受控組件模式
- 保持組件的單一職責
- 使用 TypeScript 強類型定義

### 3. 狀態管理
```typescript
// 使用 Context + Reducer 模式
export const ModuleContext = createContext<ModuleState>(initialState);
export const ModuleDispatchContext = createContext<Dispatch<ModuleAction>>(null);

export function ModuleProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(moduleReducer, initialState);
  
  return (
    <ModuleContext.Provider value={state}>
      <ModuleDispatchContext.Provider value={dispatch}>
        {children}
      </ModuleDispatchContext.Provider>
    </ModuleContext.Provider>
  );
}
```

## 領域模型整合

### 1. 視圖模型轉換
```typescript
interface TrackViewModel {
  id: string;
  name: string;
  type: TrackType;
  volume: number;
  pan: number;
  // UI 特定屬性
  isSelected: boolean;
  isExpanded: boolean;
}

class TrackViewModelAdapter {
  static toViewModel(track: Track): TrackViewModel {
    return {
      id: track.getId(),
      name: track.getName(),
      type: track.getType(),
      volume: track.getVolume(),
      pan: track.getPan(),
      isSelected: false,
      isExpanded: false
    };
  }
}
```

### 2. 事件處理
```typescript
function useTrackEvents() {
  useEffect(() => {
    const subscription = eventBus.subscribe(
      TrackEventTypes.TRACK_UPDATED,
      (event: TrackUpdatedEvent) => {
        // 更新視圖模型
      }
    );
    return () => subscription.unsubscribe();
  }, []);
}
```

## 性能優化

### 1. 記憶化策略
```typescript
// 使用 useMemo 緩存計算結果
const sortedTracks = useMemo(() => {
  return tracks.slice().sort((a, b) => a.position - b.position);
}, [tracks]);

// 使用 useCallback 緩存事件處理器
const handleTrackSelect = useCallback((trackId: string) => {
  dispatch({ type: 'SELECT_TRACK', payload: trackId });
}, []);
```

### 2. 虛擬化列表
```typescript
function TrackList({ tracks }: Props) {
  return (
    <VirtualList
      height={400}
      itemCount={tracks.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <TrackItem
          key={tracks[index].id}
          track={tracks[index]}
          style={style}
        />
      )}
    </VirtualList>
  );
}
```

### 3. 懶加載策略
```typescript
const TrackEditor = lazy(() => import('./TrackEditor'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <TrackEditor />
    </Suspense>
  );
}
```

## 測試策略

### 1. 組件測試
```typescript
describe('TrackComponent', () => {
  it('應該正確渲染音軌信息', () => {
    const track = createMockTrack();
    const { getByText } = render(<TrackComponent track={track} />);
    
    expect(getByText(track.name)).toBeInTheDocument();
    expect(getByText(track.type)).toBeInTheDocument();
  });
  
  it('應該響應用戶交互', async () => {
    const onSelect = jest.fn();
    const { getByRole } = render(
      <TrackComponent onSelect={onSelect} />
    );
    
    await userEvent.click(getByRole('button'));
    expect(onSelect).toHaveBeenCalled();
  });
});
```

### 2. Hook 測試
```typescript
describe('useTrackState', () => {
  it('應該正確管理音軌狀態', () => {
    const { result } = renderHook(() => useTrackState());
    
    act(() => {
      result.current.setVolume(0.5);
    });
    
    expect(result.current.volume).toBe(0.5);
  });
});
```

## 最佳實踐

### 1. 錯誤邊界
```typescript
class ModuleErrorBoundary extends React.Component {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorDisplay error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

### 2. 可訪問性
- 使用語義化 HTML
- 實現鍵盤導航
- 添加 ARIA 標籤
- 確保足夠的顏色對比度

### 3. 國際化
```typescript
const messages = {
  'zh-TW': {
    track: {
      create: '創建音軌',
      delete: '刪除音軌',
      // ...
    }
  }
};

function TrackActions() {
  const { t } = useTranslation();
  return (
    <Button onClick={handleCreate}>
      {t('track.create')}
    </Button>
  );
}
```

## 調試工具

### 1. 開發工具整合
```typescript
if (process.env.NODE_ENV === 'development') {
  // 註冊自定義 DevTools
  registerModuleDevTools({
    name: 'Track Module',
    initialState,
    actions: moduleActions
  });
}
```

### 2. 日誌記錄
```typescript
const logger = createLogger('TrackModule');

function TrackContainer() {
  logger.debug('Rendering track container', {
    tracks: tracks.length,
    selectedTrack: selectedTrackId
  });
  // ...
}
``` 