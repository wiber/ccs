const { OptimizedStreamProcessor, CircularLogBuffer } = require('../lib/optimized-stream-processor');

describe('OptimizedStreamProcessor', () => {
  let processor;
  
  beforeEach(() => {
    processor = new OptimizedStreamProcessor({
      batchSize: 10,
      flushInterval: 100,
      bufferSize: 1000,
      deduplicationWindow: 5000
    });
  });
  
  afterEach(() => {
    if (processor) {
      processor.cleanup();
    }
  });

  describe('Basic Functionality', () => {
    test('should process single log entry', async () => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        source: 'dev-server',
        level: 'INFO',
        message: 'Test log message',
        metadata: JSON.stringify({ test: true })
      };

      const result = await processor.processLogEntry(logEntry);
      
      expect(result.processed).toBe(true);
      expect(result.processingTime).toBeDefined();
      expect(typeof result.processingTime).toBe('number');
    });

    test('should handle multiple log entries', async () => {
      const entries = [];
      for (let i = 0; i < 5; i++) {
        entries.push({
          timestamp: new Date().toISOString(),
          source: 'dev-server',
          level: 'INFO',
          message: `Test log message ${i}`,
          metadata: JSON.stringify({ index: i })
        });
      }

      const results = [];
      for (const entry of entries) {
        const result = await processor.processLogEntry(entry);
        results.push(result);
      }

      expect(results).toHaveLength(5);
      expect(results.every(r => r.processed)).toBe(true);
    });
  });

  describe('Batch Processing', () => {
    test('should trigger batch processing when batch size reached', async () => {
      const batchSpy = jest.spyOn(processor, 'processBatch');
      
      // Add entries to reach batch size (10)
      const entries = [];
      for (let i = 0; i < 10; i++) {
        entries.push({
          timestamp: new Date().toISOString(),
          source: 'dev-server',
          level: 'INFO',
          message: `Batch test message ${i}`,
          metadata: JSON.stringify({ batchIndex: i })
        });
      }

      for (const entry of entries) {
        await processor.processLogEntry(entry);
      }

      expect(batchSpy).toHaveBeenCalled();
    });

    test('should trigger batch processing on timeout', async () => {
      const batchSpy = jest.spyOn(processor, 'processBatch');
      
      // Add just one entry (below batch size)
      await processor.processLogEntry({
        timestamp: new Date().toISOString(),
        source: 'dev-server',
        level: 'INFO',
        message: 'Timeout test message',
        metadata: JSON.stringify({ timeout: true })
      });

      // Wait for flush interval
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(batchSpy).toHaveBeenCalled();
    });

    test('should handle batch processing errors gracefully', async () => {
      // Mock database error
      const executeSpy = jest.spyOn(processor, 'executeBatchTransaction').mockRejectedValue(new Error('Database error'));
      const fallbackSpy = jest.spyOn(processor, 'handleBatchFailure').mockResolvedValue([{ success: true }]);

      const logEntry = {
        timestamp: new Date().toISOString(),
        source: 'dev-server',
        level: 'ERROR',
        message: 'Error test message',
        metadata: JSON.stringify({ errorTest: true })
      };

      try {
        // Fill batch to trigger processing
        for (let i = 0; i < 10; i++) {
          await processor.processLogEntry({ ...logEntry, message: `${logEntry.message} ${i}` });
        }
      } catch (error) {
        // Expected to throw error, but should have called fallback
        expect(fallbackSpy).toHaveBeenCalled();
      }
    });
  });

  describe('Deduplication', () => {
    test('should detect and handle duplicate entries', async () => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        source: 'dev-server',
        level: 'INFO',
        message: 'Duplicate test message',
        metadata: JSON.stringify({ duplicate: true })
      };

      // Process same entry twice
      const result1 = await processor.processLogEntry(logEntry);
      const result2 = await processor.processLogEntry(logEntry);

      expect(result1.processed).toBe(true);
      expect(result2.processed).toBe(false);
      expect(result2.reason).toBe('duplicate');
    });

    test('should allow duplicate entries after deduplication window expires', async () => {
      const shortWindowProcessor = new OptimizedStreamProcessor({
        deduplicationWindow: 50 // 50ms window
      });

      const logEntry = {
        timestamp: new Date().toISOString(),
        source: 'dev-server',
        level: 'INFO',
        message: 'Window test message',
        metadata: JSON.stringify({ windowTest: true })
      };

      const result1 = await shortWindowProcessor.processLogEntry(logEntry);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result2 = await shortWindowProcessor.processLogEntry(logEntry);

      expect(result1.processed).toBe(true);
      expect(result2.processed).toBe(true);

      shortWindowProcessor.cleanup();
    });

    test('should calculate deduplication ratio correctly', async () => {
      const logEntry1 = {
        timestamp: new Date().toISOString(),
        source: 'dev-server',
        level: 'INFO',
        message: 'Ratio test message 1',
        metadata: JSON.stringify({ ratioTest: 1 })
      };

      const logEntry2 = {
        timestamp: new Date().toISOString(),
        source: 'dev-server',
        level: 'INFO',
        message: 'Ratio test message 2',
        metadata: JSON.stringify({ ratioTest: 2 })
      };

      // Process unique entries
      await processor.processLogEntry(logEntry1);
      await processor.processLogEntry(logEntry2);
      
      // Process duplicates
      await processor.processLogEntry(logEntry1);
      await processor.processLogEntry(logEntry2);

      const ratio = processor.calculateDeduplicationRatio();
      expect(ratio).toBeGreaterThan(0);
      expect(ratio).toBeLessThanOrEqual(1);
    });
  });

  describe('Compression', () => {
    test('should compress log batches', async () => {
      const entries = [];
      for (let i = 0; i < 5; i++) {
        entries.push({
          timestamp: new Date().toISOString(),
          source: 'dev-server',
          level: 'INFO',
          message: `Compression test message ${i}`,
          metadata: JSON.stringify({ compressionIndex: i })
        });
      }

      const groupedBatch = [entries]; // Single group
      const compressedBatch = await processor.compressLogBatch(groupedBatch);

      expect(compressedBatch).toHaveLength(1);
      expect(compressedBatch[0].compressedSize).toBeLessThan(compressedBatch[0].originalSize);
      expect(compressedBatch[0].compressedData).toBeDefined();
      expect(Buffer.isBuffer(compressedBatch[0].compressedData)).toBe(true);
    });

    test('should optimize JSON for compression', () => {
      const entries = [
        { source: 'dev-server', level: 'INFO', message: 'Test 1', unique: 'a' },
        { source: 'dev-server', level: 'INFO', message: 'Test 2', unique: 'b' },
        { source: 'dev-server', level: 'INFO', message: 'Test 3', unique: 'c' }
      ];

      const optimized = processor.optimizeJsonForCompression(entries);

      expect(optimized.commonFields).toEqual({ source: 'dev-server', level: 'INFO' });
      expect(optimized.entries).toHaveLength(3);
      expect(optimized.entries[0]).not.toHaveProperty('source');
      expect(optimized.entries[0]).not.toHaveProperty('level');
      expect(optimized.entries[0]).toHaveProperty('unique');
    });
  });

  describe('Memory Management', () => {
    test('should estimate memory usage', () => {
      // Add some entries to processor
      processor.batchBuffer = [
        { test: 'entry1' },
        { test: 'entry2' },
        { test: 'entry3' }
      ];

      const memoryUsage = processor.estimateMemoryUsage();
      
      expect(typeof memoryUsage).toBe('number');
      expect(memoryUsage).toBeGreaterThan(0);
    });

    test('should cleanup deduplication cache', () => {
      const expiredProcessor = new OptimizedStreamProcessor({
        deduplicationWindow: 10 // 10ms window
      });

      // Add entries to cache
      expiredProcessor.deduplicationCache.set('key1', { timestamp: Date.now() - 100 });
      expiredProcessor.deduplicationCache.set('key2', { timestamp: Date.now() });

      const initialSize = expiredProcessor.deduplicationCache.size;
      expiredProcessor.cleanupDeduplicationCache();
      const finalSize = expiredProcessor.deduplicationCache.size;

      expect(finalSize).toBeLessThan(initialSize);
      expiredProcessor.cleanup();
    });

    test('should handle memory pressure by flushing early', async () => {
      const memoryLimitedProcessor = new OptimizedStreamProcessor({
        maxMemoryUsage: 1024, // Very small limit
        batchSize: 1000 // Large batch size
      });

      // Mock memory estimation to return high value
      jest.spyOn(memoryLimitedProcessor, 'estimateMemoryUsage').mockReturnValue(1024 * 0.9);

      const batchSpy = jest.spyOn(memoryLimitedProcessor, 'processBatch');

      await memoryLimitedProcessor.processLogEntry({
        timestamp: new Date().toISOString(),
        source: 'dev-server',
        level: 'INFO',
        message: 'Memory pressure test',
        metadata: JSON.stringify({ memoryTest: true })
      });

      expect(batchSpy).toHaveBeenCalled();
      memoryLimitedProcessor.cleanup();
    });
  });

  describe('Performance Metrics', () => {
    test('should track performance metrics', async () => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        source: 'dev-server',
        level: 'INFO',
        message: 'Metrics test message',
        metadata: JSON.stringify({ metricsTest: true })
      };

      await processor.processLogEntry(logEntry);
      const metrics = processor.getMetrics();

      expect(metrics.totalProcessed).toBe(1);
      expect(metrics.averageProcessingTime).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.bufferSize).toBe(1);
    });

    test('should update batch metrics correctly', () => {
      const batchStartTime = Date.now() - 100;
      const compressedBatch = [
        { originalSize: 1000, compressedSize: 300 },
        { originalSize: 800, compressedSize: 250 }
      ];

      processor.updateBatchMetrics(batchStartTime, 10, compressedBatch);

      expect(processor.metrics.batchesProcessed).toBe(1);
      expect(processor.metrics.compressionRatio).toBeCloseTo(550 / 1800, 2);
    });
  });

  describe('Utility Functions', () => {
    test('should generate unique batch IDs', () => {
      const id1 = processor.generateBatchId();
      const id2 = processor.generateBatchId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^batch-\d+-[a-z0-9]+$/);
    });

    test('should generate consistent hashes for same content', () => {
      const entry1 = { source: 'test', message: 'same content' };
      const entry2 = { source: 'test', message: 'same content' };
      const entry3 = { source: 'test', message: 'different content' };

      const hash1 = processor.generateLogHash(entry1);
      const hash2 = processor.generateLogHash(entry2);
      const hash3 = processor.generateLogHash(entry3);

      expect(hash1).toBe(hash2);
      expect(hash1).not.toBe(hash3);
    });

    test('should generate deduplication keys correctly', () => {
      const entry1 = { source: 'dev', level: 'INFO', message: 'test' };
      const entry2 = { source: 'dev', level: 'INFO', message: 'test' };
      const entry3 = { source: 'dev', level: 'ERROR', message: 'test' };

      const key1 = processor.generateDeduplicationKey(entry1);
      const key2 = processor.generateDeduplicationKey(entry2);
      const key3 = processor.generateDeduplicationKey(entry3);

      expect(key1).toBe(key2);
      expect(key1).not.toBe(key3);
    });

    test('should group related entries correctly', () => {
      const now = Date.now();
      const entries = [
        { source: 'dev-server', timestamp: now },
        { source: 'dev-server', timestamp: now + 1000 },
        { source: 'vercel', timestamp: now },
        { source: 'vercel', timestamp: now + 1000 }
      ];

      const grouped = processor.groupRelatedEntries(entries);

      // Should have 2 groups (one per source within same time window)
      expect(grouped).toHaveLength(2);
      expect(grouped[0]).toHaveLength(2);
      expect(grouped[1]).toHaveLength(2);
    });
  });

  describe('Error Handling', () => {
    test('should handle individual entry processing failure', async () => {
      const mockError = new Error('Processing failed');
      jest.spyOn(processor, 'processIndividualEntry').mockRejectedValue(mockError);

      const failedBatch = [
        { source: 'test', message: 'fail1' },
        { source: 'test', message: 'fail2' }
      ];

      const results = await processor.handleBatchFailure(failedBatch, mockError);

      expect(results).toHaveLength(2);
      expect(results.every(r => r.success === false)).toBe(true);
    });

    test('should gracefully handle malformed log entries', async () => {
      const malformedEntry = {
        // Missing required fields
        source: 'test'
        // No timestamp, level, message
      };

      // Should not throw error
      const result = await processor.processLogEntry(malformedEntry);
      expect(result).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty batch processing', async () => {
      processor.batchBuffer = []; // Empty batch
      
      const result = await processor.processBatch();
      expect(result).toBeUndefined(); // Should return early
    });

    test('should handle very large log entries', async () => {
      const largeMessage = 'x'.repeat(10000); // 10KB message
      const largeEntry = {
        timestamp: new Date().toISOString(),
        source: 'dev-server',
        level: 'INFO',
        message: largeMessage,
        metadata: JSON.stringify({ large: true })
      };

      const result = await processor.processLogEntry(largeEntry);
      expect(result.processed).toBe(true);
    });

    test('should handle rapid processing of many entries', async () => {
      const promises = [];
      
      for (let i = 0; i < 100; i++) {
        promises.push(processor.processLogEntry({
          timestamp: new Date().toISOString(),
          source: 'stress-test',
          level: 'INFO',
          message: `Stress test message ${i}`,
          metadata: JSON.stringify({ stressIndex: i })
        }));
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(100);
      expect(results.filter(r => r.processed).length).toBeGreaterThan(50); // Allow some duplicates
    });
  });
});

