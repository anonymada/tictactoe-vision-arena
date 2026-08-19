const assert = require('assert');
const os = require('os');

function resetModuleCache() {
  delete require.cache[require.resolve('./hostDetector')];
}

os.networkInterfaces = () => ({
  lo: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
  docker0: [{ address: '172.17.0.2', family: 'IPv4', internal: false }],
  eth0: [{ address: '172.20.0.5', family: 'IPv4', internal: false }],
});

resetModuleCache();
const { getHostUrl } = require('./hostDetector');

assert.strictEqual(getHostUrl(), 'http://172.20.0.5:3000');
console.log('hostDetector test passed');
