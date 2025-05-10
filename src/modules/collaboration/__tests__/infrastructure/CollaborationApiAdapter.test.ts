import 'reflect-metadata';
import { CollaborationApiAdapter } from '../../infrastructure/adapters/CollaborationApiAdapter';
import { RoomId } from '../../domain/value-objects/RoomId';
import { v4 as uuidv4 } from 'uuid';

// Initialize UUID generators
RoomId.setGenerator(() => uuidv4());

// Mock fetch API
global.fetch = jest.fn();

describe('CollaborationApiAdapter', () => {
  let adapter: CollaborationApiAdapter;
  let mockFetch: jest.Mock;
  
  beforeEach(() => {
    mockFetch = global.fetch as jest.Mock;
    mockFetch.mockClear();
    
    // Create adapter instance
    adapter = new CollaborationApiAdapter();
    
    // Set private API_BASE_URL field
    Object.defineProperty(adapter, 'API_BASE_URL', {
      value: 'https://test-api.echlub.com'
    });
  });
  
  describe('createRoom', () => {
    test('should send POST request to create room endpoint', async () => {
      // Mock successful response
      const mockResponse = {
        roomId: 'mock-room-id'
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockResponse })
      });
      
      // Request data
      const request = {
        ownerId: 'owner-id',
        maxPlayers: 4,
        allowRelay: true,
        latencyTargetMs: 100,
        opusBitrate: 32000
      };
      
      // Call method
      const result = await adapter.createRoom(request);
      
      // Verify fetch was called correctly
      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.echlub.com/api/collaboration/rooms',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(request)
        }
      );
      
      // Verify result
      expect(result.data).toEqual(mockResponse);
      expect(result.error).toBeUndefined();
    });
    
    test('should handle API error', async () => {
      // Mock error response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Invalid request data' })
      });
      
      // Request data
      const request = {
        ownerId: 'owner-id',
        maxPlayers: 4,
        allowRelay: true,
        latencyTargetMs: 100,
        opusBitrate: 32000
      };
      
      // Call method
      const result = await adapter.createRoom(request);
      
      // Verify error handling
      expect(result.data).toBeUndefined();
      expect(result.error).toBe('Invalid request data');
    });
    
    test('should handle network error', async () => {
      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      // Request data
      const request = {
        ownerId: 'owner-id',
        maxPlayers: 4,
        allowRelay: true,
        latencyTargetMs: 100,
        opusBitrate: 32000
      };
      
      // Call method
      const result = await adapter.createRoom(request);
      
      // Verify error handling
      expect(result.data).toBeUndefined();
      expect(result.error).toBe('Network error');
    });
  });
  
  describe('getRoom', () => {
    test('should send GET request to get room endpoint', async () => {
      // Create room ID
      const roomId = RoomId.create();
      
      // Mock successful response
      const mockResponse = {
        id: roomId.toString(),
        ownerId: 'owner-id',
        active: true,
        maxPlayers: 4,
        currentPlayers: ['owner-id'],
        rules: {
          maxPlayers: 4,
          allowRelay: true,
          latencyTargetMs: 100,
          opusBitrate: 32000
        }
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ room: mockResponse })
      });
      
      // Call method
      const result = await adapter.getRoom(roomId);
      
      // Verify fetch was called correctly
      expect(mockFetch).toHaveBeenCalledWith(
        `https://test-api.echlub.com/api/collaboration/rooms/${roomId.toString()}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        }
      );
      
      // Verify result
      expect(result.data).toEqual(mockResponse);
      expect(result.error).toBeUndefined();
    });
  });
  
  describe('updateRoomRules', () => {
    test('should send PATCH request to update room rules endpoint', async () => {
      // Create room ID
      const roomId = RoomId.create();
      
      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });
      
      // Request data
      const request = {
        ownerId: 'owner-id',
        maxPlayers: 6,
        allowRelay: false,
        latencyTargetMs: 200,
        opusBitrate: 64000
      };
      
      // Call method
      const result = await adapter.updateRoomRules(roomId, request);
      
      // Verify fetch was called correctly
      expect(mockFetch).toHaveBeenCalledWith(
        `https://test-api.echlub.com/api/collaboration/rooms/${roomId.toString()}/rules`,
        {
          method: 'PATCH', // 確保使用正確的 HTTP 方法
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(request)
        }
      );
      
      // Verify result
      expect(result.message).toBeDefined();
      expect(result.error).toBeUndefined();
    });
  });
  
  describe('closeRoom', () => {
    test('should send DELETE request to close room endpoint', async () => {
      // Create room ID
      const roomId = RoomId.create();
      
      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({})
      });
      
      // Request data
      const request = {
        ownerId: 'owner-id'
      };
      
      // Call method
      const result = await adapter.closeRoom(roomId, request);
      
      // Verify fetch was called correctly
      expect(mockFetch).toHaveBeenCalledWith(
        `https://test-api.echlub.com/api/collaboration/rooms/${roomId.toString()}`,
        {
          method: 'DELETE', // 確保使用正確的 HTTP 方法
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(request)
        }
      );
      
      // Verify result
      expect(result.message).toBeDefined();
      expect(result.error).toBeUndefined();
    });
  });
}); 