const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const ProjectSetupWizard = require('../lib/project-setup-wizard');

describe('ProjectSetupWizard', () => {
  let testDir;
  let wizard;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ccs-test-'));
    wizard = new ProjectSetupWizard(testDir);
  });

  afterEach(async () => {
    if (testDir) {
      await global.cleanupDirectory(testDir);
    }
  });

  test('should initialize with correct project path', () => {
    expect(wizard.projectPath).toBe(testDir);
    expect(wizard.projectName).toBe(path.basename(testDir));
  });

  test('should detect project type correctly', async () => {
    // Create Next.js config
    await fs.writeFile(path.join(testDir, 'next.config.js'), 'module.exports = {}');
    
    await wizard.discoverProject();
    
    expect(wizard.setupConfig.projectType).toBe('nextjs');
  });

  test('should create folder structure', async () => {
    wizard.setupConfig.features = ['monitoring', 'business'];
    
    await wizard.createFolderStructure();
    
    // Check core folders
    const stat = await fs.stat(path.join(testDir, 'logs'));
    expect(stat.isDirectory()).toBe(true);
    
    const businessStat = await fs.stat(path.join(testDir, 'docs', 'business-plans'));
    expect(businessStat.isDirectory()).toBe(true);
  });

  test('should generate npm scripts correctly', async () => {
    wizard.setupConfig = {
      projectName: 'test-project',
      features: ['monitoring', 'business', 'voice', 'nuclear']
    };
    
    await wizard.generateNpmScripts();
    
    const packageJsonContent = await fs.readFile(path.join(testDir, 'package.json'), 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);
    
    // Test enhanced ccs scripts (new functionality)
    expect(packageJson.scripts.ccs).toBe('ccs run --interactive');
    expect(packageJson.scripts['ccs:claude']).toBe('ccs run claude-analysis --enhanced');
    expect(packageJson.scripts['ccs:voice']).toBe('ccs run voice-analysis --enhanced');
    expect(packageJson.scripts['ccs:biz']).toBe('ccs run business-planning --enhanced');
    expect(packageJson.scripts['ccs:learn']).toBe('ccs run learn --optimize-all');
    expect(packageJson.scripts['ccs:feedback']).toBe('ccs run feedback --interactive');
    expect(packageJson.scripts['ccs:bootstrap']).toBe('ccs run self-bootstrap --analyze --improve');
    
    // Test that existing scripts are preserved (not overwritten)
    expect(packageJson.scripts.claude).toBeUndefined(); // Should not create if doesn't exist
    expect(packageJson.scripts.voice).toBeUndefined(); // Should not create if doesn't exist
    expect(packageJson.scripts.biz).toBeUndefined(); // Should not create if doesn't exist
  });

  test('should create configuration files', async () => {
    wizard.setupConfig = {
      projectName: 'test-project',
      projectType: 'nextjs',
      features: ['monitoring'],
      logPatterns: 'logs/**/*.log',
      apiEndpoints: 'http://localhost:3000/api/health'
    };
    
    await wizard.createConfigFiles();
    
    // Check config file
    const configContent = await fs.readFile(path.join(testDir, '.ccs-config.json'), 'utf-8');
    const config = JSON.parse(configContent);
    
    expect(config.project.name).toBe('test-project');
    expect(config.project.type).toBe('nextjs');
    expect(config.context.logPaths).toContain('logs/**/*.log');
  });

  test('should create monitoring scripts', async () => {
    wizard.setupConfig = {
      features: ['monitoring', 'business', 'voice', 'nuclear']
    };
    
    await wizard.createMonitoringScripts();
    
    // Check main analysis script
    const analysisScript = await fs.readFile(path.join(testDir, 'scripts', 'run-claude-analysis.sh'), 'utf-8');
    expect(analysisScript).toContain('CLAUDE LOG ANALYSIS');
    expect(analysisScript).toContain('collect-logs.sh');
    
    // Check business script
    const bizScript = await fs.readFile(path.join(testDir, 'scripts', 'run-biz-planning.sh'), 'utf-8');
    expect(bizScript).toContain('BUSINESS PLANNING');
    
    // Check voice script
    const voiceScript = await fs.readFile(path.join(testDir, 'scripts', 'voice-analyzer.js'), 'utf-8');
    expect(voiceScript).toContain('Voice Transcript Analysis');
    
    // Check nuclear script
    const nuclearScript = await fs.readFile(path.join(testDir, 'scripts', 'test-nuclear-flow.sh'), 'utf-8');
    expect(nuclearScript).toContain('NUCLEAR FLOW TESTING');
  });

  test('should handle file existence checks', async () => {
    // Test non-existent file
    expect(await wizard.fileExists('nonexistent.txt')).toBe(false);
    
    // Create file and test
    await fs.writeFile(path.join(testDir, 'test.txt'), 'content');
    expect(await wizard.fileExists('test.txt')).toBe(true);
  });

  test('should handle directory existence checks', async () => {
    // Test non-existent directory
    expect(await wizard.directoryExists('nonexistent')).toBe(false);
    
    // Create directory and test
    await fs.mkdir(path.join(testDir, 'testdir'));
    expect(await wizard.directoryExists('testdir')).toBe(true);
  });
});