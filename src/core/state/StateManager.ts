import { injectable, inject } from 'inversify';
import { TYPES } from '../di/types';
import { LocalStorageService } from '../storage/LocalStorageService';

export interface AppState {
  clips: {
    [id: string]: {
      id: string;
      audioUrl: string;
      startTime: number;
      duration: number;
      position: number;
      trackId: string;
      name: string;
    };
  };
  tracks: {
    [id: string]: {
      id: string;
      name: string;
      volume: number;
      pan: number;
      muted: boolean;
      soloed: boolean;
    };
  };
  project: {
    id: string;
    name: string;
    bpm: number;
    timeSignature: {
      numerator: number;
      denominator: number;
    };
  };
}

@injectable()
export class StateManager {
  private state: AppState = {
    clips: {},
    tracks: {},
    project: {
      id: '',
      name: 'New Project',
      bpm: 120,
      timeSignature: {
        numerator: 4,
        denominator: 4
      }
    }
  };

  constructor(
    @inject(TYPES.Storage) private storage: LocalStorageService
  ) {
    this.loadState();
  }

  private async loadState(): Promise<void> {
    try {
      const savedState = await this.storage.get<AppState>('appState');
      if (savedState) {
        this.state = savedState;
      }
    } catch (error) {
      console.error('[StateManager] Failed to load state:', error);
    }
  }

  private async saveState(): Promise<void> {
    try {
      await this.storage.set('appState', this.state);
    } catch (error) {
      console.error('[StateManager] Failed to save state:', error);
    }
  }

  public getState(): AppState {
    return { ...this.state };
  }

  public async updateState(newState: Partial<AppState>): Promise<void> {
    this.state = {
      ...this.state,
      ...newState
    };
    await this.saveState();
  }

  public async resetState(): Promise<void> {
    this.state = {
      clips: {},
      tracks: {},
      project: {
        id: '',
        name: 'New Project',
        bpm: 120,
        timeSignature: {
          numerator: 4,
          denominator: 4
        }
      }
    };
    await this.saveState();
  }
} 