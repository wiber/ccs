const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

/**
 * API Tester Tool - Tests API endpoints with curl
 */
class ApiTesterTool {
  constructor(options = {}) {
    this.projectPath = options.projectPath || process.cwd();
    this.timeout = options.timeout || 30000;
  }

  async execute(params, context) {
    console.log('🔌 Testing API endpoints...');
    
    const endpoints = params.endpoints || this.getDefaultEndpoints(context);
    const method = params.method || 'GET';
    const timeout = params.timeout || this.timeout;
    
    const results = [];
    
    for (const endpoint of endpoints) {
      try {
        const result = await this.testEndpoint(endpoint, method, timeout);
        results.push(result);
        
        const status = result.success ? '✅' : '❌';
        console.log(`  ${status} ${endpoint} - ${result.responseTime}ms`);
      } catch (error) {
        results.push({
          endpoint,
          success: false,
          error: error.message,
          responseTime: null
        });
        console.log(`  ❌ ${endpoint} - ${error.message}`);
      }
    }

    const summary = {
      totalTests: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      averageResponseTime: this.calculateAverageResponseTime(results)
    };

    console.log(`✅ API tests completed: ${summary.passed}/${summary.totalTests} passed`);

    return {
      results,
      summary
    };
  }

  async testEndpoint(endpoint, method = 'GET', timeout = 30000) {
    const startTime = Date.now();
    
    try {
      // Build curl command
      const curlCmd = this.buildCurlCommand(endpoint, method, timeout);
      
      // Execute curl
      const { stdout, stderr } = await execAsync(curlCmd, {
        timeout: timeout + 5000 // Add buffer to timeout
      });
      
      const responseTime = Date.now() - startTime;
      
      // Parse response
      const result = this.parseResponse(stdout, stderr, responseTime);
      
      return {
        endpoint,
        method,
        success: result.statusCode >= 200 && result.statusCode < 400,
        statusCode: result.statusCode,
        responseTime,
        contentLength: result.contentLength,
        headers: result.headers,
        body: result.body?.substring(0, 500) // Truncate for logging
      };
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error.code === 'TIMEOUT') {
        return {
          endpoint,
          method,
          success: false,
          error: 'Request timeout',
          responseTime
        };
      }
      
      throw error;
    }
  }

  buildCurlCommand(endpoint, method, timeout) {
    const timeoutSeconds = Math.ceil(timeout / 1000);
    
    let cmd = `curl -w "%{http_code}|%{time_total}|%{size_download}" -s --max-time ${timeoutSeconds}`;
    
    if (method !== 'GET') {
      cmd += ` -X ${method}`;
    }
    
    // Add headers for JSON APIs
    cmd += ` -H "Content-Type: application/json"`;
    cmd += ` -H "User-Agent: claude-context-engine/1.0"`;
    
    cmd += ` "${endpoint}"`;
    
    return cmd;
  }

  parseResponse(stdout, stderr, responseTime) {
    if (stderr) {
      throw new Error(`cURL error: ${stderr}`);
    }

    // Split the response from curl's write-out format
    const lines = stdout.split('\n');
    const writeOutLine = lines[lines.length - 1] || lines[lines.length - 2];
    const body = lines.slice(0, -1).join('\n') || stdout;

    if (!writeOutLine) {
      throw new Error('No response from server');
    }

    const [statusCode, totalTime, downloadSize] = writeOutLine.split('|');
    
    return {
      statusCode: parseInt(statusCode) || 0,
      totalTime: parseFloat(totalTime) || 0,
      contentLength: parseInt(downloadSize) || 0,
      body: body.trim(),
      headers: this.extractHeaders(body)
    };
  }

  extractHeaders(response) {
    // Simple header extraction (curl -i would be better but more complex to parse)
    const headers = {};
    
    // Look for common patterns in response body that might indicate headers
    if (response.includes('Content-Type:')) {
      const contentTypeMatch = response.match(/Content-Type:\s*([^\r\n]+)/i);
      if (contentTypeMatch) {
        headers['content-type'] = contentTypeMatch[1].trim();
      }
    }
    
    return headers;
  }

  calculateAverageResponseTime(results) {
    const validResults = results.filter(r => r.responseTime !== null);
    if (validResults.length === 0) return null;
    
    const total = validResults.reduce((sum, r) => sum + r.responseTime, 0);
    return Math.round(total / validResults.length);
  }

  getDefaultEndpoints(context) {
    // Try to extract endpoints from context
    if (context.apiEndpoints && context.apiEndpoints.length > 0) {
      return context.apiEndpoints;
    }

    // Look for common patterns in project
    const endpoints = [];
    
    // Local development endpoints
    if (context.project?.type === 'nextjs' || context.project?.type === 'nodejs') {
      endpoints.push('http://localhost:3000/api/health');
      endpoints.push('http://localhost:3000');
    }

    // Production endpoints (if we can infer them)
    if (context.project?.name) {
      // Common patterns for production URLs
      const possibleDomains = [
        `https://${context.project.name}.vercel.app`,
        `https://${context.project.name}.herokuapp.com`,
        `https://www.${context.project.name}.com`
      ];
      
      // Only add if they might be valid
      for (const domain of possibleDomains) {
        if (this.isValidUrl(domain)) {
          endpoints.push(domain);
        }
      }
    }

    return endpoints.length > 0 ? endpoints : ['http://localhost:3000'];
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
}

module.exports = ApiTesterTool;