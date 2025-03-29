# DAW 音頻處理系統設計文檔

## 1. 系統概述

DAW 的音頻處理系統基於 Tone.js 構建，主要負責：

1. 音頻播放和錄製
2. 音頻效果處理
3. 音頻路由管理
4. 實時音頻處理

系統通過依賴注入（DI）進行整合，確保組件之間的鬆耦合性和可測試性。

### 1.1 DI 整合

音頻處理系統的核心組件通過 DI 容器進行管理：

```typescript
// types.ts
export const TYPES = {
    AudioEngine: Symbol.for('AudioEngine'),
    AudioContext: Symbol.for('AudioContext'),
    AudioTrack: Symbol.for('AudioTrack')
};

export interface IAudioEngine {
    start(): Promise<void>;
    stop(): void;
    pause(): void;
    setBPM(bpm: number): void;
    getCurrentTime(): number;
    getMaster(): Tone.Gain;
}

export interface IAudioContext {
    sampleRate: number;
    latencyHint: 'interactive' | 'playback';
    state: AudioContextState;
}
```

### 1.2 服務註冊

音頻處理系統的服務在 DI 容器中註冊：

```typescript
// container.ts
container.bind<IAudioEngine>(TYPES.AudioEngine).to(AudioEngine).inSingletonScope();
container.bind<IAudioContext>(TYPES.AudioContext).to(AudioContext).inSingletonScope();
container.bind<IAudioTrack>(TYPES.AudioTrack).to(AudioTrack).inTransientScope();
```

## 2. 核心組件

### 2.1 音頻引擎

```typescript
@injectable()
export class AudioEngine implements IAudioEngine {
    private static instance: AudioEngine;
    private context: Tone.Context;
    private master: Tone.Gain;
    private transport: Tone.Transport;
    
    constructor(
        @inject(TYPES.AudioContext) private context: IAudioContext,
        @inject(TYPES.EventBus) private eventBus: IEventBus<AudioEvents>
    ) {
        // 初始化 Tone.js 上下文
        this.context = new Tone.Context();
        this.master = new Tone.Gain().toDestination();
        this.transport = Tone.Transport;
        
        // 設置全局參數
        this.setupGlobalParameters();
    }
    
    static getInstance(): AudioEngine {
        if (!AudioEngine.instance) {
            AudioEngine.instance = new AudioEngine();
        }
        return AudioEngine.instance;
    }
    
    private setupGlobalParameters(): void {
        // 設置採樣率
        this.context.sampleRate = 44100;
        
        // 設置延遲補償
        this.context.latencyHint = 'interactive';
        
        // 設置全局音量
        this.master.volume.value = -6;
    }
    
    // 啟動音頻引擎
    async start(): Promise<void> {
        await Tone.start();
        this.transport.start();
    }
    
    // 停止音頻引擎
    stop(): void {
        this.transport.stop();
    }
    
    // 暫停音頻引擎
    pause(): void {
        this.transport.pause();
    }
    
    // 設置全局 BPM
    setBPM(bpm: number): void {
        this.transport.bpm.value = bpm;
    }
    
    // 獲取當前時間
    getCurrentTime(): number {
        return this.transport.seconds;
    }
    
    // 獲取主輸出節點
    getMaster(): Tone.Gain {
        return this.master;
    }
}
```

### 2.2 音頻軌道

```typescript
export class AudioTrack {
    private channel: Tone.Channel;
    private volume: Tone.Volume;
    private pan: Tone.PanVol;
    private effects: Tone.Effect[];
    private clips: AudioClip[];
    
    constructor(config: AudioTrackConfig) {
        // 創建音頻通道
        this.channel = new Tone.Channel({
            volume: config.volume,
            pan: config.pan,
            mute: config.muted,
            solo: config.soloed
        });
        
        // 創建音量控制
        this.volume = new Tone.Volume(config.volume);
        
        // 創建聲像控制
        this.pan = new Tone.PanVol(config.pan);
        
        // 連接節點
        this.setupSignalChain();
        
        // 初始化效果器
        this.effects = [];
        
        // 初始化片段
        this.clips = [];
    }
    
    private setupSignalChain(): void {
        // 設置信號鏈：channel -> effects -> volume -> pan -> master
        this.channel.chain(
            ...this.effects,
            this.volume,
            this.pan,
            AudioEngine.getInstance().getMaster()
        );
    }
    
    // 添加效果器
    addEffect(effect: Tone.Effect): void {
        this.effects.push(effect);
        this.setupSignalChain();
    }
    
    // 移除效果器
    removeEffect(effect: Tone.Effect): void {
        const index = this.effects.indexOf(effect);
        if (index > -1) {
            this.effects.splice(index, 1);
            this.setupSignalChain();
        }
    }
    
    // 設置音量
    setVolume(value: number): void {
        this.volume.volume.value = value;
    }
    
    // 設置聲像
    setPan(value: number): void {
        this.pan.pan.value = value;
    }
    
    // 靜音
    mute(): void {
        this.channel.mute = true;
    }
    
    // 取消靜音
    unmute(): void {
        this.channel.mute = false;
    }
    
    // 獨奏
    solo(): void {
        this.channel.solo = true;
    }
    
    // 取消獨奏
    unsolo(): void {
        this.channel.solo = false;
    }
}
```

