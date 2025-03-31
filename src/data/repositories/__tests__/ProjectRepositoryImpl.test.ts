import { Container } from 'inversify';
import { ProjectRepositoryImpl } from '../ProjectRepositoryImpl';
import type { Storage } from '../../../infrastructure/storage/Storage';
import type { Project } from '../../../domain/models/Project';
import type { ProjectDTO } from '../../models/ProjectDTO';
import { ProjectImpl } from '../../../domain/models/Project';

// 測試用的存儲實現
class MockStorage implements Storage {
  private data: Record<string, any> = {};

  async get<T>(key: string): Promise<T | null> {
    const value = this.data[key];
    return value ? value as T : null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    if (typeof value === 'object' && value !== null) {
      this.data[key] = { ...this.data[key], ...value };
    } else {
      this.data[key] = value;
    }
  }

  async remove(key: string): Promise<void> {
    delete this.data[key];
  }

  async clear(): Promise<void> {
    this.data = {};
  }
}

describe('ProjectRepositoryImpl', () => {
  let container: Container;
  let storage: Storage;
  let repository: ProjectRepositoryImpl;

  beforeEach(() => {
    container = new Container();
    storage = new MockStorage();
    container.bind<Storage>('Storage').toConstantValue(storage);
    repository = new ProjectRepositoryImpl(storage);
  });

  describe('getCurrentProject', () => {
    it('should return null when no current project exists', async () => {
      const result = await repository.getCurrentProject();
      expect(result).toBeNull();
    });

    it('should return current project when exists', async () => {
      const project = new ProjectImpl('Test Project');
      project.setCurrent(true);
      await repository.save(project);

      const result = await repository.getCurrentProject();
      expect(result).toBeDefined();
      expect(result?.name).toBe('Test Project');
      expect(result?.isCurrent).toBe(true);
    });

    it('should handle multiple current projects by returning the first one', async () => {
      const project1 = new ProjectImpl('Project 1');
      project1.setCurrent(true);
      const project2 = new ProjectImpl('Project 2');
      project2.setCurrent(true);

      await repository.save(project1);
      await repository.save(project2);

      const result = await repository.getCurrentProject();
      expect(result).toBeDefined();
      expect(result?.name).toBe('Project 1');
      expect(result?.isCurrent).toBe(true);
    });
  });

  describe('createNewProject', () => {
    it('should create a new project and set it as current', async () => {
      const project = await repository.createNewProject('New Project');
      expect(project.name).toBe('New Project');
      expect(project.isCurrent).toBe(true);
      expect(project.tempo).toBe(120);
      expect(project.tracks).toEqual([]);
    });

    it('should set new project as current and unset others', async () => {
      const project1 = new ProjectImpl('Project 1');
      project1.setCurrent(true);
      await repository.save(project1);

      const project2 = await repository.createNewProject('Project 2');
      const updatedProject1 = await repository.findById(project1.id);
      expect(updatedProject1?.isCurrent).toBe(false);
      expect(project2.isCurrent).toBe(true);
    });

    it('should handle empty project name', async () => {
      const project = await repository.createNewProject('');
      expect(project.name).toBe('');
      expect(project.isCurrent).toBe(true);
    });

    it('should handle very long project name', async () => {
      const longName = 'a'.repeat(1000);
      const project = await repository.createNewProject(longName);
      expect(project.name).toBe(longName);
      expect(project.isCurrent).toBe(true);
    });
  });

  describe('CRUD operations', () => {
    it('should save and retrieve a project', async () => {
      const project = new ProjectImpl('Test Project');
      await repository.save(project);
      const retrieved = await repository.findById(project.id);
      expect(retrieved?.name).toBe(project.name);
      expect(retrieved?.tempo).toBe(project.tempo);
      expect(retrieved?.tracks).toEqual(project.tracks);
      expect(retrieved?.isCurrent).toBe(project.isCurrent);
    });

    it('should update a project', async () => {
      const project = new ProjectImpl('Test Project');
      await repository.save(project);
      project.updateTempo(140);
      await repository.save(project);
      const updated = await repository.findById(project.id);
      expect(updated?.tempo).toBe(140);
    });

    it('should delete a project', async () => {
      const project = new ProjectImpl('Test Project');
      await repository.save(project);
      await repository.delete(project.id);
      const deleted = await repository.findById(project.id);
      expect(deleted).toBeNull();
    });

    it('should check if project exists', async () => {
      const project = new ProjectImpl('Test Project');
      await repository.save(project);
      const exists = await repository.exists(project.id);
      expect(exists).toBe(true);
    });

    it('should count projects', async () => {
      const project1 = new ProjectImpl('Project 1');
      const project2 = new ProjectImpl('Project 2');
      await repository.save(project1);
      await repository.save(project2);
      const count = await repository.count();
      expect(count).toBe(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle non-existent project ID', async () => {
      const result = await repository.findById('non-existent-id');
      expect(result).toBeNull();
    });

    it('should handle deleting non-existent project', async () => {
      await expect(repository.delete('non-existent-id')).resolves.not.toThrow();
    });

    it('should handle checking existence of non-existent project', async () => {
      const exists = await repository.exists('non-existent-id');
      expect(exists).toBe(false);
    });

    it('should handle empty project list', async () => {
      const projects = await repository.findAll();
      expect(projects).toEqual([]);
    });

    it('should handle project with maximum number of tracks', async () => {
      const project = new ProjectImpl('Test Project');
      const maxTracks = 1000; // 假設最大軌道數為 1000
      for (let i = 0; i < maxTracks; i++) {
        const track = { 
          id: `track-${i}`, 
          name: `Track ${i}`,
          clips: [],
          volume: 1,
          pan: 0,
          reverb: 0
        } as any;
        project.addTrack(track);
      }
      await repository.save(project);
      const retrieved = await repository.findById(project.id);
      expect(retrieved?.tracks.length).toBe(maxTracks);
    });

    it('should handle project with extreme tempo values', async () => {
      const project = new ProjectImpl('Test Project');
      project.updateTempo(1); // 最小有效值
      await repository.save(project);
      let retrieved = await repository.findById(project.id);
      expect(retrieved?.tempo).toBe(1);

      project.updateTempo(999); // 較大的值
      await repository.save(project);
      retrieved = await repository.findById(project.id);
      expect(retrieved?.tempo).toBe(999);
    });

    it('should handle invalid tempo values', async () => {
      const project = new ProjectImpl('Test Project');
      expect(() => project.updateTempo(0)).toThrow('Tempo must be greater than 0');
      expect(() => project.updateTempo(-1)).toThrow('Tempo must be greater than 0');
    });
  });
}); 