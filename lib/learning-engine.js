/**
 * Learning Engine - Recursive Self-Improvement for ccs
 * 
 * This engine tracks operation performance, analyzes patterns,
 * and autonomously optimizes prompts and configurations for better results.
 * Inspired by ThetaDriven's biz-learning-store.js but extended for all operations.
 */

const fs = require('fs').promises;
const path = require('path');

class LearningEngine {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.learningPath = path.join(projectPath, '.ccs', 'learnings');
    this.feedbackPath = path.join(projectPath, '.ccs', 'feedback');
    
    // Pattern recognition thresholds
    this.ANSWER_TO_EVERYTHING = 42; // Minimum operations before pattern recognition kicks in
    this.CONVERGENCE_THRESHOLD = 0.1618; // Golden ratio for optimization convergence
    
    // Learning database structure
    this.learningDb = {
      version: '1.0.0',
      created: new Date().toISOString(),
      operations: {},
      patterns: {
        promptEffectiveness: {},
        taskSplitSuccess: {},
        timingOptimization: {},
        errorRecovery: {},
        contextRelevance: {}
      },
      evolution: {
        promptTemplates: {},
        configOptimizations: [],
        performanceMetrics: {}
      },
      feedback: {
        userRatings: [],
        autoMetrics: [],
        ciResults: []
      }
    };
    
