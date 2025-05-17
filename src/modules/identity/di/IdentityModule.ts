import { ContainerModule } from 'inversify';
import { IdentityTypes } from './IdentityTypes';
import { IUserRepository } from '../domain/repositories/IUserRepository';
import { UserRepository } from '../infrastructure/repositories/UserRepository';
import { RegisterUserCommandHandler } from '../application/handlers/RegisterUserCommandHandler';
import { LoginUserCommandHandler } from '../application/handlers/LoginUserCommandHandler';
import { LogoutCommandHandler } from '../application/handlers/LogoutCommandHandler';
import { UpdateUserProfileCommandHandler } from '../application/handlers/UpdateUserProfileCommandHandler';
import { ChangePasswordCommandHandler } from '../application/handlers/ChangePasswordCommandHandler';
import { GetUserProfileQueryHandler } from '../application/handlers/GetUserProfileQueryHandler';
import { IdentityMediator } from '../application/mediators/IdentityMediator';
import { IdentityService } from '../application/services/IdentityService';
import { IEventBus } from '../../../core/event-bus/IEventBus';
import { MockEventBus } from '../mock/MockEventBus';
import { UserValidator } from '../application/validators/UserValidator';

export const IdentityModule = new ContainerModule((bind) => {
  // Event Bus
  bind<IEventBus>(IdentityTypes.EventBus).to(MockEventBus).inSingletonScope();

  // Validators
  bind(IdentityTypes.UserValidator).to(UserValidator).inSingletonScope();

  // Repositories
  bind<IUserRepository>(IdentityTypes.UserRepository)
    .to(UserRepository)
    .inSingletonScope();

  // Command Handlers
  bind(IdentityTypes.RegisterUserCommandHandler)
    .to(RegisterUserCommandHandler)
    .inSingletonScope();

  bind(IdentityTypes.LoginUserCommandHandler)
    .to(LoginUserCommandHandler)
    .inSingletonScope();

  bind(IdentityTypes.LogoutCommandHandler)
    .to(LogoutCommandHandler)
    .inSingletonScope();

  bind(IdentityTypes.UpdateUserProfileCommandHandler)
    .to(UpdateUserProfileCommandHandler)
    .inSingletonScope();

  bind(IdentityTypes.ChangePasswordCommandHandler)
    .to(ChangePasswordCommandHandler)
    .inSingletonScope();

  // Query Handlers
  bind(IdentityTypes.GetUserProfileQueryHandler)
    .to(GetUserProfileQueryHandler)
    .inSingletonScope();

  // Mediators
  bind(IdentityTypes.IdentityMediator)
    .to(IdentityMediator)
    .inSingletonScope();

  // Services
  bind(IdentityTypes.IdentityService)
    .to(IdentityService)
    .inSingletonScope();
}); 
