/**
 * Pattern Analyzer Tool - Analyzes patterns in logs and data
 */
class PatternAnalyzerTool {
  constructor(options = {}) {
    this.projectPath = options.projectPath || process.cwd();
    this.patterns = this.getDefaultPatterns();
  }

  async execute(params, context) {
    console.log('🔍 Analyzing patterns...');
    
    const focus = params.focus || 'errors-and-performance';
    const data = params.data || this.extractDataFromContext(context);
    
    const analysis = {
      focus,
      timestamp: new Date().toISOString(),
      patterns: {},
      insights: [],
      metrics: {}
    };

    // Analyze different pattern types based on focus
    switch (focus) {
      case 'errors-and-performance':
        analysis.patterns.errors = this.analyzeErrorPatterns(data);
        analysis.patterns.performance = this.analyzePerformancePatterns(data);
        break;
        
      case 'nuclear-approach':
        analysis.patterns.nuclear = this.analyzeNuclearPatterns(data);
        analysis.patterns.timing = this.analyzeTimingPatterns(data);
        break;
        
      case 'user-journey':
        analysis.patterns.userFlow = this.analyzeUserFlowPatterns(data);
        analysis.patterns.dropoffs = this.analyzeDropoffPatterns(data);
        break;
        
      default:
        analysis.patterns.general = this.analyzeGeneralPatterns(data);
    }

    // Generate insights
    analysis.insights = this.generateInsights(analysis.patterns, focus);
    
    // Calculate metrics
    analysis.metrics = this.calculateMetrics(analysis.patterns, data);

    console.log(`✅ Pattern analysis completed: ${analysis.insights.length} insights found`);

    return analysis;
  }

  extractDataFromContext(context) {
    const data = {
      logs: [],
      apiResults: [],
      documents: []
    };

    // Extract log data
    if (context.logs) {
      for (const [source, logData] of Object.entries(context.logs)) {
        data.logs.push({
          source,
          content: logData.content || '',
          lineCount: logData.lineCount || 0,
          lastModified: logData.lastModified
        });
      }
    }

    // Extract API test results
    if (context.stepResults && context.stepResults.results) {
      data.apiResults = context.stepResults.results;
    }

    // Extract document data
    if (context.businessDocuments) {
      for (const [path, docData] of Object.entries(context.businessDocuments)) {
        data.documents.push({
          path,
          content: docData.content || '',
          size: docData.size || 0
        });
      }
    }

    return data;
  }

  analyzeErrorPatterns(data) {
    const patterns = {
      errorTypes: {},
      errorFrequency: {},
      criticalErrors: [],
      errorTrends: []
    };

    for (const log of data.logs) {
      const content = log.content;
      
      // Error type analysis
      const errorMatches = [
        { type: 'HTTP_ERROR', regex: /HTTP\s+(\d{3})/gi },
        { type: 'CRITICAL', regex: /CRITICAL|FATAL/gi },
        { type: 'ERROR', regex: /ERROR/gi },
        { type: 'FAILED', regex: /FAILED|Failed/gi },
        { type: 'TIMEOUT', regex: /TIMEOUT|timeout/gi },
        { type: 'CONNECTION', regex: /connection\s+(refused|reset|timeout)/gi }
      ];

      for (const { type, regex } of errorMatches) {
        const matches = content.match(regex) || [];
        patterns.errorTypes[type] = (patterns.errorTypes[type] || 0) + matches.length;
        
        if (matches.length > 0) {
          patterns.errorFrequency[`${log.source}:${type}`] = matches.length;
        }
      }

      // Critical error detection
      const criticalPattern = /CRITICAL|FATAL|500|failed.*critical/gi;
      const criticalMatches = content.match(criticalPattern) || [];
      if (criticalMatches.length > 0) {
        patterns.criticalErrors.push({
          source: log.source,
          count: criticalMatches.length,
          sample: this.extractSample(content, criticalPattern)
        });
      }
    }

    return patterns;
  }

