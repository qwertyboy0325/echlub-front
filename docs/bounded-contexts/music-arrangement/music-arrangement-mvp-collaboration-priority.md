# Music Arrangement BC - MVP Collaboration Priority Implementation

## 🚀 MVP 目標

**核心目標**: 快速上線具備即時協作功能的音樂編排系統
**時程**: 3-4 週完成 MVP
**重點**: Collaboration 功能優先，其他功能簡化實現

## 🎯 MVP 功能範圍

### **✅ 必須實現 (Week 1-3)**
1. **即時協作系統** - 核心功能
2. **基礎軌道管理** - 創建、刪除、基本操作
3. **簡化混音器** - 音量、靜音控制
4. **即時同步** - 多用戶操作同步

### **🔄 簡化實現 (Week 4)**
1. **基礎播放控制** - 播放/停止/暫停
2. **簡單效果** - 基礎音量效果
3. **狀態持久化** - 基本保存功能

### **❌ MVP 暫不實現**
- 複雜音頻效果鏈
- 進階 MIDI 編輯
- Undo/Redo 系統
- 完整 Tone.js 整合

## 🤝 Collaboration 系統架構

### **1. Domain Layer - 協作核心**

#### **1.1 協作相關 Value Objects**
```typescript
// 🎯 MVP 必須實現
export class PeerId extends ValueObject<string> {
  constructor(value: string) {
    super(value);
    this.validate();
  }
  
  private validate(): void {
    if (!this.value || this.value.length < 3) {
      throw new Error('PeerId must be at least 3 characters');
    }
  }
}

export class CollaborationPermission extends ValueObject<string[]> {
  public static readonly READ = 'read';
  public static readonly WRITE = 'write';
  public static readonly ADMIN = 'admin';
  
  constructor(permissions: string[]) {
    super(permissions);
    this.validatePermissions();
  }
  
  private validatePermissions(): void {
    const validPermissions = [
      CollaborationPermission.READ,
      CollaborationPermission.WRITE,
      CollaborationPermission.ADMIN
    ];
    
    for (const permission of this.value) {
      if (!validPermissions.includes(permission)) {
        throw new Error(`Invalid permission: ${permission}`);
      }
    }
  }
  
  public hasPermission(permission: string): boolean {
    return this.value.includes(permission) || this.value.includes(CollaborationPermission.ADMIN);
  }
}

export class CollaborationSession extends ValueObject<CollaborationSessionProps> {
  constructor(props: CollaborationSessionProps) {
    super(props);
  }
  
  public isActive(): boolean {
    return this.value.isActive;
  }
  
  public hasCollaborator(peerId: PeerId): boolean {
    return this.value.collaborators.some(c => c.peerId.equals(peerId));
  }
}

interface CollaborationSessionProps {
  sessionId: string;
  trackId: TrackId;
  ownerId: PeerId;
  collaborators: CollaboratorInfo[];
  isActive: boolean;
  createdAt: Date;
}

interface CollaboratorInfo {
  peerId: PeerId;
  permissions: CollaborationPermission;
  joinedAt: Date;
  lastSeen: Date;
  isOnline: boolean;
}
```

