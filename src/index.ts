import { container } from './core/di/container';
import { TYPES } from './core/di/types';
import { EventMonitor } from './core/events/EventMonitor';
import { DAWManager } from './core/DAWManager';

// 初始化事件監控
const eventMonitor = container.get<EventMonitor>(TYPES.EventMonitor);
eventMonitor.enableMonitoring();

// 初始化 DAW
const dawManager = container.get<DAWManager>(TYPES.DAWManager);
dawManager.initialize().catch((error: Error) => {
  console.error('[App] Failed to initialize DAW:', error);
});

// 其他應用程序初始化代碼... 
