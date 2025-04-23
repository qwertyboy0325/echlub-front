import { TrackValidator, ValidationError, ValidationResult } from '../TrackValidator';
import { TrackId } from '../../../domain/value-objects/track/TrackId';
import { TrackType } from '../../../domain/value-objects/track/TrackType';
import { TrackRouting } from '../../../domain/value-objects/track/TrackRouting';

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
      expect(result.errors).toContainEqual(new ValidationError('name', 'Name is required'));
    });

    it('當類型為空時應該返回錯誤', () => {
      const result = validator.validateCreateTrack('Test Track', null as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(new ValidationError('type', 'Type is required'));
    });

    it('當名稱和類型都為空時應該返回多個錯誤', () => {
      const result = validator.validateCreateTrack('', null as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('validateRenameTrack', () => {
    const trackId = TrackId.create();

    it('當ID和新名稱都有效時應該通過驗證', () => {
      const result = validator.validateRenameTrack(trackId, 'New Name');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('當ID為空時應該返回錯誤', () => {
      const result = validator.validateRenameTrack(null as any, 'New Name');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(new ValidationError('trackId', 'Track ID is required'));
    });

    it('當新名稱為空時應該返回錯誤', () => {
      const result = validator.validateRenameTrack(trackId, '');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(new ValidationError('newName', 'New name is required'));
    });
  });

  describe('validateAddClipToTrack', () => {
    const trackId = TrackId.create();
    const clipId = 'test-clip-id';

    it('當ID和片段ID都有效時應該通過驗證', () => {
      const result = validator.validateAddClipToTrack(trackId, clipId);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('當音軌ID為空時應該返回錯誤', () => {
      const result = validator.validateAddClipToTrack(null as any, clipId);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(new ValidationError('trackId', 'Track ID is required'));
    });

    it('當片段ID為空時應該返回錯誤', () => {
      const result = validator.validateAddClipToTrack(trackId, '');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(new ValidationError('clipId', 'Clip ID is required'));
    });
  });

  describe('validateChangeTrackRouting', () => {
    const trackId = TrackId.create();
    const routing = new TrackRouting('input', 'output');

    it('當ID和路由都有效時應該通過驗證', () => {
      const result = validator.validateChangeTrackRouting(trackId, routing);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('當音軌ID為空時應該返回錯誤', () => {
      const result = validator.validateChangeTrackRouting(null as any, routing);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(new ValidationError('trackId', 'Track ID is required'));
    });

    it('當路由為空時應該返回錯誤', () => {
      const result = validator.validateChangeTrackRouting(trackId, null as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(new ValidationError('routing', 'Routing is required'));
    });
  });

  describe('validateAddPluginToTrack', () => {
    const trackId = TrackId.create();
    const pluginId = 'test-plugin-id';

    it('當ID和插件ID都有效時應該通過驗證', () => {
      const result = validator.validateAddPluginToTrack(trackId, pluginId);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('當音軌ID為空時應該返回錯誤', () => {
      const result = validator.validateAddPluginToTrack(null as any, pluginId);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(new ValidationError('trackId', 'Track ID is required'));
    });

    it('當插件ID為空時應該返回錯誤', () => {
      const result = validator.validateAddPluginToTrack(trackId, '');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(new ValidationError('pluginId', 'Plugin ID is required'));
    });
  });

  describe('validateAddInputTrackToBus', () => {
    const busTrackId = TrackId.create();
    const inputTrackId = TrackId.create();

    it('當總線音軌ID和輸入音軌ID都有效時應該通過驗證', () => {
      const result = validator.validateAddInputTrackToBus(busTrackId, inputTrackId);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('當總線音軌ID為空時應該返回錯誤', () => {
      const result = validator.validateAddInputTrackToBus(null as any, inputTrackId);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(new ValidationError('busTrackId', 'Bus track ID is required'));
    });

    it('當輸入音軌ID為空時應該返回錯誤', () => {
      const result = validator.validateAddInputTrackToBus(busTrackId, null as any);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(new ValidationError('inputTrackId', 'Input track ID is required'));
    });
  });

  describe('validateRemoveClipFromTrack', () => {
    it('應該使用與 validateAddClipToTrack 相同的驗證邏輯', () => {
      const trackId = TrackId.create();
      const clipId = 'test-clip-id';
      
      const addResult = validator.validateAddClipToTrack(trackId, clipId);
      const removeResult = validator.validateRemoveClipFromTrack(trackId, clipId);
      
      expect(removeResult.isValid).toBe(addResult.isValid);
      expect(removeResult.errors).toEqual(addResult.errors);
    });
  });

  describe('validateRemovePluginFromTrack', () => {
    it('應該使用與 validateAddPluginToTrack 相同的驗證邏輯', () => {
      const trackId = TrackId.create();
      const pluginId = 'test-plugin-id';
      
      const addResult = validator.validateAddPluginToTrack(trackId, pluginId);
      const removeResult = validator.validateRemovePluginFromTrack(trackId, pluginId);
      
      expect(removeResult.isValid).toBe(addResult.isValid);
      expect(removeResult.errors).toEqual(addResult.errors);
    });
  });

  describe('validateRemoveInputTrackFromBus', () => {
    it('應該使用與 validateAddInputTrackToBus 相同的驗證邏輯', () => {
      const busTrackId = TrackId.create();
      const inputTrackId = TrackId.create();
      
      const addResult = validator.validateAddInputTrackToBus(busTrackId, inputTrackId);
      const removeResult = validator.validateRemoveInputTrackFromBus(busTrackId, inputTrackId);
      
      expect(removeResult.isValid).toBe(addResult.isValid);
      expect(removeResult.errors).toEqual(addResult.errors);
    });
  });
}); 