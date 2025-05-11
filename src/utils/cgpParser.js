// src/utils/cgpParser.js

/**
 * Parses a CGP string representation into structured data.
 * @param {string} str - The CGP string to parse
 * @returns {object} - Parsed CGP data or error object
 */
export function parseCGPString(str) {
    console.log("--- Parsing Start ---");
    console.log("Input string:", str);
    
    // Basic input validation
    if (typeof str !== 'string') {
        return { 
            error: "Invalid input: Must be a string.",
            detail: `Received value of type '${typeof str}' instead.`
        };
    }
    
    // Normalize string (remove whitespace)
    str = str.replace(/\s+/g, '');
    if (str.length === 0) {
        return { 
            error: "Empty CGP string.",
            detail: "Please enter a valid CGP string with configuration, nodes and output definitions."
        };
    }

    // Regex for parsing different sections
    const configRegex = /\{([^}]+)\}/;
    const nodeOuterRegex = /\(\[(\d+)\]([^)]+)\)/g;
    const outputRegex = /\((\d+(?:,\d+)*)\)$/;

    // Parse Config Block
    const configMatch = str.match(configRegex);
    if (!configMatch) {
        return { 
            error: "Missing configuration block.",
            detail: "Configuration must be defined in the format: {inputs,outputs,rows,columns,arity,lback,funcSetSize}"
        };
    }
    
    // Parse config parameters
    const configParams = configMatch[1].split(',').map(s => s.trim()).map(Number);
    if (configParams.some(isNaN)) {
        return { 
            error: "Configuration block contains non-numeric values.",
            detail: `Expected 7 numbers but found: ${configMatch[1]}`
        };
    }
    
    // Enforce exactly 7 parameters
    if (configParams.length !== 7) {
        return { 
            error: `Invalid configuration: Expected 7 parameters, found ${configParams.length}.`,
            detail: "Required format: {inputs,outputs,rows,cols,arity,lback,funcSetSize}"
        };
    }
    
    const config = {
        inputs: configParams[0], 
        outputs: configParams[1], 
        rows: configParams[2], 
        cols: configParams[3],
        arity: configParams[4], 
        lback: configParams[5],
        funcSetSize: configParams[6],
        startIndex: configParams[0]
    };
    
    // Validate config parameters with detailed messages
    if (config.inputs < 0) {
        return { 
            error: "Invalid number of inputs.",
            detail: `Value must be >= 0, but found: ${config.inputs}`
        };
    }
    
    if (config.outputs <= 0) {
        return { 
            error: "Invalid number of outputs.",
            detail: `Value must be > 0, but found: ${config.outputs}`
        };
    }
    
    if (config.rows <= 0) {
        return { 
            error: "Invalid number of rows.",
            detail: `Value must be > 0, but found: ${config.rows}`
        };
    }
    
    if (config.cols <= 0) {
        return { 
            error: "Invalid number of columns.",
            detail: `Value must be > 0, but found: ${config.cols}`
        };
    }
    
    if (config.arity < 2) {
        return { 
            error: "Invalid arity value.",
            detail: `Arity must be >= 2, but found: ${config.arity}`
        };
    }
    
    if (config.lback <= 0) {
        return { 
            error: "Invalid L-back parameter.",
            detail: `L-back must be > 0, but found: ${config.lback}`
        };
    }
    
    if (config.funcSetSize <= 0) {
        return { 
            error: "Invalid function set size.",
            detail: `Function set size must be > 0, but found: ${config.funcSetSize}`
        };
    }
    
    console.log("Parsed Config:", config);

    // Parse Node Definitions
    const nodeDefinitions = new Map();
    const maxNodeIndex = config.startIndex + config.rows * config.cols - 1;
    let nodeIndex = -1; // Track highest node index for helpful error messages
    
    let nodeMatch;
    nodeOuterRegex.lastIndex = 0;
    while ((nodeMatch = nodeOuterRegex.exec(str)) !== null) {
        const index = parseInt(nodeMatch[1], 10);
        nodeIndex = Math.max(nodeIndex, index);
        const contentString = nodeMatch[2]; // e.g., "0,1,0" or "5,3,2,1"

        if (index < config.startIndex || index > maxNodeIndex) {
            return { 
                error: `Node index ${index} out of range.`,
                detail: `Valid range is [${config.startIndex}-${maxNodeIndex}]. Check your node indices.`
            };
        }
        
        if (nodeDefinitions.has(index)) { 
            return { 
                error: `Duplicate node definition.`,
                detail: `Node index [${index}] is defined multiple times.`
            }; 
        }

        const contentParts = contentString.split(',').map(s => s.trim()).map(Number);
        if (contentParts.some(isNaN)) {
            return { 
                error: `Invalid node [${index}] definition.`,
                detail: `Node contains non-numeric values: "(${contentString})". All values must be integers.`
            };
        }

        if (contentParts.length !== config.arity + 1) {
            return { 
                error: `Incorrect number of parameters for node [${index}].`,
                detail: `Expected ${config.arity} inputs + 1 function ID (${config.arity + 1} values), but found ${contentParts.length}.`
            };
        }

        // Validate function ID against funcSetSize
        const funcId = contentParts[config.arity];
        if (funcId < 0 || funcId >= config.funcSetSize) {
            return { 
                error: `Invalid function ID in node [${index}].`,
                detail: `Function ID ${funcId} is out of range [0-${config.funcSetSize-1}].`
            };
        }

        // Extract inputs and function ID based on config.arity
        const inputs = contentParts.slice(0, config.arity); // First 'arity' elements are inputs
        
        // Validate inputs against L-back constraint
        for (let i = 0; i < inputs.length; i++) {
            const inputIdx = inputs[i];
            // Check if input is a primary input
            const isPrimaryInput = inputIdx >= 0 && inputIdx < config.inputs;
            if (isPrimaryInput) continue;
            
            // Check if input is a node and respects L-back
            if (inputIdx < config.startIndex || inputIdx >= index) {
                return { 
                    error: `Invalid connection in node [${index}].`,
                    detail: `Input ${i+1} references invalid node ${inputIdx}. Nodes can only connect to input nodes (0-${config.inputs-1}) or previous nodes.`
                };
            }
            
            const inputColumn = Math.floor((inputIdx - config.startIndex) / config.rows);
            const nodeColumn = Math.floor((index - config.startIndex) / config.rows);
            const columnDistance = nodeColumn - inputColumn;
            
            if (columnDistance > config.lback) {
                return { 
                    error: `L-back constraint violation in node [${index}].`,
                    detail: `Input ${i+1} (node ${inputIdx}) is ${columnDistance} columns back, but L-back is limited to ${config.lback}.`
                };
            }
        }

        // Store definition
        nodeDefinitions.set(index, {
            index: index,
            funcId: funcId,
            inputs: inputs
        });
    }
    
    // Check if nodes were found
    if (nodeDefinitions.size === 0) {
        return { 
            error: "No node definitions found.",
            detail: "CGP string must include node definitions in the format: ([nodeId]func,in1,in2,...)"
        };
    }
    
    console.log("Parsed Nodes:", nodeDefinitions);

    // Parse Output Nodes
    const outputMatch = str.match(outputRegex);
    if (!outputMatch) {
        return { 
            error: "Missing output definition.",
            detail: "CGP string must end with output node references in the format: (node1,node2,...)"
        };
    }
    
    const outputNodeIndices = outputMatch[1].split(',').map(s => s.trim()).map(Number);
    if (outputNodeIndices.some(isNaN)) {
        return { 
            error: "Invalid output definition.",
            detail: `Output section contains non-numeric values: "${outputMatch[1]}"`
        };
    }
    
    if (outputNodeIndices.length !== config.outputs) {
        return { 
            error: `Incorrect number of output nodes.`,
            detail: `Configuration specifies ${config.outputs} outputs, but ${outputNodeIndices.length} were provided.`
        };
    }
    
    for (const outIdx of outputNodeIndices) {
        const isValidInput = outIdx >= 0 && outIdx < config.inputs;
        const isValidDefinedNode = outIdx >= config.startIndex && nodeDefinitions.has(outIdx);
        
        if (!isValidInput && !isValidDefinedNode) {
            return { 
                error: `Invalid output node reference: ${outIdx}.`,
                detail: `Output must reference a primary input (0-${config.inputs-1}) or a defined node (${config.startIndex}-${nodeIndex}).`
            };
        }
    }
    
    console.log("Parsed Outputs:", outputNodeIndices);
    console.log("--- Parsing End ---");
    
    // Success - return the parsed data
    return { config, nodeDefinitions, outputNodeIndices };
}