### 2.3 音頻片段

```typescript
export class AudioClip {
    private player: Tone.Player;
    private startTime: number;
    private duration: number;
    private loop: boolean;
    
    constructor(config: AudioClipConfig) {
        // 創建音頻播放器
        this.player = new Tone.Player({
            url: config.url,
            loop: config.loop,
            loopStart: config.loopStart,
            loopEnd: config.loopEnd
        });
        
        this.startTime = config.startTime;
        this.duration = config.duration;
        this.loop = config.loop;
    }
    
    // 播放片段
    play(startTime?: number): void {
        const time = startTime ?? this.startTime;
        this.player.start(time);
    }
    
    // 停止片段
    stop(): void {
        this.player.stop();
    }
    
    // 設置循環
    setLoop(loop: boolean): void {
        this.loop = loop;
        this.player.loop = loop;
    }
    
    // 設置循環點
    setLoopPoints(start: number, end: number): void {
        this.player.loopStart = start;
        this.player.loopEnd = end;
    }
    
    // 獲取當前播放位置
    getCurrentTime(): number {
        return this.player.position;
    }
    
    // 設置播放位置
    seek(time: number): void {
        this.player.seek(time);
    }
}
```

## 3. 音頻效果系統

### 3.1 效果器基類

```typescript
export abstract class AudioEffect {
    protected effect: Tone.Effect;
    
    constructor(config: EffectConfig) {
        this.effect = this.createEffect(config);
    }
    
    protected abstract createEffect(config: EffectConfig): Tone.Effect;
    
    // 連接效果器
    connect(destination: Tone.AudioNode): void {
        this.effect.connect(destination);
    }
    
    // 斷開連接
    disconnect(): void {
        this.effect.disconnect();
    }
    
    // 設置效果器參數
    setParameter(name: string, value: number): void {
        if (name in this.effect) {
            (this.effect as any)[name].value = value;
        }
    }
    
    // 獲取效果器參數
    getParameter(name: string): number {
        if (name in this.effect) {
            return (this.effect as any)[name].value;
        }
        return 0;
    }
}
```

### 3.2 常用效果器

```typescript
// 混響效果器
export class ReverbEffect extends AudioEffect {
    protected createEffect(config: EffectConfig): Tone.Reverb {
        return new Tone.Reverb({
            decay: config.decay ?? 2,
            wet: config.wet ?? 0.5,
            dry: config.dry ?? 0.5
        });
    }
}

// 延遲效果器
export class DelayEffect extends AudioEffect {
    protected createEffect(config: EffectConfig): Tone.FeedbackDelay {
        return new Tone.FeedbackDelay({
            delayTime: config.delayTime ?? 0.25,
            feedback: config.feedback ?? 0.5,
            wet: config.wet ?? 0.5
        });
    }
}

// 壓縮效果器
export class CompressorEffect extends AudioEffect {
    protected createEffect(config: EffectConfig): Tone.Compressor {
        return new Tone.Compressor({
            threshold: config.threshold ?? -24,
            ratio: config.ratio ?? 12,
            attack: config.attack ?? 0.003,
            release: config.release ?? 0.25
        });
    }
}
```

## 4. 音頻路由系統

### 4.1 路由管理器

```typescript
export class AudioRouter {
    private static instance: AudioRouter;
    private routes: Map<string, AudioRoute>;
    
    private constructor() {
        this.routes = new Map();
    }
    
    static getInstance(): AudioRouter {
        if (!AudioRouter.instance) {
            AudioRouter.instance = new AudioRouter();
        }
        return AudioRouter.instance;
    }
    
    // 創建路由
    createRoute(config: RouteConfig): AudioRoute {
        const route = new AudioRoute(config);
        this.routes.set(config.id, route);
        return route;
    }
    
    // 獲取路由
    getRoute(id: string): AudioRoute | undefined {
        return this.routes.get(id);
    }
    
    // 刪除路由
    deleteRoute(id: string): void {
        const route = this.routes.get(id);
        if (route) {
            route.disconnect();
            this.routes.delete(id);
        }
    }
    
    // 連接路由
    connect(sourceId: string, destinationId: string): void {
        const source = this.routes.get(sourceId);
        const destination = this.routes.get(destinationId);
        
        if (source && destination) {
            source.connect(destination);
        }
    }
    
    // 斷開路由
    disconnect(sourceId: string, destinationId: string): void {
        const source = this.routes.get(sourceId);
        const destination = this.routes.get(destinationId);
        
        if (source && destination) {
            source.disconnect(destination);
        }
    }
}
```

### 4.2 路由配置

