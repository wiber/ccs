const path = require('path');
const fs = require('fs').promises;

/**
 * Tool Chain - Sequential tool execution with recovery
 * 
 * Orchestrates tool operations in sequence with error recovery
 * and context passing between tools
 */
class ToolChain {
  constructor(contextDb, terminalManager) {
    this.contextDb = contextDb;
    this.terminal = terminalManager;
    this.tools = new Map();
    this.executionHistory = [];
    
    // Register built-in tools
    this.registerBuiltInTools();
  }

  /**
   * Register a tool
   */
  registerTool(name, toolClass) {
    this.tools.set(name, toolClass);
    console.log(`🔧 Registered tool: ${name}`);
  }

  /**
   * Get available tools
   */
  getAvailableTools() {
    return Array.from(this.tools.keys());
  }

  /**
   * Execute an operation sequence
   */
  async executeOperation(operation, executionContext) {
    const executionId = this.generateExecutionId();
    
    console.log(`⚙️  Executing operation: ${operation.description || 'No description'}`);
    
    // Handle enhanced operations with operation classes
    if (operation.operationClass && operation.enhanced) {
      return await this.executeEnhancedOperation(operation, executionContext);
    }
    
    // Handle traditional sequence-based operations
    if (operation.sequence) {
      console.log(`📋 Sequence: ${operation.sequence.map(s => s.tool).join(' → ')}`);
    }

    const execution = {
      id: executionId,
      operation: operation.description,
      sequence: operation.sequence || [],
      startTime: Date.now(),
      results: [],
      context: executionContext,
      status: 'running'
    };

    try {
      // Execute each tool in sequence
      let currentContext = executionContext;
      
      for (let i = 0; i < operation.sequence.length; i++) {
        const step = operation.sequence[i];
        console.log(`\n🔧 Step ${i + 1}/${operation.sequence.length}: ${step.tool}`);
        
        try {
          const stepResult = await this.executeStep(step, currentContext, execution);
          
          // Update context with step result
          currentContext = {
            ...currentContext,
            previousStep: step.tool,
            stepResults: stepResult,
            stepIndex: i
          };
          
          execution.results.push({
            step: i + 1,
            tool: step.tool,
            success: true,
            result: stepResult,
            timestamp: new Date().toISOString()
          });
          
          console.log(`✅ Step ${i + 1} completed successfully`);
          
        } catch (stepError) {
          console.error(`❌ Step ${i + 1} failed: ${stepError.message}`);
          
          // Attempt recovery
          const recovered = await this.attemptStepRecovery(step, stepError, operation, currentContext);
          
          if (recovered) {
            console.log(`🔧 Step ${i + 1} recovered`);
            execution.results.push({
              step: i + 1,
              tool: step.tool,
              success: true,
              result: recovered,
              recovered: true,
              originalError: stepError.message,
              timestamp: new Date().toISOString()
            });
            
            currentContext = {
              ...currentContext,
              previousStep: step.tool,
              stepResults: recovered,
              stepIndex: i
            };
          } else {
            // Recovery failed, record and continue or fail
            execution.results.push({
              step: i + 1,
              tool: step.tool,
              success: false,
              error: stepError.message,
              timestamp: new Date().toISOString()
            });
            
            if (this.isStepCritical(step, operation)) {
              throw new Error(`Critical step '${step.tool}' failed: ${stepError.message}`);
            }
            
            console.log(`⚠️  Non-critical step failed, continuing...`);
          }
        }
      }
      
      execution.status = 'completed';
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;
      
      console.log(`\n✅ Operation completed in ${execution.duration}ms`);
      
      // Generate final output if specified
      const finalResult = await this.generateFinalOutput(operation, execution, currentContext);
      
      // Store execution history
      this.executionHistory.push(execution);
      
      return {
        success: true,
        execution,
        result: finalResult,
        outputs: await this.saveOutputs(operation, finalResult, executionContext)
      };
      
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = Date.now();
      execution.duration = execution.endTime - execution.startTime;
      execution.error = error.message;
      
      console.error(`❌ Operation failed after ${execution.duration}ms: ${error.message}`);
      
      this.executionHistory.push(execution);
      
      return {
        success: false,
        execution,
        error: error.message
      };
    }
  }

