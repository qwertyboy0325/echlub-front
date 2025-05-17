import { injectable, inject } from 'inversify';
import { IdentityTypes } from '../../di/IdentityTypes';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ChangePasswordCommand } from '../commands/ChangePasswordCommand';

@injectable()
export class ChangePasswordCommandHandler {
  constructor(
    @inject(IdentityTypes.UserRepository)
    private readonly userRepository: IUserRepository
  ) {}

  async handle(command: ChangePasswordCommand): Promise<void> {
    try {
      await this.userRepository.changePassword(command.oldPassword, command.newPassword);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : '修改密碼失敗');
    }
  }
} 
