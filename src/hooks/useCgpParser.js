import { useState, useEffect, useMemo } from 'react';
import { parseCGPString } from '../utils/cgpParser';
import { findActiveNodes } from '../utils/cgpNodeAnalyzer';

/**
 * Hook that handles parsing CGP strings and identifying active nodes.
 * 
 * @param {string} cgpString - The CGP string to parse
 * @returns {object} - Object containing parsed data, errors, and active nodes
 */
export function useCgpParser(cgpString) {
    return useMemo(() => {
        try {
            if (!cgpString || cgpString.trim() === '') {
                return {
                    parsedData: null,
                    parseError: {
                        error: "CGP string is empty.",
                        detail: "Please enter a valid CGP string or upload a file."
                    },
                    activeNodes: new Set()
                };
            }
            
            // Process the string line by line
            const lines = cgpString.split('\n').filter(line => line.trim());
            
            // Extract input and output names if they exist
            const inputNames = [];
            const outputNames = [];
            
            let actualCgpString = null; // Will store the actual CGP string

            // Process special lines and extract input/output names
            for (const line of lines) {
                if (line.startsWith('#%i')) {
                    // Extract input names - format: #%i name1,name2,name3
                    const nameStr = line.substring(line.indexOf(' ') + 1).trim();
                    const names = nameStr.split(',').map(name => name.trim());
                    // Handle reversed indices - look for patterns like "i4,i3,i2,i1,i0"
                    const isReversed = names.length > 1 && names.some(n => /i\d+/.test(n)) && 
                        parseInt(names[0].match(/\d+/)?.[0] || '0') > 
                        parseInt(names[names.length-1].match(/\d+/)?.[0] || '0');
                    
                    if (isReversed) {
                        // If indices appear to be reversed, store them in reverse order
                        inputNames.push(...names.reverse());
                    } else {
                        inputNames.push(...names);
                    }
                } 
                else if (line.startsWith('#%o')) {
                    // Extract output names - format: #%o name1,name2,name3
                    const nameStr = line.substring(line.indexOf(' ') + 1).trim();
                    outputNames.push(...nameStr.split(',').map(name => name.trim()));
                }
                else if (!line.startsWith('#')) {
                    // First non-comment line is the actual CGP string
                    actualCgpString = line;
                    break;
                }
            }
            
            // Check if we found an actual CGP string
            if (!actualCgpString) {
                return {
                    parsedData: null,
                    parseError: {
                        error: "No valid CGP string found.",
                        detail: "Expected format: {inputs,outputs,rows,columns,arity,lback,funcSetSize}([nodeFunction,input1,input2,...])([outputMapping])"
                    },
                    activeNodes: new Set()
                };
            }

            // Parse the actual CGP string
            const result = parseCGPString(actualCgpString);
            
            // Check if parsing returned an error
            if (result.error) {
                return {
                    parsedData: null,
                    parseError: result, // Pass the complete error object with details
                    activeNodes: new Set()
                };
            }
            
            // Verify that parsing produced a valid result
            if (!result || !result.config) {
                return {
                    parsedData: null,
                    parseError: {
                        error: "Failed to parse CGP configuration.",
                        detail: "Please check the format of your CGP string."
                    },
                    activeNodes: new Set()
                };
            }
            
            // Validate that the i/o names match the parsed config
            if (inputNames.length > 0 || outputNames.length > 0) {
                // Both #%i and #%o should be present if either is used
                if (inputNames.length === 0) {
                    console.warn("Warning: Output names were provided but input names are missing.");
                }
                if (outputNames.length === 0) {
                    console.warn("Warning: Input names were provided but output names are missing.");
                }
                
                // Check if number of names matches the config
                if (inputNames.length > 0 && inputNames.length !== result.config.inputs) {
                    console.warn(`Warning: Number of input names (${inputNames.length}) doesn't match the CGP inputs count (${result.config.inputs}).`);
                    
                    // Adjust the input names array to match the config
                    if (inputNames.length < result.config.inputs) {
                        // Add generic names for missing inputs
                        for (let i = inputNames.length; i < result.config.inputs; i++) {
                            inputNames.push(`Input ${i}`);
                        }
                    } else {
                        // Truncate extra names
                        inputNames.splice(result.config.inputs);
                    }
                }
                
                if (outputNames.length > 0 && outputNames.length !== result.config.outputs) {
                    console.warn(`Warning: Number of output names (${outputNames.length}) doesn't match the CGP outputs count (${result.config.outputs}).`);
                    
                    // Adjust the output names array to match the config
                    if (outputNames.length < result.config.outputs) {
                        // Add generic names for missing outputs
                        for (let i = outputNames.length; i < result.config.outputs; i++) {
                            outputNames.push(`Output ${i}`);
                        }
                    } else {
                        // Truncate extra names
                        outputNames.splice(result.config.outputs);
                    }
                }
            }
            
            // Add extracted names to the parsed data
            result.inputNames = inputNames.length > 0 ? inputNames : Array(result.config.inputs).fill(null).map((_, i) => `Input ${i}`);
            result.outputNames = outputNames.length > 0 ? outputNames : Array(result.config.outputs).fill(null).map((_, i) => `Output ${i}`);
            
            const activeNodes = findActiveNodes(
                result.config, 
                result.nodeDefinitions, 
                result.outputNodeIndices
            );

            // Add a check before calculating delays
            const nodeDelays = result && result.nodeDefinitions ? 
                calculateNodeDelays(result) : {};
            
            return {
                parsedData: result ? {
                    ...result,
                    nodeDelays // Add delays to parsed data
                } : null,
                parseError: null,
                activeNodes
            };
            
        } catch (error) {
            console.error("Failed to parse CGP string:", error);
            return { 
                parsedData: null, 
                parseError: {
                    error: "Parsing error",
                    detail: error.message || "Unknown parsing error occurred."
                }, 
                activeNodes: new Set() 
            };
        }
    }, [cgpString]);
}