    // Advanced features (pending implementation)
    // this.neuralNetwork = null; // TODO: Implement transformer-based pattern recognition
    // this.geneticAlgorithm = null; // For operation evolution and crossover
    // this.reinforcementLearning = null; // For autonomous improvement with reward shaping
    // this.quantumOptimizer = null; // Just kidding... or are we?
  }

  async initialize() {
    // Ensure directories exist
    await fs.mkdir(this.learningPath, { recursive: true });
    await fs.mkdir(this.feedbackPath, { recursive: true });
    
    // Load existing learning data
    await this.load();
    
    console.log('🧠 Learning engine initialized');
    console.log(`   📊 ${Object.keys(this.learningDb.operations).length} operations tracked`);
    console.log(`   🔄 ${this.learningDb.evolution.configOptimizations.length} optimizations applied`);
    console.log(`   👍 ${this.learningDb.feedback.userRatings.length} user ratings collected`);
  }

  async load() {
    try {
      const dbPath = path.join(this.learningPath, 'learning-database.json');
      const data = await fs.readFile(dbPath, 'utf-8');
      this.learningDb = { ...this.learningDb, ...JSON.parse(data) };
    } catch (error) {
      // New learning database - create with defaults
      await this.save();
    }
  }

  async save() {
    const dbPath = path.join(this.learningPath, 'learning-database.json');
    await fs.writeFile(dbPath, JSON.stringify(this.learningDb, null, 2));
  }

  /**
   * Record operation execution for learning
   */
  async recordOperation(operationName, executionData) {
    if (!this.learningDb.operations[operationName]) {
      this.learningDb.operations[operationName] = {
        executions: [],
        patterns: {},
        performance: {
          avgDuration: 0,
          successRate: 0,
          errorPatterns: {}
        }
      };
    }

    const operation = this.learningDb.operations[operationName];
    const execution = {
      id: executionData.id,
      timestamp: executionData.timestamp || new Date().toISOString(),
      duration: executionData.duration,
      success: executionData.success,
      context: executionData.context,
      prompt: executionData.prompt,
      output: executionData.output ? this.truncateOutput(executionData.output) : null,
      errorType: executionData.error ? this.categorizeError(executionData.error) : null,
      qualityScore: null, // To be filled by feedback
      userRating: null
    };

    operation.executions.push(execution);
    
    // Update performance metrics
    await this.updatePerformanceMetrics(operationName);
    
    // Analyze patterns
    await this.analyzeExecutionPatterns(operationName, execution);
    
    await this.save();
    return execution.id;
  }

  /**
   * Record user feedback for continuous improvement
   */
  async recordFeedback(executionId, rating, comments = '') {
    const feedback = {
      executionId,
      rating, // 1-5 scale
      comments,
      timestamp: new Date().toISOString()
    };

    this.learningDb.feedback.userRatings.push(feedback);
    
    // Update execution record
    for (const [operationName, operation] of Object.entries(this.learningDb.operations)) {
      const execution = operation.executions.find(e => e.id === executionId);
      if (execution) {
        execution.userRating = rating;
        execution.qualityScore = this.calculateQualityScore(execution, feedback);
        
        // Trigger learning if we have enough feedback
        if (operation.executions.filter(e => e.userRating !== null).length >= 5) {
          await this.evolveOperation(operationName);
        }
        
        // 🏆 ACHIEVEMENT UNLOCKED: Pattern Recognition Active
        // 🎯 NEXT CHALLENGE: Can you achieve 90% satisfaction with autonomous optimization?
        break;
      }
    }

    await this.save();
  }

  /**
   * Analyze patterns in successful vs failed executions
   */
  async analyzeExecutionPatterns(operationName, execution) {
    const operation = this.learningDb.operations[operationName];
    
    // Context patterns
    if (execution.context) {
      const contextKeys = Object.keys(execution.context);
      contextKeys.forEach(key => {
        if (!this.learningDb.patterns.contextRelevance[key]) {
          this.learningDb.patterns.contextRelevance[key] = {
            appearances: 0,
            successCorrelation: 0,
            operations: {}
          };
        }
        
        const pattern = this.learningDb.patterns.contextRelevance[key];
        pattern.appearances++;
        
        if (!pattern.operations[operationName]) {
          pattern.operations[operationName] = { count: 0, successes: 0 };
        }
        
        pattern.operations[operationName].count++;
        if (execution.success) {
          pattern.operations[operationName].successes++;
          pattern.successCorrelation += 1;
        }
      });
    }

    // Timing patterns
    const hour = new Date(execution.timestamp).getHours();
    const timingKey = `${operationName}_hour_${hour}`;
    if (!this.learningDb.patterns.timingOptimization[timingKey]) {
      this.learningDb.patterns.timingOptimization[timingKey] = {
        executions: 0,
        avgDuration: 0,
        successRate: 0
      };
    }
    
    const timing = this.learningDb.patterns.timingOptimization[timingKey];
    timing.executions++;
    timing.avgDuration = (timing.avgDuration * (timing.executions - 1) + execution.duration) / timing.executions;
    if (execution.success) timing.successRate += 1/timing.executions;
  }

  /**
   * Evolve operation based on learning patterns
   */
  async evolveOperation(operationName) {
    const operation = this.learningDb.operations[operationName];
    const recentExecutions = operation.executions.slice(-20); // Last 20 executions
    const successfulExecutions = recentExecutions.filter(e => e.success && e.userRating >= 4);
    const failedExecutions = recentExecutions.filter(e => !e.success || e.userRating <= 2);

    console.log(`🧠 Evolving ${operationName} based on ${recentExecutions.length} executions`);
    
    // Analyze successful patterns
    const improvements = {
      promptOptimizations: [],
      contextImprovements: [],
      timingRecommendations: []
    };

    // Prompt analysis
    if (successfulExecutions.length >= 3) {
      const successfulPrompts = successfulExecutions.map(e => e.prompt).filter(Boolean);
      const commonPatterns = this.extractCommonPatterns(successfulPrompts);
      
      if (commonPatterns.length > 0) {
        improvements.promptOptimizations.push({
          type: 'successful_patterns',
          patterns: commonPatterns,
          confidence: successfulExecutions.length / recentExecutions.length
        });
      }
    }

    // Context analysis
    const successfulContexts = successfulExecutions.map(e => e.context).filter(Boolean);
    if (successfulContexts.length > 0) {
      const contextPatterns = this.analyzeContextPatterns(successfulContexts);
      improvements.contextImprovements.push(...contextPatterns);
    }

    // Timing analysis
    const optimalTimes = this.findOptimalTiming(operationName);
    if (optimalTimes.length > 0) {
      improvements.timingRecommendations.push(...optimalTimes);
    }

    // Save improvements
    if (Object.values(improvements).some(arr => arr.length > 0)) {
      this.learningDb.evolution.configOptimizations.push({
        operation: operationName,
        timestamp: new Date().toISOString(),
        improvements,
        basedOnExecutions: recentExecutions.length,
        successRate: successfulExecutions.length / recentExecutions.length
      });

      // Apply improvements
      await this.applyImprovements(operationName, improvements);
    }

    await this.save();
  }

  /**
   * Apply learned improvements to operation configuration
   */
  async applyImprovements(operationName, improvements) {
    // Update prompt templates
    if (improvements.promptOptimizations.length > 0) {
      const templatePath = path.join(this.learningPath, `${operationName}-optimized-prompt.md`);
      const optimizedPrompt = this.generateOptimizedPrompt(operationName, improvements.promptOptimizations);
      await fs.writeFile(templatePath, optimizedPrompt);
      
      console.log(`   📝 Updated prompt template for ${operationName}`);
    }

    // Update context configuration
    if (improvements.contextImprovements.length > 0) {
      const contextPath = path.join(this.learningPath, `${operationName}-context-config.json`);
      const contextConfig = {
        recommendedContext: improvements.contextImprovements,
        generatedAt: new Date().toISOString()
      };
      await fs.writeFile(contextPath, JSON.stringify(contextConfig, null, 2));
      
      console.log(`   🎯 Updated context configuration for ${operationName}`);
    }

    // Update timing recommendations
    if (improvements.timingRecommendations.length > 0) {
      console.log(`   ⏰ Optimal timing for ${operationName}:`, improvements.timingRecommendations.map(t => t.period).join(', '));
    }
  }

  /**
   * Get learning-optimized configuration for operation
   */
  async getOptimizedConfig(operationName) {
    const optimizedConfig = {
      promptTemplate: null,
      contextConfig: null,
      timingRecommendations: [],
      qualityThreshold: 4.0
    };

    try {
      // Load optimized prompt template
      const promptPath = path.join(this.learningPath, `${operationName}-optimized-prompt.md`);
      try {
        optimizedConfig.promptTemplate = await fs.readFile(promptPath, 'utf-8');
      } catch (e) { /* No optimized prompt yet */ }

      // Load context configuration
      const contextPath = path.join(this.learningPath, `${operationName}-context-config.json`);
      try {
        const contextData = await fs.readFile(contextPath, 'utf-8');
        optimizedConfig.contextConfig = JSON.parse(contextData);
      } catch (e) { /* No optimized context yet */ }

      // Get timing recommendations
      optimizedConfig.timingRecommendations = this.findOptimalTiming(operationName);

    } catch (error) {
      console.warn(`⚠️ Could not load optimized config for ${operationName}:`, error.message);
    }

    return optimizedConfig;
  }

  /**
   * Generate performance insights
   */
  async generateInsights() {
    const insights = {
      operationPerformance: {},
      globalPatterns: [],
      recommendations: []
    };

    // Operation-specific insights
    for (const [operationName, operation] of Object.entries(this.learningDb.operations)) {
      const recentExecutions = operation.executions.slice(-10);
      const successRate = recentExecutions.filter(e => e.success).length / recentExecutions.length;
      const avgRating = recentExecutions
        .filter(e => e.userRating !== null)
        .reduce((sum, e) => sum + e.userRating, 0) / recentExecutions.filter(e => e.userRating !== null).length;

      insights.operationPerformance[operationName] = {
        successRate,
        avgRating: avgRating || 0,
        executions: operation.executions.length,
        recentTrend: this.calculateTrend(operation.executions)
      };

      // Recommendations
      if (successRate < 0.8) {
        insights.recommendations.push(`${operationName}: Consider reviewing prompt template (${(successRate * 100).toFixed(1)}% success rate)`);
      }
      if (avgRating > 0 && avgRating < 3.5) {
        insights.recommendations.push(`${operationName}: User satisfaction could be improved (${avgRating.toFixed(1)}/5 average rating)`);
      }
    }

    // Global patterns
    const bestPerformingHours = this.findBestPerformingTimes();
    if (bestPerformingHours.length > 0) {
      insights.globalPatterns.push(`Best performance typically occurs at: ${bestPerformingHours.join(', ')}`);
    }

    // Context patterns
    const keyContextFactors = this.findKeyContextFactors();
    if (keyContextFactors.length > 0) {
      insights.globalPatterns.push(`Key success factors: ${keyContextFactors.join(', ')}`);
    }

    return insights;
  }

  // Helper methods
  updatePerformanceMetrics(operationName) {
    const operation = this.learningDb.operations[operationName];
    const executions = operation.executions;
    
    operation.performance.avgDuration = executions.reduce((sum, e) => sum + e.duration, 0) / executions.length;
    operation.performance.successRate = executions.filter(e => e.success).length / executions.length;
  }

  truncateOutput(output) {
    if (typeof output === 'string' && output.length > 1000) {
      return output.substring(0, 1000) + '...[truncated]';
    }
    return output;
  }

  categorizeError(error) {
    if (error.includes('timeout')) return 'timeout';
    if (error.includes('network') || error.includes('connection')) return 'network';
    if (error.includes('permission') || error.includes('auth')) return 'auth';
    if (error.includes('not found')) return 'missing_resource';
    return 'other';
  }

  calculateQualityScore(execution, feedback) {
    let score = feedback.rating * 20; // Scale 1-5 to 20-100
    
    // Adjust based on execution success
    if (!execution.success) score *= 0.5;
    
    // Adjust based on duration (faster is generally better)
    if (execution.duration < 5000) score += 5; // Bonus for fast execution
    else if (execution.duration > 30000) score -= 10; // Penalty for slow execution
    
    return Math.max(0, Math.min(100, score));
  }

  extractCommonPatterns(prompts) {
    // Simple pattern extraction - could be more sophisticated
    const patterns = [];
    const phrases = prompts.join(' ').toLowerCase().split(/[.!?]+/);
    const phraseCounts = {};
    
    phrases.forEach(phrase => {
      const cleaned = phrase.trim();
      if (cleaned.length > 10) {
        phraseCounts[cleaned] = (phraseCounts[cleaned] || 0) + 1;
      }
    });
    
    return Object.entries(phraseCounts)
      .filter(([phrase, count]) => count >= 2)
      .map(([phrase, count]) => ({ phrase, frequency: count }));
  }

  analyzeContextPatterns(contexts) {
    const patterns = [];
    const keyFrequency = {};
    
    contexts.forEach(context => {
      Object.keys(context).forEach(key => {
        keyFrequency[key] = (keyFrequency[key] || 0) + 1;
      });
    });
    
    return Object.entries(keyFrequency)
      .filter(([key, count]) => count >= contexts.length * 0.6) // Present in 60%+ of successful executions
      .map(([key, count]) => ({ contextKey: key, importance: count / contexts.length }));
  }

  findOptimalTiming(operationName) {
    const timingPatterns = Object.entries(this.learningDb.patterns.timingOptimization)
      .filter(([key]) => key.startsWith(operationName))
      .map(([key, data]) => ({
        period: key.split('_').slice(-1)[0],
        successRate: data.successRate,
        avgDuration: data.avgDuration,
        executions: data.executions
      }))
      .filter(p => p.executions >= 3) // Require at least 3 data points
      .sort((a, b) => b.successRate - a.successRate);
    
    return timingPatterns.slice(0, 3); // Top 3 time periods
  }

  generateOptimizedPrompt(operationName, optimizations) {
    return `# Optimized Prompt for ${operationName}

Generated: ${new Date().toISOString()}
Based on: ${optimizations.length} successful pattern(s)

## Learned Patterns

${optimizations.map(opt => 
  `- ${opt.type}: ${opt.patterns.map(p => p.phrase || p).join(', ')}`
).join('\n')}

## Optimized Prompt Template

[This template will be dynamically generated based on successful patterns]

---
*Auto-generated by ccs learning engine*`;
  }

  calculateTrend(executions) {
    if (executions.length < 5) return 'insufficient_data';
    
    const recent = executions.slice(-5);
    const older = executions.slice(-10, -5);
    
    const recentSuccessRate = recent.filter(e => e.success).length / recent.length;
    const olderSuccessRate = older.filter(e => e.success).length / older.length;
    
    if (recentSuccessRate > olderSuccessRate + 0.1) return 'improving';
    if (recentSuccessRate < olderSuccessRate - 0.1) return 'declining';
    return 'stable';
  }

  findBestPerformingTimes() {
    const hourlyStats = {};
    
    Object.entries(this.learningDb.patterns.timingOptimization).forEach(([key, data]) => {
      const hour = key.split('_').pop();
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = { executions: 0, totalSuccess: 0 };
      }
      hourlyStats[hour].executions += data.executions;
      hourlyStats[hour].totalSuccess += data.successRate * data.executions;
    });
    
    return Object.entries(hourlyStats)
      .filter(([hour, stats]) => stats.executions >= 5)
      .map(([hour, stats]) => ({ hour, successRate: stats.totalSuccess / stats.executions }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 3)
      .map(h => `${h.hour}:00`);
  }

  findKeyContextFactors() {
    return Object.entries(this.learningDb.patterns.contextRelevance)
      .filter(([key, data]) => data.appearances >= 5)
      .map(([key, data]) => ({ key, successRate: data.successCorrelation / data.appearances }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 5)
      .map(f => f.key);
  }
}

module.exports = LearningEngine;