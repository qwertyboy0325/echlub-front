// Mock import.meta.env for Vite
global.import = {};
global.import.meta = { env: {} };
global.import.meta.env = {
  VITE_API_URL: 'https://test-api.echlub.com',
  MODE: 'test',
  DEV: true,
  PROD: false
};

// 引入 node-fetch 作為全局 fetch API
import fetch from 'node-fetch';
// @ts-expect-error - Node.js 環境中沒有原生 fetch
global.fetch = fetch;

// 模擬 WebSocket API 如果在 Node.js 環境中不存在
if (typeof WebSocket === 'undefined') {
  global.WebSocket = class MockWebSocket {
    static CONNECTING = 0;
    static OPEN = 1;
    static CLOSING = 2;
    static CLOSED = 3;
    
    url;
    readyState = 0; // CONNECTING
    onopen = null;
    onclose = null;
    onerror = null;
    onmessage = null;
    binaryType = 'arraybuffer';
    bufferedAmount = 0;
    extensions = '';
    protocol = '';
    
    constructor(url) {
      this.url = url;
      
      // 模擬連接過程 (連接成功)
      setTimeout(() => {
        this.readyState = 1; // OPEN
        if (this.onopen) this.onopen({});
      }, 50);
    }
    
    send(data) {
      // 模擬消息發送
      console.log(`[MockWebSocket] Sending: ${data}`);
    }
    
    close() {
      this.readyState = 3; // CLOSED
      if (this.onclose) this.onclose({});
    }
  };
}

// 在測試環境中模擬 ESBuild 添加的代碼覆蓋工具函數
// 這些函數在測試錯誤消息中出現
global.oo_oo = function() {
  return Array.prototype.slice.call(arguments);
};

global.oo_tx = function() {
  return Array.prototype.slice.call(arguments);
}; 