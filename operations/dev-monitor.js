/**
 * Enhanced Development Monitor Operation
 * 
 * Optimized version of existing dev workflow with:
 * - Smarter log collection and rotation
 * - Real-time context building
 * - Integrated monitoring
 * - Preserved existing dev behavior
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class DevMonitorOperation {
  constructor(projectPath, config = {}) {
    this.projectPath = projectPath;
    this.config = {
      withLogs: false,
      monitoring: true,
      logRotation: true,
      contextBuilding: true,
      ...config
    };
    
    this.processes = new Map();
    this.logStreams = new Map();
    this.startTime = new Date();
  }

  async execute(params = {}) {
    console.log('🚀 Enhanced Development Monitor Starting...');
    
    if (params.withLogs) {
      this.config.withLogs = true;
      console.log('   📋 Advanced logging enabled');
    }

    try {
      // Step 1: Setup enhanced logging environment
      await this.setupLoggingEnvironment();
      
      // Step 2: Start development server with enhanced monitoring
      await this.startEnhancedDev();
      
      // Step 3: Setup real-time monitoring
      if (this.config.monitoring) {
        await this.setupRealtimeMonitoring();
      }
      
      // Step 4: Setup context building
      if (this.config.contextBuilding) {
        await this.setupContextBuilding();
      }
      
      console.log('✅ Enhanced development environment ready');
      console.log('   📊 Monitoring: Active');
      console.log('   📋 Logging: Enhanced');
      console.log('   🔄 Context: Real-time building');
      
      return {
        success: true,
        devLogPath: this.devLogPath,
        vercelLogPath: this.vercelLogPath,
        monitoringActive: this.config.monitoring,
        contextBuilding: this.config.contextBuilding
      };
      
    } catch (error) {
      console.error('❌ Enhanced Dev Monitor failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async setupLoggingEnvironment() {
    console.log('🔧 Setting up enhanced logging environment...');
    
    // Create logs directory structure
    await this.ensureDir('logs');
    await this.ensureDir('logs/dev');
    await this.ensureDir('logs/monitoring');
    await this.ensureDir('logs/context');
    
    // Generate timestamp for this session
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    
    // Setup log paths (inherit existing naming)
    this.devLogPath = `logs/dev-server-${timestamp}.log`;
    this.vercelLogPath = `logs/vercel-live-${timestamp}.log`;
    this.monitorLogPath = `logs/monitoring/session-${timestamp}.log`;
    this.contextLogPath = `logs/context/context-${timestamp}.json`;
    
    // Enhanced: Cleanup old logs (inherit existing rotation logic)
    if (this.config.logRotation) {
      await this.rotateOldLogs();
    }
    
    console.log(`   📱 DEV LOG: ${this.devLogPath}`);
    console.log(`   🌐 VERCEL LOG: ${this.vercelLogPath}`);
    console.log(`   📊 MONITOR LOG: ${this.monitorLogPath}`);
    console.log(`   🔍 CONTEXT LOG: ${this.contextLogPath}`);
  }

  async startEnhancedDev() {
    console.log('🚀 Starting enhanced development server...');
    
    // Prepare enhanced environment (inherit from existing package.json dev script)
    const env = {
      ...process.env,
      DEV_LOG_PATH: this.devLogPath,
      VERCEL_LOG_PATH: this.vercelLogPath,
      CCS_ENHANCED: 'true',
      CCS_SESSION_START: this.startTime.toISOString()
    };
    
    // Enhanced: Pre-flight checks
    await this.runPreflightChecks();
    
    // Start development server with enhanced logging
    const devProcess = spawn('npm', ['run', 'dev:quiet'], {
      cwd: this.projectPath,
      env,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Setup enhanced log streaming
    await this.setupLogStreaming(devProcess);
    
    this.processes.set('dev', devProcess);
    
    // Enhanced: Start Vercel log collection if configured
    if (await this.isVercelConfigured()) {
      await this.startVercelLogCollection();
    }
  }

  async setupLogStreaming(devProcess) {
    console.log('📡 Setting up enhanced log streaming...');
    
    // Create write streams for logs
    const devLogStream = require('fs').createWriteStream(
      path.join(this.projectPath, this.devLogPath),
      { flags: 'a' }
    );
    
    const monitorLogStream = require('fs').createWriteStream(
      path.join(this.projectPath, this.monitorLogPath),
      { flags: 'a' }
    );
    
    // Enhanced log processing with pattern detection
    devProcess.stdout.on('data', (data) => {
      const logLine = data.toString();
      
      // Write to dev log
      devLogStream.write(logLine);
      
      // Enhanced: Real-time pattern analysis
      this.analyzeLogLine(logLine, 'stdout');
      
      // Console output for development
      process.stdout.write(logLine);
    });
    
    devProcess.stderr.on('data', (data) => {
      const logLine = data.toString();
      
      // Write to dev log  
      devLogStream.write(logLine);
      
      // Enhanced: Error pattern detection
      this.analyzeLogLine(logLine, 'stderr');
      
      // Console output for development
      process.stderr.write(logLine);
    });
    
    this.logStreams.set('dev', devLogStream);
    this.logStreams.set('monitor', monitorLogStream);
  }

  async setupRealtimeMonitoring() {
    console.log('📊 Setting up real-time monitoring...');
    
    // Enhanced monitoring that inherits from existing scripts
    const monitorProcess = spawn('node', ['scripts/claude-log-monitor.js', '--real-time'], {
      cwd: this.projectPath,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Stream monitoring output to dedicated log
    const monitorStream = this.logStreams.get('monitor');
    
    monitorProcess.stdout.on('data', (data) => {
      monitorStream.write(`[MONITOR] ${data}`);
    });
    
    monitorProcess.stderr.on('data', (data) => {
      monitorStream.write(`[MONITOR ERROR] ${data}`);
    });
    
    this.processes.set('monitor', monitorProcess);
  }

  async setupContextBuilding() {
    console.log('🔍 Setting up real-time context building...');
    
    // Enhanced: Build context every 5 minutes
    this.contextInterval = setInterval(async () => {
      try {
        const context = await this.buildCurrentContext();
        await this.saveContext(context);
        console.log(`[${new Date().toISOString()}] 🔄 Context updated`);
      } catch (error) {
        console.log(`[${new Date().toISOString()}] ⚠️ Context update failed:`, error.message);
      }
    }, 5 * 60 * 1000); // 5 minutes
    
    // Build initial context
    const initialContext = await this.buildCurrentContext();
    await this.saveContext(initialContext);
  }

  async buildCurrentContext() {
    const context = {
      timestamp: new Date().toISOString(),
      sessionStart: this.startTime.toISOString(),
      sessionDuration: Date.now() - this.startTime.getTime(),
      processes: Array.from(this.processes.keys()),
      logs: {
        dev: await this.getLogStats(this.devLogPath),
        vercel: await this.getLogStats(this.vercelLogPath),
        monitor: await this.getLogStats(this.monitorLogPath)
      },
      patterns: this.logPatterns,
      performance: await this.getPerformanceMetrics(),
      nuclear: await this.getNuclearStatus(),
      errors: this.errorCount,
      warnings: this.warningCount
    };
    
    return context;
  }

  analyzeLogLine(line, source) {
    // Initialize pattern tracking
    if (!this.logPatterns) this.logPatterns = {};
    if (!this.errorCount) this.errorCount = 0;
    if (!this.warningCount) this.warningCount = 0;
    
    // Enhanced pattern detection (inherit from existing)
    if (line.includes('NUCLEAR')) {
      this.logPatterns.nuclear = (this.logPatterns.nuclear || 0) + 1;
    }
    
    if (line.includes('ERROR') || line.includes('error')) {
      this.errorCount++;
    }
    
    if (line.includes('WARNING') || line.includes('warn')) {
      this.warningCount++;
    }
    
    if (line.includes('Track Open')) {
      this.logPatterns.trackOpen = (this.logPatterns.trackOpen || 0) + 1;
    }
    
    // Nuclear timing analysis
    const timingMatch = line.match(/(\d+)ms/);
    if (timingMatch && line.includes('NUCLEAR')) {
      const timing = parseInt(timingMatch[1]);
      if (!this.logPatterns.nuclearTiming) this.logPatterns.nuclearTiming = [];
      this.logPatterns.nuclearTiming.push(timing);
    }
  }

  // Utility methods
  async ensureDir(dirPath) {
    try {
      await fs.mkdir(path.join(this.projectPath, dirPath), { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  async rotateOldLogs() {
    console.log('🔄 Rotating old log files...');
    
    try {
      // Inherit existing rotation logic from package.json dev script
      await execAsync('find logs -type f -name "dev-server-*.log" | sort -r | tail -n +4 | xargs -I {} rm -f {}', {
        cwd: this.projectPath
      });
      
      await execAsync('find logs -type f -name "vercel-live-*.log" | sort -r | tail -n +4 | xargs -I {} rm -f {}', {
        cwd: this.projectPath
      });
      
      console.log('   ✅ Log rotation complete');
    } catch (error) {
      console.log('   ⚠️ Log rotation warning:', error.message);
    }
  }

  async runPreflightChecks() {
    console.log('✈️ Running pre-flight checks...');
    
    // Check if Supabase schema needs updating
    try {
      await execAsync('./scripts/dump-supabase-schema.sh', {
        cwd: this.projectPath
      });
      console.log('   ✅ Supabase schema updated');
    } catch (error) {
      console.log('   ⚠️ Supabase schema update warning:', error.message);
    }
  }

  async isVercelConfigured() {
    try {
      await execAsync('which vercel', { cwd: this.projectPath });
      return true;
    } catch (error) {
      return false;
    }
  }

  async startVercelLogCollection() {
    console.log('☁️ Starting Vercel log collection...');
    
    // This would start Vercel log streaming if configured
    // Implementation depends on Vercel CLI availability
  }

  async getLogStats(logPath) {
    try {
      const stats = await fs.stat(path.join(this.projectPath, logPath));
      const content = await fs.readFile(path.join(this.projectPath, logPath), 'utf-8');
      
      return {
        size: stats.size,
        lines: content.split('\n').length,
        lastModified: stats.mtime
      };
    } catch (error) {
      return { size: 0, lines: 0, lastModified: null };
    }
  }

  async saveContext(context) {
    await fs.writeFile(
      path.join(this.projectPath, this.contextLogPath),
      JSON.stringify(context, null, 2)
    );
  }

  // Placeholder implementations
  async getPerformanceMetrics() { return {}; }
  async getNuclearStatus() { return {}; }

  // Cleanup method
  async cleanup() {
    console.log('🧹 Cleaning up enhanced dev monitor...');
    
    // Clear context building interval
    if (this.contextInterval) {
      clearInterval(this.contextInterval);
    }
    
    // Close log streams
    for (const [name, stream] of this.logStreams) {
      stream.end();
    }
    
    // Terminate processes
    for (const [name, process] of this.processes) {
      process.kill('SIGTERM');
    }
  }
}

module.exports = DevMonitorOperation;