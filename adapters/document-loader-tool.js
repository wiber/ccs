const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

/**
 * Document Loader Tool - Loads and processes documentation files
 */
class DocumentLoaderTool {
  constructor(options = {}) {
    this.projectPath = options.projectPath || process.cwd();
    this.maxFileSize = options.maxFileSize || 100000; // 100KB per file
    this.maxTotalSize = options.maxTotalSize || 1000000; // 1MB total
  }

  async execute(params, context) {
    console.log('📚 Loading documents...');
    
    const patterns = params.patterns || this.getDefaultPatterns(context);
    const category = params.category || 'all';
    
    const documents = {};
    let totalSize = 0;
    let filesProcessed = 0;
    
    for (const pattern of patterns) {
      try {
        const files = await glob(pattern, { 
          cwd: this.projectPath,
          ignore: ['node_modules/**', '.git/**', '**/*.log']
        });
        
        for (const file of files) {
          if (totalSize >= this.maxTotalSize) {
            console.log(`⚠️  Reached total size limit (${this.maxTotalSize} bytes), skipping remaining files`);
            break;
          }

          const docData = await this.loadDocument(file, category);
          if (docData) {
            documents[file] = docData;
            totalSize += docData.size;
            filesProcessed++;
          }
        }
      } catch (error) {
        console.warn(`⚠️  Could not process pattern '${pattern}': ${error.message}`);
      }
    }

    const summary = {
      totalFiles: filesProcessed,
      totalSize,
      categories: this.categorizeDocuments(documents),
      loadedAt: new Date().toISOString()
    };

    console.log(`✅ Loaded ${filesProcessed} documents (${Math.round(totalSize / 1024)}KB)`);

    return {
      documents,
      summary
    };
  }

  async loadDocument(filePath, filterCategory) {
    try {
      const fullPath = path.resolve(this.projectPath, filePath);
      const stats = await fs.stat(fullPath);
      
      // Skip if file is too large
      if (stats.size > this.maxFileSize) {
        console.log(`⚠️  Skipping large file: ${filePath} (${Math.round(stats.size / 1024)}KB)`);
        return null;
      }

      const content = await fs.readFile(fullPath, 'utf-8');
      const category = this.categorizeDocument(filePath, content);
      
      // Filter by category if specified
      if (filterCategory !== 'all' && category !== filterCategory) {
        return null;
      }

      // Extract metadata
      const metadata = this.extractMetadata(filePath, content);
      
      return {
        path: filePath,
        category,
        size: stats.size,
        lastModified: stats.mtime,
        content: this.truncateContent(content),
        metadata,
        summary: this.generateSummary(content, filePath)
      };
      
    } catch (error) {
      console.warn(`⚠️  Could not load document: ${filePath} - ${error.message}`);
      return null;
    }
  }

  categorizeDocument(filePath, content) {
    const fileName = path.basename(filePath).toLowerCase();
    const extension = path.extname(filePath).toLowerCase();
    const contentLower = content.toLowerCase();

    // Business documents
    if (this.matchesPatterns(fileName, ['business', 'plan', 'strategy', 'canvas', 'investment', 'patent'])) {
      return 'business';
    }

    // Technical documentation
    if (this.matchesPatterns(fileName, ['readme', 'api', 'technical', 'architecture', 'setup'])) {
      return 'technical';
    }

    // Project documentation
    if (fileName === 'claude.md' || fileName.includes('project')) {
      return 'project';
    }

    // Configuration
    if (extension === '.json' || extension === '.yml' || extension === '.yaml') {
      return 'configuration';
    }

    // Legal/compliance
    if (this.matchesPatterns(fileName, ['legal', 'license', 'terms', 'privacy', 'compliance'])) {
      return 'legal';
    }

    // Marketing/content
    if (this.matchesPatterns(fileName, ['marketing', 'content', 'copy', 'messaging'])) {
      return 'marketing';
    }

    // Analysis/reports
    if (this.matchesPatterns(fileName, ['analysis', 'report', 'insights', 'metrics'])) {
      return 'analysis';
    }

    // Check content for business keywords
    if (this.hasBusinessContent(contentLower)) {
      return 'business';
    }

    return 'general';
  }

