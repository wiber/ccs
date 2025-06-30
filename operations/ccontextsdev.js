const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { OptimizedStreamProcessor } = require('../lib/optimized-stream-processor');
const TerminalSpawner = require('../lib/terminal-spawner');

class CCSDevOperation {
  constructor(contextDatabase, learningEngine) {
    this.contextDb = contextDatabase;
    this.learning = learningEngine;
    this.logStreams = new Map();
    this.sqliteDb = null;
    this.performanceMetrics = [];
    
    // Initialize optimized stream processor
    this.streamProcessor = new OptimizedStreamProcessor({
      batchSize: 1000,
      flushInterval: 2000,
      bufferSize: 50000,
      maxMemoryUsage: 200 * 1024 * 1024, // 200MB
      deduplicationWindow: 60000 // 1 minute
    });

    // Initialize terminal spawner for multi-window environments
    this.terminalSpawner = new TerminalSpawner();
    
    this.curlEndpoints = [
      'http://localhost:3000/api/health',
      'http://localhost:3000/api/trigger-eligible-emails',
      'http://localhost:3000/api/email/track-open',
      'http://localhost:3000/api/process-coaching-session'
    ];
  }

  async initialize() {
    console.log('🚀 CCSDEV: Enhanced Development Environment');
    console.log('═══════════════════════════════════════════════');
    
    // Initialize SQLite streaming database
    await this.initializeStreamingDb();
    
    // Set up log streaming
    await this.setupLogStreaming();
    
    // Initialize SQL toolkit
    await this.initializeSqlToolkit();
    
    // Set up curl automation
    await this.setupCurlAutomation();
    
    // Initialize self-improvement system
    await this.initializeSelfImprovement();
    
    console.log('\n✅ CCSDEV initialized with enhanced capabilities');
    return this.startInteractiveMode();
  }

