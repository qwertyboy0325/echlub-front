import { Container } from 'inversify';
import { IdentityTypes } from '../../../di/IdentityTypes';
import { RegisterUserCommandHandler } from '../../../application/handlers/RegisterUserCommandHandler';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { RegisterUserCommand } from '../../../application/commands/RegisterUserCommand';
import { User } from '../../../domain/entities/User';

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
      'password123',
      'testuser'
    );

    const result = await handler.handle(command);

    expect(result).toBe(mockUser);
    expect(userRepository.register).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser'
    });
  });

  it('should throw error when registration fails', async () => {
    (userRepository.register as jest.Mock).mockRejectedValue(new Error('Registration failed'));

    const command = new RegisterUserCommand(
      'test@example.com',
      'password123',
      'testuser'
    );

    await expect(handler.handle(command)).rejects.toThrow('Registration failed');
  });
}); 