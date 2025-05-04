import { injectable } from 'inversify';
import { ValidationResult } from '../../../../core/validation/ValidationResult';

@injectable()
export class UserValidator {
  validateRegister(data: { email: string; password: string; username: string }): ValidationResult {
    const errors: string[] = [];
    
    if (!data.email) {
      errors.push('Email 不能為空');
    } else if (!this.isValidEmail(data.email)) {
      errors.push('Email 格式不正確');
    }
    
    if (!data.password) {
      errors.push('密碼不能為空');
    } else if (data.password.length < 6) {
      errors.push('密碼長度至少為 6 個字符');
    }
    
    if (!data.username) {
      errors.push('用戶名不能為空');
    } else if (data.username.length < 3) {
      errors.push('用戶名長度至少為 3 個字符');
    }
    
    return new ValidationResult(errors.length === 0, errors);
  }

  validateLogin(data: { email: string; password: string }): ValidationResult {
    const errors: string[] = [];
    
    if (!data.email) {
      errors.push('Email 不能為空');
    }
    
    if (!data.password) {
      errors.push('密碼不能為空');
    }
    
    return new ValidationResult(errors.length === 0, errors);
  }

  validateUpdateProfile(data: {
    email?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }): ValidationResult {
    const errors: string[] = [];
    
    if (data.email && !this.isValidEmail(data.email)) {
      errors.push('Email 格式不正確');
    }
    
    if (data.username && data.username.length < 3) {
      errors.push('用戶名長度至少為 3 個字符');
    }
    
    return new ValidationResult(errors.length === 0, errors);
  }

  validateChangePassword(data: { oldPassword: string; newPassword: string }): ValidationResult {
    const errors: string[] = [];
    
    if (!data.oldPassword) {
      errors.push('舊密碼不能為空');
    }
    
    if (!data.newPassword) {
      errors.push('新密碼不能為空');
    } else if (data.newPassword.length < 6) {
      errors.push('新密碼長度至少為 6 個字符');
    }
    
    return new ValidationResult(errors.length === 0, errors);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
} 