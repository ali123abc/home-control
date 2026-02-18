# home-control

**Smart home device and scene management system with Philips Hue Bridge integration and mock device fallback.**

A TypeScript-based home automation platform that manages smart home devices and scenes through REST API, WebSocket real-time updates, and a React dashboard. Includes native Philips Hue Bridge support with graceful fallback to mock devices.

## Features

- **Philips Hue Bridge Integration**: Direct API connection to Hue Bridge for real-time light control
- **Mock Device Fallback**: Graceful fallback when Hue Bridge unavailable
- **Device Management**: Support for Hue and Nanoleaf devices with configurable capabilities (brightness, color, temperature)
- **Scene Management**: Predefined scenes that execute multiple device actions with validation
  - Validate device IDs before scene creation
  - Store device type with each action for correct handler routing
  - Execute scenes with error isolation per device
- **REST API**: Full-featured endpoints for device state, scene creation/execution, and device control
- **Real-Time Updates**: WebSocket integration for live state synchronization
- **Device Service Architecture**: Modular handler-based routing for extensible device support
- **Data Persistence**: JSON file storage for mock devices and scenes
- **React Dashboard**: Modern frontend interface with device controls and scene management
- **Electron Desktop App**: Native desktop application wrapper

## Prerequisites

- **Node.js** v16 or higher
- **npm** v7 or higher
- **Philips Hue Bridge** (optional - system works with mock devices if unavailable)
- **Hue API Credentials** (optional - set via `.env` file)

## Installation

### Backend Setup

```bash
# Install backend dependencies
npm install
```

### Frontend Setup

```bash
# Install frontend dependencies
cd client
npm install
cd ..
```

## Configuration

### Environment Variables

Create a `.env` file in the project root to configure Hue Bridge connection:

```env
# Hue Bridge Configuration (optional)
HUE_BRIDGE_IP=192.168.1.100
HUE_USERNAME=your-hue-api-key
```

**Note**: If these are not set, the system will gracefully fall back to mock devices.

To get your Hue credentials:
1. Visit `http://<bridge-ip>/debug/clip.html`
2. Create a new user and note the username

## Quick Start

### Option 1: Full Development Mode
Starts backend, frontend, and Electron app simultaneously:

```bash
npm run full-dev
```

### Option 2: Backend Only
```bash
npm start
```
Backend server runs on `http://localhost:3000`

### Option 3: Frontend Only
```bash
cd client
npm run dev
```
Frontend dev server runs on `http://localhost:5173`

### Option 4: Desktop App
```bash
npm run electron
# Or combined with frontend:
npm run electron-dev
```

## Project Structure

```
home-control/
├── README.md                           # Project documentation
├── .env                                # Environment variables (HUE_BRIDGE_IP, HUE_USERNAME)
├── .env.example                        # Example environment variables
├── package.json                        # Backend dependencies and scripts
├── tsconfig.json                       # Backend TypeScript configuration
├── shared/
│   └── types.ts                        # Shared type definitions for backend/frontend
├── src/                                # Backend source code
│   ├── index.ts                        # Entry point with store initialization
│   ├── server.ts                       # Express server with API & WebSocket
│   ├── store.ts                        # JSON persistence layer (data.json)
│   ├── devices/                        # Device handler modules
│   │   ├── deviceService.ts            # Device routing & scene execution orchestration
│   │   ├── hueDevice.ts                # Philips Hue Bridge integration (node-hue-api v3)
│   │   ├── mockDevice.ts               # Mock device implementations (for testing/fallback)
│   │   └── nanoleafDevice.ts           # Nanoleaf placeholder (future implementation)
│   └── socket.ts                       # WebSocket connection manager
├── dist/                               # Compiled JavaScript output (generated)
├── client/                             # React frontend application
│   ├── package.json                    # Frontend dependencies and scripts
│   ├── vite.config.ts                  # Vite build configuration
│   ├── tsconfig.json                   # Frontend TypeScript config
│   ├── index.html                      # Entry HTML file
│   └── src/
│       ├── main.tsx                    # React app entry point
│       ├── App.tsx                     # Main app component with Dashboard
│       ├── api.ts                      # HTTP fetch wrappers for backend API
│       ├── socket.ts                   # Frontend WebSocket client
│       ├── App.css                     # App-specific styles
│       └── index.css                   # Global styles
├── electron/                           # Electron desktop app
│   ├── main.js                         # Electron main process
│   └── preload.js                      # IPC preload script
└── data.json                           # Persisted mock devices and scenes (generated)
```

