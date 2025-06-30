/**
 * Tests for Claude Launcher - Critical Requirement
 */

const ClaudeLauncher = require('../lib/claude-launcher');
const { spawn } = require('child_process');

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

describe('ClaudeLauncher', () => {
  let launcher;
  let mockSpawn;

  beforeEach(() => {
    launcher = new ClaudeLauncher();
    mockSpawn = {
      on: jest.fn(),
      stderr: { on: jest.fn() },
      stdout: { on: jest.fn() }
    };
    spawn.mockReturnValue(mockSpawn);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Core Launch Functionality', () => {
    test('should launch Claude with direct method', async () => {
      const promise = launcher.launch('Test prompt', {
        method: 'direct'
      });

      // Simulate successful launch
      const exitCallback = mockSpawn.on.mock.calls.find(call => call[0] === 'exit')[1];
      exitCallback(0);

      await promise;

      expect(spawn).toHaveBeenCalledWith(
        'claude',
        ['Test prompt'],
        expect.objectContaining({
          stdio: 'inherit',
          shell: true
        })
      );
    });

    test('should reject if Claude is not found', async () => {
      const promise = launcher.launch('Test prompt');

      // Simulate ENOENT error
      const errorCallback = mockSpawn.on.mock.calls.find(call => call[0] === 'error')[1];
      errorCallback({ code: 'ENOENT' });

      await expect(promise).rejects.toThrow();
    });

    test('should add questions to prompt when provided', async () => {
      const enhancedPrompt = launcher.addQuestionsAndCapabilities(
        'Base prompt',
        ['Question 1?', 'Question 2?'],
        []
      );

      expect(enhancedPrompt).toContain('Question 1?');
      expect(enhancedPrompt).toContain('Question 2?');
      expect(enhancedPrompt).toContain('Specific Questions Requiring Answers');
    });

    test('should add capabilities to prompt when provided', async () => {
      const enhancedPrompt = launcher.addQuestionsAndCapabilities(
        'Base prompt',
        [],
        ['Read files', 'Run tests']
      );

      expect(enhancedPrompt).toContain('Read files');
      expect(enhancedPrompt).toContain('Run tests');
      expect(enhancedPrompt).toContain('Your Capabilities for This Session');
    });
  });

  describe('Context Building', () => {
    test('should build context header when context provided', () => {
      const prompt = launcher.buildFullPrompt('Test prompt', {
        operation: 'test-op',
        enhanced: true
      });

      expect(prompt).toContain('Context Information');
      expect(prompt).toContain('Operation: test-op');
      expect(prompt).toContain('Enhanced: true');
    });

    test('should handle empty context gracefully', () => {
      const prompt = launcher.buildFullPrompt('Test prompt', {});
      expect(prompt).toBe('Test prompt');
    });
  });

  describe('Launch Methods', () => {
    test('should support pipe method for stdout', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await launcher.launch('Test prompt', {
        method: 'pipe'
      });

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test prompt'));
      consoleSpy.mockRestore();
    });

    test('should validate launch method', async () => {
      await expect(
        launcher.launch('Test prompt', { method: 'invalid' })
      ).rejects.toThrow('Unknown launch method');
    });
  });

  describe('Operation Prompts', () => {
    test('should create analysis prompt correctly', () => {
      const prompt = launcher.createAnalysisPrompt({
        context: { test: true },
        logs: 'Recent logs here',
        health: { status: 'healthy' }
      });

      expect(prompt).toContain('analyzing the ThetaDriven Coach system');
      expect(prompt).toContain('Recent logs here');
      expect(prompt).toContain('Available Commands');
    });

    test('should create voice prompt correctly', () => {
      const prompt = launcher.createVoicePrompt({
        overview: { system: 'voice' },
        patterns: { miltonian: true }
      });

      expect(prompt).toContain('Miltonian pattern expertise');
      expect(prompt).toContain('indirect suggestion');
    });

    test('should create business prompt correctly', () => {
      const prompt = launcher.createBusinessPrompt({
        metrics: { mrr: 10000 },
        priorities: ['Growth', 'Retention']
      });

      expect(prompt).toContain('business planning');
      expect(prompt).toContain('data-driven insights');
    });
  });

  describe('Validation', () => {
    test('should require prompt string', async () => {
      await expect(launcher.launch()).rejects.toThrow('valid prompt string');
      await expect(launcher.launch('')).rejects.toThrow('valid prompt string');
      await expect(launcher.launch(123)).rejects.toThrow('valid prompt string');
    });

    test('should validate Claude availability', async () => {
      const mockWhich = {
        on: jest.fn()
      };
      spawn.mockReturnValueOnce(mockWhich);

      const promise = launcher.validateClaudeAvailable();
      
      // Simulate 'which claude' success
      const closeCallback = mockWhich.on.mock.calls.find(call => call[0] === 'close')[1];
      closeCallback(0);

      const isAvailable = await promise;
      expect(isAvailable).toBe(true);
    });
  });
});