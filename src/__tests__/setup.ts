import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

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

// 設置全局測試環境變量
process.env.NODE_ENV = 'test';

// 設置全局超時時間
jest.setTimeout(10000);

// 清理所有模擬
afterEach(() => {
  jest.clearAllMocks();
});

// 創建 RTCPeerConnection 模擬
class MockRTCPeerConnection {
  createOffer = jest.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' });
  createAnswer = jest.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-sdp-answer' });
  setLocalDescription = jest.fn().mockResolvedValue(undefined);
  setRemoteDescription = jest.fn().mockResolvedValue(undefined);
  addIceCandidate = jest.fn().mockResolvedValue(undefined);
  close = jest.fn();
  createDataChannel = jest.fn().mockReturnValue({
    send: jest.fn(),
    close: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    readyState: 'open'
  });
  
  // 其他必要的屬性
  localDescription = null;
  remoteDescription = null;
  iceGatheringState = 'complete';
  iceConnectionState = 'connected';
  connectionState = 'connected';
  signalingState = 'stable';
  canTrickleIceCandidates = true;
  
  // 事件處理
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn().mockReturnValue(true);
  
  constructor() {
    // 建構函數不需要做任何事
  }
  
  // 靜態方法實現
  static generateCertificate = jest.fn().mockResolvedValue({});
}

// 創建 WebSocket 模擬
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  
  readyState = MockWebSocket.OPEN;
  url = '';
  protocol = '';
  extensions = '';
  
  send = jest.fn();
  close = jest.fn();
  addEventListener = jest.fn();
  removeEventListener = jest.fn();
  dispatchEvent = jest.fn().mockReturnValue(true);
  
  constructor(url: string, protocols?: string | string[]) {
    this.url = url;
    if (typeof protocols === 'string') {
      this.protocol = protocols;
    }
  }
}

// 替換全局物件
global.RTCPeerConnection = MockRTCPeerConnection as any;
global.RTCSessionDescription = jest.fn().mockImplementation((init) => init);
global.RTCIceCandidate = jest.fn().mockImplementation((init) => init);
global.WebSocket = MockWebSocket as any;

// Add any missing browser APIs needed for tests
if (typeof window.URL.createObjectURL === 'undefined') {
  Object.defineProperty(window.URL, 'createObjectURL', { value: jest.fn() });
}

// Add any missing navigator properties needed for tests
if (!navigator.mediaDevices) {
  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: jest.fn().mockResolvedValue({}),
      getDisplayMedia: jest.fn().mockResolvedValue({})
    }
  });
} 
