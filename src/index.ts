import { Device, Scene, Action } from './types';

const devices: Device[] = [
  {
    id: 'hue1',
    type: 'Hue',
    capabilities: { brightness: true, color: true, temperature: true },
    state: { brightness: 50, color: { r: 255, g: 255, b: 255 }, temperature: 4000 }
  },
  {
    id: 'nano1',
    type: 'Nanoleaf',
    capabilities: { brightness: true, color: true, temperature: false },
    state: { brightness: 60, color: { r: 0, g: 255, b: 0 } }
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

console.log('Defined Devices:');
devices.forEach(device => console.log(`- ${device.id}: ${device.type}, capabilities: ${Object.keys(device.capabilities).filter(k => device.capabilities[k as keyof typeof device.capabilities]).join(', ')}`));

console.log('\nDefined Scenes:');
scenes.forEach(scene => {
  console.log(`- ${scene.name}:`);
  scene.actions.forEach(action => console.log(`  - Set ${action.type} on ${action.deviceId} to ${typeof action.value === 'object' ? `RGB(${action.value.r}, ${action.value.g}, ${action.value.b})` : action.value}`));
});