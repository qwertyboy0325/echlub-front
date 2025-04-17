import { injectable, inject } from 'inversify';
import type { ITrackRepository, ILocalTrackRepository, IWebSocketTrackRepository, IWebRTCTrackRepository } from '../../domain/repositories/ITrackRepository';
import { BaseTrack } from '../../domain/entities/BaseTrack';
import { TrackId } from '../../domain/value-objects/TrackId';
import { TrackTypes } from '../../di/TrackTypes';
import { TYPES } from '../../../../core/di/types';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';
import { TrackCreatedEvent } from '../../domain/events/TrackCreatedEvent';
import { TrackUpdatedEvent } from '../../domain/events/TrackUpdatedEvent';
import { TrackDeletedEvent } from '../../domain/events/TrackDeletedEvent';

@injectable()
export class TrackRepositoryCoordinator implements ITrackRepository {
  constructor(
    @inject(TrackTypes.LocalTrackRepository) 
    private localRepo: ILocalTrackRepository,
    @inject(TrackTypes.WebSocketTrackRepository) 
    private wsRepo: IWebSocketTrackRepository,
    @inject(TrackTypes.WebRTCTrackRepository) 
    private rtcRepo: IWebRTCTrackRepository,
    @inject(TYPES.EventBus) 
    private eventBus: IEventBus
  ) {
    // this.setupEventListeners();
  }

  // private setupEventListeners(): void {
  //   this.eventBus.on('websocket:track:updated', this.handleWebSocketUpdate.bind(this));
  //   this.eventBus.on('webrtc:track:updated', this.handleWebRTCUpdate.bind(this));
  // }

  async create(track: BaseTrack): Promise<void> {
    try {
      await this.localRepo.create(track);
      
      // Promise.all([
      //   this.wsRepo.create(track),
      //   this.rtcRepo.create(track)
      // ]).catch(error => {
      //   console.error('Failed to sync track creation:', error);
      // });

      await this.eventBus.publish(new TrackCreatedEvent(track.getTrackId(), track.getName(), track.getType() as 'audio' | 'instrument' | 'bus'));
    } catch (error) {
      throw new Error(`Failed to create track: ${error}`);
    }
  }

  async findById(id: TrackId): Promise<BaseTrack | undefined> {
    return this.localRepo.findById(id);
    
    // if (localTrack) {
    //   return localTrack;
    // }

    // try {
    //   const [wsTrack, rtcTrack] = await Promise.all([
    //     this.wsRepo.findById(id),
    //     this.rtcRepo.findById(id)
    //   ]);

    //   const track = wsTrack || rtcTrack;
    //   if (track) {
    //     await this.localRepo.save(track);
    //   }
    //   return track;
    // } catch (error) {
    //   console.error('Failed to fetch track:', error);
    //   return undefined;
    // }
  }

  async save(track: BaseTrack): Promise<void> {
    try {
      await this.localRepo.save(track);

      // Promise.all([
      //   this.wsRepo.save(track),
      //   this.rtcRepo.save(track)
      // ]).catch(error => {
      //   console.error('Failed to sync track update:', error);
      // });

      await this.eventBus.publish(new TrackUpdatedEvent(track.getTrackId(), track));
    } catch (error) {
      throw new Error(`Failed to save track: ${error}`);
    }
  }

  async delete(id: TrackId): Promise<void> {
    try {
      await this.localRepo.delete(id);

      // Promise.all([
      //   this.wsRepo.delete(id),
      //   this.rtcRepo.delete(id)
      // ]).catch(error => {
      //   console.error('Failed to sync track deletion:', error);
      // });

      await this.eventBus.publish(new TrackDeletedEvent(id));
    } catch (error) {
      throw new Error(`Failed to delete track: ${error}`);
    }
  }

  // private async handleWebSocketUpdate(event: any): Promise<void> {
  //   await this.localRepo.save(event.track);
  //   await this.eventBus.publish(new TrackEvent('updated', event.track));
  // }

  // private async handleWebRTCUpdate(event: any): Promise<void> {
  //   await this.localRepo.save(event.track);
  //   await this.eventBus.publish(new TrackEvent('updated', event.track));
  // }
} 