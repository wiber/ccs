const { spawn, exec } = require('child_process');
const { promisify } = require('util');

/**
 * Terminal Spawner for Multi-Window Development Environment
 * 
 * Manages spawning new terminal windows for different ccsdev processes
 * Similar to the existing npm run dev terminal spawning functionality
 */
class TerminalSpawner {
  constructor() {
    this.spawnedWindows = new Map();
    this.execAsync = promisify(exec);
  }

  /**
   * Spawn a new Terminal window with a specific command
   */
  async spawnTerminalWindow(windowName, command, options = {}) {
    const {
      title = windowName,
      background = false,
      closeOnExit = false,
      position = null
    } = options;

    try {
      const osascriptCommand = this.buildOSAScript(title, command, { background, closeOnExit, position });
      
      console.log(`🖥️  Spawning terminal window: ${title}`);
      
      const result = await this.execAsync(osascriptCommand);
      
      this.spawnedWindows.set(windowName, {
        title,
        command,
        spawned: Date.now(),
        position,
        pid: null // OSA doesn't return PID directly
      });

      return { success: true, windowName, title };
      
    } catch (error) {
      console.error(`❌ Failed to spawn terminal window ${title}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Build OSA script for terminal spawning (creates new windows, not tabs)
   * Uses the same approach as the working npm run dev script
   */
  buildOSAScript(title, command, options) {
    const { background, closeOnExit, position } = options;
    
    // Escape quotes properly for shell execution
    const safeCommand = command.replace(/"/g, '\\"');
    
    // Use the exact same pattern as the working dev script
    return `osascript -e "tell application \\"Terminal\\" to do script \\"${safeCommand}\\""`;
  }

  /**
   * Spawn multiple coordinated terminal windows for ccsdev
   */
  async spawnCCSDevEnvironment() {
    console.log('🚀 SPAWNING CCSDEV MULTI-TERMINAL ENVIRONMENT');
    console.log('═'.repeat(60));

    const windows = [
      {
        name: 'main',
        title: 'CCSDev Main',
        command: 'npm run ccsdev:stream',
        description: 'Main interactive development interface',
        position: { x: 50, y: 50 }
      },
      {
        name: 'sql',
        title: 'CCSDev SQL Monitor',
        command: 'npm run ccsdev:sql',
        description: 'Real-time SQL performance monitoring',
        position: { x: 750, y: 50 }
      },
      {
        name: 'curl',
        title: 'CCSDev API Monitor',
        command: 'npm run ccsdev:curl',
        description: 'Automated endpoint testing and monitoring',
        position: { x: 50, y: 400 }
      },
      {
        name: 'logs',
        title: 'CCSDev Log Stream',
        command: 'tail -f logs/dev-server-*.log logs/vercel-live-*.log 2>/dev/null || echo "Waiting for logs..."',
        description: 'Live log streaming from development and production',
        position: { x: 750, y: 400 }
      }
    ];

    const results = [];
    
    for (const window of windows) {
      console.log(`📱 ${window.description}`);
      
      const result = await this.spawnTerminalWindow(window.name, window.command, {
        title: window.title,
        background: window.name !== 'main', // Keep main window in focus
        position: window.position
      });
      
      results.push({ ...window, ...result });
      
      // Small delay between spawns to prevent overwhelming the system
      await this.sleep(800);
    }

    console.log('\n✅ Multi-terminal environment spawned successfully!');
    console.log('\n📊 Windows created:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${result.title} at ${result.position?.x || 'auto'},${result.position?.y || 'auto'}`);
    });

