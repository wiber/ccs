/**
 * Tests for SQLite Pipeline
 */

const SQLitePipeline = require('../lib/sqlite-pipeline');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

describe('SQLitePipeline', () => {
  let pipeline;
  let tempDir;

  beforeEach(async () => {
    // Create temporary directory for test databases
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ccs-test-'));
    pipeline = new SQLitePipeline(tempDir, {
      dataDir: path.join(tempDir, 'data'),
      enableDaemon: false // Disable daemons for tests
    });
  });

  afterEach(async () => {
    // Cleanup
    if (pipeline) {
      await pipeline.shutdown();
    }
    // Remove temp directory
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('Initialization', () => {
    test('should initialize all databases', async () => {
      await pipeline.initialize();

      expect(pipeline.databases.unified).toBeDefined();
      expect(pipeline.databases.logs).toBeDefined();
      expect(pipeline.databases.context).toBeDefined();
      expect(pipeline.databases.insights).toBeDefined();
    });

    test('should create required tables', async () => {
      await pipeline.initialize();

      // Check unified database tables
      const tables = await pipeline.query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
      );

      const tableNames = tables.map(t => t.name);
      expect(tableNames).toContain('system_status');
      expect(tableNames).toContain('documentation');
    });

    test('should attach all databases to unified', async () => {
      await pipeline.initialize();

      // Query across attached databases
      const result = await pipeline.query(
        "SELECT name FROM pragma_database_list"
      );

      const dbNames = result.map(r => r.name);
      expect(dbNames).toContain('main');
      expect(dbNames).toContain('logs');
      expect(dbNames).toContain('context');
      expect(dbNames).toContain('insights');
    });
  });

  describe('Log Processing', () => {
    test('should parse nuclear log format', () => {
      const logLine = '[NUCLEAR SUCCESS] Operation completed in 2500ms';
      const parsed = pipeline.parseLogLine(logLine);

      expect(parsed.category).toBe('NUCLEAR');
      expect(parsed.performance_ms).toBe(2500);
      expect(parsed.message).toBe(logLine);
    });

    test('should parse standard log format', () => {
      const logLine = '[2024-01-20T10:30:00] [ERROR] Something went wrong';
      const parsed = pipeline.parseLogLine(logLine);

      expect(parsed.timestamp).toBe('2024-01-20T10:30:00');
      expect(parsed.level).toBe('ERROR');
      expect(parsed.message).toBe('Something went wrong');
    });

    test('should extract categories correctly', () => {
      expect(pipeline.extractCategory('Nuclear trigger failed')).toBe('NUCLEAR');
      expect(pipeline.extractCategory('Voice call completed')).toBe('VOICE');
      expect(pipeline.extractCategory('Email sent successfully')).toBe('EMAIL');
      expect(pipeline.extractCategory('ERROR: Connection failed')).toBe('ERROR');
      expect(pipeline.extractCategory('Random log message')).toBe('GENERAL');
    });

    test('should insert log entries', async () => {
      await pipeline.initialize();

      const logEntry = {
        timestamp: new Date().toISOString(),
        source: 'test',
        level: 'INFO',
        message: 'Test log entry',
        metadata: '{}',
        performance_ms: null
      };

      await pipeline.insertLogLine(logEntry.message, logEntry.source);

      const logs = await pipeline.query(
        "SELECT * FROM logs.logs WHERE source = 'test'"
      );

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].message).toBe(logEntry.message);
    });
  });

  describe('Query Interface', () => {
    test('should execute queries successfully', async () => {
      await pipeline.initialize();

      // Insert test data
      await pipeline.query(
        "INSERT INTO system_status (key, value) VALUES (?, ?)",
        ['test_key', 'test_value']
      );

      // Query it back
      const result = await pipeline.query(
        "SELECT * FROM system_status WHERE key = ?",
        ['test_key']
      );

      expect(result.length).toBe(1);
      expect(result[0].value).toBe('test_value');
    });

    test('should get table information', async () => {
      await pipeline.initialize();

      const tables = await pipeline.getTables();

      expect(Array.isArray(tables)).toBe(true);
      expect(tables.length).toBeGreaterThan(0);
      
      const systemStatus = tables.find(t => t.name === 'system_status');
      expect(systemStatus).toBeDefined();
      expect(systemStatus.rowCount).toBeDefined();
    });

    test('should handle query errors gracefully', async () => {
      await pipeline.initialize();

      await expect(
        pipeline.query("SELECT * FROM non_existent_table")
      ).rejects.toThrow();
    });
  });

  describe('Search Functionality', () => {
    test('should search logs with FTS', async () => {
      await pipeline.initialize();

      // Insert test logs
      await pipeline.insertLogLine('Error in authentication module', 'test');
      await pipeline.insertLogLine('Success: User logged in', 'test');
      await pipeline.insertLogLine('Authentication failed for user', 'test');

      // Search for authentication
      const results = await pipeline.searchLogs('authentication');

      expect(results.length).toBe(2);
      expect(results.every(r => r.message.toLowerCase().includes('authentication'))).toBe(true);
    });
  });

  describe('Insights Management', () => {
    test('should store and retrieve insights', async () => {
      await pipeline.initialize();

      // Manually insert an insight
      await pipeline.databases.insights.run(
        `INSERT INTO insights (type, category, severity, title, description, recommendation)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['performance', 'nuclear', 'warning', 'Slow triggers', 'Nuclear > 3s', 'Optimize']
      );

      const insights = await pipeline.getRecentInsights(24);

      expect(insights.length).toBe(1);
      expect(insights[0].type).toBe('performance');
      expect(insights[0].severity).toBe('warning');
    });
  });

  describe('Operation Tracking', () => {
    test('should track operation execution', async () => {
      await pipeline.initialize();

      await pipeline.trackOperation('test-op', 1500, true, {
        description: 'Test operation'
      });

      const ops = await pipeline.query(
        "SELECT * FROM context.operations WHERE name = 'test-op'"
      );

      expect(ops.length).toBe(1);
      expect(ops[0].run_count).toBe(1);
      expect(ops[0].success_count).toBe(1);
      expect(ops[0].avg_duration_ms).toBe(1500);
    });

    test('should update operation statistics', async () => {
      await pipeline.initialize();

      // First run
      await pipeline.trackOperation('test-op', 1000, true);
      
      // Second run
      await pipeline.trackOperation('test-op', 2000, false);

      const ops = await pipeline.query(
        "SELECT * FROM context.operations WHERE name = 'test-op'"
      );

      expect(ops[0].run_count).toBe(2);
      expect(ops[0].success_count).toBe(1);
      expect(ops[0].avg_duration_ms).toBe(1500); // (1000 + 2000) / 2
    });
  });

  describe('Shutdown', () => {
    test('should close all databases on shutdown', async () => {
      await pipeline.initialize();

      await pipeline.shutdown();

      // Attempting to query after shutdown should fail
      await expect(
        pipeline.query("SELECT 1")
      ).rejects.toThrow();
    });
  });
});