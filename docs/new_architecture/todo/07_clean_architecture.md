# Clean Architecture實現計劃

## 當前問題

1. 代碼結構混亂，職責不清
2. 依賴關係複雜，難以測試
3. 業務邏輯與技術實現耦合

## 目標

1. 實現清晰的層次結構
2. 降低模組間的耦合
3. 提高代碼可測試性

## 具體任務

### 1. 領域層重構

- [ ] 建立領域模型

  ```
  src/modules/track/domain/
  ├── entities/
  │   ├── Track.ts
  │   ├── Clip.ts
  │   └── Note.ts
  ├── value-objects/
  │   ├── Position.ts
  │   ├── Duration.ts
  │   └── Volume.ts
  ├── aggregates/
  │   └── TrackAggregate.ts
  └── repositories/
      └── ITrackRepository.ts
  ```

- [ ] 實現領域服務

  ```typescript
  interface ITrackService {
    createTrack(name: string, projectId: string): Promise<Track>;
    updateTrack(trackId: string, changes: Partial<Track>): Promise<Track>;
    deleteTrack(trackId: string): Promise<void>;
  }
  ```

### 2. 應用層重構

- [ ] 實現用例

  ```
  src/modules/track/application/
  ├── use-cases/
  │   ├── CreateTrackUseCase.ts
  │   ├── UpdateTrackUseCase.ts
  │   └── DeleteTrackUseCase.ts
  ├── dtos/
  │   ├── CreateTrackDto.ts
  │   └── UpdateTrackDto.ts
  └── mappers/
      └── TrackMapper.ts
  ```

- [ ] 實現應用服務

  ```typescript
  class TrackApplicationService {
    constructor(
      private readonly trackService: ITrackService,
      private readonly trackRepository: ITrackRepository
    ) {}

    async createTrack(dto: CreateTrackDto): Promise<TrackDto> {
      // 實現業務邏輯
    }
  }
  ```

### 3. 介面層重構

- [ ] 實現控制器

  ```
  src/modules/track/infrastructure/controllers/
  ├── TrackController.ts
  ├── ClipController.ts
  └── NoteController.ts
  ```

- [ ] 實現DTO

  ```typescript
  class TrackDto {
    id: string;
    name: string;
    projectId: string;
    clips: ClipDto[];
    // ...
  }
  ```

### 4. 基礎設施層重構

- [ ] 實現倉儲

  ```
  src/modules/track/infrastructure/persistence/
  ├── MongoTrackRepository.ts
  ├── MongoClipRepository.ts
  └── MongoNoteRepository.ts
  ```

- [ ] 實現外部服務

  ```
  src/modules/track/infrastructure/services/
  ├── AudioService.ts
  └── FileStorageService.ts
  ```

## 時間安排

1. 第1-2週：領域層重構
2. 第3-4週：應用層重構
3. 第5-6週：介面層重構
4. 第7-8週：基礎設施層重構

## 注意事項

1. 嚴格遵守依賴規則
2. 使用依賴注入
3. 實現適當的錯誤處理
4. 提供完整的單元測試
5. 保持代碼的可讀性和可維護性
