/**
 * Collaboration Module Integration Test Runner
 * 
 * This script runs the integration tests for the Collaboration module
 * against a real backend server.
 */

import { spawn } from 'child_process';
import path from 'path';
import readline from 'readline';
import fs from 'fs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log(`Loading environment from ${envPath}`);
  dotenv.config({ path: envPath });
} else {
  console.log('No .env file found, using default values');
  dotenv.config();
}

// Configuration
const BACKEND_URL = process.env.VITE_WS_BASE_URL || process.env.VITE_API_URL || 'ws://localhost:3000/collaboration';
const TEST_TIMEOUT = 60000; // 60 seconds
const TEST_FILE_PATH = 'src/modules/collaboration/__tests__/e2e/CollaborationE2E.test.ts';

console.log('========================================');
console.log('Collaboration Module Integration Tester');
console.log('========================================');
console.log(`Backend URL: ${BACKEND_URL}`);
console.log('');

// Ask user if backend is ready
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Is the backend server running? (y/n) ', (answer) => {
  rl.close();
  
  if (answer.toLowerCase() !== 'y') {
    console.log('Please start the backend server and try again.');
    process.exit(1);
  }
  
  console.log('Running integration tests...');
  
  // Run the tests with proper environment variables
  const testProcess = spawn('node', [path.join(process.cwd(), 'node_modules', 'jest', 'bin', 'jest.js'), TEST_FILE_PATH, '--runInBand', '--testTimeout', TEST_TIMEOUT], {
    env: {
      ...process.env,
      API_URL: BACKEND_URL,
      NODE_ENV: 'test'
    },
    stdio: 'inherit'
  });
  
  testProcess.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Integration tests completed successfully!');
    } else {
      console.error(`❌ Integration tests failed with code ${code}`);
    }
    process.exit(code);
  });
}); 