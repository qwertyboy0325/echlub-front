export const IdentityTypes = {
  // Repositories
  UserRepository: Symbol.for('UserRepository'),
  
  // Commands
  RegisterUserCommand: Symbol.for('RegisterUserCommand'),
  LoginUserCommand: Symbol.for('LoginUserCommand'),
  LogoutCommand: Symbol.for('LogoutCommand'),
  UpdateUserProfileCommand: Symbol.for('UpdateUserProfileCommand'),
  ChangePasswordCommand: Symbol.for('ChangePasswordCommand'),
  
  // Queries
  GetUserProfileQuery: Symbol.for('GetUserProfileQuery'),
  
  // Handlers
  RegisterUserCommandHandler: Symbol.for('RegisterUserCommandHandler'),
  LoginUserCommandHandler: Symbol.for('LoginUserCommandHandler'),
  LogoutCommandHandler: Symbol.for('LogoutCommandHandler'),
  UpdateUserProfileCommandHandler: Symbol.for('UpdateUserProfileCommandHandler'),
  ChangePasswordCommandHandler: Symbol.for('ChangePasswordCommandHandler'),
  GetUserProfileQueryHandler: Symbol.for('GetUserProfileQueryHandler'),
  
  // Mediators
  IdentityMediator: Symbol.for('IdentityMediator'),
  
  // Services
  IdentityService: Symbol.for('IdentityService'),
  
  // Use Cases
  RegisterUserUseCase: Symbol.for('RegisterUserUseCase'),
  
  // Event Bus
  EventBus: Symbol.for('EventBus'),
  
  // Validators
  UserValidator: Symbol.for('UserValidator')
}; 