#### **1.2 Track Aggregate 協作擴展**
```typescript
// 🎯 擴展現有 Track Aggregate
export class Track extends EventSourcedAggregateRoot<TrackId> {
  // ... 現有屬性 ...
  
  // 🆕 協作相關屬性
  private _collaborationSession?: CollaborationSession;
  private _isShared: boolean = false;
  
  // 🆕 協作方法
  public shareWithCollaborator(
    peerId: PeerId, 
    permissions: CollaborationPermission,
    sharedBy: PeerId
  ): void {
    // 驗證分享權限
    if (!this.canShare(sharedBy)) {
      throw new DomainError('Insufficient permissions to share track');
    }
    
    // 創建或更新協作會話
    if (!this._collaborationSession) {
      this._collaborationSession = this.createCollaborationSession(sharedBy);
    }
    
    // 添加協作者
    const event = new TrackSharedWithCollaboratorEvent(
      this._id,
      peerId,
      permissions,
      sharedBy,
      new Date()
    );
    
    this.addDomainEvent(event);
    this._isShared = true;
  }
  
  public removeCollaborator(peerId: PeerId, removedBy: PeerId): void {
    if (!this.canManageCollaborators(removedBy)) {
      throw new DomainError('Insufficient permissions to remove collaborator');
    }
    
    const event = new CollaboratorRemovedFromTrackEvent(
      this._id,
      peerId,
      removedBy,
      new Date()
    );
    
    this.addDomainEvent(event);
  }
  
  public updateCollaboratorPermissions(
    peerId: PeerId,
    newPermissions: CollaborationPermission,
    updatedBy: PeerId
  ): void {
    if (!this.canManageCollaborators(updatedBy)) {
      throw new DomainError('Insufficient permissions to update collaborator permissions');
    }
    
    const event = new CollaboratorPermissionsUpdatedEvent(
      this._id,
      peerId,
      newPermissions,
      updatedBy,
      new Date()
    );
    
    this.addDomainEvent(event);
  }
  
  // 🆕 協作操作記錄
  public recordCollaborativeOperation(
    operation: CollaborativeOperation,
    performedBy: PeerId
  ): void {
    if (!this.canPerformOperation(performedBy, operation.type)) {
      throw new DomainError(`Insufficient permissions for operation: ${operation.type}`);
    }
    
    const event = new CollaborativeOperationPerformedEvent(
      this._id,
      operation,
      performedBy,
      new Date()
    );
    
    this.addDomainEvent(event);
  }
  
  // 私有輔助方法
  private canShare(peerId: PeerId): boolean {
    return this._metadata.ownerId.equals(peerId);
  }
  
  private canManageCollaborators(peerId: PeerId): boolean {
    if (this._metadata.ownerId.equals(peerId)) return true;
    
    if (this._collaborationSession) {
      const collaborator = this._collaborationSession.value.collaborators
        .find(c => c.peerId.equals(peerId));
      return collaborator?.permissions.hasPermission(CollaborationPermission.ADMIN) || false;
    }
    
    return false;
  }
  
  private canPerformOperation(peerId: PeerId, operationType: string): boolean {
    if (this._metadata.ownerId.equals(peerId)) return true;
    
    if (this._collaborationSession) {
      const collaborator = this._collaborationSession.value.collaborators
        .find(c => c.peerId.equals(peerId));
      
      if (!collaborator) return false;
      
      // 讀取操作
      if (['getTrackInfo', 'getClips'].includes(operationType)) {
        return collaborator.permissions.hasPermission(CollaborationPermission.READ);
      }
      
      // 寫入操作
      return collaborator.permissions.hasPermission(CollaborationPermission.WRITE);
    }
    
    return false;
  }
  
  private createCollaborationSession(ownerId: PeerId): CollaborationSession {
    return new CollaborationSession({
      sessionId: `session_${this._id.value}_${Date.now()}`,
      trackId: this._id,
      ownerId,
      collaborators: [],
      isActive: true,
      createdAt: new Date()
    });
  }
}

// 🆕 協作操作類型
export interface CollaborativeOperation {
  id: string;
  type: string;
  data: any;
  timestamp: Date;
}
```

#### **1.3 協作相關 Domain Events**
```typescript
// 🎯 MVP 必須實現的協作事件
export class TrackSharedWithCollaboratorEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly collaboratorId: PeerId,
    public readonly permissions: CollaborationPermission,
    public readonly sharedBy: PeerId,
    public readonly sharedAt: Date
  ) {
    super();
  }
}

export class CollaboratorRemovedFromTrackEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly collaboratorId: PeerId,
    public readonly removedBy: PeerId,
    public readonly removedAt: Date
  ) {
    super();
  }
}

export class CollaboratorPermissionsUpdatedEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly collaboratorId: PeerId,
    public readonly newPermissions: CollaborationPermission,
    public readonly updatedBy: PeerId,
    public readonly updatedAt: Date
  ) {
    super();
  }
}

export class CollaborativeOperationPerformedEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly operation: CollaborativeOperation,
    public readonly performedBy: PeerId,
    public readonly performedAt: Date
  ) {
    super();
  }
}

export class CollaboratorJoinedSessionEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly collaboratorId: PeerId,
    public readonly joinedAt: Date
  ) {
    super();
  }
}

export class CollaboratorLeftSessionEvent extends DomainEvent {
  constructor(
    public readonly trackId: TrackId,
    public readonly collaboratorId: PeerId,
    public readonly leftAt: Date
  ) {
    super();
  }
}
```

### **2. Application Layer - 協作 Commands & Queries**

