import { ProjectRepositoryImpl } from '../../../data/repositories/ProjectRepositoryImpl';
import { ProjectImpl } from '../../../domain/models/Project';
import { TrackImpl } from '../../../domain/models/Track';
import { Storage } from '../../../infrastructure/storage/Storage';

describe('ProjectRepositoryImpl', () => {
    let repository: ProjectRepositoryImpl;
    let mockStorage: Storage;
    
    beforeEach(() => {
        mockStorage = {
            get: jest.fn().mockImplementation(async (key: string) => {
                const data = (mockStorage as any).data?.[key];
                return data === undefined ? null : data;
            }),
            set: jest.fn().mockImplementation(async (key: string, value: any) => {
                (mockStorage as any).data = (mockStorage as any).data || {};
                (mockStorage as any).data[key] = value;
            }),
            remove: jest.fn().mockImplementation(async (key: string) => {
                if ((mockStorage as any).data) {
                    delete (mockStorage as any).data[key];
                }
            }),
            clear: jest.fn().mockImplementation(async () => {
                (mockStorage as any).data = {};
            })
        };
        (mockStorage as any).data = {};
        repository = new ProjectRepositoryImpl(mockStorage);
    });

    describe('Project creation and retrieval', () => {
        test('should create new project', async () => {
            const project = await repository.createNewProject('Test Project');
            expect(project).toBeDefined();
            expect(project.name).toBe('Test Project');
            expect(project.isCurrent).toBe(true);
            expect(project.tempo).toBe(120);
            expect(project.tracks).toEqual([]);
        });

        test('should get current project', async () => {
            const project = await repository.createNewProject('Test Project');
            const currentProject = await repository.getCurrentProject();
            expect(currentProject).toBeDefined();
            expect(currentProject?.name).toBe('Test Project');
            expect(currentProject?.isCurrent).toBe(true);
        });

        test('should return null when no current project exists', async () => {
            const currentProject = await repository.getCurrentProject();
            expect(currentProject).toBeNull();
        });
    });

    describe('Project management', () => {
        test('should save and retrieve project', async () => {
            const project = new ProjectImpl('Test Project');
            const savedProject = await repository.save(project);
            expect(savedProject).toBeDefined();
            expect(savedProject.id).toBe(project.id);
        });

        test('should update project', async () => {
            const project = new ProjectImpl('Test Project');
            await repository.save(project);
            project.name = 'Updated Project';
            const updatedProject = await repository.save(project);
            expect(updatedProject.name).toBe('Updated Project');
        });

        test('should delete project', async () => {
            const project = new ProjectImpl('Test Project');
            await repository.save(project);
            await repository.delete(project.id);
            const deletedProject = await repository.findById(project.id);
            expect(deletedProject).toBeNull();
        });

        test('should find project by ID', async () => {
            const project = new ProjectImpl('Test Project');
            await repository.save(project);
            const foundProject = await repository.findById(project.id);
            expect(foundProject).toBeDefined();
            expect(foundProject?.id).toBe(project.id);
        });

        test('should find all projects', async () => {
            const project1 = new ProjectImpl('Project 1');
            const project2 = new ProjectImpl('Project 2');
            await repository.save(project1);
            await repository.save(project2);
            const projects = await repository.findAll();
            expect(projects).toHaveLength(2);
        });

        test('should check if project exists', async () => {
            const project = new ProjectImpl('Test Project');
            await repository.save(project);
            const exists = await repository.exists(project.id);
            expect(exists).toBe(true);
        });

        test('should count projects', async () => {
            const project1 = new ProjectImpl('Project 1');
            const project2 = new ProjectImpl('Project 2');
            await repository.save(project1);
            await repository.save(project2);
            const count = await repository.count();
            expect(count).toBe(2);
        });
    });

    describe('Track management', () => {
        test('should manage tracks in project', async () => {
            const project = new ProjectImpl('Test Project');
            const track = new TrackImpl('Test Track');
            await repository.save(project);

            // Add track
            project.addTrack(track);
            await repository.save(project);
            const updatedProject = await repository.findById(project.id);
            expect(updatedProject?.tracks.map(t => t.id)).toContain(track.id);

            // Remove track
            project.removeTrack(track.id);
            await repository.save(project);
            const updatedProject2 = await repository.findById(project.id);
            expect(updatedProject2?.tracks.map(t => t.id)).not.toContain(track.id);
        });
    });
}); 