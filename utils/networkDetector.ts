import { Platform } from 'react-native';

export interface NetworkInterface {
  name: string;
  address: string;
  family: 'IPv4' | 'IPv6';
  internal: boolean;
}

export interface ConnectionResult {
  success: boolean;
  url: string;
  responseTime: number;
  error?: string;
}

export interface NetworkDetectionOptions {
  timeout?: number;
  retries?: number;
  port?: number;
  healthEndpoint?: string;
}

/**
 * Network interface detection utility for React Native
 * Detects available network interfaces and tests backend connectivity
 */
export class NetworkDetector {
  private static instance: NetworkDetector;
  private detectedIPs: string[] = [];
  private workingURL: string | null = null;
  private lastDetectionTime: number = 0;
  private detectionCache: Map<string, ConnectionResult> = new Map();

  private constructor() {}

  static getInstance(): NetworkDetector {
    if (!NetworkDetector.instance) {
      NetworkDetector.instance = new NetworkDetector();
    }
    return NetworkDetector.instance;
  }

  /**
   * Get all possible IP addresses to test
   * This includes common local network ranges and fallbacks
   */
  private getPossibleIPs(): string[] {
    const ips: string[] = [];
    
    // Add specific common IPs first (most likely to work)
    const specificIPs = [
      'localhost',
      '127.0.0.1',
      '10.189.82.96',  // Current hardcoded IP from the codebase
      '10.5.0.2',      // VPN interface from the codebase
    ];

    ips.push(...specificIPs);

    // Only test a few common IPs from each range to avoid endless scanning
    const commonRanges = [
      '192.168.1.',    // Most common home router range
      '192.168.0.',    // Alternative home router range
      '10.0.0.',       // Corporate networks
    ];

    // Only test a few IPs from each range (1, 100, 254)
    commonRanges.forEach(range => {
      ips.push(`${range}1`);
      ips.push(`${range}100`);
      ips.push(`${range}254`);
    });

    return ips;
  }

