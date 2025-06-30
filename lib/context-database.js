const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

/**
 * Context Database - Unified context management
 * 
 * Eliminates the need to hunt for logs, docs, and configuration
 * Provides schema-driven context loading with intelligent caching
 */
class ContextDatabase {
  constructor(projectPath, config = {}) {
    this.projectPath = projectPath;
    this.config = {
      cacheTimeout: config.cacheTimeout || 300000, // 5 minutes
      maxLogLines: config.maxLogLines || 1000,
      includeGitInfo: config.includeGitInfo !== false,
      ...config
    };
    
    this.cache = new Map();
    this.schema = null;
    this.projectInfo = null;
  }

  async initialize() {
    // Create context directory
    await this.ensureDirectory(path.join(this.projectPath, '.ccs'));
    
    // Load configuration
    await this.loadConfiguration();
    
    // Load project schema and basic info
    this.schema = await this.loadContextSchema();
    this.projectInfo = await this.loadProjectInfo();
    
    console.log(`📚 Context database initialized for: ${this.projectInfo.name}`);
  }

  async loadConfiguration() {
    try {
      const configPath = path.join(this.projectPath, '.ccs-config.json');
      const configContent = await fs.readFile(configPath, 'utf-8');
      const fileConfig = JSON.parse(configContent);
      
      // Merge with defaults
      this.config = {
        ...this.config,
        ...fileConfig,
        context: {
          logPaths: ['logs/**/*.log'],
          documentationPaths: ['docs/', 'README.md', 'CLAUDE.md'],
          ...fileConfig.context
        }
      };
    } catch (error) {
      // Use defaults if no config file
      this.config.context = {
        logPaths: ['logs/**/*.log'],
        documentationPaths: ['docs/', 'README.md', 'CLAUDE.md']
      };
    }
  }

