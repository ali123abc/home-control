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
      { deviceId: 'hue1', type: 'brightness', value: 80 },
      { deviceId: 'hue1', type: 'color', value: { r: 255, g: 255, b: 255 } },
      { deviceId: 'nano1', type: 'brightness', value: 70 }
    ]
  },
  {
    name: 'Evening',
    actions: [
      { deviceId: 'hue1', type: 'temperature', value: 2700 },
      { deviceId: 'nano1', type: 'color', value: { r: 255, g: 100, b: 50 } }
    ]
  }
];

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/state', (req, res) => {
  res.json({ devices });
});

app.post('/scene/run', (req, res) => {
  const { sceneName } = req.body;
  const scene = scenes.find(s => s.name === sceneName);
  if (!scene) {
    return res.status(404).json({ error: 'Scene not found' });
  }

  // Apply actions to devices
  scene.actions.forEach((action: Action) => {
    const device = devices.find(d => d.id === action.deviceId);
    if (device) {
      if (action.type === 'brightness' && device.capabilities.brightness) {
        device.state.brightness = action.value as number;
      } else if (action.type === 'color' && device.capabilities.color) {
        device.state.color = action.value as { r: number; g: number; b: number };
      } else if (action.type === 'temperature' && device.capabilities.temperature) {
        device.state.temperature = action.value as number;
      }
    }
  });

  // Broadcast update to WebSocket clients
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'state', data: { devices } }));
    }
  });

  res.json({ success: true, message: `Scene '${sceneName}' executed` });
});

app.post('/device/:id/toggle', (req, res) => {
  const { id } = req.params;
  const device = devices.find(d => d.id === id);
  if (!device) {
    return res.status(404).json({ error: 'Device not found' });
  }
  device.state.isOn = !device.state.isOn;
  // Optionally set brightness to 0 if off, but for now just toggle isOn

  // Broadcast update
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'state', data: { devices } }));
    }
  });

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