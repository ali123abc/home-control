import express from 'express';
import WebSocket from 'ws';
import cors from 'cors';
import { Device, Scene, Action } from './types';

const devices: Device[] = [
  {
    id: 'hue1',
    name: 'Living Room Light',
    type: 'Hue',
    capabilities: { brightness: true, color: true, temperature: true },
    state: { isOn: true, brightness: 50, color: { r: 255, g: 255, b: 255 }, temperature: 4000 }
  },
  {
    id: 'nano1',
    name: 'Bedroom Panels',
    type: 'Nanoleaf',
    capabilities: { brightness: true, color: true, temperature: false },
    state: { isOn: true, brightness: 60, color: { r: 0, g: 255, b: 0 } }
  }
];

const scenes: Scene[] = [
  {
    name: 'Morning',
    actions: [
      { deviceId: 'hue1', state: { brightness: 80, color: { r: 255, g: 255, b: 255 } } },
      { deviceId: 'nano1', state: { brightness: 70 } }
    ]
  },
  {
    name: 'Evening',
    actions: [
      { deviceId: 'hue1', state: { temperature: 2700 } },
      { deviceId: 'nano1', state: { color: { r: 255, g: 100, b: 50 } } }
    ]
  }
];

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

  return devices;
}

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/state', (req, res) => {
  res.json({ devices });
});

app.post('/scene/run', (req, res) => {
  const { scene } = req.body as { scene: Scene };
  if (!scene || !scene.actions) {
    return res.status(400).json({ error: 'Invalid scene object' });
  }

  const updatedDevices = runScene(scene);

  res.json({ success: true, message: `Scene '${scene.name}' executed`, devices: updatedDevices });
});

app.post('/device/:id/toggle', (req, res) => {
  const { id } = req.params;
  const device = devices.find(d => d.id === id);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  device.state.isOn = !device.state.isOn;

  // Broadcast update
  broadcastUpdate();

  res.json({ success: true, state: device.state });
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