## API Endpoints

### GET /state
Returns current state of all devices (Hue + mock).

**Response**:
```json
{
  "devices": [
    {
      "id": "8",
      "name": "Living Room Light",
      "type": "Hue",
      "isOn": true,
      "brightness": 75,
      "capabilities": {
        "brightness": true,
        "color": true,
        "temperature": true
      },
      "state": {
        "isOn": true,
        "brightness": 75
      }
    }
  ],
  "scenes": [...]
}
```

### POST /device/:id/toggle
Toggle a device on/off (routes to Hue or mock handler).

**Parameters**: 
- `id` (path): Device ID (string or number)

**Response**:
```json
{
  "success": true,
  "state": { "isOn": true }
}
```

### POST /scene/create
Create and save a scene with validation.

**Body**:
```json
{
  "scene": {
    "name": "Evening Relax",
    "actions": [
      {
        "deviceId": "8",
        "state": { "isOn": true, "brightness": 30 }
      },
      {
        "deviceId": "9",
        "state": { "isOn": false }
      }
    ]
  }
}
```

**Validation**:
- All device IDs must exist in Hue Bridge or mock devices
- Returns error with invalid device IDs if validation fails
- Device type is automatically stored with each action

**Response**:
```json
{
  "success": true,
  "message": "Scene 'Evening Relax' created",
  "scenes": [...]
}
```

### POST /scene/run
Execute a saved scene (runs all actions in parallel).

**Body**:
```json
{
  "scene": {
    "name": "Evening Relax",
    "actions": [...]
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Scene 'Evening Relax' executed",
  "result": {
    "success": 2,
    "failed": 0,
    "errors": {}
  },
  "devices": [...]
}
```

**Error Handling**: Individual device action failures don't stop scene execution. Errors are captured per device.

### GET /scenes
Get all saved scenes.

**Response**:
```json
{
  "scenes": [
    {
      "name": "Morning",
      "actions": [
        {
          "deviceId": "8",
          "type": "Hue",
          "state": { "isOn": true, "brightness": 100 }
        }
      ]
    }
  ]
}
```

## WebSocket

Connect to `ws://localhost:3000` for real-time device state updates.

**Initial Connection**:
- Client receives current device state immediately upon connection
- Client can auto-reconnect with 2-second retry interval

**Message Format**:
```json
{
  "type": "state",
  "data": {
    "devices": [...]
  }
}
```

## Device Handler Architecture

The system uses a modular handler pattern for device control:

### Device Service (`src/devices/deviceService.ts`)
- **Routing**: Routes device operations to appropriate handler (Hue or mock)
- **Scene Execution**: Executes all scene actions in parallel with error isolation
- **Device Lookup**: Checks Hue Bridge first, then mock devices
- **Logging**: Detailed logging for debugging device operations

### Hue Device Handler (`src/devices/hueDevice.ts`)
- **Connection**: Persistent singleton connection to Hue Bridge
- **API**: Uses node-hue-api v3 for Hue Bridge communication
- **Functions**:
  - `getHueApi()`: Get or create persistent connection
  - `getAllLights()`: Fetch all lights from bridge
  - `toggle(deviceId)`: Toggle light on/off
  - `setState(deviceId, state)`: Update light state
  - `getState(deviceId)`: Read current light state
- **Error Handling**: Graceful failures with detailed logging

