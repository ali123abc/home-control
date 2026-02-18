/**
 * Mock device implementation for testing and development.
 * All device operations are simulated locally without external dependencies.
 */

interface MockDeviceState {
  isOn: boolean;
  brightness?: number;
  color?: { r: number; g: number; b: number };
  temperature?: number;
}

/**
 * Toggle device on/off state
 */
export async function toggle(deviceId: string): Promise<MockDeviceState> {
  console.log(`[MockDevice] Toggling device ${deviceId}`);
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
  return { isOn: true };
}

/**
 * Set device state
 */
export async function setState(deviceId: string, state: Partial<MockDeviceState>): Promise<MockDeviceState> {
  console.log(`[MockDevice] Setting state for device ${deviceId}:`, state);
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
  return {
    isOn: state.isOn ?? true,
    brightness: state.brightness,
    color: state.color,
    temperature: state.temperature
  };
}

/**
 * Get device state
 */
export async function getState(deviceId: string): Promise<MockDeviceState> {
  console.log(`[MockDevice] Getting state for device ${deviceId}`);
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 50));
  return { isOn: true };
}
