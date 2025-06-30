#!/usr/bin/env node

/**
 * Claude Context CLI - Command Line Interface
 * 
 * Main CLI entry point for the claude-context-engine package
 */

const { Command } = require('commander');
const path = require('path');
const fs = require('fs').promises;
const ClaudeContextEngine = require('../lib/index');
const chalk = require('chalk');
const inquirer = require('inquirer');

const program = new Command();

program
  .name('ccs')
  .description('Turn any CLAUDE.md into a smart CLI that never loses context - complete project setup with npm scripts generation')
  .version('1.0.0');

/**
 * Setup command - complete ThetaDriven Coach style setup (main entry point)
 */
program
  .command('setup')
  .description('Complete project setup with npm scripts, folders, and monitoring (recommended)')
  .option('--template <type>', 'Project template (nextjs, nodejs, generic)', 'auto-detect')
  .option('--claude', 'Use Claude-based setup (requires Claude CLI)', false)
  .action(async (options) => {
    try {
      if (options.claude) {
        // Claude-based setup (runs inside Claude with tools)
        console.log(chalk.blue('🚀 Running Claude-based setup...'));
        console.log(chalk.yellow('This will launch Claude to complete the setup with file tools.'));
        
        const engine = await createEngine();
        const result = await engine.run('claude-setup');
        
        if (result.success) {
          console.log(chalk.green('✅ Claude-based setup completed!'));
          console.log(result.result.message);
        } else {
          throw new Error(result.error);
        }
      } else {
        // Traditional setup wizard
        console.log(chalk.blue('🔧 Running traditional setup wizard...'));
        console.log(chalk.yellow('💡 For Claude-integrated setup, use: ccs setup --claude'));
        
        const ProjectSetupWizard = require('../lib/project-setup-wizard');
        const wizard = new ProjectSetupWizard(process.cwd());
        await wizard.runCompleteSetup();
      }
    } catch (error) {
      console.error(chalk.red('❌ Setup failed:'), error.message);
      process.exit(1);
    }
  });

/**
 * Initialize command - quick setup for existing projects  
 */
program
  .command('init')
  .description('Quick initialization (minimal setup)')
  .option('--config <path>', 'Custom config file path')
  .option('--template <type>', 'Project template (nextjs, nodejs, generic)', 'generic')
  .action(async (options) => {
    try {
      await initializeProject(options);
      console.log(chalk.green('✅ Quick initialization complete!'));
      console.log(chalk.yellow('💡 For full setup with npm scripts, run: ccs setup'));
    } catch (error) {
      console.error(chalk.red('❌ Initialization failed:'), error.message);
      process.exit(1);
    }
  });

/**
 * Run command - execute operations
 */