#### **2.1 協作 Commands**
```typescript
// 🎯 MVP 協作命令
export class ShareTrackCommand implements ICommand<void> {
  public readonly type = 'ShareTrack';
  constructor(
    public readonly trackId: string,
    public readonly collaboratorId: string,
    public readonly permissions: string[],
    public readonly sharedBy: string
  ) {}
}

export class RemoveCollaboratorCommand implements ICommand<void> {
  public readonly type = 'RemoveCollaborator';
  constructor(
    public readonly trackId: string,
    public readonly collaboratorId: string,
    public readonly removedBy: string
  ) {}
}

export class UpdateCollaboratorPermissionsCommand implements ICommand<void> {
  public readonly type = 'UpdateCollaboratorPermissions';
  constructor(
    public readonly trackId: string,
    public readonly collaboratorId: string,
    public readonly newPermissions: string[],
    public readonly updatedBy: string
  ) {}
}

export class JoinCollaborationSessionCommand implements ICommand<void> {
  public readonly type = 'JoinCollaborationSession';
  constructor(
    public readonly trackId: string,
    public readonly collaboratorId: string
  ) {}
}

export class LeaveCollaborationSessionCommand implements ICommand<void> {
  public readonly type = 'LeaveCollaborationSession';
  constructor(
    public readonly trackId: string,
    public readonly collaboratorId: string
  ) {}
}

export class RecordCollaborativeOperationCommand implements ICommand<void> {
  public readonly type = 'RecordCollaborativeOperation';
  constructor(
    public readonly trackId: string,
    public readonly operation: {
      id: string;
      type: string;
      data: any;
    },
    public readonly performedBy: string
  ) {}
}
```

#### **2.2 協作 Command Handlers**
```typescript
// 🎯 MVP 協作命令處理器
export class ShareTrackCommandHandler implements ICommandHandler<ShareTrackCommand, void> {
  constructor(
    private trackRepository: ITrackRepository,
    private eventStore: IEventStore
  ) {}
  
  async handle(command: ShareTrackCommand): Promise<void> {
    const trackId = new TrackId(command.trackId);
    const track = await this.trackRepository.findById(trackId);
    
    if (!track) {
      throw new DomainError(`Track not found: ${command.trackId}`);
    }
    
    const collaboratorId = new PeerId(command.collaboratorId);
    const permissions = new CollaborationPermission(command.permissions);
    const sharedBy = new PeerId(command.sharedBy);
    
    track.shareWithCollaborator(collaboratorId, permissions, sharedBy);
    
    await this.trackRepository.save(track);
    await this.eventStore.saveEvents(track.id, track.getUncommittedEvents());
    track.markEventsAsCommitted();
  }
}

export class JoinCollaborationSessionCommandHandler implements ICommandHandler<JoinCollaborationSessionCommand, void> {
  constructor(
    private trackRepository: ITrackRepository,
    private eventStore: IEventStore,
    private collaborationNotificationService: ICollaborationNotificationService
  ) {}
  
  async handle(command: JoinCollaborationSessionCommand): Promise<void> {
    const trackId = new TrackId(command.trackId);
    const collaboratorId = new PeerId(command.collaboratorId);
    
    // 記錄加入事件
    const event = new CollaboratorJoinedSessionEvent(
      trackId,
      collaboratorId,
      new Date()
    );
    
    await this.eventStore.saveEvents(trackId, [event]);
    
    // 通知其他協作者
    await this.collaborationNotificationService.notifyCollaboratorJoined(
      command.trackId,
      command.collaboratorId
    );
  }
}

export class RecordCollaborativeOperationCommandHandler implements ICommandHandler<RecordCollaborativeOperationCommand, void> {
  constructor(
    private trackRepository: ITrackRepository,
    private eventStore: IEventStore,
    private collaborationNotificationService: ICollaborationNotificationService
  ) {}
  
  async handle(command: RecordCollaborativeOperationCommand): Promise<void> {
    const trackId = new TrackId(command.trackId);
    const track = await this.trackRepository.findById(trackId);
    
    if (!track) {
      throw new DomainError(`Track not found: ${command.trackId}`);
    }
    
    const operation: CollaborativeOperation = {
      id: command.operation.id,
      type: command.operation.type,
      data: command.operation.data,
      timestamp: new Date()
    };
    
    const performedBy = new PeerId(command.performedBy);
    
    track.recordCollaborativeOperation(operation, performedBy);
    
    await this.trackRepository.save(track);
    await this.eventStore.saveEvents(track.id, track.getUncommittedEvents());
    track.markEventsAsCommitted();
    
    // 即時通知其他協作者
    await this.collaborationNotificationService.broadcastOperation(
      command.trackId,
      operation,
      command.performedBy
    );
  }
}
```

