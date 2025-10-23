const os = require('os');

/**
 * Automatically detects the current local network IP address
 * Returns the first non-internal IPv4 address found
 */
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  // Priority order for interface types
  const priorityOrder = ['Wi-Fi', 'WiFi', 'Ethernet', 'Local Area Connection'];
  
  // First, try to find interfaces by priority order
  for (const interfaceName of priorityOrder) {
    const iface = interfaces[interfaceName];
    if (iface) {
      for (const alias of iface) {
        if (alias.family === 'IPv4' && !alias.internal) {
          console.log(`🔍 Found IP on ${interfaceName}: ${alias.address}`);
          return alias.address;
        }
      }
    }
  }
  
  // Fallback: check all interfaces
  for (const interfaceName in interfaces) {
    const iface = interfaces[interfaceName];
    for (const alias of iface) {
      if (alias.family === 'IPv4' && !alias.internal) {
        console.log(`🔍 Found IP on ${interfaceName}: ${alias.address}`);
        return alias.address;
      }
    }
  }
  
  // Final fallback to localhost
  console.log('⚠️ No network IP found, using localhost');
  return 'localhost';
}

/**
 * Get the full API base URL with detected IP
 */
function getApiBaseUrl() {
  const ip = getLocalIP();
  const port = process.env.PORT || 5000;
  return `http://${ip}:${port}/api`;
}

/**
 * Get the full server URL with detected IP
 */
function getServerUrl() {
  const ip = getLocalIP();
  const port = process.env.PORT || 5000;
  return `http://${ip}:${port}`;
}

module.exports = {
  getLocalIP,
  getApiBaseUrl,
  getServerUrl
};