program
  .command('run [operation]')
  .description('Run an operation')
  .option('--config <path>', 'Config file path')
  .option('--interactive', 'Interactive mode')
  .option('--timeout <ms>', 'Operation timeout in milliseconds', '60000')
  .action(async (operation, options) => {
    try {
      const engine = await createEngine(options.config);
      
      if (options.interactive || !operation) {
        await engine.interactive();
      } else {
        const result = await engine.run(operation, {
          timeout: parseInt(options.timeout)
        });
        
        if (result.success) {
          console.log(chalk.green('✅ Operation completed successfully'));
          if (result.outputs && result.outputs.length > 0) {
            console.log('📄 Outputs saved:');
            result.outputs.forEach(file => console.log(`  - ${file}`));
          }
        } else {
          console.error(chalk.red('❌ Operation failed:'), result.error);
          process.exit(1);
        }
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

/**
 * CCSDev command - enhanced development environment
 */
program
  .command('dev')
  .description('Enhanced development environment with streaming logs and SQL integration')
  .option('--stream-logs', 'Enable real-time log streaming to SQLite')
  .option('--sql-toolkit', 'Start with SQL toolkit active')
  .option('--curl-automation', 'Enable automated endpoint testing')
  .option('--self-improve', 'Enable self-improvement system')
  .option('--generate-docs', 'Generate documentation recursively')
  .option('--interactive', 'Interactive mode (default)')
  .action(async (options) => {
    console.log(chalk.blue('🚀 Starting CCSDev - Enhanced Development Environment'));
    console.log('═'.repeat(60));
    
    try {
      const CCSDevOperation = require('../operations/ccsdev');
      const engine = await createEngine();
      
      const devOperation = new CCSDevOperation(
        engine.contextDb,
        engine.learningEngine
      );
      
      // Configure based on options
      if (options.streamLogs) {
        console.log('🌊 Real-time log streaming enabled');
      }
      if (options.sqlToolkit) {
        console.log('🔧 SQL toolkit activated');
      }
      if (options.curlAutomation) {
        console.log('🌐 Automated endpoint testing enabled');
      }
      if (options.selfImprove) {
        console.log('🧠 Self-improvement system active');
      }
      if (options.generateDocs) {
        console.log('📚 Recursive documentation generation enabled');
      }
      
      await devOperation.initialize();
      
    } catch (error) {
      console.error(chalk.red('❌ CCSDev failed:'), error.message);
      process.exit(1);
    }
  });

/**
 * List command - show available operations
 */
program
  .command('list')
  .description('List available operations')
  .option('--config <path>', 'Config file path')
  .option('--stats', 'Show operation statistics')
  .action(async (options) => {
    try {
      const engine = await createEngine(options.config);
      const operations = engine.listOperations();
      
      if (operations.length === 0) {
        console.log(chalk.yellow('No operations found. Make sure CLAUDE.md exists or run claude-context init'));
        return;
      }

      console.log(chalk.blue('📋 Available Operations:'));
      
      for (const opName of operations) {
        const operation = engine.operations.get(opName);
        console.log(`\n🔧 ${chalk.bold(opName)}`);
        if (operation.description) {
          console.log(`   ${operation.description}`);
        }
        console.log(`   Tools: ${operation.sequence.map(s => s.tool).join(' → ')}`);
      }

      if (options.stats) {
        const stats = engine.operations.getStats();
        console.log('\n📊 Statistics:');
        console.log(`   Total operations: ${stats.total}`);
        console.log(`   Most used tools: ${Object.entries(stats.toolUsage).slice(0, 3).map(([tool, count]) => `${tool}(${count})`).join(', ')}`);
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

/**
 * Config command - manage configuration
 */
program
  .command('config')
  .description('Show or edit configuration')
  .option('--edit', 'Edit configuration interactively')
  .option('--show', 'Show current configuration')
  .action(async (options) => {
    try {
      if (options.edit) {
        await editConfig();
      } else {
        await showConfig();
      }
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

/**
 * Validate command - check setup and configuration
 */
program
  .command('validate')
  .description('Validate setup and configuration')
  .option('--fix', 'Attempt to fix issues automatically')
  .action(async (options) => {
    try {
      await validateSetup(options.fix);
    } catch (error) {
      console.error(chalk.red('❌ Validation failed:'), error.message);
      process.exit(1);
    }
  });

/**
 * Status command - show system status
 */
program
  .command('status')
  .description('Show system status and recent activity')
  .action(async () => {
    try {
      await showStatus();
    } catch (error) {
      console.error(chalk.red('❌ Error:'), error.message);
      process.exit(1);
    }
  });

// Implementation functions

async function createEngine(configPath) {
  let config = {};
  
  if (configPath) {
    const configData = await fs.readFile(configPath, 'utf-8');
    config = JSON.parse(configData);
  } else {
    // Try to load default config
    try {
      let defaultConfigPath = path.join(process.cwd(), '.ccs-config.json');
      let configData;
      
      try {
        configData = await fs.readFile(defaultConfigPath, 'utf-8');
      } catch (error) {
        // Fallback to old name
        defaultConfigPath = path.join(process.cwd(), '.claude-config.json');
        configData = await fs.readFile(defaultConfigPath, 'utf-8');
      }
      
      config = JSON.parse(configData);
    } catch (error) {
      // No config file, use defaults
    }
  }

  const engine = new ClaudeContextEngine(process.cwd(), config);
  await engine.initialize();
  return engine;
}

async function initializeProject(options) {
  const projectPath = process.cwd();
  
  // Check if CLAUDE.md exists
  const claudeMdPath = path.join(projectPath, 'CLAUDE.md');
  let claudeMdExists = false;
  
  try {
    await fs.access(claudeMdPath);
    claudeMdExists = true;
  } catch (error) {
    // CLAUDE.md doesn't exist
  }

  // Interactive setup
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: path.basename(projectPath)
    },
    {
      type: 'list',
      name: 'projectType',
      message: 'Project type:',
      choices: ['nextjs', 'nodejs', 'python', 'generic'],
      default: 'generic'
    },
    {
      type: 'input',
      name: 'logPaths',
      message: 'Log file patterns (comma-separated):',
      default: 'logs/**/*.log,*.log'
    },
    {
      type: 'input',
      name: 'docPaths',
      message: 'Documentation paths (comma-separated):',
      default: 'docs,README.md'
    }
  ]);

  // Create .claude-config.json
  const config = {
    project: {
      name: answers.projectName,
      type: answers.projectType
    },
    context: {
      logPaths: answers.logPaths.split(',').map(p => p.trim()),
      documentationPaths: answers.docPaths.split(',').map(p => p.trim()),
      cacheTimeout: 300000
    },
    terminal: {
      strategy: 'persistent-session',
      timeout: 60000
    }
  };

  await fs.writeFile(
    path.join(projectPath, '.claude-config.json'),
    JSON.stringify(config, null, 2)
  );

  // Create CLAUDE.md if it doesn't exist
  if (!claudeMdExists) {
    const template = getClaudeMdTemplate(answers.projectType, answers);
    await fs.writeFile(claudeMdPath, template);
  }

  // Create .claude-context directory
  await fs.mkdir(path.join(projectPath, '.claude-context'), { recursive: true });
  await fs.mkdir(path.join(projectPath, '.claude-context', 'results'), { recursive: true });
}

function getClaudeMdTemplate(projectType, answers) {
  return `# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

${answers.projectName} - A ${projectType} project with Claude Context Engine integration.

## Log Locations

${answers.logPaths.split(',').map(p => `- ${p.trim()}`).join('\n')}

## Documentation Folders

${answers.docPaths.split(',').map(p => `- ${p.trim()}`).join('\n')}

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

## Development Commands

\`\`\`bash
# Monitor system health
claude-context run monitor

# Analyze recent logs
claude-context run analyze-logs

# Business planning session
claude-context run plan

# Interactive mode
claude-context run --interactive
\`\`\`

## Key Architecture Patterns

Add your project-specific architecture patterns here.
`;
}

async function validateSetup(autoFix) {
  console.log(chalk.blue('🔍 Validating Claude Context Engine setup...'));
  
  const issues = [];
  const projectPath = process.cwd();

  // Check for CLAUDE.md
  try {
    await fs.access(path.join(projectPath, 'CLAUDE.md'));
    console.log(chalk.green('✅ CLAUDE.md found'));
  } catch (error) {
    issues.push('CLAUDE.md not found');
    console.log(chalk.red('❌ CLAUDE.md not found'));
  }

  // Check for Claude CLI
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    await execAsync('claude --version');
    console.log(chalk.green('✅ Claude CLI available'));
  } catch (error) {
    issues.push('Claude CLI not installed');
    console.log(chalk.red('❌ Claude CLI not found'));
    console.log('   Install with: npm install -g @anthropic-ai/claude-code');
  }

  // Check config file
  try {
    await fs.access(path.join(projectPath, '.claude-config.json'));
    console.log(chalk.green('✅ Configuration file found'));
  } catch (error) {
    issues.push('Configuration file missing');
    console.log(chalk.yellow('⚠️  .claude-config.json not found (will use defaults)'));
  }

  if (issues.length === 0) {
    console.log(chalk.green('\n🎉 Setup validation passed!'));
  } else {
    console.log(chalk.yellow(`\n⚠️  Found ${issues.length} issue(s):`));
    issues.forEach(issue => console.log(`   - ${issue}`));
    
    if (autoFix) {
      console.log('\n🔧 Attempting to fix issues...');
      // Auto-fix logic would go here
    } else {
      console.log('\nRun with --fix to attempt automatic fixes');
    }
  }
}

async function showStatus() {
  console.log(chalk.blue('📊 Claude Context Engine Status'));
  console.log('━'.repeat(40));

  const projectPath = process.cwd();
  
  // Project info
  try {
    const packageJson = JSON.parse(await fs.readFile(path.join(projectPath, 'package.json'), 'utf-8'));
    console.log(`Project: ${packageJson.name || 'Unknown'}`);
    console.log(`Version: ${packageJson.version || 'Unknown'}`);
  } catch (error) {
    console.log('Project: Unknown (no package.json)');
  }

  // Recent activity
  try {
    const resultsDir = path.join(projectPath, '.claude-context', 'results');
    const files = await fs.readdir(resultsDir);
    const recentFiles = files.slice(-5);
    
    if (recentFiles.length > 0) {
      console.log('\n📈 Recent Activity:');
      for (const file of recentFiles) {
        const [operation, timestamp] = file.replace('.json', '').split('-').slice(0, 2);
        console.log(`   ${operation} - ${timestamp}`);
      }
    } else {
      console.log('\n📈 No recent activity');
    }
  } catch (error) {
    console.log('\n📈 No activity history');
  }
}

async function showConfig() {
  try {
    const configPath = path.join(process.cwd(), '.claude-config.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
    
    console.log(chalk.blue('📋 Current Configuration:'));
    console.log(JSON.stringify(config, null, 2));
  } catch (error) {
    console.log(chalk.yellow('⚠️  No configuration file found. Using defaults.'));
  }
}

async function editConfig() {
  console.log(chalk.blue('🔧 Interactive Configuration Editor'));
  console.log('(Coming soon - edit .claude-config.json manually for now)');
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error(chalk.red('❌ Unhandled Rejection:'), reason);
  process.exit(1);
});

// Parse command line arguments
program.parse();