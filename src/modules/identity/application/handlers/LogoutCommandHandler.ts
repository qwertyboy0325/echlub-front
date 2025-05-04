import { injectable, inject } from 'inversify';
import { IdentityTypes } from '../../di/IdentityTypes';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import { LogoutCommand } from '../commands/LogoutCommand';

@injectable()
export class LogoutCommandHandler {
  constructor(
    @inject(IdentityTypes.UserRepository)
    private readonly userRepository: IUserRepository
  ) {}

  async handle(command: LogoutCommand): Promise<void> {
    try {
      await this.userRepository.logout();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Logout failed');
    }
  }
} 