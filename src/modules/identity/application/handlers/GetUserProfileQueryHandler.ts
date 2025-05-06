import { injectable, inject } from 'inversify';
import { IdentityTypes } from '../../di/IdentityTypes';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import { GetUserProfileQuery } from '../queries/GetUserProfileQuery';
import { User } from '../../domain/entities/User';

@injectable()
export class GetUserProfileQueryHandler {
  constructor(
    @inject(IdentityTypes.UserRepository)
    private readonly userRepository: IUserRepository
  ) {}

  async handle(_query: GetUserProfileQuery): Promise<User> {
    try {
      return await this.userRepository.getUserProfile();
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Get user profile failed');
    }
  }
} 