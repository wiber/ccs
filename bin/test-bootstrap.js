#!/usr/bin/env node

/**
 * Test script for self-bootstrap functionality
 * 
 * Usage: node bin/test-bootstrap.js
 */

const path = require('path');
const ClaudeContextEngine = require('../lib/index');

async function testBootstrap() {
  console.log('🧪 Testing ccs self-bootstrap...');
  
  try {
    // Initialize ccs engine
    const projectPath = path.resolve('..');
    const engine = new ClaudeContextEngine(projectPath);
    
    await engine.initialize();
    
    console.log('✅ Engine initialized successfully');
    console.log(`📁 Project path: ${projectPath}`);
    console.log(`🔧 Available operations: ${engine.listOperations().join(', ')}`);
    
    // Test self-bootstrap operation
    console.log('\n🚀 Running self-bootstrap...');
    const result = await engine.run('self-bootstrap');
    
    if (result.success) {
      console.log('✅ Self-bootstrap completed successfully!');
      if (result.result) {
        console.log('📊 Analysis areas:', Object.keys(result.result.analysis || {}));
        console.log('💡 Improvement categories:', Object.keys(result.result.improvements || {}));
        console.log('🛠️ Implementation count:', (result.result.implementations || []).length);
      }
    } else {
      console.log('❌ Self-bootstrap failed:', result.error);
    }
    
    // Test learning insights
    console.log('\n🧠 Generating learning insights...');
    const insights = await engine.learningEngine.generateInsights();
    console.log('📈 Insights:', JSON.stringify(insights, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testBootstrap().catch(console.error);