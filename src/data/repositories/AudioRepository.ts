import { BaseRepository, BaseRepositoryImpl } from './BaseRepository';
import { Audio, AudioImpl } from '../models/Audio';

/**
 * Audio repository interface
 */
export interface AudioRepository extends BaseRepository<Audio> {
  /**
   * Get audio by name
   */
  getByName(name: string): Audio | undefined;

  /**
   * Get all audio files
   */
  getAllAudioFiles(): Audio[];

  /**
   * Get audio by file path
   */
  getByFilePath(filePath: string): Audio | undefined;
}

/**
 * Audio repository implementation
 */
export class AudioRepositoryImpl extends BaseRepositoryImpl<Audio> implements AudioRepository {
  protected createItem(data: Partial<Audio>): Audio {
    return new AudioImpl(data);
  }

  protected updateItem(existing: Audio, data: Partial<Audio>): Audio {
    return new AudioImpl({
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date(),
      version: existing.version + 1
    });
  }

  getByName(name: string): Audio | undefined {
    return this.getAll().find(audio => audio.name === name);
  }

  getAllAudioFiles(): Audio[] {
    return this.getAll().filter(audio => audio.filePath !== '');
  }

  getByFilePath(filePath: string): Audio | undefined {
    return this.getAll().find(audio => audio.filePath === filePath);
  }
} 