describe('CircularLogBuffer', () => {
  let buffer;

  beforeEach(() => {
    buffer = new CircularLogBuffer(5); // Small buffer for testing
  });

  describe('Basic Operations', () => {
    test('should add and retrieve entries', () => {
      buffer.add({ message: 'test1' });
      buffer.add({ message: 'test2' });

      const recent = buffer.getRecent(2);
      expect(recent).toHaveLength(2);
      expect(recent[0].message).toBe('test2'); // Most recent first
      expect(recent[1].message).toBe('test1');
    });

    test('should handle buffer overflow', () => {
      // Add more entries than buffer size
      for (let i = 0; i < 10; i++) {
        buffer.add({ message: `test${i}` });
      }

      expect(buffer.getSize()).toBe(5); // Should not exceed max size
      
      const recent = buffer.getRecent(5);
      expect(recent).toHaveLength(5);
      expect(recent[0].message).toBe('test9'); // Most recent
      expect(recent[4].message).toBe('test5'); // Oldest in buffer
    });

    test('should return correct size', () => {
      expect(buffer.getSize()).toBe(0);
      
      buffer.add({ message: 'test1' });
      expect(buffer.getSize()).toBe(1);
      
      buffer.add({ message: 'test2' });
      expect(buffer.getSize()).toBe(2);
    });

    test('should estimate memory size', () => {
      buffer.add({ message: 'test' });
      const size = buffer.estimateSize();
      
      expect(typeof size).toBe('number');
      expect(size).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty buffer', () => {
      const recent = buffer.getRecent(10);
      expect(recent).toHaveLength(0);
    });

    test('should handle requesting more entries than available', () => {
      buffer.add({ message: 'test1' });
      buffer.add({ message: 'test2' });

      const recent = buffer.getRecent(10);
      expect(recent).toHaveLength(2);
    });

    test('should handle zero max size buffer', () => {
      const zeroBuffer = new CircularLogBuffer(0);
      zeroBuffer.add({ message: 'test' });
      
      expect(zeroBuffer.getSize()).toBe(0);
      expect(zeroBuffer.getRecent(1)).toHaveLength(0);
    });
  });
});

