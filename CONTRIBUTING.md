# Contributing to CCS

Thank you for your interest in contributing to CCS! We value contributions from developers who understand the importance of context-aware AI assistance.

## How to Contribute

### 1. Reporting Issues
- Use GitHub Issues to report bugs
- Include your environment details (OS, Node version, CCS version)
- Provide steps to reproduce the issue
- Share relevant logs or error messages

### 2. Suggesting Features
- Open a GitHub Issue with the `enhancement` label
- Describe the problem your feature solves
- Explain your proposed solution
- Share any alternative approaches you've considered

### 3. Code Contributions

#### Getting Started
1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/ccs.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `npm install`
5. Run tests: `npm test`

#### Development Guidelines
- **Always Launch Claude**: Every operation must end with launching Claude CLI
- **Context is King**: Ensure operations build comprehensive context
- **Test Your Code**: Add tests for new functionality
- **Document Changes**: Update relevant documentation
- **Follow Code Style**: Match the existing code style

#### Commit Messages
Use clear, descriptive commit messages:
- `feat: add kanban operation for task management`
- `fix: resolve SQLite connection timeout`
- `docs: update voice-analysis operation guide`
- `test: add tests for claude-launcher`

#### Pull Request Process
1. Ensure all tests pass: `npm test`
2. Update documentation if needed
3. Add your changes to CHANGELOG.md
4. Submit a pull request with a clear description
5. Link any related issues

### 4. Creating New Operations

Operations are the heart of CCS. When creating a new operation:

1. Follow the existing pattern in `operations/`
2. Ensure it ends with `launcher.launch(prompt)`
3. Build rich context before launching Claude
4. Support interactive questions when appropriate
5. Add tests and documentation

Example structure:
```javascript
class MyOperation {
  async execute(params) {
    // 1. Gather context
    const context = await this.buildContext();
    
    // 2. Analyze data
    const analysis = await this.analyze(context);
    
    // 3. Build prompt
    const prompt = this.buildPrompt(analysis);
    
    // 4. ALWAYS launch Claude
    await this.launcher.launch(prompt, {
      operation: 'my-operation',
      questions: ['What should I focus on?']
    });
  }
}
```

## Code of Conduct

### Our Standards
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on what's best for the community
- Show empathy towards other community members

### Unacceptable Behavior
- Harassment or discrimination
- Trolling or insulting comments
- Public or private harassment
- Publishing others' private information

## Questions?

Feel free to:
- Open a GitHub Issue
- Start a Discussion
- Reach out to maintainers

## License

By contributing to CCS, you agree that your contributions will be licensed under the MIT License.