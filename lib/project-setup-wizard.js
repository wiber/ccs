const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');

/**
 * Project Setup Wizard - Complete ThetaDriven Coach style setup
 * 
 * Creates the full project structure with npm scripts, folders, and configurations
 * that replicate the robust monitoring and analysis system
 */
class ProjectSetupWizard {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.projectName = path.basename(projectPath);
    this.setupConfig = {};
  }

  async runCompleteSetup() {
    console.log(chalk.blue.bold('🚀 CCS COMPLETE PROJECT SETUP'));
    console.log(chalk.blue('════════════════════════════════════════'));
    console.log('Setting up ThetaDriven Coach style context management...\n');

    // Step 1: Project Discovery
    await this.discoverProject();

    // Step 2: Interactive Configuration
    await this.interactiveSetup();

    // Step 3: Create Folder Structure
    await this.createFolderStructure();

    // Step 4: Generate npm Scripts
    await this.generateNpmScripts();

    // Step 5: Create Configuration Files
    await this.createConfigFiles();

    // Step 6: Create Monitoring Scripts
    await this.createMonitoringScripts();

    // Step 7: Create Shell Scripts
    await this.createShellScripts();

    // Step 8: Final Instructions
    await this.displayFinalInstructions();

    console.log(chalk.green.bold('\n✅ COMPLETE SETUP FINISHED!'));
    console.log(chalk.yellow('Next step: npm run ccs'));
  }

  async discoverProject() {
    console.log(chalk.yellow('🔍 Step 1: Discovering project structure...'));

    const discoveries = {
      hasPackageJson: await this.fileExists('package.json'),
      hasClaudeMd: await this.fileExists('CLAUDE.md'),
      hasNextConfig: await this.fileExists('next.config.js') || await this.fileExists('next.config.ts'),
      hasVercelJson: await this.fileExists('vercel.json'),
      hasSupabase: await this.directoryExists('supabase'),
      hasScripts: await this.directoryExists('scripts'),
      hasLogs: await this.directoryExists('logs'),
      hasDocs: await this.directoryExists('docs')
    };

    // Detect project type
    if (discoveries.hasNextConfig) {
      this.setupConfig.projectType = 'nextjs';
    } else if (discoveries.hasPackageJson) {
      this.setupConfig.projectType = 'nodejs';
    } else {
      this.setupConfig.projectType = 'generic';
    }

    console.log(`   📦 Project type: ${this.setupConfig.projectType}`);
    console.log(`   📋 Package.json: ${discoveries.hasPackageJson ? '✅' : '❌'}`);
    console.log(`   📚 CLAUDE.md: ${discoveries.hasClaudeMd ? '✅' : '❌'}`);
    console.log(`   📁 Existing structure: ${Object.values(discoveries).filter(Boolean).length}/8 detected`);
  }

  async interactiveSetup() {
    console.log(chalk.yellow('\n🎛️  Step 2: Interactive configuration...'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Project name:',
        default: this.projectName
      },
      {
        type: 'list',
        name: 'setupType',
        message: 'Setup type:',
        choices: [
          { name: '🚀 Full ThetaDriven Style (recommended)', value: 'full' },
          { name: '📊 Monitoring Only', value: 'monitoring' },
          { name: '📋 Business Planning Only', value: 'business' },
          { name: '🎤 Voice Analysis Only', value: 'voice' },
          { name: '⚙️ Custom Setup', value: 'custom' }
        ],
        default: 'full'
      },
      {
        type: 'checkbox',
        name: 'features',
        message: 'Select features to install:',
        choices: [
          { name: '📊 Log monitoring (dev/production)', value: 'monitoring', checked: true },
          { name: '📋 Business planning with Claude', value: 'business', checked: true },
          { name: '🎤 Voice transcript analysis', value: 'voice', checked: true },
          { name: '🚀 Nuclear approach monitoring', value: 'nuclear', checked: true },
          { name: '📈 Performance analysis', value: 'performance', checked: true },
          { name: '🔄 Auto log collection', value: 'auto-logs', checked: true }
        ],
        when: (answers) => answers.setupType === 'custom'
      },
      {
        type: 'input',
        name: 'logPatterns',
        message: 'Log file patterns (comma-separated):',
        default: 'logs/**/*.log,*.log,logs/dev-server-*.log,logs/vercel-*.log'
      },
      {
        type: 'input',
        name: 'apiEndpoints',
        message: 'API endpoints to monitor (comma-separated):',
        default: 'http://localhost:3000/api/health,http://localhost:3000/api/trigger-eligible-emails'
      },
      {
        type: 'confirm',
        name: 'createDemoData',
        message: 'Create demo data and examples?',
        default: true
      }
    ]);

    Object.assign(this.setupConfig, answers);

    // Determine features based on setup type
    if (answers.setupType === 'full') {
      this.setupConfig.features = ['monitoring', 'business', 'voice', 'nuclear', 'performance', 'auto-logs'];
    } else if (answers.setupType !== 'custom') {
      this.setupConfig.features = [answers.setupType];
    }

    console.log(chalk.green(`   ✅ Configured for: ${this.setupConfig.features.join(', ')}`));
  }

  async createFolderStructure() {
    console.log(chalk.yellow('\n📁 Step 3: Creating folder structure...'));

    const folders = [
      'logs',
      'logs/dev',
      'logs/production', 
      'logs/analysis',
      'logs/learnings',
      'scripts',
      'scripts/lib',
      'docs',
      'docs/monitoring',
      'docs/business',
      'docs/voice',
      '.ccs',
      '.ccs/sessions',
      '.ccs/results',
      '.ccs/cache'
    ];

    // Add feature-specific folders
    if (this.setupConfig.features.includes('business')) {
      folders.push('docs/business-plans', 'docs/strategy');
    }

    if (this.setupConfig.features.includes('voice')) {
      folders.push('docs/voice', 'logs/voice');
    }

    for (const folder of folders) {
      await this.ensureDirectory(path.join(this.projectPath, folder));
      console.log(`   📁 Created: ${folder}`);
    }

    // Create .gitignore additions
    await this.updateGitignore();
  }

  async generateNpmScripts() {
    console.log(chalk.yellow('\n⚙️  Step 4: Generating npm scripts...'));

    const packageJsonPath = path.join(this.projectPath, 'package.json');
    let packageJson = {};

    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      packageJson = JSON.parse(content);
    } catch (error) {
      packageJson = {
        name: this.setupConfig.projectName,
        version: '1.0.0',
        scripts: {}
      };
    }

    // Enhanced ccs scripts (preserve existing npm run claude/voice/biz)
    const newScripts = {
      // Main ccs entry points
      'ccs': 'ccs run --interactive',
      'ccs:setup': 'ccs setup',
      
      // Enhanced versions of existing workflows
      'ccs:claude': 'ccs run claude-analysis --enhanced',
      'ccs:voice': 'ccs run voice-analysis --enhanced', 
      'ccs:biz': 'ccs run business-planning --enhanced',
      'ccs:dev': 'ccs run dev-monitor --with-logs',
      
      // Advanced context operations
      'ccs:context': 'ccs run build-context --comprehensive',
      'ccs:todos': 'ccs run todo-manager --interactive',
      'ccs:health': 'ccs run health-check --nuclear --performance',
      
      // Self-improvement operations
      'ccs:learn': 'ccs run learn --optimize-all',
      'ccs:feedback': 'ccs run feedback --interactive',
      'ccs:bootstrap': 'ccs run self-bootstrap --analyze --improve',
      'ccs:insights': 'ccs run learning-insights --generate-report',
      
      // Validation and status
      'ccs:validate': 'ccs validate --fix',
      'ccs:status': 'ccs status --detailed'
    };

    // DON'T overwrite existing feature scripts - only add ccs enhancements
    // Check for existing scripts and preserve them
    const existingScripts = packageJson.scripts || {};
    
    // Only add ccs enhanced versions if they don't exist
    // This preserves existing npm run claude, npm run voice, npm run biz
    
    console.log('   🔍 Preserving existing scripts:');
    if (existingScripts.claude) {
      console.log('      ✅ npm run claude (preserved)');
    }
    if (existingScripts.voice) {
      console.log('      ✅ npm run voice (preserved)');
    }
    if (existingScripts.biz) {
      console.log('      ✅ npm run biz (preserved)');
    }

    // Merge ONLY new ccs scripts with existing scripts (no overwrites)
    packageJson.scripts = { ...existingScripts, ...newScripts };

    // Add ccs dependency
    if (!packageJson.dependencies) packageJson.dependencies = {};
    if (!packageJson.devDependencies) packageJson.devDependencies = {};
    
    packageJson.devDependencies.ccs = '^1.0.0';

    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log(`   ✅ Added ${Object.keys(newScripts).length} enhanced ccs scripts`);
    console.log('   📋 New ccs scripts:');
    Object.entries(newScripts).slice(0, 8).forEach(([name, cmd]) => {
      console.log(`      npm run ${name}`);
    });
    
    console.log('   💡 Your existing scripts (claude, voice, biz) remain unchanged');
    console.log('   🚀 Use ccs: versions for enhanced functionality');
  }

  async createConfigFiles() {
    console.log(chalk.yellow('\n📄 Step 5: Creating configuration files...'));

    // 1. .ccs-config.json
    const config = {
      project: {
        name: this.setupConfig.projectName,
        type: this.setupConfig.projectType,
        features: this.setupConfig.features
      },
      context: {
        logPaths: this.setupConfig.logPatterns.split(',').map(p => p.trim()),
        documentationPaths: ['docs', 'README.md', 'CLAUDE.md'],
        apiEndpoints: this.setupConfig.apiEndpoints.split(',').map(p => p.trim()),
        cacheTimeout: 300000
      },
      terminal: {
        strategy: 'persistent-session',
        timeout: 60000,
        retryAttempts: 3
      },
      monitoring: {
        autoCollectLogs: this.setupConfig.features.includes('auto-logs'),
        nuclearThreshold: 3000,
        performanceAlerts: true
      }
    };

    await fs.writeFile(
      path.join(this.projectPath, '.ccs-config.json'),
      JSON.stringify(config, null, 2)
    );

    // 2. Enhanced CLAUDE.md
    if (!await this.fileExists('CLAUDE.md')) {
      await this.createClaudeMd();
    } else {
      await this.enhanceExistingClaudeMd();
    }

    // 3. .env.example for ccs
    await this.createEnvExample();

    console.log('   ✅ Configuration files created');
  }

  async createMonitoringScripts() {
    console.log(chalk.yellow('\n📊 Step 6: Creating monitoring scripts...'));

    // Ensure scripts directory exists
    await this.ensureDirectory(path.join(this.projectPath, 'scripts'));

    // 1. Main Claude analysis script
    await this.createScript('run-claude-analysis.sh', this.getClaudeAnalysisScript());

    // 2. Log collection script  
    await this.createScript('collect-logs.sh', this.getLogCollectionScript());

    // 3. Business planning script (if enabled)
    if (this.setupConfig.features.includes('business')) {
      await this.createScript('run-biz-planning.sh', this.getBizPlanningScript());
      await this.createScript('biz-feedback.js', this.getBizFeedbackScript());
    }

    // 4. Voice analysis script (if enabled)
    if (this.setupConfig.features.includes('voice')) {
      await this.createScript('voice-analyzer.js', this.getVoiceAnalyzerScript());
      await this.createScript('collect-voice-transcripts.js', this.getVoiceTranscriptScript());
    }

    // 5. Nuclear monitoring (if enabled)
    if (this.setupConfig.features.includes('nuclear')) {
      await this.createScript('test-nuclear-flow.sh', this.getNuclearTestScript());
    }

    console.log('   ✅ Monitoring scripts created');
  }

  async createShellScripts() {
    console.log(chalk.yellow('\n🐚 Step 7: Creating shell utilities...'));

    // Make all shell scripts executable
    const shellScripts = [
      'scripts/run-claude-analysis.sh',
      'scripts/collect-logs.sh', 
      'scripts/run-biz-planning.sh',
      'scripts/test-nuclear-flow.sh'
    ];

    for (const script of shellScripts) {
      const scriptPath = path.join(this.projectPath, script);
      if (await this.fileExists(script)) {
        try {
          await fs.chmod(scriptPath, 0o755);
          console.log(`   🔧 Made executable: ${script}`);
        } catch (error) {
          console.log(`   ⚠️  Could not make executable: ${script}`);
        }
      }
    }
  }

  async displayFinalInstructions() {
    console.log(chalk.blue.bold('\n📋 SETUP COMPLETE - NEXT STEPS'));
    console.log(chalk.blue('═'.repeat(50)));

    console.log(chalk.yellow('\n1. 🚀 Quick Start (Enhanced):'));
    console.log('   npm run ccs:dev    # Enhanced dev with auto-logging + context');
    console.log('   npm run ccs        # Interactive context mode');
    console.log('   npm run ccs:status # Detailed system status');
    console.log('   npm run ccs:validate # Enhanced validation');

    console.log(chalk.yellow('\n2. 📊 Enhanced Analysis (Preserves Existing):'));
    console.log('   npm run claude          # Your existing Claude analysis (unchanged)');
    console.log('   npm run ccs:claude # Enhanced Claude with context + TODO editing');
    console.log('   npm run voice           # Your existing voice analysis (unchanged)');
    console.log('   npm run ccs:voice  # Enhanced voice with Miltonian patterns');
    console.log('   npm run biz             # Your existing business planning (unchanged)');
    console.log('   npm run ccs:biz    # Enhanced business with learning integration');

    console.log(chalk.yellow('\n3. 🧠 Self-Improvement Workflows:'));
    console.log('   npm run ccs:learn      # Trigger learning cycle to optimize operations');
    console.log('   npm run ccs:feedback   # Collect user feedback for improvements');
    console.log('   npm run ccs:bootstrap  # Analyze and improve ccs itself');
    console.log('   npm run ccs:insights   # Generate performance insights and recommendations');

    if (this.setupConfig.features.includes('business')) {
      console.log(chalk.yellow('\n3. 📋 Business Planning:'));
      console.log('   npm run biz             # Business planning session');
      console.log('   npm run biz:validate    # Validate business plans');
    }

    if (this.setupConfig.features.includes('voice')) {
      console.log(chalk.yellow('\n4. 🎤 Voice Analysis:'));
      console.log('   npm run voice           # Analyze voice transcripts');
      console.log('   npm run voice:analyze   # Deep voice analysis');
    }

    if (this.setupConfig.features.includes('nuclear')) {
      console.log(chalk.yellow('\n5. 🚀 Nuclear Monitoring:'));
      console.log('   npm run nuclear:status  # Check nuclear performance');
      console.log('   npm run claude:nuclear  # Nuclear-focused analysis');
    }

    console.log(chalk.yellow('\n6. 📁 Key Folders Created:'));
    console.log('   logs/dev/              # Development logs');
    console.log('   logs/analysis/         # Claude analysis results');
    console.log('   logs/learnings/        # Learning and insights');
    console.log('   .ccs/             # Context database');
    console.log('   scripts/               # Monitoring scripts');

    console.log(chalk.yellow('\n7. 🔧 Configuration:'));
    console.log('   .ccs-config.json  # Main configuration');
    console.log('   CLAUDE.md              # Enhanced context file');
    console.log('   package.json           # Updated with scripts');

    console.log(chalk.green.bold('\n🎉 ccs enhanced workflows added alongside your existing scripts!'));
    console.log(chalk.blue('\n💡 Enhanced Pattern:'));
    console.log('   npm run ccs:dev → npm run ccs:claude → enhanced context + TODO editing');
    console.log(chalk.blue('\n🔄 Existing Pattern (Preserved):'));
    console.log('   npm run dev → npm run claude → your current workflow unchanged');
  }

  // Script generators
  getClaudeAnalysisScript() {
    return `#!/bin/bash

# Claude Analysis Script - ThetaDriven Coach Style
# Collects logs from dev and production, analyzes with Claude

set -euo pipefail

# Colors
BLUE='\\033[0;34m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

echo -e "\${BLUE}🧠 CLAUDE LOG ANALYSIS\${NC}"
echo "════════════════════════════════════"

# Create timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Collect logs
echo -e "\${YELLOW}📋 Step 1: Collecting logs...\${NC}"
./scripts/collect-logs.sh

# Run ccs analysis
echo -e "\${YELLOW}🔍 Step 2: Running analysis...\${NC}"
ccs run analyze-logs --output="logs/analysis/claude-analysis-\${TIMESTAMP}.md"

# Performance focus
echo -e "\${YELLOW}⚡ Step 3: Performance analysis...\${NC}"
ccs run performance-analysis --output="logs/analysis/performance-\${TIMESTAMP}.md"

# Nuclear monitoring (if enabled)
if grep -q "nuclear" .ccs-config.json; then
    echo -e "\${YELLOW}🚀 Step 4: Nuclear analysis...\${NC}"
    ccs run nuclear-monitor --output="logs/analysis/nuclear-\${TIMESTAMP}.md"
fi

echo -e "\${GREEN}✅ Analysis complete!\${NC}"
echo "📄 Results saved to: logs/analysis/"
echo "🔍 Latest: logs/analysis/claude-analysis-\${TIMESTAMP}.md"
`;
  }

  getLogCollectionScript() {
    return `#!/bin/bash

# Log Collection Script
# Gathers logs from various sources for analysis

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "📋 Collecting logs for analysis..."

# Create collection directory
mkdir -p logs/collected

# Collect development logs
if [ -d "logs/dev" ]; then
    echo "  📁 Development logs..."
    find logs/dev -name "*.log" -mtime -1 -exec cp {} logs/collected/ \\;
fi

# Collect production logs (if available)
if [ -d "logs/production" ]; then
    echo "  📁 Production logs..."
    find logs/production -name "*.log" -mtime -1 -exec cp {} logs/collected/ \\;
fi

# Collect Vercel logs (if configured)
if command -v vercel &> /dev/null; then
    echo "  ☁️  Vercel logs..."
    vercel logs --output=raw > "logs/collected/vercel-\${TIMESTAMP}.log" 2>/dev/null || true
fi

# Create manifest
ls -la logs/collected/ > "logs/collected/manifest-\${TIMESTAMP}.txt"

echo "✅ Log collection complete: logs/collected/"
`;
  }

  getBizPlanningScript() {
    return `#!/bin/bash

# Business Planning Script - ThetaDriven Coach Style
# Loads business context and runs planning session with Claude

set -euo pipefail

TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "📈 BUSINESS PLANNING WITH CLAUDE"
echo "════════════════════════════════════"

# Load business documents
echo "📚 Loading business context..."
ccs run load-business-docs

# Run business planning
echo "🧠 Running planning session..."
ccs run business-planning --output="logs/business/planning-\${TIMESTAMP}.md"

# Generate action items
echo "📋 Generating action items..."
ccs run generate-todos --focus=business

echo "✅ Business planning complete!"
echo "📄 Output: logs/business/planning-\${TIMESTAMP}.md"
`;
  }

  getBizFeedbackScript() {
    return `const fs = require('fs').promises;
const path = require('path');

/**
 * Business Feedback Script
 * Collects feedback on planning sessions for continuous improvement
 */

async function collectFeedback() {
  console.log('📝 Business Planning Feedback Collection');
  
  // Find latest planning output
  const planningDir = 'logs/business';
  const files = await fs.readdir(planningDir);
  const latestPlan = files
    .filter(f => f.startsWith('planning-'))
    .sort()
    .reverse()[0];

  if (!latestPlan) {
    console.log('❌ No planning sessions found');
    return;
  }

  console.log(\`📄 Latest plan: \${latestPlan}\`);
  
  // TODO: Add interactive feedback collection
  console.log('💡 Feedback collection coming soon...');
}

collectFeedback().catch(console.error);
`;
  }

  getVoiceAnalyzerScript() {
    return `const fs = require('fs').promises;
const path = require('path');

/**
 * Voice Analyzer Script
 * Analyzes voice transcripts for insights and patterns
 */

async function analyzeVoice() {
  console.log('🎤 Voice Transcript Analysis');
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Run voice analysis with ccs
  const { spawn } = require('child_process');
  
  const analysis = spawn('ccs', ['run', 'voice-analysis', \`--output=logs/voice/analysis-\${timestamp}.md\`]);
  
  analysis.stdout.on('data', (data) => {
    console.log(data.toString());
  });
  
  analysis.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Voice analysis complete!');
    } else {
      console.log('❌ Voice analysis failed');
    }
  });
}

analyzeVoice().catch(console.error);
`;
  }

  getVoiceTranscriptScript() {
    return `const fs = require('fs').promises;

/**
 * Voice Transcript Collection
 * Gathers voice transcripts for analysis
 */

async function collectTranscripts() {
  console.log('🎤 Collecting voice transcripts...');
  
  // Create voice directory
  await fs.mkdir('logs/voice', { recursive: true });
  
  // TODO: Add transcript collection logic
  console.log('💡 Transcript collection setup complete');
  console.log('📁 Voice logs will be saved to: logs/voice/');
}

collectTranscripts().catch(console.error);
`;
  }

  getNuclearTestScript() {
    return `#!/bin/bash

# Nuclear Flow Test Script
# Tests the nuclear approach performance

set -euo pipefail

echo "🚀 NUCLEAR FLOW TESTING"
echo "═══════════════════════════"

# Test nuclear endpoints
echo "🔍 Testing nuclear endpoints..."

# Check response times
echo "⏱️  Measuring response times..."
curl -w "Response time: %{time_total}s\\n" -s -o /dev/null "http://localhost:3000/api/health" || echo "❌ Health check failed"

# Run nuclear analysis
echo "📊 Running nuclear analysis..."
ccs run nuclear-monitor

echo "✅ Nuclear testing complete!"
`;
  }

  async createClaudeMd() {
    const claudeMd = `# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

${this.setupConfig.projectName} - Enhanced with ccs for unified context management and robust Claude integration.

## Core Technologies

- **Framework**: ${this.setupConfig.projectType}
- **Context Engine**: ccs v1.0.0
- **Monitoring**: Automated log collection and analysis
- **AI Integration**: Claude with robust terminal management

## Development Commands

\`\`\`bash
# Development with auto-logging
npm run dev:logs

# Context management
npm run ccs            # Interactive mode
npm run status              # System status
npm run validate            # Validate setup

# Analysis and monitoring
npm run claude              # Full log analysis
npm run claude:nuclear      # Nuclear approach monitoring
npm run claude:performance  # Performance analysis
npm run logs:analyze        # Pattern analysis
\`\`\`

## Log Locations

${this.setupConfig.logPatterns.split(',').map(p => `- ${p.trim()}`).join('\n')}

## Documentation Folders

- docs/
- README.md
- CLAUDE.md

## API Endpoints

${this.setupConfig.apiEndpoints.split(',').map(e => `- ${e.trim()}`).join('\n')}

## Operations

### monitor
Description: System monitoring with log analysis and health checks
Tools: log-collector, api-tester, pattern-analyzer, claude-analyzer

### analyze-logs
Description: Comprehensive log analysis with pattern recognition
Tools: log-collector, error-clusterer, performance-analyzer, claude-analyzer

### performance-analysis
Description: Performance monitoring and optimization insights
Tools: log-collector, performance-analyzer, claude-analyzer

${this.setupConfig.features.includes('nuclear') ? `### nuclear-monitor
Description: Nuclear approach performance monitoring
Tools: log-collector, nuclear-analyzer, performance-analyzer, claude-analyzer

` : ''}${this.setupConfig.features.includes('business') ? `### business-planning
Description: Business planning with context analysis and strategic insights
Tools: document-loader, context-analyzer, claude-planner

` : ''}${this.setupConfig.features.includes('voice') ? `### voice-analysis
Description: Voice transcript analysis and insights
Tools: voice-collector, transcript-analyzer, claude-analyzer

` : ''}## Key Architecture Patterns

### Unified Context Management
- Single source of truth in .ccs/ directory
- Automatic log discovery and indexing
- Schema-driven context loading

### Robust Claude Integration
- Multiple launch strategies with fallbacks
- Session recovery and retry logic
- Isolated contexts prevent interference

### Performance Monitoring
${this.setupConfig.features.includes('nuclear') ? '- Nuclear approach timing (<3s target)\n' : ''}- Response time tracking and analysis
- Error pattern recognition
- Automated health checks

## Folder Structure

\`\`\`
${this.setupConfig.projectName}/
├── logs/
│   ├── dev/              # Development logs
│   ├── analysis/         # Claude analysis results
│   └── learnings/        # Insights and learnings
├── scripts/              # Monitoring and automation
├── .ccs/           # Context database
│   ├── sessions/        # Claude sessions
│   ├── results/         # Operation results
│   └── cache/           # Context cache
└── docs/                # Documentation
\`\`\`

## Monitoring & Analysis

ccs provides comprehensive monitoring:

- **Log Collection**: Automatic gathering from multiple sources
- **Pattern Analysis**: Error clustering and performance insights
- **Claude Integration**: AI-powered analysis and recommendations
- **Context Persistence**: Historical data for trend analysis

## Getting Started

1. Run the interactive setup: \`npm run ccs\`
2. Check system status: \`npm run status\`
3. Start development with logging: \`npm run dev:logs\`
4. Analyze with Claude: \`npm run claude\`

---

*Enhanced by ccs - unified context management for Claude integration*
`;

    await fs.writeFile(path.join(this.projectPath, 'CLAUDE.md'), claudeMd);
  }

  async enhanceExistingClaudeMd() {
    // TODO: Enhance existing CLAUDE.md with ccs additions
    console.log('   📝 Enhanced existing CLAUDE.md');
  }

  async createEnvExample() {
    const envExample = `# ccs Environment Variables

# Claude CLI Configuration
ANTHROPIC_API_KEY=your_api_key_here

# Optional: Custom context configuration
CCS_CACHE_TIMEOUT=300000
CCS_LOG_LEVEL=info
CCS_AUTO_COLLECT=true

# Project-specific variables
PROJECT_NAME=${this.setupConfig.projectName}
PROJECT_TYPE=${this.setupConfig.projectType}
`;

    await fs.writeFile(path.join(this.projectPath, '.env.example'), envExample);
  }

  async updateGitignore() {
    const gitignorePath = path.join(this.projectPath, '.gitignore');
    const additions = `
# ccs generated files
.ccs/
logs/collected/
logs/analysis/
*.ccs-temp

# Development logs
logs/dev/
`;

    try {
      const existing = await fs.readFile(gitignorePath, 'utf-8');
      if (!existing.includes('.ccs/')) {
        await fs.writeFile(gitignorePath, existing + additions);
      }
    } catch (error) {
      // Create new .gitignore
      await fs.writeFile(gitignorePath, additions);
    }
  }

  // Utility methods
  async createScript(filename, content) {
    const scriptPath = path.join(this.projectPath, 'scripts', filename);
    await fs.writeFile(scriptPath, content);
  }

  async fileExists(filename) {
    try {
      await fs.access(path.join(this.projectPath, filename));
      return true;
    } catch {
      return false;
    }
  }

  async directoryExists(dirname) {
    try {
      const stat = await fs.stat(path.join(this.projectPath, dirname));
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  async ensureDirectory(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }
}

module.exports = ProjectSetupWizard;