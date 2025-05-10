import { useState, useCallback } from 'react';

/**
 * Hook that manages path highlighting within a CGP graph.
 *
 * @param {object} parsedData - Parsed CGP data
 * @returns {object} - Object containing highlighting state and functions
 */
export function usePathHighlighting(parsedData) {
    const [highlightedPath, setHighlightedPath] = useState({ nodes: new Set(), edges: new Set() });

    const highlightPathFromNode = useCallback((nodeId) => {
        if (!parsedData) {
            setHighlightedPath({ nodes: new Set(), edges: new Set() });
            return;
        }

        const { nodeDefinitions, config, outputNodeIndices } = parsedData;
        
        // Initialize sets for highlighted nodes and edges
        const highlightedNodes = new Set();
        const highlightedEdges = new Set();
        
        // Fix the edge ID for output nodes
        if (nodeId.startsWith('output-')) {
            // Get output index
            const outputIndex = parseInt(nodeId.split('-')[1]);
            
            // Find the source node for this output
            const sourceNodeId = outputNodeIndices?.[outputIndex];
            
            if (sourceNodeId !== undefined) {
                // Add output node to highlighted nodes
                highlightedNodes.add(nodeId);
                
                // Add the source node
                highlightedNodes.add(String(sourceNodeId));
                
                // Add the edge from source to output with proper handle
                // Format: '27->output-0' or a format that matches your edge creation logic
                const edgeId = `${sourceNodeId}->${nodeId}`;
                highlightedEdges.add(edgeId);
                
                // Recursively trace inputs of the source node
                traceInputs(String(sourceNodeId));
            } else {
                // Just highlight the output node itself if no source found
                highlightedNodes.add(nodeId);
            }
            
            setHighlightedPath({ nodes: highlightedNodes, edges: highlightedEdges });
            return;
        }
        
        // Add the starting node to highlighted nodes
        highlightedNodes.add(nodeId);
        
        // For input nodes, just highlight the node itself
        if (nodeId.startsWith('input-') || parseInt(nodeId) < config.inputs) {
            setHighlightedPath({ nodes: highlightedNodes, edges: highlightedEdges });
            return;
        }
        
        // For computational nodes, recursively find all inputs
        function traceInputs(nodeId) {
            // Skip if we're looking at an input node (these are leaf nodes)
            if (nodeId.startsWith('input-') || parseInt(nodeId) < config.inputs) {
                highlightedNodes.add(nodeId);
                return;
            }
            
            // Find the node definition
            const nodeDef = nodeDefinitions.get(parseInt(nodeId));
            if (!nodeDef || !nodeDef.inputs) return;
            
            // Process each input of this node
            nodeDef.inputs.forEach((inputId, idx) => {
                const inputIdStr = String(inputId);
                
                // Check if this is an input node
                const isInputNode = inputIdStr.startsWith('input-') || parseInt(inputIdStr) < config.inputs;
                
                // Add the input node to highlighted nodes
                highlightedNodes.add(inputIdStr);
                
                // Add edge from input to this node
                // Format used by usePathHighlighting: "22->27"
                const simpleEdgeId = `${inputIdStr}->${nodeId}`;
                highlightedEdges.add(simpleEdgeId);
                
                // Recursively trace inputs of this node if not an input node
                if (!isInputNode) {
                    traceInputs(inputIdStr);
                }
            });
        }
        
        // Start the recursive trace from our starting node
        traceInputs(nodeId);
        
        setHighlightedPath({ nodes: highlightedNodes, edges: highlightedEdges });
    }, [parsedData]);
    
    const clearHighlight = useCallback(() => {
        setHighlightedPath({ nodes: new Set(), edges: new Set() });
    }, []);
    
    return {
        highlightedPath,
        highlightPathFromNode,
        clearHighlight
    };
}