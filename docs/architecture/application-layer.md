# 應用層架構

## 用例（Use Cases）

### 房間管理用例

1. **CreateRoomUseCase**
```typescript
interface CreateRoomUseCase {
    execute(params: {
        creator: User;
        name: string;
        maxRounds: number;
    }): Promise<Room>;
}
```

2. **JoinRoomUseCase**
```typescript
interface JoinRoomUseCase {
    execute(params: {
        user: User;
        roomId: string;
        role: TrackRole;
    }): Promise<void>;
}
```

3. **LeaveRoomUseCase**
```typescript
interface LeaveRoomUseCase {
    execute(params: {
        user: User;
        roomId: string;
    }): Promise<void>;
}
```

### 音軌管理用例

1. **CreateTrackUseCase**
```typescript
interface CreateTrackUseCase {
    execute(params: {
        room: Room;
        user: User;
        type: TrackType;
        role: TrackRole;
    }): Promise<Track>;
}
```

2. **UpdateTrackSettingsUseCase**
```typescript
interface UpdateTrackSettingsUseCase {
    execute(params: {
        trackId: string;
        user: User;
        settings: Partial<TrackSettings>;
    }): Promise<void>;
}
```

### 片段管理用例

1. **RecordClipUseCase**
```typescript
interface RecordClipUseCase {
    execute(params: {
        trackId: string;
        user: User;
        duration: number;
        position: Position;
    }): Promise<Clip>;
}
```

2. **EditClipUseCase**
```typescript
interface EditClipUseCase {
    execute(params: {
        clipId: string;
        user: User;
        data: AudioData | MidiData;
    }): Promise<void>;
}
```

## 事件處理器（Event Handlers）

### 房間事件處理器

```typescript
interface RoomEventHandlers {
    onRoomCreated(event: RoomCreatedEvent): Promise<void>;
    onRoomJoined(event: RoomJoinedEvent): Promise<void>;
    onRoomLeft(event: RoomLeftEvent): Promise<void>;
    onRoundCompleted(event: RoundCompletedEvent): Promise<void>;
}
```

### 音軌事件處理器

```typescript
interface TrackEventHandlers {
    onTrackCreated(event: TrackCreatedEvent): Promise<void>;
    onTrackUpdated(event: TrackUpdatedEvent): Promise<void>;
    onTrackLocked(event: TrackLockedEvent): Promise<void>;
    onTrackUnlocked(event: TrackUnlockedEvent): Promise<void>;
}
```

### 片段事件處理器

```typescript
interface ClipEventHandlers {
    onClipCreated(event: ClipCreatedEvent): Promise<void>;
    onClipRecorded(event: ClipRecordedEvent): Promise<void>;
    onClipEdited(event: ClipEditedEvent): Promise<void>;
    onClipDeleted(event: ClipDeletedEvent): Promise<void>;
}
```

## 服務接口（Service Interfaces）

### 音頻服務

```typescript
interface IAudioService {
    initialize(settings: AudioSettings): Promise<void>;
    startRecording(trackId: string): Promise<void>;
    stopRecording(): Promise<AudioData>;
    playTrack(trackId: string): Promise<void>;
    stopTrack(trackId: string): Promise<void>;
    setVolume(trackId: string, volume: number): Promise<void>;
    applyEffect(trackId: string, effect: AudioEffect): Promise<void>;
}
```

### 存儲服務

```typescript
interface IStorageService {
    saveProject(projectId: string, data: ProjectData): Promise<void>;
    loadProject(projectId: string): Promise<ProjectData>;
    saveTrackData(trackId: string, data: TrackData): Promise<void>;
    loadTrackData(trackId: string): Promise<TrackData>;
    cleanup(olderThan: Date): Promise<void>;
}
```

### WebSocket 服務

```typescript
interface IWebSocketService {
    connect(roomId: string): Promise<void>;
    disconnect(): Promise<void>;
    sendMessage(type: string, data: any): Promise<void>;
    onMessage(handler: (type: string, data: any) => void): void;
    onDisconnect(handler: () => void): void;
}
```

## 數據傳輸對象（DTOs）

### 房間 DTO

```typescript
interface RoomDTO {
    id: string;
    name: string;
    status: RoomStatus;
    participants: UserDTO[];
    tracks: TrackDTO[];
    currentRound: number;
    maxRounds: number;
    createdAt: string;
    updatedAt: string;
}
```

### 音軌 DTO

```typescript
interface TrackDTO {
    id: string;
    name: string;
    type: TrackType;
    role: TrackRole;
    clips: ClipDTO[];
    owner: UserDTO;
    settings: TrackSettingsDTO;
    isLocked: boolean;
}
```

### 片段 DTO

```typescript
interface ClipDTO {
    id: string;
    trackId: string;
    type: ClipType;
    startTime: number;
    duration: number;
    metadata: ClipMetadataDTO;
}
```

## 工作流程協調器（Coordinators）

### 房間協調器

```typescript
interface RoomCoordinator {
    initializeRoom(room: Room): Promise<void>;
    handleUserJoin(user: User, role: TrackRole): Promise<void>;
    handleUserLeave(user: User): Promise<void>;
    handleRoundCompletion(): Promise<void>;
    synchronizeState(): Promise<void>;
}
```

### 錄音協調器

```typescript
interface RecordingCoordinator {
    startRecording(track: Track): Promise<void>;
    stopRecording(): Promise<void>;
    handleRecordingError(error: Error): Promise<void>;
    saveRecordingData(data: AudioData): Promise<void>;
}
```

### 播放協調器

```typescript
interface PlaybackCoordinator {
    startPlayback(tracks: Track[]): Promise<void>;
    stopPlayback(): Promise<void>;
    seekTo(position: Position): Promise<void>;
    synchronizePlayback(): Promise<void>;
}
``` 