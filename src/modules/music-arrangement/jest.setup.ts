import 'reflect-metadata';

// Polyfill for crypto.randomUUID in Node.js test environment
if (!global.crypto) {
  global.crypto = {} as any;
}

if (!global.crypto.randomUUID) {
  global.crypto.randomUUID = (() => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }) as () => `${string}-${string}-${string}-${string}-${string}`;
}

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  // Reset console mocks before each test
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  // Restore original console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
global.testUtils = {
  // Helper to create test data
  createTestTimeRange: (start: number = 0, length: number = 1000) => {
    const { TimeRangeVO } = require('./domain/value-objects/TimeRangeVO');
    return new TimeRangeVO(start, length);
  },
  
  createTestTrackId: () => {
    const { TrackId } = require('./domain/value-objects/TrackId');
    return TrackId.create();
  },
  
  createTestClipId: () => {
    const { ClipId } = require('./domain/value-objects/ClipId');
    return ClipId.create();
  },
  
  // Helper to wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Helper to create mock user ID
  createTestUserId: (suffix: string = '') => `test-user-${Date.now()}${suffix}`
};

// Extend Jest matchers
expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },
  
  toHaveEventOfType(received: any[], eventType: string) {
    const hasEvent = received.some(event => event.eventName === eventType);
    
    if (hasEvent) {
      return {
        message: () => `expected events not to contain event of type ${eventType}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected events to contain event of type ${eventType}`,
        pass: false,
      };
    }
  }
});

// Type declarations for global utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUUID(): R;
      toHaveEventOfType(eventType: string): R;
    }
  }
  
  var testUtils: {
    createTestTimeRange: (start?: number, length?: number) => any;
    createTestTrackId: () => any;
    createTestClipId: () => any;
    waitFor: (ms: number) => Promise<void>;
    createTestUserId: (suffix?: string) => string;
  };
} 