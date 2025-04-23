import { TrackId } from '../../value-objects/track/TrackId';
import { TrackType } from '../../value-objects/track/TrackType';
import { TrackRouting } from '../../value-objects/track/TrackRouting';
import { TrackNameChangedEvent } from '../TrackNameChangedEvent';
import { TrackGainChangedEvent } from '../TrackGainChangedEvent';
import { TrackRoutingChangedEvent } from '../TrackRoutingChangedEvent';
import { TrackMuteChangedEvent } from '../TrackMuteChangedEvent';
import { TrackSoloChangedEvent } from '../TrackSoloChangedEvent';
import { TrackCreatedEvent } from '../TrackCreatedEvent';
import { TrackUpdatedEvent } from '../TrackUpdatedEvent';
import { TrackDeletedEvent } from '../TrackDeletedEvent';
import { TrackRenamedEvent } from '../TrackRenamedEvent';
import { PluginAddedToTrackEvent } from '../PluginAddedToTrackEvent';
import { PluginRemovedFromTrackEvent } from '../PluginRemovedFromTrackEvent';
import { PluginReference } from '../../value-objects/plugin/PluginReference';
import { PluginInstanceId } from '../../../../plugin/domain/value-objects/PluginInstanceId';
import { AudioTrack } from '../../entities/AudioTrack';
import { ClipId } from '../../value-objects/clips/ClipId';
import { MidiNote } from '../../value-objects/note/MidiNote';
import { ClipCreatedEvent } from '../ClipCreatedEvent';
import { ClipAddedToTrackEvent } from '../ClipAddedToTrackEvent';
import { ClipRemovedFromTrackEvent } from '../ClipRemovedFromTrackEvent';
import { ClipsCreatedEvent } from '../ClipsCreatedEvent';
import { ClipsDeletedEvent } from '../ClipsDeletedEvent';
import { NoteAddedToClipEvent } from '../NoteAddedToClipEvent';
import { NoteUpdatedInClipEvent } from '../NoteUpdatedInClipEvent';
import { NoteRemovedFromClipEvent } from '../NoteRemovedFromClipEvent';
import { AudioClip } from '../../entities/clips/AudioClip';
import { MidiClip } from '../../entities/clips/MidiClip';
import { AudioClipUpdatedEvent } from '../AudioClipUpdatedEvent';
import { ClipsUpdatedEvent } from '../ClipsUpdatedEvent';
import { InputTrackAddedToBusEvent } from '../InputTrackAddedToBusEvent';

