import { injectable, inject } from 'inversify';
import { IdentityTypes } from '../../di/IdentityTypes';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import { RegisterUserCommand } from '../commands/RegisterUserCommand';
import { User } from '../../domain/entities/User';

@injectable()
export class RegisterUserCommandHandler {
  constructor(
    @inject(IdentityTypes.UserRepository)
    private readonly userRepository: IUserRepository
  ) {}

  async handle(command: RegisterUserCommand): Promise<User> {
    try {
      return await this.userRepository.register({
        email: command.email,
        password: command.password,
        username: command.username
      });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    }
  }
} 
