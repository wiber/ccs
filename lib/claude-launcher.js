/**
 * Claude CLI Launch Enforcement Module
 * 
 * CRITICAL: Ensures all operations launch Claude CLI in the same terminal
 * This is a hard requirement from months of learning at ThetaDriven Coach
 * 
 * Key Pattern: Operations must ALWAYS end with launching Claude, never just return analysis
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class ClaudeLauncher {
  constructor() {
    this.launchMethods = {
      direct: this.launchDirect.bind(this),
      pipe: this.launchWithPipe.bind(this),
      file: this.launchWithFile.bind(this)
    };
  }

  /**
   * Primary launch method - MUST be called at the end of every operation
   * @param {string} prompt - The complete prompt for Claude
   * @param {object} options - Launch options
   * @returns {Promise<void>} - Resolves when Claude is launched
   */
  async launch(prompt, options = {}) {
    const {
      method = 'direct',
      context = {},
      projectPath = process.cwd(),
      interactive = true,
      questions = [],
      capabilities = []
    } = options;

    console.log('\n🚀 Launching Claude CLI with full context...\n');

    // Validate prompt
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Claude launch requires a valid prompt string');
    }

    // Choose launch method
    const launchMethod = this.launchMethods[method];
    if (!launchMethod) {
      throw new Error(`Unknown launch method: ${method}. Use 'direct', 'pipe', or 'file'`);
    }

    // Add context header if provided
    const fullPrompt = this.buildFullPrompt(prompt, context);

    // Add questions and capabilities if provided
    const enhancedPrompt = this.addQuestionsAndCapabilities(fullPrompt, questions, capabilities);

    // Launch Claude
    await launchMethod(enhancedPrompt, options);
  }

  /**
   * Build full prompt with context
   */
  buildFullPrompt(prompt, context) {
    let fullPrompt = prompt;

    if (context && Object.keys(context).length > 0) {
      const contextHeader = `
# Context Information
Timestamp: ${new Date().toISOString()}
Operation: ${context.operation || 'ccs'}
Enhanced: ${context.enhanced || false}

`;
      fullPrompt = contextHeader + prompt;
    }

    return fullPrompt;
  }

  /**
   * Add questions and capabilities to prompt
   */
  addQuestionsAndCapabilities(prompt, questions = [], capabilities = []) {
    let enhancedPrompt = prompt;

    // Add specific questions that need answers
    if (questions.length > 0) {
      enhancedPrompt += `\n\n## Specific Questions Requiring Answers\n\n`;
      enhancedPrompt += `Please address these specific questions in your analysis:\n\n`;
      questions.forEach((question, index) => {
        enhancedPrompt += `${index + 1}. ${question}\n`;
      });
    }

    // Add capabilities and permissions
    if (capabilities.length > 0) {
      enhancedPrompt += `\n\n## Your Capabilities for This Session\n\n`;
      enhancedPrompt += `You have been granted the following capabilities:\n\n`;
      capabilities.forEach(capability => {
        enhancedPrompt += `- ${capability}\n`;
      });
    }

    // Add interactive guidance
    if (questions.length > 0 || capabilities.length > 0) {
      enhancedPrompt += `\n\n## Interactive Guidance\n\n`;
      enhancedPrompt += `This is an interactive session. You can:\n`;
      enhancedPrompt += `- Ask clarifying questions about the codebase\n`;
      enhancedPrompt += `- Request specific files or data\n`;
      enhancedPrompt += `- Suggest running specific commands\n`;
      enhancedPrompt += `- Raise concerns or blockers you encounter\n`;
      enhancedPrompt += `\nThe user expects a dialogue, not just a one-way analysis.\n`;
    }

    return enhancedPrompt;
  }

  /**
   * Method 1: Direct launch with spawn (inherit stdio)
   * This is the preferred method for same-terminal execution
   */
  async launchDirect(prompt, options = {}) {
    return new Promise((resolve, reject) => {
      // Use spawn with stdio: 'inherit' to keep in same terminal
      const claude = spawn('claude', [prompt], {
        stdio: 'inherit',
        shell: true,
        cwd: options.projectPath || process.cwd(),
        env: {
          ...process.env,
          CLAUDE_CONTEXT: 'ccs',
          CLAUDE_OPERATION: options.operation || 'analysis'
        }
      });

      claude.on('error', (error) => {
        if (error.code === 'ENOENT') {
          console.error('❌ Claude CLI not found. Please install it first.');
          console.error('   Visit: https://claude.ai/cli');
        } else {
          console.error('❌ Failed to launch Claude:', error.message);
        }
        reject(error);
      });

      claude.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Claude exited with code ${code}`));
        }
      });
    });
  }

  /**
   * Method 2: Pipe launch (for compatibility with existing patterns)
   * Used by scripts that output to stdout and pipe to Claude
   */
  async launchWithPipe(prompt, options = {}) {
    // Simply output to stdout for piping
    console.log(prompt);
    
    // Note: The actual piping happens in package.json scripts
    // Example: "improve": "node scripts/improve.js | claude"
  }

  /**
   * Method 3: File-based launch (for very large contexts)
   * Saves prompt to file and launches Claude with file reference
   */
  async launchWithFile(prompt, options = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const promptFile = path.join(
      options.projectPath || process.cwd(),
      `logs/claude-prompt-${timestamp}.md`
    );

    // Save prompt to file
    await fs.writeFile(promptFile, prompt);
    console.log(`📄 Prompt saved to: ${promptFile}`);

    // Launch Claude with file reference
    const filePrompt = `Please read and analyze the content in: ${promptFile}

This file contains the full context and analysis request.`;

    return this.launchDirect(filePrompt, options);
  }

  /**
   * Validate that Claude CLI is available
   */
  async validateClaudeAvailable() {
    return new Promise((resolve) => {
      const checkClaude = spawn('which', ['claude'], {
        shell: true
      });

      checkClaude.on('close', (code) => {
        resolve(code === 0);
      });

      checkClaude.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Enhanced launch with pre-validation
   */
  async launchWithValidation(prompt, options = {}) {
    const isAvailable = await this.validateClaudeAvailable();
    
    if (!isAvailable) {
      console.error('❌ Claude CLI is not installed or not in PATH');
      console.error('');
      console.error('To install Claude CLI:');
      console.error('1. Visit https://claude.ai/cli');
      console.error('2. Follow the installation instructions');
      console.error('3. Ensure claude is in your PATH');
      console.error('');
      throw new Error('Claude CLI not available');
    }

    return this.launch(prompt, options);
  }

  /**
   * Create a formatted prompt for specific operations
   */
  createOperationPrompt(operation, data) {
    const prompts = {
      'claude-analysis': this.createAnalysisPrompt,
      'voice-analysis': this.createVoicePrompt,
      'business-planning': this.createBusinessPrompt,
      'kanban-management': this.createKanbanPrompt,
      'improve-codebase': this.createImprovePrompt,
      'reinforce-patterns': this.createReinforcePrompt
    };

    const promptBuilder = prompts[operation];
    if (!promptBuilder) {
      throw new Error(`No prompt builder for operation: ${operation}`);
    }

    return promptBuilder.call(this, data);
  }

  /**
   * Analysis prompt builder
   */
  createAnalysisPrompt(data) {
    return `You are analyzing the ThetaDriven Coach system with enhanced monitoring capabilities.

## Current Context
${JSON.stringify(data.context, null, 2)}

## Recent Logs
${data.logs || 'No recent logs available'}

## System Health
${JSON.stringify(data.health, null, 2)}

## Your Tasks
1. Identify critical issues requiring immediate attention
2. Analyze system performance and bottlenecks
3. Review TODO items and prioritize next steps
4. Suggest optimizations and improvements

## Available Commands
You can run any of these commands:
- npm run test - Run tests
- npm run build - Build the project
- npm run dev - Start development server
- node scripts/<script>.js - Run specific scripts

Focus on actionable insights with specific next steps.`;
  }

  /**
   * Voice analysis prompt builder
   */
  createVoicePrompt(data) {
    return `You are analyzing the ThetaDriven Coach voice system with Miltonian pattern expertise.

## Voice System Overview
${JSON.stringify(data.overview, null, 2)}

## Recent Transcripts
${data.transcripts || 'No transcripts available'}

## Miltonian Pattern Analysis
${JSON.stringify(data.patterns, null, 2)}

## Your Tasks
1. Assess current Miltonian sophistication level
2. Analyze embodiment question effectiveness
3. Review voice call performance metrics
4. Suggest prompt improvements for Bland AI
5. Create new sophisticated question patterns

Remember: We use indirect suggestion and embodied discovery, never direct commands.`;
  }

  /**
   * Business planning prompt builder
   */
  createBusinessPrompt(data) {
    return `You are conducting business planning for ThetaDriven Coach with data-driven insights.

## Business Metrics
${JSON.stringify(data.metrics, null, 2)}

## Current Priorities
${data.priorities || 'No priorities loaded'}

## Market Analysis
${JSON.stringify(data.market, null, 2)}

## Your Tasks
1. Review current business metrics and KPIs
2. Analyze user engagement and growth
3. Prioritize strategic initiatives
4. Suggest revenue optimization strategies
5. Plan next quarter's objectives

Use the kanban board (npm run kanban) to track action items.`;
  }

  /**
   * Ensure all operations use this launcher
   */
  static enforceUsage() {
    console.log(`
⚠️  CRITICAL REQUIREMENT: All ccs operations MUST use ClaudeLauncher

❌ NEVER: Just return analysis or show results
✅ ALWAYS: End with claudeLauncher.launch(prompt)

Example:
  const ClaudeLauncher = require('./lib/claude-launcher');
  const launcher = new ClaudeLauncher();
  
  // ... generate analysis ...
  
  await launcher.launch(prompt, {
    method: 'direct',
    operation: 'voice-analysis'
  });
`);
  }
}

module.exports = ClaudeLauncher;