import { useState, useEffect } from 'react';
import './App.css'

console.log('App.tsx loaded');

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

function Dashboard() {
  console.log('Dashboard component rendered');
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [currentScene, setCurrentScene] = useState<{ name: string; actions: Action[] }>({ name: '', actions: [] });
  const [currentTab, setCurrentTab] = useState<'Devices' | 'Scenes' | 'Rooms'>('Devices');

  useEffect(() => {
    console.log('Starting fetch...');
    fetch('http://localhost:3000/state')
      .then(res => {
        console.log('Response received:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        console.log('Data received:', data);
        setDevices(data.devices);
        setLoading(false);
      })
      .catch(err => {
        console.error('Fetch failed:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const toggleDevice = async (id: string) => {
    try {
      const res = await fetch(`http://localhost:3000/device/${id}/toggle`, { method: 'POST' });
      if (!res.ok) throw new Error('Toggle failed');
      const data = await res.json();
      // Update local state
      setDevices(devices.map(d => d.id === id ? { ...d, state: data.state } : d));
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const saveScene = () => {
    if (currentScene.name && currentScene.actions.length > 0) {
      setScenes([...scenes, { ...currentScene }]);
      setCurrentScene({ name: '', actions: [] });
    }
  };

  const runScene = async (scene: Scene) => {
    try {
      const res = await fetch('http://localhost:3000/scene/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scene })
      });
      if (!res.ok) throw new Error('Scene run failed');
      // The server broadcasts updates via WebSocket, so local state should update automatically
    } catch (err) {
      console.error('Scene run error:', err);
    }
  };

  const updateAction = (deviceId: string, state: Partial<Device['state']>) => {
    setCurrentScene(prev => {
      const existing = prev.actions.find(a => a.deviceId === deviceId);
      if (existing) {
        return {
          ...prev,
          actions: prev.actions.map(a => a.deviceId === deviceId ? { ...a, state: { ...a.state, ...state } } : a)
        };
      } else {
        return {
          ...prev,
          actions: [...prev.actions, { deviceId, state }]
        };
      }
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #254F22 0%, #2a5a2a 100%)',
      padding: '2rem',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <header style={{
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <h1 style={{
          color: '#EDE4C2',
          fontSize: '3rem',
          fontWeight: 300,
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
          margin: 0
        }}>Home Dashboard</h1>
      </header>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '2rem'
      }}>
        {(['Devices', 'Scenes', 'Rooms'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setCurrentTab(tab)}
            style={{
              background: currentTab === tab ? '#F5824A' : '#EDE4C2',
              color: currentTab === tab ? '#EDE4C2' : '#254F22',
              border: '2px solid #A03A13',
              padding: '0.5rem 1rem',
              margin: '0 0.5rem',
              borderRadius: '10px',
              fontSize: '1.1rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{
        width: '100%',
        maxWidth: '800px'
      }}>
        {currentTab === 'Devices' && (
          <>
            <h2 style={{
              color: '#F5824A',
              fontSize: '2rem',
              fontWeight: 400,
              marginBottom: '1rem',
              textAlign: 'center'
            }}>Devices</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              {loading ? (
                <p style={{ color: '#EDE4C2', gridColumn: '1 / -1', textAlign: 'center' }}>Loading devices...</p>
              ) : error ? (
                <p style={{ color: '#F5824A', gridColumn: '1 / -1', textAlign: 'center' }}>Error loading devices: {error}</p>
              ) : (
                devices.map(device => (
                  <div key={device.id} style={{
                    background: '#EDE4C2',
                    padding: '1.5rem',
                    borderRadius: '15px',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
                    border: '2px solid #A03A13',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
                  }}>
                    <h3 style={{
                      color: '#254F22',
                      fontSize: '1.2rem',
                      fontWeight: 500,
                      margin: '0 0 0.5rem 0'
                    }}>{device.name || device.id}</h3>
                    <p style={{
                      color: device.state.isOn ? '#2a5a2a' : '#A03A13',
                      fontSize: '1rem',
                      margin: '0 0 1rem 0'
                    }}>Status: {device.state.isOn ? 'On' : 'Off'}</p>
                    <button onClick={() => toggleDevice(device.id)} style={{
                      background: device.state.isOn ? '#A03A13' : '#254F22',
                      color: '#EDE4C2',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = device.state.isOn ? '#8B2D0F' : '#1e3f1a';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = device.state.isOn ? '#A03A13' : '#254F22';
                    }}>
                      {device.state.isOn ? 'Turn Off' : 'Turn On'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {currentTab === 'Scenes' && (
          <>
            <h2 style={{
              color: '#F5824A',
              fontSize: '2rem',
              fontWeight: 400,
              marginBottom: '1rem',
              textAlign: 'center'
            }}>Scene Management</h2>

            {/* Create Scene Form */}
            <div style={{
              background: '#EDE4C2',
              padding: '1.5rem',
              borderRadius: '15px',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
              border: '2px solid #A03A13',
              marginBottom: '1rem'
            }}>
              <h3 style={{ color: '#254F22', margin: '0 0 1rem 0' }}>Create New Scene</h3>
              <input
                type="text"
                placeholder="Scene Name"
                value={currentScene.name}
                onChange={(e) => setCurrentScene(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  marginBottom: '1rem',
                  border: '1px solid #A03A13',
                  borderRadius: '5px',
                  fontSize: '1rem'
                }}
              />
              <div>
                {devices.map(device => {
                  const action = currentScene.actions.find(a => a.deviceId === device.id);
                  return (
                    <div key={device.id} style={{
                      border: '1px solid #A03A13',
                      borderRadius: '10px',
                      padding: '1rem',
                      marginBottom: '1rem',
                      background: '#F5F5DC'
                    }}>
                      <h4 style={{ color: '#254F22', margin: '0 0 0.5rem 0' }}>{device.name || device.id}</h4>
                      <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={!!action}
                          onChange={(e) => {
                            if (e.target.checked) {
                              updateAction(device.id, {});
                            } else {
                              setCurrentScene(prev => ({
                                ...prev,
                                actions: prev.actions.filter(a => a.deviceId !== device.id)
                              }));
                            }
                          }}
                        /> Include in scene
                      </label>
                      {action && (
                        <div style={{ marginLeft: '1rem' }}>
                          <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                            <input
                              type="checkbox"
                              checked={action.state.isOn ?? false}
                              onChange={(e) => updateAction(device.id, { isOn: e.target.checked })}
                            /> Turn On
                          </label>
                          {device.capabilities.brightness && (
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                              Brightness:
                              <input
                                type="range"
                                min="0"
                                max="100"
                                value={action.state.brightness ?? 50}
                                onChange={(e) => updateAction(device.id, { brightness: parseInt(e.target.value) })}
                                style={{ marginLeft: '0.5rem' }}
                              />
                              {action.state.brightness ?? 50}%
                            </label>
                          )}
                          {device.capabilities.color && (
                            <div style={{ marginBottom: '0.5rem' }}>
                              Color:
                              <input
                                type="color"
                                value={`#${((action.state.color?.r ?? 255) << 16 | (action.state.color?.g ?? 255) << 8 | (action.state.color?.b ?? 255)).toString(16).padStart(6, '0')}`}
                                onChange={(e) => {
                                  const hex = e.target.value.slice(1);
                                  const r = parseInt(hex.slice(0, 2), 16);
                                  const g = parseInt(hex.slice(2, 4), 16);
                                  const b = parseInt(hex.slice(4, 6), 16);
                                  updateAction(device.id, { color: { r, g, b } });
                                }}
                                style={{ marginLeft: '0.5rem' }}
                              />
                            </div>
                          )}
                          {device.capabilities.temperature && (
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
                              Temperature:
                              <input
                                type="range"
                                min="2700"
                                max="6500"
                                value={action.state.temperature ?? 4000}
                                onChange={(e) => updateAction(device.id, { temperature: parseInt(e.target.value) })}
                                style={{ marginLeft: '0.5rem' }}
                              />
                              {action.state.temperature ?? 4000}K
                            </label>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <button onClick={saveScene} style={{
                background: '#254F22',
                color: '#EDE4C2',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                fontSize: '1rem',
                cursor: 'pointer'
              }}>Save Scene</button>
            </div>

            {/* Saved Scenes */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              {scenes.map((scene, index) => (
                <div key={index} style={{
                  background: '#EDE4C2',
                  padding: '1rem',
                  borderRadius: '10px',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                  border: '2px solid #A03A13'
                }}>
                  <h4 style={{ color: '#254F22', margin: '0 0 0.5rem 0' }}>{scene.name}</h4>
                  <p style={{ color: '#A03A13', margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
                    {scene.actions.length} device{scene.actions.length !== 1 ? 's' : ''}
                  </p>
                  <button onClick={() => runScene(scene)} style={{
                    background: '#F5824A',
                    color: '#EDE4C2',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    width: '100%'
                  }}>Run Scene</button>
                </div>
              ))}
            </div>
          </>
        )}

        {currentTab === 'Rooms' && (
          <div style={{
            background: '#EDE4C2',
            padding: '2rem',
            borderRadius: '15px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)',
            border: '2px solid #A03A13',
            textAlign: 'center'
          }}>
            <h2 style={{ color: '#254F22', margin: '0 0 1rem 0' }}>Rooms</h2>
            <p style={{ color: '#A03A13', fontSize: '1.2rem' }}>Room management feature coming soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  console.log('App component rendered');
  return (
    <>
      <Dashboard />
    </>
  )
}

export default App