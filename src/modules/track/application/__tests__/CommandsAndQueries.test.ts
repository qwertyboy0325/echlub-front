import { TrackId } from '../../domain/value-objects/track/TrackId';
import { ClipId } from '../../domain/value-objects/clips/ClipId';
import { TrackType } from '../../domain/value-objects/track/TrackType';
import { TrackRouting } from '../../domain/value-objects/track/TrackRouting';
import { PluginReference } from '../../domain/value-objects/plugin/PluginReference';
import { MidiNote } from '../../domain/value-objects/note/MidiNote';

// Commands
import { CreateTrackCommand } from '../commands/CreateTrackCommand';
import { RenameTrackCommand } from '../commands/RenameTrackCommand';
import { AddClipToTrackCommand } from '../commands/AddClipToTrackCommand';
import { RemoveClipFromTrackCommand } from '../commands/RemoveClipFromTrackCommand';
import { AddPluginToTrackCommand } from '../commands/AddPluginToTrackCommand';
import { RemovePluginFromTrackCommand } from '../commands/RemovePluginFromTrackCommand';
import { AddNoteToClipCommand } from '../commands/AddNoteToClipCommand';
import { UpdateNoteInClipCommand } from '../commands/UpdateNoteInClipCommand';
import { RemoveNoteFromClipCommand } from '../commands/RemoveNoteFromClipCommand';

// Queries
import { GetTrackByIdQuery } from '../queries/GetTrackByIdQuery';
import { GetTrackPluginsQuery } from '../queries/GetTrackPluginsQuery';
import { GetTrackRoutingQuery } from '../queries/GetTrackRoutingQuery';
import { GetTrackGainQuery } from '../queries/GetTrackGainQuery';
import { GetTrackNameQuery } from '../queries/GetTrackNameQuery';
import { GetTrackClipsQuery } from '../queries/GetTrackClipsQuery';
import { ListTracksQuery } from '../queries/ListTracksQuery';

describe('Track Commands', () => {
  describe('CreateTrackCommand', () => {
    it('應正確初始化創建軌道命令', () => {
      const name = 'Test Track';
      const type = TrackType.AUDIO;
      const command = new CreateTrackCommand(name, type);

      expect(command.name).toBe(name);
      expect(command.type).toBe(type);
    });
  });

  describe('RenameTrackCommand', () => {
    it('應正確初始化重命名軌道命令', () => {
      const trackId = TrackId.create();
      const newName = 'New Track Name';
      const command = new RenameTrackCommand(trackId, newName);

      expect(command.trackId).toBe(trackId);
      expect(command.newName).toBe(newName);
    });
  });

  describe('AddClipToTrackCommand', () => {
    it('應正確初始化添加片段命令', () => {
      const trackId = TrackId.create();
      const clipId = ClipId.create();
      const command = new AddClipToTrackCommand(trackId, clipId);

      expect(command.trackId).toBe(trackId);
      expect(command.clipId).toBe(clipId);
    });
  });

  describe('RemoveClipFromTrackCommand', () => {
    it('應正確初始化移除片段命令', () => {
      const trackId = TrackId.create();
      const clipId = ClipId.create();
      const command = new RemoveClipFromTrackCommand(trackId, clipId);

      expect(command.trackId).toBe(trackId);
      expect(command.clipId).toBe(clipId);
    });
  });

  describe('AddPluginToTrackCommand', () => {
    it('應正確初始化添加插件命令', () => {
      const trackId = TrackId.create();
      const pluginRef = new PluginReference('plugin-1');
      const command = new AddPluginToTrackCommand(trackId, pluginRef);

      expect(command.trackId).toBe(trackId);
      expect(command.pluginRef).toBe(pluginRef);
    });
  });

  describe('RemovePluginFromTrackCommand', () => {
    it('應正確初始化移除插件命令', () => {
      const trackId = TrackId.create();
      const pluginRef = new PluginReference('plugin-1');
      const command = new RemovePluginFromTrackCommand(trackId, pluginRef);

      expect(command.trackId).toBe(trackId);
      expect(command.pluginRef).toBe(pluginRef);
    });
  });

  describe('MIDI Note Commands', () => {
    const clipId = ClipId.create();
    const noteProps = {
      startTime: 0,
      duration: 1,
      noteNumber: 60,
      velocity: 100
    };

    it('應正確初始化添加音符命令', () => {
      const command = new AddNoteToClipCommand(clipId, noteProps);
      expect(command.clipId).toBe(clipId);
      expect(command.noteProps).toEqual(noteProps);
    });

    it('應正確初始化更新音符命令', () => {
      const noteIndex = 0;
      const command = new UpdateNoteInClipCommand(clipId, noteIndex, noteProps);
      expect(command.clipId).toBe(clipId);
      expect(command.noteIndex).toBe(noteIndex);
      expect(command.noteProps).toEqual(noteProps);
    });

    it('應正確初始化移除音符命令', () => {
      const noteIndex = 0;
      const command = new RemoveNoteFromClipCommand(clipId, noteIndex);
      expect(command.clipId).toBe(clipId);
      expect(command.noteIndex).toBe(noteIndex);
    });
  });
});

describe('Track Queries', () => {
  const trackId = TrackId.create();

  describe('GetTrackByIdQuery', () => {
    it('應正確初始化獲取軌道查詢', () => {
      const query = new GetTrackByIdQuery(trackId);
      expect(query.trackId).toBe(trackId);
    });
  });

  describe('GetTrackPluginsQuery', () => {
    it('應正確初始化獲取插件查詢', () => {
      const query = new GetTrackPluginsQuery(trackId);
      expect(query.trackId).toBe(trackId);
    });
  });

  describe('GetTrackRoutingQuery', () => {
    it('應正確初始化獲取路由查詢', () => {
      const query = new GetTrackRoutingQuery(trackId);
      expect(query.trackId).toBe(trackId);
    });
  });

  describe('GetTrackGainQuery', () => {
    it('應正確初始化獲取音量查詢', () => {
      const query = new GetTrackGainQuery(trackId);
      expect(query.trackId).toBe(trackId);
    });
  });

  describe('GetTrackNameQuery', () => {
    it('應正確初始化獲取名稱查詢', () => {
      const query = new GetTrackNameQuery(trackId);
      expect(query.trackId).toBe(trackId);
    });
  });

  describe('GetTrackClipsQuery', () => {
    it('應正確初始化獲取片段查詢（無時間範圍）', () => {
      const query = new GetTrackClipsQuery(trackId);
      expect(query.trackId).toBe(trackId);
      expect(query.startTime).toBeUndefined();
      expect(query.endTime).toBeUndefined();
    });

    it('應正確初始化獲取片段查詢（有時間範圍）', () => {
      const startTime = 0;
      const endTime = 10;
      const query = new GetTrackClipsQuery(trackId, startTime, endTime);
      expect(query.trackId).toBe(trackId);
      expect(query.startTime).toBe(startTime);
      expect(query.endTime).toBe(endTime);
    });
  });

  describe('ListTracksQuery', () => {
    it('應正確初始化無過濾條件的列表查詢', () => {
      const query = new ListTracksQuery();
      expect(query.filter).toBeUndefined();
    });

    it('應正確初始化有過濾條件的列表查詢', () => {
      const filter = {
        type: 'audio' as const,
        muted: true,
        solo: false
      };
      const query = new ListTracksQuery(filter);
      expect(query.filter).toEqual(filter);
    });
  });
}); 