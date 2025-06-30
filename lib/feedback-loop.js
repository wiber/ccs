/**
 * Feedback Loop - User feedback collection and CI/CD integration
 * 
 * Collects feedback from users and external sources to improve ccs operations
 */

const fs = require('fs').promises;
const path = require('path');
const inquirer = require('inquirer');

class FeedbackLoop {
  constructor(projectPath, learningEngine) {
    this.projectPath = projectPath;
    this.learningEngine = learningEngine;
    this.feedbackPath = path.join(projectPath, '.ccs', 'feedback');
  }

  async initialize() {
    await fs.mkdir(this.feedbackPath, { recursive: true });
  }

  /**
   * Interactive feedback collection
   */
  async collectInteractiveFeedback() {
    console.log('\n📝 ccs Feedback Collection');
    console.log('Help us improve by rating recent operations\n');

    // Get recent executions that need feedback
    const recentExecutions = await this.getExecutionsNeedingFeedback();
    
    if (recentExecutions.length === 0) {
      console.log('✅ No operations need feedback at this time');
      return;
    }

    for (const execution of recentExecutions.slice(0, 3)) { // Limit to 3 for user experience
      await this.collectExecutionFeedback(execution);
    }

    console.log('\n🙏 Thank you for helping improve ccs!');
  }

