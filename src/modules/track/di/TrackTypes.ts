export const TrackTypes = {
  // Repositories
  TrackRepository: Symbol.for('TrackRepository'),
  LocalTrackRepository: Symbol.for('LocalTrackRepository'),
  WebSocketTrackRepository: Symbol.for('WebSocketTrackRepository'),
  WebRTCTrackRepository: Symbol.for('WebRTCTrackRepository'),
  ClipRepository: Symbol.for('ClipRepository'),
  
  // Services
  TrackService: Symbol.for('TrackService'),
  TrackDomainService: Symbol.for('TrackDomainService'),
  
  // Mediators & Validators
  TrackMediator: Symbol.for('TrackMediator'),
  TrackValidator: Symbol.for('TrackValidator'),
  
  // Command Handlers
  CreateTrackCommandHandler: Symbol.for('CreateTrackCommandHandler'),
  RenameTrackCommandHandler: Symbol.for('RenameTrackCommandHandler'),
  AddClipToTrackCommandHandler: Symbol.for('AddClipToTrackCommandHandler'),
  RemoveClipFromTrackCommandHandler: Symbol.for('RemoveClipFromTrackCommandHandler'),
  ChangeTrackRoutingCommandHandler: Symbol.for('ChangeTrackRoutingCommandHandler'),
  AddPluginToTrackCommandHandler: Symbol.for('AddPluginToTrackCommandHandler'),
  RemovePluginFromTrackCommandHandler: Symbol.for('RemovePluginFromTrackCommandHandler'),
  AddInputTrackToBusCommandHandler: Symbol.for('AddInputTrackToBusCommandHandler'),
  RemoveInputTrackFromBusCommandHandler: Symbol.for('RemoveInputTrackFromBusCommandHandler'),
  AddNoteToClipCommandHandler: Symbol.for('AddNoteToClipCommandHandler'),
  UpdateNoteInClipCommandHandler: Symbol.for('UpdateNoteInClipCommandHandler'),
  RemoveNoteFromClipCommandHandler: Symbol.for('RemoveNoteFromClipCommandHandler'),
  DeleteTrackCommandHandler: Symbol.for('DeleteTrackCommandHandler'),
  CopyClipToTrackCommandHandler: Symbol.for('CopyClipToTrackCommandHandler'),
  
  // Factories
  TrackFactory: Symbol.for('TrackFactory'),
  
  // Infrastructure
  TrackStore: Symbol.for('TrackStore'),
  
  // Event Handlers
  TrackEventHandler: Symbol.for('TrackEventHandler'),
  
  // Specifications
  TrackSpecification: Symbol.for('TrackSpecification'),

  // Core Dependencies
  EventBus: Symbol.for('EventBus'),
  StateManager: Symbol.for('StateManager'),

  // New PluginReferenceAdapter
  PluginReferenceAdapter: Symbol.for('PluginReferenceAdapter'),

  // Track Factories
  AudioTrackFactory: Symbol.for('AudioTrackFactory'),
  MidiTrackFactory: Symbol.for('MidiTrackFactory'),
  BusTrackFactory: Symbol.for('BusTrackFactory'),
  TrackFactoryRegistry: Symbol.for('TrackFactoryRegistry'),

  // New TrackEventPublisher
  TrackEventPublisher: Symbol.for('TrackEventPublisher'),

  // Query Handlers
  GetTrackByIdQueryHandler: Symbol.for('GetTrackByIdQueryHandler'),
  GetTrackPluginsQueryHandler: Symbol.for('GetTrackPluginsQueryHandler'),
  GetTrackRoutingQueryHandler: Symbol.for('GetTrackRoutingQueryHandler'),
  GetTrackGainQueryHandler: Symbol.for('GetTrackGainQueryHandler'),
  GetTrackNameQueryHandler: Symbol.for('GetTrackNameQueryHandler'),

  // Decorators
  TrackEventDecorator: Symbol.for('TrackEventDecorator'),
}; 