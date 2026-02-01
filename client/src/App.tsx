import './App.css'

function Dashboard() {
  return (
    <div className="dashboard">
      <h1>Home Dashboard</h1>
      <div className="devices-section">
        <h2>Devices</h2>
        <div className="device-list">
          {/* Placeholder for device list from backend */}
          <p>Loading devices...</p>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <>
      <Dashboard />
    </>
  )
}

export default App