  async collectExecutionFeedback(execution) {
    console.log(`\n📊 Operation: ${execution.operation}`);
    console.log(`⏰ Time: ${new Date(execution.timestamp).toLocaleString()}`);
    if (execution.duration) {
      console.log(`⚡ Duration: ${(execution.duration / 1000).toFixed(1)}s`);
    }
    
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'rating',
        message: 'How would you rate this operation?',
        choices: [
          { name: '⭐⭐⭐⭐⭐ Excellent - Exactly what I needed', value: 5 },
          { name: '⭐⭐⭐⭐ Good - Helpful with minor issues', value: 4 },
          { name: '⭐⭐⭐ Okay - Somewhat useful', value: 3 },
          { name: '⭐⭐ Poor - Limited usefulness', value: 2 },
          { name: '⭐ Very Poor - Not helpful', value: 1 }
        ]
      },
      {
        type: 'input',
        name: 'comments',
        message: 'Any specific comments or suggestions? (optional)',
        default: ''
      },
      {
        type: 'checkbox',
        name: 'issues',
        message: 'What issues did you encounter? (if any)',
        choices: [
          'Too slow',
          'Output not relevant',
          'Missed important information',
          'Too verbose',
          'Too brief',
          'Technical errors',
          'Context not understood',
          'Other'
        ],
        when: (answers) => answers.rating <= 3
      }
    ]);

    // Record feedback
    await this.learningEngine.recordFeedback(
      execution.id, 
      answers.rating, 
      this.formatFeedbackComments(answers.comments, answers.issues)
    );

    console.log('✅ Feedback recorded');
  }

  /**
   * Automatic feedback from CI/CD pipeline results
   */
  async recordCIFeedback(executionId, ciResults) {
    const feedback = {
      type: 'ci_pipeline',
      executionId,
      results: ciResults,
      timestamp: new Date().toISOString()
    };

    // Convert CI results to rating
    let rating = 5;
    if (ciResults.testFailures > 0) rating -= 1;
    if (ciResults.buildFailures > 0) rating -= 1;
    if (ciResults.lintErrors > 0) rating -= 0.5;
    if (ciResults.deploymentFailures > 0) rating -= 2;
    
    rating = Math.max(1, Math.min(5, Math.round(rating)));

    const comments = this.formatCIComments(ciResults);
    
    await this.learningEngine.recordFeedback(executionId, rating, comments);
    
    // Save detailed CI feedback
    const ciPath = path.join(this.feedbackPath, `ci-${executionId}.json`);
    await fs.writeFile(ciPath, JSON.stringify(feedback, null, 2));
  }

  /**
   * Monitor external metrics for automatic feedback
   */
  async collectMetricsFeedback() {
    try {
      // Check recent ccs outputs for measurable metrics
      const metrics = await this.analyzeOutputMetrics();
      
      if (metrics.length > 0) {
        for (const metric of metrics) {
          await this.recordMetricFeedback(metric);
        }
      }
    } catch (error) {
      console.warn('⚠️ Could not collect metrics feedback:', error.message);
    }
  }

  /**
   * Generate feedback prompts for operations
   */
  async generateFeedbackPrompt(operationName) {
    const operation = this.learningEngine.learningDb.operations[operationName];
    if (!operation || operation.executions.length === 0) {
      return null;
    }

    const recentExecutions = operation.executions.slice(-5);
    const needsFeedback = recentExecutions.filter(e => e.userRating === null);
    
    if (needsFeedback.length === 0) {
      return null;
    }

    return {
      operation: operationName,
      pendingFeedback: needsFeedback.length,
      avgDuration: recentExecutions.reduce((sum, e) => sum + e.duration, 0) / recentExecutions.length,
      successRate: recentExecutions.filter(e => e.success).length / recentExecutions.length
    };
  }

  // Helper methods
  async getExecutionsNeedingFeedback() {
    const executions = [];
    const cutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000); // Last 7 days
    
    for (const [operationName, operation] of Object.entries(this.learningEngine.learningDb.operations)) {
      const needsFeedback = operation.executions.filter(e => 
        e.userRating === null && 
        new Date(e.timestamp).getTime() > cutoffTime
      );
      
      needsFeedback.forEach(execution => {
        executions.push({ ...execution, operation: operationName });
      });
    }
    
    return executions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  formatFeedbackComments(comments, issues) {
    let formatted = comments || '';
    if (issues && issues.length > 0) {
      formatted += (formatted ? '\n' : '') + 'Issues: ' + issues.join(', ');
    }
    return formatted;
  }

  formatCIComments(ciResults) {
    const parts = [];
    if (ciResults.testFailures > 0) parts.push(`${ciResults.testFailures} test failures`);
    if (ciResults.buildFailures > 0) parts.push(`${ciResults.buildFailures} build failures`);
    if (ciResults.lintErrors > 0) parts.push(`${ciResults.lintErrors} lint errors`);
    if (ciResults.deploymentFailures > 0) parts.push(`${ciResults.deploymentFailures} deployment failures`);
    
    return parts.length > 0 ? 'CI Issues: ' + parts.join(', ') : 'CI: All checks passed';
  }

  async analyzeOutputMetrics() {
    const metrics = [];
    
    try {
      // Analyze recent log files for measurable outcomes
      const logsDir = path.join(this.projectPath, 'logs');
      const logFiles = await fs.readdir(logsDir);
      
      // Look for ccs output files from last 24 hours
      const recent = logFiles.filter(f => {
        const filePath = path.join(logsDir, f);
        const stats = require('fs').statSync(filePath);
        const ageHours = (Date.now() - stats.mtime.getTime()) / (1000 * 60 * 60);
        return ageHours < 24 && (f.includes('ccs') || f.includes('analysis'));
      });
      
      for (const file of recent.slice(0, 3)) {
        const content = await fs.readFile(path.join(logsDir, file), 'utf-8');
        const fileMetrics = this.extractMetricsFromContent(content, file);
        metrics.push(...fileMetrics);
      }
    } catch (error) {
      // Non-critical error
    }
    
    return metrics;
  }

  extractMetricsFromContent(content, filename) {
    const metrics = [];
    
    // Look for performance indicators
    const performanceRegex = /(\d+)\s*(ms|seconds?)\s*(response|duration|time)/gi;
    const performanceMatches = content.match(performanceRegex);
    
    if (performanceMatches) {
      metrics.push({
        type: 'performance',
        filename,
        indicators: performanceMatches,
        score: this.calculatePerformanceScore(performanceMatches)
      });
    }
    
    // Look for error indicators
    const errorRegex = /(error|failed|exception|timeout)/gi;
    const errorMatches = content.match(errorRegex);
    
    if (errorMatches) {
      metrics.push({
        type: 'errors',
        filename,
        count: errorMatches.length,
        score: Math.max(1, 5 - Math.min(4, errorMatches.length))
      });
    }
    
    return metrics;
  }

  calculatePerformanceScore(performanceMatches) {
    // Simple scoring based on performance indicators
    let score = 5;
    
    performanceMatches.forEach(match => {
      const numbers = match.match(/\d+/g);
      if (numbers) {
        const value = parseInt(numbers[0]);
        if (match.includes('ms')) {
          if (value > 5000) score -= 1; // Slow response
          if (value > 10000) score -= 1; // Very slow
        } else if (match.includes('second')) {
          if (value > 30) score -= 1; // Slow operation
          if (value > 60) score -= 1; // Very slow
        }
      }
    });
    
    return Math.max(1, score);
  }

  async recordMetricFeedback(metric) {
    // Find the most recent execution that could have generated this metric
    const recentExecutions = [];
    
    for (const [operationName, operation] of Object.entries(this.learningEngine.learningDb.operations)) {
      const recent = operation.executions
        .filter(e => e.userRating === null)
        .slice(-3);
      recentExecutions.push(...recent.map(e => ({ ...e, operation: operationName })));
    }
    
    if (recentExecutions.length > 0) {
      const execution = recentExecutions[0]; // Most recent
      const comments = `Auto-feedback from ${metric.type}: ${JSON.stringify(metric.indicators || metric.count)}`;
      
      await this.learningEngine.recordFeedback(execution.id, metric.score, comments);
    }
  }
}

module.exports = FeedbackLoop;