/**
 * Business Planning Operation
 * 
 * Demonstrates the complete pattern:
 * - SQLite integration for data access
 * - Comprehensive context building
 * - REQUIRED: Claude CLI launch at the end
 */

const fs = require('fs').promises;
const path = require('path');
const SQLitePipeline = require('../lib/sqlite-pipeline');
const ClaudeLauncher = require('../lib/claude-launcher');

class BusinessPlanningOperation {
  constructor(projectPath, config = {}) {
    this.projectPath = projectPath;
    this.config = {
      enhanced: false,
      includeMetrics: true,
      includeKanban: true,
      includeFinancials: true,
      ...config
    };
    
    this.pipeline = null;
    this.launcher = new ClaudeLauncher();
  }

  async execute(params = {}) {
    console.log('📊 Business Planning Analysis Starting...');
    
    const startTime = Date.now();
    let success = false;
    
    try {
      // Step 1: Initialize SQLite pipeline
      this.pipeline = new SQLitePipeline(this.projectPath, {
        enableDaemon: false // Don't need daemons for one-time analysis
      });
      await this.pipeline.initialize();
      
      // Step 2: Gather business data
      const businessData = await this.gatherBusinessData();
      
      // Step 3: Analyze metrics and trends
      const analysis = await this.analyzeBusinessMetrics(businessData);
      
      // Step 4: Build comprehensive context
      const context = await this.buildBusinessContext(businessData, analysis);
      
      // Step 5: Generate strategic recommendations
      const recommendations = await this.generateRecommendations(context);
      
      // Step 6: Build final prompt
      const prompt = this.buildBusinessPrompt(context, recommendations);
      
      // Step 7: Save context for reference
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const contextFile = `logs/business-context-${timestamp}.json`;
      await this.writeFile(contextFile, JSON.stringify(context, null, 2));
      
      console.log(`   📄 Context saved: ${contextFile}`);
      console.log('🚀 Launching Claude with business planning context...\n');
      
      // Step 8: CRITICAL - Launch Claude CLI (REQUIRED!)
      await this.launcher.launch(prompt, {
        method: 'direct',
        operation: 'business-planning',
        projectPath: this.projectPath,
        context: {
          enhanced: this.config.enhanced,
          contextFile,
          dataPoints: Object.keys(businessData).length,
          recommendations: recommendations.length
        }
      });
      
      success = true;
      
      // Track operation success
      const duration = Date.now() - startTime;
      await this.pipeline.trackOperation('business-planning', duration, success, {
        enhanced: this.config.enhanced,
        dataPoints: Object.keys(businessData).length
      });
      
      return {
        success: true,
        contextFile,
        launched: true,
        message: 'Claude launched with business planning context'
      };
      
    } catch (error) {
      console.error('❌ Business Planning failed:', error.message);
      return { success: false, error: error.message };
    } finally {
      // Cleanup
      if (this.pipeline) {
        await this.pipeline.shutdown();
      }
    }
  }

  async gatherBusinessData() {
    console.log('📈 Gathering business data...');
    
    const data = {
      users: await this.getUserMetrics(),
      engagement: await this.getEngagementMetrics(),
      revenue: await this.getRevenueMetrics(),
      growth: await this.getGrowthMetrics(),
      retention: await this.getRetentionMetrics(),
      kanban: await this.getKanbanStatus(),
      competition: await this.getCompetitiveAnalysis(),
      market: await this.getMarketTrends()
    };
    
    // Use SQLite for additional metrics if available
    if (this.pipeline) {
      try {
        // Get performance metrics from logs
        const perfMetrics = await this.pipeline.query(`
          SELECT 
            AVG(performance_ms) as avg_performance,
            COUNT(*) as total_operations,
            SUM(CASE WHEN performance_ms < 3000 THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
          FROM logs
          WHERE category = 'NUCLEAR' AND performance_ms IS NOT NULL
          AND timestamp > datetime('now', '-7 days')
        `);
        
        data.performance = perfMetrics[0];
        
        // Get recent errors
        const errors = await this.pipeline.query(`
          SELECT COUNT(*) as error_count, category
          FROM logs
          WHERE level = 'ERROR'
          AND timestamp > datetime('now', '-24 hours')
          GROUP BY category
          ORDER BY error_count DESC
        `);
        
        data.errors = errors;
        
      } catch (error) {
        console.log('   ⚠️ Could not fetch SQLite metrics:', error.message);
      }
    }
    
    console.log(`   ✅ Gathered ${Object.keys(data).length} data categories`);
    return data;
  }

