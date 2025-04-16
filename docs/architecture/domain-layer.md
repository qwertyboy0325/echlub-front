# 領域層架構

## 核心概念

### 實體（Entities）

1. **Room**（房間）
```typescript
interface Room {
    id: string;
    name: string;
    status: RoomStatus;
    participants: User[];
    tracks: Track[];
    currentRound: number;
    maxRounds: number;
    createdAt: Date;
    updatedAt: Date;
}
```

2. **Track**（音軌）
```typescript
interface Track {
    id: string;
    name: string;
    type: TrackType;
    role: TrackRole;
    clips: Clip[];
    owner: User;
    settings: TrackSettings;
    isLocked: boolean;
}
```

3. **Clip**（片段）
```typescript
interface Clip {
    id: string;
    trackId: string;
    type: ClipType;
    startTime: number;
    duration: number;
    data: AudioData | MidiData;
    metadata: ClipMetadata;
}
```

4. **User**（用戶）
```typescript
interface User {
    id: string;
    name: string;
    role: UserRole;
    currentRoom?: string;
    preferences: UserPreferences;
}
```

### 值對象（Value Objects）

1. **TimeSignature**（拍號）
```typescript
interface TimeSignature {
    numerator: number;
    denominator: number;
}
```

2. **Position**（位置）
```typescript
interface Position {
    bar: number;
    beat: number;
    tick: number;
}
```

3. **AudioSettings**（音頻設定）
```typescript
interface AudioSettings {
    sampleRate: number;
    bitDepth: number;
    channels: number;
    bufferSize: number;
}
```

### 領域事件（Domain Events）

1. **房間事件**
- `RoomCreated`
- `RoomJoined`
- `RoomLeft`
- `RoomClosed`
- `RoundCompleted`

2. **音軌事件**
- `TrackCreated`
- `TrackUpdated`
- `TrackLocked`
- `TrackUnlocked`

3. **片段事件**
- `ClipCreated`
- `ClipRecorded`
- `ClipEdited`
- `ClipDeleted`

### 聚合（Aggregates）

1. **RoomAggregate**
   - 根實體：`Room`
   - 子實體：`Track`, `Clip`
   - 不變量：
     - 房間必須有 1-4 名參與者
     - 每個參與者只能有一個音軌
     - 音軌只能被其擁有者編輯

2. **TrackAggregate**
   - 根實體：`Track`
   - 子實體：`Clip`
   - 不變量：
     - 片段不能重疊
     - 音軌類型不能更改
     - 鎖定的音軌不能編輯

### 倉儲接口（Repository Interfaces）

1. **IRoomRepository**
```typescript
interface IRoomRepository {
    create(room: Room): Promise<Room>;
    findById(id: string): Promise<Room | null>;
    update(room: Room): Promise<void>;
    delete(id: string): Promise<void>;
    findActive(): Promise<Room[]>;
}
```

2. **ITrackRepository**
```typescript
interface ITrackRepository {
    create(track: Track): Promise<Track>;
    findById(id: string): Promise<Track | null>;
    findByRoom(roomId: string): Promise<Track[]>;
    update(track: Track): Promise<void>;
    delete(id: string): Promise<void>;
}
```

3. **IClipRepository**
```typescript
interface IClipRepository {
    create(clip: Clip): Promise<Clip>;
    findById(id: string): Promise<Clip | null>;
    findByTrack(trackId: string): Promise<Clip[]>;
    update(clip: Clip): Promise<void>;
    delete(id: string): Promise<void>;
}
```

## 領域服務（Domain Services）

1. **RoomService**
```typescript
interface RoomService {
    createRoom(creator: User): Promise<Room>;
    joinRoom(user: User, roomId: string): Promise<void>;
    leaveRoom(user: User, roomId: string): Promise<void>;
    completeRound(roomId: string): Promise<void>;
}
```

2. **TrackService**
```typescript
interface TrackService {
    createTrack(room: Room, user: User, role: TrackRole): Promise<Track>;
    lockTrack(trackId: string): Promise<void>;
    unlockTrack(trackId: string): Promise<void>;
    validateTrackOperation(track: Track, user: User): boolean;
}
```

3. **ClipService**
```typescript
interface ClipService {
    createClip(track: Track, position: Position): Promise<Clip>;
    recordClip(track: Track, duration: number): Promise<Clip>;
    editClip(clip: Clip, data: AudioData | MidiData): Promise<void>;
    validateClipBoundaries(clip: Clip, track: Track): boolean;
}
```

## 領域規則

1. **房間規則**
   - 房間人數限制：1-4人
   - 每個用戶只能同時在一個房間
   - 房間狀態轉換：等待中 -> 進行中 -> 已完成

2. **音軌規則**
   - 每個用戶在房間中只能擁有一個音軌
   - 音軌類型（MIDI/Audio）一旦確定不能更改
   - 只有音軌擁有者可以編輯

3. **片段規則**
   - 片段不能重疊
   - 片段長度必須是小節的整數倍
   - 音頻片段必須符合採樣率要求 