import { injectable, inject } from 'inversify';
import { IdentityTypes } from '../../di/IdentityTypes';
import type { IUserRepository } from '../../domain/repositories/IUserRepository';
import type { IEventBus } from '../../../../core/event-bus/IEventBus';
import { LoginUserCommand } from '../commands/LoginUserCommand';
import { AuthResponseDTO } from '../dtos/UserDTO';
import { UserLoggedInEvent } from '../../domain/events/UserLoggedInEvent';

@injectable()
export class LoginUserCommandHandler {
  constructor(
    @inject(IdentityTypes.UserRepository)
    private readonly userRepository: IUserRepository,
    @inject(IdentityTypes.EventBus)
    private readonly eventBus: IEventBus
  ) {}

  async handle(command: LoginUserCommand): Promise<AuthResponseDTO> {
    try {
      console.log(`嘗試登入用戶: ${command.email}`);
      
      const result = await this.userRepository.login(command.email, command.password);
      
      console.log('登入結果:', JSON.stringify({
        hasToken: !!result.token,
        tokenLength: result.token ? result.token.length : 0,
        hasUser: !!result.user,
        user: result.user ? {
          id: result.user.id,
          email: result.user.email,
          username: result.user.username
        } : null
      }));
      
      // 發布用戶登入事件
      await this.eventBus.emit('user.logged-in', new UserLoggedInEvent(
        result.user.id,
        result.user.email
      ));
      
      console.log(`用戶 ${command.email} 登入成功並發布事件`);
      
      return result;
    } catch (error) {
      console.error('登入命令處理錯誤:', error);
      throw new Error(error instanceof Error ? error.message : '登入失敗');
    }
  }
} 
