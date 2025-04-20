import { injectable, inject } from 'inversify';
import { ClipTypes } from '../../di/ClipTypes';
import { ClipId } from '../../domain/value-objects/ClipId';
import { BaseClip } from '../../domain/entities/BaseClip';
import { AudioClip } from '../../domain/entities/AudioClip';
import type { ILocalClipRepository } from '../../domain/repositories/IClipRepository';
import type { P2PSyncManager } from '../p2p/P2PSyncManager';
import type { ApiClient } from '../api/ApiClient';

export interface ClipViewModel {
  id: string;
  type: 'audio' | 'midi';
  startTime: number;
  duration: number;
  gain: number;
  version: number;
}

@injectable()
export class ClipStore {
  private clips: Map<string, ClipViewModel>;
  private p2pSync: P2PSyncManager;

  constructor(
    @inject(ClipTypes.P2PSyncManager) p2pSync: P2PSyncManager,
    @inject(ClipTypes.LocalClipRepository) private localRepo: ILocalClipRepository,
    @inject(ClipTypes.ApiClient) private apiClient: ApiClient
  ) {
    this.clips = new Map();
    this.p2pSync = p2pSync;
    this.initializeP2PHandlers();
  }

  private initializeP2PHandlers(): void {
    this.p2pSync.onMessage('CLIP_PARAMS_UPDATE', async (data) => {
      const { clipId, params } = data;
      await this.handlePeerUpdate(clipId, params);
    });
  }

  async getClip(id: string): Promise<ClipViewModel | undefined> {
    let clip = this.clips.get(id);
    if (!clip) {
      const clipEntity = await this.localRepo.findById(ClipId.fromString(id));
      if (clipEntity) {
        clip = this.createViewModel(clipEntity);
        this.clips.set(id, clip);
      }
    }
    return clip;
  }

  private createViewModel(clip: BaseClip): ClipViewModel {
    return {
      id: clip.getId(),
      type: clip instanceof AudioClip ? 'audio' : 'midi',
      startTime: clip.getStartTime(),
      duration: clip.getDuration(),
      gain: clip.getGain(),
      version: clip.getVersion()
    };
  }

  async updateClipParams(id: string, params: Partial<ClipViewModel>): Promise<void> {
    const clip = await this.getClip(id);
    if (!clip) throw new Error(`Clip not found: ${id}`);

    Object.assign(clip, params);
    
    // 廣播到其他peer
    this.p2pSync.broadcast({
      type: 'CLIP_PARAMS_UPDATE',
      clipId: id,
      params
    });

    // 更新本地存儲
    const clipEntity = await this.localRepo.findById(ClipId.fromString(id));
    if (clipEntity) {
      if (params.gain !== undefined) clipEntity.setGain(params.gain);
      await this.localRepo.save(clipEntity);
    }
  }

  private async handlePeerUpdate(clipId: string, params: Partial<ClipViewModel>): Promise<void> {
    const clip = await this.getClip(clipId);
    if (!clip) return;

    Object.assign(clip, params);
    
    // 更新本地存儲
    const clipEntity = await this.localRepo.findById(ClipId.fromString(clipId));
    if (clipEntity) {
      if (params.gain !== undefined) clipEntity.setGain(params.gain);
      await this.localRepo.save(clipEntity);
    }
  }
} 