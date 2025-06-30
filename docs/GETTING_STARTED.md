# Getting Started with CCS

Welcome to CCS - a sophisticated context management system that enhances Claude CLI with project-aware intelligence and learning capabilities.

## What is CCS?

CCS is for developers who "get it" - those who understand that AI assistants work best when they have deep, evolving context about your project. It's not just another CLI tool; it's a learning system that improves with use.

## Quick Start (5 minutes)

### 1. Install CCS

```bash
# Install globally
npm install -g @thetadriven/ccs

# Or use locally in a project
npm install --save-dev @thetadriven/ccs
```

### 2. Initialize Your Project

```bash
# In your project directory
ccs init

# This creates:
# - .ccs/ directory for configuration and state
# - .ccs/data/ for SQLite databases
# - Initial configuration files
```

### 3. Run Your First Analysis

```bash
# Launch Claude with full project context
ccs run claude-analysis

# This will:
# 1. Analyze your project structure
# 2. Collect logs and documentation
# 3. Build comprehensive context
# 4. Launch Claude CLI with everything ready
```

## Core Concepts

### 1. **Always Launch Claude**
CCS's #1 rule: Operations must ALWAYS launch Claude CLI in the same terminal. We never just show analysis results - we launch Claude ready to help.

```bash
# ✅ Good - launches Claude
ccs run voice-analysis

# ❌ Bad - just showing results without Claude
some-tool --analyze-only
```

### 2. **Context-Aware Operations**
Every operation builds rich context before launching Claude:

- **claude-analysis**: System monitoring with logs, TODOs, and health metrics
- **voice-analysis**: Miltonian pattern analysis for voice systems
- **business-planning**: Strategic planning with real metrics
- **improve-codebase**: Interactive improvement with questions
- **ccsdev**: Multi-terminal development environment

### 3. **Learning & Reinforcement**
CCS learns from your usage patterns:

```bash
# The system tracks what works
ccs learn         # Capture successful patterns
ccs reinforce     # Strengthen what works
```

### 4. **SQLite-Powered Intelligence**
All data flows through SQLite for instant querying:

```bash
# Query your project data
ccs query "SELECT * FROM logs WHERE level='ERROR' LIMIT 10"

# View insights
ccs insights

# Check performance
ccs metrics
```

## Interactive Development

### Multi-Terminal Environments

```bash
# Spawn a complete development environment
ccs run ccsdev

# Then in the interactive prompt:
ccsdev> spawn dev      # Dev server + monitoring
ccsdev> spawn voice    # Voice analysis setup
ccsdev> spawn monitoring # Performance dashboards
```

### Interactive Improvement

```bash
# Start an interactive improvement session
ccs run improve-codebase

# Claude will ask YOU questions like:
# - "What are your top 3 business priorities?"
# - "Which components are most critical?"
# - "Are there architectural constraints?"
```

## Common Workflows

### 1. Daily Development

```bash
# Start your day with context
ccs run claude-analysis --enhanced

# Work with specific focus
ccs run improve-codebase --focus authentication

# End with reinforcement
ccs reinforce
```

### 2. Voice System Development

```bash
# Analyze voice patterns
ccs run voice-analysis

# Test Miltonian sophistication
ccs test-miltonian "Your prompt here"
```

### 3. Business Planning

```bash
# Weekly planning session
ccs run business-planning

# Check kanban board
ccs kanban list

# Update priorities
ccs kanban move "task-id" doing
```

## Configuration

### Basic Configuration (.ccs/config.json)

```json
{
  "project": "my-project",
  "databases": ["unified", "logs", "kanban"],
  "operations": ["claude", "voice", "biz", "improve"],
  "learning": {
    "enabled": true,
    "threshold": 0.8
  }
}
```

### Environment Variables

```bash
# Optional: Set Claude preferences
export CLAUDE_CONTEXT=enhanced
export CCS_AUTO_LEARN=true
```

## Tips for Success

### 1. **Let Context Build Naturally**
Don't try to add everything at once. Use ccs regularly and let it learn your patterns.

### 2. **Ask Questions**
When using `improve-codebase`, actually answer Claude's questions. The dialogue is the value.

### 3. **Use the SQLite Pipeline**
The real power comes from querying your data:

```bash
# Find patterns
ccs query "SELECT pattern FROM insights WHERE score > 0.8"

# Track improvements
ccs metrics --trend 7d
```

### 4. **Spawn Terminal Windows**
For complex work, use the multi-terminal feature:

```bash
ccs run ccsdev
# Then: spawn monitoring
```

## Troubleshooting

### Claude CLI Not Found

```bash
# Check if Claude is installed
which claude

# If not, install it:
# Visit https://claude.ai/cli
```

### SQLite Errors

```bash
# Reset databases
ccs reset-db

# Check database health
ccs db-health
```

### Operation Failures

```bash
# Run with debug output
CCS_DEBUG=true ccs run claude-analysis

# Check logs
ccs logs
```

## Next Steps

1. **Explore Operations**: Try each operation to see what it does
2. **Build Custom Operations**: Create your own context-aware operations
3. **Join the Community**: Share patterns that work for you

Remember: CCS is about making Claude truly understand your project. Every interaction makes it smarter.

## Philosophy

We believe that AI assistants should:
- Launch immediately with full context
- Ask clarifying questions
- Learn from every interaction
- Provide actionable insights
- Feel like a team member who really gets it

Welcome to context-aware development. 🚀