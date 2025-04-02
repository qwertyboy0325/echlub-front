import { EventEmitter } from './EventEmitter';
import { injectable } from 'inversify';

@injectable()
export class UIEventBus extends EventEmitter {
  // 可以添加特定於 UI 的事件類型和方法
} 