import { Container } from 'inversify';
import { MusicArrangementTypes } from './MusicArrangementTypes';

// Repositories
import { EventSourcedTrackRepository } from '../infrastructure/repositories/EventSourcedTrackRepository';
import type { TrackRepository } from '../domain/repositories/TrackRepository';
import { ClipRepositoryImpl } from '../infrastructure/repositories/ClipRepositoryImpl';
import type { ClipRepository } from '../domain/repositories/ClipRepository';

// Command Handlers
import { CreateTrackCommandHandler } from '../application/handlers/CreateTrackCommandHandler';
import { CreateAudioClipCommandHandler } from '../application/handlers/CreateAudioClipCommandHandler';
import { CreateMidiClipCommandHandler } from '../application/handlers/CreateMidiClipCommandHandler';
import { AddMidiNoteCommandHandler } from '../application/handlers/AddMidiNoteCommandHandler';
import { RemoveMidiNoteCommandHandler } from '../application/handlers/RemoveMidiNoteCommandHandler';
import { QuantizeMidiClipCommandHandler } from '../application/handlers/QuantizeMidiClipCommandHandler';
import { TransposeMidiClipCommandHandler } from '../application/handlers/TransposeMidiClipCommandHandler';
import { MoveClipCommandHandler } from '../application/handlers/MoveClipCommandHandler';
import { RemoveClipCommandHandler } from '../application/handlers/RemoveClipCommandHandler';
import { SetAudioClipGainCommandHandler } from '../application/handlers/SetAudioClipGainCommandHandler';

// Query Handlers
import { GetTrackByIdQueryHandler } from '../application/handlers/GetTrackByIdQueryHandler';
import { GetTrackWithClipsQueryHandler } from '../application/handlers/GetTrackWithClipsQueryHandler';
import { GetTracksByOwnerQueryHandler } from '../application/handlers/GetTracksByOwnerQueryHandler';
import { GetClipsInTimeRangeQueryHandler } from '../application/handlers/GetClipsInTimeRangeQueryHandler';
import { GetTracksInTimeRangeQueryHandler } from '../application/handlers/GetTracksInTimeRangeQueryHandler';

// Integration Event Handlers
import { AudioBufferReceivedHandler } from '../application/handlers/AudioBufferReceivedHandler';
import { JamClockTickHandler } from '../application/handlers/JamClockTickHandler';

// Services
import { MusicArrangementService } from '../application/services/MusicArrangementService';
import { EventSynchronizerService } from '../application/services/EventSynchronizerService';
import { UndoRedoService } from '../application/services/UndoRedoService';
import { SimpleMusicArrangementService } from '../application/services/SimpleMusicArrangementService';

// Infrastructure
import { EventStore, InMemoryEventStore } from '../infrastructure/events/EventStore';

// Core Services
import { IntegrationEventBus } from '../../../core/events/IntegrationEventBus';

// Mediator
import { MusicArrangementMediator } from '../application/mediator/MusicArrangementMediator';

// Adapters
import { CollaborationAdapter } from '../integration/adapters/CollaborationAdapter';
import { AudioAdapter } from '../integration/adapters/AudioAdapter';
import { MidiAdapter } from '../integration/adapters/MidiAdapter';

/**
 * Music Arrangement BC Dependency Injection Container
 */
export class MusicArrangementContainer {
  private container: Container;

  constructor() {
    this.container = new Container();
    this.bindDependencies();
  }

  private bindDependencies(): void {
    this.bindInfrastructure();
    this.bindRepositories();
    this.bindCommandHandlers();
    this.bindQueryHandlers();
    this.bindIntegrationEventHandlers();
    this.bindServices();
    this.bindAdapters();
  }

  private bindInfrastructure(): void {
    this.container.bind<EventStore>(MusicArrangementTypes.EventStore)
      .to(InMemoryEventStore)
      .inSingletonScope();
  }

  private bindRepositories(): void {
    this.container.bind<TrackRepository>(MusicArrangementTypes.TrackRepository)
      .to(EventSourcedTrackRepository)
      .inSingletonScope();

    this.container.bind<ClipRepository>(MusicArrangementTypes.ClipRepository)
      .to(ClipRepositoryImpl)
      .inSingletonScope();
  }

  private bindCommandHandlers(): void {
    this.container.bind(MusicArrangementTypes.CreateTrackCommandHandler)
      .to(CreateTrackCommandHandler)
      .inTransientScope();

    this.container.bind(MusicArrangementTypes.CreateAudioClipCommandHandler)
      .to(CreateAudioClipCommandHandler)
      .inTransientScope();

    this.container.bind(MusicArrangementTypes.CreateMidiClipCommandHandler)
      .to(CreateMidiClipCommandHandler)
      .inTransientScope();

    this.container.bind(MusicArrangementTypes.AddMidiNoteCommandHandler)
      .to(AddMidiNoteCommandHandler)
      .inTransientScope();

    this.container.bind(MusicArrangementTypes.RemoveMidiNoteCommandHandler)
      .to(RemoveMidiNoteCommandHandler)
      .inTransientScope();

    this.container.bind(MusicArrangementTypes.QuantizeMidiClipCommandHandler)
      .to(QuantizeMidiClipCommandHandler)
      .inTransientScope();

    this.container.bind(MusicArrangementTypes.TransposeMidiClipCommandHandler)
      .to(TransposeMidiClipCommandHandler)
      .inTransientScope();

    this.container.bind(MusicArrangementTypes.MoveClipCommandHandler)
      .to(MoveClipCommandHandler)
      .inTransientScope();

    this.container.bind(MusicArrangementTypes.RemoveClipCommandHandler)
      .to(RemoveClipCommandHandler)
      .inTransientScope();

    this.container.bind(MusicArrangementTypes.SetAudioClipGainCommandHandler)
      .to(SetAudioClipGainCommandHandler)
      .inTransientScope();
  }