  matchesPatterns(text, patterns) {
    return patterns.some(pattern => text.includes(pattern));
  }

  hasBusinessContent(content) {
    const businessKeywords = [
      'revenue', 'market', 'customer', 'strategy', 'investment', 'funding',
      'business model', 'competitive', 'value proposition', 'monetization',
      'pricing', 'partnerships', 'stakeholder', 'roi', 'kpi'
    ];

    return businessKeywords.some(keyword => content.includes(keyword));
  }

  extractMetadata(filePath, content) {
    const metadata = {
      wordCount: content.split(/\s+/).length,
      lineCount: content.split('\n').length,
      hasCodeBlocks: /```/.test(content),
      hasTables: /\|.*\|/.test(content),
      hasLinks: /\[.*\]\(.*\)/.test(content),
      hasImages: /!\[.*\]\(.*\)/.test(content)
    };

    // Extract frontmatter if present
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      metadata.hasFrontmatter = true;
      try {
        const yaml = require('yaml');
        metadata.frontmatter = yaml.parse(frontmatterMatch[1]);
      } catch (error) {
        metadata.frontmatter = { error: 'Could not parse frontmatter' };
      }
    }

    // Extract headers
    const headers = content.match(/^#+\s+(.+)$/gm) || [];
    metadata.headers = headers.map(h => h.replace(/^#+\s+/, ''));

    return metadata;
  }

  generateSummary(content, filePath) {
    const lines = content.split('\n');
    const firstParagraph = lines.find(line => line.trim().length > 50) || '';
    
    // Extract key points
    const keyPoints = [];
    
    // Look for bullet points
    const bulletPoints = content.match(/^[\s]*[-*+]\s+(.+)$/gm) || [];
    keyPoints.push(...bulletPoints.slice(0, 3).map(point => point.replace(/^[\s]*[-*+]\s+/, '')));
    
    // Look for numbered points
    const numberedPoints = content.match(/^\d+\.\s+(.+)$/gm) || [];
    keyPoints.push(...numberedPoints.slice(0, 3).map(point => point.replace(/^\d+\.\s+/, '')));

    return {
      firstParagraph: firstParagraph.substring(0, 200),
      keyPoints: keyPoints.slice(0, 5),
      estimatedReadingTime: Math.ceil(content.split(/\s+/).length / 200) // 200 words per minute
    };
  }

  truncateContent(content) {
    // Keep first portion and important sections
    const lines = content.split('\n');
    
    if (lines.length <= 100) {
      return content;
    }

    // Take first 50 lines and last 20 lines, plus any sections with headers
    const importantLines = [
      ...lines.slice(0, 50),
      '\n... [content truncated] ...\n',
      ...lines.slice(-20)
    ];

    // Add any lines with headers that we might have missed
    const headerLines = lines.filter(line => /^#+\s+/.test(line));
    if (headerLines.length > 0) {
      importantLines.push('\n... [headers found] ...\n', ...headerLines);
    }

    return importantLines.join('\n');
  }

  categorizeDocuments(documents) {
    const categories = {};
    
    for (const doc of Object.values(documents)) {
      const category = doc.category;
      if (!categories[category]) {
        categories[category] = {
          count: 0,
          totalSize: 0,
          files: []
        };
      }
      
      categories[category].count++;
      categories[category].totalSize += doc.size;
      categories[category].files.push(doc.path);
    }

    return categories;
  }

  getDefaultPatterns(context) {
    // Start with project-specific patterns from context
    let patterns = [];
    
    if (context.project?.documentationFolders) {
      patterns.push(...context.project.documentationFolders.map(folder => `${folder}/**/*.md`));
    }

    // Add common documentation patterns
    patterns.push(
      '*.md',
      'docs/**/*.md',
      'documentation/**/*.md',
      'README*',
      'CHANGELOG*',
      'LICENSE*',
      '**/*.txt'
    );

    // Add business-specific patterns
    patterns.push(
      'business/**/*',
      'plans/**/*',
      'strategy/**/*',
      '**/business-plan*',
      '**/strategy*',
      '**/canvas*'
    );

    // Remove duplicates
    return [...new Set(patterns)];
  }
}

module.exports = DocumentLoaderTool;