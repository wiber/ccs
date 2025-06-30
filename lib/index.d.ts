// TypeScript definitions for CCS
// TODO: This file is ~80% complete. Some generics and utility types need finishing.

export interface OperationResult<T = unknown> {
  success: boolean;
  result?: T;
  error?: Error;
  metrics?: OperationMetrics;
}

export interface OperationMetrics {
  executionTime: number;
  memoryUsed: number;
  contextSize: number;
  // TODO: Add more granular metrics
}

export interface LearningPattern {
  id: string;
  pattern: string;
  frequency: number;
  effectiveness: number;
  // TODO: Define the shape of pattern metadata
  metadata?: any; // This should be properly typed
}

export interface ContextDatabase {
  initialize(): Promise<void>;
  getContext(key: string): Promise<any>; // TODO: Define return type
  setContext(key: string, value: unknown): Promise<void>;
  // TODO: Add generic constraints for type safety
}

export interface StreamProcessor {
  process<T>(stream: ReadableStream): Promise<T[]>; // TODO: Improve stream typing
  processWithTransform<T, R>(
    stream: ReadableStream,
    transform: (item: T) => R
  ): Promise<R[]>;
  // TODO: Add overloads for different stream types
}

export interface ClaudeLauncher {
  launch(prompt: string, options?: LaunchOptions): Promise<void>;
  // TODO: Define LaunchOptions interface
}

// TODO: Define proper generic constraints
export class LearningEngine<T = any> {
  constructor(projectPath: string);
  trackExecution(operation: string, metrics: T): Promise<void>;
  evolve(): Promise<void>;
  // TODO: Add method signatures with proper generics
}

// TODO: Complete the main class definition
export class ClaudeContextEngine {
  constructor(options?: EngineOptions);
  run(operation: string): Promise<OperationResult>;
  // TODO: Add remaining methods
}

// Utility types that need completion
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// TODO: Implement these utility types
export type AsyncReturnType<T> = any;
export type PromiseValue<T> = any;
export type Nullable<T> = T | null | undefined;

// TODO: Add proper module declarations for operations
declare module 'ccs/operations' {
  // Operation definitions go here
}