const os = require('os');

function isDockerOrVirtualInterface(name) {
  const n = (name || '').toLowerCase();
  return n === 'lo'
    || n.startsWith('docker')
    || n.startsWith('br-')
    || n.startsWith('veth')
    || n.startsWith('vmnet')
    || n.startsWith('vbox')
    || n.startsWith('virtual')
    || n.startsWith('tun')
    || n.startsWith('tap')
    || n.startsWith('utun');
}

function normalizeExplicitHost(host) {
  const value = (host || '').trim();
  if (!value || value === '0.0.0.0' || value === '::' || value === 'localhost') {
    return null;
  }
  return value;
}

function isIgnoredAddress(addr, ifaceName) {
  if (!addr) return true;
  if (addr.startsWith('127.') || addr === '::1') return true;
  if (addr.startsWith('169.254.')) return true; // link local
  if (ifaceName && isDockerOrVirtualInterface(ifaceName)) return true;
  return false;
}

function detectHostIPv4() {
  try {
    const ifaces = os.networkInterfaces();
    for (const name of Object.keys(ifaces)) {
      if (!ifaces[name] || isDockerOrVirtualInterface(name)) continue;
      for (const addrInfo of ifaces[name]) {
        if ((addrInfo.family === 'IPv4' || addrInfo.family === 4) && !addrInfo.internal) {
          const addr = addrInfo.address;
          if (isIgnoredAddress(addr, name)) continue;
          return addr;
        }
      }
    }
  } catch (e) {
    // ignore
  }
  return null;
}

function getHostUrl() {
  const envPort = process.env.SERVER_PORT || process.env.PORT || '3000';
  const envHost = normalizeExplicitHost(process.env.SERVER_HOST || process.env.HOST_IP || process.env.HOST);
  if (envHost) return `http://${envHost}:${envPort.trim()}`;

  const detected = detectHostIPv4();
  if (detected) return `http://${detected}:${envPort}`;
  return `http://localhost:${envPort}`;
}

module.exports = { getHostUrl };
