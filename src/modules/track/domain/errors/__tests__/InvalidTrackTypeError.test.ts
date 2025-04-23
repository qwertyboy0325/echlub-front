import { InvalidTrackTypeError } from '../InvalidTrackTypeError';
import { TrackType } from '../../value-objects/track/TrackType';
import { TrackError } from '../TrackError';

describe('InvalidTrackTypeError', () => {
  it('應該正確初始化無效軌道類型錯誤', () => {
    const invalidType = 'invalid-type';
    const error = new InvalidTrackTypeError(invalidType);
    
    expect(error.message).toBe(`Invalid track type: ${invalidType}`);
    expect(error.code).toBe('INVALID_TRACK_TYPE');
    expect(error.details).toEqual({ type: invalidType });
    expect(error instanceof Error).toBe(true);
    expect(error instanceof TrackError).toBe(true);
  });

  it('應該在嘗試創建無效軌道類型時拋出錯誤', () => {
    const invalidType = 'invalid-type';
    
    expect(() => {
      TrackType.fromString(invalidType);
    }).toThrow(InvalidTrackTypeError);
  });

  it('應該在使用有效軌道類型時不拋出錯誤', () => {
    const validTypes = ['audio', 'midi', 'bus'];
    
    validTypes.forEach(type => {
      expect(() => {
        TrackType.fromString(type);
      }).not.toThrow();
    });
  });
}); 