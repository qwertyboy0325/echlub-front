import { injectable } from 'inversify';
import { ClipId } from '../../domain/value-objects/ClipId';
import { BaseClip } from '../../domain/entities/BaseClip';

export interface ClipDTO {
  id: string;
  type: 'audio' | 'midi';
  startTime: number;
  duration: number;
  // ... 其他屬性
}

@injectable()
export class ApiClient {
  private readonly API_BASE = '/api/clips';

  async fetchClip(id: string): Promise<ClipDTO | undefined> {
    try {
      const response = await fetch(`${this.API_BASE}/${id}`);
      if (!response.ok) return undefined;
      return await response.json();
    } catch (error) {
      console.error('Error fetching clip:', error);
      return undefined;
    }
  }

  async createClip(clip: BaseClip): Promise<void> {
    try {
      const response = await fetch(this.API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(clip.toJSON())
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create clip: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error creating clip:', error);
      throw error;
    }
  }

  async updateClip(id: string, changes: Partial<ClipDTO>): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(changes)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update clip: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating clip:', error);
      throw error;
    }
  }

  async deleteClip(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.API_BASE}/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete clip: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error deleting clip:', error);
      throw error;
    }
  }
} 