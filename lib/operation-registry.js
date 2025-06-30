/**
 * Operation Registry - Manages operation definitions
 * 
 * Stores and validates operation sequences, handles operation discovery
 */
class OperationRegistry {
  constructor() {
    this.operations = new Map();
    this.validators = new Map();
  }

  /**
   * Register an operation
   */
  register(name, definition) {
    // Validate operation definition
    this.validateOperation(name, definition);
    
    this.operations.set(name, {
      name,
      ...definition,
      registeredAt: new Date().toISOString()
    });
  }

  /**
   * Get an operation
   */
  get(name) {
    return this.operations.get(name);
  }

  /**
   * List all operations
   */
  list() {
    return Array.from(this.operations.keys());
  }

  /**
   * Get operations by category/tag
   */
  getByCategory(category) {
    return Array.from(this.operations.values())
      .filter(op => op.category === category || op.tags?.includes(category));
  }

  /**
   * Validate operation definition
   */
  validateOperation(name, definition) {
    const errors = [];

    // Enhanced operations with operationClass don't require sequence
    if (definition.enhanced && definition.operationClass) {
      // Enhanced operations have different validation rules
      if (!definition.description) {
        errors.push('Enhanced operation must have a description');
      }
      // Skip sequence validation for enhanced operations
      return this.validateEnhancedOperation(name, definition, errors);
    }

    // Required fields for traditional sequence operations
    if (!definition.sequence || !Array.isArray(definition.sequence)) {
      errors.push('Operation must have a sequence array');
    }

    if (definition.sequence && definition.sequence.length === 0) {
      errors.push('Operation sequence cannot be empty');
    }

    // Validate sequence steps
    if (definition.sequence) {
      definition.sequence.forEach((step, index) => {
        if (!step.tool) {
          errors.push(`Step ${index + 1}: missing 'tool' property`);
        }
        
        if (step.params && typeof step.params !== 'object') {
          errors.push(`Step ${index + 1}: 'params' must be an object`);
        }
      });
    }

    // Validate outputs
    if (definition.outputs && !Array.isArray(definition.outputs)) {
      errors.push('outputs must be an array');
    }

    // Validate recovery strategies
    if (definition.recovery && typeof definition.recovery !== 'object') {
      errors.push('recovery must be an object');
    }

    if (errors.length > 0) {
      throw new Error(`Invalid operation '${name}':\n${errors.join('\n')}`);
    }
  }

  /**
   * Validate enhanced operation definition
   */
  validateEnhancedOperation(name, definition, errors) {
    // Validate operationClass
    if (typeof definition.operationClass !== 'function') {
      errors.push('Enhanced operation must have a valid operationClass constructor');
    }

    // Validate outputs if present
    if (definition.outputs && !Array.isArray(definition.outputs)) {
      errors.push('outputs must be an array');
    }

    if (errors.length > 0) {
      throw new Error(`Invalid enhanced operation '${name}':\n${errors.join('\n')}`);
    }
  }

  /**
   * Register a custom validator
   */
  registerValidator(operationName, validator) {
    this.validators.set(operationName, validator);
  }

  /**
   * Export operations to JSON
   */
  export() {
    const exported = {};
    for (const [name, operation] of this.operations) {
      exported[name] = operation;
    }
    return exported;
  }

  /**
   * Import operations from JSON
   */
  import(operationsData) {
    for (const [name, definition] of Object.entries(operationsData)) {
      try {
        this.register(name, definition);
      } catch (error) {
        console.warn(`⚠️  Could not import operation '${name}': ${error.message}`);
      }
    }
  }

  /**
   * Clear all operations
   */
  clear() {
    this.operations.clear();
    this.validators.clear();
  }

  /**
   * Get operation statistics
   */
  getStats() {
    const operations = Array.from(this.operations.values());
    
    return {
      total: operations.length,
      byCategory: this.groupBy(operations, op => op.category || 'uncategorized'),
      byComplexity: this.groupBy(operations, op => this.getComplexity(op)),
      toolUsage: this.getToolUsageStats(operations)
    };
  }

  /**
   * Get operation complexity (simple heuristic)
   */
  getComplexity(operation) {
    // Enhanced operations are considered complex by default
    if (operation.enhanced && operation.operationClass) {
      return 'enhanced';
    }
    
    const stepCount = operation.sequence ? operation.sequence.length : 0;
    if (stepCount <= 2) return 'simple';
    if (stepCount <= 5) return 'medium';
    return 'complex';
  }

  /**
   * Get tool usage statistics
   */
  getToolUsageStats(operations) {
    const toolCounts = {};
    
    operations.forEach(operation => {
      if (operation.sequence) {
        operation.sequence.forEach(step => {
          toolCounts[step.tool] = (toolCounts[step.tool] || 0) + 1;
        });
      } else if (operation.enhanced && operation.operationClass) {
        // Enhanced operations use their class name as a "tool"
        const className = operation.operationClass.name || 'enhanced-operation';
        toolCounts[className] = (toolCounts[className] || 0) + 1;
      }
    });

    return Object.entries(toolCounts)
      .sort(([,a], [,b]) => b - a)
      .reduce((acc, [tool, count]) => {
        acc[tool] = count;
        return acc;
      }, {});
  }

  /**
   * Utility method for grouping
   */
  groupBy(array, keyFunction) {
    return array.reduce((groups, item) => {
      const key = keyFunction(item);
      groups[key] = groups[key] || [];
      groups[key].push(item);
      return groups;
    }, {});
  }

  /**
   * Find operations that use a specific tool
   */
  findOperationsUsingTool(toolName) {
    return Array.from(this.operations.values())
      .filter(operation => {
        if (operation.sequence) {
          return operation.sequence.some(step => step.tool === toolName);
        } else if (operation.enhanced && operation.operationClass) {
          return operation.operationClass.name === toolName;
        }
        return false;
      });
  }

  /**
   * Suggest similar operations
   */
  suggestSimilar(operationName) {
    const operation = this.get(operationName);
    if (!operation) return [];

    const allOperations = Array.from(this.operations.values());
    
    return allOperations
      .filter(op => op.name !== operationName)
      .map(op => ({
        name: op.name,
        similarity: this.calculateSimilarity(operation, op)
      }))
      .filter(result => result.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);
  }

  /**
   * Calculate similarity between operations (simple heuristic)
   */
  calculateSimilarity(op1, op2) {
    // Handle enhanced operations
    const getTools = (op) => {
      if (op.sequence) {
        return new Set(op.sequence.map(s => s.tool));
      } else if (op.enhanced && op.operationClass) {
        return new Set([op.operationClass.name]);
      }
      return new Set();
    };
    
    const tools1 = getTools(op1);
    const tools2 = getTools(op2);
    
    const intersection = new Set([...tools1].filter(x => tools2.has(x)));
    const union = new Set([...tools1, ...tools2]);
    
    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }
}

module.exports = OperationRegistry;