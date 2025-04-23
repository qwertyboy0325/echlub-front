import { ClipDomainService } from '../ClipDomainService';
import { AudioTrack } from '../../entities/AudioTrack';
import { MidiTrack } from '../../entities/MidiTrack';
import { AudioClip } from '../../entities/clips/AudioClip';
import { MidiClip } from '../../entities/clips/MidiClip';
import { TrackId } from '../../value-objects/track/TrackId';
import { ClipId } from '../../value-objects/clips/ClipId';
import { TrackRouting } from '../../value-objects/track/TrackRouting';
import { InvalidTrackTypeError } from '../../errors/InvalidTrackTypeError';

describe('ClipOperationService', () => {
  let service: ClipDomainService;
  let audioTrack: AudioTrack;
  let midiTrack: MidiTrack;
  let audioClip: AudioClip;
  let midiClip: MidiClip;
  let trackId: TrackId;
  let clipId: ClipId;

  beforeEach(() => {
    service = new ClipDomainService();
    trackId = TrackId.create();
    clipId = ClipId.create();
    
    // 初始化軌道
    audioTrack = new AudioTrack(trackId, 'Audio Track', new TrackRouting(null, null));
    midiTrack = new MidiTrack(trackId, 'MIDI Track', new TrackRouting(null, null));
    
    // 初始化片段
    audioClip = new AudioClip(clipId, 'sample-1', 0, 10, 0);
    midiClip = new MidiClip(clipId, 0, 4, [], { numerator: 4, denominator: 4 });
  });

  describe('validateClipTrackCompatibility', () => {
    it('當音頻片段配對音頻軌道時不應拋出錯誤', () => {
      expect(() => {
        service.validateClipTrackCompatibility(audioClip, audioTrack);
      }).not.toThrow();
    });

    it('當 MIDI 片段配對 MIDI 軌道時不應拋出錯誤', () => {
      expect(() => {
        service.validateClipTrackCompatibility(midiClip, midiTrack);
      }).not.toThrow();
    });

    it('當音頻片段配對 MIDI 軌道時應拋出錯誤', () => {
      expect(() => {
        service.validateClipTrackCompatibility(audioClip, midiTrack);
      }).toThrow(InvalidTrackTypeError);
    });

    it('當 MIDI 片段配對音頻軌道時應拋出錯誤', () => {
      expect(() => {
        service.validateClipTrackCompatibility(midiClip, audioTrack);
      }).toThrow(InvalidTrackTypeError);
    });
  });

  describe('getClipType', () => {
    it('應正確識別音頻片段類型', () => {
      expect(service.getClipType(audioClip)).toBe('audio');
    });

    it('應正確識別 MIDI 片段類型', () => {
      expect(service.getClipType(midiClip)).toBe('midi');
    });
  });

  describe('removeClipFromTrack', () => {
    it('應從音頻軌道移除片段', () => {
      audioTrack.addClip(clipId);
      const spy = jest.spyOn(audioTrack, 'removeClip');
      service.removeClipFromTrack(audioTrack, clipId);
      expect(spy).toHaveBeenCalledWith(clipId);
    });

    it('應從 MIDI 軌道移除片段', () => {
      midiTrack.addClip(clipId);
      const spy = jest.spyOn(midiTrack, 'removeClip');
      service.removeClipFromTrack(midiTrack, clipId);
      expect(spy).toHaveBeenCalledWith(clipId);
    });
  });

  describe('addClipToTrack', () => {
    it('應添加片段到音頻軌道', () => {
      const spy = jest.spyOn(audioTrack, 'addClip');
      service.addClipToTrack(audioTrack, clipId);
      expect(spy).toHaveBeenCalledWith(clipId);
    });

    it('應添加片段到 MIDI 軌道', () => {
      const spy = jest.spyOn(midiTrack, 'addClip');
      service.addClipToTrack(midiTrack, clipId);
      expect(spy).toHaveBeenCalledWith(clipId);
    });
  });

  describe('updateClipStartTime', () => {
    it('應更新音頻片段的開始時間', () => {
      const newStartTime = 5;
      const spy = jest.spyOn(audioClip, 'setStartTime');
      service.updateClipStartTime(audioClip, newStartTime);
      expect(spy).toHaveBeenCalledWith(newStartTime);
    });

    it('應更新 MIDI 片段的開始時間', () => {
      const newStartTime = 5;
      const spy = jest.spyOn(midiClip, 'setStartTime');
      service.updateClipStartTime(midiClip, newStartTime);
      expect(spy).toHaveBeenCalledWith(newStartTime);
    });
  });

  describe('createClipClone', () => {
    it('應創建音頻片段的克隆', () => {
      const spy = jest.spyOn(audioClip, 'clone');
      service.createClipClone(audioClip);
      expect(spy).toHaveBeenCalled();
    });

    it('應創建 MIDI 片段的克隆', () => {
      const spy = jest.spyOn(midiClip, 'clone');
      service.createClipClone(midiClip);
      expect(spy).toHaveBeenCalled();
    });
  });
}); 