# Collaboration Module Integration Testing Guide

This document provides instructions for setting up and running integration tests between the frontend Collaboration module and its backend counterpart.

## Prerequisites

Before running the integration tests, ensure you have:

1. The backend server repository cloned and properly set up
2. Node.js and npm installed on your machine
3. This frontend repository cloned and dependencies installed

## Setting Up the Backend

1. Navigate to your backend server repository
2. Install dependencies if you haven't already:
   ```bash
   npm install
   ```
3. Start the collaboration server:
   ```bash
   npm run start:collaboration
   ```
   
   Note: The exact command may vary depending on your backend setup. Refer to the backend documentation for the correct command.

4. Verify that the server is running and listening for WebSocket connections on the expected port (default: 3001)

## Configuration

The integration tests use environment variables that can be set in the `.env` file at the root of the project:

```
# Backend API Configuration
VITE_API_URL=ws://localhost:3001
VITE_COLLABORATION_API_URL=ws://localhost:3001
```

The system checks for these variables in the following order:
1. `VITE_COLLABORATION_API_URL` - Specific to the collaboration module
2. `VITE_API_URL` - General API URL
3. Default fallback (`ws://localhost:3001`) if neither is found

You can also override these values for a specific test run:

```bash
# Windows
set API_URL=ws://your-custom-backend:port
npm run test:integration

# Linux/Mac
API_URL=ws://your-custom-backend:port npm run test:integration
```

## Running the Tests

Once the backend is ready, you can run the integration tests with:

```bash
npm run test:integration
```

This will:
1. Load environment variables from your `.env` file
2. Prompt you to confirm that the backend server is running
3. Run the integration tests against the specified backend
4. Report the results

## Test Structure

The integration tests are located in:
- `src/modules/collaboration/__tests__/e2e/CollaborationE2E.test.ts`

These tests validate:
1. Connection to the backend server
2. Room creation and joining
3. Peer-to-peer signaling

## Debugging

If the tests fail, check:

1. Backend server is running and accessible
2. Your `.env` file has the correct WebSocket URL
3. Network connectivity between frontend and backend
4. Console logs from both frontend and backend for specific errors

## Writing Additional Tests

To add more integration tests:

1. Add new test cases to the `CollaborationE2E.test.ts` file
2. Focus on testing end-to-end flows that involve frontend and backend coordination
3. Keep tests independent and ensure they clean up resources even if they fail

## End-to-End Testing with Multiple Clients

For more comprehensive testing involving multiple clients:

1. Consider using tools like Playwright or Cypress
2. Set up multiple browser instances that connect to the same room
3. Validate real-time communication between clients

These more advanced tests would be part of a full end-to-end testing suite rather than integration tests. 