import '@testing-library/jest-dom';
import 'jest-canvas-mock';

// Mock crypto
if (!global.crypto) {
    global.crypto = {
        randomUUID: () => 'test-uuid',
        subtle: {} as SubtleCrypto,
        getRandomValues: <T extends ArrayBufferView>(array: T) => array
    } as Crypto;
}

// Mock Tone.js
jest.mock('tone', () => ({
  Context: jest.fn().mockImplementation(() => ({
    sampleRate: 44100,
    latencyHint: 'interactive',
    state: 'running'
  })),
  Transport: {
    start: jest.fn(),
    stop: jest.fn(),
    pause: jest.fn(),
    bpm: { value: 120 },
    seconds: 0
  },
  Gain: jest.fn().mockImplementation(() => ({
    toDestination: jest.fn().mockReturnThis(),
    volume: { value: -6 }
  })),
  Channel: jest.fn().mockImplementation(() => ({
    volume: { value: 0 },
    pan: { value: 0 },
    mute: { value: false },
    solo: { value: false }
  })),
  Volume: jest.fn().mockImplementation(() => ({
    value: 0
  })),
  PanVol: jest.fn().mockImplementation(() => ({
    value: 0
  }))
}));

// Mock Web Audio API
global.AudioContext = jest.fn().mockImplementation(() => ({
  sampleRate: 44100,
  state: 'running',
  resume: jest.fn(),
  suspend: jest.fn(),
  close: jest.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// 設置控制台輸出
global.console = {
    ...console,
    // 保持測試輸出簡潔
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
}; 