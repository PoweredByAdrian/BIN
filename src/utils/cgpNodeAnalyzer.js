// src/utils/cgpNodeAnalyzer.js

/**
 * Finds active nodes in a CGP circuit.
 * Active nodes are those that participate in the calculation of outputs.
 * 
 * @param {object} config - The CGP configuration object
 * @param {Map} nodeDefinitions - Map of node definitions
 * @param {Array} outputNodeIndices - Array of output node indices
 * @returns {Set} - Set of active node indices
 */
export function findActiveNodes(config, nodeDefinitions, outputNodeIndices) {
    if (!config || !nodeDefinitions || !outputNodeIndices || outputNodeIndices.length === 0) {
        return new Set();
    }
    const active = new Set();
    const toProcess = [];
    const visited = new Set();

    // Start with the output nodes
    outputNodeIndices.forEach(nodeIdx => {
        if (nodeIdx >= config.startIndex) {  // Only process if it's a circuit node (not an input)
            if (!visited.has(nodeIdx)) {
                visited.add(nodeIdx);
                toProcess.push(nodeIdx);
            }
        }
    });

    // Process all nodes in the path back from outputs
    while (toProcess.length > 0) {
        const currentIndex = toProcess.pop();
        if (currentIndex >= config.startIndex && nodeDefinitions.has(currentIndex)) {
            active.add(currentIndex);
        }
        const nodeDef = nodeDefinitions.get(currentIndex);

        if (nodeDef && nodeDef.inputs) { // Check if nodeDef and inputs array exist
            // Iterate over the actual inputs array from the definition
            const inputsToTrace = nodeDef.inputs;

            for (const inputIndex of inputsToTrace) {
                if (inputIndex >= config.inputs && nodeDefinitions.has(inputIndex) && !visited.has(inputIndex)) {
                    visited.add(inputIndex);
                    toProcess.push(inputIndex);
                } else if (inputIndex >= config.inputs && !nodeDefinitions.has(inputIndex)){
                     console.warn(`Node ${currentIndex} connects to undefined node index ${inputIndex}`);
                }
            }
        }
    }
    console.log("Active Node Indices Calculated:", active);
    return active;
}

/**
 * Optional: Additional node analysis functions could go here
 */