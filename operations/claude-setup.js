/**
 * Claude Setup Operation - Runs INSIDE Claude with tools
 * 
 * This operation uses Claude's file tools to create the complete ccs setup
 * including npm scripts, configuration, and folder structure.
 */

const fs = require('fs').promises;
const path = require('path');

class ClaudeSetupOperation {
  constructor(projectPath, options = {}) {
    this.projectPath = projectPath;
    this.options = { enhanced: true, ...options };
  }

  async execute(options = {}) {
    console.log('🚀 Claude-based ccs setup starting...');
    
    try {
      // Step 1: Discover project
      const projectInfo = await this.discoverProject();
      console.log('🔍 Project discovered:', projectInfo.type);
      
      // Step 2: Create folder structure
      await this.createFolderStructure();
      console.log('📁 Folder structure created');
      
      // Step 3: Create configuration files
      const config = await this.createConfigFiles(projectInfo);
      console.log('📝 Configuration files created');
      
      // Step 4: Update package.json with npm scripts
      await this.updatePackageJson();
      console.log('⚙️ npm scripts added');
      
      // Step 5: Create/enhance CLAUDE.md
      await this.createEnhancedClaudeMd(projectInfo);
      console.log('📜 CLAUDE.md enhanced');
      
      // Step 6: Create startup scripts
      await this.createStartupScripts();
      console.log('📋 Startup scripts created');
      
      return {
        success: true,
        result: {
          projectInfo,
          config,
          message: 'ccs setup completed successfully! You can now use npm run ccs commands.'
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Claude setup failed:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async discoverProject() {
    const projectName = path.basename(this.projectPath);
    let projectType = 'generic';
    
    try {
      // Check for Next.js
      await fs.access(path.join(this.projectPath, 'next.config.js'));
      projectType = 'nextjs';
    } catch (e) {
      try {
        await fs.access(path.join(this.projectPath, 'next.config.ts'));
        projectType = 'nextjs';
      } catch (e) {
        // Check for package.json to determine if it's Node.js
        try {
          const packageJson = JSON.parse(await fs.readFile(path.join(this.projectPath, 'package.json'), 'utf-8'));
          if (packageJson.dependencies && Object.keys(packageJson.dependencies).some(dep => 
            dep.includes('react') || dep.includes('express') || dep.includes('next')
          )) {
            projectType = 'nodejs';
          }
        } catch (e) {
          // Stay with generic
        }
      }
    }
    
    return {
      name: projectName,
      type: projectType,
      path: this.projectPath
    };
  }

  async createFolderStructure() {
    const folders = [
      'logs',
      'logs/dev',
      'logs/analysis', 
      'logs/learnings',
      '.ccs',
      '.ccs/sessions',
      '.ccs/results',
      '.ccs/learnings',
      '.ccs/feedback',
      '.ccs/cache',
      'scripts/lib' // For any helper scripts
    ];

    for (const folder of folders) {
      const folderPath = path.join(this.projectPath, folder);
      await fs.mkdir(folderPath, { recursive: true });
    }
    
    // Create .gitignore additions
    await this.updateGitignore();
  }

  async createConfigFiles(projectInfo) {
    // 1. Main ccs configuration
    const config = {
      project: {
        name: projectInfo.name,
        type: projectInfo.type,
        features: ['monitoring', 'business', 'voice', 'nuclear', 'learning']
      },
      context: {
        logPaths: [
          'logs/**/*.log',
          'logs/dev-server-*.log',
          'logs/vercel-*.log',
          '*.log'
        ],
        documentationPaths: [
          'docs/',
          'README.md',
          'CLAUDE.md',
          'PRODUCT_TRACKER.md'
        ],
        apiEndpoints: [
          'http://localhost:3000/api/health',
          'http://localhost:3000/api/trigger-eligible-emails'
        ],
        cacheTimeout: 300000
      },
      terminal: {
        strategy: 'persistent-session',
        timeout: 60000,
        retryAttempts: 3
      },
      monitoring: {
        autoCollectLogs: true,
        nuclearThreshold: 3000,
        performanceAlerts: true
      },
      learning: {
        enabled: true,
        feedbackCollection: true,
        selfImprovement: true
      }
    };

    await fs.writeFile(
      path.join(this.projectPath, '.ccs-config.json'),
      JSON.stringify(config, null, 2)
    );

    // 2. Environment example
    const envExample = `# ccs Environment Variables

# Claude CLI Configuration
ANTHROPIC_API_KEY=your_api_key_here

# Optional: Custom context configuration
CCS_CACHE_TIMEOUT=300000
CCS_LOG_LEVEL=info
CCS_AUTO_COLLECT=true

# Project-specific variables
PROJECT_NAME=${projectInfo.name}
PROJECT_TYPE=${projectInfo.type}
`;

    await fs.writeFile(path.join(this.projectPath, '.env.ccs.example'), envExample);

    return config;
  }

  async updatePackageJson() {
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    let packageJson = {};

    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      packageJson = JSON.parse(content);
    } catch (error) {
      // Create basic package.json if it doesn't exist
      packageJson = {
        name: path.basename(this.projectPath),
        version: '1.0.0',
        scripts: {}
      };
    }

    // Enhanced ccs scripts (preserve existing)
    const newScripts = {
      // Main ccs entry points
      'ccs': 'ccs run --interactive',
      'ccs:setup': 'ccs run claude-setup',
      
      // Enhanced versions of existing workflows  
      'ccs:claude': 'ccs run claude-analysis --enhanced',
      'ccs:voice': 'ccs run voice-analysis --enhanced',
      'ccs:biz': 'ccs run business-planning --enhanced',
      'ccs:dev': 'ccs run dev-monitor --with-logs',
      
      // Self-improvement operations
      'ccs:learn': 'ccs run learn --optimize-all',
      'ccs:feedback': 'ccs run feedback --interactive',
      'ccs:bootstrap': 'ccs run self-bootstrap --analyze --improve',
      'ccs:insights': 'ccs run learning-insights --generate-report',
      
      // Context operations
      'ccs:context': 'ccs run build-context --comprehensive',
      'ccs:todos': 'ccs run todo-manager --interactive', 
      'ccs:health': 'ccs run health-check --nuclear --performance',
      
      // Validation and status
      'ccs:validate': 'ccs validate --fix',
      'ccs:status': 'ccs status --detailed'
    };

    // Preserve existing scripts, only add new ones
    const existingScripts = packageJson.scripts || {};
    packageJson.scripts = { ...existingScripts, ...newScripts };

    // Add ccs as devDependency if not already present
    if (!packageJson.devDependencies) packageJson.devDependencies = {};
    if (!packageJson.devDependencies.ccs) {
      packageJson.devDependencies.ccs = '^1.0.0';
    }

    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log(`   ✅ Added ${Object.keys(newScripts).length} enhanced ccs scripts`);
    console.log('   💡 Your existing scripts remain unchanged');
    console.log('   🚀 Use ccs: versions for enhanced functionality');
  }

  async createEnhancedClaudeMd(projectInfo) {
    const claudeMdPath = path.join(this.projectPath, 'CLAUDE.md');
    let existingContent = '';
    
    try {
      existingContent = await fs.readFile(claudeMdPath, 'utf-8');
    } catch (e) {
      // File doesn't exist, we'll create it
    }

    const enhancement = `
# ccs Enhanced Project Context

Generated: ${new Date().toISOString()}
Project: ${projectInfo.name} (${projectInfo.type})

## Enhanced Development Commands

\`\`\`bash
# Self-Improvement Workflows
npm run ccs:learn      # Trigger learning cycle to optimize operations
npm run ccs:feedback   # Collect user feedback for improvements  
npm run ccs:bootstrap  # Analyze and improve ccs itself
npm run ccs:insights   # Generate performance insights

# Enhanced Analysis (preserves existing scripts)
npm run ccs:claude     # Enhanced Claude with context + TODO editing
npm run ccs:voice      # Enhanced voice with Miltonian patterns
npm run ccs:biz        # Enhanced business with learning integration
npm run ccs:dev        # Enhanced dev with real-time context

# Interactive Operations
npm run ccs            # Interactive context mode
npm run ccs:todos      # Interactive TODO management
npm run ccs:health     # Nuclear + performance monitoring
\`\`\`

## ccs Configuration

- **Config File**: .ccs-config.json
- **Learning Data**: .ccs/learnings/
- **Feedback**: .ccs/feedback/
- **Context Cache**: .ccs/cache/

## Log Locations

- logs/**/*.log
- logs/dev-server-*.log  
- logs/vercel-*.log
- *.log

## Key Features

### Recursive Self-Improvement
- Tracks every operation execution
- Learns from user feedback and CI results
- Optimizes prompts and configurations autonomously
- Self-analyzes and improves its own codebase

### Enhanced Context Management
- Unified file discovery and tracking
- Persistent context across operations
- Smart TODO detection and editing
- Performance monitoring and optimization

### Preserves Existing Workflows
- Your existing npm run claude/voice/biz scripts remain unchanged
- Enhanced versions add new capabilities without breaking existing flows
- Gradual adoption - use enhanced features when ready

---
*Enhanced by ccs - Turn any CLAUDE.md into a smart CLI that never loses context*
`;

    // If existing content, append enhancement; otherwise, create new
    const newContent = existingContent ? existingContent + enhancement : `# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

${projectInfo.name} - Enhanced with ccs for unified context management and recursive self-improvement.${enhancement}`;

    await fs.writeFile(claudeMdPath, newContent);
  }

  async createStartupScripts() {
    // Create a quick start guide
    const quickStart = `# ccs Quick Start Guide

Generated: ${new Date().toISOString()}

## 🚀 Get Started

1. **Verify Setup**:
   \`\`\`bash
   npm run ccs:status
   \`\`\`

2. **Try Interactive Mode**:
   \`\`\`bash
   npm run ccs
   \`\`\`

3. **Test Enhanced Analysis**:
   \`\`\`bash
   npm run ccs:claude
   \`\`\`

4. **Provide Feedback** (helps the system learn):
   \`\`\`bash
   npm run ccs:feedback
   \`\`\`

## 🧠 Self-Improvement Cycle

1. Use enhanced operations (ccs:claude, ccs:voice, etc.)
2. Provide feedback when prompted (npm run ccs:feedback)
3. Let the system learn and optimize (npm run ccs:learn)
4. Watch performance improve over time!

## 📊 Your Existing Scripts

**Preserved (unchanged)**:
- npm run claude
- npm run voice  
- npm run biz
- npm run dev

**Enhanced (new capabilities)**:
- npm run ccs:claude (+ context tracking, TODO editing)
- npm run ccs:voice (+ pattern detection, learning)
- npm run ccs:biz (+ learning integration)
- npm run ccs:dev (+ real-time context building)

---

For full documentation, see README.md in the ccs package.
`;

    await fs.writeFile(path.join(this.projectPath, 'CCS_QUICK_START.md'), quickStart);
    
    // Create a simple validation script
    const validationScript = `#!/bin/bash

# ccs Validation Script
echo "🔍 Validating ccs setup..."

# Check required files
if [ -f ".ccs-config.json" ]; then
    echo "✅ Configuration file found"
else
    echo "❌ Missing .ccs-config.json"
    exit 1
fi

if [ -f "CLAUDE.md" ]; then
    echo "✅ CLAUDE.md found"
else
    echo "❌ Missing CLAUDE.md"
    exit 1
fi

# Check directories
if [ -d ".ccs" ]; then
    echo "✅ ccs directory structure exists"
else
    echo "❌ Missing .ccs directory"
    exit 1
fi

echo "🎉 ccs setup validation passed!"
echo "🚀 Try: npm run ccs"
`;

    const scriptPath = path.join(this.projectPath, 'scripts', 'validate-ccs-setup.sh');
    await fs.writeFile(scriptPath, validationScript);
    
    // Make script executable
    try {
      await fs.chmod(scriptPath, 0o755);
    } catch (e) {
      // Non-critical if chmod fails
    }
  }

  async updateGitignore() {
    const gitignorePath = path.join(this.projectPath, '.gitignore');
    const additions = `\n# ccs generated files\n.ccs/cache/\n.ccs/sessions/\n*.ccs-temp\n\n# ccs learning data (optional - you may want to commit this)\n# .ccs/learnings/\n# .ccs/feedback/\n`;

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
}

module.exports = ClaudeSetupOperation;