  private bindQueryHandlers(): void {
    this.container.bind(MusicArrangementTypes.GetTrackByIdQueryHandler)
      .to(GetTrackByIdQueryHandler)
      .inTransientScope();

    this.container.bind(MusicArrangementTypes.GetTrackWithClipsQueryHandler)
      .to(GetTrackWithClipsQueryHandler)
      .inTransientScope();

    this.container.bind(MusicArrangementTypes.GetTracksByOwnerQueryHandler)
      .to(GetTracksByOwnerQueryHandler)
      .inTransientScope();

    this.container.bind(MusicArrangementTypes.GetClipsInTimeRangeQueryHandler)
      .to(GetClipsInTimeRangeQueryHandler)
      .inTransientScope();

    this.container.bind(MusicArrangementTypes.GetTracksInTimeRangeQueryHandler)
      .to(GetTracksInTimeRangeQueryHandler)
      .inTransientScope();
  }

  private bindIntegrationEventHandlers(): void {
    this.container.bind(MusicArrangementTypes.AudioBufferReceivedHandler)
      .to(AudioBufferReceivedHandler)
      .inSingletonScope();

    this.container.bind(MusicArrangementTypes.JamClockTickHandler)
      .to(JamClockTickHandler)
      .inSingletonScope();
  }

  private bindServices(): void {
    // ✅ Core Event Bus
    this.container.bind(MusicArrangementTypes.IntegrationEventBus)
      .to(IntegrationEventBus)
      .inSingletonScope();

    // ✅ Mediator - Command/Query dispatcher
    this.container.bind(MusicArrangementTypes.MusicArrangementMediator)
      .to(MusicArrangementMediator)
      .inSingletonScope();

    // ✅ Main Application Service - The primary entry point
    this.container.bind<MusicArrangementService>(MusicArrangementTypes.MusicArrangementService)
      .to(MusicArrangementService)
      .inSingletonScope();

    this.container.bind(MusicArrangementTypes.EventSynchronizerService)
      .to(EventSynchronizerService)
      .inSingletonScope();

    this.container.bind(MusicArrangementTypes.UndoRedoService)
      .to(UndoRedoService)
      .inSingletonScope();

    // ✅ Simplified Service for Testing
    this.container.bind<SimpleMusicArrangementService>(MusicArrangementTypes.SimpleMusicArrangementService)
      .to(SimpleMusicArrangementService)
      .inSingletonScope();
  }

  private bindAdapters(): void {
    this.container.bind(MusicArrangementTypes.CollaborationAdapter)
      .to(CollaborationAdapter)
      .inSingletonScope();

    this.container.bind(MusicArrangementTypes.AudioAdapter)
      .to(AudioAdapter)
      .inSingletonScope();

    this.container.bind(MusicArrangementTypes.MidiAdapter)
      .to(MidiAdapter)
      .inSingletonScope();
  }

  /**
   * Get the configured container
   */
  public getContainer(): Container {
    return this.container;
  }

  /**
   * Get a service from the container
   */
  public get<T>(serviceIdentifier: symbol): T {
    return this.container.get<T>(serviceIdentifier);
  }

  /**
   * Initialize the module
   */
  public async initialize(): Promise<void> {
    try {
      console.log('Initializing Music Arrangement BC...');

      // Initialize adapters
      const audioAdapter = this.get<AudioAdapter>(MusicArrangementTypes.AudioAdapter);
      await audioAdapter.initialize();

      const midiAdapter = this.get<MidiAdapter>(MusicArrangementTypes.MidiAdapter);
      await midiAdapter.initialize();

      // Initialize event synchronizer
      const eventSynchronizer = this.get<EventSynchronizerService>(MusicArrangementTypes.EventSynchronizerService);
      eventSynchronizer.initialize();

      console.log('Music Arrangement BC initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Music Arrangement BC:', error);
      throw error;
    }
  }

  /**
   * Dispose the module
   */
  public dispose(): void {
    try {
      console.log('Disposing Music Arrangement BC...');

      // Dispose adapters
      const audioAdapter = this.get<AudioAdapter>(MusicArrangementTypes.AudioAdapter);
      audioAdapter.dispose();

      const midiAdapter = this.get<MidiAdapter>(MusicArrangementTypes.MidiAdapter);
      midiAdapter.dispose();

      const collaborationAdapter = this.get<CollaborationAdapter>(MusicArrangementTypes.CollaborationAdapter);
      collaborationAdapter.dispose();

      // Dispose event synchronizer
      const eventSynchronizer = this.get<EventSynchronizerService>(MusicArrangementTypes.EventSynchronizerService);
      eventSynchronizer.dispose();

      console.log('Music Arrangement BC disposed successfully');
    } catch (error) {
      console.error('Error disposing Music Arrangement BC:', error);
    }
  }
} 