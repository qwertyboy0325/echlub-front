# Audio Buffer 實現詳解

## 基本概念
Audio Buffer 是用於存儲和處理音訊數據的核心數據結構，它包含以下關鍵信息：
1. 採樣率 (Sample Rate)
2. 聲道數 (Number of Channels)
3. 採樣數據 (Sample Data)
4. 持續時間 (Duration)

## 實現方案

### 1. 基本 Audio Buffer 實現
```typescript
// Audio Buffer 基本實現
class AudioBufferImpl {
  private readonly sampleRate: number;
  private readonly numberOfChannels: number;
  private readonly length: number;
  private readonly channelData: Float32Array[];

  constructor(
    sampleRate: number,
    numberOfChannels: number,
    length: number
  ) {
    this.sampleRate = sampleRate;
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.channelData = new Array(numberOfChannels);
    
    // 初始化每個聲道的數據
    for (let i = 0; i < numberOfChannels; i++) {
      this.channelData[i] = new Float32Array(length);
    }
  }

  // 獲取聲道數據
  getChannelData(channel: number): Float32Array {
    if (channel < 0 || channel >= this.numberOfChannels) {
      throw new Error('Invalid channel index');
    }
    return this.channelData[channel];
  }

  // 獲取採樣率
  getSampleRate(): number {
    return this.sampleRate;
  }

  // 獲取聲道數
  getNumberOfChannels(): number {
    return this.numberOfChannels;
  }

  // 獲取緩衝區長度
  getLength(): number {
    return this.length;
  }

  // 獲取持續時間（秒）
  getDuration(): number {
    return this.length / this.sampleRate;
  }
}
```

### 2. 音訊數據處理
```typescript
// 音訊數據處理實現
class AudioBufferProcessor {
  // 合併多個音訊緩衝區
  static mergeBuffers(buffers: AudioBufferImpl[]): AudioBufferImpl {
    if (buffers.length === 0) {
      throw new Error('No buffers to merge');
    }

    const sampleRate = buffers[0].getSampleRate();
    const numberOfChannels = buffers[0].getNumberOfChannels();
    
    // 計算總長度
    const totalLength = buffers.reduce((sum, buffer) => sum + buffer.getLength(), 0);
    const result = new AudioBufferImpl(sampleRate, numberOfChannels, totalLength);

    // 合併每個聲道的數據
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const resultData = result.getChannelData(channel);
      let offset = 0;

      for (const buffer of buffers) {
        const sourceData = buffer.getChannelData(channel);
        resultData.set(sourceData, offset);
        offset += buffer.getLength();
      }
    }

    return result;
  }

  // 剪輯音訊緩衝區
  static trimBuffer(
    buffer: AudioBufferImpl,
    startTime: number,
    endTime: number
  ): AudioBufferImpl {
    const startSample = Math.floor(startTime * buffer.getSampleRate());
    const endSample = Math.floor(endTime * buffer.getSampleRate());
    const length = endSample - startSample;

    const result = new AudioBufferImpl(
      buffer.getSampleRate(),
      buffer.getNumberOfChannels(),
      length
    );

    for (let channel = 0; channel < buffer.getNumberOfChannels(); channel++) {
      const sourceData = buffer.getChannelData(channel);
      const resultData = result.getChannelData(channel);
      
      for (let i = 0; i < length; i++) {
        resultData[i] = sourceData[startSample + i];
      }
    }

    return result;
  }

  // 應用增益
  static applyGain(buffer: AudioBufferImpl, gain: number): void {
    for (let channel = 0; channel < buffer.getNumberOfChannels(); channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < data.length; i++) {
        data[i] *= gain;
      }
    }
  }
}
```

