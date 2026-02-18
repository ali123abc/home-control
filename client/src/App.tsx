import { useState, useEffect, useRef } from 'react';
import './App.css'
import { initializeWebSocket } from './socket'
import { fetchState, toggleDevice as apiToggleDevice, runScene as apiRunScene, createScene, fetchScenes } from './api'
import SpaceBackground from './SpaceBackground'

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
  const [wsConnected, setWsConnected] = useState(true);
  const wsManagerRef = useRef<{ close: () => void } | null>(null);

  // Fetch device state from backend
  const fetchDeviceState = async () => {
    setLoading(true);
    setError(null);
    try {
      const devices = await fetchState();
      setDevices(devices);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeviceState();
    loadScenes();
  }, []);

  const loadScenes = async () => {
    try {
      const loadedScenes = await fetchScenes();
      setScenes(loadedScenes);
    } catch (err) {
      console.error('Failed to load scenes:', err);
    }
  };

  // Setup WebSocket connection with auto-retry
  useEffect(() => {
    wsManagerRef.current = initializeWebSocket(
      'ws://localhost:3000',
      {
        onConnect: () => {
          console.log('WebSocket connected');
          setWsConnected(true);
          // Re-fetch full state on reconnect
          fetchDeviceState();
          loadScenes();
        },
        onMessage: (data) => {
          console.log('WebSocket message received:', data);
          if (data.type === 'state' && data.data.devices) {
            console.log('Updating devices from WebSocket:', data.data.devices);
            setDevices(data.data.devices);
          }
        },
        onError: (error) => {
          console.error('WebSocket error:', error);
          setWsConnected(false);
        },
        onClose: () => {
          console.log('WebSocket closed, will retry in 2 seconds...');
          setWsConnected(false);
        }
      }
    );

    // Cleanup on unmount
    return () => {
      if (wsManagerRef.current) {
        wsManagerRef.current.close();
        wsManagerRef.current = null;
      }
    };
  }, []);

  const handleToggleDevice = async (id: string) => {
    try {
      const state = await apiToggleDevice(id);
      // Update local state
      setDevices(devices.map(d => d.id === id ? { ...d, state } : d));
    } catch (err) {
      // Error already logged in api.ts
    }
  };

  const saveScene = async () => {
    if (currentScene.name && currentScene.actions.length > 0) {
      try {
        const savedScenes = await createScene(currentScene);
        setScenes(savedScenes);
        setCurrentScene({ name: '', actions: [] });
      } catch (err) {
        console.error('Failed to save scene:', err);
      }
    }
  };

  const handleRunScene = async (scene: Scene) => {
    try {
      await apiRunScene(scene);
      // The server broadcasts updates via WebSocket, so local state should update automatically
    } catch (err) {
      // Error already logged in api.ts
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
      padding: '2rem',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      position: 'relative',
      color: '#ffffff',
      width: '100%'
    }}>
      <header style={{
        textAlign: 'center',
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <h1 style={{
          color: '#FFFFFF',
          fontSize: '3rem',
          fontWeight: 300,
          textShadow: '0 0 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(157, 78, 221, 0.4)',
          margin: 0
        }}>Home Dashboard</h1>
        {!wsConnected && (
          <div style={{
            background: 'rgba(160, 58, 19, 0.8)',
            color: '#FFFFFF',
            padding: '0.5rem 1rem',
            borderRadius: '5px',
            fontSize: '0.9rem',
            fontWeight: 500,
            border: '1px solid rgba(237, 228, 194, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            ⚠ Disconnected - Attempting to reconnect...
          </div>
        )}
      </header>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '2rem',
        gap: '0.5rem'
      }}>
        {(['Devices', 'Scenes', 'Rooms'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setCurrentTab(tab)}
            style={{
              background: currentTab === tab ? 'rgba(157, 78, 221, 0.8)' : 'rgba(255, 255, 255, 0.1)',
              color: '#FFFFFF',
              border: '2px solid ' + (currentTab === tab ? 'rgba(157, 78, 221, 1)' : 'rgba(255, 255, 255, 0.3)'),
              padding: '0.5rem 1rem',
              margin: '0',
              borderRadius: '10px',
              fontSize: '1.1rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = currentTab === tab ? 'rgba(157, 78, 221, 1)' : 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = currentTab === tab ? 'rgba(157, 78, 221, 0.8)' : 'rgba(255, 255, 255, 0.1)';
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
              color: '#FFFFFF',
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
                <p style={{ color: '#FFFFFF', gridColumn: '1 / -1', textAlign: 'center', fontSize: '1.1rem' }}>Loading devices...</p>
              ) : error ? (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
                  <p style={{ color: '#FFFFFF', marginBottom: '1rem', fontSize: '1rem' }}>Error loading devices: {error}</p>
                  <button onClick={fetchDeviceState} style={{
                    background: 'linear-gradient(135deg, rgba(255, 100, 100, 0.9), rgba(255, 150, 150, 0.9))',
                    color: '#FFFFFF',
                    border: '2px solid rgba(255, 150, 150, 1)',
                    padding: '0.7rem 1.2rem',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 0 15px rgba(255, 100, 100, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 120, 120, 1), rgba(255, 170, 170, 1))';
                    e.currentTarget.style.boxShadow = '0 0 25px rgba(255, 100, 100, 0.8)';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 100, 100, 0.9), rgba(255, 150, 150, 0.9))';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 100, 100, 0.5)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}>
                    ↻ Retry
                  </button>
                </div>
              ) : (
                devices.map(device => (
                  <div key={device.id} style={{
                    background: 'rgba(20, 20, 50, 0.6)',
                    padding: '1.5rem',
                    borderRadius: '15px',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
                    border: '2px solid rgba(157, 78, 221, 0.5)',
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
                      color: '#FFFFFF',
                      fontSize: '1.2rem',
                      fontWeight: 500,
                      margin: '0 0 0.5rem 0',
                      textShadow: '0 0 5px rgba(0, 0, 0, 0.5)'
                    }}>{device.name || device.id}</h3>
                    <p style={{
                      color: device.state.isOn ? '#00FF88' : '#FF6B6B',
                      fontSize: '1rem',
                      margin: '0 0 1rem 0',
                      fontWeight: 500
                    }}>Status: {device.state.isOn ? 'On' : 'Off'}</p>
                    <button onClick={() => handleToggleDevice(device.id)} style={{
                      background: device.state.isOn ? 'linear-gradient(135deg, rgba(255, 80, 80, 0.9), rgba(255, 120, 120, 0.9))' : 'linear-gradient(135deg, rgba(0, 255, 136, 0.9), rgba(100, 255, 200, 0.9))',
                      color: '#FFFFFF',
                      border: '2px solid ' + (device.state.isOn ? 'rgba(255, 150, 150, 1)' : 'rgba(100, 255, 200, 1)'),
                      padding: '0.7rem 1.2rem',
                      borderRadius: '8px',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      backdropFilter: 'blur(10px)',
                      boxShadow: device.state.isOn ? '0 0 15px rgba(255, 80, 80, 0.5)' : '0 0 15px rgba(0, 255, 136, 0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = device.state.isOn ? 'linear-gradient(135deg, rgba(255, 100, 100, 1), rgba(255, 140, 140, 1))' : 'linear-gradient(135deg, rgba(0, 255, 150, 1), rgba(120, 255, 220, 1))';
                      e.currentTarget.style.boxShadow = device.state.isOn ? '0 0 25px rgba(255, 80, 80, 0.8)' : '0 0 25px rgba(0, 255, 136, 0.8)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = device.state.isOn ? 'linear-gradient(135deg, rgba(255, 80, 80, 0.9), rgba(255, 120, 120, 0.9))' : 'linear-gradient(135deg, rgba(0, 255, 136, 0.9), rgba(100, 255, 200, 0.9))';
                      e.currentTarget.style.boxShadow = device.state.isOn ? '0 0 15px rgba(255, 80, 80, 0.5)' : '0 0 15px rgba(0, 255, 136, 0.5)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}>
                      {device.state.isOn ? '⊗ Off' : '◉ On'}
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
              color: '#FFFFFF',
              fontSize: '2rem',
              fontWeight: 400,
              marginBottom: '1rem',
              textAlign: 'center',
              textShadow: '0 0 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(157, 78, 221, 0.4)'
            }}>Scene Management</h2>

            {/* Create Scene Form */}
            <div style={{
              background: 'rgba(20, 20, 50, 0.6)',
              padding: '1.5rem',
              borderRadius: '15px',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
              border: '2px solid rgba(157, 78, 221, 0.5)',
              marginBottom: '1rem'
            }}>
              <h3 style={{ color: '#FFFFFF', margin: '0 0 1rem 0', textShadow: '0 0 5px rgba(0, 0, 0, 0.5)' }}>Create New Scene</h3>
              <input
                type="text"
                placeholder="Scene Name"
                value={currentScene.name}
                onChange={(e) => setCurrentScene(prev => ({ ...prev, name: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  marginBottom: '1rem',
                  border: '2px solid rgba(157, 78, 221, 0.5)',
                  borderRadius: '5px',
                  fontSize: '1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#FFFFFF',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(157, 78, 221, 1)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(157, 78, 221, 0.5)'; }}
              />
              <div>
                {devices.map(device => {
                  const action = currentScene.actions.find(a => a.deviceId === device.id);
                  return (
                    <div key={device.id} style={{
                      border: '2px solid rgba(157, 78, 221, 0.5)',
                      borderRadius: '10px',
                      padding: '1rem',
                      marginBottom: '1rem',
                      background: 'rgba(30, 30, 70, 0.5)'
                    }}>
                      <h4 style={{ color: '#FFFFFF', margin: '0 0 0.5rem 0', textShadow: '0 0 5px rgba(0, 0, 0, 0.5)' }}>{device.name || device.id}</h4>
                      <label style={{ display: 'block', marginBottom: '0.5rem', color: '#FFFFFF' }}>
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
                          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#FFFFFF' }}>
                            <input
                              type="checkbox"
                              checked={action.state.isOn ?? false}
                              onChange={(e) => updateAction(device.id, { isOn: e.target.checked })}
                            /> Turn On
                          </label>
                          {device.capabilities.brightness && (
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#FFFFFF' }}>
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
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#FFFFFF' }}>
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
                background: 'linear-gradient(135deg, rgba(0, 200, 255, 0.9), rgba(100, 150, 255, 0.9))',
                color: '#FFFFFF',
                border: '2px solid rgba(100, 200, 255, 1)',
                padding: '0.7rem 1.2rem',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 0 15px rgba(100, 150, 255, 0.5)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(100, 220, 255, 1), rgba(150, 170, 255, 1))';
                e.currentTarget.style.boxShadow = '0 0 25px rgba(100, 150, 255, 0.8)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(0, 200, 255, 0.9), rgba(100, 150, 255, 0.9))';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(100, 150, 255, 0.5)';
                e.currentTarget.style.transform = 'scale(1)';
              }}>✓ Save Scene</button>
            </div>

            {/* Saved Scenes */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem'
            }}>
              {scenes.map((scene, index) => (
                <div key={index} style={{
                  background: 'rgba(20, 20, 50, 0.6)',
                  padding: '1rem',
                  borderRadius: '10px',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
                  border: '2px solid rgba(157, 78, 221, 0.5)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(157, 78, 221, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.3)';
                }}>
                  <h4 style={{ color: '#FFFFFF', margin: '0 0 0.5rem 0', textShadow: '0 0 5px rgba(0, 0, 0, 0.5)' }}>{scene.name}</h4>
                  <p style={{ color: '#9d4edd', margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
                    {scene.actions.length} device{scene.actions.length !== 1 ? 's' : ''}
                  </p>
                  <button onClick={() => handleRunScene(scene)} style={{
                    background: 'linear-gradient(135deg, rgba(157, 78, 221, 0.9), rgba(200, 100, 255, 0.9))',
                    color: '#FFFFFF',
                    border: '2px solid rgba(200, 150, 255, 1)',
                    padding: '0.7rem 1.2rem',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.3s ease',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 0 15px rgba(157, 78, 221, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(200, 120, 255, 1), rgba(220, 150, 255, 1))';
                    e.currentTarget.style.boxShadow = '0 0 25px rgba(157, 78, 221, 0.8)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(157, 78, 221, 0.9), rgba(200, 100, 255, 0.9))';
                    e.currentTarget.style.boxShadow = '0 0 15px rgba(157, 78, 221, 0.5)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}>▶ Run Scene</button>
                </div>
              ))}
            </div>
          </>
        )}

        {currentTab === 'Rooms' && (
          <div style={{
            background: 'rgba(20, 20, 50, 0.6)',
            padding: '2rem',
            borderRadius: '15px',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4)',
            border: '2px solid rgba(157, 78, 221, 0.5)',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#FFFFFF', margin: '0 0 1rem 0', textShadow: '0 0 10px rgba(157, 78, 221, 0.4)' }}>Coming Soon</h3>
            <p style={{ color: '#9d4edd', fontSize: '1.1rem' }}>Room-based device management will be available soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  console.log('App component rendered');
  return (
    <SpaceBackground>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <Dashboard />
      </div>
    </SpaceBackground>
  )
}

export default App