  analyzePerformancePatterns(data) {
    const patterns = {
      responseTimes: [],
      slowQueries: [],
      bottlenecks: [],
      throughput: {}
    };

    for (const log of data.logs) {
      const content = log.content;
      
      // Response time analysis
      const timeMatches = content.match(/(\d+)ms/g) || [];
      const times = timeMatches.map(match => parseInt(match.replace('ms', '')));
      patterns.responseTimes.push(...times);

      // Slow query detection
      const slowQueryPattern = /took\s+(\d+\.?\d*)s/gi;
      const slowQueries = content.match(slowQueryPattern) || [];
      if (slowQueries.length > 0) {
        patterns.slowQueries.push({
          source: log.source,
          queries: slowQueries,
          count: slowQueries.length
        });
      }

      // Request throughput
      const requestPattern = /\[(GET|POST|PUT|DELETE)\]/gi;
      const requests = content.match(requestPattern) || [];
      patterns.throughput[log.source] = requests.length;
    }

    // Calculate performance metrics
    if (patterns.responseTimes.length > 0) {
      patterns.responseTimeStats = {
        min: Math.min(...patterns.responseTimes),
        max: Math.max(...patterns.responseTimes),
        avg: Math.round(patterns.responseTimes.reduce((a, b) => a + b, 0) / patterns.responseTimes.length),
        p95: this.calculatePercentile(patterns.responseTimes, 0.95)
      };
    }

    return patterns;
  }

  analyzeNuclearPatterns(data) {
    const patterns = {
      nuclearTriggers: [],
      emailResponses: [],
      timing: [],
      success: 0,
      failures: 0
    };

    for (const log of data.logs) {
      const content = log.content;
      
      // Nuclear approach specific patterns
      const nuclearPattern = /NUCLEAR|nuclear.*trigger|immediate.*email/gi;
      const nuclearMatches = content.match(nuclearPattern) || [];
      
      if (nuclearMatches.length > 0) {
        patterns.nuclearTriggers.push({
          source: log.source,
          count: nuclearMatches.length,
          samples: this.extractSamples(content, nuclearPattern, 3)
        });
      }

      // Email response timing
      const emailPattern = /email.*sent.*(\d+)ms/gi;
      const emailMatches = [...content.matchAll(emailPattern)];
      for (const match of emailMatches) {
        const timing = parseInt(match[1]);
        patterns.timing.push(timing);
        
        if (timing <= 3000) { // 3 second threshold
          patterns.success++;
        } else {
          patterns.failures++;
        }
      }

      // Track open events
      const trackPattern = /\[Track Open\]/gi;
      const trackMatches = content.match(trackPattern) || [];
      patterns.emailResponses.push(...trackMatches.map(() => ({
        source: log.source,
        timestamp: new Date().toISOString() // Would parse actual timestamp
      })));
    }

    return patterns;
  }

  analyzeUserFlowPatterns(data) {
    const patterns = {
      userJourneys: {},
      dropoffPoints: [],
      conversionFunnels: {},
      sessionFlow: []
    };

    for (const log of data.logs) {
      const content = log.content;
      
      // Session tracking
      const sessionPattern = /session[:\s]+([a-zA-Z0-9-]+)/gi;
      const sessionMatches = [...content.matchAll(sessionPattern)];
      
      for (const match of sessionMatches) {
        const sessionId = match[1];
        if (!patterns.userJourneys[sessionId]) {
          patterns.userJourneys[sessionId] = [];
        }
        
        // Extract user actions for this session
        const actionPattern = new RegExp(`${sessionId}.*?(GET|POST|PUT|DELETE)\\s+([^\\s]+)`, 'gi');
        const actionMatches = [...content.matchAll(actionPattern)];
        
        for (const actionMatch of actionMatches) {
          patterns.userJourneys[sessionId].push({
            method: actionMatch[1],
            path: actionMatch[2],
            timestamp: new Date().toISOString() // Would parse actual timestamp
          });
        }
      }

      // 404 patterns (potential dropoff points)
      const notFoundPattern = /404.*?([^\s]+)/gi;
      const notFoundMatches = [...content.matchAll(notFoundPattern)];
      patterns.dropoffPoints.push(...notFoundMatches.map(match => ({
        path: match[1],
        source: log.source
      })));
    }

    return patterns;
  }

  analyzeGeneralPatterns(data) {
    const patterns = {
      logLevels: {},
      sources: {},
      timestamps: [],
      keywords: {}
    };

    for (const log of data.logs) {
      const content = log.content;
      
      // Log level distribution
      const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];
      for (const level of levels) {
        const regex = new RegExp(level, 'gi');
        const matches = content.match(regex) || [];
        patterns.logLevels[level] = (patterns.logLevels[level] || 0) + matches.length;
      }

      // Source analysis
      patterns.sources[log.source] = {
        lineCount: log.lineCount,
        size: content.length,
        lastModified: log.lastModified
      };

      // Common keywords
      const words = content.toLowerCase().split(/\s+/);
      const significantWords = words.filter(word => 
        word.length > 3 && 
        !this.isCommonWord(word) &&
        /^[a-z]+$/.test(word)
      );

      for (const word of significantWords) {
        patterns.keywords[word] = (patterns.keywords[word] || 0) + 1;
      }
    }

