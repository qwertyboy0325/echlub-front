export const ClipTypes = {
  // Repositories
  ClipRepository: Symbol.for('ClipRepository'),
  LocalClipRepository: Symbol.for('LocalClipRepository'),
  
  // Services
  ClipService: Symbol.for('ClipService'),
  ClipQueryService: Symbol.for('ClipQueryService'),
  
  // Mediators & Validators
  ClipMediator: Symbol.for('ClipMediator'),
  ClipValidator: Symbol.for('ClipValidator'),
  
  // Command Handlers
  CreateAudioClipCommandHandler: Symbol.for('CreateAudioClipCommandHandler'),
  EditAudioClipCommandHandler: Symbol.for('EditAudioClipCommandHandler'),
  CreateMidiClipCommandHandler: Symbol.for('CreateMidiClipCommandHandler'),
  EditMidiClipCommandHandler: Symbol.for('EditMidiClipCommandHandler'),
  UpdateClipCommandHandler: Symbol.for('UpdateClipCommandHandler'),
  DeleteClipCommandHandler: Symbol.for('DeleteClipCommandHandler'),
  
  // Factories
  ClipFactory: Symbol.for('ClipFactory'),
  
  // Infrastructure
  ClipStore: Symbol.for('ClipStore'),
  P2PSyncManager: Symbol.for('P2PSyncManager'),
  ApiClient: Symbol.for('ApiClient'),
  
  // Event Bus
  EventBus: Symbol.for('EventBus')
}; 