const fs = require('fs');
const path = require('path');
const { getLocalIP, getApiBaseUrl, getServerUrl } = require('../utils/getLocalIP');

/**
 * Auto-update environment configuration with detected IP
 */
function updateEnvironment() {
  try {
    const detectedIP = getLocalIP();
    const apiBaseUrl = getApiBaseUrl();
    const serverUrl = getServerUrl();
    
    console.log('🔧 Auto-configuring environment...');
    console.log(`📡 Detected IP: ${detectedIP}`);
    console.log(`🌐 API Base URL: ${apiBaseUrl}`);
    console.log(`🖥️ Server URL: ${serverUrl}`);
    
    // Create .env file if it doesn't exist
    const envPath = path.join(process.cwd(), '.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update or add API_BASE_URL
    const apiBaseUrlRegex = /^API_BASE_URL=.*$/m;
    const newApiBaseUrlLine = `API_BASE_URL=${apiBaseUrl}`;
    
    if (apiBaseUrlRegex.test(envContent)) {
      envContent = envContent.replace(apiBaseUrlRegex, newApiBaseUrlLine);
    } else {
      envContent += `\n${newApiBaseUrlLine}`;
    }
    
    // Update or add SERVER_URL
    const serverUrlRegex = /^SERVER_URL=.*$/m;
    const newServerUrlLine = `SERVER_URL=${serverUrl}`;
    
    if (serverUrlRegex.test(envContent)) {
      envContent = envContent.replace(serverUrlRegex, newServerUrlLine);
    } else {
      envContent += `\n${newServerUrlLine}`;
    }
    
    // Update or add DETECTED_IP
    const detectedIpRegex = /^DETECTED_IP=.*$/m;
    const newDetectedIpLine = `DETECTED_IP=${detectedIP}`;
    
    if (detectedIpRegex.test(envContent)) {
      envContent = envContent.replace(detectedIpRegex, newDetectedIpLine);
    } else {
      envContent += `\n${newDetectedIpLine}`;
    }
    
    // Write updated .env file
    fs.writeFileSync(envPath, envContent.trim() + '\n');
    
    console.log('✅ Environment updated successfully');
    console.log(`📝 Updated .env with API_BASE_URL=${apiBaseUrl}`);
    
    return {
      detectedIP,
      apiBaseUrl,
      serverUrl
    };
    
  } catch (error) {
    console.error('❌ Error updating environment:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  updateEnvironment();
}

module.exports = { updateEnvironment };
