#!/usr/bin/env node

/**
 * Claude Context Engine - Main Entry Point
 * 
 * Unified context management and tool operations for Claude CLI integration
 */

const ContextDatabase = require('./context-database');
const TerminalManager = require('./terminal-manager');
const ToolChain = require('./tool-chain');
const OperationRegistry = require('./operation-registry');
const LearningEngine = require('./learning-engine');
const FeedbackLoop = require('./feedback-loop');

class ClaudeContextEngine {
  constructor(projectPath = process.cwd(), config = {}) {
    this.projectPath = projectPath;
    this.config = this.mergeConfig(config);
    
    // Core components
    this.contextDb = new ContextDatabase(projectPath, this.config.context);
    this.terminal = new TerminalManager(this.config.terminal);
    this.toolChain = new ToolChain(this.contextDb, this.terminal);
    this.operations = new OperationRegistry();
    this.learningEngine = new LearningEngine(projectPath);
    this.feedbackLoop = new FeedbackLoop(projectPath, this.learningEngine);
    
    // State
    this.initialized = false;
    this.activeSession = null;
  }

  /**
   * Initialize the engine - loads project context and registers operations
   */
  async initialize() {
    if (this.initialized) return;

    console.log('🧠 Initializing Claude Context Engine...');
    
    // Load project context
    await this.contextDb.initialize();
    
    // Register built-in operations
    await this.loadBuiltInOperations();
    
    // Load project-specific operations from CLAUDE.md
    await this.loadProjectOperations();
    
    // Initialize learning and feedback systems
    await this.learningEngine.initialize();
    await this.feedbackLoop.initialize();
    
    this.initialized = true;
    console.log('✅ Claude Context Engine initialized');
    console.log('🧠 Learning engine and feedback loop active');
  }

  /**
   * Main API - Execute an operation
   */
  async run(operationName, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    console.log(`🚀 Running operation: ${operationName}`);
    const startTime = Date.now();
    
    try {
      const operation = this.operations.get(operationName);
      if (!operation) {
        throw new Error(`Operation '${operationName}' not found. Available: ${this.operations.list().join(', ')}`);
      }

      // Create execution context
      const executionContext = await this.createExecutionContext(operationName, options);
      
      // Execute operation sequence
      const result = await this.toolChain.executeOperation(operation, executionContext);
      
      // Store result for future operations
      await this.contextDb.storeExecutionResult(operationName, result);
      
      // Record in learning engine
      const executionData = {
        id: this.generateExecutionId(),
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        success: result.success,
        context: executionContext,
        prompt: operation.description,
        output: result.result,
        error: result.error
      };
      
      await this.learningEngine.recordOperation(operationName, executionData);
      
      return result;
    } catch (error) {
      // Record failed operation in learning engine
      const executionData = {
        id: this.generateExecutionId(),
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
        success: false,
        context: await this.createExecutionContext(operationName, options),
        error: error.message
      };
      
      await this.learningEngine.recordOperation(operationName, executionData);
      
      console.error(`❌ Operation '${operationName}' failed:`, error.message);
      throw error;
    }
  }

  /**
   * Register a custom operation
   */
  registerOperation(name, definition) {
    this.operations.register(name, definition);
    console.log(`📝 Registered operation: ${name}`);
  }

  /**
   * Register a custom tool
   */
  registerTool(name, toolClass) {
    this.toolChain.registerTool(name, toolClass);
    console.log(`🔧 Registered tool: ${name}`);
  }

  /**
   * Get available operations
   */
  listOperations() {
    return this.operations.list();
  }

  /**
   * Get current context
   */
  async getContext(operationType = 'general') {
    return await this.contextDb.loadContext(operationType);
  }