#### **2.3 協作 Queries**
```typescript
// 🎯 MVP 協作查詢
export class GetTrackCollaboratorsQuery implements IQuery<CollaboratorDTO[]> {
  public readonly type = 'GetTrackCollaborators';
  constructor(public readonly trackId: string) {}
}

export class GetCollaborationSessionQuery implements IQuery<CollaborationSessionDTO | null> {
  public readonly type = 'GetCollaborationSession';
  constructor(public readonly trackId: string) {}
}

export class GetCollaborativeOperationsQuery implements IQuery<CollaborativeOperationDTO[]> {
  public readonly type = 'GetCollaborativeOperations';
  constructor(
    public readonly trackId: string,
    public readonly since?: Date,
    public readonly limit?: number
  ) {}
}

export class GetUserCollaborationsQuery implements IQuery<UserCollaborationDTO[]> {
  public readonly type = 'GetUserCollaborations';
  constructor(public readonly userId: string) {}
}
```

#### **2.4 協作 DTOs**
```typescript
// 🎯 MVP 協作 DTOs
export interface CollaboratorDTO {
  peerId: string;
  name: string;
  permissions: string[];
  isOnline: boolean;
  joinedAt: string;
  lastSeen: string;
}

export interface CollaborationSessionDTO {
  sessionId: string;
  trackId: string;
  ownerId: string;
  collaborators: CollaboratorDTO[];
  isActive: boolean;
  createdAt: string;
}

export interface CollaborativeOperationDTO {
  id: string;
  type: string;
  data: any;
  performedBy: string;
  performedAt: string;
  trackId: string;
}

export interface UserCollaborationDTO {
  trackId: string;
  trackName: string;
  role: 'owner' | 'collaborator';
  permissions: string[];
  lastActivity: string;
  isActive: boolean;
}

export interface CollaborationInviteDTO {
  id: string;
  trackId: string;
  trackName: string;
  invitedBy: string;
  invitedByName: string;
  permissions: string[];
  invitedAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}
```

### **3. Infrastructure Layer - 即時通訊**

#### **3.1 協作通知服務**
```typescript
// 🎯 MVP 即時通訊服務
export interface ICollaborationNotificationService {
  notifyCollaboratorJoined(trackId: string, collaboratorId: string): Promise<void>;
  notifyCollaboratorLeft(trackId: string, collaboratorId: string): Promise<void>;
  broadcastOperation(trackId: string, operation: CollaborativeOperation, performedBy: string): Promise<void>;
  notifyPermissionsChanged(trackId: string, collaboratorId: string, newPermissions: string[]): Promise<void>;
}

export class WebSocketCollaborationNotificationService implements ICollaborationNotificationService {
  constructor(
    private webSocketServer: WebSocketServer,
    private collaborationRepository: ICollaborationRepository
  ) {}
  
  async notifyCollaboratorJoined(trackId: string, collaboratorId: string): Promise<void> {
    const collaborators = await this.collaborationRepository.getTrackCollaborators(trackId);
    
    const notification = {
      type: 'collaborator_joined',
      trackId,
      collaboratorId,
      timestamp: new Date().toISOString()
    };
    
    // 通知所有其他協作者
    for (const collaborator of collaborators) {
      if (collaborator.peerId !== collaboratorId) {
        await this.webSocketServer.sendToUser(collaborator.peerId, notification);
      }
    }
  }
  
  async broadcastOperation(
    trackId: string, 
    operation: CollaborativeOperation, 
    performedBy: string
  ): Promise<void> {
    const collaborators = await this.collaborationRepository.getTrackCollaborators(trackId);
    
    const notification = {
      type: 'collaborative_operation',
      trackId,
      operation,
      performedBy,
      timestamp: new Date().toISOString()
    };
    
    // 廣播給所有其他協作者
    for (const collaborator of collaborators) {
      if (collaborator.peerId !== performedBy) {
        await this.webSocketServer.sendToUser(collaborator.peerId, notification);
      }
    }
  }
  
  async notifyPermissionsChanged(
    trackId: string, 
    collaboratorId: string, 
    newPermissions: string[]
  ): Promise<void> {
    const notification = {
      type: 'permissions_changed',
      trackId,
      newPermissions,
      timestamp: new Date().toISOString()
    };
    
    await this.webSocketServer.sendToUser(collaboratorId, notification);
  }
  
  async notifyCollaboratorLeft(trackId: string, collaboratorId: string): Promise<void> {
    const collaborators = await this.collaborationRepository.getTrackCollaborators(trackId);
    
    const notification = {
      type: 'collaborator_left',
      trackId,
      collaboratorId,
      timestamp: new Date().toISOString()
    };
    
    for (const collaborator of collaborators) {
      if (collaborator.peerId !== collaboratorId) {
        await this.webSocketServer.sendToUser(collaborator.peerId, notification);
      }
    }
  }
}
```