### 3. 音訊緩衝區管理器
```typescript
// 音訊緩衝區管理器實現
class AudioBufferManager {
  private readonly buffers: Map<string, AudioBufferImpl> = new Map();
  private readonly maxBuffers: number;
  private readonly maxMemory: number;
  private currentMemoryUsage: number = 0;

  constructor(maxBuffers: number = 100, maxMemory: number = 100 * 1024 * 1024) {
    this.maxBuffers = maxBuffers;
    this.maxMemory = maxMemory;
  }

  // 創建新的音訊緩衝區
  createBuffer(
    id: string,
    sampleRate: number,
    numberOfChannels: number,
    length: number
  ): AudioBufferImpl {
    this.checkMemoryLimit(length * numberOfChannels * 4); // 4 bytes per float32

    const buffer = new AudioBufferImpl(sampleRate, numberOfChannels, length);
    this.buffers.set(id, buffer);
    this.currentMemoryUsage += length * numberOfChannels * 4;

    return buffer;
  }

  // 加載音訊文件
  async loadAudioFile(id: string, file: File): Promise<AudioBufferImpl> {
    const arrayBuffer = await file.arrayBuffer();
    const audioContext = new AudioContext();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    const buffer = new AudioBufferImpl(
      audioBuffer.sampleRate,
      audioBuffer.numberOfChannels,
      audioBuffer.length
    );

    // 複製數據
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const sourceData = audioBuffer.getChannelData(channel);
      const targetData = buffer.getChannelData(channel);
      targetData.set(sourceData);
    }

    this.buffers.set(id, buffer);
    this.currentMemoryUsage += buffer.getLength() * buffer.getNumberOfChannels() * 4;

    return buffer;
  }

  // 釋放音訊緩衝區
  releaseBuffer(id: string): void {
    const buffer = this.buffers.get(id);
    if (buffer) {
      this.currentMemoryUsage -= buffer.getLength() * buffer.getNumberOfChannels() * 4;
      this.buffers.delete(id);
    }
  }

  // 檢查記憶體限制
  private checkMemoryLimit(requiredMemory: number): void {
    if (this.currentMemoryUsage + requiredMemory > this.maxMemory) {
      this.evictOldestBuffers(requiredMemory);
    }
  }

  // 釋放最舊的緩衝區
  private evictOldestBuffers(requiredMemory: number): void {
    const entries = Array.from(this.buffers.entries());
    entries.sort((a, b) => a[1].getLength() - b[1].getLength());

    while (this.currentMemoryUsage + requiredMemory > this.maxMemory && entries.length > 0) {
      const [id, buffer] = entries.shift()!;
      this.releaseBuffer(id);
    }
  }
}
```

## 使用示例
```typescript
// 使用示例
async function example() {
  const manager = new AudioBufferManager();

  // 創建新的音訊緩衝區
  const buffer = manager.createBuffer('test', 44100, 2, 44100); // 1秒的音訊

  // 加載音訊文件
  const file = new File(['audio data'], 'test.wav');
  const loadedBuffer = await manager.loadAudioFile('loaded', file);

  // 處理音訊數據
  AudioBufferProcessor.applyGain(loadedBuffer, 0.5);

  // 剪輯音訊
  const trimmed = AudioBufferProcessor.trimBuffer(loadedBuffer, 0, 1);

  // 合併音訊
  const merged = AudioBufferProcessor.mergeBuffers([buffer, trimmed]);

  // 釋放緩衝區
  manager.releaseBuffer('test');
  manager.releaseBuffer('loaded');
}
```

## 注意事項
1. 記憶體管理
   - 監控緩衝區大小
   - 及時釋放不需要的緩衝區
   - 實現緩衝區重用機制

2. 性能優化
   - 使用 TypedArray 提高性能
   - 避免頻繁的緩衝區創建和銷毀
   - 實現緩衝區池

3. 錯誤處理
   - 處理無效的採樣率
   - 處理無效的聲道數
   - 處理記憶體不足情況

4. 音訊質量
   - 保持採樣精度
   - 避免數據截斷
   - 處理採樣率轉換 