#!/bin/bash

# CCS Repository Setup Script
# This script initializes the CCS repository

echo "🚀 Setting up CCS repository..."

# Initialize git repository
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: CCS (Claude Context System) v1.0.0

CCS enhances Claude CLI with:
- Always launches Claude with full context
- SQLite-powered intelligence for fast queries
- Interactive questions - Claude can ask back
- Learning system that improves over time
- 5 built-in operations for common workflows

Built from months of real-world usage at ThetaDriven Coach."

# Add remote origin
git remote add origin https://github.com/wiber/ccs.git

# Create main branch (in case default is master)
git branch -M main

echo "✅ Repository initialized!"
echo ""
echo "Next steps:"
echo "1. Push to GitHub:"
echo "   git push -u origin main"
echo ""
echo "2. Create GitHub release:"
echo "   - Go to https://github.com/wiber/ccs/releases/new"
echo "   - Tag: v1.0.0"
echo "   - Title: CCS v1.0.0 - Initial Release"
echo "   - Use the release notes from CHANGELOG.md"
echo ""
echo "3. Publish to npm:"
echo "   npm login"
echo "   npm publish --access public"
echo ""
echo "4. Update repository settings on GitHub:"
echo "   - Add description"
echo "   - Add topics/tags"
echo "   - Enable issues, discussions"
echo "   - Add branch protection rules"