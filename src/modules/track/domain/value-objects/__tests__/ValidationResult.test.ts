import { ValidationResult } from '../ValidationResult';

describe('ValidationResult', () => {
  it('應該在沒有錯誤時返回有效狀態', () => {
    const result = new ValidationResult([]);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('應該在有錯誤時返回無效狀態', () => {
    const errors = ['錯誤消息1', '錯誤消息2'];
    const result = new ValidationResult(errors);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors.map(e => e.message)).toEqual(errors);
  });

  it('應該正確處理單個錯誤', () => {
    const error = '錯誤消息';
    const result = new ValidationResult([error]);
    
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toBe(error);
  });

  it('應該正確處理 undefined 錯誤數組', () => {
    const result = new ValidationResult(undefined);
    
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
}); 