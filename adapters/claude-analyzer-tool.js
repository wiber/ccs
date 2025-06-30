const fs = require('fs').promises;
const path = require('path');
const Handlebars = require('handlebars');

/**
 * Claude Analyzer Tool - Sends data to Claude for analysis
 */
class ClaudeAnalyzerTool {
  constructor(options = {}) {
    this.terminal = options.terminal;
    this.contextDb = options.contextDb;
    this.projectPath = options.projectPath || process.cwd();
    this.templates = new Map();
  }

  async execute(params, context) {
    console.log('🧠 Running Claude analysis...');
    
    const template = params.template || 'system-monitoring';
    const focus = params.focus || 'general';
    
    // Load or generate prompt
    const prompt = await this.generatePrompt(template, focus, context);
    
    // Send to Claude via terminal manager
    const result = await this.terminal.invokeClaude(prompt, {
      operationType: context.operationType,
      timeout: params.timeout || 60000,
      model: params.model || 'claude-3-sonnet'
    });

    if (!result.success) {
      throw new Error(`Claude analysis failed: ${result.error || 'Unknown error'}`);
    }

    console.log(`✅ Claude analysis completed (${result.metadata?.outputLength || 0} characters)`);

    return {
      analysis: result.output,
      metadata: result.metadata,
      template: template,
      focus: focus,
      prompt: prompt.substring(0, 500) + '...' // Truncated for logging
    };
  }

  async generatePrompt(templateName, focus, context) {
    // Try to load template from file
    let template = await this.loadTemplate(templateName);
    
    if (!template) {
      // Use built-in template
      template = this.getBuiltInTemplate(templateName);
    }

    // Compile template with context
    const compiledTemplate = Handlebars.compile(template);
    
    return compiledTemplate({
      ...context,
      focus,
      timestamp: new Date().toISOString(),
      // Helper data
      hasLogs: context.logs && Object.keys(context.logs).length > 0,
      hasDocuments: context.businessDocuments && Object.keys(context.businessDocuments).length > 0,
      logCount: context.logs ? Object.keys(context.logs).length : 0,
      errorPatterns: this.extractErrorPatterns(context),
      performanceMetrics: this.extractPerformanceMetrics(context)
    });
  }

  async loadTemplate(templateName) {
    try {
      const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.hbs`);
      return await fs.readFile(templatePath, 'utf-8');
    } catch (error) {
      // Template file doesn't exist
      return null;
    }
  }

  getBuiltInTemplate(templateName) {
    const templates = {
      'system-monitoring': `You are an expert system administrator analyzing logs and performance data.

## Analysis Focus: {{focus}}

## System Context
- Project: {{project.name}} ({{project.type}})
- Timestamp: {{timestamp}}
- Operation: {{operationType}}

{{#if hasLogs}}
## Log Data
{{#each logs}}
### {{@key}}
- Lines: {{lineCount}}
- Last Modified: {{lastModified}}
- Content Preview:
\`\`\`
{{content}}
\`\`\`

{{/each}}
{{/if}}

{{#if errorPatterns}}
## Error Patterns Detected
{{#each errorPatterns}}
- {{pattern}}: {{count}} occurrences
{{/each}}
{{/if}}

## Analysis Request
Please analyze the system health and provide:

1. **Critical Issues**: Any immediate problems that need attention
2. **Performance Insights**: Response times, bottlenecks, optimization opportunities  
3. **Error Analysis**: Error patterns, root causes, recommended fixes
4. **System Health Score**: 0-100 rating with justification
5. **Action Items**: Specific, prioritized next steps

Focus especially on: {{focus}}

Provide specific, actionable recommendations based on the actual data provided.`,

      'business-planning': `You are a strategic business advisor analyzing business documents and context.

## Planning Focus: {{focus}}

## Business Context
- Company: {{project.name}}
- Analysis Date: {{timestamp}}
- Operation: {{operationType}}

{{#if hasDocuments}}
## Business Documents
{{#each businessDocuments}}
### {{@key}}
- Size: {{size}} characters
- Last Modified: {{lastModified}}
- Content:
\`\`\`
{{content}}
\`\`\`

{{/each}}
{{/if}}

## Strategic Analysis Request
Please provide a comprehensive business analysis including:

1. **Strategic Overview**: Current position and market context
2. **Opportunities**: Growth areas and strategic advantages
3. **Challenges**: Key risks and obstacles
4. **Priority Actions**: Top 5 actionable items with timelines
5. **Resource Requirements**: What's needed to execute the plan
6. **Success Metrics**: How to measure progress

Focus specifically on: {{focus}}

Provide specific, implementable recommendations based on the business context provided.`,

      'log-analysis': `You are a log analysis expert examining system logs for patterns and insights.

## Log Analysis Focus: {{focus}}

## System Information
- Project: {{project.name}}
- Analysis Time: {{timestamp}}
- Log Sources: {{logCount}}

{{#if hasLogs}}
## Log Data Analysis
{{#each logs}}
### Source: {{@key}}
- Total Lines: {{totalLines}}
- Analyzed Lines: {{lineCount}}
- Last Modified: {{lastModified}}

\`\`\`
{{content}}
\`\`\`

{{/each}}
{{/if}}

## Analysis Requirements
Please provide detailed log analysis including:

1. **Error Clustering**: Group similar errors and identify patterns
2. **Performance Trends**: Response times, throughput, bottlenecks
3. **User Journey Analysis**: Track user interactions and drop-offs
4. **System Health**: Overall stability and reliability metrics
5. **Anomaly Detection**: Unusual patterns or behaviors
6. **Recommendations**: Specific fixes and improvements

Focus on: {{focus}}

Provide actionable insights based on the log data patterns.`
    };

    return templates[templateName] || templates['system-monitoring'];
  }

  extractErrorPatterns(context) {
    if (!context.logs) return [];

    const patterns = [];
    const errorRegexes = [
      { pattern: 'ERROR', regex: /ERROR/gi },
      { pattern: 'CRITICAL', regex: /CRITICAL/gi },
      { pattern: 'Failed', regex: /Failed/gi },
      { pattern: '404', regex: /404/gi },
      { pattern: '500', regex: /500/gi }
    ];

    for (const log of Object.values(context.logs)) {
      if (log.content) {
        for (const { pattern, regex } of errorRegexes) {
          const matches = log.content.match(regex) || [];
          if (matches.length > 0) {
            patterns.push({ pattern, count: matches.length });
          }
        }
      }
    }

    return patterns;
  }

  extractPerformanceMetrics(context) {
    if (!context.logs) return [];

    const metrics = [];
    
    for (const log of Object.values(context.logs)) {
      if (log.content) {
        // Look for response time patterns
        const timeMatches = log.content.match(/(\d+)ms/g) || [];
        if (timeMatches.length > 0) {
          metrics.push({
            metric: 'Response Times',
            values: timeMatches.slice(0, 10) // First 10 occurrences
          });
        }

        // Look for performance indicators
        const perfMatches = log.content.match(/took (\d+\.\d+)s/g) || [];
        if (perfMatches.length > 0) {
          metrics.push({
            metric: 'Execution Times',
            values: perfMatches.slice(0, 10)
          });
        }
      }
    }

    return metrics;
  }
}

module.exports = ClaudeAnalyzerTool;