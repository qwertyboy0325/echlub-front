import { injectable } from 'inversify';
import { ValidationResult } from '../../../../core/validation/ValidationResult';

@injectable()
export class UserValidator {
  validateRegister(email: string, password: string, username: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email || !email.includes('@')) {
      errors.push('請輸入有效的電子郵件地址');
    }
    
    if (!password || password.length < 6) {
      errors.push('密碼必須至少6個字符');
    }
    
    if (!username || username.length < 3) {
      errors.push('用戶名必須至少3個字符');
    }
    
    return new ValidationResult(errors.length === 0, errors);
  }
  
  validateLogin(email: string, password: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email || !email.includes('@')) {
      errors.push('請輸入有效的電子郵件地址');
    }
    
    if (!password) {
      errors.push('請輸入密碼');
    }
    
    return new ValidationResult(errors.length === 0, errors);
  }
  
  validateUpdateProfile(_data: any): ValidationResult {
    return new ValidationResult(true, []);
  }
  
  validateChangePassword(data: { oldPassword: string, newPassword: string }): ValidationResult {
    const errors: string[] = [];
    
    if (!data.oldPassword) {
      errors.push('請輸入舊密碼');
    }
    
    if (!data.newPassword || data.newPassword.length < 6) {
      errors.push('新密碼必須至少6個字符');
    }
    
    return new ValidationResult(errors.length === 0, errors);
  }
} 