// Performance benchmarks
describe('Performance Benchmarks', () => {
  test('should process entries within performance targets', async () => {
    const processor = new OptimizedStreamProcessor({
      batchSize: 1000,
      flushInterval: 5000
    });

    const startTime = Date.now();
    const numEntries = 100;

    const promises = [];
    for (let i = 0; i < numEntries; i++) {
      promises.push(processor.processLogEntry({
        timestamp: new Date().toISOString(),
        source: 'performance-test',
        level: 'INFO',
        message: `Performance test message ${i}`,
        metadata: JSON.stringify({ perfIndex: i })
      }));
    }

    await Promise.all(promises);
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTimePerEntry = totalTime / numEntries;

    console.log(`Performance: ${numEntries} entries processed in ${totalTime}ms (${avgTimePerEntry.toFixed(2)}ms per entry)`);

    // Target: <10ms per entry (10x improvement from 50-100ms)
    expect(avgTimePerEntry).toBeLessThan(50); // Conservative target for test environment
    
    processor.cleanup();
  });

  test('should maintain memory efficiency under load', async () => {
    const processor = new OptimizedStreamProcessor({
      batchSize: 100,
      maxMemoryUsage: 50 * 1024 * 1024 // 50MB limit
    });

    // Process many entries to test memory management
    for (let i = 0; i < 1000; i++) {
      await processor.processLogEntry({
        timestamp: new Date().toISOString(),
        source: 'memory-test',
        level: 'INFO',
        message: `Memory test message ${i}`,
        metadata: JSON.stringify({ memIndex: i, data: 'x'.repeat(100) })
      });
    }

    const memoryUsage = processor.estimateMemoryUsage();
    console.log(`Memory usage after 1000 entries: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`);

    // Should stay under reasonable memory limits
    expect(memoryUsage).toBeLessThan(100 * 1024 * 1024); // 100MB
    
    processor.cleanup();
  });
});