  /**
   * Main context loading method - returns unified context for operation type
   */
  async loadContext(operationType = 'general') {
    const cacheKey = `${operationType}-${await this.getContextHash()}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.config.cacheTimeout) {
        console.log(`📋 Using cached context for ${operationType}`);
        return cached.data;
      }
    }

    console.log(`🔍 Loading fresh context for ${operationType}...`);

    const context = {
      // Core project information (always included)
      project: this.projectInfo,
      timestamp: new Date().toISOString(),
      operationType,

      // Schema-driven context loading
      ...await this.loadSchemaContext(operationType),

      // Dynamic context based on operation type
      ...await this.loadOperationSpecificContext(operationType),

      // Recent activity context
      recentActivity: await this.loadRecentActivity(),

      // Available tools and capabilities
      capabilities: await this.getAvailableCapabilities()
    };

    // Cache the result
    this.cache.set(cacheKey, {
      data: context,
      timestamp: Date.now()
    });

    return context;
  }

  /**
   * Load project information from CLAUDE.md and package.json
   */
  async loadProjectInfo() {
    if (this.projectInfo) return this.projectInfo;

    const info = {
      name: 'Unknown Project',
      type: 'generic',
      version: '1.0.0',
      architecture: {},
      commands: {},
      criticalPaths: [],
      logLocations: [],
      documentationFolders: []
    };

    try {
      // Load from package.json
      const packageJson = await this.readProjectFile('package.json');
      if (packageJson) {
        const pkg = JSON.parse(packageJson);
        info.name = pkg.name || info.name;
        info.version = pkg.version || info.version;
        info.commands = pkg.scripts || {};
      }

      // Load from CLAUDE.md for enhanced context
      const claudeMd = await this.readProjectFile('CLAUDE.md');
      if (claudeMd) {
        info.type = this.detectProjectType(claudeMd);
        info.architecture = this.extractArchitecture(claudeMd);
        info.criticalPaths = this.extractCriticalPaths(claudeMd);
        info.logLocations = this.extractLogLocations(claudeMd);
        info.documentationFolders = this.extractDocumentationFolders(claudeMd);
      }

      // Auto-detect common patterns if not specified
      if (info.logLocations.length === 0) {
        info.logLocations = await this.autoDetectLogLocations();
      }

      if (info.documentationFolders.length === 0) {
        info.documentationFolders = await this.autoDetectDocumentationFolders();
      }

    } catch (error) {
      console.warn('⚠️  Could not load complete project info:', error.message);
    }

    this.projectInfo = info;
    return info;
  }

  /**
   * Auto-detect log file locations
   */
  async autoDetectLogLocations() {
    const patterns = [
      'logs/**/*.log',
      'logs/**/*.txt',
      '*.log',
      'var/log/**/*.log',
      '.vercel/output/**/*.log'
    ];

    const locations = [];
    for (const pattern of patterns) {
      try {
        const files = await glob(pattern, { cwd: this.projectPath });
        locations.push(...files);
      } catch (error) {
        // Ignore glob errors
      }
    }

    return [...new Set(locations)]; // Remove duplicates
  }

  /**
   * Auto-detect documentation folders
   */
  async autoDetectDocumentationFolders() {
    const commonFolders = [
      'docs',
      'documentation',
      'doc',
      'README.md',
      'wiki',
      'guides'
    ];

    const folders = [];
    for (const folder of commonFolders) {
      try {
        const fullPath = path.join(this.projectPath, folder);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          folders.push(folder);
        } else if (stat.isFile() && folder.endsWith('.md')) {
          folders.push(folder);
        }
      } catch (error) {
        // Folder doesn't exist, skip
      }
    }

    return folders;
  }

  /**
   * Load operation-specific context
   */
  async loadOperationSpecificContext(operationType) {
    switch (operationType) {
      case 'monitor':
      case 'analyze-logs':
        return await this.loadMonitoringContext();
        
      case 'plan':
      case 'business-planning':
        return await this.loadPlanningContext();
        
      default:
        return await this.loadGeneralContext();
    }
  }

  async loadMonitoringContext() {
    return {
      logs: await this.loadRecentLogs(),
      apiEndpoints: await this.extractApiEndpoints(),
      performanceMetrics: await this.loadPerformanceHistory(),
      errorPatterns: await this.loadErrorPatterns()
    };
  }

  async loadPlanningContext() {
    return {
      businessDocuments: await this.loadBusinessDocuments(),
      strategicPlans: await this.loadStrategicDocuments(),
      marketAnalysis: await this.loadMarketDocuments(),
      previousPlans: await this.loadPreviousPlanningResults()
    };
  }

  async loadGeneralContext() {
    return {
      recentChanges: await this.loadRecentChanges(),
      systemHealth: await this.getSystemHealthSnapshot()
    };
  }

  /**
   * Load recent logs from detected log locations
   */
  async loadRecentLogs() {
    const logs = {};
    const logLocations = this.projectInfo?.logLocations || [];

    for (const location of logLocations) {
      try {
        const fullPath = path.join(this.projectPath, location);
        const content = await fs.readFile(fullPath, 'utf-8');
        
        // Get last N lines
        const lines = content.split('\n');
        const recentLines = lines.slice(-this.config.maxLogLines);
        
        logs[location] = {
          path: location,
          lines: recentLines.length,
          content: recentLines.join('\n'),
          lastModified: (await fs.stat(fullPath)).mtime
        };
      } catch (error) {
        // Log file might not exist or be readable
        console.warn(`⚠️  Could not read log file: ${location}`);
      }
    }

    return logs;
  }

  /**
   * Load business documents from documentation folders
   */
  async loadBusinessDocuments() {
    const docs = {};
    const docFolders = this.projectInfo?.documentationFolders || [];

    for (const folder of docFolders) {
      try {
        const pattern = path.join(this.projectPath, folder, '**/*.md');
        const files = await glob(pattern);
        
        for (const file of files) {
          const relativePath = path.relative(this.projectPath, file);
          const content = await fs.readFile(file, 'utf-8');
          
          docs[relativePath] = {
            path: relativePath,
            size: content.length,
            content: content.slice(0, 2000), // First 2000 chars for context
            lastModified: (await fs.stat(file)).mtime
          };
        }
      } catch (error) {
        console.warn(`⚠️  Could not load documents from: ${folder}`);
      }
    }

    return docs;
  }

  /**
   * Store execution results for future context
   */
  async storeExecutionResult(operationType, result) {
    const resultsPath = path.join(this.projectPath, '.claude-context', 'results');
    await this.ensureDirectory(resultsPath);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${operationType}-${timestamp}.json`;
    const filepath = path.join(resultsPath, filename);
    
    await fs.writeFile(filepath, JSON.stringify({
      operationType,
      timestamp: new Date().toISOString(),
      result,
      context: {
        projectName: this.projectInfo?.name,
        version: this.projectInfo?.version
      }
    }, null, 2));

    // Clean up old results (keep last 10)
    await this.cleanupOldResults(resultsPath, operationType);
  }

