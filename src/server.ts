import express from 'express';
import WebSocket from 'ws';
import cors from 'cors';
import { Device, Scene, Action } from '../shared/types';
import { initializeStore, getState, saveState } from './store';
import * as deviceService from './devices/deviceService';

// Initialize store - loads data.json or creates with defaults
initializeStore();
let { devices, scenes } = getState();

function broadcastUpdate() {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'state', data: { devices } }));
    }
  });
}

function runScene(scene: Scene): Device[] {
  scene.actions.forEach(action => {
    const device = devices.find(d => d.id === action.deviceId);
    if (device) {
      // Update the device state with the action's state, respecting capabilities
      if (action.state.isOn !== undefined) {
        device.state.isOn = action.state.isOn;
      }
      if (action.state.brightness !== undefined && device.capabilities.brightness) {
        device.state.brightness = action.state.brightness;
      }
      if (action.state.color !== undefined && device.capabilities.color) {
        device.state.color = action.state.color;
      }
      if (action.state.temperature !== undefined && device.capabilities.temperature) {
        device.state.temperature = action.state.temperature;
      }
    }
  });

  // Broadcast the updated state to all connected WebSocket clients
  broadcastUpdate();

  // Save state to disk
  saveState({ devices, scenes });

  return devices;
}

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/state', async (req, res) => {
  try {
    const devices = await deviceService.getAllDevices();
    res.json({ devices, scenes });
  } catch (err) {
    console.error('Failed to get devices:', err);
    res.status(500).json({ error: 'Failed to retrieve device state' });
  }
});


app.get('/scenes', (req, res) => {
  res.json({ scenes });
});

app.post('/scene/create', async (req, res) => {
  try {
    const { scene } = req.body as { scene: Scene };
    if (!scene || !scene.name || !Array.isArray(scene.actions)) {
      return res.status(400).json({ error: 'Invalid scene object' });
    }

    // Get all available devices to validate and retrieve types
    const allDevices = await deviceService.getAllDevices();
    const deviceMap = new Map(allDevices.map(d => [String(d.id), d]));

    // Validate all device IDs exist and enrich actions with device type
    const enrichedActions: Action[] = [];
    const invalidDevices: string[] = [];

    for (const action of scene.actions) {
      const device = deviceMap.get(String(action.deviceId));
      if (!device) {
        invalidDevices.push(String(action.deviceId));
      } else {
        enrichedActions.push({
          deviceId: action.deviceId,
          type: device.type as any,
          state: action.state
        });
      }
    }

    if (invalidDevices.length > 0) {
      return res.status(400).json({
        error: `Invalid device IDs in scene: ${invalidDevices.join(', ')}`,
        invalidDevices
      });
    }

    // Create scene with enriched actions
    const enrichedScene: Scene = {
      name: scene.name,
      actions: enrichedActions
    };

    scenes.push(enrichedScene);
    saveState({ devices, scenes });

    console.log(`[Server] Scene '${scene.name}' created with ${enrichedActions.length} actions`);
    res.json({ success: true, message: `Scene '${scene.name}' created`, scenes });
  } catch (err) {
    console.error('[Server] Failed to create scene:', err);
    res.status(500).json({ error: 'Failed to create scene' });
  }
});

app.post('/scene/run', async (req, res) => {
  try {
    const { scene } = req.body as { scene: Scene };
    if (!scene || !scene.actions) {
      return res.status(400).json({ error: 'Invalid scene object' });
    }

    // Use deviceService to run the scene (handles Hue and mock devices properly)
    const result = await deviceService.runScene(scene);

    // Get updated devices for response
    const updatedDevices = await deviceService.getAllDevices();

    res.json({
      success: true,
      message: `Scene '${scene.name}' executed`,
      result,
      devices: updatedDevices
    });
  } catch (err) {
    console.error('[Server] Failed to run scene:', err);
    res.status(500).json({ error: 'Failed to run scene' });
  }
});

app.post('/device/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to toggle device using deviceService (handles Hue and mock devices)
    const result = await deviceService.toggleDevice(id);
    
    // Update local mock devices for mock types
    const device = devices.find(d => d.id === id);
    if (device && device.type !== 'Hue') {
      device.state.isOn = result.isOn;
    }

    // Broadcast update
    broadcastUpdate();

    // Save state to disk (only mock devices)
    saveState({ devices, scenes });

    res.json({ success: true, state: { isOn: result.isOn } });
  } catch (err) {
    console.error(`Failed to toggle device:`, err);
    res.status(500).json({ error: 'Failed to toggle device' });
  }
});

const server = app.listen(port, () => {
  console.log(`Home control server running on http://localhost:${port}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');
  // Send initial state
  ws.send(JSON.stringify({ type: 'state', data: { devices } }));

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});