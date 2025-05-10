// src/utils/cgpParser.js

/**
 * Parses a CGP string representation into structured data.
 * @param {string} str - The CGP string to parse
 * @returns {object} - Parsed CGP data or error object
 */
export function parseCGPString(str) {
    console.log("--- Parsing Start ---");
    console.log("Input string:", str);
    if (typeof str !== 'string') return { error: "Input must be a string." };
    str = str.replace(/\s+/g, '');

    const configRegex = /\{([^}]+)\}/;
    // Regex to find node index and the *entire* content block after it
    // Captures: 1=index, 2=content (e.g., "in1,in2,funcId")
    const nodeOuterRegex = /\(\[(\d+)\]([^)]+)\)/g;
    const outputRegex = /\((\d+(?:,\d+)*)\)$/;

    const configMatch = str.match(configRegex);
    const outputMatch = str.match(outputRegex);

    // Parse Config
    if (!configMatch) return { error: "No config block {} found." };
    const configParams = configMatch[1].split(',').map(s => s.trim()).map(Number);
    if (configParams.some(isNaN)) return { error: "Config block has non-numeric values." };
    if (configParams.length < 5) return { error: `Config needs >= 5 params (in,out,rows,cols,arity), found ${configParams.length}.` };
    const config = {
        inputs: configParams[0], outputs: configParams[1], rows: configParams[2], cols: configParams[3],
        arity: configParams[4], lback: configParams.length > 5 ? configParams[5] : undefined,
        funcSetSize: configParams.length > 6 ? configParams[6] : undefined,
        startIndex: configParams[0]
    };
    if (config.inputs < 0 || config.outputs < 0 || config.rows <= 0 || config.cols <= 0 || config.arity < 2) { // Arity must be >= 2
         return { error: "Invalid config values (inputs/outputs>=0, rows/cols>0, arity>=2)." };
    }
    console.log("Parsed Config:", config);

    // Parse Node Definitions
    const nodeDefinitions = new Map();
    let nodeMatch;
    nodeOuterRegex.lastIndex = 0;
    while ((nodeMatch = nodeOuterRegex.exec(str)) !== null) {
        const index = parseInt(nodeMatch[1], 10);
        const contentString = nodeMatch[2]; // e.g., "0,1,0" or "5,3,2,1"

        const maxNodeIndex = config.startIndex + config.rows * config.cols - 1;
        if (index < config.startIndex || index > maxNodeIndex) {
            return { error: `Node index ${index} out of range [${config.startIndex}-${maxNodeIndex}].` };
        }
        if (nodeDefinitions.has(index)) { return { error: `Duplicate node index ${index}.` }; }

        const contentParts = contentString.split(',').map(s => s.trim()).map(Number);
        if (contentParts.some(isNaN)) {
             return { error: `Node [${index}] definition contains non-numeric values: "(${contentString})"` };
        }

        if (contentParts.length !== config.arity + 1) {
             return { error: `Node [${index}] definition expected exactly ${config.arity} inputs + 1 funcId (${config.arity + 1} parts), but found ${contentParts.length} in "(${contentString})"` };
        }

        // Extract inputs and function ID based on config.arity
        const inputs = contentParts.slice(0, config.arity); // First 'arity' elements are inputs
        const funcId = contentParts[config.arity];     // The last element is the function ID

        // Store definition (store inputs as an array)
        nodeDefinitions.set(index, {
             index: index,
             funcId: funcId,
             inputs: inputs // Store inputs as an array [in1, in2, ..., inN]
        });
    }
    console.log("Parsed Nodes (Variable Arity):", nodeDefinitions);

    // Parse Output Node(s)
    if (!outputMatch) return { error: "No output definition (...) found at end." };
    const outputNodeIndices = outputMatch[1].split(',').map(s => s.trim()).map(Number);
    if (outputNodeIndices.some(isNaN)) return { error: "Output definition has non-numeric values." };
    if (outputNodeIndices.length !== config.outputs) {
        return { error: `Config outputs=${config.outputs}, but found ${outputNodeIndices.length} in output def ().` };
    }
    for (const outIdx of outputNodeIndices) {
        const isValidInput = outIdx >= 0 && outIdx < config.inputs;
        const isValidDefinedNode = outIdx >= config.startIndex && nodeDefinitions.has(outIdx);
        if (!isValidInput && !isValidDefinedNode) {
            return { error: `Output index ${outIdx} invalid (not primary input or defined node).` };
        }
    }
    console.log("Parsed Outputs:", outputNodeIndices);
    console.log("--- Parsing End ---");
    return { config, nodeDefinitions, outputNodeIndices }; // Success
}