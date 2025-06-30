# ccs

Turn any CLAUDE.md into a smart CLI that never loses context - unified tool operations with reliable Claude integration. **Enhanced development workflows that preserve your existing scripts while adding powerful coordination capabilities.**

## 🚀 Quick Start

```bash
# Install globally (coming soon)
npm install -g ccs

# Setup your project (preserves existing npm scripts)
cd your-project
ccs setup

# Your existing workflows (unchanged)
npm run claude             # Your sophisticated log analysis
npm run voice              # Your Miltonian voice analysis  
npm run biz                # Your business planning
npm run dev                # Your development workflow

# Enhanced workflows (new capabilities)
npm run ccs:claude    # Enhanced Claude with context + TODO editing
npm run ccs:voice     # Enhanced voice with pattern detection
npm run ccs:dev       # Enhanced dev with real-time context building
npm run ccs:health    # Nuclear + performance monitoring
```

## 🎯 What It Solves

**The Problem**: Complex projects need sophisticated development workflows but Claude integration is fragmented. Context gets lost between operations. You spend time rebuilding context instead of getting insights.

**The Solution**: **Preserve your existing sophisticated scripts** while adding enhanced versions with unified context management, file tracking, TODO editing capabilities, and **recursive self-improvement** that learns from your feedback to optimize operations autonomously.

## 🏗️ Complete Project Setup (Preserves Existing Scripts)

**One command enhances everything**:

```bash
ccs setup
```

**Creates (without overwriting existing):**
- 📁 **Enhanced folder structure** (`logs/dev/`, `logs/analysis/`, `scripts/`, `.ccs/`)
- ⚙️ **Enhanced npm scripts** (`ccs:claude`, `ccs:voice`, `ccs:biz`, `ccs:dev`)
- 📄 **Configuration files** (`.ccs-config.json`, enhanced `CLAUDE.md`)
- 🧠 **Context database** (unified file tracking, TODO management)
- 🔧 **Coordination system** (multi-Claude instance management)

**Result**: Keep your existing workflows + get enhanced versions with context building, file tracking, and TODO editing.

### The Enhanced Pattern

```bash
# Your existing workflow (preserved)
npm run dev → npm run claude → npm run voice → npm run biz

# Enhanced workflow (new capabilities)
npm run ccs:dev → npm run ccs:claude → npm run ccs:todos
│                      │                        └─ Interactive TODO editing
│                      └─ Enhanced context + file tracking  
└─ Real-time context building

# Self-improvement workflow (recursive learning)
npm run ccs:feedback → npm run ccs:learn → npm run ccs:bootstrap
│                          │                        └─ Autonomous code improvement
│                          └─ Optimize operations based on patterns
└─ Collect user ratings and CI feedback

# Coordination workflow (future)
npm run ccs:coordinate "optimize nuclear approach"
├─ Claude 1: Write tests
├─ Claude 2: Monitor performance  
├─ Claude 3: Analyze results
└─ Claude 4: Synthesize findings
```

## 🎯 **Key Learnings: Existing vs Enhanced**

### **Your Existing Scripts (95%+ Feature Parity Achieved)**

| Your Script | What It Does (Preserved) | Enhanced Version | New Capabilities |
|-------------|-------------------------|------------------|------------------|
| `npm run claude` | Sophisticated log analysis with TODO modes, doc structure mapping, nuclear monitoring | `npm run ccs:claude` | ✅ **File tracking**, ✅ **TODO editing**, ✅ **Enhanced context** |
| `npm run voice` | Miltonian voice analysis with Supabase integration, transcript processing | `npm run ccs:voice` | ✅ **Pattern effectiveness scoring**, ✅ **Enhanced error handling** |
| `npm run biz` | Business planning with document loading, recursive self-improvement | `npm run ccs:biz` | ✅ **Learning integration**, ✅ **Context awareness** |
| `npm run dev` | Fresh log guarantee, schema dumping, parallel monitoring | `npm run ccs:dev` | ✅ **Real-time context building**, ✅ **Performance tracking** |

### **What We Learned Building This**