#### **3.2 協作資料庫**
```typescript
// 🎯 MVP 協作資料存取
export interface ICollaborationRepository {
  getTrackCollaborators(trackId: string): Promise<CollaboratorInfo[]>;
  saveCollaborationSession(session: CollaborationSessionDTO): Promise<void>;
  getCollaborationSession(trackId: string): Promise<CollaborationSessionDTO | null>;
  saveCollaborativeOperation(operation: CollaborativeOperationDTO): Promise<void>;
  getCollaborativeOperations(trackId: string, since?: Date, limit?: number): Promise<CollaborativeOperationDTO[]>;
  getUserCollaborations(userId: string): Promise<UserCollaborationDTO[]>;
}

export class InMemoryCollaborationRepository implements ICollaborationRepository {
  private collaborationSessions = new Map<string, CollaborationSessionDTO>();
  private operations = new Map<string, CollaborativeOperationDTO[]>();
  
  async getTrackCollaborators(trackId: string): Promise<CollaboratorInfo[]> {
    const session = this.collaborationSessions.get(trackId);
    return session?.collaborators.map(c => ({
      peerId: new PeerId(c.peerId),
      permissions: new CollaborationPermission(c.permissions),
      joinedAt: new Date(c.joinedAt),
      lastSeen: new Date(c.lastSeen),
      isOnline: c.isOnline
    })) || [];
  }
  
  async saveCollaborationSession(session: CollaborationSessionDTO): Promise<void> {
    this.collaborationSessions.set(session.trackId, session);
  }
  
  async getCollaborationSession(trackId: string): Promise<CollaborationSessionDTO | null> {
    return this.collaborationSessions.get(trackId) || null;
  }
  
  async saveCollaborativeOperation(operation: CollaborativeOperationDTO): Promise<void> {
    const trackOperations = this.operations.get(operation.trackId) || [];
    trackOperations.push(operation);
    this.operations.set(operation.trackId, trackOperations);
  }
  
  async getCollaborativeOperations(
    trackId: string, 
    since?: Date, 
    limit?: number
  ): Promise<CollaborativeOperationDTO[]> {
    let operations = this.operations.get(trackId) || [];
    
    if (since) {
      operations = operations.filter(op => new Date(op.performedAt) > since);
    }
    
    if (limit) {
      operations = operations.slice(-limit);
    }
    
    return operations;
  }
  
  async getUserCollaborations(userId: string): Promise<UserCollaborationDTO[]> {
    const userCollaborations: UserCollaborationDTO[] = [];
    
    for (const [trackId, session] of this.collaborationSessions) {
      // 檢查是否為擁有者
      if (session.ownerId === userId) {
        userCollaborations.push({
          trackId,
          trackName: `Track ${trackId}`, // 簡化實現
          role: 'owner',
          permissions: ['read', 'write', 'admin'],
          lastActivity: new Date().toISOString(),
          isActive: session.isActive
        });
      } else {
        // 檢查是否為協作者
        const collaborator = session.collaborators.find(c => c.peerId === userId);
        if (collaborator) {
          userCollaborations.push({
            trackId,
            trackName: `Track ${trackId}`,
            role: 'collaborator',
            permissions: collaborator.permissions,
            lastActivity: collaborator.lastSeen,
            isActive: session.isActive
          });
        }
      }
    }
    
    return userCollaborations;
  }
}
```

### **4. MusicArrangementService 協作擴展**

