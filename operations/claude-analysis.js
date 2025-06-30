/**
 * Enhanced Claude Analysis Operation
 * 
 * More robust version of existing claude-log-monitor.js with:
 * - Better context building and file tracking
 * - TODO list editing capabilities
 * - Optimized log processing
 * - Smart context inheritance from existing workflow
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class ClaudeAnalysisOperation {
  constructor(projectPath, config = {}) {
    this.projectPath = projectPath;
    this.config = {
      enhanced: false,
      logTailSize: 200, // Increased from existing 100
      contextDepth: 'comprehensive',
      todoEditing: true,
      fileTracking: true,
      ...config
    };
    
    this.contextFiles = new Set();
    this.todoFiles = new Set();
    this.analysisResults = {};
  }

  async execute(params = {}) {
    console.log('🧠 Enhanced Claude Analysis Starting...');
    
    if (params.enhanced) {
      this.config.enhanced = true;
      console.log('   ✅ Enhanced mode enabled');
    }

    try {
      // Step 1: Build comprehensive context (enhanced version of existing)
      const context = await this.buildEnhancedContext();
      
      // Step 2: Prepare analysis environment
      await this.prepareAnalysisEnvironment();
      
      // Step 3: Run enhanced analysis
      const result = await this.runEnhancedAnalysis(context);
      
      // Step 4: Process and store results
      await this.processResults(result);
      
      return {
        success: true,
        contextFiles: Array.from(this.contextFiles),
        todoFiles: Array.from(this.todoFiles),
        analysisFile: result.outputFile,
        insights: result.insights
      };
      
    } catch (error) {
      console.error('❌ Enhanced Claude Analysis failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async buildEnhancedContext() {
    console.log('🔍 Building enhanced context (inheriting from existing workflow)...');
    
    const context = {
      timestamp: new Date().toISOString(),
      projectInfo: await this.getProjectInfo(),
      logs: await this.collectLogsEnhanced(),
      documentation: await this.collectDocumentationEnhanced(),
      recentActivity: await this.getRecentActivity(),
      todoLists: await this.findAndAnalyzeTodos(),
      nuclearedApproach: await this.getNuclearStatus(),
      voiceTranscripts: await this.getVoiceContext(),
      businessDocs: await this.getBusinessContext()
    };

    // Track all files accessed for context
    this.trackContextFile('logs/dev-server-*.log');
    this.trackContextFile('logs/vercel-live-*.log');
    this.trackContextFile('supabase/schema-*.sql');
    this.trackContextFile('docs/**/*.md');

    return context;
  }

  async collectLogsEnhanced() {
    console.log('   📋 Collecting logs with enhanced processing...');
    
    const logs = {};
    
    try {
      // Inherit existing log discovery logic but enhance it
      const devLogPath = await this.findLatestLog('logs/dev-server-*.log');
      const vercelLogPath = await this.findLatestLog('logs/vercel-live-*.log');
      
      if (devLogPath) {
        logs.dev = await this.processLogFile(devLogPath, 'development');
        this.trackContextFile(devLogPath);
      }
      
      if (vercelLogPath) {
        logs.vercel = await this.processLogFile(vercelLogPath, 'production');
        this.trackContextFile(vercelLogPath);
      }
      
      // Enhanced: Add pattern analysis
      logs.patterns = await this.analyzeLogPatterns(logs);
      
    } catch (error) {
      console.log(`   ⚠️ Log collection warning: ${error.message}`);
    }
    
    return logs;
  }

  async collectDocumentationEnhanced() {
    console.log('   📚 Enhanced documentation collection...');
    
    const docs = {
      structure: await this.mapDocumentationStructure(),
      critical: await this.loadCriticalDocs(),
      recent: await this.getRecentDocChanges()
    };
    
    // Inherit existing doc structure mapping
    const docStructure = {
      voice: '/docs/03-features/voice-unrobocall/',
      style: '/docs/05-style-guides/', 
      email: '/docs/03-features/nuclear-email/',
      technical: '/docs/02-technical/',
      monitoring: '/docs/02-technical/infrastructure/',
      features: '/docs/03-features/',
      learnings: '/docs/08-learnings/',
      business: '/docs/01-business/',
      overview: '/docs/00-overview/',
      development: '/docs/07-development/',
      operations: '/docs/06-operations/'
    };
    
    for (const [category, docPath] of Object.entries(docStructure)) {
      docs.structure[category] = await this.loadDocCategory(docPath);
      this.trackContextFile(`${docPath}**/*.md`);
    }
    
    return docs;
  }

  async findAndAnalyzeTodos() {
    console.log('   📝 Finding and analyzing TODO lists...');
    
    const todoSources = [
      'TODO.md',
      'BUSINESS_TODO.md', 
      'logs/**/*todo*.md',
      'docs/**/*TODO*.md',
      '**/*todo*.json'
    ];
    
    const todos = {};
    
    for (const pattern of todoSources) {
      try {
        const files = await this.globSearch(pattern);
        for (const file of files) {
          const content = await this.readFile(file);
          todos[file] = {
            content,
            lastModified: await this.getFileModTime(file),
            type: this.detectTodoType(content)
          };
          this.trackTodoFile(file);
        }
      } catch (error) {
        // Continue if pattern doesn't match
      }
    }
    
    return todos;
  }

  async runEnhancedAnalysis(context) {
    console.log('🚀 Running enhanced Claude analysis...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = `logs/enhanced-claude-analysis-${timestamp}.md`;
    
    // Build enhanced prompt (inherit from existing but add enhancements)
    const prompt = this.buildEnhancedPrompt(context);
    
    // Save comprehensive context file for debugging
    const contextFile = `logs/enhanced-context-${timestamp}.json`;
    await this.writeFile(contextFile, JSON.stringify(context, null, 2));
    
    // Create the prompt file for Claude
    const promptFile = `logs/enhanced-claude-prompt-${timestamp}.md`;
    await this.writeFile(promptFile, prompt);
    
    console.log(`   📄 Context saved: ${contextFile}`);
    console.log(`   📝 Prompt prepared: ${promptFile}`);
    console.log('🚀 Launching Claude in terminal...');
    
    // Launch Claude in terminal with the prepared context
    await this.launchClaudeInTerminal(promptFile, contextFile);
    
    const result = {
      outputFile,
      contextFile,
      promptFile,
      launched: true,
      message: 'Claude launched in terminal with enhanced context'
    };
    
    return result;
  }

  async launchClaudeInTerminal(promptFile, contextFile) {
    const ClaudeLauncher = require('../lib/claude-launcher');
    const launcher = new ClaudeLauncher();
    
    // Build Claude prompt with full context
    const claudePrompt = await this.readFile(promptFile);
    
    // Add context file reference to prompt
    const enhancedPrompt = `${claudePrompt}

## Additional Context
- Full context saved in: ${contextFile}
- Prompt details in: ${promptFile}
- Project path: ${this.projectPath}

You can read these files for more detailed information if needed.`;

    // Launch Claude in the SAME terminal (critical requirement)
    await launcher.launch(enhancedPrompt, {
      method: 'direct',
      operation: 'claude-analysis',
      projectPath: this.projectPath,
      context: {
        enhanced: this.config.enhanced,
        contextFile,
        promptFile,
        operation: 'claude-analysis'
      }
    });
  }

  buildEnhancedPrompt(context) {
    return `
# Enhanced ThetaDriven Coach Analysis

You are analyzing the ThetaDriven Coach system with enhanced context awareness and TODO management capabilities.

## Current Context Summary
- **Timestamp**: ${context.timestamp}
- **Files Accessed**: ${Array.from(this.contextFiles).join(', ')}
- **TODO Lists Found**: ${Array.from(this.todoFiles).join(', ')}
- **Analysis Mode**: Enhanced with file tracking and todo editing

## System Status
${JSON.stringify(context.projectInfo, null, 2)}

## Recent Activity
${this.formatRecentActivity(context.recentActivity)}

## Log Analysis (Enhanced)
${this.formatLogSummary(context.logs)}

## Nuclear Approach Status
${this.formatNuclearStatus(context.nuclearedApproach)}

## TODO Management
${this.formatTodoAnalysis(context.todoLists)}

## Documentation Structure  
${this.formatDocStructure(context.documentation)}

## Voice & Business Context
- Voice Transcripts: ${context.voiceTranscripts?.length || 0} available
- Business Documents: ${Object.keys(context.businessDocs || {}).length} loaded

## Enhanced Analysis Request

Please provide:

1. **Critical Issues** - Immediate problems requiring attention
2. **Performance Analysis** - Nuclear approach timing, bottlenecks  
3. **TODO Prioritization** - Which tasks to focus on next
4. **Context Optimization** - How to improve this analysis process
5. **File Organization** - Recommendations for better structure

Focus on actionable insights with specific file locations and next steps.

**Context Files Referenced:**
${Array.from(this.contextFiles).map(f => `- ${f}`).join('\n')}

**TODO Files for Editing:**
${Array.from(this.todoFiles).map(f => `- ${f}`).join('\n')}
`;
  }

  // Helper methods
  async findLatestLog(pattern) {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      const { stdout } = await execAsync(`ls -t ${pattern} 2>/dev/null | head -1`);
      return stdout.trim() || null;
    } catch (error) {
      return null;
    }
  }

  async processLogFile(filePath, type) {
    const content = await this.readFile(filePath);
    const lines = content.split('\n');
    
    return {
      path: filePath,
      type,
      totalLines: lines.length,
      recentLines: lines.slice(-this.config.logTailSize),
      lastModified: await this.getFileModTime(filePath),
      patterns: this.extractLogPatterns(lines)
    };
  }

  trackContextFile(file) {
    this.contextFiles.add(file);
  }

  trackTodoFile(file) {
    this.todoFiles.add(file);
  }

  // Utility methods
  async readFile(filePath) {
    try {
      return await fs.readFile(path.join(this.projectPath, filePath), 'utf-8');
    } catch (error) {
      return '';
    }
  }

  async writeFile(filePath, content) {
    await fs.writeFile(path.join(this.projectPath, filePath), content);
  }

  async getFileModTime(filePath) {
    try {
      const stats = await fs.stat(path.join(this.projectPath, filePath));
      return stats.mtime;
    } catch (error) {
      return new Date();
    }
  }

  // Formatting methods for prompt
  formatRecentActivity(activity) {
    return JSON.stringify(activity, null, 2);
  }

  formatLogSummary(logs) {
    return Object.entries(logs).map(([key, log]) => 
      `**${key}**: ${log.totalLines || 0} lines, ${log.patterns?.length || 0} patterns`
    ).join('\n');
  }

  formatNuclearStatus(nuclear) {
    return JSON.stringify(nuclear, null, 2);
  }

  formatTodoAnalysis(todos) {
    return Object.entries(todos).map(([file, todo]) =>
      `**${file}**: ${todo.type}, modified ${todo.lastModified}`
    ).join('\n');
  }

  formatDocStructure(docs) {
    return JSON.stringify(docs.structure, null, 2);
  }

  // Placeholder implementations for missing methods
  async getProjectInfo() { return { name: 'ThetaDriven Coach', type: 'nextjs' }; }
  async getRecentActivity() { return []; }
  async getNuclearStatus() { return {}; }
  async getVoiceContext() { return []; }
  async getBusinessContext() { return {}; }
  async mapDocumentationStructure() { return {}; }
  async loadCriticalDocs() { return {}; }
  async getRecentDocChanges() { return []; }
  async loadDocCategory(path) { return {}; }
  async globSearch(pattern) { return []; }
  detectTodoType(content) { return 'standard'; }
  async analyzeLogPatterns(logs) { return []; }
  extractLogPatterns(lines) { return []; }
  async generateInsights(context) { return {}; }
  async prepareAnalysisEnvironment() { return; }
  async processResults(result) { return; }
}

module.exports = ClaudeAnalysisOperation;