  /**
   * Interactive operation selector
   */
  async interactive() {
    const inquirer = require('inquirer');
    
    const operations = this.listOperations();
    if (operations.length === 0) {
      console.log('❌ No operations available. Check your CLAUDE.md file.');
      return;
    }

    const { selectedOperation } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedOperation',
        message: 'Select an operation to run:',
        choices: operations.map(op => ({
          name: `${op} - ${this.operations.get(op).description || 'No description'}`,
          value: op
        }))
      }
    ]);

    return await this.run(selectedOperation);
  }

  // Private methods

  mergeConfig(userConfig) {
    const defaultConfig = {
      context: {
        cacheTimeout: 300000, // 5 minutes
        maxLogLines: 1000,
        includeGitInfo: true
      },
      terminal: {
        strategy: 'persistent-session',
        timeout: 60000,
        retryAttempts: 3
      },
      operations: {
        autoLoad: true,
        validationLevel: 'warn'
      }
    };

    return this.deepMerge(defaultConfig, userConfig);
  }

  deepMerge(target, source) {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  }

  async createExecutionContext(operationName, options) {
    const baseContext = await this.contextDb.loadContext(operationName);
    
    return {
      ...baseContext,
      operation: operationName,
      options,
      timestamp: new Date().toISOString(),
      sessionId: this.generateSessionId(),
      tools: this.toolChain.getAvailableTools()
    };
  }

  generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateExecutionId() {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async loadBuiltInOperations() {
    // System monitoring
    this.registerOperation('monitor', {
      description: 'System monitoring with log analysis and health checks',
      sequence: [
        { tool: 'log-collector', params: { sources: 'auto-detect' } },
        { tool: 'api-tester', params: { endpoints: 'from-context' } },
        { tool: 'pattern-analyzer', params: { focus: 'errors-and-performance' } },
        { tool: 'claude-analyzer', params: { template: 'system-monitoring' } }
      ],
      outputs: ['logs/monitoring-report-{timestamp}.md'],
      recovery: {
        'log-collector': 'continue-with-available-sources',
        'api-tester': 'skip-api-tests',
        'claude-analyzer': 'use-fallback-analysis'
      }
    });

    // Business planning
    this.registerOperation('plan', {
      description: 'Business planning with context analysis and strategic insights',
      sequence: [
        { tool: 'document-loader', params: { patterns: ['docs/**/*.md', '*.md'] } },
        { tool: 'context-analyzer', params: { focus: 'business-strategy' } },
        { tool: 'claude-planner', params: { template: 'business-planning' } }
      ],
      outputs: ['logs/business-plan-{timestamp}.md'],
      recovery: {
        'document-loader': 'use-cached-documents',
        'claude-planner': 'use-simplified-template'
      }
    });

    // Log analysis
    this.registerOperation('analyze-logs', {
      description: 'Comprehensive log analysis with pattern recognition',
      sequence: [
        { tool: 'log-collector', params: { timeRange: '24h' } },
        { tool: 'error-clusterer', params: { groupBy: 'pattern' } },
        { tool: 'performance-analyzer', params: { metrics: 'response-times' } },
        { tool: 'claude-analyzer', params: { template: 'log-analysis' } }
      ],
      outputs: ['logs/log-analysis-{timestamp}.md'],
      recovery: {
        'log-collector': 'use-fallback-sources'
      }
    });

    // Enhanced operations that complement existing ThetaDriven workflows
    await this.loadEnhancedOperations();
  }

  async loadEnhancedOperations() {
    console.log('🔧 Loading enhanced operations...');

    // Enhanced Claude Analysis (preserves existing npm run claude)
    this.registerOperation('claude-analysis', {
      description: 'Enhanced Claude analysis with context building and TODO editing',
      operationClass: require('../operations/claude-analysis'),
      enhanced: true
    });

    // Enhanced Voice Analysis (preserves existing npm run voice)
    this.registerOperation('voice-analysis', {
      description: 'Enhanced voice analysis with Miltonian pattern detection',
      operationClass: require('../operations/voice-analysis'),
      enhanced: true
    });

    // Enhanced Dev Monitor (preserves existing npm run dev)
    this.registerOperation('dev-monitor', {
      description: 'Enhanced development monitoring with real-time context building',
      operationClass: require('../operations/dev-monitor'),
      enhanced: true
    });

    // Enhanced Business Planning (preserves existing npm run biz)
    this.registerOperation('business-planning', {
      description: 'Enhanced business planning with learning integration',
      sequence: [
        { tool: 'learning-analyzer', params: { source: 'logs/biz-*.json' } },
        { tool: 'document-loader', params: { patterns: ['docs/01-business/**/*.md', 'docs/00-overview/*.md'] } },
        { tool: 'context-builder', params: { focus: 'business-strategy', enhanced: true } },
        { tool: 'claude-planner', params: { template: 'enhanced-business-planning' } }
      ],
      outputs: ['logs/enhanced-business-plan-{timestamp}.md'],
      enhanced: true
    });

    // Self-Learning Operations
    this.registerOperation('learn', {
      description: 'Trigger learning cycle to optimize operations based on feedback',
      sequence: [
        { tool: 'learning-analyzer', params: { focus: 'performance-patterns' } },
        { tool: 'prompt-optimizer', params: { operations: 'all' } },
        { tool: 'config-evolver', params: { improvements: 'auto-apply' } }
      ],
      outputs: ['logs/learning-cycle-{timestamp}.md'],
      enhanced: true
    });

    // Feedback Collection
    this.registerOperation('feedback', {
      description: 'Interactive feedback collection for continuous improvement',
      operationClass: require('../operations/feedback-collection'),
      enhanced: true
    });

    // Self-Bootstrap
    this.registerOperation('self-bootstrap', {
      description: 'Analyze and improve ccs codebase autonomously',
      operationClass: require('../operations/self-bootstrap'),
      enhanced: true
    });

    // Claude-based Setup (runs inside Claude with tools)
    this.registerOperation('claude-setup', {
      description: 'Complete ccs setup using Claude tools (run inside Claude)',
      operationClass: require('../operations/claude-setup'),
      enhanced: true
    });

    // Comprehensive Context Builder
    this.registerOperation('build-context', {
      description: 'Comprehensive context building for any operation',
      sequence: [
        { tool: 'file-scanner', params: { depth: 'comprehensive' } },
        { tool: 'doc-mapper', params: { structure: 'thetadriven' } },
        { tool: 'todo-extractor', params: { sources: ['*.md', 'logs/**/*.md'] } },
        { tool: 'schema-loader', params: { source: 'supabase/schema-*.sql' } }
      ],
      outputs: ['logs/comprehensive-context-{timestamp}.json'],
      enhanced: true
    });

    // Interactive TODO Manager
    this.registerOperation('todo-manager', {
      description: 'Interactive TODO list management and editing',
      sequence: [
        { tool: 'todo-scanner', params: { sources: ['TODO.md', 'BUSINESS_TODO.md', 'logs/**/*todo*.md'] } },
        { tool: 'todo-editor', params: { interactive: true } },
        { tool: 'priority-analyzer', params: { context: 'project-goals' } }
      ],
      outputs: ['updated TODO files'],
      enhanced: true
    });

    // Nuclear & Performance Health Check
    this.registerOperation('health-check', {
      description: 'Comprehensive system health check with nuclear monitoring',
      sequence: [
        { tool: 'nuclear-monitor', params: { threshold: 3000 } },
        { tool: 'performance-checker', params: { focus: 'api-response-times' } },
        { tool: 'db-monitor', params: { connections: true, performance: true } },
        { tool: 'api-tester', params: { endpoints: 'critical-path' } }
      ],
      outputs: ['logs/health-check-{timestamp}.md'],
      enhanced: true
    });

    console.log('✅ Enhanced operations loaded');
  }

  async loadProjectOperations() {
    try {
      const claudeMd = await this.contextDb.readProjectFile('CLAUDE.md');
      if (!claudeMd) {
        console.log('ℹ️  No CLAUDE.md found - using built-in operations only');
        return;
      }

      // Parse custom operations from CLAUDE.md
      const customOperations = this.parseClaudeMdOperations(claudeMd);
      
      for (const [name, definition] of Object.entries(customOperations)) {
        this.registerOperation(name, definition);
      }

      console.log(`📚 Loaded ${Object.keys(customOperations).length} project operations from CLAUDE.md`);
    } catch (error) {
      console.warn('⚠️  Could not load project operations:', error.message);
    }
  }

  parseClaudeMdOperations(claudeMd) {
    // Parse CLAUDE.md for operation definitions
    // This would look for sections like:
    // ## Operations
    // ### nuclear-monitor
    // Description: Monitor nuclear approach performance
    // Tools: log-collector, performance-analyzer, claude-analyzer
    
    const operations = {};
    
    // Simple regex-based parsing (could be more sophisticated)
    const operationBlocks = claudeMd.match(/### ([a-z-]+)\n([\s\S]*?)(?=###|$)/g) || [];
    
    operationBlocks.forEach(block => {
      const [, name] = block.match(/### ([a-z-]+)/) || [];
      if (!name) return;

      const description = (block.match(/Description: (.+)/) || [])[1] || '';
      const tools = (block.match(/Tools: (.+)/) || [])[1]?.split(',').map(t => t.trim()) || [];
      
      if (tools.length > 0) {
        operations[name] = {
          description,
          sequence: tools.map(tool => ({ tool, params: {} })),
          outputs: [`logs/${name}-{timestamp}.md`]
        };
      }
    });

    return operations;
  }
}

module.exports = ClaudeContextEngine;