/**
 * SQLite Pipeline Integration for CCS
 * 
 * Provides unified SQLite database management inspired by ThetaDriven Coach patterns
 * Key features:
 * - Unified database with attached specialized databases
 * - Real-time log streaming
 * - Full-text search capabilities
 * - Automatic initialization
 * - Background daemon support
 */

const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const chokidar = require('chokidar');

class SQLitePipeline {
  constructor(projectPath, config = {}) {
    this.projectPath = projectPath;
    this.config = {
      dataDir: path.join(projectPath, '.ccs/data'),
      logsToWatch: ['logs/*.log', 'logs/**/*.log'],
      enableDaemon: true,
      enableInsights: true,
      ...config
    };
    
    this.databases = {
      unified: null,
      logs: null,
      context: null,
      insights: null
    };
    
    this.daemons = new Map();
  }

  /**
   * Initialize the SQLite pipeline
   */
  async initialize() {
    console.log('🗄️  Initializing SQLite pipeline...');
    
    // Ensure data directory exists
    await fs.mkdir(this.config.dataDir, { recursive: true });
    
    // Initialize databases
    await this.initializeUnifiedDB();
    await this.initializeLogsDB();
    await this.initializeContextDB();
    await this.initializeInsightsDB();
    
    // Attach all databases to unified
    await this.attachDatabases();
    
    // Start daemons if enabled
    if (this.config.enableDaemon) {
      await this.startDaemons();
    }
    
    console.log('   ✅ SQLite pipeline initialized');
    return true;
  }

  /**
   * Initialize unified database
   */
  async initializeUnifiedDB() {
    const dbPath = path.join(this.config.dataDir, 'unified.db');
    
    this.databases.unified = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    // Create system status table
    await this.databases.unified.exec(`
      CREATE TABLE IF NOT EXISTS system_status (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS documentation (
        path TEXT PRIMARY KEY,
        title TEXT,
        content TEXT,
        category TEXT,
        metadata TEXT,
        last_modified DATETIME,
        indexed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE VIRTUAL TABLE IF NOT EXISTS documentation_fts USING fts5(
        path, title, content, category,
        content=documentation
      );
    `);
  }

  /**
   * Initialize logs database with FTS5
   */
  async initializeLogsDB() {
    const dbPath = path.join(this.config.dataDir, 'logs.db');
    
    this.databases.logs = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    await this.databases.logs.exec(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        level TEXT,
        category TEXT,
        message TEXT,
        metadata TEXT,
        source TEXT,
        performance_ms REAL
      );
      
      CREATE VIRTUAL TABLE IF NOT EXISTS logs_fts USING fts5(
        message, category,
        content=logs
      );
      
      CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
      CREATE INDEX IF NOT EXISTS idx_logs_category ON logs(category);
    `);
  }

  /**
   * Initialize context database
   */
  async initializeContextDB() {
    const dbPath = path.join(this.config.dataDir, 'context.db');
    
    this.databases.context = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    await this.databases.context.exec(`
      CREATE TABLE IF NOT EXISTS operations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE,
        description TEXT,
        last_run DATETIME,
        run_count INTEGER DEFAULT 0,
        success_count INTEGER DEFAULT 0,
        avg_duration_ms REAL,
        metadata TEXT
      );
      
      CREATE TABLE IF NOT EXISTS learning_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern TEXT,
        category TEXT,
        confidence REAL,
        usage_count INTEGER DEFAULT 0,
        last_used DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS context_files (
        path TEXT PRIMARY KEY,
        purpose TEXT,
        content_hash TEXT,
        last_accessed DATETIME,
        access_count INTEGER DEFAULT 0
      );
    `);
  }

  /**
   * Initialize insights database
   */
  async initializeInsightsDB() {
    const dbPath = path.join(this.config.dataDir, 'insights.db');
    
    this.databases.insights = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    await this.databases.insights.exec(`
      CREATE TABLE IF NOT EXISTS insights (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT,
        category TEXT,
        severity TEXT,
        title TEXT,
        description TEXT,
        recommendation TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        resolved_at DATETIME
      );
      
