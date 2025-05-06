import { injectable, inject } from 'inversify';
import { IdentityTypes } from '../../di/IdentityTypes';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import { LoginUserCommand } from '../commands/LoginUserCommand';
import { AuthResponseDTO } from '../dtos/UserDTO';

@injectable()
export class LoginUserCommandHandler {
  constructor(
    @inject(IdentityTypes.UserRepository)
    private readonly userRepository: IUserRepository
  ) {}

  async handle(command: LoginUserCommand): Promise<AuthResponseDTO> {
    try {
      return await this.userRepository.login(command.email, command.password);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    }
  }
} 