# Philips Hue Integration Setup

This guide explains how to set up Philips Hue light control in the home-control system.

## Prerequisites

- Philips Hue Bridge on your local network
- Node.js and npm installed

## Installation

The `hue-api` package is already in dependencies. Install it with:

```bash
npm install
```

## Getting Your Hue Bridge Credentials

### 1. Find Your Bridge IP Address

You can find your Hue Bridge IP in several ways:

**Option A: Philips Hue App**
- Open the Philips Hue app on your phone
- Go to Settings > Hue Bridges
- Note the IP address shown

**Option B: Router Admin Panel**
- Log into your router's admin panel
- Look for connected devices named "Philips Hue Bridge"
- Note the IP address

**Option C: mDNS/Bonjour**
```bash
# On macOS/Linux
dns-sd -B _http._tcp local | grep -i hue

# On Windows, use Bonjour Browser or search "philips-hue.local"
```

### 2. Get Your API Username

The Hue Bridge uses an API username for authentication. To create one:

**Using curl:**
```bash
# Press the Link button on your Hue Bridge, then run:
curl -X POST http://YOUR_BRIDGE_IP/api \
  -H "Content-Type: application/json" \
  -d '{"devicetype":"home-control#server"}'
```

You'll receive a response with your username:
```json
[{"success": {"username": "your-long-username-here"}}]
```

**Alternative: Use the Hue API browser**
- Visit http://YOUR_BRIDGE_IP/debug/clip.html
- Press the Link button on your Bridge
- Use the UI to generate an API key

## Configuration

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` with your credentials:
```
HUE_BRIDGE_IP=192.168.1.100
HUE_USERNAME=your-api-username-here
```

## Device Naming

Device IDs should follow the pattern `hueN` where N is the light number:
- `hue1` → Light #1 on the bridge
- `hue2` → Light #2 on the bridge
- etc.

You can see your light numbers in the Philips Hue app.

## Testing the Integration

Once configured, the `toggle()` and `setState()` functions in `src/devices/hueDevice.ts` will connect to your bridge and control lights.

Logs will show:
```
[HueDevice] Toggling light hue1
[HueDevice] Light hue1 toggled to on
```

## Troubleshooting

**"HUE_BRIDGE_IP and HUE_USERNAME environment variables are required"**
- Make sure `.env` file exists and has both variables set
- Restart the server after creating/updating `.env`

**"connect ECONNREFUSED" or timeout errors**
- Check that HUE_BRIDGE_IP is correct and reachable
- Try pinging: `ping 192.168.1.100` (use your actual IP)
- Ensure the bridge is powered on and connected to network

**API authentication fails**
- Verify HUE_USERNAME is correct (should be a long alphanumeric string)
- Try creating a new username using the steps above

**Light not found**
- Check device ID format (should be `hueN` like `hue1`, `hue2`)
- Verify the light number exists on your bridge

## Features

Currently implemented:
- ✅ `toggle(deviceId)` - Turn light on/off
- ✅ `setState(deviceId, state)` - Set brightness, color, temperature
- ✅ `getState(deviceId)` - Read current light state

## Future Enhancements

- [ ] Light groups support
- [ ] Effect animations
- [ ] Scene support (Hue scenes)
- [ ] Transation time customization
- [ ] Daylight sensor integration
