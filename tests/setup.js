// Test setup file
const fs = require('fs').promises;

// Suppress console output during tests unless explicitly needed
const originalConsole = global.console;

beforeEach(() => {
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: originalConsole.error, // Keep errors visible
  };
});

afterEach(() => {
  global.console = originalConsole;
});

// Extend timeout for file system operations
jest.setTimeout(10000);

// Fix Node.js deprecation warning for fs.rmdir
global.cleanupDirectory = async (dirPath) => {
  try {
    await fs.rm(dirPath, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors
  }
};