function calculateNodeDelays(parsedData) {
    if (!parsedData || !parsedData.nodeDefinitions) return {};
    
    const { config, nodeDefinitions, outputNodeIndices } = parsedData;
    const delays = {};
    
    // Input nodes have delay 0
    for (let i = 0; i < config.inputs; i++) {
        delays[i] = 0;
    }
    
    // Calculate delay for each computational node
    nodeDefinitions.forEach((nodeDef, nodeId) => {
        if (nodeId < config.inputs) {
            // Skip input nodes, already set to 0
            return;
        }
        getNodeDelay(String(nodeId), nodeDefinitions, delays, config.inputs);
    });
    
    // Calculate delay for output nodes: 1 + delay of source node
    if (outputNodeIndices) {
        outputNodeIndices.forEach((sourceNodeId, outputIndex) => {
            const outputKey = `output-${outputIndex}`;
            const sourceDelay = delays[sourceNodeId] || 0;
            delays[outputKey] = sourceDelay + 1; // Output delay is source delay + 1
        });
    }
    
    return delays;
}

function getNodeDelay(nodeId, nodeDefinitions, delays, inputCount) {
    // Return cached value if already calculated
    if (delays[nodeId] !== undefined) {
        return delays[nodeId];
    }
    
    const nodeDef = nodeDefinitions.get(parseInt(nodeId));
    if (!nodeDef || !nodeDef.inputs) return 0;
    
    // Get delays of all inputs
    const inputDelays = nodeDef.inputs.map(inputId => {
        // If input is an input node, it doesn't add delay
        if (inputId < inputCount) {
            return 0;
        }
        
        // For computational nodes, add 1 to their delay
        return getNodeDelay(String(inputId), nodeDefinitions, delays, inputCount) + 1;
    });
    
    // The delay is the maximum of input delays
    const maxDelay = inputDelays.length > 0 ? Math.max(...inputDelays) : 0;
    delays[nodeId] = maxDelay;
    
    return maxDelay;
}