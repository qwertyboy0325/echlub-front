import { injectable, inject } from 'inversify';
import { IdentityTypes } from '../../di/IdentityTypes';
import { IdentityMediator } from '../mediators/IdentityMediator';
import { RegisterUserCommand } from '../commands/RegisterUserCommand';
import { LoginUserCommand } from '../commands/LoginUserCommand';
import { LogoutCommand } from '../commands/LogoutCommand';
import { UpdateUserProfileCommand } from '../commands/UpdateUserProfileCommand';
import { ChangePasswordCommand } from '../commands/ChangePasswordCommand';
import { GetUserProfileQuery } from '../queries/GetUserProfileQuery';
import { User } from '../../domain/entities/User';
import { AuthResponseDTO, UserDTO, UpdateUserDTO } from '../dtos/UserDTO';
import { UserValidator } from '../validators/UserValidator';
import { UserValidationError, UserOperationError } from '../../domain/errors/UserError';

@injectable()
export class IdentityService {
  private static readonly TOKEN_KEY = 'auth_token';

  constructor(
    @inject(IdentityTypes.IdentityMediator)
    private readonly mediator: IdentityMediator,
    @inject(IdentityTypes.UserValidator)
    private readonly validator: UserValidator
  ) {}

  // Commands
  async registerUser(email: string, password: string, username: string): Promise<UserDTO> {
    const validationResult = this.validator.validateRegister(email, password, username);
    if (!validationResult.isValid) {
      throw new UserValidationError(validationResult.errors);
    }

    try {
      const command = new RegisterUserCommand(email, password, username);
      const user = await this.mediator.registerUser(command);
      return this.toUserDTO(user);
    } catch (error) {
      if (error instanceof UserValidationError) {
        throw error;
      }
      throw new UserOperationError('註冊失敗', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async login(email: string, password: string): Promise<AuthResponseDTO> {
    const validationResult = this.validator.validateLogin(email, password);
    if (!validationResult.isValid) {
      throw new UserValidationError(validationResult.errors);
    }

    try {
      const command = new LoginUserCommand(email, password);
      const result = await this.mediator.login(command);
      this.setToken(result.token);
      return result;
    } catch (error) {
      if (error instanceof UserValidationError) {
        throw error;
      }
      throw new UserOperationError('登入失敗', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async logout(): Promise<void> {
    try {
      const command = new LogoutCommand();
      await this.mediator.logout(command);
    } catch (error) {
      throw new UserOperationError('登出失敗', error instanceof Error ? error : new Error(String(error)));
    } finally {
      this.removeToken();
    }
  }

  async updateUserProfile(data: UpdateUserDTO): Promise<UserDTO> {
    const validationResult = this.validator.validateUpdateProfile(data);
    if (!validationResult.isValid) {
      throw new UserValidationError(validationResult.errors);
    }

    try {
      const command = new UpdateUserProfileCommand(data);
      const user = await this.mediator.updateUserProfile(command);
      return this.toUserDTO(user);
    } catch (error) {
      if (error instanceof UserValidationError) {
        throw error;
      }
      throw new UserOperationError('更新個人資料失敗', error instanceof Error ? error : new Error(String(error)));
    }
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const validationResult = this.validator.validateChangePassword({ oldPassword, newPassword });
    if (!validationResult.isValid) {
      throw new UserValidationError(validationResult.errors);
    }

    try {
      const command = new ChangePasswordCommand(oldPassword, newPassword);
      return await this.mediator.changePassword(command);
    } catch (error) {
      if (error instanceof UserValidationError) {
        throw error;
      }
      throw new UserOperationError('修改密碼失敗', error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Queries
  async getUserProfile(): Promise<UserDTO> {
    try {
      const query = new GetUserProfileQuery();
      const user = await this.mediator.getUserProfile(query);
      return this.toUserDTO(user);
    } catch (error) {
      throw new UserOperationError('獲取個人資料失敗', error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Token Management
  setToken(token: string): void {
    localStorage.setItem(IdentityService.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(IdentityService.TOKEN_KEY);
  }

  removeToken(): void {
    localStorage.removeItem(IdentityService.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private toUserDTO(user: User): UserDTO {
    return {
      id: user.idString,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
} 
