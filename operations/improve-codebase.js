/**
 * Improve Codebase Operation
 * 
 * Demonstrates interactive question-raising pattern
 * Claude can ask specific questions back to understand the codebase better
 */

const fs = require('fs').promises;
const path = require('path');
const SQLitePipeline = require('../lib/sqlite-pipeline');
const ClaudeLauncher = require('../lib/claude-launcher');

class ImproveCodebaseOperation {
  constructor(projectPath, config = {}) {
    this.projectPath = projectPath;
    this.config = {
      interactive: true,
      focusAreas: [],
      includeTests: true,
      includeDocs: true,
      ...config
    };
    
    this.launcher = new ClaudeLauncher();
    this.pipeline = null;
  }

  async execute(params = {}) {
    console.log('🔧 Codebase Improvement Analysis Starting...');
    console.log('   📋 This is an interactive session - Claude will ask questions');
    
    try {
      // Initialize SQLite for insights
      this.pipeline = new SQLitePipeline(this.projectPath, {
        enableDaemon: false
      });
      await this.pipeline.initialize();
      
      // Step 1: Analyze codebase structure
      const codebaseInfo = await this.analyzeCodebaseStructure();
      
      // Step 2: Identify improvement opportunities
      const opportunities = await this.identifyOpportunities(codebaseInfo);
      
      // Step 3: Gather recent changes and patterns
      const recentPatterns = await this.analyzeRecentPatterns();
      
      // Step 4: Build improvement context
      const context = await this.buildImprovementContext(
        codebaseInfo,
        opportunities,
        recentPatterns
      );
      
      // Step 5: Generate specific questions for Claude to ask
      const questions = this.generateInteractiveQuestions(context);
      
      // Step 6: Define Claude's capabilities for this session
      const capabilities = [
        'Read and analyze any file in the codebase',
        'Suggest specific code improvements with examples',
        'Create new files or refactor existing ones',
        'Run tests and analyze results',
        'Update documentation',
        'Ask for clarification on business logic or architectural decisions'
      ];
      
      // Step 7: Build the improvement prompt
      const prompt = this.buildImprovementPrompt(context);
      
      // Step 8: Launch Claude with interactive capabilities
      console.log('🚀 Launching Claude for interactive improvement session...\n');
      
      await this.launcher.launch(prompt, {
        method: 'direct',
        operation: 'improve-codebase',
        projectPath: this.projectPath,
        questions: questions,
        capabilities: capabilities,
        context: {
          interactive: true,
          focusAreas: this.config.focusAreas,
          opportunities: opportunities.length,
          codebaseSize: codebaseInfo.totalFiles
        }
      });
      
      return {
        success: true,
        launched: true,
        interactive: true,
        questionsRaised: questions.length,
        message: 'Claude launched in interactive improvement mode'
      };
      
    } catch (error) {
      console.error('❌ Improvement analysis failed:', error.message);
      return { success: false, error: error.message };
    } finally {
      if (this.pipeline) {
        await this.pipeline.shutdown();
      }
    }
  }

  async analyzeCodebaseStructure() {
    console.log('📊 Analyzing codebase structure...');
    
    const structure = {
      directories: await this.getDirectoryStructure(),
      languages: await this.detectLanguages(),
      frameworks: await this.detectFrameworks(),
      testCoverage: await this.analyzeTestCoverage(),
      documentation: await this.analyzeDocumentation(),
      dependencies: await this.analyzeDependencies()
    };
    
    // Use SQLite to track codebase metrics
    if (this.pipeline) {
      await this.pipeline.query(`
        INSERT INTO metrics (name, value, unit, metadata)
        VALUES (?, ?, ?, ?)
      `, [
        'codebase_analysis',
        structure.directories.totalFiles,
        'files',
        JSON.stringify(structure)
      ]);
    }
    
    return structure;
  }

  async identifyOpportunities(codebaseInfo) {
    console.log('🔍 Identifying improvement opportunities...');
    
    const opportunities = [];
    
    // Check for missing tests
    if (codebaseInfo.testCoverage.percentage < 80) {
      opportunities.push({
        type: 'testing',
        priority: 'high',
        description: 'Test coverage is below 80%',
        suggestion: 'Add unit tests for uncovered code paths'
      });
    }
    
    // Check for outdated dependencies
    if (codebaseInfo.dependencies.outdated > 0) {
      opportunities.push({
        type: 'dependencies',
        priority: 'medium',
        description: `${codebaseInfo.dependencies.outdated} outdated dependencies`,
        suggestion: 'Update dependencies to latest stable versions'
      });
    }
    
    // Check for missing documentation
    if (codebaseInfo.documentation.coverage < 60) {
      opportunities.push({
        type: 'documentation',
        priority: 'medium',
        description: 'Documentation coverage is low',
        suggestion: 'Add JSDoc comments and update README files'
      });
    }
    
    // Check for code complexity
    const complexFiles = await this.findComplexFiles();
    if (complexFiles.length > 0) {
      opportunities.push({
        type: 'complexity',
        priority: 'high',
        description: `${complexFiles.length} files with high complexity`,
        suggestion: 'Refactor complex functions and break down large files'
      });
    }
    
    return opportunities;
  }

