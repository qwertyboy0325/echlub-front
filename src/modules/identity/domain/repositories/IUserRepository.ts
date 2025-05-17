import { User } from '../entities/User';
import { RegisterUserDTO, UpdateUserDTO, AuthResponseDTO } from '../../application/dtos/UserDTO';

export interface IUserRepository {
  // Authentication
  login(email: string, password: string): Promise<AuthResponseDTO>;
  register(userData: RegisterUserDTO): Promise<User>;
  
  // User operations
  getUserProfile(): Promise<User>;
  updateUserProfile(userData: UpdateUserDTO): Promise<User>;
  changePassword(oldPassword: string, newPassword: string): Promise<void>;
  getCurrentUser(): Promise<User | null>;

  // Token operations
  setToken(token: string): void;
  getToken(): string | null;
  removeToken(): void;
  validateToken(token: string): Promise<boolean>;

  // Additional operations
  logout(): Promise<void>;
} 
