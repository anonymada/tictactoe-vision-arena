const os = require('os');

function isDockerOrVirtualInterface(name) {
  const n = (name || '').toLowerCase();
  return n.startsWith('docker') || n.startsWith('br-') || n.startsWith('veth') || n.startsWith('vmnet') || n.startsWith('vbox') || n.startsWith('virtual') || n === 'lo';
}

function isIgnoredAddress(addr) {
  if (!addr) return true;
  if (addr.startsWith('127.') || addr === '::1') return true;
  if (addr.startsWith('169.254.')) return true; // link local
  if (addr.startsWith('172.')) return true; // commonly docker bridge range - ignore by default
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
          if (isIgnoredAddress(addr)) continue;
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
  const envHost = process.env.SERVER_HOST;
  const envPort = process.env.SERVER_PORT || process.env.PORT || '3000';
  if (envHost) return `http://${envHost.trim()}:${envPort.trim()}`;
  const detected = detectHostIPv4();
  if (detected) return `http://${detected}:${envPort}`;
  return `http://localhost:${envPort}`;
}

module.exports = { getHostUrl };
