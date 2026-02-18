import { v3 } from 'node-hue-api';
import dotenv from 'dotenv';

dotenv.config();

const bridgeIp = process.env.HUE_BRIDGE_IP;
const username = process.env.HUE_USERNAME;

if (!bridgeIp || !username) {
  console.warn('[HueDevice] Hue Bridge IP or username missing. Hue device operations will fail.');
  console.warn('[HueDevice] Set HUE_BRIDGE_IP and HUE_USERNAME in .env file');
}

// Single persistent API instance - cached after first successful connection
let apiInstance: any = null;

/**
 * Get or create a persistent Hue API connection
 * Returns the same connection on subsequent calls (singleton pattern)
 */
export async function getHueApi() {
  if (apiInstance) return apiInstance;
  
  if (!bridgeIp || !username) {
    throw new Error('[HueDevice] Cannot connect to Hue Bridge: HUE_BRIDGE_IP or HUE_USERNAME not set in .env');
  }

  try {
    console.log('[HueDevice] Connecting to Hue Bridge at', bridgeIp);
    apiInstance = await v3.api.createLocal(bridgeIp).connect(username);
    console.log('[HueDevice] Successfully connected to Hue Bridge');
    return apiInstance;
  } catch (err) {
    console.error('[HueDevice] Failed to connect to Hue Bridge:', err);
    apiInstance = null; // Reset on failure so next attempt will retry
    throw err;
  }
}

export interface HueDeviceState {
  isOn: boolean;
  brightness?: number;
  color?: { r: number; g: number; b: number };
  temperature?: number;
}

export interface HueDevice {
  id: number | string;
  name: string;
  type: 'Hue';
  isOn: boolean;
  brightness?: number;
  capabilities: {
    brightness: boolean;
    color: boolean;
    temperature: boolean;
  };
  state: HueDeviceState;
}

// Fetch all lights from bridge
export async function getAllLights(): Promise<HueDevice[]> {
  try {
    const api = await getHueApi();
    const lights = await api.lights.getAll();
    return lights.map((light: any) => ({
      id: light.id,
      name: light.name,
      type: 'Hue',
      isOn: light.state.on,
      brightness: light.state.bri,
      capabilities: { brightness: true, color: true, temperature: true },
      state: { isOn: light.state.on, brightness: light.state.bri }
    }));
  } catch (err) {
    console.error('[HueDevice] Failed to fetch lights:', err);
    return [];
  }
}

// Toggle a Hue light
export async function toggle(deviceId: string | number): Promise<HueDeviceState> {
  try {
    const api = await getHueApi();
    const light = await api.lights.getLight(deviceId);
    const newState = !light.state.on;
    await api.lights.setLightState(deviceId, { on: newState });
    return { isOn: newState, brightness: light.state.bri };
  } catch (err) {
    console.error(`[HueDevice] Failed to toggle light ${deviceId}:`, err);
    throw err instanceof Error ? err : new Error('Failed to toggle Hue light');
  }
}

// Set state for a Hue light
export async function setState(deviceId: string | number, state: Partial<HueDeviceState>): Promise<HueDeviceState> {
  try {
    const api = await getHueApi();
    const lightState: any = {};
    if (state.isOn !== undefined) lightState.on = state.isOn;
    if (state.brightness !== undefined) lightState.bri = state.brightness;

    await api.lights.setLightState(deviceId, lightState);

    const updated = await api.lights.getLight(deviceId);
    return { isOn: updated.state.on, brightness: updated.state.bri };
  } catch (err) {
    console.error(`[HueDevice] Failed to set state for light ${deviceId}:`, err);
    throw err instanceof Error ? err : new Error('Failed to set Hue light state');
  }
}

// Get current state
export async function getState(deviceId: string | number): Promise<HueDeviceState> {
  try {
    const api = await getHueApi();
    const light = await api.lights.getLight(deviceId);
    return { isOn: light.state.on, brightness: light.state.bri };
  } catch (err) {
    console.error(`[HueDevice] Failed to get state for light ${deviceId}:`, err);
    throw err instanceof Error ? err : new Error('Failed to get Hue light state');
  }
}
