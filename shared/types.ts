/**
 * Shared type definitions for home control system.
 * Used by both backend (server) and frontend (React) applications.
 * Backend: Backend server, API endpoints, WebSocket messages
 * Frontend: React components, device state management, UI rendering
 */

// ============================================================================
// Device Types
// ============================================================================

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

// ============================================================================
// Scene & Action Types
// ============================================================================

export interface Action {
  deviceId: string;
  type?: 'Hue' | 'Nanoleaf' | 'mock'; // Optional for backward compatibility, includes device handler type
  state: Partial<DeviceState>;
}

export interface Scene {
  name: string;
  actions: Action[];
}