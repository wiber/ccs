/**
 * Register All Operations
 * 
 * Registers all available operations with the operation registry
 * This includes both enhanced operations and traditional sequence operations
 */

const ClaudeAnalysisOperation = require('./claude-analysis');
const VoiceAnalysisOperation = require('./voice-analysis');
const BusinessPlanningOperation = require('./business-planning');
const ImproveCodebaseOperation = require('./improve-codebase');
const CCSDevOperation = require('./ccsdev');

function registerAllOperations(registry) {
  console.log('📝 Registering all ccs operations...');
  
  // Register enhanced operations
  registry.register('claude-analysis', {
    name: 'claude-analysis',
    description: 'Enhanced Claude analysis with comprehensive context and TODO management',
    category: 'analysis',
    enhanced: true,
    operationClass: ClaudeAnalysisOperation,
    outputs: ['analysis-file', 'context-files', 'todo-files'],
    tags: ['claude', 'analysis', 'monitoring', 'todo'],
    capabilities: [
      'Real-time log monitoring',
      'TODO list discovery and editing',
      'Context file tracking',
      'Nuclear approach analysis',
      'Documentation structure mapping'
    ]
  });

  registry.register('voice-analysis', {
    name: 'voice-analysis',
    description: 'Enhanced voice analysis with Miltonian pattern recognition',
    category: 'analysis',
    enhanced: true,
    operationClass: VoiceAnalysisOperation,
    outputs: ['analysis-file', 'miltonian-patterns', 'voice-metrics'],
    tags: ['voice', 'miltonian', 'embodiment', 'bland-ai'],
    capabilities: [
      'Voice transcript analysis',
      'Miltonian pattern detection',
      'Embodiment quality assessment',
      'Bland AI integration',
      'Sophistication level analysis'
    ]
  });

  registry.register('business-planning', {
    name: 'business-planning',
    description: 'Business planning with SQLite data integration and strategic analysis',
    category: 'planning',
    enhanced: true,
    operationClass: BusinessPlanningOperation,
    outputs: ['context-file', 'recommendations', 'metrics'],
    tags: ['business', 'planning', 'metrics', 'strategy'],
    capabilities: [
      'Business metrics analysis',
      'Growth opportunity identification',
      'Revenue optimization',
      'Competitive analysis',
      'Strategic recommendations'
    ]
  });

  registry.register('improve-codebase', {
    name: 'improve-codebase',
    description: 'Interactive codebase improvement with question-raising capabilities',
    category: 'development',
    enhanced: true,
    operationClass: ImproveCodebaseOperation,
    outputs: ['improvement-plan', 'questions', 'opportunities'],
    tags: ['improvement', 'refactoring', 'interactive', 'quality'],
    capabilities: [
      'Codebase structure analysis',
      'Complexity detection',
      'Test coverage analysis',
      'Interactive questioning',
      'Specific improvement suggestions'
    ]
  });

  registry.register('ccsdev', {
    name: 'ccsdev',
    description: 'Advanced development environment with multi-terminal support and SQLite streaming',
    category: 'development',
    enhanced: true,
    operationClass: CCSDevOperation,
    outputs: ['streaming-logs', 'performance-metrics', 'sql-insights'],
    tags: ['development', 'monitoring', 'sqlite', 'streaming'],
    capabilities: [
      'Real-time log streaming to SQLite',
      'Multi-terminal environment spawning',
      'Performance monitoring',
      'Automated endpoint testing',
      'SQL query toolkit'
    ]
  });

  // Register reinforce-patterns operation (example of future addition)
  registry.register('reinforce-patterns', {
    name: 'reinforce-patterns',
    description: 'Reinforce successful patterns in the codebase',
    category: 'learning',
    sequence: [
      {
        tool: 'pattern-analyzer',
        params: { scope: 'recent', threshold: 0.8 }
      },
      {
        tool: 'learning-engine',
        params: { action: 'reinforce' }
      },
      {
        tool: 'claude-launcher',
        params: { mode: 'reinforce' }
      }
    ],
    outputs: ['reinforced-patterns', 'learning-updates'],
    tags: ['learning', 'patterns', 'reinforcement']
  });

  // Register kanban-management operation
  registry.register('kanban-management', {
    name: 'kanban-management',
    description: 'Kanban board management with SQLite backend',
    category: 'planning',
    sequence: [
      {
        tool: 'sqlite-query',
        params: { database: 'kanban.db', query: 'SELECT * FROM tasks' }
      },
      {
        tool: 'kanban-analyzer',
        params: { mode: 'insights' }
      },
      {
        tool: 'claude-launcher',
        params: { mode: 'kanban' }
      }
    ],
    outputs: ['task-list', 'insights', 'recommendations'],
    tags: ['kanban', 'tasks', 'planning', 'sqlite']
  });

  console.log(`✅ Registered ${registry.list().length} operations`);
  
  // Display operation summary
  const stats = registry.getStats();
  console.log('\n📊 Operation Statistics:');
  console.log(`   Total: ${stats.total}`);
  console.log(`   By Category:`);
  Object.entries(stats.byCategory).forEach(([category, ops]) => {
    console.log(`     - ${category}: ${ops.length}`);
  });
  console.log(`   Enhanced Operations: ${registry.list().filter(name => {
    const op = registry.get(name);
    return op.enhanced;
  }).length}`);
}

module.exports = registerAllOperations;