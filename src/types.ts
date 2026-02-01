export interface Device {
  id: string;
  name?: string;
  type: 'Hue' | 'Nanoleaf';
  capabilities: {
    brightness: boolean;
    color: boolean;
    temperature: boolean;
  };
  state: DeviceState;
}

export interface DeviceState {
  isOn?: boolean;
  brightness?: number;
  color?: { r: number; g: number; b: number };
  temperature?: number;
}

export interface Action {
  deviceId: string;
  state: Partial<DeviceState>;
}

export interface Scene {
  name: string;
  actions: Action[];
}