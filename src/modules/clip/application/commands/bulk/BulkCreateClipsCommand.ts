import { CreateAudioClipCommand } from '../audio/CreateAudioClipCommand';
import { CreateMidiClipCommand } from '../midi/CreateMidiClipCommand';

export type ClipCreationCommand = CreateAudioClipCommand | CreateMidiClipCommand;

export class BulkCreateClipsCommand {
  constructor(
    public readonly commands: ClipCreationCommand[]
  ) {
    if (commands.length === 0) {
      throw new Error('At least one clip creation command is required');
    }
    if (commands.length > 100) {
      throw new Error('Cannot create more than 100 clips at once');
    }
  }
} 