### Mock Device Handler (`src/devices/mockDevice.ts`)
- **Fallback**: Used when Hue Bridge unavailable or for testing
- **Persistence**: Mock devices stored in `data.json`
- **Functions**: Same interface as Hue handler

## Data Persistence

### Store Module (`src/store.ts`)
- **Format**: JSON file (`data.json`)
- **Contents**: Mock devices and saved scenes
- **Auto-save**: State saved on device updates and scene creation
- **Initialization**: Creates default devices/scenes if file doesn't exist

**Default mock devices**:
```json
{
  "devices": [
    {
      "id": "1",
      "name": "Living Room Light",
      "type": "mock",
      "capabilities": { "brightness": true, "color": true, "temperature": true },
      "state": { "isOn": true, "brightness": 50 }
    }
  ]
}
```

## Development

### Available Scripts

**Backend**:
- `npm start` - Run backend server (ts-node)
- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Backend with auto-reload (via full-dev)

**Frontend**:
- `cd client && npm run dev` - Start Vite dev server
- `cd client && npm run build` - Build for production

**Desktop**:
- `npm run electron` - Launch Electron app
- `npm run electron-dev` - Electron + frontend dev server
- `npm run full-dev` - All components (backend + frontend + Electron)

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Runtime** | Node.js v16+ |
| **Language** | TypeScript 5+ |
| **Backend** | Express.js, ws (WebSocket) |
| **Backend API** | node-hue-api v3 |
| **Frontend** | React 18, Vite |
| **Desktop** | Electron 40 |
| **Data Storage** | JSON file (fs module) |
| **Configuration** | dotenv |

### Extending the System

#### Adding a New Device Type
1. Create handler in `src/devices/newDevice.ts` with exports: `toggle()`, `setState()`, `getState()`, `getAllLights()`
2. Add type to `Action` and `Device` interfaces in `shared/types.ts`
3. Register handler in `deviceHandlers` map in `deviceService.ts`
4. Update device routing logic if needed

#### Adding API Endpoints
1. Add route to `src/server.ts` using `app.get/post/put/delete()`
2. Use `deviceService` functions for device operations
3. Call `broadcastUpdate()` if state changed
4. Add corresponding frontend API call in `client/src/api.ts`

#### Integration with Real APIs
- Replace mock data in `store.ts` with actual API calls
- Create new device handler with real API communication
- Implement error handling and logging
- Test with fallback to mocks

## Troubleshooting

### Hue Bridge Not Found
1. Check `.env` file has correct `HUE_BRIDGE_IP`
2. Ensure Hue Bridge is on same network
3. System will fall back to mock devices
4. Check console logs for detailed error messages

### Devices Not Updating
1. Check WebSocket connection: `ws://localhost:3000`
2. Verify backend is running on port 3000
3. Check browser console for connection errors
4. Restart backend with `npm start`

### Scene Validation Fails
1. Verify all device IDs in scene exist
2. Check device names and types match
3. Review API response for invalid device list
4. Use `/state` endpoint to get valid device IDs

### Mock Devices Not Persisting
1. Check `data.json` file exists and is readable
2. Verify write permissions in project root
3. Check disk space availability
4. Review console logs for save errors

## Example Usage

### Get Device State
```bash
curl http://localhost:3000/state
```

### Toggle a Hue Light
```bash
curl -X POST http://localhost:3000/device/8/toggle \
  -H "Content-Type: application/json"
```

### Create a Scene
```bash
curl -X POST http://localhost:3000/scene/create \
  -H "Content-Type: application/json" \
  -d '{
    "scene": {
      "name": "Night Mode",
      "actions": [
        {"deviceId": "8", "state": {"isOn": false}},
        {"deviceId": "9", "state": {"isOn": true, "brightness": 10}}
      ]
    }
  }'
```

### Run a Scene
```bash
curl -X POST http://localhost:3000/scene/run \
  -H "Content-Type: application/json" \
  -d '{
    "scene": {
      "name": "Night Mode",
      "actions": [...]
    }
  }'
```

## License

Proprietary - Home Control System 2026