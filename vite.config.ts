import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // 環境變量配置
  envPrefix: 'VITE_', // 環境變量前綴，只有 VITE_ 開頭的才會被當作環境變量注入到客戶端
  // 構建配置
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // 生產環境下移除 console 和 debugger
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  // 開發服務器配置
  server: {
    port: 3001,
    open: true,
    cors: true,
  },
}); 