# CCS Operations Guide

This guide covers all available operations in CCS and how to use them effectively.

## Core Operations

### 1. claude-analysis
**Purpose**: Comprehensive system analysis with monitoring capabilities

```bash
# Basic usage
ccs run claude-analysis

# Enhanced mode with deeper analysis
ccs run claude-analysis --enhanced
```

**What it does:**
- Collects and analyzes system logs
- Discovers and tracks TODO files
- Monitors system health and performance
- Builds comprehensive documentation map
- Launches Claude with full context

**Best for:**
- Daily development monitoring
- Debugging system issues
- Understanding project state
- Finding performance bottlenecks

### 2. voice-analysis
**Purpose**: Analyze voice system with Miltonian pattern recognition

```bash
# Analyze voice transcripts and patterns
ccs run voice-analysis

# Enhanced mode with deeper sophistication analysis
ccs run voice-analysis --enhanced
```

**What it does:**
- Fetches voice transcripts from multiple sources
- Detects Miltonian language patterns
- Analyzes embodiment quality
- Measures sophistication levels
- Provides improvement recommendations

**Pattern Detection:**
- Scale patterns (0-9 measurements)
- Embodiment hooks
- Incomplete thoughts
- Metaphors and indirect suggestions
- Portal language

**Best for:**
- Improving voice call scripts
- Enhancing Miltonian sophistication
- Analyzing user engagement
- Optimizing Bland AI prompts

### 3. business-planning
**Purpose**: Strategic planning with data-driven insights

```bash
# Run business analysis
ccs run business-planning

# Include specific metrics
ccs run business-planning --include-financials
```

**What it does:**
- Gathers business metrics (users, revenue, growth)
- Analyzes trends and opportunities
- Identifies risks and mitigation strategies
- Generates strategic recommendations
- Integrates with kanban for task tracking

**Metrics Analyzed:**
- User metrics (total, active, churn)
- Engagement (session time, retention)
- Revenue (MRR, ARR, LTV)
- Growth (user/revenue growth rates)
- Performance (from SQLite logs)

**Best for:**
- Weekly/monthly planning sessions
- Investor updates
- Strategic decision making
- Resource allocation

### 4. improve-codebase
**Purpose**: Interactive codebase improvement with question-raising

```bash
# Start interactive improvement session
ccs run improve-codebase

# Focus on specific areas
ccs run improve-codebase --focus authentication,performance
```

**What it does:**
- Analyzes codebase structure and complexity
- Identifies improvement opportunities
- Asks clarifying questions
- Provides specific suggestions
- Creates prioritized action plans

**Interactive Questions:**
- Business priorities
- Critical components
- Architectural constraints
- Known issues vs new discoveries

**Best for:**
- Code quality improvement
- Refactoring sessions
- Technical debt reduction
- Architecture reviews

### 5. ccsdev
**Purpose**: Advanced development environment with multi-terminal support

```bash
# Start interactive development environment
ccs run ccsdev

# Or directly with npm
npm run ccsdev
```

**Interactive Commands:**
```
ccsdev> spawn dev        # Dev server + monitoring
ccsdev> spawn monitoring # Performance dashboards
ccsdev> spawn voice      # Voice analysis environment
ccsdev> sql show-tables  # SQL toolkit
ccsdev> curl /api/health # Test endpoints
ccsdev> logs dev-server  # Show specific logs
```

**Features:**
- Real-time log streaming to SQLite
- Performance monitoring
- Automated endpoint testing
- SQL query toolkit
- Multi-terminal coordination

**Best for:**
- Development with monitoring
- Performance optimization
- Real-time debugging
- System health tracking

## Operation Patterns

### Sequential Operations
Some operations are defined as sequences:

```javascript
// Example: reinforce-patterns
{
  sequence: [
    { tool: 'pattern-analyzer', params: { threshold: 0.8 } },
    { tool: 'learning-engine', params: { action: 'reinforce' } },
    { tool: 'claude-launcher', params: { mode: 'reinforce' } }
  ]
}
```

### Enhanced Operations
Most operations use enhanced classes for complex logic:

```javascript
// Enhanced operations have full control
class VoiceAnalysisOperation {
  async execute(params) {
    // Complex multi-step analysis
    // Always ends with launching Claude
  }
}
```

## Creating Custom Operations

### Simple Sequential Operation

