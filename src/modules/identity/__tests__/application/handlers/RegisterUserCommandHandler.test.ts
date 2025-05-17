import { Container } from 'inversify';
import { IdentityTypes } from '../../../di/IdentityTypes';
import { RegisterUserCommandHandler } from '../../../application/handlers/RegisterUserCommandHandler';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { RegisterUserCommand } from '../../../application/commands/RegisterUserCommand';
import { User } from '../../../domain/entities/User';

// 測試專用常數，避免硬編碼敏感信息
const TEST_CREDENTIALS = {
  PASSWORD: 'test_password_for_testing_only' // NOSONAR
};

describe('RegisterUserCommandHandler', () => {
  let container: Container;
  let handler: RegisterUserCommandHandler;
  let userRepository: IUserRepository;

  beforeEach(() => {
    container = new Container();
    userRepository = {
      register: jest.fn()
    } as unknown as IUserRepository;

    container.bind(IdentityTypes.UserRepository).toConstantValue(userRepository);
    container.bind(RegisterUserCommandHandler).toSelf();

    handler = container.get(RegisterUserCommandHandler);
  });

  it('should register a new user successfully', async () => {
    const mockUser = new User(
      '1',
      'test@example.com',
      'testuser',
      new Date(),
      new Date()
    );

    (userRepository.register as jest.Mock).mockResolvedValue(mockUser);

    const command = new RegisterUserCommand(
      'test@example.com',
      TEST_CREDENTIALS.PASSWORD,
      'testuser'
    );

    const result = await handler.handle(command);

    expect(result).toBe(mockUser);
    expect(userRepository.register).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: TEST_CREDENTIALS.PASSWORD,
      username: 'testuser'
    });
  });

  it('should throw error when registration fails', async () => {
    (userRepository.register as jest.Mock).mockRejectedValue(new Error('Registration failed'));

    const command = new RegisterUserCommand(
      'test@example.com',
      TEST_CREDENTIALS.PASSWORD,
      'testuser'
    );

    await expect(handler.handle(command)).rejects.toThrow('Registration failed');
  });
}); 
