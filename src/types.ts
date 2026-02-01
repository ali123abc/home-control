export interface Device {
  id: string;
  type: 'Hue' | 'Nanoleaf';
  capabilities: {
    brightness: boolean;
    color: boolean;
    temperature: boolean;
  };
  state: DeviceState;
}

export interface DeviceState {
  brightness?: number;
  color?: { r: number; g: number; b: number };
  temperature?: number;
}

export type Action =
  | { deviceId: string; type: 'brightness'; value: number }
  | { deviceId: string; type: 'color'; value: { r: number; g: number; b: number } }
  | { deviceId: string; type: 'temperature'; value: number };

export interface Scene {
  name: string;
  actions: Action[];
}