      CREATE TABLE IF NOT EXISTS metrics (
        name TEXT,
        value REAL,
        unit TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        metadata TEXT
      );
      
      CREATE INDEX IF NOT EXISTS idx_insights_type ON insights(type);
      CREATE INDEX IF NOT EXISTS idx_metrics_name_time ON metrics(name, timestamp);
    `);
  }

  /**
   * Attach all databases to unified
   */
  async attachDatabases() {
    await this.databases.unified.exec(`
      ATTACH DATABASE '${path.join(this.config.dataDir, 'logs.db')}' AS logs;
      ATTACH DATABASE '${path.join(this.config.dataDir, 'context.db')}' AS context;
      ATTACH DATABASE '${path.join(this.config.dataDir, 'insights.db')}' AS insights;
    `);
  }

  /**
   * Start background daemons
   */
  async startDaemons() {
    console.log('   🚀 Starting background daemons...');
    
    // Log streaming daemon
    if (this.config.logsToWatch.length > 0) {
      await this.startLogStreamDaemon();
    }
    
    // Insights generation daemon
    if (this.config.enableInsights) {
      await this.startInsightsDaemon();
    }
  }

  /**
   * Start log streaming daemon
   */
  async startLogStreamDaemon() {
    const watcher = chokidar.watch(this.config.logsToWatch, {
      cwd: this.projectPath,
      persistent: true,
      ignoreInitial: false,
      followSymlinks: false,
      usePolling: false,
      interval: 100,
      binaryInterval: 300,
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100
      }
    });

    const tailedFiles = new Map();

    watcher.on('add', async (filePath) => {
      await this.tailNewFile(filePath, tailedFiles);
    });

    watcher.on('change', async (filePath) => {
      await this.tailFileChanges(filePath, tailedFiles);
    });

    this.daemons.set('log-stream', watcher);
    console.log('   ✅ Log streaming daemon started');
  }

  /**
   * Tail a new log file
   */
  async tailNewFile(filePath, tailedFiles) {
    try {
      const fullPath = path.join(this.projectPath, filePath);
      const stats = await fs.stat(fullPath);
      const content = await fs.readFile(fullPath, 'utf-8');
      
      // Parse and insert all lines
      const lines = content.split('\n').filter(line => line.trim());
      for (const line of lines) {
        await this.insertLogLine(line, filePath);
      }
      
      tailedFiles.set(filePath, stats.size);
    } catch (error) {
      console.error(`Error tailing new file ${filePath}:`, error.message);
    }
  }

  /**
   * Tail file changes
   */
  async tailFileChanges(filePath, tailedFiles) {
    try {
      const fullPath = path.join(this.projectPath, filePath);
      const stats = await fs.stat(fullPath);
      const lastSize = tailedFiles.get(filePath) || 0;
      
      if (stats.size > lastSize) {
        const stream = await fs.open(fullPath, 'r');
        const buffer = Buffer.alloc(stats.size - lastSize);
        await stream.read(buffer, 0, buffer.length, lastSize);
        await stream.close();
        
        const newContent = buffer.toString('utf-8');
        const lines = newContent.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          await this.insertLogLine(line, filePath);
        }
        
        tailedFiles.set(filePath, stats.size);
      }
    } catch (error) {
      console.error(`Error tailing file changes ${filePath}:`, error.message);
    }
  }

  /**
   * Insert a log line into the database
   */
  async insertLogLine(line, source) {
    try {
      const parsed = this.parseLogLine(line);
      
      await this.databases.logs.run(`
        INSERT INTO logs (timestamp, level, category, message, metadata, source, performance_ms)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        parsed.timestamp || new Date().toISOString(),
        parsed.level || 'INFO',
        parsed.category || 'general',
        parsed.message || line,
        JSON.stringify(parsed.metadata || {}),
        source,
        parsed.performance_ms || null
      ]);
      
      // Also insert into FTS table
      await this.databases.logs.run(`
        INSERT INTO logs_fts (message, category)
        VALUES (?, ?)
      `, [parsed.message || line, parsed.category || 'general']);
      
    } catch (error) {
      // Silently skip parsing errors
    }
  }

  /**
   * Parse log line with multiple format support
   */
  parseLogLine(line) {
    // Nuclear format: [NUCLEAR SUCCESS] or [NUCLEAR TIMING]
    if (line.includes('[NUCLEAR')) {
      const perfMatch = line.match(/(\d+(?:\.\d+)?)\s*ms/);
      return {
        level: 'INFO',
        category: 'NUCLEAR',
        message: line,
        performance_ms: perfMatch ? parseFloat(perfMatch[1]) : null
      };
    }
    
    // Standard format: [2024-01-20T10:30:00] [LEVEL] message
    const standardMatch = line.match(/^\[([^\]]+)\]\s*\[([^\]]+)\]\s*(.*)$/);
    if (standardMatch) {
      return {
        timestamp: standardMatch[1],
        level: standardMatch[2],
        message: standardMatch[3],
        category: this.extractCategory(standardMatch[3])
      };
    }
    
    // Fallback
    return {
      message: line,
      category: this.extractCategory(line)
    };
  }

  /**
   * Extract category from message
   */
  extractCategory(message) {
    if (message.includes('nuclear') || message.includes('NUCLEAR')) return 'NUCLEAR';
    if (message.includes('voice') || message.includes('Voice')) return 'VOICE';
    if (message.includes('email') || message.includes('Email')) return 'EMAIL';
    if (message.includes('error') || message.includes('ERROR')) return 'ERROR';
    if (message.includes('performance')) return 'PERFORMANCE';
    return 'GENERAL';
  }

  /**
   * Start insights generation daemon
   */
  async startInsightsDaemon() {
    const generateInsights = async () => {
      try {
        // Performance insights
        await this.generatePerformanceInsights();
        
        // Error insights
        await this.generateErrorInsights();
        
        // Usage insights
        await this.generateUsageInsights();
        
      } catch (error) {
        console.error('Error generating insights:', error.message);
      }
    };
    
    // Run immediately
    await generateInsights();
    
    // Schedule periodic runs
    const interval = setInterval(generateInsights, 300000); // Every 5 minutes
    this.daemons.set('insights', interval);
    
    console.log('   ✅ Insights daemon started');
  }

  /**
   * Generate performance insights
   */
  async generatePerformanceInsights() {
    // Check for slow nuclear triggers
    const slowTriggers = await this.databases.logs.all(`
      SELECT COUNT(*) as count, AVG(performance_ms) as avg_ms
      FROM logs
      WHERE category = 'NUCLEAR' AND performance_ms > 3000
      AND timestamp > datetime('now', '-1 hour')
    `);
    
    if (slowTriggers[0].count > 0) {
      await this.databases.insights.run(`
        INSERT INTO insights (type, category, severity, title, description, recommendation)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        'performance',
        'nuclear',
        'warning',
        'Slow Nuclear Triggers Detected',
        `Found ${slowTriggers[0].count} nuclear triggers exceeding 3s target (avg: ${slowTriggers[0].avg_ms}ms)`,
        'Review nuclear email system for performance bottlenecks'
      ]);
    }
  }

  /**
   * Generate error insights
   */
  async generateErrorInsights() {
    const recentErrors = await this.databases.logs.all(`
      SELECT COUNT(*) as count, message
      FROM logs
      WHERE level = 'ERROR'
      AND timestamp > datetime('now', '-1 hour')
      GROUP BY message
      ORDER BY count DESC
      LIMIT 5
    `);
    
    for (const error of recentErrors) {
      if (error.count > 5) {
        await this.databases.insights.run(`
          INSERT INTO insights (type, category, severity, title, description, recommendation)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          'error',
          'system',
          'high',
          'Repeated Error Pattern',
          `Error "${error.message.substring(0, 100)}..." occurred ${error.count} times`,
          'Investigate and fix the root cause of this error'
        ]);
      }
    }
  }

  /**
   * Generate usage insights
   */
  async generateUsageInsights() {
    const operationStats = await this.databases.context.all(`
      SELECT name, run_count, success_count, avg_duration_ms
      FROM operations
      ORDER BY run_count DESC
      LIMIT 10
    `);
    
    await this.databases.insights.run(`
      INSERT INTO metrics (name, value, unit, metadata)
      VALUES (?, ?, ?, ?)
    `, [
      'operation_usage',
      operationStats.length,
      'operations',
      JSON.stringify(operationStats)
    ]);
  }

  /**
   * Query interface
   */
  async query(sql, params = []) {
    try {
      const result = await this.databases.unified.all(sql, params);
      return result;
    } catch (error) {
      console.error('Query error:', error.message);
      throw error;
    }
  }

  /**
   * Get table information
   */
  async getTables() {
    const tables = await this.query(`
      SELECT name, sql 
      FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    
    const tableInfo = [];
    for (const table of tables) {
      const count = await this.query(`SELECT COUNT(*) as count FROM ${table.name}`);
      tableInfo.push({
        name: table.name,
        rowCount: count[0].count,
        sql: table.sql
      });
    }
    
    return tableInfo;
  }

  /**
   * Search logs with FTS
   */
  async searchLogs(query, limit = 100) {
    return await this.databases.logs.all(`
      SELECT l.*, highlight(logs_fts, 0, '[', ']') as highlighted
      FROM logs l
      JOIN logs_fts ON l.rowid = logs_fts.rowid
      WHERE logs_fts MATCH ?
      ORDER BY l.timestamp DESC
      LIMIT ?
    `, [query, limit]);
  }

  /**
   * Get recent insights
   */
  async getRecentInsights(hours = 24) {
    return await this.databases.insights.all(`
      SELECT * FROM insights
      WHERE created_at > datetime('now', '-${hours} hours')
      AND resolved_at IS NULL
      ORDER BY severity DESC, created_at DESC
    `);
  }

  /**
   * Track operation execution
   */
  async trackOperation(name, duration, success, metadata = {}) {
    const existing = await this.databases.context.get(
      'SELECT * FROM operations WHERE name = ?',
      [name]
    );
    
    if (existing) {
      const newCount = existing.run_count + 1;
      const newSuccessCount = existing.success_count + (success ? 1 : 0);
      const newAvgDuration = ((existing.avg_duration_ms * existing.run_count) + duration) / newCount;
      
      await this.databases.context.run(`
        UPDATE operations 
        SET last_run = CURRENT_TIMESTAMP,
            run_count = ?,
            success_count = ?,
            avg_duration_ms = ?,
            metadata = ?
        WHERE name = ?
      `, [newCount, newSuccessCount, newAvgDuration, JSON.stringify(metadata), name]);
    } else {
      await this.databases.context.run(`
        INSERT INTO operations (name, description, last_run, run_count, success_count, avg_duration_ms, metadata)
        VALUES (?, ?, CURRENT_TIMESTAMP, 1, ?, ?, ?)
      `, [name, metadata.description || '', success ? 1 : 0, duration, JSON.stringify(metadata)]);
    }
  }

  /**
   * Shutdown the pipeline
   */
  async shutdown() {
    console.log('🛑 Shutting down SQLite pipeline...');
    
    // Stop daemons
    for (const [name, daemon] of this.daemons) {
      if (daemon.close) {
        await daemon.close();
      } else if (daemon.clearInterval) {
        clearInterval(daemon);
      }
    }
    
    // Close databases
    for (const db of Object.values(this.databases)) {
      if (db) {
        await db.close();
      }
    }
    
    console.log('   ✅ SQLite pipeline shutdown complete');
  }
}

module.exports = SQLitePipeline;