  // Utility methods

  async readProjectFile(filename) {
    try {
      const filepath = path.join(this.projectPath, filename);
      return await fs.readFile(filepath, 'utf-8');
    } catch (error) {
      return null;
    }
  }

  async ensureDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  async getContextHash() {
    // Simple hash based on file modification times
    const files = ['CLAUDE.md', 'package.json'];
    let hash = '';
    
    for (const file of files) {
      try {
        const filepath = path.join(this.projectPath, file);
        const stat = await fs.stat(filepath);
        hash += stat.mtime.getTime();
      } catch (error) {
        // File doesn't exist
      }
    }

    return hash || 'no-context';
  }

  // Parsing methods for CLAUDE.md

  detectProjectType(claudeMd) {
    if (claudeMd.includes('Next.js') || claudeMd.includes('React')) return 'nextjs';
    if (claudeMd.includes('Express') || claudeMd.includes('Node.js')) return 'nodejs';
    if (claudeMd.includes('Python') || claudeMd.includes('Django')) return 'python';
    return 'generic';
  }

  extractLogLocations(claudeMd) {
    const matches = claudeMd.match(/logs?[:/]\s*([^\n]+)/gi) || [];
    return matches.map(match => match.split(/[:\s]+/).pop().trim());
  }

  extractDocumentationFolders(claudeMd) {
    const matches = claudeMd.match(/docs?[:/]\s*([^\n]+)/gi) || [];
    return matches.map(match => match.split(/[:\s]+/).pop().trim());
  }

  extractCriticalPaths(claudeMd) {
    // Look for sections about critical paths, API routes, etc.
    const sections = claudeMd.match(/## Critical.*/gi) || [];
    return sections;
  }

  extractArchitecture(claudeMd) {
    // Extract architecture information
    return {
      framework: this.detectProjectType(claudeMd),
      database: claudeMd.includes('Supabase') ? 'supabase' : 'unknown',
      deployment: claudeMd.includes('Vercel') ? 'vercel' : 'unknown'
    };
  }

  // Additional helper methods
  async loadContextSchema() { return {}; }
  async loadSchemaContext() { return {}; }
  async loadRecentActivity() { return {}; }
  async getAvailableCapabilities() { return []; }
  async extractApiEndpoints() { return []; }
  async loadPerformanceHistory() { return {}; }
  async loadErrorPatterns() { return []; }
  async loadStrategicDocuments() { return {}; }
  async loadMarketDocuments() { return {}; }
  async loadPreviousPlanningResults() { return []; }
  async loadRecentChanges() { return []; }
  async getSystemHealthSnapshot() { return {}; }
  async cleanupOldResults() { return; }

  // Test helper methods
  async discoverLogs() {
    return await this.autoDetectLogLocations();
  }

  async loadDocumentation() {
    const docs = [];
    const docFolders = this.config.context?.documentationPaths || [];

    for (const folder of docFolders) {
      try {
        const fullPath = path.join(this.projectPath, folder);
        const stat = await fs.stat(fullPath);
        
        if (stat.isFile()) {
          docs.push({ path: folder, type: 'file' });
        } else if (stat.isDirectory()) {
          const files = await glob(path.join(folder, '**/*.md'), { cwd: this.projectPath });
          files.forEach(file => docs.push({ path: file, type: 'file' }));
        }
      } catch (error) {
        // Skip missing files/directories
      }
    }

    return docs;
  }

  async getRecentActivity(hours = 24) {
    const activity = [];
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

    try {
      // Get recent file modifications
      const files = await glob('**/*', { 
        cwd: this.projectPath,
        ignore: ['node_modules/**', '.git/**', '.ccs/**']
      });

      for (const file of files.slice(0, 50)) { // Limit for performance
        try {
          const fullPath = path.join(this.projectPath, file);
          const stat = await fs.stat(fullPath);
          
          if (stat.mtime > cutoff) {
            activity.push({
              file,
              modified: stat.mtime,
              type: 'file_change'
            });
          }
        } catch (error) {
          // Skip inaccessible files
        }
      }
    } catch (error) {
      // Return empty activity if scan fails
    }

    return activity.sort((a, b) => b.modified - a.modified);
  }
}

module.exports = ContextDatabase;