  /**
   * Execute a single step
   */
  async executeStep(step, context, execution) {
    const toolClass = this.tools.get(step.tool);
    if (!toolClass) {
      throw new Error(`Tool '${step.tool}' not found. Available tools: ${this.getAvailableTools().join(', ')}`);
    }

    // Instantiate tool
    const tool = new toolClass({
      contextDb: this.contextDb,
      terminal: this.terminal,
      projectPath: context.project?.name || process.cwd()
    });

    // Prepare step parameters
    const stepParams = this.resolveStepParams(step.params, context);
    
    // Execute tool
    return await tool.execute(stepParams, context);
  }

  /**
   * Resolve step parameters from context
   */
  resolveStepParams(params, context) {
    if (!params) return {};

    const resolved = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string') {
        // Handle special parameter resolution
        switch (value) {
          case 'auto-detect':
            resolved[key] = this.autoDetectParam(key, context);
            break;
          case 'from-context':
            resolved[key] = this.getFromContext(key, context);
            break;
          default:
            resolved[key] = value;
        }
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }

  /**
   * Auto-detect parameter values
   */
  autoDetectParam(paramName, context) {
    switch (paramName) {
      case 'sources':
        return context.project?.logLocations || ['logs/**/*.log'];
      case 'endpoints':
        return context.apiEndpoints || ['http://localhost:3000/api/health'];
      case 'patterns':
        return ['docs/**/*.md', '*.md'];
      default:
        return null;
    }
  }

  /**
   * Get parameter from context
   */
  getFromContext(paramName, context) {
    const contextMap = {
      'endpoints': context.apiEndpoints,
      'logLocations': context.project?.logLocations,
      'documentationFolders': context.project?.documentationFolders
    };

    return contextMap[paramName] || null;
  }

  /**
   * Attempt to recover from step failure
   */
  async attemptStepRecovery(step, error, operation, context) {
    const recoveryStrategy = operation.recovery?.[step.tool];
    if (!recoveryStrategy) {
      return null;
    }

    console.log(`🔧 Attempting recovery with strategy: ${recoveryStrategy}`);

    try {
      switch (recoveryStrategy) {
        case 'retry-with-fallback-sources':
          return await this.retryWithFallbackSources(step, context);
          
        case 'continue-without-api-tests':
          return { skipped: true, reason: 'API tests unavailable' };
          
        case 'use-cached-analysis':
          return await this.useCachedAnalysis(step, context);
          
        case 'use-fallback-analysis':
          return await this.useFallbackAnalysis(step, context);
          
        case 'skip-step':
          return { skipped: true, reason: 'Step skipped due to failure' };
          
        default:
          console.warn(`Unknown recovery strategy: ${recoveryStrategy}`);
          return null;
      }
    } catch (recoveryError) {
      console.error(`Recovery failed: ${recoveryError.message}`);
      return null;
    }
  }

  /**
   * Check if step is critical to operation success
   */
  isStepCritical(step, operation) {
    // Steps marked as critical or Claude analysis steps are usually critical
    return step.critical !== false && (
      step.tool.includes('claude') || 
      step.tool.includes('analyzer') ||
      operation.criticalSteps?.includes(step.tool)
    );
  }

  /**
   * Generate final output from execution results
   */
  async generateFinalOutput(operation, execution, context) {
    // If last step was Claude analysis, use that as primary output
    const lastResult = execution.results[execution.results.length - 1];
    if (lastResult?.tool.includes('claude')) {
      return lastResult.result;
    }

    // Otherwise, combine all results
    return {
      summary: `Operation '${operation.description}' completed`,
      results: execution.results,
      context: {
        operationType: context.operationType,
        timestamp: context.timestamp,
        duration: execution.duration
      }
    };
  }

