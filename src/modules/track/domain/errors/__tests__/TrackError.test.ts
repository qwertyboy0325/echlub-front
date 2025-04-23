import { 
  TrackError, 
  TrackValidationError, 
  TrackNotFoundError, 
  TrackOperationError, 
  TrackAlreadyExistsError,
  TrackInvalidStateError 
} from '../TrackError';

describe('TrackError', () => {
  describe('基礎 TrackError', () => {
    it('應該正確初始化基本錯誤', () => {
      const message = '測試錯誤';
      const code = 'TEST_ERROR';
      const details = { test: 'data' };
      const error = new TrackError(message, code, details);

      expect(error.message).toBe(message);
      expect(error.code).toBe(code);
      expect(error.details).toEqual(details);
      expect(error.name).toBe('TrackError');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('TrackValidationError', () => {
    it('應該正確初始化驗證錯誤', () => {
      const errors = [
        { field: 'name', message: '名稱不能為空' },
        { field: 'type', message: '類型無效' }
      ];
      const error = new TrackValidationError(errors);

      expect(error.message).toBe('Track validation failed');
      expect(error.code).toBe('TRACK_VALIDATION_ERROR');
      expect(error.details).toEqual({ errors });
      expect(error instanceof TrackError).toBe(true);
    });
  });

  describe('TrackNotFoundError', () => {
    it('應該正確初始化未找到錯誤', () => {
      const trackId = 'test-id';
      const error = new TrackNotFoundError(trackId);

      expect(error.message).toBe(`Track with id ${trackId} not found`);
      expect(error.code).toBe('TRACK_NOT_FOUND');
      expect(error.details).toEqual({ trackId });
      expect(error instanceof TrackError).toBe(true);
    });
  });

  describe('TrackOperationError', () => {
    it('應該正確初始化操作錯誤（無 cause）', () => {
      const message = '操作失敗';
      const error = new TrackOperationError(message);

      expect(error.message).toBe(message);
      expect(error.code).toBe('TRACK_OPERATION_ERROR');
      expect(error.details).toEqual({ cause: undefined });
      expect(error instanceof TrackError).toBe(true);
    });

    it('應該正確初始化操作錯誤（有 cause）', () => {
      const message = '操作失敗';
      const cause = new Error('原始錯誤');
      const error = new TrackOperationError(message, cause);

      expect(error.message).toBe(message);
      expect(error.code).toBe('TRACK_OPERATION_ERROR');
      expect(error.details).toEqual({ cause });
      expect(error instanceof TrackError).toBe(true);
    });
  });

  describe('TrackAlreadyExistsError', () => {
    it('應該正確初始化已存在錯誤', () => {
      const trackId = 'test-id';
      const error = new TrackAlreadyExistsError(trackId);

      expect(error.message).toBe(`Track with id ${trackId} already exists`);
      expect(error.code).toBe('TRACK_ALREADY_EXISTS');
      expect(error.details).toEqual({ trackId });
      expect(error instanceof TrackError).toBe(true);
    });
  });

  describe('TrackInvalidStateError', () => {
    it('應該正確初始化無效狀態錯誤（無詳細信息）', () => {
      const message = '無效狀態';
      const error = new TrackInvalidStateError(message);

      expect(error.message).toBe(message);
      expect(error.code).toBe('TRACK_INVALID_STATE');
      expect(error.details).toBeUndefined();
      expect(error instanceof TrackError).toBe(true);
    });

    it('應該正確初始化無效狀態錯誤（有詳細信息）', () => {
      const message = '無效狀態';
      const details = { state: 'invalid' };
      const error = new TrackInvalidStateError(message, details);

      expect(error.message).toBe(message);
      expect(error.code).toBe('TRACK_INVALID_STATE');
      expect(error.details).toEqual(details);
      expect(error instanceof TrackError).toBe(true);
    });
  });
}); 