    return results;
  }

  /**
   * Spawn development server with monitoring
   */
  async spawnDevServerWithMonitoring() {
    console.log('🚀 SPAWNING DEV SERVER + CCSDEV MONITORING');
    console.log('═'.repeat(60));

    const windows = [
      {
        name: 'dev-server',
        title: 'Next.js Dev Server',
        command: 'npm run dev:quiet',
        description: 'Next.js development server',
        position: { x: 50, y: 50 }
      },
      {
        name: 'ccsdev-main',
        title: 'CCSDev Enhanced',
        command: 'sleep 3 && npm run ccsdev',
        description: 'Enhanced development monitoring (waits for dev server)',
        position: { x: 750, y: 50 }
      },
      {
        name: 'performance',
        title: 'Performance Monitor',
        command: 'watch -n 5 "clear && echo \\"🚀 CCSDEV PERFORMANCE MONITOR\\" && echo \\"═══════════════════════════════════\\" && npm run ccsdev:sql batch-metrics 2>/dev/null || echo \'Starting performance monitoring...\'"',
        description: 'Real-time performance metrics (updates every 5s)',
        position: { x: 400, y: 400 }
      }
    ];

    const results = [];
    
    for (const window of windows) {
      console.log(`📱 ${window.description}`);
      
      const result = await this.spawnTerminalWindow(window.name, window.command, {
        title: window.title,
        background: window.name !== 'dev-server',
        position: window.position
      });
      
      results.push({ ...window, ...result });
      await this.sleep(1200); // Longer delay for dev server coordination
    }

    console.log('\n✅ Dev server environment spawned successfully!');
    console.log('\n📊 Windows created:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${result.title} at ${result.position?.x || 'auto'},${result.position?.y || 'auto'}`);
    });

    return results;
  }

  /**
   * Spawn advanced monitoring environment
   */
  async spawnAdvancedMonitoring() {
    console.log('🔬 SPAWNING ADVANCED MONITORING ENVIRONMENT');
    console.log('═'.repeat(60));

    const windows = [
      {
        name: 'metrics-dashboard',
        title: 'Metrics Dashboard',
        command: 'watch -n 2 "clear && echo \\"📊 METRICS DASHBOARD\\" && echo \\"═══════════════════\\" && npm run ccsdev:sql performance-trends 2>/dev/null && echo && npm run ccsdev:sql memory-usage 2>/dev/null"',
        description: 'Live performance and memory metrics',
        position: { x: 50, y: 50 }
      },
      {
        name: 'compression-monitor',
        title: 'Compression Monitor',
        command: 'watch -n 10 "clear && echo \\"🗜️ COMPRESSION MONITOR\\" && echo \\"════════════════════\\" && npm run ccsdev:sql compression-stats 2>/dev/null && echo && npm run ccsdev:sql deduplication-stats 2>/dev/null"',
        description: 'Compression and deduplication monitoring',
        position: { x: 750, y: 50 }
      },
      {
        name: 'nuclear-monitor',
        title: 'Nuclear Timing Monitor',
        command: 'watch -n 3 "clear && echo \\"⚡ NUCLEAR TIMING MONITOR\\" && echo \\"═══════════════════════\\" && npm run query \\"SELECT timestamp, performance_ms, message FROM streaming_logs WHERE performance_ms IS NOT NULL ORDER BY timestamp DESC LIMIT 10\\" 2>/dev/null || echo \'Nuclear timing monitor - waiting for data...\'"',
        description: 'Nuclear approach performance monitoring',
        position: { x: 50, y: 400 }
      },
      {
        name: 'error-monitor',
        title: 'Error Monitor',
        command: 'watch -n 5 "clear && echo \\"🚨 ERROR MONITOR\\" && echo \\"══════════════\\" && npm run query \\"SELECT timestamp, level, message FROM streaming_logs WHERE level IN (\'ERROR\', \'WARN\') ORDER BY timestamp DESC LIMIT 15\\" 2>/dev/null || echo \'Error monitor - no errors detected ✅\'"',
        description: 'Real-time error and warning monitoring',
        position: { x: 750, y: 400 }
      }
    ];

    const results = [];
    
    for (const window of windows) {
      console.log(`📊 ${window.description}`);
      
      const result = await this.spawnTerminalWindow(window.name, window.command, {
        title: window.title,
        background: true,
        position: window.position
      });
      
      results.push({ ...window, ...result });
      await this.sleep(600);
    }

    console.log('\n✅ Advanced monitoring environment spawned successfully!');
    console.log('\n📊 Windows created:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${result.title} at ${result.position?.x || 'auto'},${result.position?.y || 'auto'}`);
    });

    return results;
  }

  /**
   * Spawn voice analysis environment
   */
  async spawnVoiceAnalysisEnvironment() {
    console.log('🎙️ SPAWNING VOICE ANALYSIS ENVIRONMENT');
    console.log('═'.repeat(60));

    const windows = [
      {
        name: 'voice-main',
        title: 'Voice Analysis Main',
        command: 'npm run voice',
        description: 'Main voice analysis with Miltonian patterns',
        position: { x: 50, y: 50 }
      },
      {
        name: 'voice-sql',
        title: 'Voice SQL Monitor',
        command: 'watch -n 10 "clear && echo \\"🎙️ VOICE SQL MONITOR\\" && echo \\"═══════════════════\\" && npm run voice:query \\"SELECT COUNT(*) as total_calls, AVG(CAST(engagement_score AS REAL)) as avg_engagement FROM voice_calls WHERE created_at > datetime(\'now\', \'-24 hours\')\\" 2>/dev/null || echo \'Voice SQL monitor - waiting for voice data...\'"',
        description: 'Voice call analytics and engagement monitoring',
        position: { x: 750, y: 50 }
      },
      {
        name: 'transcript-monitor',
        title: 'Transcript Monitor',
        command: 'watch -n 15 "clear && echo \\"📝 TRANSCRIPT MONITOR\\" && echo \\"══════════════════\\" && npm run voice:query \\"SELECT call_id, duration, status, created_at FROM voice_calls ORDER BY created_at DESC LIMIT 8\\" 2>/dev/null || echo \'Transcript monitor - no recent calls\'"',
        description: 'Recent voice call transcript monitoring',
        position: { x: 400, y: 400 }
      }
    ];

    const results = [];
    
    for (const window of windows) {
      console.log(`🎙️ ${window.description}`);
      
      const result = await this.spawnTerminalWindow(window.name, window.command, {
        title: window.title,
        background: window.name !== 'voice-main',
        position: window.position
      });
      
      results.push({ ...window, ...result });
      await this.sleep(1000);
    }

    console.log('\n✅ Voice analysis environment spawned successfully!');
    console.log('\n📊 Windows created:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${status} ${result.title} at ${result.position?.x || 'auto'},${result.position?.y || 'auto'}`);
    });

    return results;
  }

  /**
   * Kill all spawned terminal windows (if possible)
   */
  async killAllSpawnedWindows() {
    console.log('🧹 Cleaning up spawned terminal windows...');
    
    // Note: OSA spawned terminals don't provide direct PID access
    // This is a best-effort cleanup that closes terminals by title
    for (const [windowName, info] of this.spawnedWindows) {
      try {
        const killCommand = `osascript -e "tell application \\"Terminal\\"
          set windowList to windows
          repeat with win in windowList
            if custom title of win is \\"${info.title}\\" then
              close win
            end if
          end repeat
        end tell"`;
        
        await this.execAsync(killCommand);
        console.log(`✅ Closed: ${info.title}`);
      } catch (error) {
        console.log(`⚠️  Could not close ${info.title}: ${error.message}`);
      }
    }
    
    this.spawnedWindows.clear();
  }

  /**
   * List currently tracked spawned windows
   */
  listSpawnedWindows() {
    if (this.spawnedWindows.size === 0) {
      console.log('📋 No spawned terminal windows tracked');
      return [];
    }

    console.log('📋 Spawned Terminal Windows:');
    const windows = [];
    
    for (const [windowName, info] of this.spawnedWindows) {
      const ageMinutes = Math.floor((Date.now() - info.spawned) / 60000);
      console.log(`   📱 ${info.title} (${ageMinutes}m ago)`);
      windows.push({ windowName, ...info, ageMinutes });
    }
    
    return windows;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if Terminal app is available
   */
  async checkTerminalAvailability() {
    try {
      await this.execAsync('osascript -e "tell application \\"Terminal\\" to get name"');
      return true;
    } catch (error) {
      console.error('❌ Terminal app not available:', error.message);
      return false;
    }
  }
}

module.exports = TerminalSpawner;