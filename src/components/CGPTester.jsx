import React, { useState } from 'react';
import '../styles/CGPTester.css';

// Test string examples with descriptions - simplified set
const testStrings = [
  // Valid examples
  {
    name: "Simple Valid CGP",
    value: "{2,1,1,2,2,2,4}([2]0,1,0)([3]0,1,1)(3)",
    description: "Basic CGP with 2 inputs, 1 output, 1 row, 2 columns",
    isValid: true
  },
  {
    name: "Multiple Outputs",
    value: "{3,2,2,2,2,2,4}([3]0,1,0)([4]0,2,1)([5]3,4,2)([6]3,5,3)(5,6)",
    description: "CGP with 2 outputs showing how to connect multiple outputs",
    isValid: true
  },
  {
    name: "Complex Circuit",
    value: "{5,1,5,5,2,5,4}([5]3,4,1)([6]3,3,1)([7]2,2,1)([8]4,3,2)([9]3,0,0)([10]5,0,2)([11]9,7,3)([12]8,1,2)([13]2,5,3)([14]8,1,1)([15]10,12,1)([16]14,0,2)([17]2,14,2)([18]13,12,1)([19]12,10,2)([20]0,15,0)([21]18,16,1)([22]17,15,1)([23]2,4,2)([24]15,0,0)([25]2,1,0)([26]21,0,2)([27]22,21,2)([28]4,2,3)([29]21,1,3)(27)",
    description: "Complex example showing advanced node connections",
    isValid: true
  },
  
  // ERROR EXAMPLES - one for each error type
  {
    name: "ERROR: Missing Configuration",
    value: "([2]0,1,0)([3]0,1,1)(3)",
    description: "Missing the configuration block {inputs,outputs,...}",
    isValid: false,
    errorDetail: "Missing configuration block."
  },
  {
    name: "ERROR: Incomplete Configuration",
    value: "{2,1,1,2,2}([2]0,1,0)([3]0,1,1)(3)",
    description: "Configuration has only 5 parameters instead of required 7",
    isValid: false,
    errorDetail: "Invalid configuration: Expected 7 parameters, found 5."
  },
  {
    name: "ERROR: Invalid Node Index",
    value: "{2,1,1,2,2,2,4}([4]0,1,0)([5]0,1,1)(5)",
    description: "Node indices must start at the number of inputs (2)",
    isValid: false,
    errorDetail: "Node index 4 out of range. Valid range is [2-5]."
  },
  {
    name: "ERROR: Invalid Function ID",
    value: "{2,1,1,2,2,2,3}([2]0,1,5)([3]0,1,1)(3)",
    description: "Function ID 5 is outside the range (must be < 3)",
    isValid: false,
    errorDetail: "Invalid function ID in node [2]."
  },
  {
    name: "ERROR: Missing Outputs",
    value: "{2,1,1,2,2,2,4}([2]0,1,0)([3]0,1,1)",
    description: "No output section at the end",
    isValid: false,
    errorDetail: "Missing output definition."
  },
  {
    name: "ERROR: Output Count Mismatch",
    value: "{2,2,1,2,2,2,4}([2]0,1,0)([3]0,1,1)(3)",
    description: "Config specifies 2 outputs but only 1 is defined",
    isValid: false,
    errorDetail: "Incorrect number of output nodes."
  },
  {
    name: "ERROR: L-Back Violation",
    value: "{2,1,1,4,2,2,3}([2]0,1,0)([3]0,1,1)([4]2,3,0)([5]3,2,2)(5)",
    description: "L-back=1 but node 5 tries to connect to node 2 across 2 columns",
    isValid: false,
    errorDetail: "L-back constraint violation in node [5]."
  },
  {
    name: "ERROR: Invalid Output Reference",
    value: "{2,1,1,2,2,2,4}([2]0,1,0)([3]0,1,1)(7)",
    description: "Output references node 7 which doesn't exist",
    isValid: false,
    errorDetail: "Invalid output node reference: 7."
  }
];

const CGPTester = () => {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000); // Reset after 2 seconds
  };

  return (
    <div className="cgp-tester">
      <h2>CGP Test Strings</h2>
      <p className="tester-description">
        Click the copy button next to any example to copy the CGP string to your clipboard,
        then paste it into the main input field.
      </p>
      
      <div className="test-categories">
        <h3>✅ Valid Examples</h3>
        <div className="test-strings-container">
          {testStrings
            .filter(test => test.isValid)
            .map((test, index) => (
              <div className="test-string-item" key={index}>
                <div className="test-string-header">
                  <h3>{test.name}</h3>
                  <button 
                    className={`copy-button ${copiedIndex === index ? 'copied' : ''}`}
                    onClick={() => copyToClipboard(test.value, index)}
                  >
                    {copiedIndex === index ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="test-string-description">{test.description}</p>
                <pre className="test-string-value">{test.value}</pre>
              </div>
            ))}
        </div>
        
        <h3 className="error-category-header">❌ Error Examples</h3>
        <p className="error-category-description">
          These examples contain intentional errors for learning and testing purposes.
        </p>
        <div className="test-strings-container">
          {testStrings
            .filter(test => !test.isValid)
            .map((test, index) => (
              <div className="test-string-item error-string-item" key={`error-${index}`}>
                <div className="test-string-header">
                  <h3>{test.name}</h3>
                  <button 
                    className={`copy-button ${copiedIndex === `error-${index}` ? 'copied' : ''}`}
                    onClick={() => copyToClipboard(test.value, `error-${index}`)}
                  >
                    {copiedIndex === `error-${index}` ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="test-string-description">{test.description}</p>
                <pre className="test-string-value error-value">{test.value}</pre>
                <div className="expected-error">
                  <strong>Expected Error:</strong> {test.errorDetail}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default CGPTester;