describe('Track Domain Events', () => {
  let trackId: TrackId;
  let routing: TrackRouting;
  let track: AudioTrack;
  let pluginId: string;
  let clipId: ClipId;

  beforeEach(() => {
    trackId = TrackId.create();
    routing = new TrackRouting('input', 'output');
    track = new AudioTrack(trackId, 'Test Track', routing);
    pluginId = 'test-plugin-id';
    clipId = ClipId.create();
  });

  describe('TrackNameChangedEvent', () => {
    it('應該正確初始化名稱變更事件', () => {
      const oldName = 'Old Track';
      const newName = 'New Track';
      const event = new TrackNameChangedEvent(trackId, oldName, newName);

      expect(event.eventType).toBe('track:name:changed');
      expect(event.aggregateId).toBe(trackId.toString());
      expect(event.oldName).toBe(oldName);
      expect(event.newName).toBe(newName);
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.getEventName()).toBe('track:name:changed');
    });
  });

  describe('TrackGainChangedEvent', () => {
    it('應該正確初始化音量變更事件', () => {
      const oldGain = 0.5;
      const newGain = 0.8;
      const event = new TrackGainChangedEvent(trackId, oldGain, newGain);

      expect(event.eventType).toBe('track:gain:changed');
      expect(event.aggregateId).toBe(trackId.toString());
      expect(event.oldGain).toBe(oldGain);
      expect(event.newGain).toBe(newGain);
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.getEventName()).toBe('track:gain:changed');
    });
  });

  describe('TrackRoutingChangedEvent', () => {
    it('應該正確初始化路由變更事件', () => {
      const oldRouting = new TrackRouting('input-1', 'output-1');
      const newRouting = new TrackRouting('input-2', 'output-2');
      const event = new TrackRoutingChangedEvent(trackId, oldRouting, newRouting);

      expect(event.eventType).toBe('track:routing:changed');
      expect(event.aggregateId).toBe(trackId.toString());
      expect(event.oldRouting).toBe(oldRouting);
      expect(event.newRouting).toBe(newRouting);
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.getEventName()).toBe('track:routing:changed');
    });
  });

  describe('TrackMuteChangedEvent', () => {
    it('應該正確初始化靜音狀態變更事件', () => {
      const oldMuted = false;
      const newMuted = true;
      const event = new TrackMuteChangedEvent(trackId, oldMuted, newMuted);

      expect(event.eventType).toBe('track:mute:changed');
      expect(event.aggregateId).toBe(trackId.toString());
      expect(event.oldMuted).toBe(oldMuted);
      expect(event.newMuted).toBe(newMuted);
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.getEventName()).toBe('track:mute:changed');
    });
  });

  describe('TrackSoloChangedEvent', () => {
    it('應該正確初始化獨奏狀態變更事件', () => {
      const oldSolo = false;
      const newSolo = true;
      const event = new TrackSoloChangedEvent(trackId, oldSolo, newSolo);

      expect(event.eventType).toBe('track:solo:changed');
      expect(event.aggregateId).toBe(trackId.toString());
      expect(event.oldSolo).toBe(oldSolo);
      expect(event.newSolo).toBe(newSolo);
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.getEventName()).toBe('track:solo:changed');
    });
  });

  describe('TrackCreatedEvent', () => {
    it('應該正確初始化事件屬性', () => {
      const name = 'New Track';
      const type = TrackType.AUDIO;
      const event = new TrackCreatedEvent(trackId, name, type);

      expect(event.eventType).toBe('track:created');
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.aggregateId).toBe(trackId.toString());
      expect(event.name).toBe(name);
      expect(event.type).toBe(type);
    });
  });

  describe('TrackUpdatedEvent', () => {
    it('應該正確初始化事件屬性', () => {
      const event = new TrackUpdatedEvent(trackId, track);

      expect(event.eventType).toBe('track:updated');
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.aggregateId).toBe(trackId.toString());
      expect(event.payload.track).toBe(track);
    });
  });

  describe('TrackDeletedEvent', () => {
    it('應該正確初始化事件屬性', () => {
      const event = new TrackDeletedEvent(trackId);

      expect(event.eventType).toBe('track:deleted');
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.aggregateId).toBe(trackId.toString());
    });
  });

  describe('TrackRenamedEvent', () => {
    it('應該正確初始化事件屬性', () => {
      const newName = 'New Track Name';
      const event = new TrackRenamedEvent(trackId, newName);

      expect(event.eventType).toBe('track:renamed');
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.aggregateId).toBe(trackId.toString());
      expect(event.payload.newName).toBe(newName);
    });
  });

  describe('PluginAddedToTrackEvent', () => {
    it('應該正確初始化事件屬性', () => {
      const pluginInstanceId = PluginInstanceId.fromString(pluginId);
      const event = new PluginAddedToTrackEvent(trackId, pluginInstanceId);

      expect(event.eventType).toBe('track:plugin:added');
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.aggregateId).toBe(trackId.toString());
      expect(event.payload.pluginId).toBe(pluginId);
      expect(event.getEventName()).toBe('plugin:added');
    });
  });

  describe('PluginRemovedFromTrackEvent', () => {
    it('應該正確初始化事件屬性', () => {
      const pluginRef = new PluginReference(pluginId);
      const event = new PluginRemovedFromTrackEvent(trackId, pluginRef);

      expect(event.eventType).toBe('track:plugin:removed');
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.aggregateId).toBe(trackId.toString());
      expect(event.payload.pluginId).toBe(pluginId);
      expect(event.getEventName()).toBe('plugin:removed');
    });
  });

  describe('Clip Events', () => {
    let audioClip: AudioClip;
    let midiClip: MidiClip;

    beforeEach(() => {
      audioClip = new AudioClip(clipId, 'sample-1', 0, 4);
      midiClip = new MidiClip(clipId, 0, 4, [], { numerator: 4, denominator: 4 });
    });

    describe('ClipCreatedEvent', () => {
      it('應該正確初始化音頻片段創建事件', () => {
        const event = new ClipCreatedEvent(clipId, audioClip, 'audio');

        expect(event.eventType).toBe('track:clip:created');
        expect(event.aggregateId).toBe(clipId.toString());
        expect(event.payload.clipId).toBe(clipId.toString());
        expect(event.payload.type).toBe('audio');
        expect(event.payload.startTime).toBe(0);
        expect(event.payload.duration).toBe(4);
        expect(event.timestamp).toBeInstanceOf(Date);
        expect(event.getEventName()).toBe('clip:created');
      });

      it('應該正確初始化MIDI片段創建事件', () => {
        const event = new ClipCreatedEvent(clipId, midiClip, 'midi');

        expect(event.eventType).toBe('track:clip:created');
        expect(event.aggregateId).toBe(clipId.toString());
        expect(event.payload.clipId).toBe(clipId.toString());
        expect(event.payload.type).toBe('midi');
        expect(event.payload.startTime).toBe(0);
        expect(event.payload.duration).toBe(4);
        expect(event.timestamp).toBeInstanceOf(Date);
        expect(event.getEventName()).toBe('clip:created');
      });
    });

    describe('ClipAddedToTrackEvent', () => {
      it('應該正確初始化片段添加事件', () => {
        const event = new ClipAddedToTrackEvent(trackId, clipId);

        expect(event.eventType).toBe('track:clip:added');
        expect(event.aggregateId).toBe(trackId.toString());
        expect(event.payload.trackId).toBe(trackId.toString());
        expect(event.payload.clipId).toBe(clipId.toString());
        expect(event.timestamp).toBeInstanceOf(Date);
        expect(event.getEventName()).toBe('clip:added');
      });
    });

    describe('ClipRemovedFromTrackEvent', () => {
      it('應該正確初始化音頻片段移除事件', () => {
        const event = new ClipRemovedFromTrackEvent(trackId, clipId, 'audio');

        expect(event.eventType).toBe('track:clip:removed');
        expect(event.aggregateId).toBe(trackId.toString());
        expect(event.payload.clipId).toBe(clipId.toString());
        expect(event.payload.clipType).toBe('audio');
        expect(event.timestamp).toBeInstanceOf(Date);
        expect(event.getEventName()).toBe('clip:removed');
      });

      it('應該正確初始化MIDI片段移除事件', () => {
        const event = new ClipRemovedFromTrackEvent(trackId, clipId, 'midi');

        expect(event.eventType).toBe('track:clip:removed');
        expect(event.aggregateId).toBe(trackId.toString());
        expect(event.payload.clipId).toBe(clipId.toString());
        expect(event.payload.clipType).toBe('midi');
        expect(event.timestamp).toBeInstanceOf(Date);
        expect(event.getEventName()).toBe('clip:removed');
      });
    });

    describe('ClipsCreatedEvent', () => {
      it('應該正確初始化多個片段創建事件', () => {
        const clips = [
          { clipId, type: 'audio' as const }
        ];
        const event = new ClipsCreatedEvent(trackId, clips);

        expect(event.eventType).toBe('track:clips:created');
        expect(event.aggregateId).toBe(trackId.toString());
        expect(event.payload.clips[0].id).toBe(clipId.toString());
        expect(event.payload.clips[0].type).toBe('audio');
        expect(event.getEventName()).toBe('clips:created');
      });
    });

    describe('ClipsDeletedEvent', () => {
      it('應該正確初始化多個片段刪除事件', () => {
        const clips = [clipId];
        const event = new ClipsDeletedEvent(clips);

        expect(event.eventType).toBe('track:clips:deleted');
        expect(event.aggregateId).toBe(clipId.toString());
        expect(event.payload.clipIds).toEqual(clips.map(id => id.toString()));
        expect(event.getEventName()).toBe('clips:deleted');
      });
    });
  });

  describe('MIDI Note Events', () => {
    let note: MidiNote;

    beforeEach(() => {
      note = MidiNote.create({
        startTime: 0,
        duration: 1,
        noteNumber: 60,
        velocity: 100
      });
    });

    describe('NoteAddedToClipEvent', () => {
      it('應該正確初始化音符添加事件', () => {
        const event = new NoteAddedToClipEvent(clipId, note);

        expect(event.eventType).toBe('clip:note:added');
        expect(event.aggregateId).toBe(clipId.toString());
        expect(event.payload.note).toEqual(note.toJSON());
        expect(event.timestamp).toBeInstanceOf(Date);
        expect(event.getEventName()).toBe('note:added');
      });
    });

    describe('NoteUpdatedInClipEvent', () => {
      it('應該正確初始化音符更新事件', () => {
        const noteIndex = 0;
        const event = new NoteUpdatedInClipEvent(clipId, noteIndex, note);

        expect(event.eventType).toBe('clip:note:updated');
        expect(event.aggregateId).toBe(clipId.toString());
        expect(event.payload.noteIndex).toBe(noteIndex);
        expect(event.payload.note).toEqual(note.toJSON());
        expect(event.timestamp).toBeInstanceOf(Date);
        expect(event.getEventName()).toBe('note:updated');
      });
    });

    describe('NoteRemovedFromClipEvent', () => {
      it('應該正確初始化音符移除事件', () => {
        const noteIndex = 0;
        const event = new NoteRemovedFromClipEvent(clipId, noteIndex);

        expect(event.eventType).toBe('clip:note:removed');
        expect(event.aggregateId).toBe(clipId.toString());
        expect(event.payload.noteIndex).toBe(noteIndex);
        expect(event.timestamp).toBeInstanceOf(Date);
        expect(event.getEventName()).toBe('note:removed');
      });
    });
  });

  describe('AudioClipUpdatedEvent', () => {
    it('應該正確初始化音頻片段更新事件', () => {
      const changes = {
        gain: 0.8,
        offset: 0.5,
        fadeIn: { duration: 0.1, curve: 'linear' as const },
        fadeOut: { duration: 0.2, curve: 'exponential' as const }
      };
      
      const event = new AudioClipUpdatedEvent(clipId.toString(), changes);

      expect(event.eventType).toBe('track:clip:audio:updated');
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.aggregateId).toBe(clipId.toString());
      expect(event.payload).toEqual(changes);
      expect(event.getEventName()).toBe('audio:updated');
    });
  });

  describe('ClipsUpdatedEvent', () => {
    it('應該正確初始化多個片段更新事件', () => {
      const clips = [
        { clipId, type: 'audio' as const }
      ];
      const event = new ClipsUpdatedEvent(clips);

      expect(event.eventType).toBe('track:clips:updated');
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.aggregateId).toBe(clipId.toString());
      expect(event.payload.clips[0].id).toBe(clipId.toString());
      expect(event.payload.clips[0].type).toBe('audio');
      expect(event.getEventName()).toBe('clips:updated');
    });
  });

  describe('InputTrackAddedToBusEvent', () => {
    it('應該正確初始化輸入軌道添加到匯流排事件', () => {
      const busTrackId = TrackId.create();
      const inputTrackId = TrackId.create();
      
      const event = new InputTrackAddedToBusEvent(busTrackId, inputTrackId);

      expect(event.eventType).toBe('track:input:added');
      expect(event.timestamp).toBeInstanceOf(Date);
      expect(event.aggregateId).toBe(busTrackId.toString());
      expect(event.payload.inputTrackId).toBe(inputTrackId.toString());
      expect(event.getEventName()).toBe('input:added');
    });
  });

  describe('事件時間戳', () => {
    it('所有事件應該有正確的時間戳', () => {
      const events = [
        new TrackNameChangedEvent(trackId, 'Old Name', 'New Name'),
        new TrackGainChangedEvent(trackId, 0.5, 1.0),
        new TrackRoutingChangedEvent(trackId, new TrackRouting('old-in', 'old-out'), new TrackRouting('new-in', 'new-out')),
        new TrackMuteChangedEvent(trackId, false, true),
        new TrackSoloChangedEvent(trackId, false, true),
        new PluginAddedToTrackEvent(trackId, PluginInstanceId.fromString(pluginId)),
        new PluginRemovedFromTrackEvent(trackId, new PluginReference(pluginId)),
        new ClipCreatedEvent(clipId, new AudioClip(clipId, 'sample-1', 0, 4), 'audio'),
        new ClipAddedToTrackEvent(trackId, clipId),
        new ClipRemovedFromTrackEvent(trackId, clipId, 'audio'),
        new ClipsCreatedEvent(trackId, [{ clipId, type: 'audio' as const }]),
        new ClipsDeletedEvent([clipId]),
        new NoteAddedToClipEvent(clipId, MidiNote.create({
          startTime: 0,
          noteNumber: 60,
          velocity: 100,
          duration: 1
        })),
        new NoteUpdatedInClipEvent(clipId, 0, MidiNote.create({
          startTime: 1,
          noteNumber: 61,
          velocity: 90,
          duration: 2
        })),
        new NoteRemovedFromClipEvent(clipId, 0),
        new AudioClipUpdatedEvent(clipId.toString(), { gain: 0.8 }),
        new ClipsUpdatedEvent([{ clipId, type: 'audio' as const }]),
        new InputTrackAddedToBusEvent(TrackId.create(), TrackId.create())
      ];

      events.forEach(event => {
        expect(event.timestamp).toBeInstanceOf(Date);
        expect(event.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
      });
    });
  });

  describe('All Events', () => {
    it('應該正確初始化所有事件類型', () => {
      const events = [
        new TrackCreatedEvent(trackId, 'Test Track', TrackType.AUDIO),
        new TrackUpdatedEvent(trackId, track),
        new TrackDeletedEvent(trackId),
        new TrackRenamedEvent(trackId, 'New Name'),
        new TrackNameChangedEvent(trackId, 'Old Name', 'New Name'),
        new TrackGainChangedEvent(trackId, 0.5, 0.8),
        new TrackRoutingChangedEvent(trackId, routing, routing),
        new TrackMuteChangedEvent(trackId, false, true),
        new TrackSoloChangedEvent(trackId, false, true),
        new PluginAddedToTrackEvent(trackId, PluginInstanceId.fromString(pluginId)),
        new PluginRemovedFromTrackEvent(trackId, new PluginReference(pluginId)),
        new ClipCreatedEvent(clipId, new AudioClip(clipId, 'sample-1', 0, 4), 'audio'),
        new ClipAddedToTrackEvent(trackId, clipId),
        new ClipRemovedFromTrackEvent(trackId, clipId, 'audio'),
        new ClipsCreatedEvent(trackId, [{ clipId, type: 'audio' as const }]),
        new ClipsDeletedEvent([clipId]),
        new NoteAddedToClipEvent(clipId, MidiNote.create({
          startTime: 0,
          noteNumber: 60,
          velocity: 100,
          duration: 1
        })),
        new NoteUpdatedInClipEvent(clipId, 0, MidiNote.create({
          startTime: 1,
          noteNumber: 61,
          velocity: 90,
          duration: 2
        })),
        new NoteRemovedFromClipEvent(clipId, 0),
        new AudioClipUpdatedEvent(clipId.toString(), { gain: 0.8 }),
        new ClipsUpdatedEvent([{ clipId, type: 'audio' as const }]),
        new InputTrackAddedToBusEvent(TrackId.create(), TrackId.create())
      ];

      events.forEach(event => {
        expect(event.timestamp).toBeInstanceOf(Date);
        expect(event.eventType).toBeDefined();
        expect(event.aggregateId).toBeDefined();
      });
    });
  });
}); 