**✅ Your existing scripts are incredibly sophisticated:**
- Complex TODO mode systems with 10+ focus areas
- Robust terminal integration with osascript spawning  
- Sophisticated Miltonian pattern recognition
- Advanced nuclear approach monitoring with sub-3s timing
- Business planning with recursive self-improvement

**✅ Enhancement approach that works:**
- **Preserve everything** - never overwrite existing scripts
- **Add enhanced versions** with `ccs:` prefix
- **Build on existing patterns** rather than replace them
- **Maintain feature parity** before adding enhancements

## 🏗️ Core Architecture

```
Your Project/
├── CLAUDE.md                    # Single source of truth
├── .claude-config.json          # Configuration
├── .claude-context/             # Context database
│   ├── results/                 # Operation history
│   └── sessions/                # Claude session data
└── logs/                        # Output files
```

## 📚 Context Database

**No more hunting for logs and docs**. The engine automatically discovers and indexes:

- **Log Files**: `logs/**/*.log`, vercel logs, custom patterns
- **Documentation**: `docs/`, `README.md`, business plans
- **Configuration**: `package.json`, environment configs
- **Recent Activity**: Git changes, API responses, previous results

## ⚙️ Tool Operations

Define operation sequences in CLAUDE.md:

```markdown
## Operations

### monitor
Description: System monitoring with log analysis and health checks
Tools: log-collector, api-tester, pattern-analyzer, claude-analyzer

### analyze-logs  
Description: Comprehensive log analysis with pattern recognition
Tools: log-collector, error-clusterer, performance-analyzer, claude-analyzer

### plan
Description: Business planning with context analysis and strategic insights
Tools: document-loader, context-analyzer, claude-planner
```

## 🖥️ Robust Terminal Integration

**Solves the "wrong terminal" problem**:

- Multiple launch strategies (direct, heredoc, temp file)
- Session recovery and retry logic
- Proper error handling that doesn't break Claude
- Isolated session contexts

## 📦 Built-in Operations

### System Monitoring (`monitor`)
```bash
claude-context run monitor
```
- Collects logs from multiple sources
- Tests API endpoints with curl
- Analyzes error patterns and performance
- Generates Claude-powered insights

### Business Planning (`plan`)
```bash
claude-context run plan
```
- Loads business documents and strategies
- Analyzes market context and opportunities  
- Generates strategic recommendations
- Creates actionable TODO lists

### Log Analysis (`analyze-logs`)
```bash
claude-context run analyze-logs
```
- Pattern recognition across log sources
- Error clustering and root cause analysis
- Performance bottleneck identification
- User journey tracking

## 🔧 Configuration

### Project Setup
```bash
claude-context init
```

Creates `.claude-config.json`:
```json
{
  "project": {
    "name": "your-project",
    "type": "nextjs"
  },
  "context": {
    "logPaths": ["logs/**/*.log", "*.log"],
    "documentationPaths": ["docs", "README.md"],
    "cacheTimeout": 300000
  },
  "terminal": {
    "strategy": "persistent-session",
    "timeout": 60000
  }
}
```

### Input Configuration

Define where your data lives:

```json
{
  "context": {
    "logPaths": [
      "logs/dev-server-*.log",
      "logs/vercel-*.log", 
      "/var/log/app/*.log"
    ],
    "documentationPaths": [
      "docs/",
      "business-plans/",
      "README.md",
      "CLAUDE.md"
    ],
    "apiEndpoints": [
      "http://localhost:3000/api/health",
      "https://your-app.com/api/status"
    ]
  }
}
```

## 🛠️ API Usage

### Programmatic Usage
```javascript
const ClaudeContextEngine = require('claude-context-engine');

const engine = new ClaudeContextEngine('/path/to/project', {
  context: { cacheTimeout: 300000 },
  terminal: { timeout: 60000 }
});

await engine.initialize();

// Run built-in operation
const result = await engine.run('monitor');

// Register custom operation
engine.registerOperation('custom-analysis', {
  description: 'Custom log analysis',
  sequence: [
    { tool: 'log-collector', params: { sources: ['custom-logs/*.log'] } },
    { tool: 'claude-analyzer', params: { template: 'custom-template' } }
  ],
  outputs: ['reports/custom-analysis-{timestamp}.md']
});

const customResult = await engine.run('custom-analysis');
```

