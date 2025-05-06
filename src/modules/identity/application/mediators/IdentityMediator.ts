import { injectable, inject } from 'inversify';
import { IdentityTypes } from '../../di/IdentityTypes';
import { RegisterUserCommand } from '../commands/RegisterUserCommand';
import { LoginUserCommand } from '../commands/LoginUserCommand';
import { LogoutCommand } from '../commands/LogoutCommand';
import { UpdateUserProfileCommand } from '../commands/UpdateUserProfileCommand';
import { ChangePasswordCommand } from '../commands/ChangePasswordCommand';
import { GetUserProfileQuery } from '../queries/GetUserProfileQuery';
import { RegisterUserCommandHandler } from '../handlers/RegisterUserCommandHandler';
import { LoginUserCommandHandler } from '../handlers/LoginUserCommandHandler';
import { LogoutCommandHandler } from '../handlers/LogoutCommandHandler';
import { UpdateUserProfileCommandHandler } from '../handlers/UpdateUserProfileCommandHandler';
import { ChangePasswordCommandHandler } from '../handlers/ChangePasswordCommandHandler';
import { GetUserProfileQueryHandler } from '../handlers/GetUserProfileQueryHandler';
import { User } from '../../domain/entities/User';
import { AuthResponseDTO } from '../dtos/UserDTO';

@injectable()
export class IdentityMediator {
  constructor(
    @inject(IdentityTypes.RegisterUserCommandHandler)
    private readonly registerUserHandler: RegisterUserCommandHandler,
    @inject(IdentityTypes.LoginUserCommandHandler)
    private readonly loginUserHandler: LoginUserCommandHandler,
    @inject(IdentityTypes.LogoutCommandHandler)
    private readonly logoutHandler: LogoutCommandHandler,
    @inject(IdentityTypes.UpdateUserProfileCommandHandler)
    private readonly updateProfileHandler: UpdateUserProfileCommandHandler,
    @inject(IdentityTypes.ChangePasswordCommandHandler)
    private readonly changePasswordHandler: ChangePasswordCommandHandler,
    @inject(IdentityTypes.GetUserProfileQueryHandler)
    private readonly getUserProfileHandler: GetUserProfileQueryHandler
  ) {}

  // Commands
  async registerUser(command: RegisterUserCommand): Promise<User> {
    return this.registerUserHandler.handle(command);
  }

  async login(command: LoginUserCommand): Promise<AuthResponseDTO> {
    return this.loginUserHandler.handle(command);
  }

  async logout(command: LogoutCommand): Promise<void> {
    return this.logoutHandler.handle(command);
  }

  async updateUserProfile(command: UpdateUserProfileCommand): Promise<User> {
    return this.updateProfileHandler.handle(command);
  }

  async changePassword(command: ChangePasswordCommand): Promise<void> {
    return this.changePasswordHandler.handle(command);
  }

  // Queries
  async getUserProfile(query: GetUserProfileQuery): Promise<User> {
    return this.getUserProfileHandler.handle(query);
  }
} 