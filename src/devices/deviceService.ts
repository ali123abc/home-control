/**
 * Device Service
 * 
 * Abstracts device operations and routes them to the appropriate device handler
 * based on device type. Routes Hue devices to the Hue API, uses mockDevice as fallback.
 * 
 * Extensible architecture allows adding real device integrations:
 * - Hue (Philips Hue lights) - connected via hue-api
 * - Nanoleaf (Nanoleaf panels) - mockDevice for now
 * - Custom integrations
 */

import * as mockDevice from './mockDevice';
import * as hueDevice from './hueDevice';
import * as nanoleafDevice from './nanoleafDevice';
import { getState as getAppState } from '../store';
import { Device, Scene, Action } from '../../shared/types';
import { getAllLights as getHueLights } from './hueDevice';

type DeviceHandler = typeof mockDevice;

// Map device types to their handler modules
const deviceHandlers: Record<string, DeviceHandler> = {
  'Hue': hueDevice,
  'Nanoleaf': mockDevice, // TODO: Change to nanoleafDevice when ready
  'mock': mockDevice
};

/**
 * Get the appropriate device handler based on device type
 * Returns the handler for Hue or mock devices, or null if not found
 */
async function getDeviceHandler(deviceId: string): Promise<DeviceHandler | null> {
  try {
    // First, check if it's a Hue device from the bridge
    const hueDevices = await getHueLights();
    const hueDeviceObj = hueDevices.find(d => String(d.id) === String(deviceId));
    if (hueDeviceObj) {
      return hueDevice;
    }
    
    // Then check stored mock devices
    const { devices } = getAppState();
    const storedDevice = devices.find((d: Device) => String(d.id) === String(deviceId));
    if (storedDevice) {
      const handler = deviceHandlers[storedDevice.type];
      if (handler) return handler;
    }
    
    // Device not found
    console.warn(`[DeviceService] Device ${deviceId} not found in Hue bridge or stored devices`);
    return null;
  } catch (err) {
    console.warn(`[DeviceService] Error determining device handler for ${deviceId}:`, err);
    return null;
  }
}

/**
 * Toggle a device on/off
 */
export async function toggleDevice(deviceId: string): Promise<{ isOn: boolean }> {
  try {
    const handler = await getDeviceHandler(deviceId);
    if (!handler) {
      throw new Error(`Device ${deviceId} not found`);
    }
    const result = await handler.toggle(deviceId);
    console.log(`Device ${deviceId} toggled successfully`);
    return { isOn: result.isOn };
  } catch (err) {
    console.error(`Failed to toggle device ${deviceId}:`, err);
    throw err instanceof Error ? err : new Error('Failed to toggle device');
  }
}

/**
 * Set device state (brightness, color, temperature, etc.)
 */
export async function setDeviceState(
  deviceId: string,
  state: { isOn?: boolean; brightness?: number; color?: { r: number; g: number; b: number }; temperature?: number }
): Promise<void> {
  try {
    const handler = await getDeviceHandler(deviceId);
    if (!handler) {
      throw new Error(`Device ${deviceId} not found`);
    }
    await handler.setState(deviceId, state);
    console.log(`Device ${deviceId} state set successfully`);
  } catch (err) {
    console.error(`Failed to set state for device ${deviceId}:`, err);
    throw err instanceof Error ? err : new Error('Failed to set device state');
  }
}

/**
 * Get current device state
 */
export async function getDeviceState(deviceId: string): Promise<any> {
  try {
    const handler = await getDeviceHandler(deviceId);
    if (!handler) {
      throw new Error(`Device ${deviceId} not found`);
    }
    return await handler.getState(deviceId);
  } catch (err) {
    console.error(`Failed to get state for device ${deviceId}:`, err);
    throw err instanceof Error ? err : new Error('Failed to get device state');
  }
}

/**
 * Get all devices: combines mock devices from store with live Hue lights
 */
export async function getAllDevices(): Promise<Device[]> {
  const { devices: storedDevices } = getAppState();
  const hueDevicesRaw = await getHueLights();
  
  // Convert Hue devices to Device format and avoid duplicates
  const hueIds = new Set(hueDevicesRaw.map(d => String(d.id)));
  const mockOnlyDevices = storedDevices.filter(d => !hueIds.has(String(d.id)));
  
  // Cast Hue devices to Device[] type
  const hueAsDevices = hueDevicesRaw.map(d => ({
    ...d,
    id: String(d.id)
  } as Device));
  
  return [...mockOnlyDevices, ...hueAsDevices];
}

/**
 * Execute all actions in a scene asynchronously
 * - Applies state changes to all devices in parallel using Promise.all
 * - Catches and logs errors for individual devices without stopping the scene
 * - Returns results showing which actions succeeded and which failed
 */
export async function runScene(scene: Scene): Promise<{ success: number; failed: number; errors: Record<string, string> }> {
  console.log(`[DeviceService] Running scene: "${scene.name}" with ${scene.actions.length} action(s)`);
  
  const errors: Record<string, string> = {};
  let successCount = 0;
  let failureCount = 0;

  // Execute all actions in parallel with error isolation
  const results = await Promise.all(
    scene.actions.map(async (action: Action) => {
      try {
        console.log(`[DeviceService] Applying action to device ${action.deviceId}:`, action.state);
        await setDeviceState(action.deviceId, action.state);
        successCount++;
        console.log(`[DeviceService] ✓ Action succeeded for device ${action.deviceId}`);
      } catch (err) {
        failureCount++;
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors[action.deviceId] = errorMsg;
        console.error(`[DeviceService] ✗ Action failed for device ${action.deviceId}:`, errorMsg);
      }
    })
  );

  const summary = { success: successCount, failed: failureCount, errors };
  console.log(`[DeviceService] Scene "${scene.name}" completed:`, summary);
  return summary;
}