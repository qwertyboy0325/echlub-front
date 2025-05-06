import { injectable, inject } from 'inversify';
import { IdentityTypes } from '../../di/IdentityTypes';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import { UpdateUserProfileCommand } from '../commands/UpdateUserProfileCommand';
import { User } from '../../domain/entities/User';

@injectable()
export class UpdateUserProfileCommandHandler {
  constructor(
    @inject(IdentityTypes.UserRepository)
    private readonly userRepository: IUserRepository
  ) {}

  async handle(command: UpdateUserProfileCommand): Promise<User> {
    try {
      return await this.userRepository.updateUserProfile(command.userData);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Update profile failed');
    }
  }
} 