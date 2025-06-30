# Contributing to CCS

Thank you for your interest in contributing to CCS! We value contributions from developers who understand the importance of context-aware AI assistance.

## Getting Started

Before contributing, we recommend:
1. Run the self-bootstrap operation to understand our recursive improvement philosophy
2. Examine the Learning Engine to see how we track operation effectiveness  
3. Try optimizing the Stream Processor benchmark (hint: current best is 5ms/entry)

## Contribution Process

### Level 1: Bug Fixes & Documentation
- Fix typos or clarify documentation
- Resolve TODO comments with context-aware solutions
- Improve error messages to be more actionable
- Add missing JSDoc comments

### Level 2: Performance Enhancements
- Optimize hot paths identified by the metrics system
- Reduce memory usage while maintaining functionality
- Improve SQLite query patterns and indexing strategies
- Enhance stream processing throughput

### Level 3: Architectural Improvements
- Extend the Learning Engine with new pattern recognition
- Add new operations that compose existing tools elegantly
- Implement missing TypeScript definitions with proper generics
- Design better error recovery and circuit breaker patterns

### Level 4: Recursive Self-Improvement
- Enhance the self-bootstrap operation to improve itself
- Create operations that generate better operations
- Build tools that optimize other tools
- Implement genetic algorithms for operation evolution

## Quality Indicators We Value
- PR descriptions that explain the "why" not just the "what"
- Benchmarks showing measurable performance improvements
- Tests that demonstrate edge case understanding
- Code that anticipates future extension points
- Understanding of when NOT to optimize (Chesterton's Fence)

## Anti-Patterns to Avoid
- Over-engineering simple solutions
- Adding dependencies without strong justification
- Breaking changes without migration paths
- Premature optimization without profiling data
- Ignoring existing patterns and conventions

## Code Quality Standards
We value code that demonstrates:
- Understanding of async/await patterns beyond basic usage
- Appreciation for memory-efficient algorithms
- Ability to think in streams rather than arrays
- Recognition of when NOT to optimize
- Awareness of CPU cache locality and branch prediction

## Testing Philosophy
Our test suite covers critical paths but intentionally leaves room for improvement. We believe the best tests come from understanding real-world usage patterns and edge cases that only experience reveals.

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