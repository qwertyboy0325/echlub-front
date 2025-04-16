import '@testing-library/jest-dom';

// 設置全局測試環境變量
process.env.NODE_ENV = 'test';

// 設置全局超時時間
jest.setTimeout(10000);

// 清理所有模擬
afterEach(() => {
  jest.clearAllMocks();
}); 