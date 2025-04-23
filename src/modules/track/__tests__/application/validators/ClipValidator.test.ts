import { ClipValidator } from '../../../application/validators/ClipValidator';
import { ClipId } from '../../../domain/value-objects/clips/ClipId';
import { TimeSignature } from '../../../domain/entities/clips/MidiClip';

describe('ClipValidator', () => {
  let validator: ClipValidator;

  beforeEach(() => {
    validator = new ClipValidator();
  });

  describe('validateCreateAudioClip', () => {
    it('當所有參數有效時應返回成功', () => {
      const result = validator.validateCreateAudioClip('sample-1', 0, 10, 0);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('當 sampleId 為空時應返回錯誤', () => {
      const result = validator.validateCreateAudioClip('', 0, 10, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Sample ID cannot be empty');
    });

    it('當開始時間為負數時應返回錯誤', () => {
      const result = validator.validateCreateAudioClip('sample-1', -1, 10, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Start time cannot be negative');
    });

    it('當持續時間小於等於0時應返回錯誤', () => {
      const result = validator.validateCreateAudioClip('sample-1', 0, 0, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Duration must be positive');
    });

    it('當偏移量為負數時應返回錯誤', () => {
      const result = validator.validateCreateAudioClip('sample-1', 0, 10, -1);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Offset cannot be negative');
    });
  });

  describe('validateCreateMidiClip', () => {
    const validTimeSignature: TimeSignature = { numerator: 4, denominator: 4 };

    it('當所有參數有效時應返回成功', () => {
      const result = validator.validateCreateMidiClip(0, 10, validTimeSignature);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('當開始時間為負數時應返回錯誤', () => {
      const result = validator.validateCreateMidiClip(-1, 10, validTimeSignature);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Start time cannot be negative');
    });

    it('當持續時間小於等於0時應返回錯誤', () => {
      const result = validator.validateCreateMidiClip(0, 0, validTimeSignature);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Duration must be positive');
    });

    it('當拍號分子小於1時應返回錯誤', () => {
      const result = validator.validateCreateMidiClip(0, 10, { numerator: 0, denominator: 4 });
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Time signature numerator must be positive');
    });

    it('當拍號分母不是2的冪時應返回錯誤', () => {
      const result = validator.validateCreateMidiClip(0, 10, { numerator: 4, denominator: 3 });
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Time signature denominator must be a power of 2');
    });
  });

  describe('validateUpdateClip', () => {
    const clipId = ClipId.create();

    it('當所有更新參數有效時應返回成功', () => {
      const updates = {
        startTime: 1,
        duration: 5,
        gain: 0.8
      };
      const result = validator.validateUpdateClip(clipId, updates);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('當 clipId 無效時應返回錯誤', () => {
      const updates = { startTime: 1 };
      const result = validator.validateUpdateClip(null as any, updates);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Invalid clip ID');
    });

    it('當開始時間為負數時應返回錯誤', () => {
      const updates = { startTime: -1 };
      const result = validator.validateUpdateClip(clipId, updates);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Start time cannot be negative');
    });

    it('當持續時間小於等於0時應返回錯誤', () => {
      const updates = { duration: 0 };
      const result = validator.validateUpdateClip(clipId, updates);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Duration must be positive');
    });

    it('當增益值超出範圍時應返回錯誤', () => {
      const updates = { gain: 1.5 };
      const result = validator.validateUpdateClip(clipId, updates);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Gain must be between 0 and 1');
    });
  });

  describe('validateDeleteClip', () => {
    const clipId = ClipId.create();

    it('當 clipId 有效時應返回成功', () => {
      const result = validator.validateDeleteClip(clipId);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('當 clipId 為空時應返回錯誤', () => {
      const result = validator.validateDeleteClip(null as any);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Invalid clip ID');
    });
  });
}); 