  /**
   * Save outputs to specified files
   */
  async saveOutputs(operation, result, context) {
    if (!operation.outputs || operation.outputs.length === 0) {
      return [];
    }

    const savedFiles = [];

    for (const outputPattern of operation.outputs) {
      try {
        // Resolve output path with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const outputPath = outputPattern.replace('{timestamp}', timestamp);
        
        // Determine output format
        let content;
        if (outputPath.endsWith('.json')) {
          content = JSON.stringify(result, null, 2);
        } else {
          // Assume markdown format
          content = this.formatAsMarkdown(result, operation, context);
        }

        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        await fs.mkdir(outputDir, { recursive: true });

        // Write output file
        await fs.writeFile(outputPath, content);
        
        savedFiles.push(outputPath);
        console.log(`💾 Output saved: ${outputPath}`);
        
      } catch (error) {
        console.error(`❌ Failed to save output: ${error.message}`);
      }
    }

    return savedFiles;
  }

  /**
   * Format result as markdown
   */
  formatAsMarkdown(result, operation, context) {
    return `# ${operation.description || 'Operation Result'}

Generated: ${new Date().toISOString()}
Operation: ${context.operationType}
Duration: ${result.duration || 'Unknown'}ms

## Result

${typeof result === 'string' ? result : JSON.stringify(result, null, 2)}

---
*Generated by Claude Context Engine*
`;
  }

  /**
   * Register built-in tools
   */
  registerBuiltInTools() {
    // Tool implementations
    try {
      const LogCollectorTool = require('../adapters/log-collector-tool');
      const ApiTesterTool = require('../adapters/api-tester-tool');
      const PatternAnalyzerTool = require('../adapters/pattern-analyzer-tool');
      const ClaudeAnalyzerTool = require('../adapters/claude-analyzer-tool');
      const DocumentLoaderTool = require('../adapters/document-loader-tool');

      this.registerTool('log-collector', LogCollectorTool);
      this.registerTool('api-tester', ApiTesterTool);
      this.registerTool('pattern-analyzer', PatternAnalyzerTool);
      this.registerTool('claude-analyzer', ClaudeAnalyzerTool);
      this.registerTool('claude-planner', ClaudeAnalyzerTool); // Same tool, different template
      this.registerTool('document-loader', DocumentLoaderTool);
      this.registerTool('context-analyzer', PatternAnalyzerTool); // Alias for pattern analyzer
      this.registerTool('error-clusterer', PatternAnalyzerTool); // Alias for pattern analyzer
      this.registerTool('performance-analyzer', PatternAnalyzerTool); // Alias for pattern analyzer
    } catch (error) {
      console.warn('⚠️  Could not load all built-in tools:', error.message);
    }
  }

  // Recovery methods
  async retryWithFallbackSources(step, context) {
    // Implementation would retry with different log sources
    return { recovered: true, method: 'fallback-sources' };
  }

  async useCachedAnalysis(step, context) {
    // Implementation would use previously cached Claude analysis
    return { cached: true, result: 'Previous analysis result' };
  }

  async useFallbackAnalysis(step, context) {
    // Implementation would use simplified analysis without Claude
    return { fallback: true, result: 'Simplified analysis' };
  }

  generateExecutionId() {
    return `exec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  /**
   * Execute enhanced operation with operation class
   */
  async executeEnhancedOperation(operation, executionContext) {
    console.log('🚀 Executing enhanced operation with operation class');
    
    try {
      const OperationClass = operation.operationClass;
      const operationInstance = new OperationClass(
        executionContext.project?.name || process.cwd(),
        {
          enhanced: true,
          contextDb: this.contextDb,
          terminal: this.terminal,
          ...executionContext.options
        }
      );
      
      const result = await operationInstance.execute(executionContext.options || {});
      
      return {
        success: result.success,
        result,
        enhanced: true,
        operationType: operation.description
      };
      
    } catch (error) {
      console.error('❌ Enhanced operation failed:', error.message);
      return {
        success: false,
        error: error.message,
        enhanced: true
      };
    }
  }
}

module.exports = ToolChain;