### Custom Tools
```javascript
class CustomTool {
  async execute(params, context) {
    // Your tool logic here
    return { result: 'Custom analysis complete' };
  }
}

engine.registerTool('custom-tool', CustomTool);
```

## 📋 CLI Commands

```bash
# Setup and initialization
ccs setup             # Complete project setup with npm scripts
ccs init               # Quick initialization
ccs status             # System status and health

# Context operations  
ccs run monitor        # System monitoring with Claude
ccs run analyze-logs   # Comprehensive log analysis
ccs run plan          # Business planning session

# Interactive mode
ccs run --interactive  # Choose operation interactively
ccs validate --fix     # Validate and fix setup

# Generated npm scripts (after setup)
npm run ccs dev        # Development with auto-logging
npm run ccs            # Interactive context mode
npm run claude              # Full analysis with Claude

# Show configuration
claude-context config --show

# System status
claude-context status
```

## 🔍 Local Development

To run the engine locally in your own project:

1. **Install dependencies**:
```bash
cd claude-context-engine
npm install
```

2. **Link for local development**:
```bash
npm link
cd /path/to/your/project
npm link claude-context-engine
```

3. **Initialize your project**:
```bash
claude-context init
```

4. **Configure log and doc locations** in `.claude-config.json`:
```json
{
  "context": {
    "logPaths": ["logs/dev-server-*.log", "logs/nuclear-*.log"],
    "documentationPaths": ["docs/", "PRODUCT_TRACKER.md", "CLAUDE.md"],
    "apiEndpoints": ["http://localhost:3000/api/health"]
  }
}
```

5. **Run operations**:
```bash
claude-context run monitor  # System monitoring
claude-context run plan     # Business planning  
claude-context list         # Show all operations
```

## 🎛️ Input Configuration Examples

### For Next.js Projects
```json
{
  "context": {
    "logPaths": [
      "logs/dev-server-*.log",
      ".next/trace",
      "vercel-logs/*.log"
    ],
    "documentationPaths": [
      "docs/",
      "README.md", 
      "CHANGELOG.md"
    ],
    "apiEndpoints": [
      "http://localhost:3000/api/health",
      "http://localhost:3000/api/trigger-eligible-emails"
    ]
  }
}
```

### For Business Analysis
```json
{
  "context": {
    "documentationPaths": [
      "business-plans/",
      "docs/strategy/",
      "investor-materials/",
      "market-research/"
    ],
    "logPaths": [
      "analytics-logs/*.csv",
      "user-activity/*.log"
    ]
  }
}
```

### For Multi-Environment Monitoring
```json
{
  "environments": {
    "local": {
      "logPaths": ["logs/dev-*.log"],
      "apiEndpoints": ["http://localhost:3000"]
    },
    "production": {
      "logPaths": ["production-logs/*.log"],
      "apiEndpoints": ["https://api.yourapp.com"]
    }
  }
}
```

## 🧠 Claude Integration

The engine handles Claude CLI integration robustly:

- **Auto-detection**: Finds Claude CLI installation
- **Session Management**: Isolated contexts prevent interference
- **Error Recovery**: Multiple launch strategies with fallbacks
- **Output Processing**: Structured result parsing and storage

## 🔧 Extending the Engine

### Custom Operations
Add to your CLAUDE.md:
```markdown
### nuclear-monitor
Description: Monitor nuclear approach performance  
Tools: log-collector, performance-analyzer, claude-analyzer

### user-journey
Description: Analyze user behavior patterns
Tools: log-collector, pattern-analyzer, user-flow-analyzer, claude-analyzer
```

### Custom Templates
Create Handlebars templates in `templates/`:
```handlebars
<!-- templates/nuclear-analysis.hbs -->
You are analyzing nuclear approach performance.

## Context
- Project: {{project.name}}
- Time Range: {{timeRange}}

## Logs
{{#each logs}}
### {{@key}}
{{content}}
{{/each}}

Analyze nuclear trigger timing and success rates.
```