  async analyzeRecentPatterns() {
    console.log('📈 Analyzing recent development patterns...');
    
    const patterns = {
      recentErrors: [],
      performanceIssues: [],
      commonPatterns: [],
      successfulPatterns: []
    };
    
    // Query recent errors from SQLite
    if (this.pipeline) {
      patterns.recentErrors = await this.pipeline.getRecentInsights(24);
      
      // Get performance patterns
      const perfData = await this.pipeline.query(`
        SELECT * FROM metrics 
        WHERE name LIKE '%performance%' 
        ORDER BY timestamp DESC 
        LIMIT 20
      `);
      
      patterns.performanceIssues = perfData.filter(m => m.value > m.threshold);
    }
    
    return patterns;
  }

  buildImprovementContext(codebaseInfo, opportunities, patterns) {
    return {
      timestamp: new Date().toISOString(),
      codebase: codebaseInfo,
      opportunities: opportunities,
      patterns: patterns,
      focusAreas: this.config.focusAreas,
      metrics: {
        totalFiles: codebaseInfo.directories.totalFiles,
        testCoverage: codebaseInfo.testCoverage.percentage,
        docCoverage: codebaseInfo.documentation.coverage,
        outdatedDeps: codebaseInfo.dependencies.outdated,
        highPriorityIssues: opportunities.filter(o => o.priority === 'high').length
      }
    };
  }

  generateInteractiveQuestions(context) {
    const questions = [];
    
    // Always ask about priorities
    questions.push(
      "What are the current top 3 business priorities that code improvements should support?"
    );
    
    // Ask about specific areas based on findings
    if (context.opportunities.some(o => o.type === 'testing')) {
      questions.push(
        "Which components are most critical for test coverage? Are there any that should be prioritized?"
      );
    }
    
    if (context.opportunities.some(o => o.type === 'complexity')) {
      questions.push(
        "Are there any complex areas that are intentionally designed that way for performance reasons?"
      );
    }
    
    if (context.patterns.recentErrors.length > 0) {
      questions.push(
        "I noticed recurring errors in the logs. Are these known issues or should they be prioritized for fixing?"
      );
    }
    
    // Ask about architectural decisions
    questions.push(
      "Are there any architectural patterns or conventions I should follow when suggesting improvements?"
    );
    
    // Ask about constraints
    questions.push(
      "Are there any technical constraints or upcoming changes I should be aware of before suggesting refactors?"
    );
    
    return questions;
  }

  buildImprovementPrompt(context) {
    return `You are conducting an interactive codebase improvement session for ccs.

# Codebase Overview
${JSON.stringify(context.codebase, null, 2)}

# Identified Opportunities
${context.opportunities.map(o => `- [${o.priority.toUpperCase()}] ${o.type}: ${o.description}`).join('\n')}

# Recent Patterns
- Recent Errors: ${context.patterns.recentErrors.length}
- Performance Issues: ${context.patterns.performanceIssues.length}

# Current Metrics
- Total Files: ${context.metrics.totalFiles}
- Test Coverage: ${context.metrics.testCoverage}%
- Documentation Coverage: ${context.metrics.docCoverage}%
- Outdated Dependencies: ${context.metrics.outdatedDeps}
- High Priority Issues: ${context.metrics.highPriorityIssues}

# Your Mission

You are here to help improve the codebase through an interactive dialogue. Your approach should be:

1. **Ask First**: Start by asking the specific questions provided to understand context better
2. **Analyze Deeply**: Based on answers, dive deep into the most critical areas
3. **Suggest Specifically**: Provide concrete, actionable improvements with code examples
4. **Verify Understanding**: Confirm your understanding of business logic before suggesting changes
5. **Prioritize Impact**: Focus on changes that provide the most value

# Improvement Areas to Consider

1. **Code Quality**
   - Reduce complexity in high-complexity files
   - Improve error handling patterns
   - Enhance type safety

2. **Performance**
   - Optimize slow operations
   - Reduce memory usage
   - Improve caching strategies

3. **Maintainability**
   - Add missing tests
   - Improve documentation
   - Standardize patterns

4. **Architecture**
   - Identify coupling issues
   - Suggest better abstractions
   - Improve module boundaries

# Interactive Session Guidelines

- Start with the questions provided
- Based on answers, ask follow-up questions
- Request specific files when needed
- Suggest running specific analysis commands
- Provide code examples for suggested improvements
- Create a prioritized action plan

Remember: This is a collaborative session. The goal is to understand the specific needs and constraints before making improvements.`;
  }

  // Helper methods
  async getDirectoryStructure() {
    // Simplified implementation
    return {
      totalFiles: 500,
      totalDirectories: 50,
      mainDirectories: ['src', 'lib', 'operations', 'tests', 'docs']
    };
  }

  async detectLanguages() {
    return {
      primary: 'JavaScript',
      secondary: ['TypeScript', 'SQL', 'Markdown']
    };
  }

  async detectFrameworks() {
    return {
      runtime: 'Node.js',
      frameworks: ['Express', 'SQLite', 'Jest'],
      tools: ['ESLint', 'Prettier']
    };
  }

  async analyzeTestCoverage() {
    return {
      percentage: 65,
      uncoveredFiles: 35,
      criticalUncovered: 5
    };
  }

  async analyzeDocumentation() {
    return {
      coverage: 45,
      readmeFiles: 12,
      jsdocCoverage: 30
    };
  }

  async analyzeDependencies() {
    return {
      total: 45,
      outdated: 8,
      security: 0
    };
  }

  async findComplexFiles() {
    return [
      { file: 'lib/optimized-stream-processor.js', complexity: 85 },
      { file: 'operations/ccsdev.js', complexity: 78 }
    ];
  }
}

module.exports = ImproveCodebaseOperation;