import { TrackValidator } from '../TrackValidator';
import { TrackId } from '../../../domain/value-objects/TrackId';
import { TrackType } from '../../../domain/value-objects/TrackType';
import { TrackRouting } from '../../../domain/value-objects/TrackRouting';

describe('TrackValidator', () => {
  let validator: TrackValidator;

  beforeEach(() => {
    validator = new TrackValidator();
  });

  describe('validateCreateTrack', () => {
    it('當名稱和類型都有效時應該通過驗證', () => {
      const result = validator.validateCreateTrack('Test Track', TrackType.AUDIO);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('當名稱為空時應該返回錯誤', () => {
      const result = validator.validateCreateTrack('', TrackType.AUDIO);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('name');
      expect(result.errors[0].message).toBe('Name is required');
    });

    it('當類型為空時應該返回錯誤', () => {
      const result = validator.validateCreateTrack('Test Track', null as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('type');
      expect(result.errors[0].message).toBe('Type is required');
    });

    it('當名稱和類型都為空時應該返回多個錯誤', () => {
      const result = validator.validateCreateTrack('', null as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('validateRenameTrack', () => {
    it('當 ID 和新名稱都有效時應該通過驗證', () => {
      const result = validator.validateRenameTrack(TrackId.create(), 'New Name');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('當 ID 為空時應該返回錯誤', () => {
      const result = validator.validateRenameTrack(null as any, 'New Name');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('trackId');
    });

    it('當新名稱為空時應該返回錯誤', () => {
      const result = validator.validateRenameTrack(TrackId.create(), '');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('newName');
    });
  });

  describe('validateAddClipToTrack', () => {
    it('當音軌 ID 和片段 ID 都有效時應該通過驗證', () => {
      const result = validator.validateAddClipToTrack(TrackId.create(), 'clip-1');
      expect(result.isValid).toBe(true);
    });

    it('當音軌 ID 為空時應該返回錯誤', () => {
      const result = validator.validateAddClipToTrack(null as any, 'clip-1');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('trackId');
    });

    it('當片段 ID 為空時應該返回錯誤', () => {
      const result = validator.validateAddClipToTrack(TrackId.create(), '');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('clipId');
    });
  });

  describe('validateChangeTrackRouting', () => {
    it('當音軌 ID 和路由設置都有效時應該通過驗證', () => {
      const result = validator.validateChangeTrackRouting(
        TrackId.create(),
        new TrackRouting('input-1', 'output-1')
      );
      expect(result.isValid).toBe(true);
    });

    it('當音軌 ID 為空時應該返回錯誤', () => {
      const result = validator.validateChangeTrackRouting(
        null as any,
        new TrackRouting('input-1', 'output-1')
      );
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('trackId');
    });

    it('當路由設置為空時應該返回錯誤', () => {
      const result = validator.validateChangeTrackRouting(
        TrackId.create(),
        null as any
      );
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('routing');
    });
  });

  describe('validateAddPluginToTrack', () => {
    it('當音軌 ID 和插件 ID 都有效時應該通過驗證', () => {
      const result = validator.validateAddPluginToTrack(TrackId.create(), 'plugin-1');
      expect(result.isValid).toBe(true);
    });

    it('當音軌 ID 為空時應該返回錯誤', () => {
      const result = validator.validateAddPluginToTrack(null as any, 'plugin-1');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('trackId');
    });

    it('當插件 ID 為空時應該返回錯誤', () => {
      const result = validator.validateAddPluginToTrack(TrackId.create(), '');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('pluginId');
    });
  });

  describe('validateAddInputTrackToBus', () => {
    it('當總線音軌 ID 和輸入音軌 ID 都有效時應該通過驗證', () => {
      const result = validator.validateAddInputTrackToBus(
        TrackId.create(),
        TrackId.create()
      );
      expect(result.isValid).toBe(true);
    });

    it('當總線音軌 ID 為空時應該返回錯誤', () => {
      const result = validator.validateAddInputTrackToBus(
        null as any,
        TrackId.create()
      );
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('busTrackId');
    });

    it('當輸入音軌 ID 為空時應該返回錯誤', () => {
      const result = validator.validateAddInputTrackToBus(
        TrackId.create(),
        null as any
      );
      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('inputTrackId');
    });
  });

  describe('ValidationResult', () => {
    it('當沒有錯誤時 isValid 應該返回 true', () => {
      const result = validator.validateCreateTrack('Test Track', TrackType.AUDIO);
      expect(result.isValid).toBe(true);
    });

    it('當有錯誤時 isValid 應該返回 false', () => {
      const result = validator.validateCreateTrack('', null as any);
      expect(result.isValid).toBe(false);
    });

    it('應該能夠訪問錯誤列表', () => {
      const result = validator.validateCreateTrack('', null as any);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(result.errors.length).toBe(2);
    });
  });
}); 