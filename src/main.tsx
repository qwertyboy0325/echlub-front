import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { container } from './core/di/container';
import { registerServices } from './core/di/container';

// 註冊所有服務
registerServices(container);

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
); 