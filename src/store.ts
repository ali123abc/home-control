import fs from 'fs';
import path from 'path';
import { Device, Scene } from '../shared/types';

const DATA_FILE = path.join(process.cwd(), 'data.json');

interface AppState {
  devices: Device[];
  scenes: Scene[];
}

const DEFAULT_STATE: AppState = {
  devices: [
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
  ],
  scenes: [
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
  ]
};

/**
 * Initialize store. Reads from data.json or creates with default data.
 */
export function initializeStore(): void {
  if (!fs.existsSync(DATA_FILE)) {
    console.log(`Creating data.json with default data at ${DATA_FILE}`);
    saveState(DEFAULT_STATE);
  } else {
    console.log(`Loading data from ${DATA_FILE}`);
    try {
      const data = getState();
      console.log(`Loaded ${data.devices.length} devices and ${data.scenes.length} scenes`);
    } catch (err) {
      console.error('Failed to read data.json, reinitializing with defaults');
      saveState(DEFAULT_STATE);
    }
  }
}

/**
 * Get current application state from data.json
 */
export function getState(): AppState {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data) as AppState;
  } catch (err) {
    console.error('Error reading data.json:', err);
    throw new Error('Failed to read application state');
  }
}

/**
 * Save application state to data.json
 */
export function saveState(state: AppState): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to data.json:', err);
    throw new Error('Failed to save application state');
  }
}
