import React from 'react';
import ReactDOM from 'react-dom/client';
import { Container } from 'inversify';
import { IdentityModule } from './modules/identity';
import { configureCollaborationContainer } from './modules/collaboration/di/container';
import { AppContainerManager } from './core/di/AppContainerManager';
import App from './App';
import 'reflect-metadata';
import './index.css';
import { UniqueId } from './shared/domain';
import { TYPES } from './core/di/types';
import { ApiConfig } from './core/api/ApiConfig';
import { SimpleEventBus } from './core/event-bus/SimpleEventBus';

// 初始化依賴注入容器
const container = new Container();

// 添加環境配置，所有模組可以共用
container.bind(TYPES.ENV_CONFIG).toConstantValue({
  BASE_URL: ApiConfig.wsUrl,
});

// 載入身份模組
container.load(IdentityModule);

// 重新綁定 EventBus，解決衝突問題
if (container.isBound(TYPES.EventBus)) {
  container.unbind(TYPES.EventBus);
}
container.bind(TYPES.EventBus).to(SimpleEventBus).inSingletonScope();

// 配置協作模組
configureCollaborationContainer(container);

// 初始化應用程式容器管理器
const appContainerManager = AppContainerManager.initialize(container);

// 載入並初始化所有模組
appContainerManager.loadModules().catch(console.error);

// 初始化 UniqueId
UniqueId.initialize();

// 將容器導出供其他模組使用
export { container, appContainerManager };

ReactDOM.createRoot(document.getElementById('root')!).render(
  // Temporarily disable StrictMode to fix PIXI.js instability
  // TODO: Implement proper StrictMode-compatible PIXI.js initialization
  <App diContainer={container} />
); 