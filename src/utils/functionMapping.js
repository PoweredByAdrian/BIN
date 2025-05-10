// Configuration for CGP function types and descriptions

const functionTypes = {
  // Arithmetic operations
  0: { type: "ADD", description: "Addition (x + y)", category: "arithmetic" },
  1: { type: "SUB", description: "Subtraction (x - y)", category: "arithmetic" },
  2: { type: "MUL", description: "Multiplication (x * y)", category: "arithmetic" },
  3: { type: "DIV", description: "Protected Division (x / y)", category: "arithmetic" },
  4: { type: "SQRT", description: "Protected Square Root (√|x|)", category: "arithmetic" },
  
  // Trigonometric
  5: { type: "SIN", description: "Sine function (sin(x))", category: "trigonometric" },
  6: { type: "COS", description: "Cosine function (cos(x))", category: "trigonometric" },
  7: { type: "TAN", description: "Tangent function (tan(x))", category: "trigonometric" },
  
  // Logical operations
  8: { type: "AND", description: "Logical AND", category: "logical" },
  9: { type: "OR", description: "Logical OR", category: "logical" },
  10: { type: "XOR", description: "Logical XOR", category: "logical" },
  11: { type: "NOT", description: "Logical NOT", category: "logical" },
  
  // Comparison operations
  12: { type: "EQ", description: "Equal to (x == y)", category: "comparison" },
  13: { type: "GT", description: "Greater than (x > y)", category: "comparison" },
  14: { type: "LT", description: "Less than (x < y)", category: "comparison" },
  
  // Conditional operations
  15: { type: "IF", description: "If-then-else", category: "conditional" }
};

// Helper function to get function info by ID
export const getFunctionInfo = (functionId, customFunctions = {}) => {
  // Convert functionId to number if it's a string
  const funcId = typeof functionId === 'string' ? parseInt(functionId, 10) : functionId;
  
  // Check if we have a custom name for this function ID
  if (customFunctions && customFunctions[funcId] !== undefined) {
    // If we have a custom name, use it but keep the category and other info from the original
    const baseInfo = functionTypes[funcId] || { 
      description: "Custom function",
      category: "unknown" 
    };
    
    return {
      ...baseInfo,
      type: customFunctions[funcId] // Use the custom name
    };
  }
  
  // Return the default function info or a placeholder if not found
  return functionTypes[funcId] || { 
    type: `FUNC_${funcId}`, 
    description: "Unknown function", 
    category: "unknown" 
  };
};

export default functionTypes;