    // Sort keywords by frequency
    patterns.topKeywords = Object.entries(patterns.keywords)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }));

    return patterns;
  }

  generateInsights(patterns, focus) {
    const insights = [];

    // Error insights
    if (patterns.errors) {
      const totalErrors = Object.values(patterns.errors.errorTypes).reduce((a, b) => a + b, 0);
      if (totalErrors > 10) {
        insights.push({
          type: 'warning',
          category: 'errors',
          message: `High error volume detected: ${totalErrors} errors found`,
          priority: 'high'
        });
      }

      if (patterns.errors.criticalErrors.length > 0) {
        insights.push({
          type: 'critical',
          category: 'errors',
          message: `Critical errors found in ${patterns.errors.criticalErrors.length} sources`,
          priority: 'critical'
        });
      }
    }

    // Performance insights
    if (patterns.performance && patterns.performance.responseTimeStats) {
      const stats = patterns.performance.responseTimeStats;
      if (stats.avg > 1000) {
        insights.push({
          type: 'warning',
          category: 'performance',
          message: `High average response time: ${stats.avg}ms`,
          priority: 'medium'
        });
      }

      if (stats.p95 > 5000) {
        insights.push({
          type: 'warning',
          category: 'performance',
          message: `95th percentile response time is high: ${stats.p95}ms`,
          priority: 'high'
        });
      }
    }

    // Nuclear approach insights
    if (patterns.nuclear) {
      const successRate = patterns.nuclear.success / (patterns.nuclear.success + patterns.nuclear.failures);
      if (successRate < 0.95) {
        insights.push({
          type: 'warning',
          category: 'nuclear',
          message: `Nuclear approach success rate below target: ${(successRate * 100).toFixed(1)}%`,
          priority: 'high'
        });
      }

      if (patterns.nuclear.timing.length > 0) {
        const avgTiming = patterns.nuclear.timing.reduce((a, b) => a + b, 0) / patterns.nuclear.timing.length;
        if (avgTiming > 3000) {
          insights.push({
            type: 'warning',
            category: 'nuclear',
            message: `Nuclear approach timing above 3s threshold: ${avgTiming.toFixed(0)}ms`,
            priority: 'high'
          });
        }
      }
    }

    return insights;
  }

  calculateMetrics(patterns, data) {
    const metrics = {
      totalLogLines: data.logs.reduce((sum, log) => sum + log.lineCount, 0),
      totalLogSources: data.logs.length,
      analysisTimestamp: new Date().toISOString()
    };

    if (patterns.errors) {
      metrics.errorRate = Object.values(patterns.errors.errorTypes).reduce((a, b) => a + b, 0) / metrics.totalLogLines;
    }

    if (patterns.performance && patterns.performance.responseTimeStats) {
      metrics.averageResponseTime = patterns.performance.responseTimeStats.avg;
    }

    if (patterns.nuclear) {
      metrics.nuclearSuccessRate = patterns.nuclear.success / (patterns.nuclear.success + patterns.nuclear.failures);
    }

    return metrics;
  }

  // Utility methods

  extractSample(content, pattern) {
    const lines = content.split('\n');
    for (const line of lines) {
      if (pattern.test(line)) {
        return line.trim().substring(0, 200);
      }
    }
    return null;
  }

  extractSamples(content, pattern, count = 3) {
    const lines = content.split('\n');
    const samples = [];
    
    for (const line of lines) {
      if (pattern.test(line) && samples.length < count) {
        samples.push(line.trim().substring(0, 200));
      }
    }
    
    return samples;
  }

  calculatePercentile(values, percentile) {
    const sorted = values.slice().sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[index] || 0;
  }

  isCommonWord(word) {
    const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'];
    return commonWords.includes(word);
  }

  getDefaultPatterns() {
    return {
      error: /ERROR|CRITICAL|FATAL/gi,
      warning: /WARN|WARNING/gi,
      performance: /(\d+)ms|took\s+(\d+\.?\d*)s/gi,
      nuclear: /NUCLEAR|nuclear.*trigger/gi,
      session: /session[:\s]+([a-zA-Z0-9-]+)/gi
    };
  }
}

module.exports = PatternAnalyzerTool;