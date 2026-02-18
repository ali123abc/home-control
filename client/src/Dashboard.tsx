import { useState, useEffect } from 'react';

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

function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingDevices, setTogglingDevices] = useState<Set<string>>(new Set());

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
    // Prevent multiple clicks - check if already toggling
    if (togglingDevices.has(id)) {
      return;
    }

    try {
      // Mark as toggling
      setTogglingDevices(prev => new Set(prev).add(id));

      const res = await fetch(`http://localhost:3000/device/${id}/toggle`, { method: 'POST' });
      if (!res.ok) throw new Error('Toggle failed');
      const data = await res.json();
      // Update local state
      setDevices(devices.map(d => d.id === id ? { ...d, state: data.state } : d));
    } catch (err) {
      console.error('Toggle error:', err);
    } finally {
      // Mark as no longer toggling
      setTogglingDevices(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
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
                cursor: togglingDevices.has(device.id) ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s ease, opacity 0.2s ease',
                opacity: togglingDevices.has(device.id) ? 0.6 : 1,
                disabled: togglingDevices.has(device.id)
              } as React.CSSProperties}
              disabled={togglingDevices.has(device.id)}
              onMouseEnter={(e) => {
                if (!togglingDevices.has(device.id)) {
                  e.currentTarget.style.background = device.state.isOn ? '#8B2D0F' : '#1e3f1a';
                }
              }}
              onMouseLeave={(e) => {
                if (!togglingDevices.has(device.id)) {
                  e.currentTarget.style.background = device.state.isOn ? '#A03A13' : '#254F22';
                }
              }}>
                {togglingDevices.has(device.id) ? `${device.state.isOn ? 'Turning Off' : 'Turning On'}...` : (device.state.isOn ? 'Turn Off' : 'Turn On')}
              </button>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default Devices;