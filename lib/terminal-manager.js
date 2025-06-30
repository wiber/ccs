const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const execAsync = promisify(exec);

/**
 * Terminal Manager - Robust Claude CLI Integration
 * 
 * Solves the "wrong terminal" problem and ensures reliable Claude sessions
 * Multiple launch strategies with session recovery
 */
class TerminalManager {
  constructor(config = {}) {
    this.config = {
      strategy: config.strategy || 'persistent-session',
      timeout: config.timeout || 60000,
      retryAttempts: config.retryAttempts || 3,
      sessionDir: config.sessionDir || '.claude-sessions',
      ...config
    };

    this.activeSession = null;
    this.sessionHistory = [];
  }

  /**
   * Main Claude invocation method with robust error handling
   */
  async invokeClaude(prompt, options = {}) {
    const sessionId = this.generateSessionId();
    
    console.log(`🧠 Invoking Claude (session: ${sessionId})...`);

    try {
      // Prepare session context
      const sessionContext = await this.prepareSession(sessionId, prompt, options);

      // Validate Claude environment
      await this.validateClaudeEnvironment();

      // Launch Claude with fallback strategies
      const result = await this.launchClaudeWithRetry(sessionContext);

      // Process and return result
      return await this.processClaudeResult(result, sessionContext);

    } catch (error) {
      console.error(`❌ Claude invocation failed: ${error.message}`);
      
      // Attempt recovery
      if (options.recovery !== false) {
        return await this.attemptRecovery(sessionId, prompt, options, error);
      }
      
      throw error;
    }
  }

  /**
   * Prepare isolated session context
   */
  async prepareSession(sessionId, prompt, options) {
    const sessionDir = path.join(process.cwd(), this.config.sessionDir);
    await this.ensureDirectory(sessionDir);

    const sessionPath = path.join(sessionDir, `${sessionId}.json`);
    const promptPath = path.join(sessionDir, `${sessionId}-prompt.txt`);

    const sessionContext = {
      sessionId,
      timestamp: new Date().toISOString(),
      sessionPath,
      promptPath,
      prompt,
      options: {
        timeout: options.timeout || this.config.timeout,
        model: options.model || 'claude-3-sonnet',
        maxTokens: options.maxTokens || 4000,
        ...options
      },
      metadata: {
        operationType: options.operationType,
        projectPath: process.cwd(),
        nodeVersion: process.version
      }
    };

    // Write session files
    await fs.writeFile(sessionPath, JSON.stringify(sessionContext, null, 2));
    await fs.writeFile(promptPath, prompt);

    return sessionContext;
  }

  /**
   * Validate Claude CLI is available and working
   */
  async validateClaudeEnvironment() {
    try {
      // Check if Claude CLI exists
      const { stdout } = await execAsync('which claude');
      if (!stdout.trim()) {
        throw new Error('Claude CLI not found in PATH');
      }

      // Check if Claude CLI is working
      const { stdout: version } = await execAsync('claude --version');
      console.log(`✅ Claude CLI available: ${version.trim()}`);

      return true;
    } catch (error) {
      throw new Error(`Claude CLI validation failed: ${error.message}\nInstall with: npm install -g @anthropic-ai/claude-code`);
    }
  }

  /**
   * Launch Claude with multiple strategies and retry logic
   */
  async launchClaudeWithRetry(sessionContext) {
    const strategies = [
      () => this.launchDirect(sessionContext),
      () => this.launchWithHereDoc(sessionContext),
      () => this.launchWithTempFile(sessionContext)
    ];

    let lastError;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      console.log(`🔄 Launch attempt ${attempt}/${this.config.retryAttempts}`);

      for (const [strategyIndex, strategy] of strategies.entries()) {
        try {
          console.log(`  📡 Trying strategy ${strategyIndex + 1}...`);
          const result = await strategy();
          
          if (result.success) {
            console.log(`✅ Claude launched successfully with strategy ${strategyIndex + 1}`);
            return result;
          }
        } catch (error) {
          console.warn(`  ⚠️  Strategy ${strategyIndex + 1} failed: ${error.message}`);
          lastError = error;
        }
      }

      if (attempt < this.config.retryAttempts) {
        console.log(`🕐 Waiting before retry attempt ${attempt + 1}...`);
        await this.sleep(1000 * attempt); // Exponential backoff
      }
    }

