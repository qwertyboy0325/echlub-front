// Domain Layer Exports
export * from './domain/value-objects/TrackId';
export * from './domain/value-objects/ClipId';
export * from './domain/value-objects/MidiNoteId';
export * from './domain/value-objects/TimeRangeVO';
export * from './domain/value-objects/TrackType';
export * from './domain/value-objects/ClipType';
export * from './domain/value-objects/ClipMetadata';
export * from './domain/value-objects/TrackMetadata';
export * from './domain/value-objects/AudioSourceRef';
export * from './domain/value-objects/InstrumentRef';
export * from './domain/value-objects/QuantizeValue';

export * from './domain/entities/MidiNote';
export * from './domain/entities/Clip';
export * from './domain/entities/AudioClip';
export * from './domain/entities/MidiClip';

export * from './domain/aggregates/Track';

export * from './domain/repositories/TrackRepository';

// Domain Events Exports
export * from './domain/events/TrackEvents';
export * from './domain/events/ClipEvents';
export * from './domain/events/MidiEvents';

// Domain Errors Export
export * from './domain/errors/DomainError';

// Infrastructure Events Export
export * from './infrastructure/events/EventStore';
export * from './infrastructure/events/RealEventBus';

// Infrastructure Audio Engine Export (Tone.js)
export * from './infrastructure/audio/ToneJsAudioEngine';

// Application Layer Exports - Commands
export * from './application/commands/CreateTrackCommand';
export * from './application/commands/CreateAudioClipCommand';
export * from './application/commands/CreateMidiClipCommand';
export * from './application/commands/AddMidiNoteCommand';
export * from './application/commands/RemoveMidiNoteCommand';
export * from './application/commands/QuantizeMidiClipCommand';
export * from './application/commands/TransposeMidiClipCommand';
export * from './application/commands/MoveClipCommand';
export * from './application/commands/RemoveClipCommand';
export * from './application/commands/SetAudioClipGainCommand';

// Application Layer Exports - Queries
export * from './application/queries/GetTrackByIdQuery';
export * from './application/queries/GetTrackWithClipsQuery';
export * from './application/queries/GetTracksByOwnerQuery';
export * from './application/queries/GetClipsInTimeRangeQuery';
export * from './application/queries/GetTracksInTimeRangeQuery';

// Application Layer Exports - Handlers
export * from './application/handlers/CreateTrackCommandHandler';
export * from './application/handlers/CreateAudioClipCommandHandler';
export * from './application/handlers/CreateMidiClipCommandHandler';
export * from './application/handlers/AddMidiNoteCommandHandler';
export * from './application/handlers/RemoveMidiNoteCommandHandler';
export * from './application/handlers/QuantizeMidiClipCommandHandler';
export * from './application/handlers/TransposeMidiClipCommandHandler';
export * from './application/handlers/MoveClipCommandHandler';
export * from './application/handlers/RemoveClipCommandHandler';
export * from './application/handlers/SetAudioClipGainCommandHandler';

export * from './application/handlers/GetTrackByIdQueryHandler';
export * from './application/handlers/GetTrackWithClipsQueryHandler';
export * from './application/handlers/GetTracksByOwnerQueryHandler';
export * from './application/handlers/GetClipsInTimeRangeQueryHandler';
export * from './application/handlers/GetTracksInTimeRangeQueryHandler';

export * from './application/handlers/AudioBufferReceivedHandler';
export * from './application/handlers/JamClockTickHandler';

// Application Layer Exports - Services
export * from './application/services/EventSynchronizerService';
export * from './application/services/UndoRedoService';

// Infrastructure Layer Exports
export * from './infrastructure/repositories/TrackRepositoryImpl';
export * from './infrastructure/repositories/EventSourcedTrackRepository';

// Integration Layer Exports - Adapters
export * from './integration/adapters/CollaborationAdapter';
export * from './integration/adapters/AudioAdapter';
export * from './integration/adapters/MidiAdapter';

// Real Adapters (Phase 3)
export * from './integration/adapters/RealAudioAdapter';
export * from './integration/adapters/RealMidiAdapter';
export * from './integration/adapters/RealCollaborationAdapter';

// Tone.js Integrated Adapter (Phase 4)
export * from './integration/adapters/ToneJsIntegratedAdapter';

// DI Container
export * from './di/MusicArrangementTypes';
export * from './di/MusicArrangementContainer';

// Enhanced Command Handlers with Undo/Redo Support
export * from './application/handlers/BaseCommandHandler';
export * from './application/handlers/EnhancedAddMidiNoteCommandHandler';
export * from './application/handlers/UndoRedoCommandHandler'; 