## 📊 Output Examples

### System Monitoring Report
```markdown
# System Monitoring Report

Generated: 2024-06-24T02:30:00Z
Operation: monitor
Duration: 15.2s

## Critical Issues
- High error rate detected: 15 errors in last hour
- API response time degraded: avg 2.3s (target <1s)

## Performance Insights  
- Database queries slow: 3 queries >5s
- Memory usage trending up: 85% utilization

## Action Items
1. Investigate database connection pool (Priority: High)
2. Review error logs from 14:00-15:00 (Priority: Medium)
3. Scale server resources (Priority: Low)

## System Health Score: 72/100
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues**: https://github.com/thetadrivencoach/claude-context-engine/issues
- **Documentation**: Full docs at project repository
- **Examples**: See `examples/` directory

## 🚀 Local Development & Testing

### Using in Your ThetaDriven Coach Project

1. **Run the setup from your main project**:
```bash
cd /path/to/your/project
node /path/to/ccs/bin/ccs.js setup
```

2. **Follow the interactive setup**:
   - Select "Full ThetaDriven Style" 
   - Configure log patterns: `logs/**/*.log,logs/dev-server-*.log,logs/vercel-*.log`
   - Configure API endpoints: `http://localhost:3000/api/health,http://localhost:3000/api/trigger-eligible-emails`

3. **Test the generated scripts**:
```bash
npm run ccs           # Interactive mode
npm run dev:logs          # Development with logging
npm run claude            # Full log analysis
npm run status            # System status
```

### Package Development

```bash
# Install dependencies
cd ccs && npm install

# Test CLI locally
node bin/ccs.js --help
node bin/ccs.js setup

# Run examples
npm run example

# Lint and test before publishing
npm run lint
npm test
```

## 📦 Publishing & Versioning

### Version History
- **v1.0.0-beta.1**: Initial release with complete setup wizard
- **v1.0.0** (coming soon): Stable release

### Release Process
```bash
# Update version
npm version patch  # or minor/major

# Publish to npm
npm publish

# Tag release
git tag v1.0.0
git push origin --tags
```

### Installation Instructions

Once published to npm:
```bash
# Global installation
npm install -g ccs

# Project-specific installation  
npm install --save-dev ccs
```

## 🔧 Feature Parity Checklist

### ✅ Core Features Implemented
- [x] **Unified context database** - no more hunting for logs
- [x] **Robust Claude integration** - multiple launch strategies
- [x] **Complete setup wizard** - ThetaDriven Coach style
- [x] **npm scripts generation** - `dev:logs`, `claude`, `biz`, `voice`
- [x] **Folder structure creation** - logs, analysis, learnings
- [x] **Shell script generation** - log collection, monitoring
- [x] **Configuration management** - `.ccs-config.json`

### ✅ ThetaDriven Coach Replication
- [x] **Auto log collection** - dev and production logs on disk
- [x] **Claude analysis workflows** - `npm run claude` style
- [x] **Business planning** - `npm run biz` equivalent
- [x] **Voice analysis** - `npm run voice` equivalent  
- [x] **Nuclear monitoring** - performance tracking
- [x] **Interactive setup** - step-by-step wizard

### 🎯 Usage in Your Project

After running `ccs setup`, you get:

```bash
# Development with auto-logging (replaces npm run dev)
npm run dev:logs

# Claude analysis (replaces npm run claude)  
npm run claude

# Business planning (replaces npm run biz)
npm run biz

# Voice analysis (replaces npm run voice)
npm run voice

# System monitoring
npm run ccs
npm run status
npm run validate
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/thetadrivencoach/ccs/issues)
- **Documentation**: This README + generated CLAUDE.md files
- **Examples**: See `examples/` directory

---

**Turn any CLAUDE.md into a smart CLI that never loses context.**

*Complete ThetaDriven Coach style setup with one command: `ccs setup`*