import { ClipId } from '../../../domain/value-objects/ClipId';
import { AudioClipChanges } from '../audio/EditAudioClipCommand';
import { MidiClipChanges } from '../midi/EditMidiClipCommand';

export interface ClipEdit {
  clipId: ClipId;
  changes: AudioClipChanges | MidiClipChanges;
}

export class BulkEditClipsCommand {
  constructor(
    public readonly edits: ClipEdit[]
  ) {
    if (edits.length === 0) {
      throw new Error('At least one clip edit is required');
    }
    if (edits.length > 100) {
      throw new Error('Cannot edit more than 100 clips at once');
    }

    // 檢查是否有重複的 clipId
    const clipIds = new Set<string>();
    edits.forEach(edit => {
      const id = edit.clipId.toString();
      if (clipIds.has(id)) {
        throw new Error(`Duplicate clip ID found: ${id}`);
      }
      clipIds.add(id);
    });
  }
} 