  /**
   * Test if a backend is reachable at a specific URL
   */
  private async testConnection(
    baseUrl: string, 
    options: NetworkDetectionOptions = {}
  ): Promise<ConnectionResult> {
    const {
      timeout = 5000,
      healthEndpoint = '/health'
    } = options;

    const fullUrl = `${baseUrl}${healthEndpoint}`;
    const startTime = Date.now();

    try {
      console.log(`🧪 Testing connection to: ${fullUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(fullUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Connection successful to ${fullUrl} (${responseTime}ms)`);
        return {
          success: true,
          url: baseUrl,
          responseTime,
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.log(`❌ Connection failed to ${fullUrl}: ${errorMessage}`);
      return {
        success: false,
        url: baseUrl,
        responseTime,
        error: errorMessage,
      };
    }
  }

  /**
   * Test multiple IPs in parallel with limited concurrency
   */
  private async testMultipleConnections(
    baseUrls: string[],
    options: NetworkDetectionOptions = {}
  ): Promise<ConnectionResult[]> {
    const { retries = 1 } = options;
    const results: ConnectionResult[] = [];
    
    // Test IPs one by one to stop early when we find a working connection
    for (const baseUrl of baseUrls) {
      // Check cache first
      const cached = this.detectionCache.get(baseUrl);
      if (cached && Date.now() - this.lastDetectionTime < 30000) { // 30 second cache
        results.push(cached);
        if (cached.success) {
          console.log(`🎯 Found cached working connection: ${cached.url}`);
          break;
        }
        continue;
      }

      let lastResult: ConnectionResult | null = null;
      
      for (let attempt = 0; attempt < retries; attempt++) {
        const result = await this.testConnection(baseUrl, options);
        lastResult = result;
        
        if (result.success) {
          this.detectionCache.set(baseUrl, result);
          results.push(result);
          console.log(`🎯 Found working connection: ${result.url}`);
          return results; // Stop immediately when we find a working connection
        }
        
        if (attempt < retries - 1) {
          await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 second delay between retries
        }
      }
      
      if (lastResult) {
        results.push(lastResult);
      }
    }

    return results;
  }

  /**
   * Detect the best backend URL automatically
   */
  async detectBackendURL(
    options: NetworkDetectionOptions = {}
  ): Promise<{ url: string | null; results: ConnectionResult[] }> {
    const {
      port = 5000,
      timeout = 3000,
      retries = 1,
    } = options;

    console.log('🔍 Starting network detection...');
    console.log(`📱 Platform: ${Platform.OS}`);
    console.log(`⏱️ Timeout: ${timeout}ms`);
    console.log(`🔄 Retries: ${retries}`);

    // Get all possible IPs to test
    const possibleIPs = this.getPossibleIPs();
    const baseUrls = possibleIPs.map(ip => `http://${ip}:${port}/api`);
    
    console.log(`🧪 Testing ${baseUrls.length} possible backend URLs...`);

    // Test connections
    const results = await this.testMultipleConnections(baseUrls, {
      timeout,
      retries,
      port,
    });

    // Find the best result
    const workingResults = results.filter(r => r.success);
    const bestResult = workingResults.sort((a, b) => a.responseTime - b.responseTime)[0];

    if (bestResult) {
      this.workingURL = bestResult.url;
      this.lastDetectionTime = Date.now();
      console.log(`✅ Best backend URL found: ${bestResult.url} (${bestResult.responseTime}ms)`);
    } else {
      console.log('❌ No working backend URL found');
      this.logConnectionTroubleshooting(results);
    }

    return {
      url: bestResult?.url || null,
      results,
    };
  }

  /**
   * Get the currently working URL (cached)
   */
  getWorkingURL(): string | null {
    return this.workingURL;
  }

  /**
   * Clear the detection cache
   */
  clearCache(): void {
    this.detectionCache.clear();
    this.workingURL = null;
    this.lastDetectionTime = 0;
  }

  /**
   * Log troubleshooting information when no connection is found
   */
  private logConnectionTroubleshooting(results: ConnectionResult[]): void {
    console.log('\n🔧 Backend Connection Troubleshooting:');
    console.log('=====================================');
    
    const failedResults = results.filter(r => !r.success);
    const timeoutErrors = failedResults.filter(r => r.error?.includes('timeout') || r.error?.includes('aborted'));
    const networkErrors = failedResults.filter(r => r.error?.includes('Network request failed') || r.error?.includes('fetch'));
    const httpErrors = failedResults.filter(r => r.error?.includes('HTTP'));

    console.log(`📊 Tested ${results.length} URLs`);
    console.log(`❌ Failed: ${failedResults.length}`);
    console.log(`⏱️ Timeouts: ${timeoutErrors.length}`);
    console.log(`🌐 Network errors: ${networkErrors.length}`);
    console.log(`📡 HTTP errors: ${httpErrors.length}`);

    console.log('\n💡 Troubleshooting suggestions:');
    console.log('1. Ensure the backend server is running on port 5000');
    console.log('2. Check if the backend is accessible from your device');
    console.log('3. Verify firewall settings allow connections on port 5000');
    console.log('4. Try running: npm run start:backend (in the backend directory)');
    console.log('5. Check if your device and computer are on the same network');
    console.log('6. Try connecting to the backend from a web browser first');

    if (timeoutErrors.length > 0) {
      console.log('\n⏱️ Timeout issues detected:');
      console.log('- The backend might be slow to respond');
      console.log('- Try increasing the timeout in the options');
      console.log('- Check if the backend is under heavy load');
    }

    if (networkErrors.length > 0) {
      console.log('\n🌐 Network connectivity issues:');
      console.log('- Check your internet connection');
      console.log('- Verify the backend server is running');
      console.log('- Ensure no firewall is blocking the connection');
    }

    console.log('\n🔍 Sample failed URLs:');
    failedResults.slice(0, 5).forEach(result => {
      console.log(`  ❌ ${result.url} - ${result.error}`);
    });
  }

  /**
   * Get network information for debugging
   */
  getNetworkInfo(): { platform: string; userAgent: string; timestamp: number } {
    return {
      platform: Platform.OS,
      userAgent: 'React Native App',
      timestamp: Date.now(),
    };
  }
}

// Export singleton instance
export const networkDetector = NetworkDetector.getInstance();
