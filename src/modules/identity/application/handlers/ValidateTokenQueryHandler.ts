import { injectable, inject } from 'inversify';
import { IdentityTypes } from '../../di/IdentityTypes';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ValidateTokenQuery } from '../queries/ValidateTokenQuery';

@injectable()
export class ValidateTokenQueryHandler {
  constructor(
    @inject(IdentityTypes.UserRepository)
    private readonly userRepository: IUserRepository
  ) {}

  async handle(query: ValidateTokenQuery): Promise<boolean> {
    return await this.userRepository.validateToken(query.token);
  }
} 
