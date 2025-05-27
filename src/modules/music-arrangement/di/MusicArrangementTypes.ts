export const MusicArrangementTypes = {
  // Repositories
  TrackRepository: Symbol.for('MusicArrangement.TrackRepository'),
  ClipRepository: Symbol.for('MusicArrangement.ClipRepository'),

  // Command Handlers
  CreateTrackCommandHandler: Symbol.for('MusicArrangement.CreateTrackCommandHandler'),
  CreateAudioClipCommandHandler: Symbol.for('MusicArrangement.CreateAudioClipCommandHandler'),
  CreateMidiClipCommandHandler: Symbol.for('MusicArrangement.CreateMidiClipCommandHandler'),
  AddMidiNoteCommandHandler: Symbol.for('MusicArrangement.AddMidiNoteCommandHandler'),
  RemoveMidiNoteCommandHandler: Symbol.for('MusicArrangement.RemoveMidiNoteCommandHandler'),
  QuantizeMidiClipCommandHandler: Symbol.for('MusicArrangement.QuantizeMidiClipCommandHandler'),
  TransposeMidiClipCommandHandler: Symbol.for('MusicArrangement.TransposeMidiClipCommandHandler'),
  MoveClipCommandHandler: Symbol.for('MusicArrangement.MoveClipCommandHandler'),
  RemoveClipCommandHandler: Symbol.for('MusicArrangement.RemoveClipCommandHandler'),
  SetAudioClipGainCommandHandler: Symbol.for('MusicArrangement.SetAudioClipGainCommandHandler'),

  // Query Handlers
  GetTrackByIdQueryHandler: Symbol.for('MusicArrangement.GetTrackByIdQueryHandler'),
  GetTrackWithClipsQueryHandler: Symbol.for('MusicArrangement.GetTrackWithClipsQueryHandler'),
  GetTracksByOwnerQueryHandler: Symbol.for('MusicArrangement.GetTracksByOwnerQueryHandler'),
  GetClipsInTimeRangeQueryHandler: Symbol.for('MusicArrangement.GetClipsInTimeRangeQueryHandler'),
  GetTracksInTimeRangeQueryHandler: Symbol.for('MusicArrangement.GetTracksInTimeRangeQueryHandler'),

  // Mediator
  MusicArrangementMediator: Symbol.for('MusicArrangement.Mediator'),

  // Event Bus
  EventBus: Symbol.for('MusicArrangement.EventBus'),

  // Integration Event Handlers
  AudioBufferReceivedHandler: Symbol.for('MusicArrangement.AudioBufferReceivedHandler'),
  JamClockTickHandler: Symbol.for('MusicArrangement.JamClockTickHandler'),

  // Services
  MusicArrangementService: Symbol.for('MusicArrangement.MusicArrangementService'),
  EventSynchronizerService: Symbol.for('MusicArrangement.EventSynchronizerService'),

  // Adapters
  CollaborationAdapter: Symbol.for('MusicArrangement.CollaborationAdapter'),
  AudioAdapter: Symbol.for('MusicArrangement.AudioAdapter'),
  MidiAdapter: Symbol.for('MusicArrangement.MidiAdapter')
}; 