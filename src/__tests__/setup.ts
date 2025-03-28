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