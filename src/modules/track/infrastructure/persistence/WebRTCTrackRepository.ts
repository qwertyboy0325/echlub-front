import { injectable, inject } from 'inversify';
import { IWebRTCTrackRepository } from '../../domain/repositories/ITrackRepository';
import { BaseTrack } from '../../domain/entities/BaseTrack';
import { TrackId } from '../../domain/value-objects/TrackId';
import { TYPES } from '../../../../core/di/types';
import { IWebRTCClient } from '../../../../core/webrtc/IWebRTCClient';

@injectable()
export class WebRTCTrackRepository implements IWebRTCTrackRepository {
  constructor(
    @inject(TYPES.WebRTCClient) private rtcClient: IWebRTCClient
  ) {}

  async create(track: BaseTrack): Promise<void> {
    await this.rtcClient.sendData('track:create', {
      id: track.getTrackId().toString(),
      name: track.getName(),
      type: track.getType()
    });
  }

  async findById(id: TrackId): Promise<BaseTrack | undefined> {
    const response = await this.rtcClient.requestData('track:findById', {
      id: id.toString()
    });
    return this.deserializeTrack(response);
  }

  async save(track: BaseTrack): Promise<void> {
    await this.rtcClient.sendData('track:update', {
      id: track.getTrackId().toString(),
      name: track.getName(),
      type: track.getType()
    });
  }

  async delete(id: TrackId): Promise<void> {
    await this.rtcClient.sendData('track:delete', {
      id: id.toString()
    });
  }

  async establishConnection(): Promise<void> {
    await this.rtcClient.establish();
  }

  async closeConnection(): Promise<void> {
    await this.rtcClient.close();
  }

  private deserializeTrack(data: any): BaseTrack | undefined {
    // 需要實現反序列化邏輯
    // 這裡需要根據實際的 Track 類型來實現
    return undefined;
  }
} 