```typescript
// 🎯 擴展現有 MusicArrangementService
export class MusicArrangementService {
  // ... 現有方法 ...
  
  // 🆕 協作方法
  async shareTrack(
    trackId: string, 
    collaboratorId: string, 
    permissions: string[],
    sharedBy: string
  ): Promise<void> {
    const command = new ShareTrackCommand(trackId, collaboratorId, permissions, sharedBy);
    await this.mediator.send(command);
  }
  
  async removeCollaborator(trackId: string, collaboratorId: string, removedBy: string): Promise<void> {
    const command = new RemoveCollaboratorCommand(trackId, collaboratorId, removedBy);
    await this.mediator.send(command);
  }
  
  async updateCollaboratorPermissions(
    trackId: string, 
    collaboratorId: string, 
    newPermissions: string[],
    updatedBy: string
  ): Promise<void> {
    const command = new UpdateCollaboratorPermissionsCommand(trackId, collaboratorId, newPermissions, updatedBy);
    await this.mediator.send(command);
  }
  
  async joinCollaborationSession(trackId: string, collaboratorId: string): Promise<void> {
    const command = new JoinCollaborationSessionCommand(trackId, collaboratorId);
    await this.mediator.send(command);
  }
  
  async leaveCollaborationSession(trackId: string, collaboratorId: string): Promise<void> {
    const command = new LeaveCollaborationSessionCommand(trackId, collaboratorId);
    await this.mediator.send(command);
  }
  
  async recordCollaborativeOperation(
    trackId: string,
    operation: { id: string; type: string; data: any },
    performedBy: string
  ): Promise<void> {
    const command = new RecordCollaborativeOperationCommand(trackId, operation, performedBy);
    await this.mediator.send(command);
  }
  
  async getTrackCollaborators(trackId: string): Promise<CollaboratorDTO[]> {
    const query = new GetTrackCollaboratorsQuery(trackId);
    return await this.mediator.query(query);
  }
  
  async getCollaborationSession(trackId: string): Promise<CollaborationSessionDTO | null> {
    const query = new GetCollaborationSessionQuery(trackId);
    return await this.mediator.query(query);
  }
  
  async getCollaborativeOperations(
    trackId: string, 
    since?: Date, 
    limit?: number
  ): Promise<CollaborativeOperationDTO[]> {
    const query = new GetCollaborativeOperationsQuery(trackId, since, limit);
    return await this.mediator.query(query);
  }
  
  async getUserCollaborations(userId: string): Promise<UserCollaborationDTO[]> {
    const query = new GetUserCollaborationsQuery(userId);
    return await this.mediator.query(query);
  }
}
```

## 📅 MVP 實現時程

### **Week 1: 協作核心架構**
- **Day 1-2**: Domain Layer 協作 Value Objects 和 Events
- **Day 3-4**: Track Aggregate 協作擴展
- **Day 5**: Application Layer Commands 和 DTOs

### **Week 2: 協作 Commands 和即時通訊**
- **Day 1-2**: Command Handlers 實現
- **Day 3-4**: WebSocket 即時通訊服務
- **Day 5**: 協作資料庫實現

### **Week 3: Service 整合和測試**
- **Day 1-2**: MusicArrangementService 協作方法
- **Day 3-4**: DI Container 更新和整合測試
- **Day 5**: 基本 UI 協作功能

### **Week 4: 簡化功能和優化**
- **Day 1-2**: 基礎播放控制
- **Day 3-4**: 簡單混音器功能
- **Day 5**: 效能優化和部署準備

## 🚀 快速啟動指南

### **1. 立即開始實現**
```bash
# 1. 創建協作相關檔案結構
mkdir -p src/domain/collaboration
mkdir -p src/application/collaboration
mkdir -p src/infrastructure/collaboration

# 2. 實現 Domain Layer 協作概念
# 3. 實現 Application Layer Commands
# 4. 實現 Infrastructure Layer 即時通訊
# 5. 整合到現有 Service
```

### **2. 測試策略**
- **單元測試**: Domain Layer 協作邏輯
- **整合測試**: Command Handlers 和 Repository
- **端到端測試**: WebSocket 即時同步

### **3. 部署考量**
- **WebSocket 伺服器**: 支援即時通訊
- **資料庫**: 協作會話和操作記錄
- **快取**: 線上用戶狀態

## 🎯 MVP 成功指標