  async analyzeBusinessMetrics(data) {
    console.log('🔍 Analyzing business metrics...');
    
    const analysis = {
      health: this.calculateBusinessHealth(data),
      trends: this.identifyTrends(data),
      opportunities: this.identifyOpportunities(data),
      risks: this.identifyRisks(data),
      kpis: this.calculateKPIs(data)
    };
    
    return analysis;
  }

  async buildBusinessContext(data, analysis) {
    console.log('🏗️  Building business context...');
    
    const context = {
      timestamp: new Date().toISOString(),
      project: 'ThetaDriven Coach',
      description: 'AI-driven coaching platform with Un-Robocall technology',
      
      currentState: {
        users: data.users,
        engagement: data.engagement,
        revenue: data.revenue,
        performance: data.performance
      },
      
      analysis: analysis,
      
      priorities: await this.loadPriorities(),
      
      recentAchievements: await this.getRecentAchievements(),
      
      competitiveLandscape: data.competition,
      
      marketPosition: data.market
    };
    
    return context;
  }

  async generateRecommendations(context) {
    console.log('💡 Generating strategic recommendations...');
    
    const recommendations = [];
    
    // Performance-based recommendations
    if (context.currentState.performance?.success_rate < 90) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        title: 'Optimize Nuclear Email Performance',
        description: 'Nuclear triggers are exceeding 3s target',
        action: 'Review and optimize email trigger pipeline'
      });
    }
    
    // Growth recommendations
    if (context.analysis.trends.userGrowth < 0.1) {
      recommendations.push({
        priority: 'high',
        category: 'growth',
        title: 'Accelerate User Acquisition',
        description: 'User growth is below 10% target',
        action: 'Implement referral program and content marketing'
      });
    }
    
    // Engagement recommendations
    if (context.currentState.engagement?.avgSessionTime < 300) {
      recommendations.push({
        priority: 'medium',
        category: 'engagement',
        title: 'Improve User Engagement',
        description: 'Average session time is below 5 minutes',
        action: 'Enhance voice call sophistication and email personalization'
      });
    }
    
    return recommendations;
  }

  buildBusinessPrompt(context, recommendations) {
    return `You are conducting strategic business planning for ThetaDriven Coach.

# Business Context

## Company Overview
ThetaDriven Coach - AI-driven coaching platform implementing the "Un-Robocall" concept
- **Technology**: Next.js 15, TypeScript, Supabase, AI (Grok/Gemini)
- **Innovation**: Nuclear email system, Miltonian voice calls, FIM technology
- **Status**: ${context.analysis.health.status}

## Current Metrics
${JSON.stringify(context.currentState, null, 2)}

## Business Analysis
${JSON.stringify(context.analysis, null, 2)}

## Strategic Recommendations
${recommendations.map(r => `- [${r.priority.toUpperCase()}] ${r.title}: ${r.action}`).join('\n')}

## Market Position
${JSON.stringify(context.marketPosition, null, 2)}

## Your Tasks

1. **Strategic Analysis**
   - Review current business metrics and KPIs
   - Identify key growth opportunities
   - Assess competitive threats
   - Evaluate market timing

2. **Quarterly Planning**
   - Define top 3 priorities for next quarter
   - Set measurable OKRs
   - Allocate resources effectively
   - Plan key milestones

3. **Revenue Optimization**
   - Analyze pricing strategy
   - Identify upsell opportunities
   - Review conversion funnel
   - Suggest monetization improvements

4. **Risk Mitigation**
   - Identify top 3 business risks
   - Develop contingency plans
   - Review burn rate and runway
   - Suggest defensive strategies

5. **Action Items**
   - Create specific, actionable next steps
   - Prioritize using effort/impact matrix
   - Assign to kanban board (npm run kanban)
   - Set deadlines and success metrics

## Available Commands
- npm run kanban - Manage task board
- npm run query "SQL" - Query business data
- npm run metrics - View real-time metrics
- npm run voice - Analyze voice system
- npm run improve - Improve codebase

Focus on data-driven decisions and actionable outcomes. Be specific about next steps.`;
  }

  // Utility methods
  async writeFile(filePath, content) {
    const fullPath = path.join(this.projectPath, filePath);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content);
  }

  // Placeholder methods for data gathering
  async getUserMetrics() {
    return {
      total: 1250,
      active: 340,
      new_this_week: 45,
      churn_rate: 0.05
    };
  }

  async getEngagementMetrics() {
    return {
      avgSessionTime: 420,
      dailyActiveUsers: 180,
      weeklyActiveUsers: 340,
      emailOpenRate: 0.42,
      voiceCallCompletion: 0.78
    };
  }

  async getRevenueMetrics() {
    return {
      mrr: 12500,
      arr: 150000,
      avgRevenuePerUser: 10,
      ltv: 240
    };
  }

  async getGrowthMetrics() {
    return {
      userGrowthRate: 0.15,
      revenueGrowthRate: 0.22,
      viralCoefficient: 0.4
    };
  }

  async getRetentionMetrics() {
    return {
      day1: 0.75,
      day7: 0.45,
      day30: 0.32,
      day90: 0.28
    };
  }

  async getKanbanStatus() {
    // Would integrate with actual kanban.db
    return {
      todo: 12,
      in_progress: 3,
      done: 45,
      blocked: 2
    };
  }

  async getCompetitiveAnalysis() {
    return {
      direct_competitors: 3,
      indirect_competitors: 7,
      market_share: 0.02,
      differentiation: 'AI sophistication, nuclear timing, embodiment focus'
    };
  }

  async getMarketTrends() {
    return {
      market_size: 2.5e9,
      growth_rate: 0.28,
      adoption_stage: 'early_adopters',
      key_trends: ['AI coaching', 'async communication', 'embodied cognition']
    };
  }

  async loadPriorities() {
    return [
      'Scale voice call system to 1000 daily calls',
      'Improve nuclear email timing to <2s consistently',
      'Launch premium tier with advanced Miltonian patterns',
      'Expand to B2B coaching platform'
    ];
  }

  async getRecentAchievements() {
    return [
      'Launched Miltonian voice system',
      'Achieved <3s nuclear email timing',
      'Reached 1000+ users',
      'Integrated FIM technology'
    ];
  }

  calculateBusinessHealth(data) {
    const score = (
      (data.users.active / data.users.total) * 0.3 +
      data.engagement.emailOpenRate * 0.2 +
      data.retention.day30 * 0.3 +
      (data.revenue.mrr > 10000 ? 1 : data.revenue.mrr / 10000) * 0.2
    ) * 100;
    
    return {
      score: Math.round(score),
      status: score > 70 ? 'healthy' : score > 40 ? 'moderate' : 'needs attention'
    };
  }

  identifyTrends(data) {
    return {
      userGrowth: data.growth.userGrowthRate,
      revenueGrowth: data.growth.revenueGrowthRate,
      engagementTrend: 'stable',
      retentionTrend: 'improving'
    };
  }

  identifyOpportunities(data) {
    return [
      'Voice call sophistication can increase engagement',
      'B2B market expansion opportunity',
      'Premium tier for power users'
    ];
  }

  identifyRisks(data) {
    return [
      'Dependency on AI API providers',
      'Competition from established players',
      'User privacy concerns with AI coaching'
    ];
  }

  calculateKPIs(data) {
    return {
      cac: 25,
      ltv_cac_ratio: data.revenue.ltv / 25,
      burn_rate: 15000,
      runway_months: 18,
      growth_efficiency: data.growth.revenueGrowthRate / (15000 / data.revenue.mrr)
    };
  }
}

module.exports = BusinessPlanningOperation;