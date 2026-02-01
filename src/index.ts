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
];

console.log('Defined Devices:');
devices.forEach(device => console.log(`- ${device.id}: ${device.type}, capabilities: ${Object.keys(device.capabilities).filter(k => device.capabilities[k as keyof typeof device.capabilities]).join(', ')}`));

console.log('\nDefined Scenes:');
scenes.forEach(scene => {
  console.log(`- ${scene.name}:`);
  scene.actions.forEach(action => {
    const stateStr = Object.entries(action.state).map(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return `${key}: RGB(${value.r}, ${value.g}, ${value.b})`;
      }
      return `${key}: ${value}`;
    }).join(', ');
    console.log(`  - Set ${action.deviceId} to ${stateStr}`);
  });
});