### **核心功能驗證**
- ✅ 多用戶可同時編輯同一軌道
- ✅ 操作即時同步到所有協作者
- ✅ 權限控制正常運作
- ✅ 協作者上線/離線狀態正確顯示

### **效能指標**
- 操作同步延遲 < 100ms
- 支援同時 10+ 協作者
- WebSocket 連線穩定性 > 99%

## 🔄 後續擴展計劃

### **Phase 2 (MVP 後)**
- 衝突解決機制
- 操作歷史回放
- 協作分析和統計

### **Phase 3 (長期)**
- 語音聊天整合
- 螢幕共享
- 協作模板和工作流程

---

**文檔版本**: 1.0  
**目標完成**: 3-4 週  
**下一步**: 立即開始 Domain Layer 協作實現 

## 🎵 MVP 音頻實現 - 真正的聲音！

### **❗ 重要發現：目前無法發出聲音**
目前的 ToneJsAudioEngine 只是架構設計，`declare const Tone: any;` 只是型別宣告，沒有實際的 Tone.js 庫。

### **🚀 MVP 音頻解決方案**

#### **方案 A: 簡化 Web Audio API (推薦 MVP)**
```typescript
// 🎯 MVP 簡化音頻引擎 - 真正能發聲音！
export class SimpleMVPAudioEngine {
  private audioContext: AudioContext;
  private masterGain: GainNode;
  private tracks: Map<string, AudioTrack> = new Map();
  private isPlaying: boolean = false;
  
  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.masterGain.gain.value = 0.8;
  }
  
  // 🎵 立即播放音頻檔案
  async playAudioFile(url: string, trackId: string = 'default'): Promise<void> {
    try {
      // 載入音頻檔案
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // 創建音源
      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = audioBuffer;
      source.connect(gainNode);
      gainNode.connect(this.masterGain);
      
      // 播放
      source.start();
      
      console.log(`🎵 Playing audio: ${url}`);
      
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  }
  
  // 🎹 播放 MIDI 音符 (簡化合成器)
  playNote(frequency: number, duration: number = 1, trackId: string = 'synth'): void {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);
    
    // 設定音符
    oscillator.frequency.value = frequency;
    oscillator.type = 'sawtooth'; // 合成器音色
    
    // 設定音量包絡
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration); // Decay
    
    // 播放
    oscillator.start(now);
    oscillator.stop(now + duration);
    
    console.log(`🎹 Playing note: ${frequency}Hz for ${duration}s`);
  }
  
  // 🎛️ 音量控制
  setMasterVolume(volume: number): void {
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }
  
  // 🎵 播放預設音效
  playTestSound(): void {
    // C4 和弦 (C-E-G)
    this.playNote(261.63, 2); // C4
    setTimeout(() => this.playNote(329.63, 2), 100); // E4
    setTimeout(() => this.playNote(392.00, 2), 200); // G4
  }
}
```

#### **方案 B: 快速 Tone.js 整合**
```bash
# 1. 安裝 Tone.js
npm install tone

# 2. 在 HTML 中引入
<script src="https://unpkg.com/tone@latest/build/Tone.js"></script>
```

```typescript
// 🎯 真正的 Tone.js 實現
import * as Tone from 'tone';

export class RealToneJsAudioEngine {
  private isInitialized: boolean = false;
  private players: Map<string, Tone.Player> = new Map();
  private synths: Map<string, Tone.Synth> = new Map();
  
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // 啟動 Tone.js 音頻上下文
    await Tone.start();
    console.log('🎵 Tone.js Audio Engine Ready!');
    
    this.isInitialized = true;
  }
  
  // 🎵 播放音頻檔案
  async playAudioFile(url: string, trackId: string): Promise<void> {
    if (!this.isInitialized) await this.initialize();
    
    const player = new Tone.Player(url).toDestination();
    await player.load();
    
    this.players.set(trackId, player);
    player.start();
    
    console.log(`🎵 Playing: ${url}`);
  }
  
  // 🎹 播放合成器音符
  playNote(note: string, duration: string, trackId: string = 'synth'): void {
    if (!this.isInitialized) return;
    
    let synth = this.synths.get(trackId);
    if (!synth) {
      synth = new Tone.Synth().toDestination();
      this.synths.set(trackId, synth);
    }
    
    synth.triggerAttackRelease(note, duration);
    console.log(`🎹 Playing note: ${note} for ${duration}`);
  }
  
  // 🎛️ 播放控制
  startTransport(): void {
    Tone.Transport.start();
  }
  
  stopTransport(): void {
    Tone.Transport.stop();
  }
  
  setBpm(bpm: number): void {
    Tone.Transport.bpm.value = bpm;
  }
}
```

