/**
 * Enhanced Voice Analysis Operation
 * 
 * More robust version of existing claude-voice-analyzer.js with:
 * - Better Supabase integration and error handling
 * - Enhanced Miltonian pattern analysis
 * - Sophisticated prompt generation
 * - Voice transcript management
 */

const fs = require('fs').promises;
const path = require('path');

class VoiceAnalysisOperation {
  constructor(projectPath, config = {}) {
    this.projectPath = projectPath;
    this.config = {
      enhanced: false,
      includeTranscripts: true,
      miltonianAnalysis: true,
      promptOptimization: true,
      ...config
    };
    
    this.transcripts = [];
    this.miltonianPatterns = [];
    this.voiceMetrics = {};
    this.supabaseClient = null;
  }

  async execute(params = {}) {
    console.log('🎤 Enhanced Voice Analysis Starting...');
    
    if (params.enhanced) {
      this.config.enhanced = true;
      console.log('   ✅ Enhanced voice analysis mode enabled');
    }

    try {
      // Step 1: Initialize enhanced Supabase connection
      await this.initializeSupabase();
      
      // Step 2: Collect voice data comprehensively
      const voiceData = await this.collectVoiceDataEnhanced();
      
      // Step 3: Analyze Miltonian patterns
      const miltonianAnalysis = await this.analyzeMiltonianPatterns(voiceData);
      
      // Step 4: Build enhanced voice context
      const context = await this.buildVoiceContext(voiceData, miltonianAnalysis);
      
      // Step 5: Generate optimized analysis
      const result = await this.generateVoiceAnalysis(context);
      
      // Step 6: Store results and recommendations
      await this.storeVoiceResults(result);
      
      return {
        success: true,
        transcripts: this.transcripts.length,
        miltonianPatterns: this.miltonianPatterns.length,
        analysisFile: result.outputFile,
        recommendations: result.recommendations
      };
      
    } catch (error) {
      console.error('❌ Enhanced Voice Analysis failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async initializeSupabase() {
    console.log('🔌 Initializing enhanced Supabase connection...');
    
    try {
      // Load environment with better error handling
      require('dotenv').config({ path: path.join(this.projectPath, '.env.local') });
      
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Supabase credentials not found in environment');
      }
      
      const { createClient } = require('@supabase/supabase-js');
      this.supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      // Test connection
      const { data, error } = await this.supabaseClient
        .from('voice_calls')
        .select('id')
        .limit(1);
        
      if (error) {
        console.log('   ⚠️ Supabase connection test warning:', error.message);
      } else {
        console.log('   ✅ Supabase connection verified');
      }
      
    } catch (error) {
      console.log('   ⚠️ Supabase initialization warning:', error.message);
      console.log('   📋 Continuing with file-based voice analysis...');
    }
  }

  async collectVoiceDataEnhanced() {
    console.log('🎭 Collecting enhanced voice data...');
    
    const voiceData = {
      transcripts: await this.fetchVoiceTranscriptsEnhanced(),
      callMetrics: await this.getVoiceCallMetrics(),
      blandSettings: await this.getBlandAISettings(),
      voicePrompts: await this.getVoicePrompts(),
      recentCalls: await this.getRecentVoiceCalls(),
      userFeedback: await this.getUserVoiceFeedback()
    };
    
    console.log(`   📞 Found ${voiceData.transcripts.length} voice transcripts`);
    console.log(`   📊 Call metrics: ${Object.keys(voiceData.callMetrics).length} metrics`);
    console.log(`   🎯 Voice prompts: ${voiceData.voicePrompts.length} prompts`);
    
    return voiceData;
  }

  async fetchVoiceTranscriptsEnhanced() {
    console.log('   📝 Fetching voice transcripts with enhanced processing...');
    
    const transcripts = [];
    
    try {
      // Method 1: Supabase direct query (enhanced)
      if (this.supabaseClient) {
        const { data, error } = await this.supabaseClient
          .from('voice_calls')
          .select(`
            id,
            user_id,
            transcript,
            call_duration,
            call_status,
            created_at,
            bland_call_id,
            call_metadata
          `)
          .not('transcript', 'is', null)
          .order('created_at', { ascending: false })
          .limit(50);
          
        if (data && !error) {
          transcripts.push(...data.map(call => ({
            ...call,
            source: 'supabase',
            enhanced: true
          })));
        }
      }
      
      // Method 2: File-based transcript collection (inherit existing)
      const transcriptFiles = await this.findTranscriptFiles();
      for (const file of transcriptFiles) {
        try {
          const content = await this.readFile(file);
          const parsed = JSON.parse(content);
          
          if (Array.isArray(parsed)) {
            transcripts.push(...parsed.map(t => ({
              ...t,
              source: 'file',
              file: file
            })));
          }
        } catch (error) {
          console.log(`   ⚠️ Could not parse transcript file ${file}:`, error.message);
        }
      }
      
      // Method 3: Bland AI direct API (if available)
      if (process.env.BLAND_API_KEY) {
        const blandTranscripts = await this.fetchFromBlandAPI();
        transcripts.push(...blandTranscripts);
      }
      
    } catch (error) {
      console.log('   ⚠️ Transcript collection warning:', error.message);
    }
    
    // Remove duplicates and enhance
    this.transcripts = this.deduplicateTranscripts(transcripts);
    return this.transcripts;
  }

  async analyzeMiltonianPatterns(voiceData) {
    console.log('🎭 Analyzing Miltonian patterns in voice data...');
    
    const patterns = {
      scales: [],
      embodimentHooks: [],
      incompleteThoughts: [],
      metaphors: [],
      indirectSuggestions: [],
      portalLanguage: []
    };
    
    for (const transcript of voiceData.transcripts) {
      if (!transcript.transcript) continue;
      
      const text = transcript.transcript;
      
      // Enhanced pattern detection
      patterns.scales.push(...this.detectScalePatterns(text));
      patterns.embodimentHooks.push(...this.detectEmbodimentHooks(text));
      patterns.incompleteThoughts.push(...this.detectIncompleteThoughts(text));
      patterns.metaphors.push(...this.detectMetaphors(text));
      patterns.indirectSuggestions.push(...this.detectIndirectSuggestions(text));
      patterns.portalLanguage.push(...this.detectPortalLanguage(text));
    }
    
    // Calculate pattern effectiveness
    patterns.effectiveness = await this.calculatePatternEffectiveness(patterns);
    
    this.miltonianPatterns = patterns;
    
    console.log(`   📊 Pattern analysis complete:`);
    console.log(`      🎯 Scales: ${patterns.scales.length}`);
    console.log(`      🪝 Embodiment hooks: ${patterns.embodimentHooks.length}`);
    console.log(`      💭 Incomplete thoughts: ${patterns.incompleteThoughts.length}`);
    console.log(`      🌊 Metaphors: ${patterns.metaphors.length}`);
    
    return patterns;
  }

  async buildVoiceContext(voiceData, miltonianAnalysis) {
    console.log('🔨 Building comprehensive voice context...');
    
    const context = {
      timestamp: new Date().toISOString(),
      purpose: 'Enhanced Voice & Miltonian Embodiment Analysis',
      
      // Inherit project info from existing structure
      projectInfo: {
        name: 'ThetaDriven Coach',
        description: 'AI-driven coaching with sophisticated voice embodiment',
        voiceProvider: 'Bland AI',
        languagePattern: 'Miltonian (Milton Erickson inspired)',
        enhanced: this.config.enhanced
      },
      
      // Voice data summary
      voiceDataSummary: {
        transcriptCount: voiceData.transcripts.length,
        totalCallDuration: this.calculateTotalDuration(voiceData.transcripts),
        avgCallDuration: this.calculateAvgDuration(voiceData.transcripts),
        successRate: this.calculateSuccessRate(voiceData.transcripts),
        recentCallsCount: voiceData.recentCalls?.length || 0
      },
      
      // Miltonian analysis
      miltonianAnalysis: {
        patterns: miltonianAnalysis,
        sophisticationLevel: this.calculateSophisticationLevel(miltonianAnalysis),
        recommendations: this.generateMiltonianRecommendations(miltonianAnalysis)
      },
      
      // Voice quality metrics
      voiceMetrics: {
        clarity: await this.assessVoiceClarity(voiceData),
        engagement: await this.assessEngagement(voiceData),
        conversion: await this.assessConversion(voiceData),
        embodiment: await this.assessEmbodiment(voiceData)
      },
      
      // Enhanced documentation context
      styleGuides: await this.loadVoiceStyleGuides(),
      voiceDocumentation: await this.loadVoiceDocumentation(),
      
      // Recent improvements and learnings
      recentLearnings: await this.getRecentVoiceLearnings(),
      improvementAreas: this.identifyImprovementAreas(miltonianAnalysis)
    };
    
    return context;
  }

  async generateVoiceAnalysis(context) {
    console.log('🧠 Generating enhanced voice analysis...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = `logs/enhanced-voice-analysis-${timestamp}.md`;
    
    // Build comprehensive analysis prompt
    const prompt = this.buildVoiceAnalysisPrompt(context);
    
    // Generate insights and recommendations
    const insights = await this.generateVoiceInsights(context);
    const recommendations = await this.generateVoiceRecommendations(context);
    
    // Save context for reference
    const contextFile = `logs/voice-context-${timestamp}.json`;
    await this.writeFile(contextFile, JSON.stringify(context, null, 2));
    
    // Save prompt for reference
    const promptFile = `logs/voice-prompt-${timestamp}.md`;
    await this.writeFile(promptFile, prompt);
    
    console.log(`   📄 Analysis prepared: ${outputFile}`);
    console.log(`   📋 Context saved: ${contextFile}`);
    console.log('🚀 Launching Claude with voice analysis...');
    
    // CRITICAL: Launch Claude in the same terminal
    const ClaudeLauncher = require('../lib/claude-launcher');
    const launcher = new ClaudeLauncher();
    
    await launcher.launch(prompt, {
      method: 'direct',
      operation: 'voice-analysis',
      projectPath: this.projectPath,
      context: {
        enhanced: this.config.enhanced,
        contextFile,
        promptFile,
        outputFile,
        operation: 'voice-analysis',
        transcriptCount: this.transcripts.length,
        miltonianPatterns: this.miltonianPatterns.length
      }
    });
    
    const result = {
      outputFile,
      prompt,
      insights,
      recommendations,
      context: context,
      launched: true,
      message: 'Claude launched with voice analysis context'
    };
    
    return result;
  }

  buildVoiceAnalysisPrompt(context) {
    return `
# Enhanced ThetaDriven Coach Voice Analysis

You are analyzing the sophisticated voice calling system with enhanced Miltonian pattern recognition and embodiment assessment.

## System Overview
${JSON.stringify(context.projectInfo, null, 2)}

## Voice Data Summary
${JSON.stringify(context.voiceDataSummary, null, 2)}

## Miltonian Pattern Analysis
${JSON.stringify(context.miltonianAnalysis, null, 2)}

## Voice Quality Metrics
${JSON.stringify(context.voiceMetrics, null, 2)}

## Recent Transcripts (Sample)
${this.formatTranscriptSample(context)}

## Style Guide Context
${this.formatStyleGuideContext(context.styleGuides)}

## Recent Learnings
${this.formatRecentLearnings(context.recentLearnings)}

## Analysis Request

Please provide comprehensive analysis focusing on:

1. **Miltonian Mastery Assessment**
   - Current sophistication level (Level 1-3 scale)
   - Pattern effectiveness analysis
   - Areas for sophisticated enhancement

2. **Embodiment Quality Review**
   - Scale question effectiveness (0-9 patterns)
   - Metaphor resonance analysis  
   - Incomplete thought mastery

3. **Voice Call Optimization**
   - Prompt effectiveness for Bland AI
   - Conversation flow improvements
   - User engagement enhancement

4. **Pattern Recognition Insights**
   - Most effective embodiment hooks
   - Successful metaphor categories
   - Portal language opportunities

5. **Actionable Recommendations**
   - Specific prompt improvements
   - New metaphor suggestions
   - Embodiment question refinements

Focus on sophisticated language patterns that create natural discovery experiences rather than directive coaching.

## Voice Files Analyzed
- Transcripts: ${context.voiceDataSummary.transcriptCount}
- Total Duration: ${context.voiceDataSummary.totalCallDuration} minutes
- Success Rate: ${context.voiceDataSummary.successRate}%
`;
  }

  // Pattern detection methods
  detectScalePatterns(text) {
    const scaleRegex = /scale.*?(\d+(?:-\d+)?)/gi;
    const matches = [...text.matchAll(scaleRegex)];
    return matches.map(match => ({
      pattern: match[0],
      scale: match[1],
      context: this.getContext(text, match.index, 50)
    }));
  }

  detectEmbodimentHooks(text) {
    const hooks = [
      /you already (sense|know|feel)/gi,
      /that.*?you're.*?(naturally|already)/gi,
      /notice how/gi,
      /can feel/gi
    ];
    
    const results = [];
    hooks.forEach(regex => {
      const matches = [...text.matchAll(regex)];
      results.push(...matches.map(match => ({
        pattern: match[0],
        type: 'embodiment_hook',
        context: this.getContext(text, match.index, 50)
      })));
    });
    
    return results;
  }

  detectIncompleteThoughts(text) {
    const patterns = [
      /\.\.\./g,
      /that.*?you.*?\.\.\./gi,
      /when you.*?\.\.\./gi
    ];
    
    const results = [];
    patterns.forEach(regex => {
      const matches = [...text.matchAll(regex)];
      results.push(...matches.map(match => ({
        pattern: match[0],
        type: 'incomplete_thought',
        context: this.getContext(text, match.index, 100)
      })));
    });
    
    return results;
  }

  detectMetaphors(text) {
    const metaphorPatterns = [
      /chess grandmasters/gi,
      /sailing/gi,
      /cooking/gi,
      /music/gi,
      /jiu-jitsu/gi
    ];
    
    const results = [];
    metaphorPatterns.forEach(regex => {
      const matches = [...text.matchAll(regex)];
      results.push(...matches.map(match => ({
        pattern: match[0],
        type: 'metaphor',
        context: this.getContext(text, match.index, 100)
      })));
    });
    
    return results;
  }

  detectIndirectSuggestions(text) {
    // Implementation for indirect suggestion detection
    return [];
  }

  detectPortalLanguage(text) {
    // Implementation for portal language detection
    return [];
  }

  // Utility methods
  getContext(text, index, length) {
    const start = Math.max(0, index - length);
    const end = Math.min(text.length, index + length);
    return text.slice(start, end);
  }

  async findTranscriptFiles() {
    try {
      const files = await fs.readdir(path.join(this.projectPath, 'logs'));
      return files
        .filter(f => f.includes('voice-transcripts-') && f.endsWith('.json'))
        .map(f => `logs/${f}`);
    } catch (error) {
      return [];
    }
  }

  async readFile(filePath) {
    try {
      return await fs.readFile(path.join(this.projectPath, filePath), 'utf-8');
    } catch (error) {
      return '';
    }
  }

  async writeFile(filePath, content) {
    try {
      const fullPath = path.join(this.projectPath, filePath);
      const dir = path.dirname(fullPath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(fullPath, content);
    } catch (error) {
      console.error(`Failed to write file ${filePath}:`, error.message);
    }
  }

  deduplicateTranscripts(transcripts) {
    const seen = new Set();
    return transcripts.filter(t => {
      const key = t.id || t.bland_call_id || t.transcript?.slice(0, 100);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Placeholder implementations for missing methods
  async getVoiceCallMetrics() { return {}; }
  async getBlandAISettings() { return {}; }
  async getVoicePrompts() { return []; }
  async getRecentVoiceCalls() { return []; }
  async getUserVoiceFeedback() { return []; }
  async fetchFromBlandAPI() { return []; }
  async calculatePatternEffectiveness() { return 0; }
  calculateTotalDuration(transcripts) { return 0; }
  calculateAvgDuration(transcripts) { return 0; }
  calculateSuccessRate(transcripts) { return 0; }
  calculateSophisticationLevel() { return 'Level 1'; }
  generateMiltonianRecommendations() { return []; }
  async assessVoiceClarity() { return 0; }
  async assessEngagement() { return 0; }
  async assessConversion() { return 0; }
  async assessEmbodiment() { return 0; }
  async loadVoiceStyleGuides() { return {}; }
  async loadVoiceDocumentation() { return {}; }
  async getRecentVoiceLearnings() { return []; }
  identifyImprovementAreas() { return []; }
  async generateVoiceInsights() { return {}; }
  async generateVoiceRecommendations() { return []; }
  formatTranscriptSample() { return ''; }
  formatStyleGuideContext() { return ''; }
  formatRecentLearnings() { return ''; }
  async storeVoiceResults() { return; }
}

module.exports = VoiceAnalysisOperation;