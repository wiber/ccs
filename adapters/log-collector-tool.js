const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

/**
 * Log Collector Tool - Collects logs from various sources
 */
class LogCollectorTool {
  constructor(options = {}) {
    this.contextDb = options.contextDb;
    this.projectPath = options.projectPath || process.cwd();
    this.maxLines = options.maxLines || 1000;
  }

  async execute(params, context) {
    console.log('📋 Collecting logs...');
    
    const sources = params.sources || this.getDefaultSources(context);
    const timeRange = params.timeRange || '24h';
    
    const logs = {};
    
    for (const source of sources) {
      try {
        if (typeof source === 'string') {
          // File pattern source
          const files = await glob(source, { cwd: this.projectPath });
          
          for (const file of files) {
            const logData = await this.collectFromFile(file, timeRange);
            if (logData) {
              logs[file] = logData;
            }
          }
        } else if (source.type === 'vercel') {
          // Vercel API source
          const vercelLogs = await this.collectFromVercel(source, timeRange);
          logs['vercel'] = vercelLogs;
        }
      } catch (error) {
        console.warn(`⚠️  Could not collect from source: ${JSON.stringify(source)} - ${error.message}`);
      }
    }

    const summary = {
      totalSources: Object.keys(logs).length,
      totalLines: Object.values(logs).reduce((sum, log) => sum + (log.lineCount || 0), 0),
      timeRange,
      collectedAt: new Date().toISOString()
    };

    console.log(`✅ Collected logs from ${summary.totalSources} sources (${summary.totalLines} lines)`);

    return {
      logs,
      summary
    };
  }

  async collectFromFile(filePath, timeRange) {
    try {
      const fullPath = path.resolve(this.projectPath, filePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      const stats = await fs.stat(fullPath);
      
      const lines = content.split('\n');
      const recentLines = this.filterByTimeRange(lines, timeRange);
      const limitedLines = recentLines.slice(-this.maxLines);

      return {
        source: filePath,
        lineCount: limitedLines.length,
        totalLines: lines.length,
        content: limitedLines.join('\n'),
        lastModified: stats.mtime,
        size: stats.size
      };
    } catch (error) {
      console.warn(`⚠️  Could not read log file: ${filePath} - ${error.message}`);
      return null;
    }
  }

  async collectFromVercel(source, timeRange) {
    // Placeholder for Vercel API integration
    // In real implementation, this would use Vercel API
    return {
      source: 'vercel-api',
      lineCount: 0,
      content: '# Vercel logs would be collected here via API',
      note: 'Vercel integration not implemented in this example'
    };
  }

  filterByTimeRange(lines, timeRange) {
    // Simple time filtering - in real implementation would parse timestamps
    // For now, just return recent lines based on time range
    const multiplier = this.getTimeRangeMultiplier(timeRange);
    const linesToTake = Math.min(lines.length, this.maxLines * multiplier);
    
    return lines.slice(-linesToTake);
  }

  getTimeRangeMultiplier(timeRange) {
    switch (timeRange) {
      case '1h': return 0.1;
      case '6h': return 0.5;
      case '24h': return 1;
      case '7d': return 7;
      default: return 1;
    }
  }

  getDefaultSources(context) {
    // Auto-detect log sources from context
    if (context.project?.logLocations) {
      return context.project.logLocations;
    }

    // Fallback patterns
    return [
      'logs/**/*.log',
      'logs/**/*.txt',
      '*.log'
    ];
  }
}

module.exports = LogCollectorTool;