### **🎯 MVP 音頻整合到 MusicArrangementService**

```typescript
// 🎯 擴展 MusicArrangementService 添加音頻功能
export class MusicArrangementService {
  private audioEngine: SimpleMVPAudioEngine | RealToneJsAudioEngine;
  
  constructor(
    private mediator: MusicArrangementMediator,
    audioEngine?: SimpleMVPAudioEngine | RealToneJsAudioEngine
  ) {
    // 使用簡化音頻引擎作為 MVP
    this.audioEngine = audioEngine || new SimpleMVPAudioEngine();
  }
  
  // ... 現有方法 ...
  
  // 🎵 MVP 音頻方法
  async playTestSound(): Promise<void> {
    if ('playTestSound' in this.audioEngine) {
      this.audioEngine.playTestSound();
    }
  }
  
  async playAudioFile(url: string, trackId?: string): Promise<void> {
    await this.audioEngine.playAudioFile(url, trackId || 'default');
  }
  
  async playNote(note: string | number, duration: number = 1, trackId?: string): Promise<void> {
    if (typeof note === 'string' && 'playNote' in this.audioEngine) {
      // Tone.js 版本
      (this.audioEngine as RealToneJsAudioEngine).playNote(note, `${duration}`, trackId);
    } else if (typeof note === 'number' && 'playNote' in this.audioEngine) {
      // 簡化版本
      (this.audioEngine as SimpleMVPAudioEngine).playNote(note, duration, trackId);
    }
  }
  
  setMasterVolume(volume: number): void {
    this.audioEngine.setMasterVolume(volume);
  }
  
  // 🎛️ 基礎播放控制
  startPlayback(): void {
    if ('startTransport' in this.audioEngine) {
      this.audioEngine.startTransport();
    }
  }
  
  stopPlayback(): void {
    if ('stopTransport' in this.audioEngine) {
      this.audioEngine.stopTransport();
    }
  }
  
  setBpm(bpm: number): void {
    if ('setBpm' in this.audioEngine) {
      this.audioEngine.setBpm(bpm);
    }
  }
}
```

### **🚀 MVP 立即測試**

```typescript
// 🎯 立即測試音頻功能
const musicService = new MusicArrangementService(mediator);

// 測試 1: 播放測試音效
await musicService.playTestSound();

// 測試 2: 播放音符
await musicService.playNote(440, 2); // A4 音符，2秒

// 測試 3: 播放音頻檔案 (如果有)
await musicService.playAudioFile('/path/to/audio.mp3', 'track1');

// 測試 4: 音量控制
musicService.setMasterVolume(0.5);
```

### **📦 MVP 部署清單**

#### **選項 1: 純 Web Audio API (最快)**
```html
<!-- 無需額外依賴，立即可用 -->
<script>
  // 直接使用 SimpleMVPAudioEngine
  const audioEngine = new SimpleMVPAudioEngine();
  audioEngine.playTestSound(); // 立即聽到聲音！
</script>
```

#### **選項 2: Tone.js (功能完整)**
```bash
# 安裝依賴
npm install tone

# 或 CDN
<script src="https://unpkg.com/tone@latest/build/Tone.js"></script>
```

### **🎵 MVP 音頻功能清單**

#### **✅ 立即可實現 (1-2 天)**
- ✅ 播放測試音效
- ✅ 簡單合成器音符
- ✅ 音量控制
- ✅ 音頻檔案播放

#### **🔄 Week 4 擴展**
- 🔄 多軌道混音
- 🔄 基礎效果 (reverb, delay)
- 🔄 MIDI 音符序列
- 🔄 節拍器和 BPM

### **🎯 推薦實現順序**

1. **今天**: 實現 `SimpleMVPAudioEngine`，立即聽到聲音
2. **明天**: 整合到 `MusicArrangementService`
3. **本週**: 添加協作時的音頻同步
4. **下週**: 升級到完整 Tone.js (如需要)

---

**重點**: 使用 `SimpleMVPAudioEngine` 可以**立即**讓你的 MVP 發出聲音，無需複雜的依賴安裝！ 