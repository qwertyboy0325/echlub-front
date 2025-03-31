import { TrackRepositoryImpl } from '../../../data/repositories/TrackRepositoryImpl';
import { TrackImpl } from '../../../domain/models/Track';
import { Storage } from '../../../infrastructure/storage/Storage';

describe('TrackRepositoryImpl', () => {
    let repository: TrackRepositoryImpl;
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
        repository = new TrackRepositoryImpl(mockStorage);
    });
    
    test('should create new track', async () => {
        const track = await repository.create({});
        expect(track).toBeDefined();
        expect(track.name).toBe('Untitled Track');
        expect(track.clips).toEqual([]);
        expect(track.volume).toBe(1);
        expect(track.pan).toBe(0);
        expect(track.reverb).toBe(0);
    });
    
    test('should create track with provided values', async () => {
        const track = await repository.create({
            name: 'Test Track',
            projectId: 'test-project',
            volume: 0.8,
            pan: 0.5,
            reverb: 0.3
        });

        expect(track.name).toBe('Test Track');
        expect(track.projectId).toBe('test-project');
        expect(track.volume).toBe(0.8);
        expect(track.pan).toBe(0.5);
        expect(track.reverb).toBe(0.3);
    });
    
    test('should get tracks by name', async () => {
        await repository.create({ name: 'Test Track' });
        await repository.create({ name: 'Test Track' });
        await repository.create({ name: 'Other Track' });

        const tracks = await repository.getByName('Test Track');
        expect(tracks).toHaveLength(2);
        expect(tracks.every(track => track.name === 'Test Track')).toBe(true);
    });
    
    test('should return empty array for non-existent name', async () => {
        const tracks = await repository.getByName('Non-existent');
        expect(tracks).toEqual([]);
    });
    
    test('should find tracks by project ID', async () => {
        const projectId = 'test-project';
        await repository.create({ projectId });
        await repository.create({ projectId });
        await repository.create({ projectId: 'other-project' });

        const tracks = await repository.findByProjectId(projectId);
        expect(tracks).toHaveLength(2);
        expect(tracks.every(track => track.projectId === projectId)).toBe(true);
    });
}); 