# home-control

Smart home device and scene management system.

## Description

This project is a TypeScript-based smart home control system that defines device types, capabilities, and scenes for managing home automation. It includes a REST API and WebSocket server for real-time control and monitoring of mock smart home devices.

## Features

- **Device Management**: Support for Hue and Nanoleaf devices with configurable capabilities (brightness, color, temperature)
- **Scene Execution**: Predefined scenes that apply multiple actions to devices simultaneously
- **REST API**: Endpoints for retrieving device states and executing scenes
- **Real-Time Updates**: WebSocket integration for live state synchronization across clients
- **TypeScript**: Fully typed codebase for better development experience and error prevention
- **Mock Data**: Includes sample devices and scenes for testing and demonstration
- **React Dashboard**: Minimal frontend interface with dashboard component and device placeholders
- **Electron App**: Desktop application wrapper for the React dashboard

## Installation

```bash
npm install
```

This installs all dependencies including Express, WebSocket, and TypeScript-related packages.

## Usage

### Development Setup

1. **Install backend dependencies**:
   ```bash
   npm install
   ```

2. **Install frontend dependencies**:
   ```bash
   cd client
   npm install
   cd ..
   ```

3. **Build the backend**:
   ```bash
   npm run build
   ```

4. **Start the backend server**:
   ```bash
   npm start
   ```

6. **Start the Electron app** (in a new terminal, after starting frontend):
   ```bash
   npm run electron
   ```

   This opens a 1200x800 desktop window loading the React dashboard.

7. **Full development mode** (backend + frontend + Electron):
   ```bash
   npm run full-dev
   ```

   This starts all components concurrently.

8. **Frontend + Electron only**:
   ```bash
   npm run electron-dev
   ```

   Starts the React dev server and Electron app together.

9. **Frontend + Electron only** (from client directory):
   ```bash
   cd client
   npm run dev-electron
   ```

   Starts the React dev server and Electron app together from the client folder.

### API Endpoints

#### GET /state
Returns the current state of all devices.

- **Method**: GET
- **URL**: `/state`
- **Response**: 
  ```json
  {
    "devices": [
      {
        "id": "hue1",
        "type": "Hue",
        "capabilities": {
          "brightness": true,
          "color": true,
          "temperature": true
        },
        "state": {
          "brightness": 80,
          "color": { "r": 255, "g": 255, "b": 255 },
          "temperature": 4000
        }
      }
    ]
  }
  ```

#### POST /scene/run
Executes a scene by name, updating device states accordingly.

- **Method**: POST
- **URL**: `/scene/run`
- **Body**:
  ```json
  {
    "sceneName": "Morning"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Scene 'Morning' executed"
  }
  ```
- **Error Response** (404 if scene not found):
  ```json
  {
    "error": "Scene not found"
  }
  ```

### WebSocket

Connect to `ws://localhost:3000` for real-time updates.

- **Connection**: Clients receive the initial state upon connection
- **Messages**: Server broadcasts state updates when scenes are executed
- **Message Format**:
  ```json
  {
    "type": "state",
    "data": {
      "devices": [...]
    }
  }
  ```

### Example Usage

1. **Quick start** (all components): `npm run full-dev`
2. Start components individually:
   - Backend: `npm start`
   - Frontend: `cd client && npm run dev`
   - Electron: `npm run electron` (after frontend is running)
3. **Frontend + Electron only**: `npm run electron-dev` or `cd client && npm run dev-electron`
4. Test the API:
   - Get current state: `curl http://localhost:3000/state`
   - Run a scene: `curl -X POST http://localhost:3000/scene/run -H "Content-Type: application/json" -d '{"sceneName": "Morning"}'`
5. For WebSocket testing, use a client like [WebSocket King](https://websocketking.com/) or implement in your frontend

## Project Structure

```
home-control/
├── README.md                 # Project documentation
├── package.json              # Backend Node.js dependencies and scripts
├── tsconfig.json             # Backend TypeScript configuration
├── .gitignore                # Git ignore rules
├── src/                      # Backend source code
│   ├── types.ts              # TypeScript type definitions
│   ├── index.ts              # Example/demo script with sample data
│   └── server.ts             # Express server with API and WebSocket
├── dist/                     # Backend compiled JavaScript output (generated)
├── client/                   # Frontend React application
│   ├── package.json          # Frontend dependencies and scripts
│   ├── vite.config.ts        # Vite build configuration
│   ├── index.html            # Main HTML file
│   ├── tsconfig.json         # Frontend TypeScript configuration
│   ├── tsconfig.node.json    # Node-specific TypeScript config
│   ├── .eslintrc.cjs         # ESLint configuration
│   └── src/                  # Frontend source code
│       ├── main.tsx          # React app entry point
│       ├── App.tsx           # Main App component with Dashboard
│       ├── App.css           # App-specific styles
│       └── index.css         # Global styles
├── electron/                 # Electron desktop application
│   ├── main.js               # Electron main process
│   └── preload.js            # Preload script for IPC
└── node_modules/             # Backend installed dependencies (generated)
```

### Key Files Explanation

- **`src/types.ts`**: Defines core interfaces and types
  - `Device`: Represents a smart home device with ID, type, capabilities, and current state
  - `DeviceState`: Current values for brightness, color, and temperature
  - `Action`: Individual actions that can be applied to devices
  - `Scene`: Collections of actions for automated execution

- **`src/server.ts`**: Main server application
  - Sets up Express app with JSON middleware
  - Defines API routes for state retrieval and scene execution
  - Integrates WebSocket server for real-time updates
  - Manages mock device data and scene definitions

- **`src/index.ts`**: Standalone script for demonstrating types and data
  - Shows how to define devices and scenes
  - Logs formatted output of the defined data
  - Useful for testing type definitions

- **`package.json`**: Project configuration
  - Lists dependencies (Express, WebSocket)
  - Defines scripts for building, running, and development
  - Includes TypeScript and type definitions

- **`tsconfig.json`**: TypeScript compiler options
  - Configures compilation to CommonJS modules
  - Sets output directory to `dist/`
  - Enables strict type checking and ES module interop

## Architecture

The system follows a client-server architecture with separate frontend and backend:

1. **Backend Server**: Express.js application managing device state and scene execution
2. **API Layer**: REST endpoints for external control
3. **Real-Time Layer**: WebSocket for push notifications
4. **Frontend**: React application for user interface
5. **Desktop App**: Electron wrapper providing native desktop experience
6. **Data Layer**: In-memory storage of device states and scene definitions

Device states are updated in-place, and changes are immediately broadcast to connected WebSocket clients, enabling real-time synchronization across multiple interfaces.

## Development

- **Backend Language**: TypeScript
- **Backend Runtime**: Node.js
- **Backend Framework**: Express.js
- **WebSocket**: ws library
- **Frontend Framework**: React with TypeScript
- **Frontend Build Tool**: Vite
- **Desktop Framework**: Electron
- **Build Tools**: TypeScript compiler (tsc), Electron Builder
- **Development Tools**: Concurrently (parallel commands), Wait-on (service readiness)

To extend the system:
- Add new device types in `src/types.ts`
- Implement additional API endpoints in `src/server.ts`
- Create new scenes by adding to the scenes array
- Integrate with real smart home APIs by replacing mock data with actual device communication
- Enhance the frontend in `client/src/` to connect to the backend API and WebSocket
- Add IPC communication in `electron/preload.js` for desktop-specific features
- Use `electron-builder` to create distributable packages for different platforms