import { injectable, inject } from 'inversify';
import { IWebSocketTrackRepository } from '../../domain/repositories/ITrackRepository';
import { BaseTrack } from '../../domain/entities/BaseTrack';
import { TrackId } from '../../domain/value-objects/TrackId';
import { TYPES } from '../../../../core/di/types';
import type { IWebSocketClient } from '../../../../core/websocket/IWebSocketClient';

@injectable()
export class WebSocketTrackRepository implements IWebSocketTrackRepository {
  constructor(
    @inject(TYPES.WebSocketClient) private wsClient: IWebSocketClient
  ) {}

  async create(track: BaseTrack): Promise<void> {
    await this.wsClient.send('track:create', {
      id: track.getTrackId().toString(),
      name: track.getName(),
      type: track.getType()
    });
  }

  async findById(id: TrackId): Promise<BaseTrack | undefined> {
    const response = await this.wsClient.request('track:findById', {
      id: id.toString()
    });
    return this.deserializeTrack(response);
  }

  async save(track: BaseTrack): Promise<void> {
    await this.wsClient.send('track:update', {
      id: track.getTrackId().toString(),
      name: track.getName(),
      type: track.getType()
    });
  }

  async delete(id: TrackId): Promise<void> {
    await this.wsClient.send('track:delete', {
      id: id.toString()
    });
  }

  async connect(): Promise<void> {
    await this.wsClient.connect();
  }

  async disconnect(): Promise<void> {
    await this.wsClient.disconnect();
  }

  private deserializeTrack(_data: any): BaseTrack | undefined {
    // 需要實現反序列化邏輯
    // 這裡需要根據實際的 Track 類型來實現
    return undefined;
  }
} 