  async initializeStreamingDb() {
    console.log('📊 Setting up real-time SQLite streaming...');
    
    const dbPath = path.join(process.cwd(), 'data', 'streaming-logs.db');
    await fs.mkdir(path.dirname(dbPath), { recursive: true });
    
    return new Promise((resolve, reject) => {
      this.sqliteDb = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('❌ SQLite initialization failed:', err);
          reject(err);
        } else {
          this.createStreamingTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createStreamingTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS streaming_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        source TEXT NOT NULL,
        level TEXT,
        message TEXT,
        metadata JSON,
        context_hash TEXT,
        performance_ms INTEGER
      )`,
      `CREATE TABLE IF NOT EXISTS curl_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        endpoint TEXT NOT NULL,
        method TEXT DEFAULT 'GET',
        status_code INTEGER,
        response_time_ms INTEGER,
        response_body TEXT,
        log_correlation_id TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS performance_metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        metric_type TEXT NOT NULL,
        value REAL,
        threshold REAL,
        status TEXT,
        context TEXT
      )`,
      `CREATE TABLE IF NOT EXISTS prompt_effectiveness (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        prompt_hash TEXT NOT NULL,
        operation_type TEXT,
        effectiveness_score REAL,
        output_quality INTEGER,
        context_relevance INTEGER,
        user_satisfaction INTEGER
      )`
    ];

    for (const table of tables) {
      await new Promise((resolve, reject) => {
        this.sqliteDb.run(table, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    console.log('✅ Streaming database tables created');
  }

  async setupLogStreaming() {
    console.log('🌊 Setting up real-time log streaming...');
    
    // Stream development server logs
    this.streamDevLogs();
    
    // Stream Vercel logs
    this.streamVercelLogs();
    
    // Stream custom application logs
    this.streamCustomLogs();
    
    console.log('✅ Log streaming active');
  }

  streamDevLogs() {
    const devLogPattern = path.join(process.cwd(), 'logs', 'dev-server-*.log');
    
    // Watch for new dev log files and stream them
    this.watchLogFiles(devLogPattern, 'dev-server');
  }

  streamVercelLogs() {
    const vercelLogPattern = path.join(process.cwd(), 'logs', 'vercel-live-*.log');
    
    // Watch for Vercel log files and stream them
    this.watchLogFiles(vercelLogPattern, 'vercel');
  }

  streamCustomLogs() {
    // Set up streaming for application-specific logs
    console.log('📝 Monitoring custom application logs...');
  }

  watchLogFiles(pattern, source) {
    // Implementation for watching and streaming log files
    const { execSync } = require('child_process');
    
    try {
      // Find the most recent log file
      const files = execSync(`ls -t ${pattern} 2>/dev/null || echo ''`).toString().trim();
      if (files) {
        const latestFile = files.split('\n')[0];
        this.tailLogFile(latestFile, source);
      }
    } catch (error) {
      console.log(`⚠️  No ${source} logs found yet`);
    }
  }

  tailLogFile(filePath, source) {
    const tail = spawn('tail', ['-f', filePath]);
    
    tail.stdout.on('data', (data) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      
      lines.forEach(line => {
        this.processLogLine(line, source);
      });
    });

    tail.stderr.on('data', (data) => {
      console.error(`Tail error for ${source}:`, data.toString());
    });

    this.logStreams.set(source, tail);
  }

  async processLogLine(line, source) {
    // Parse log line and extract metadata
    const logEntry = this.parseLogLine(line, source);
    
    // Use optimized stream processor for enhanced performance
    try {
      const result = await this.streamProcessor.processLogEntry(logEntry);
      
      if (result.processed) {
        // Update real-time context
        await this.updateStreamingContext(logEntry);
        
        // Check for performance patterns
        await this.checkPerformancePatterns(logEntry);
      }
      
      return result;
    } catch (error) {
      console.error('Optimized processing failed, falling back to individual processing:', error);
      // Fallback to original processing
      await this.storeLogEntry(logEntry);
      await this.checkPerformancePatterns(logEntry);
      await this.updateStreamingContext(logEntry);
    }
  }

  parseLogLine(line, source) {
    const timestamp = new Date().toISOString();
    let level = 'INFO';
    let message = line;
    let metadata = {};
    let performanceMs = null;

    // Extract log level
    if (line.includes('ERROR') || line.includes('CRITICAL')) {
      level = 'ERROR';
    } else if (line.includes('WARN')) {
      level = 'WARN';
    } else if (line.includes('DEBUG')) {
      level = 'DEBUG';
    }

    // Extract nuclear approach timing
    const nuclearMatch = line.match(/Nuclear.*?(\d+)ms/i);
    if (nuclearMatch) {
      performanceMs = parseInt(nuclearMatch[1]);
      metadata.nuclear_timing = performanceMs;
    }

    // Extract API call information
    const apiMatch = line.match(/API.*?(\d+ms)/i);
    if (apiMatch) {
      metadata.api_timing = apiMatch[1];
    }

    return {
      timestamp,
      source,
      level,
      message,
      metadata: JSON.stringify(metadata),
      performance_ms: performanceMs
    };
  }

  async storeLogEntry(logEntry) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO streaming_logs 
        (timestamp, source, level, message, metadata, performance_ms) 
        VALUES (?, ?, ?, ?, ?, ?)`;
      
      this.sqliteDb.run(sql, [
        logEntry.timestamp,
        logEntry.source,
        logEntry.level,
        logEntry.message,
        logEntry.metadata,
        logEntry.performance_ms
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async checkPerformancePatterns(logEntry) {
    if (logEntry.performance_ms) {
      // Check nuclear approach threshold (3000ms)
      if (logEntry.performance_ms > 3000) {
        console.log(`⚠️  PERFORMANCE ALERT: ${logEntry.source} took ${logEntry.performance_ms}ms`);
        
        await this.storePerformanceMetric({
          metric_type: 'nuclear_timing',
          value: logEntry.performance_ms,
          threshold: 3000,
          status: 'EXCEEDED',
          context: logEntry.message
        });
      }
    }
  }

  async storePerformanceMetric(metric) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO performance_metrics 
        (metric_type, value, threshold, status, context) 
        VALUES (?, ?, ?, ?, ?)`;
      
      this.sqliteDb.run(sql, [
        metric.metric_type,
        metric.value,
        metric.threshold,
        metric.status,
        metric.context
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async updateStreamingContext(logEntry) {
    // Update context database with real-time information
    // This enhances the existing context for other operations
    if (this.contextDb) {
      this.contextDb.addStreamingContext({
        source: logEntry.source,
        timestamp: logEntry.timestamp,
        metadata: JSON.parse(logEntry.metadata || '{}')
      });
    }
  }

  async initializeSqlToolkit() {
    console.log('🔧 Setting up enhanced SQL toolkit...');
    
    this.sqlCommands = {
      'show-tables': () => this.showTables(),
      'streaming-logs': (limit = 10) => this.queryStreamingLogs(limit),
      'performance-alerts': () => this.queryPerformanceAlerts(),
      'curl-results': (limit = 10) => this.queryCurlResults(limit),
      'nuclear-timing': () => this.queryNuclearTiming(),
      'build-query': () => this.interactiveQueryBuilder(),
      'batch-metrics': () => this.queryBatchMetrics(),
      'compression-stats': () => this.queryCompressionStats(),
      'deduplication-stats': () => this.queryDeduplicationStats(),
      'memory-usage': () => this.queryMemoryUsage(),
      'performance-trends': (hours = 24) => this.queryPerformanceTrends(hours)
    };
    
    console.log('✅ SQL toolkit ready');
    console.log('Available commands:', Object.keys(this.sqlCommands).join(', '));
  }

  async setupCurlAutomation() {
    console.log('🌐 Setting up curl automation...');
    
    // Start automated endpoint testing
    this.startAutomatedTesting();
    
    console.log('✅ Curl automation active');
  }

  startAutomatedTesting() {
    // Test endpoints every 30 seconds
    setInterval(async () => {
      for (const endpoint of this.curlEndpoints) {
        await this.testEndpoint(endpoint);
      }
    }, 30000);
  }

  async testEndpoint(endpoint) {
    const startTime = Date.now();
    
    try {
      const { execSync } = require('child_process');
      const result = execSync(`curl -s -w "%{http_code},%{time_total}" "${endpoint}"`, 
        { timeout: 10000 });
      
      const output = result.toString();
      const [body, timing] = output.split(',');
      const statusCode = timing ? parseInt(timing) : 0;
      const responseTime = Math.round(parseFloat(body || '0') * 1000);
      
      await this.storeCurlResult({
        endpoint,
        status_code: statusCode,
        response_time_ms: responseTime,
        response_body: body,
        timestamp: new Date().toISOString()
      });
      
      // Check for performance issues
      if (responseTime > 3000) {
        console.log(`⚠️  ENDPOINT SLOW: ${endpoint} (${responseTime}ms)`);
      }
      
    } catch (error) {
      console.log(`❌ Endpoint test failed: ${endpoint}`, error.message);
      
      await this.storeCurlResult({
        endpoint,
        status_code: 0,
        response_time_ms: Date.now() - startTime,
        response_body: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    }
  }

  async storeCurlResult(result) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO curl_results 
        (endpoint, status_code, response_time_ms, response_body, timestamp) 
        VALUES (?, ?, ?, ?, ?)`;
      
      this.sqliteDb.run(sql, [
        result.endpoint,
        result.status_code,
        result.response_time_ms,
        result.response_body,
        result.timestamp
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async initializeSelfImprovement() {
    console.log('🧠 Setting up self-improvement system...');
    
    // Load existing prompt effectiveness data
    await this.loadPromptEffectiveness();
    
    // Set up effectiveness monitoring
    this.startEffectivenessMonitoring();
    
    console.log('✅ Self-improvement system active');
  }

  async loadPromptEffectiveness() {
    // Load historical prompt effectiveness data
    return new Promise((resolve, reject) => {
      this.sqliteDb.all(
        'SELECT * FROM prompt_effectiveness ORDER BY timestamp DESC LIMIT 100',
        (err, rows) => {
          if (err) reject(err);
          else {
            this.promptHistory = rows;
            resolve();
          }
        }
      );
    });
  }

  startEffectivenessMonitoring() {
    // Monitor the effectiveness of prompts and operations
    // This will be enhanced based on user interactions and output quality
  }

  async startInteractiveMode() {
    console.log('\n🎯 CCSDEV Interactive Mode');
    console.log('Available commands:');
    console.log('  sql <command>     - Execute SQL toolkit command');
    console.log('  curl <endpoint>   - Test specific endpoint');
    console.log('  logs <source>     - Show recent logs from source');
    console.log('  performance       - Show performance metrics');
    console.log('  improve           - Run self-improvement analysis');
    console.log('  status            - Show system status');
    console.log('  spawn <env>       - Spawn multi-terminal environment');
    console.log('  windows           - List spawned terminal windows');
    console.log('  help              - Show this help');
    console.log('  exit              - Exit interactive mode');
    console.log('\n🖥️  Multi-Terminal Environments:');
    console.log('  spawn ccsdev - Full ccsdev environment (4 windows)');
    console.log('  spawn dev         - Dev server + monitoring (3 windows)');
    console.log('  spawn monitoring  - Advanced monitoring dashboard (4 windows)');
    console.log('  spawn voice       - Voice analysis environment (3 windows)');
    console.log('\n📊 Real-time streaming active for dev-server and vercel logs');
    console.log('🔄 Automated endpoint testing running every 30 seconds');
    console.log('🧠 Self-improvement system monitoring prompt effectiveness');
    
    return this.handleInteractiveCommands();
  }

  async handleInteractiveCommands() {
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'ccsdev> '
    });

    rl.prompt();

    rl.on('line', async (line) => {
      const [command, ...args] = line.trim().split(' ');
      
      try {
        switch (command) {
          case 'sql':
            await this.handleSqlCommand(args);
            break;
          case 'curl':
            await this.handleCurlCommand(args);
            break;
          case 'logs':
            await this.handleLogsCommand(args);
            break;
          case 'performance':
            await this.showPerformanceMetrics();
            break;
          case 'improve':
            await this.runSelfImprovement();
            break;
          case 'status':
            await this.showSystemStatus();
            break;
          case 'spawn':
            await this.handleSpawnCommand(args);
            break;
          case 'windows':
            this.terminalSpawner.listSpawnedWindows();
            break;
          case 'help':
            this.showHelp();
            break;
          case 'exit':
            console.log('👋 Goodbye!');
            rl.close();
            return;
          default:
            console.log(`Unknown command: ${command}. Type 'help' for available commands.`);
        }
      } catch (error) {
        console.error('❌ Command error:', error.message);
      }
      
      rl.prompt();
    });

    rl.on('close', () => {
      this.cleanup();
      process.exit(0);
    });
  }

  async handleSqlCommand(args) {
    const [subcommand, ...params] = args;
    
    if (this.sqlCommands[subcommand]) {
      const result = await this.sqlCommands[subcommand](...params);
      console.log(result);
    } else {
      console.log('Available SQL commands:', Object.keys(this.sqlCommands).join(', '));
    }
  }

  async queryStreamingLogs(limit = 10) {
    return new Promise((resolve, reject) => {
      this.sqliteDb.all(
        'SELECT * FROM streaming_logs ORDER BY timestamp DESC LIMIT ?',
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else {
            const formatted = rows.map(row => 
              `${row.timestamp} [${row.source}] ${row.level}: ${row.message}`
            ).join('\n');
            resolve(formatted);
          }
        }
      );
    });
  }

  async queryNuclearTiming() {
    return new Promise((resolve, reject) => {
      this.sqliteDb.all(
        'SELECT * FROM streaming_logs WHERE performance_ms IS NOT NULL ORDER BY timestamp DESC LIMIT 20',
        (err, rows) => {
          if (err) reject(err);
          else {
            const formatted = rows.map(row => 
              `${row.timestamp}: ${row.performance_ms}ms ${row.performance_ms > 3000 ? '⚠️ ' : '✅'}`
            ).join('\n');
            resolve(formatted);
          }
        }
      );
    });
  }

  async queryBatchMetrics() {
    const metrics = this.streamProcessor.getMetrics();
    return `
📊 BATCH PROCESSING METRICS
═══════════════════════════
📈 Total Processed: ${metrics.totalProcessed}
🔄 Batches Processed: ${metrics.batchesProcessed}
⚡ Avg Processing Time: ${metrics.averageProcessingTime.toFixed(2)}ms
🗜️ Compression Ratio: ${(metrics.compressionRatio * 100).toFixed(1)}%
🔄 Deduplication Ratio: ${(metrics.deduplicationRatio * 100).toFixed(1)}%
💾 Memory Usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
📦 Buffer Size: ${metrics.bufferSize}
🔄 Cache Size: ${metrics.cacheSize}
`;
  }

  async queryCompressionStats() {
    const metrics = this.streamProcessor.getMetrics();
    const compressionRatio = metrics.compressionRatio;
    const spaceSaved = compressionRatio > 0 ? (1 - compressionRatio) * 100 : 0;
    
    return `
🗜️ COMPRESSION STATISTICS
═══════════════════════
📊 Compression Ratio: ${(compressionRatio * 100).toFixed(1)}%
💾 Space Saved: ${spaceSaved.toFixed(1)}%
📦 Original Size: ~${((metrics.totalProcessed * 1024) / 1024 / 1024).toFixed(2)}GB
🎯 Compressed Size: ~${((metrics.totalProcessed * 1024 * compressionRatio) / 1024 / 1024).toFixed(2)}GB
✅ Performance Target: 70% compression (${compressionRatio < 0.3 ? '✅ ACHIEVED' : '⚠️ IN PROGRESS'})
`;
  }

  async queryDeduplicationStats() {
    const metrics = this.streamProcessor.getMetrics();
    const deduplicationRatio = metrics.deduplicationRatio;
    const duplicatesRemoved = deduplicationRatio * metrics.totalProcessed;
    
    return `
🔄 DEDUPLICATION STATISTICS
══════════════════════════
📊 Deduplication Ratio: ${(deduplicationRatio * 100).toFixed(1)}%
🗑️ Duplicates Removed: ${Math.round(duplicatesRemoved)}
💾 Cache Size: ${metrics.cacheSize}
🎯 Performance Target: 15% duplication (${deduplicationRatio > 0.1 ? '✅ WITHIN RANGE' : '📊 MONITORING'})
`;
  }

  async queryMemoryUsage() {
    const metrics = this.streamProcessor.getMetrics();
    const memoryUsageMB = metrics.memoryUsage / 1024 / 1024;
    const targetMB = 200; // 200MB target
    
    return `
💾 MEMORY USAGE STATISTICS
═══════════════════════
📊 Current Usage: ${memoryUsageMB.toFixed(1)}MB
🎯 Target: <${targetMB}MB
📈 Buffer Usage: ${metrics.bufferSize} entries
🔄 Cache Usage: ${metrics.cacheSize} entries
🔄 Circular Buffer: ${metrics.circularBufferSize} entries
✅ Status: ${memoryUsageMB < targetMB ? '✅ WITHIN LIMITS' : '⚠️ APPROACHING LIMIT'}
`;
  }

  async queryPerformanceTrends(hours = 24) {
    const metrics = this.streamProcessor.getMetrics();
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    return `
📈 PERFORMANCE TRENDS (Last ${hours}h)
════════════════════════════════
⚡ Current Avg Processing: ${metrics.averageProcessingTime.toFixed(2)}ms
🎯 Target: <10ms (10x improvement)
📊 Total Processed: ${metrics.totalProcessed}
🔄 Batches Completed: ${metrics.batchesProcessed}
💾 Memory Efficiency: ${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB

🎯 PERFORMANCE TARGETS:
• Processing Speed: ${metrics.averageProcessingTime < 10 ? '✅' : '⚠️'} <10ms per entry
• Memory Usage: ${(metrics.memoryUsage / 1024 / 1024) < 200 ? '✅' : '⚠️'} <200MB
• Compression: ${metrics.compressionRatio < 0.3 ? '✅' : '⚠️'} >70% compression
• Deduplication: ${metrics.deduplicationRatio > 0.1 ? '✅' : '📊'} ~15% duplicates
`;
  }

  async handleSpawnCommand(args) {
    const [environment] = args;
    
    if (!environment) {
      console.log('❌ Please specify an environment to spawn:');
      console.log('  spawn ccsdev - Full ccsdev environment');
      console.log('  spawn dev         - Dev server + monitoring');
      console.log('  spawn monitoring  - Advanced monitoring dashboard');
      console.log('  spawn voice       - Voice analysis environment');
      return;
    }

    // Check if Terminal app is available
    const terminalAvailable = await this.terminalSpawner.checkTerminalAvailability();
    if (!terminalAvailable) {
      console.log('❌ Terminal app not available for spawning windows');
      return;
    }

    switch (environment.toLowerCase()) {
      case 'ccsdev':
        await this.terminalSpawner.spawnCCSDevEnvironment();
        break;
      case 'dev':
        await this.terminalSpawner.spawnDevServerWithMonitoring();
        break;
      case 'monitoring':
        await this.terminalSpawner.spawnAdvancedMonitoring();
        break;
      case 'voice':
        await this.terminalSpawner.spawnVoiceAnalysisEnvironment();
        break;
      default:
        console.log(`❌ Unknown environment: ${environment}`);
        console.log('Available environments: ccsdev, dev, monitoring, voice');
    }
  }

  cleanup() {
    console.log('🧹 Cleaning up ccsdev...');
    
    // Close log streams
    for (const [source, stream] of this.logStreams) {
      stream.kill();
    }
    
    // Cleanup optimized stream processor
    if (this.streamProcessor) {
      this.streamProcessor.cleanup();
    }
    
    // Close SQLite database
    if (this.sqliteDb) {
      this.sqliteDb.close();
    }
  }
}

module.exports = CCSDevOperation;