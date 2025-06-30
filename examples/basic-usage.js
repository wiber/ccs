#!/usr/bin/env node

/**
 * Basic Usage Example for Claude Context Engine
 * 
 * This example shows how to use the engine programmatically
 */

const ClaudeContextEngine = require('../lib/index');
const path = require('path');

async function basicExample() {
  console.log('🧠 Claude Context Engine - Basic Usage Example\n');

  // Initialize engine with current directory
  const engine = new ClaudeContextEngine(process.cwd(), {
    context: {
      logPaths: ['logs/**/*.log', '*.log'],
      documentationPaths: ['docs/', '*.md'],
      cacheTimeout: 300000 // 5 minutes
    },
    terminal: {
      strategy: 'persistent-session',
      timeout: 60000 // 1 minute
    }
  });

  try {
    // Initialize the engine
    await engine.initialize();
    
    console.log('✅ Engine initialized successfully');
    console.log(`📋 Available operations: ${engine.listOperations().join(', ')}\n`);

    // Example 1: Run built-in monitoring operation
    console.log('🔍 Running system monitoring...');
    const monitorResult = await engine.run('monitor');
    
    if (monitorResult.success) {
      console.log('✅ Monitoring completed');
      console.log(`📄 Outputs: ${monitorResult.outputs?.join(', ') || 'None'}`);
    } else {
      console.log('❌ Monitoring failed:', monitorResult.error);
    }

    console.log('\n' + '─'.repeat(50) + '\n');

    // Example 2: Register and run custom operation
    console.log('🔧 Registering custom operation...');
    
    engine.registerOperation('example-analysis', {
      description: 'Example analysis operation',
      sequence: [
        { 
          tool: 'log-collector', 
          params: { 
            sources: ['logs/**/*.log'],
            timeRange: '1h'
          } 
        },
        { 
          tool: 'pattern-analyzer', 
          params: { 
            focus: 'errors-and-performance' 
          } 
        },
        { 
          tool: 'claude-analyzer', 
          params: { 
            template: 'system-monitoring',
            focus: 'example analysis'
          } 
        }
      ],
      outputs: ['logs/example-analysis-{timestamp}.md'],
      recovery: {
        'log-collector': 'continue-with-available-sources',
        'claude-analyzer': 'use-fallback-analysis'
      }
    });

    console.log('✅ Custom operation registered');
    
    // Run the custom operation
    console.log('🚀 Running custom analysis...');
    const customResult = await engine.run('example-analysis');
    
    if (customResult.success) {
      console.log('✅ Custom analysis completed');
      console.log(`📊 Execution time: ${customResult.execution.duration}ms`);
      console.log(`📋 Steps completed: ${customResult.execution.results.length}`);
      
      // Show step results
      customResult.execution.results.forEach((step, index) => {
        const status = step.success ? '✅' : '❌';
        console.log(`  ${status} Step ${index + 1}: ${step.tool}`);
      });
    } else {
      console.log('❌ Custom analysis failed:', customResult.error);
    }

    console.log('\n' + '─'.repeat(50) + '\n');

    // Example 3: Get current context
    console.log('📚 Loading current context...');
    const context = await engine.getContext('general');
    
    console.log('📊 Context Summary:');
    console.log(`  Project: ${context.project?.name || 'Unknown'}`);
    console.log(`  Type: ${context.project?.type || 'Unknown'}`);
    console.log(`  Log sources: ${context.project?.logLocations?.length || 0}`);
    console.log(`  Doc folders: ${context.project?.documentationFolders?.length || 0}`);

    console.log('\n🎉 Basic example completed successfully!');
    
  } catch (error) {
    console.error('❌ Example failed:', error.message);
    
    // Show helpful debugging information
    console.log('\n🔍 Debugging Information:');
    console.log('1. Make sure Claude CLI is installed: npm install -g @anthropic-ai/claude-code');
    console.log('2. Check if CLAUDE.md exists in current directory');
    console.log('3. Verify log and documentation paths in config');
    console.log('4. Run: claude-context validate');
  }
}

// Run the example
if (require.main === module) {
  basicExample();
}

module.exports = basicExample;