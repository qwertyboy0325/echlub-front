import { TrackId } from '../../../domain/value-objects/TrackId';
import { TrackType } from '../../../domain/value-objects/TrackType';
import { TrackRouting } from '../../../domain/value-objects/TrackRouting';
import { AudioClipId } from '../../../domain/value-objects/AudioClipId';
import { PluginReference } from '../../../domain/value-objects/PluginReference';
import { CreateTrackCommand } from '../CreateTrackCommand';
import { RenameTrackCommand } from '../RenameTrackCommand';
import { AddClipToTrackCommand } from '../AddClipToTrackCommand';
import { RemoveClipFromTrackCommand } from '../RemoveClipFromTrackCommand';
import { ChangeTrackRoutingCommand } from '../ChangeTrackRoutingCommand';
import { AddPluginToTrackCommand } from '../AddPluginToTrackCommand';
import { RemovePluginFromTrackCommand } from '../RemovePluginFromTrackCommand';
import { AddInputTrackToBusCommand } from '../AddInputTrackToBusCommand';
import { RemoveInputTrackFromBusCommand } from '../RemoveInputTrackFromBusCommand';

describe('音軌命令', () => {
  let trackId: TrackId;
  let routing: TrackRouting;
  let clipId: AudioClipId;
  let pluginRef: PluginReference;

  beforeEach(() => {
    trackId = TrackId.create();
    routing = new TrackRouting('input-1', 'output-1');
    clipId = AudioClipId.fromString('audio-clip-1');
    pluginRef = PluginReference.create('plugin-1');
  });

  describe('CreateTrackCommand', () => {
    it('應該正確初始化創建音軌命令', () => {
      const command = new CreateTrackCommand('Test Track', TrackType.AUDIO);
      
      expect(command.name).toBe('Test Track');
      expect(command.type).toBe(TrackType.AUDIO);
    });
  });

  describe('RenameTrackCommand', () => {
    it('應該正確初始化重命名音軌命令', () => {
      const command = new RenameTrackCommand(trackId, 'New Name');
      
      expect(command.trackId).toBe(trackId);
      expect(command.newName).toBe('New Name');
    });
  });

  describe('AddClipToTrackCommand', () => {
    it('應該正確初始化添加片段命令', () => {
      const command = new AddClipToTrackCommand(trackId, clipId);
      
      expect(command.trackId).toBe(trackId);
      expect(command.clipId).toBe(clipId);
    });
  });

  describe('RemoveClipFromTrackCommand', () => {
    it('應該正確初始化移除片段命令', () => {
      const command = new RemoveClipFromTrackCommand(trackId, clipId);
      
      expect(command.trackId).toBe(trackId);
      expect(command.clipId).toBe(clipId);
    });
  });

  describe('ChangeTrackRoutingCommand', () => {
    it('應該正確初始化更改路由命令', () => {
      const command = new ChangeTrackRoutingCommand(trackId, routing);
      
      expect(command.trackId).toBe(trackId);
      expect(command.routing).toBe(routing);
    });
  });

  describe('AddPluginToTrackCommand', () => {
    it('應該正確初始化添加插件命令', () => {
      const command = new AddPluginToTrackCommand(trackId, pluginRef);
      
      expect(command.trackId).toBe(trackId);
      expect(command.pluginRef).toBe(pluginRef);
    });
  });

  describe('RemovePluginFromTrackCommand', () => {
    it('應該正確初始化移除插件命令', () => {
      const command = new RemovePluginFromTrackCommand(trackId, pluginRef);
      
      expect(command.trackId).toBe(trackId);
      expect(command.pluginRef).toBe(pluginRef);
    });
  });

  describe('AddInputTrackToBusCommand', () => {
    it('應該正確初始化添加輸入音軌命令', () => {
      const inputTrackId = TrackId.create();
      const command = new AddInputTrackToBusCommand(trackId, inputTrackId);
      
      expect(command.busTrackId).toBe(trackId);
      expect(command.inputTrackId).toBe(inputTrackId);
    });
  });

  describe('RemoveInputTrackFromBusCommand', () => {
    it('應該正確初始化移除輸入音軌命令', () => {
      const inputTrackId = TrackId.create();
      const command = new RemoveInputTrackFromBusCommand(trackId, inputTrackId);
      
      expect(command.busTrackId).toBe(trackId);
      expect(command.inputTrackId).toBe(inputTrackId);
    });
  });
}); 