```javascript
// In .ccs/operations/my-operation.js
module.exports = {
  name: 'my-analysis',
  description: 'Custom analysis operation',
  sequence: [
    {
      tool: 'log-collector',
      params: { sources: ['custom.log'] }
    },
    {
      tool: 'analyzer',
      params: { mode: 'custom' }
    },
    {
      tool: 'claude-launcher',
      params: { prompt: 'Analyze custom data' }
    }
  ]
};
```

### Enhanced Operation Class

```javascript
// In .ccs/operations/my-enhanced-op.js
const ClaudeLauncher = require('ccs/lib/claude-launcher');

class MyEnhancedOperation {
  constructor(projectPath, config) {
    this.projectPath = projectPath;
    this.config = config;
    this.launcher = new ClaudeLauncher();
  }
  
  async execute(params) {
    // 1. Gather data
    const data = await this.gatherData();
    
    // 2. Analyze
    const analysis = await this.analyze(data);
    
    // 3. Build prompt
    const prompt = this.buildPrompt(analysis);
    
    // 4. CRITICAL: Always launch Claude
    await this.launcher.launch(prompt, {
      operation: 'my-enhanced-op',
      questions: ['What specific aspect should I focus on?'],
      capabilities: ['Read any file', 'Suggest improvements']
    });
    
    return { success: true, launched: true };
  }
}

module.exports = MyEnhancedOperation;
```

### Registering Custom Operations

```javascript
// In .ccs/register-custom.js
module.exports = function(registry) {
  registry.register('my-enhanced-op', {
    name: 'my-enhanced-op',
    description: 'My custom enhanced operation',
    enhanced: true,
    operationClass: require('./operations/my-enhanced-op'),
    category: 'custom',
    tags: ['custom', 'analysis']
  });
};
```

## Best Practices

### 1. Always Launch Claude
**Critical Rule**: Every operation must end with launching Claude.

```javascript
// ✅ Good
await launcher.launch(prompt, options);

// ❌ Bad  
console.log(analysis);
return results;
```

### 2. Build Rich Context
Include as much relevant context as possible:

```javascript
const context = {
  timestamp: new Date().toISOString(),
  projectInfo: await this.getProjectInfo(),
  data: await this.gatherData(),
  analysis: await this.analyze(),
  metrics: await this.getMetrics()
};
```

### 3. Enable Interaction
Use questions and capabilities for better dialogue:

```javascript
await launcher.launch(prompt, {
  questions: [
    'What are your main concerns?',
    'Should I focus on performance or features?'
  ],
  capabilities: [
    'Read and analyze code',
    'Suggest improvements',
    'Run tests'
  ]
});
```

### 4. Track Operations
Use SQLite to track operation success:

```javascript
await pipeline.trackOperation(
  'my-operation',
  duration,
  success,
  { custom: 'metadata' }
);
```

### 5. Handle Errors Gracefully
Always clean up resources:

```javascript
try {
  // Operation logic
} finally {
  if (this.pipeline) {
    await this.pipeline.shutdown();
  }
}
```

## Advanced Usage

### Chaining Operations

```bash
# Run analysis, then improve based on findings
ccs run claude-analysis && ccs run improve-codebase

# Or use the learning system
ccs learn --from-last-operation
```

### Custom Spawn Environments

```javascript
// In ccsdev
spawn custom --windows 4 --layout grid
```

### SQL Toolkit Commands

```bash
# In ccsdev interactive mode
sql show-tables
sql streaming-logs 20
sql nuclear-timing
sql performance-trends 48
sql compression-stats
```

### Performance Monitoring

```bash
# Real-time performance metrics
ccs metrics --live

# Historical analysis
ccs metrics --period 7d --export
```

## Troubleshooting Operations

### Operation Not Found

```bash
# List all available operations
ccs list

# Check operation details
ccs info <operation-name>
```

### Operation Timeout

```bash
# Increase timeout for long operations
CCS_TIMEOUT=600000 ccs run business-planning
```

### Debug Mode

```bash
# Run with full debug output
CCS_DEBUG=true ccs run voice-analysis
```

## Next Steps

1. **Master the Core 5**: Get comfortable with all core operations
2. **Create Custom Ops**: Build operations specific to your workflow
3. **Share Patterns**: Export successful patterns for team use
4. **Optimize Context**: Fine-tune what context each operation gathers

Remember: The power of CCS comes from consistent use. Every operation makes the system smarter about your project.