    throw new Error(`All Claude launch strategies failed after ${this.config.retryAttempts} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Strategy 1: Direct prompt passing
   */
  async launchDirect(sessionContext) {
    return new Promise((resolve, reject) => {
      const claudeProcess = spawn('claude', [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: sessionContext.options.timeout
      });

      let stdout = '';
      let stderr = '';

      claudeProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      claudeProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      claudeProcess.on('close', (code) => {
        if (code === 0 && stdout.length > 0) {
          resolve({
            success: true,
            output: stdout,
            stderr,
            strategy: 'direct'
          });
        } else {
          reject(new Error(`Claude process exited with code ${code}. stderr: ${stderr}`));
        }
      });

      claudeProcess.on('error', reject);

      // Send prompt
      claudeProcess.stdin.write(sessionContext.prompt);
      claudeProcess.stdin.end();
    });
  }

  /**
   * Strategy 2: Here-document approach (most reliable)
   */
  async launchWithHereDoc(sessionContext) {
    const command = `claude <<'EOF'\n${sessionContext.prompt}\nEOF`;
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: sessionContext.options.timeout,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      return {
        success: true,
        output: stdout,
        stderr,
        strategy: 'heredoc'
      };
    } catch (error) {
      throw new Error(`Here-doc strategy failed: ${error.message}`);
    }
  }

  /**
   * Strategy 3: Temporary file approach
   */
  async launchWithTempFile(sessionContext) {
    const tempFile = sessionContext.promptPath;
    
    try {
      const { stdout, stderr } = await execAsync(`claude < "${tempFile}"`, {
        timeout: sessionContext.options.timeout
      });

      return {
        success: true,
        output: stdout,
        stderr,
        strategy: 'tempfile'
      };
    } catch (error) {
      throw new Error(`Temp file strategy failed: ${error.message}`);
    }
  }

  /**
   * Process Claude's output and save results
   */
  async processClaudeResult(result, sessionContext) {
    const processedResult = {
      sessionId: sessionContext.sessionId,
      timestamp: new Date().toISOString(),
      success: result.success,
      output: result.output,
      strategy: result.strategy,
      metadata: {
        outputLength: result.output.length,
        hasErrors: result.stderr && result.stderr.length > 0,
        duration: Date.now() - new Date(sessionContext.timestamp).getTime()
      }
    };

    // Save result to session file
    await this.saveSessionResult(sessionContext, processedResult);

    // Update session history
    this.sessionHistory.push({
      sessionId: sessionContext.sessionId,
      timestamp: sessionContext.timestamp,
      success: result.success,
      strategy: result.strategy
    });

    // Keep only last 10 sessions in memory
    if (this.sessionHistory.length > 10) {
      this.sessionHistory = this.sessionHistory.slice(-10);
    }

    return processedResult;
  }

  /**
   * Attempt recovery from failed Claude invocation
   */
  async attemptRecovery(sessionId, prompt, options, originalError) {
    console.log('🔧 Attempting Claude session recovery...');

    // Recovery strategies
    const recoveryOptions = {
      ...options,
      timeout: options.timeout * 2, // Double timeout
      retryAttempts: 1, // Single retry for recovery
      recovery: false // Prevent infinite recovery loops
    };

    try {
      // Try with simplified prompt
      if (prompt.length > 10000) {
        console.log('📝 Trying with simplified prompt...');
        const simplifiedPrompt = prompt.substring(0, 5000) + '\n\n[Prompt truncated for recovery]';
        return await this.invokeClaude(simplifiedPrompt, recoveryOptions);
      }

      // Try with different strategy
      recoveryOptions.strategy = 'fallback';
      return await this.invokeClaude(prompt, recoveryOptions);

    } catch (recoveryError) {
      console.error('❌ Recovery failed:', recoveryError.message);
      
      // Return error information for debugging
      return {
        sessionId,
        success: false,
        error: originalError.message,
        recoveryError: recoveryError.message,
        output: `# Claude Invocation Failed\n\nOriginal Error: ${originalError.message}\nRecovery Error: ${recoveryError.message}\n\nPlease check:\n1. Claude CLI is installed: \`npm install -g @anthropic-ai/claude-code\`\n2. You have proper authentication\n3. Network connectivity is available\n\nSession ID: ${sessionId}`
      };
    }
  }

  /**
   * Save session result for debugging and history
   */
  async saveSessionResult(sessionContext, result) {
    const resultPath = sessionContext.sessionPath.replace('.json', '-result.json');
    
    const fullResult = {
      ...sessionContext,
      result,
      savedAt: new Date().toISOString()
    };

    await fs.writeFile(resultPath, JSON.stringify(fullResult, null, 2));
  }

  /**
   * Get session history for debugging
   */
  getSessionHistory() {
    return this.sessionHistory;
  }

  /**
   * Clean up old session files
   */
  async cleanupSessions(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    const sessionDir = path.join(process.cwd(), this.config.sessionDir);
    
    try {
      const files = await fs.readdir(sessionDir);
      const now = Date.now();

      for (const file of files) {
        const filepath = path.join(sessionDir, file);
        const stat = await fs.stat(filepath);
        
        if (now - stat.mtime.getTime() > maxAge) {
          await fs.unlink(filepath);
        }
      }
    } catch (error) {
      console.warn('⚠️  Could not cleanup session files:', error.message);
    }
  }

  // Utility methods

  generateSessionId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `claude-${timestamp}-${random}`;
  }

  async ensureDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = TerminalManager;