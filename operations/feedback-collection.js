/**
 * Feedback Collection Operation - Interactive feedback gathering
 */

class FeedbackCollectionOperation {
  constructor(projectPath, options = {}) {
    this.projectPath = projectPath;
    this.options = { enhanced: true, ...options };
  }

  async execute(options = {}) {
    console.log('📝 Starting feedback collection...');
    
    try {
      // Get feedback loop from options (passed by the engine)
      const feedbackLoop = options.feedbackLoop || this.options.feedbackLoop;
      
      if (!feedbackLoop) {
        throw new Error('Feedback loop not available');
      }
      
      // Collect interactive feedback
      await feedbackLoop.collectInteractiveFeedback();
      
      // Collect metrics-based feedback
      await feedbackLoop.collectMetricsFeedback();
      
      return {
        success: true,
        message: 'Feedback collection completed',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Feedback collection failed:', error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = FeedbackCollectionOperation;