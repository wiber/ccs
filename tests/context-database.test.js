const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const ContextDatabase = require('../lib/context-database');

describe('ContextDatabase', () => {
  let testDir;
  let contextDb;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ccs-context-test-'));
    contextDb = new ContextDatabase(testDir);
  });

  afterEach(async () => {
    if (testDir) {
      await global.cleanupDirectory(testDir);
    }
  });

  test('should initialize with correct project path', () => {
    expect(contextDb.projectPath).toBe(testDir);
  });

  test('should create context directory', async () => {
    await contextDb.initialize();
    
    const contextDir = path.join(testDir, '.ccs');
    const stat = await fs.stat(contextDir);
    expect(stat.isDirectory()).toBe(true);
  });

  test('should discover log files', async () => {
    // Create test log files
    await fs.mkdir(path.join(testDir, 'logs'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'logs', 'test.log'), 'test log content');
    await fs.writeFile(path.join(testDir, 'app.log'), 'app log content');
    
    await contextDb.initialize();
    const logs = await contextDb.discoverLogs();
    
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.some(log => log.includes('test.log'))).toBe(true);
  });

  test('should load documentation files', async () => {
    // Create test documentation
    await fs.writeFile(path.join(testDir, 'README.md'), '# Test Project');
    await fs.writeFile(path.join(testDir, 'CLAUDE.md'), '# Claude Context');
    await fs.mkdir(path.join(testDir, 'docs'), { recursive: true });
    await fs.writeFile(path.join(testDir, 'docs', 'guide.md'), '# Guide');
    
    await contextDb.initialize();
    const docs = await contextDb.loadDocumentation();
    
    expect(docs.length).toBeGreaterThan(0);
    expect(docs.some(doc => doc.path.includes('README.md'))).toBe(true);
    expect(docs.some(doc => doc.path.includes('CLAUDE.md'))).toBe(true);
  });

  test('should handle missing configuration gracefully', async () => {
    await contextDb.initialize();
    
    // Should not throw even without config file
    expect(contextDb.config).toBeDefined();
    expect(contextDb.config.context).toBeDefined();
  });

  test('should load project configuration', async () => {
    const config = {
      project: { name: 'test-project' },
      context: {
        logPaths: ['logs/**/*.log'],
        documentationPaths: ['docs/', 'README.md']
      }
    };
    
    await fs.writeFile(
      path.join(testDir, '.ccs-config.json'), 
      JSON.stringify(config, null, 2)
    );
    
    await contextDb.initialize();
    
    expect(contextDb.config.project.name).toBe('test-project');
    expect(contextDb.config.context.logPaths).toContain('logs/**/*.log');
  });

  test('should detect recent activity', async () => {
    // Create git-like structure
    await fs.mkdir(path.join(testDir, '.git'), { recursive: true });
    
    // Create recent file
    const recentFile = path.join(testDir, 'recent.txt');
    await fs.writeFile(recentFile, 'recent content');
    
    await contextDb.initialize();
    const activity = await contextDb.getRecentActivity(24); // last 24 hours
    
    expect(Array.isArray(activity)).toBe(true);
  });
});