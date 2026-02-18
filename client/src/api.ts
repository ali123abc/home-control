interface Device {
  id: string;
  name?: string;
  type: string;
  capabilities: {
    brightness: boolean;
    color: boolean;
    temperature: boolean;
  };
  state: {
    isOn?: boolean;
    brightness?: number;
    color?: { r: number; g: number; b: number };
    temperature?: number;
  };
}

interface Action {
  deviceId: string;
  state: Partial<Device['state']>;
}

interface Scene {
  name: string;
  actions: Action[];
}

interface StateResponse {
  devices: Device[];
}

interface ToggleResponse {
  state: Device['state'];
}

interface ScenesResponse {
  scenes: Scene[];
}

const API_BASE = 'http://192.168.0.129:3000';

/**
 * Fetch current device states from the backend
 */
export async function fetchState(): Promise<Device[]> {
  try {
    console.log('Starting fetch...');
    const res = await fetch(`${API_BASE}/state`);
    console.log('Response received:', res.status);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data: StateResponse = await res.json();
    console.log('Data received:', data);
    return data.devices;
  } catch (err) {
    console.error('Fetch failed:', err);
    throw err instanceof Error ? err : new Error('Unknown error');
  }
}

/**
 * Toggle a device on/off state
 */
export async function toggleDevice(id: string): Promise<Device['state']> {
  try {
    const res = await fetch(`${API_BASE}/device/${id}/toggle`, { method: 'POST' });
    if (!res.ok) throw new Error('Toggle failed');
    const data: ToggleResponse = await res.json();
    return data.state;
  } catch (err) {
    console.error('Toggle error:', err);
    throw err instanceof Error ? err : new Error('Unknown error');
  }
}

/**
 * Run a scene on the backend
 */
export async function runScene(scene: Scene): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/scene/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scene })
    });
    if (!res.ok) throw new Error('Scene run failed');
    // The server broadcasts updates via WebSocket, so local state should update automatically
  } catch (err) {
    console.error('Scene run error:', err);
    throw err instanceof Error ? err : new Error('Unknown error');
  }
}

/**
 * Create and save a new scene on the backend
 */
export async function createScene(scene: Scene): Promise<Scene[]> {
  try {
    const res = await fetch(`${API_BASE}/scene/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scene })
    });
    if (!res.ok) throw new Error('Scene creation failed');
    const data: ScenesResponse = await res.json();
    return data.scenes;
  } catch (err) {
    console.error('Scene creation error:', err);
    throw err instanceof Error ? err : new Error('Unknown error');
  }
}

/**
 * Fetch all saved scenes from the backend
 */
export async function fetchScenes(): Promise<Scene[]> {
  try {
    const res = await fetch(`${API_BASE}/scenes`);
    if (!res.ok) throw new Error('Failed to fetch scenes');
    const data: ScenesResponse = await res.json();
    return data.scenes;
  } catch (err) {
    console.error('Fetch scenes error:', err);
    throw err instanceof Error ? err : new Error('Unknown error');
  }
}
