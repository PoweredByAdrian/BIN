// src/components/Visualization/Visualization.jsx
import React, { useMemo, useEffect, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    MiniMap,
    ReactFlowProvider,
    Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import CgpNode from './Node';
import InputNode from './InputNode';
import OutputNode from './OutputNode';
import PropTypes from 'prop-types';

// Default config can be defined here or imported if shared
const visualConfigDefault = {
    nodeSize: 60,
    padding: 40, ioSpacing: 40, gridSpacing: 40,
    inputAreaWidth: 60, outputAreaWidth: 60, pointRadius: 4,
    minSvgWidth: 300, minSvgHeight: 150
};

function VisualizationInternal({
    activeNodes = new Set(),
    settings = { showNodeIndices: true, hideInactiveNodes: false, hideUndefinedNodes: false },
    rfNodes = [],
    rfEdges = [],
    onNodesChange,
    onEdgesChange,
    visualConfig = visualConfigDefault,
    parsedData,
    highlightedPath = { nodes: new Set(), edges: new Set() }, 
    onNodeMouseEnter,
    onNodeMouseLeave,
    onPaneMouseEnter,
    customNames = { inputs: {}, outputs: {} },
    activeNodesHighlightingEnabled = true,
    onToggleActiveNodesHighlighting
}) {
    // Memoize the nodeTypes object to prevent recreation on each render
    const nodeTypes = useMemo(() => ({
        'cgpNode': CgpNode,
        'input': InputNode,
        'output': OutputNode
    }), []);

    // Ensure highlightedPath is never null
    const safeHighlightedPath = highlightedPath || { nodes: new Set(), edges: new Set() };
    
    // Utility functions
    const edgeMatchesHighlightId = (edge, highlightId) => {
        // Parse the highlight ID
        const [source, target] = highlightId.split('->');
        
        // Case 1: Direct match (including special output edge format)
        if (edge.id === highlightId) {
            return true;
        }
        
        // Case 2: Source/target match for output edges
        if (target && target.startsWith('output-') && edge.target === target && edge.source === source) {
            return true;
        }
        
        // Case 3: Input node number to input-number conversion
        if (!isNaN(parseInt(source)) && parseInt(source) < 5) { // Assuming 5 inputs max
            const inputPrefix = `input-${source}`;
            if (edge.source === inputPrefix && edge.target === target) {
                return true;
            }
        }
        
        // Case 4: Edge formats with handle indices (edge-5-to-10-h0)
        if (edge.id && edge.id.startsWith('edge-')) {
            // Extract source and target from edge ID
            const match = edge.id.match(/edge-(.+)-to-(.+)-h\d+/);
            if (match) {
                const [, edgeSource, edgeTarget] = match;
                
                // Compare with highlight source/target
                if ((edgeSource === source || edgeSource === `input-${source}`) && 
                    edgeTarget === target) {
                    return true;
                }
            }
        }
        
        return false;
    };

    const normalizeNodeId = (id) => {
        // Handle null/undefined
        if (!id) return '';
        
        // Convert to string if it's not already
        const idStr = String(id);
        
        // If it's a number or already a numeric string (like "5"), return it
        if (!isNaN(parseInt(idStr))) {
            return String(parseInt(idStr));  // Return consistent string format
        }
        
        // If it starts with "input-", extract the number part
        if (idStr.startsWith('input-')) {
            return idStr.replace('input-', '');
        }
        
        // Handle edge IDs that contain the node number
        const edgeMatch = idStr.match(/edge-(\d+)-to-/);
        if (edgeMatch) {
            return edgeMatch[1]; // Return the extracted number
        }
        
        // For IDs like "node-5", extract the number
        const nodeMatch = idStr.match(/node-(\d+)/);
        if (nodeMatch) {
            return nodeMatch[1];
        }
        
        // For ReactFlow's IDs that might include a handle ID (like "5__handle-0")
        const handleMatch = idStr.match(/^(\d+)__/);
        if (handleMatch) {
            return handleMatch[1];
        }
        
        // Return the original ID if no normalization needed
        return idStr;
    };

    const isNodeActive = (nodeId) => {
        // Early exit for empty/invalid IDs
        if (!nodeId) return false;
        
        // Direct match
        if (activeNodes.has(nodeId)) return true;
        
        // Normalized match
        const normalizedId = normalizeNodeId(nodeId);
        if (activeNodes.has(normalizedId)) return true;
        
        // String vs number matching (common React issue)
        if (activeNodes.has(String(nodeId)) || activeNodes.has(Number(nodeId))) return true;
        if (activeNodes.has(String(normalizedId)) || activeNodes.has(Number(normalizedId))) return true;
        
        // Array.includes match for flexibility
        const activeNodesArray = Array.from(activeNodes);
        return activeNodesArray.includes(nodeId) || 
               activeNodesArray.includes(normalizedId) || 
               activeNodesArray.includes(String(nodeId)) ||
               activeNodesArray.includes(Number(nodeId));
    };

    // Filter Nodes based on hideInactiveNodes and hideUndefinedNodes settings
    const visibleNodes = useMemo(() => {
        return rfNodes.filter(node => {
            // Always keep built-in input/output types
            if (node.type === 'input' || node.type === 'output') return true;
            
            // For cgpNode, apply filters based on settings
            if (node.type === 'cgpNode') {
                const isDefined = node.data?.isDefined;
                const isActiveNode = node.data?.isActiveNode;
                
                // Hide undefined nodes if setting is enabled
                if (settings.hideUndefinedNodes && !isDefined) {
                    return false;
                }
                
                // Hide inactive defined nodes if setting is enabled
                if (settings.hideInactiveNodes && !isActiveNode) {
                    return false;
                }
                
                return true;
            }
            
            return true; // Default: show any other node types
        });
    }, [rfNodes, settings.hideInactiveNodes, settings.hideUndefinedNodes]);

    // Filter Edges based on visible nodes
    const visibleEdges = useMemo(() => {
        // Filter edges to only include those where both source and target nodes are visible
        const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
        return rfEdges.filter(edge => 
            visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target));
            
    }, [rfEdges, visibleNodes]);

    // Check for required handlers passed from the hook
    if (typeof onNodesChange !== 'function' || typeof onEdgesChange !== 'function') {
        return <div className="error-message-box">Error: Visualization setup incorrect.</div>;
    }

    // Add Highlight Info to Nodes - use safeHighlightedPath
    const nodesWithHighlightData = useMemo(() => {
        return visibleNodes.map(node => {
            const isHighlighted = 
                safeHighlightedPath.nodes.has(node.id) || 
                (activeNodesHighlightingEnabled && activeNodes.has(node.id));
                
            return {
                ...node,
                data: {
                    ...node.data,
                    settings: settings,
                    visualConfig: visualConfig,
                    isHighlighted: isHighlighted,
                    isActive: activeNodes.has(node.id), // Pass this separately for styling
                    activeNodesHighlightingEnabled: activeNodesHighlightingEnabled,
                    handleMouseEnter: () => onNodeMouseEnter?.(node.id),
                    handleMouseLeave: () => onNodeMouseLeave?.()
                }
            }; 
        });
    }, [visibleNodes, settings, visualConfig, safeHighlightedPath.nodes, 
        activeNodes, activeNodesHighlightingEnabled, onNodeMouseEnter, onNodeMouseLeave]);

    // Convert activeNodes set to array for more reliable dependency tracking
    const activeNodesArray = useMemo(() => Array.from(activeNodes), [activeNodes]);

    // Simplify the edge styling approach in useMemo
    const edgesWithHighlightData = useMemo(() => {
        return visibleEdges.map(edge => {
            // Check if this is an edge to an output
            const isOutputEdge = edge.target.startsWith('output-');
            
            // Check if this edge should be highlighted based on path highlighting
            const isHighlighted = Array.from(safeHighlightedPath.edges).some(highlightId => 
                edgeMatchesHighlightId(edge, highlightId)
            );
            
            // Check if source or target nodes are active
            const sourceIsActive = isNodeActive(edge.source);
            const targetIsActive = isNodeActive(edge.target);
            
            // Only highlight edge when:
            // 1. The TARGET node is active
            // 2. OR if the edge goes to an output AND the SOURCE is active
            const isActiveHighlighted = activeNodesHighlightingEnabled && 
                (targetIsActive || (isOutputEdge && sourceIsActive));
            
            // Build class names for CSS-based styling
            const classNames = [];
            
            // Standard edge classes
            if (isOutputEdge) classNames.push('output-edge');
            
            // Highlighted edge (from mouse hover) - ADD THIS AS FIRST CLASS FOR HIGHEST PRIORITY
            if (isHighlighted) classNames.unshift('mouse-highlighted-edge highlighted');
            
            // Active edge (from active node)
            if (isActiveHighlighted && !isHighlighted) classNames.push('active-highlighted-edge');
            
            // Add data attributes for targeting in CSS
            const dataAttributes = {};
            if (isHighlighted) {
                dataAttributes['data-highlighted'] = 'true';
            }
            if (isActiveHighlighted) {
                dataAttributes['data-active'] = 'true';
            }
            
            // Apply z-index styles directly to ensure highlighted edges appear above nodes
            const style = {};
            if (isHighlighted) {
                style.zIndex = 1000; // Very high z-index for highlighted edges
            }
            
            // Return edge with proper classes and data attributes
            return {
                ...edge,
                animated: isActiveHighlighted && !isHighlighted, // Only animate active edges
                className: classNames.join(' '),
                style, // Add style with z-index
                data: {
                    ...edge.data,
                    ...dataAttributes,
                    isHighlighted,
                    isActiveHighlighted
                }
            };
        });
    }, [visibleEdges, safeHighlightedPath.edges, activeNodesArray, activeNodesHighlightingEnabled]);

    const proOptions = { hideAttribution: true };

    const [reactflowInstance, setReactflowInstance] = useState(null);

    // Use CSS classes instead of inline styles for debugging in dev mode
    useEffect(() => {
        // Add an additional data attribute on the root element to indicate highlight mode
        const rootElement = document.getElementById('root');
        if (rootElement) {
            rootElement.setAttribute('data-highlighting-enabled', activeNodesHighlightingEnabled);
        }
    }, [activeNodesHighlightingEnabled]);

    return (
        <div className="visualization-container">
            {/* SVG Filter for Edge Highlighting */}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                    <filter id="highlightedEdgeGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feFlood floodColor="#ff6f00" result="flood" />
                        <feComposite in="flood" operator="in" in2="SourceGraphic" result="composite"/>
                        <feGaussianBlur in="composite" stdDeviation="3" result="blur"/>
                        <feOffset dx="0" dy="0" result="offset"/>
                        <feComposite in="SourceGraphic" in2="offset" operator="over"/>
                    </filter>
                    
                    <filter id="activeEdgeGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feFlood floodColor="#2ecc71" result="flood" />
                        <feComposite in="flood" operator="in" in2="SourceGraphic" result="composite"/>
                        <feGaussianBlur in="composite" stdDeviation="2" result="blur"/>
                        <feOffset dx="0" dy="0" result="offset"/>
                        <feComposite in="SourceGraphic" in2="offset" operator="over"/>
                    </filter>
                </defs>
            </svg>
            
            {/* Add the highlighting toggle button */}
            <div className="viz-controls">
                <button 
                    className={`highlight-toggle ${activeNodesHighlightingEnabled ? 'enabled' : 'disabled'}`}
                    onClick={onToggleActiveNodesHighlighting}
                    title={activeNodesHighlightingEnabled ? 
                        "Disable active nodes highlighting" : 
                        "Enable active nodes highlighting"}
                >
                    {activeNodesHighlightingEnabled ? 
                        "Active Nodes Highlight: ON" : 
                        "Active Nodes Highlight: OFF"}
                </button>
            </div>
            
            <ReactFlow
                nodes={nodesWithHighlightData}
                edges={edgesWithHighlightData}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ 
                    padding: 0.4,
                    duration: 300 
                }}
                nodesDraggable={true}
                nodesConnectable={false}
                elementsSelectable={true}
                onPaneMouseEnter={onPaneMouseEnter}
                proOptions={proOptions}
                onInit={setReactflowInstance}
            >
                <Background />
            </ReactFlow>
        </div>
    );
}

// Wrapper with Provider
function VisualizationWrapper(props) {
    return (<ReactFlowProvider><VisualizationInternal {...props} /></ReactFlowProvider>);
}

// Update your prop types
VisualizationWrapper.propTypes = {
    highlightingEnabled: PropTypes.bool,
    onToggleHighlighting: PropTypes.func
    // Other prop types...
};

export default VisualizationWrapper;