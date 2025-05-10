import { useState, useCallback, useMemo } from 'react';
import { applyNodeChanges, applyEdgeChanges, Position } from 'reactflow';
import { calculateInitialGridPositions } from '../utils/layoutUtils';

// Update the default visual configuration with significantly increased spacing
const visualConfigDefault = {
    nodeSize: 60,
    padding: 60,             // Increased from 40 to 60
    ioSpacing: 100,          // Increased from 80 to 100
    gridSpacing: 180,        // Increased from 120 to 180 to match auto align
    inputAreaWidth: 250,     // Increased from 150 to 250 to match auto align
    outputAreaWidth: 180,    // Increased from 150 to 180 to match auto align
    pointRadius: 4,
    minSvgWidth: 300, 
    minSvgHeight: 150
};

/**
 * Hook that generates React Flow nodes and edges from CGP data.
 * 
 * @param {object} parsedData - Parsed CGP data
 * @param {Set} activeNodes - Set of active node indices
 * @param {object} visualConfig - Configuration for visual presentation
 * @param {object} customNames - Custom names for input and output nodes
 * @returns {object} - Object containing React Flow nodes, edges, and handlers
 */
export function useReactFlowGraph(
    parsedData, 
    activeNodes, 
    visualConfig = visualConfigDefault,
    customNames = { inputs: {}, outputs: {} } // Default to empty if not provided
) {
    // Add state to store initial node positions
    const [initialNodePositions, setInitialNodePositions] = useState({});
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);

    const onNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        []
    );

    const onEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        []
    );

    // Generate nodes and edges from parsed data
    const { rfNodes, rfEdges } = useMemo(() => {
        if (!parsedData) return { rfNodes: [], rfEdges: [] };

        const { config, nodeDefinitions, outputNodeIndices, inputNames, outputNames } = parsedData;
        const newNodes = [];
        const newEdges = [];
        const initialPositions = calculateInitialGridPositions(parsedData, visualConfig);
        
        // Calculate layout parameters with consistently larger spacing
        const maxRows = config.rows;
        const inputNodeX = -(visualConfig.inputAreaWidth + visualConfig.gridSpacing * 6);  // Push inputs far left
        const estimatedGridWidth = config.cols * (visualConfig.nodeSize + visualConfig.gridSpacing * 2);
        const outputNodeX = estimatedGridWidth + visualConfig.gridSpacing;  
        const gridHeightEstimate = maxRows * (visualConfig.nodeSize + visualConfig.gridSpacing);
        const verticalCenter = gridHeightEstimate / 2;

        // Add Input Nodes with custom names if available
        for (let i = 0; i < config.inputs; i++) {
            // Calculate total height required for all input nodes with spacing
            const totalInputHeight = config.inputs * visualConfig.ioSpacing * 2;
            // Center point is halfway through the grid height
            const startY = verticalCenter - (totalInputHeight / 2) + visualConfig.ioSpacing;
            // Position each input with even spacing
            const y = startY + (i * visualConfig.ioSpacing * 2);
            
            // Use the provided name or default to "Input X"
            const inputLabel = customNames.inputs[i] || (inputNames && inputNames[i] ? inputNames[i] : `Input ${i}`);
            
            newNodes.push({
                id: `input-${i}`, 
                type: 'input', // This must match the key in nodeTypes
                data: { 
                    label: inputLabel,
                    style: { fontWeight: 'bold', fontSize: '14px' }  // Increased font size from 12px to 14px
                },
                position: { x: inputNodeX, y: y },
                sourcePosition: Position.Right,
                style: { 
                    width: 80,
                    fontSize: '14px',  // Also set font size at node level
                    fontWeight: 'bold'
                }
            });
        }

        // Grid Nodes - adjust spacing between columns and rows
        for (let r = 0; r < config.rows; r++) {
            for (let c = 0; c < config.cols; c++) {
                const nodeIndex = config.startIndex + c * config.rows + r;
                const isDefined = nodeDefinitions.has(nodeIndex);
                const nodeDef = isDefined ? nodeDefinitions.get(nodeIndex) : null;
                const isActiveNode = activeNodes.has(nodeIndex);
                
                // Adjust the position calculation with more spacing
                const position = initialPositions[nodeIndex] || { 
                    x: c * (visualConfig.nodeSize + visualConfig.gridSpacing * 2),  // More horizontal space
                    y: r * (visualConfig.nodeSize + visualConfig.gridSpacing * 2)        // More vertical space
                };
                
                newNodes.push({
                    id: String(nodeIndex), 
                    type: 'cgpNode', // This must match the key in nodeTypes
                    position: position ,
                    data: { 
                        nodeIndex, 
                        isDefined, 
                        isActiveNode, 
                        nodeDef, 
                        arity: config.arity,
                        nodeDelay: parsedData.nodeDelays ? parsedData.nodeDelays[nodeIndex] : undefined
                    }
                });
            }
        }

        // Add Output Nodes with custom names if available
        for (let i = 0; i < config.outputs; i++) {
            // Calculate total height required for all output nodes with spacing
            const totalOutputHeight = config.outputs * visualConfig.ioSpacing * 2;
            // Center point is halfway through the grid height
            const startY = verticalCenter - (totalOutputHeight / 2) + visualConfig.ioSpacing;
            // Position each output with even spacing
            const y = startY + (i * visualConfig.ioSpacing * 2);
            
            // Use the provided name or default to "Output X"
            const outputLabel = customNames.outputs[i] || (outputNames && outputNames[i] ? outputNames[i] : `Output ${i}`);
            
            newNodes.push({
                id: `output-${i}`, 
                type: 'output', // This must match the key in nodeTypes
                data: { 
                    label: outputLabel,
                    style: { fontWeight: 'bold', fontSize: '14px' }  // Increased font size from 12px to 14px
                },
                position: { x: outputNodeX, y: y },
                targetPosition: Position.Left,
                style: { 
                    width: 80,
                    fontSize: '14px',  // Also set font size at node level
                    fontWeight: 'bold'
                }
            });
        }

        // Create Edges for node connections
        if (nodeDefinitions) {
            nodeDefinitions.forEach(nodeDef => {
                const targetId = String(nodeDef.index);
                
                if (nodeDef.inputs && Array.isArray(nodeDef.inputs)) {
                    nodeDef.inputs.forEach((inputSourceId, inputIndex) => {
                        const sourceIdStr = (inputSourceId < config.startIndex) ? 
                            `input-${inputSourceId}` : String(inputSourceId);
                        const targetHandleId = `in${inputIndex}`;
                        
                        newEdges.push({
                            id: `edge-${sourceIdStr}-to-${targetId}-h${inputIndex}`,
                            source: sourceIdStr,
                            target: targetId,
                            targetHandle: targetHandleId,
                            type: 'smoothstep',
                        });
                    });
                }
            });
        }

        // Output Connections
        if (outputNodeIndices) {
            outputNodeIndices.forEach((sourceNodeId, markerIndex) => {
                const sourceId = (sourceNodeId < config.startIndex) ? 
                    `input-${sourceNodeId}` : String(sourceNodeId);
                const targetId = `output-${markerIndex}`;
                
                // When creating edges, ensure the ID format matches what's expected in highlighting
                newEdges.push({
                    id: `${sourceNodeId}->${targetId}`,  // This format must match what's used in highlighting
                    source: String(sourceNodeId),
                    target: String(targetId),
                    sourceHandle: 'out',
                    type: 'smoothstep',
                });
            });
        }

        console.log("Graph: Generated RF Nodes:", newNodes.length);
        console.log("Graph: Generated RF Edges:", newEdges.length);
        setNodes(newNodes);
        setEdges(newEdges);

        // Store initial positions when nodes are first created
        const positions = {};
        newNodes.forEach(node => {
            positions[node.id] = { x: node.position.x, y: node.position.y };
        });
        
        // Only update initial positions when parsedData changes
        // This prevents overwriting when nodes are just moved
        setInitialNodePositions(positions);
        
        return { rfNodes: newNodes, rfEdges: newEdges };
    }, [parsedData, activeNodes, visualConfig, customNames]);

    // Restore original node positions
    const resetNodePositions = useCallback(() => {
        const resetNodes = nodes.map(node => {
            if (initialNodePositions[node.id]) {
                return {
                    ...node,
                    position: initialNodePositions[node.id]
                };
            }
            return node;
        });
        
        setNodes(resetNodes);
        
        return resetNodes;
    }, [nodes, initialNodePositions]);

    // Auto align nodes based on delay with increased spacing
    const autoAlignByDelay = useCallback(() => {
        if (!parsedData || !parsedData.nodeDelays) return;
        
        const { nodeDelays } = parsedData;
        // Use larger spacing values
        const { gridSpacing, nodeSize, padding } = visualConfig;
        
        // Define enhanced spacing values for auto-alignment
        const enhancedSpacing = {
            horizontalSpacing: gridSpacing * 1.5,         // Match the default layout
            verticalSpacing: padding * 1.5,               // Slightly more vertical space than default
            inputOffset: visualConfig.inputAreaWidth * 1.2, // Match the default layout's input spacing
            outputOffset: visualConfig.outputAreaWidth * 1.2 // Match the default layout's output spacing
        };
        
        // Group nodes by delay
        const nodesByDelay = {};
        const inputNodes = [];
        const outputNodes = [];
        
        // Separate input, output, and regular nodes
        nodes.forEach(node => {
            if (node.id.startsWith('input-')) {
                inputNodes.push(node);
                return;
            }
            
            if (node.id.startsWith('output-')) {
                outputNodes.push(node);
                return;
            }
            
            const delay = nodeDelays[node.id] || 0;
            if (!nodesByDelay[delay]) {
                nodesByDelay[delay] = [];
            }
            nodesByDelay[delay].push(node);
        });
        
        // Sort nodes within each delay group vertically
        Object.values(nodesByDelay).forEach(group => {
            group.sort((a, b) => {
                const aYPos = a.position?.y || 0;
                const bYPos = b.position?.y || 0;
                return aYPos - bYPos;
            });
        });
        
        // Sort input and output nodes vertically
        inputNodes.sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0));
        outputNodes.sort((a, b) => (a.position?.y || 0) - (b.position?.y || 0));
        
        // Calculate max number of nodes in any delay group to center nodes vertically
        const maxNodesInColumn = Math.max(
            ...Object.values(nodesByDelay).map(group => group.length),
            inputNodes.length,
            outputNodes.length
        );
        
        // Find minimum delay for main grid positioning
        const delays = Object.keys(nodesByDelay).map(Number);
        const minDelay = delays.length > 0 ? Math.min(...delays) : 0;
        
        // Position nodes in columns based on delay
        const updatedNodes = [];
        
        // Process input nodes - position them MUCH further to the left of delay 0 column
        inputNodes.forEach((node, index) => {
            const verticalPadding = (maxNodesInColumn - inputNodes.length) * (nodeSize + enhancedSpacing.verticalSpacing) / 2;
            // Increased vertical spacing between input nodes
            const y = index * (nodeSize + enhancedSpacing.verticalSpacing) + verticalPadding + padding;
            
            // Position inputs MUCH further to the left of the first delay column
            // Add an additional fixed offset of -200 to push them even further left
            const x = minDelay * (nodeSize + enhancedSpacing.horizontalSpacing) - enhancedSpacing.inputOffset - 200;
            
            updatedNodes.push({
                ...node,
                position: { x, y }
            });
        });
        
        // Process regular nodes by delay with increased spacing
        Object.entries(nodesByDelay).forEach(([delay, group]) => {
            const delayNum = parseInt(delay);
            
            group.forEach((node, index) => {
                const verticalPadding = (maxNodesInColumn - group.length) * (nodeSize + enhancedSpacing.verticalSpacing) / 2;
                // Increased vertical spacing between nodes in the same column
                const y = index * (nodeSize + enhancedSpacing.verticalSpacing) + verticalPadding + padding;
                
                // Increased horizontal spacing between delay columns
                const x = delayNum * (nodeSize + enhancedSpacing.horizontalSpacing) + padding;
                
                updatedNodes.push({
                    ...node,
                    position: { x, y }
                });
            });
        });
        
        // Process output nodes - position them much further to the right
        const maxDelay = delays.length > 0 ? Math.max(...delays) : 0;
        outputNodes.forEach((node, index) => {
            const verticalPadding = (maxNodesInColumn - outputNodes.length) * (nodeSize + enhancedSpacing.verticalSpacing) / 2;
            // Increased vertical spacing between output nodes
            const y = index * (nodeSize + enhancedSpacing.verticalSpacing) + verticalPadding + padding;
            
            // Position outputs much further to the right of the last delay column
            const x = (maxDelay + 1) * (nodeSize + enhancedSpacing.horizontalSpacing) + enhancedSpacing.outputOffset;
            
            updatedNodes.push({
                ...node,
                position: { x, y }
            });
        });
        
        // Update nodes with new positions
        setNodes(updatedNodes);
        
        return updatedNodes;
    }, [parsedData, nodes, visualConfig]);

    return { rfNodes: nodes, rfEdges: edges, onNodesChange, onEdgesChange, resetNodePositions, autoAlignByDelay };
}