```typescript
export interface RouteConfig {
    id: string;
    type: 'track' | 'bus' | 'aux' | 'master';
    name: string;
    channels: number;
    effects?: AudioEffect[];
}

export class AudioRoute {
    private input: Tone.Gain;
    private output: Tone.Gain;
    private effects: AudioEffect[];
    
    constructor(config: RouteConfig) {
        // 創建輸入節點
        this.input = new Tone.Gain();
        
        // 創建輸出節點
        this.output = new Tone.Gain();
        
        // 初始化效果器
        this.effects = config.effects ?? [];
        
        // 設置信號鏈
        this.setupSignalChain();
    }
    
    private setupSignalChain(): void {
        // 連接效果器
        let current = this.input;
        for (const effect of this.effects) {
            current.connect(effect);
            current = effect;
        }
        current.connect(this.output);
    }
    
    // 連接目標
    connect(destination: AudioRoute): void {
        this.output.connect(destination.input);
    }
    
    // 斷開連接
    disconnect(destination: AudioRoute): void {
        this.output.disconnect(destination.input);
    }
    
    // 添加效果器
    addEffect(effect: AudioEffect): void {
        this.effects.push(effect);
        this.setupSignalChain();
    }
    
    // 移除效果器
    removeEffect(effect: AudioEffect): void {
        const index = this.effects.indexOf(effect);
        if (index > -1) {
            this.effects.splice(index, 1);
            this.setupSignalChain();
        }
    }
}
```

## 5. 實時處理優化

### 5.1 音頻緩衝管理

```typescript
export class AudioBufferManager {
    private static instance: AudioBufferManager;
    private buffers: Map<string, Tone.Buffer>;
    private maxBuffers: number;
    
    private constructor() {
        this.buffers = new Map();
        this.maxBuffers = 100; // 最大緩衝數量
    }
    
    static getInstance(): AudioBufferManager {
        if (!AudioBufferManager.instance) {
            AudioBufferManager.instance = new AudioBufferManager();
        }
        return AudioBufferManager.instance;
    }
    
    // 加載音頻文件
    async loadBuffer(url: string): Promise<Tone.Buffer> {
        if (this.buffers.has(url)) {
            return this.buffers.get(url)!;
        }
        
        // 檢查緩衝數量
        if (this.buffers.size >= this.maxBuffers) {
            this.removeOldestBuffer();
        }
        
        const buffer = await Tone.Buffer.fromUrl(url);
        this.buffers.set(url, buffer);
        return buffer;
    }
    
    // 移除最舊的緩衝
    private removeOldestBuffer(): void {
        const firstKey = this.buffers.keys().next().value;
        this.buffers.delete(firstKey);
    }
    
    // 清理緩衝
    clear(): void {
        this.buffers.clear();
    }
}
```

### 5.2 性能監控

```typescript
export class AudioPerformanceMonitor {
    private static instance: AudioPerformanceMonitor;
    private metrics: Map<string, number[]>;
    private sampleSize: number;
    
    private constructor() {
        this.metrics = new Map();
        this.sampleSize = 100;
    }
    
    static getInstance(): AudioPerformanceMonitor {
        if (!AudioPerformanceMonitor.instance) {
            AudioPerformanceMonitor.instance = new AudioPerformanceMonitor();
        }
        return AudioPerformanceMonitor.instance;
    }
    
    // 記錄性能指標
    recordMetric(name: string, value: number): void {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        
        const values = this.metrics.get(name)!;
        values.push(value);
        
        // 保持採樣大小
        if (values.length > this.sampleSize) {
            values.shift();
        }
    }
    
    // 獲取平均性能指標
    getAverageMetric(name: string): number {
        const values = this.metrics.get(name);
        if (!values || values.length === 0) return 0;
        
        return values.reduce((a, b) => a + b, 0) / values.length;
    }
    
    // 獲取最大性能指標
    getMaxMetric(name: string): number {
        const values = this.metrics.get(name);
        if (!values || values.length === 0) return 0;
        
        return Math.max(...values);
    }
    
    // 清理指標
    clearMetrics(): void {
        this.metrics.clear();
    }
}
```

## 6. 最佳實踐

1. **音頻處理原則**
   - 使用 Tone.js 的 Transport 進行全局時間控制
   - 合理使用音頻緩衝管理
   - 注意音頻節點的連接順序
   - 及時清理不需要的音頻資源

2. **性能優化**
   - 使用音頻緩衝池管理音頻文件
   - 監控音頻處理性能
   - 優化效果器參數更新
   - 合理使用音頻路由

3. **錯誤處理**
   - 處理音頻加載錯誤
   - 處理音頻播放錯誤
   - 處理效果器參數錯誤
   - 提供錯誤恢復機制

4. **調試支持**
   - 提供音頻波形顯示
   - 提供音頻分析工具
   - 提供性能監控工具
   - 支持音頻路由可視化

5. **測試策略**
   - 測試音頻播放功能
   - 測試效果器處理
   - 測試音頻路由
   - 測試性能指標
